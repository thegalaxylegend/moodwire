import { SYLLABUS_DB, type SyllabusTopic } from '../lib/constants';
import { SubtopicProgressService, type ChapterProgress } from './subtopicProgressService';
import { getLibraryForChapter } from './videoLibraryService';
import { scoreVideos } from './videoScoringEngine';
import { getVideoByTopicIdCached, type Video } from './videoService';
import { isVideoFinished } from './videoProgressService';

export interface ActiveRecommendation {
    video: Video;
    topic: string;
    reason: string;
    generatedAt: number;
}

// Helper to get chapters matching user's class and subject (Dropper-aware)
const getChaptersForUser = (userClass: string, _targetExam: string, subject: string): SyllabusTopic[] => {
    let chapters = SYLLABUS_DB[subject] || [];
    const isDropper = userClass.toLowerCase().includes('dropper');

    if (isDropper) {
        // Droppers show both Class 11 and Class 12, Class 11 first
        chapters = chapters.filter(t => t.class === 'Class 11' || t.class === 'Class 12');
        chapters = [...chapters].sort((a, b) => {
            if (a.class === b.class) return 0;
            return a.class === 'Class 11' ? -1 : 1;
        });
    } else {
        const classNum = userClass.includes('12') ? 'Class 12' :
                         userClass.includes('11') ? 'Class 11' :
                         userClass.includes('10') ? 'Class 10' :
                         userClass.includes('9')  ? 'Class 9'  :
                         userClass.includes('8')  ? 'Class 8'  : 'Class 11';
        chapters = chapters.filter(t => t.class === classNum);
    }
    return chapters;
};

// Helper to get active subjects based on target exam and class
const getSubjectsForUser = (userClass: string, targetExam: string): string[] => {
    const exam = targetExam.toLowerCase();
    if (exam.includes('neet')) return ['Physics', 'Chemistry', 'Biology'];
    if (exam.includes('jee')) return ['Physics', 'Chemistry', 'Mathematics'];
    if (['class 8th', 'class 9th', 'class 10th'].some(c => userClass.toLowerCase().includes(c.replace('th', '').toLowerCase()))) {
        return ['Mathematics', 'Physics', 'Chemistry'];
    }
    return ['Physics', 'Chemistry', 'Mathematics'];
};

// Helper to find the ongoing chapter of a subject timeline (first uncompleted chapter)
const getOngoingChapter = (
    chapters: SyllabusTopic[],
    progressMap: Record<string, ChapterProgress>
): SyllabusTopic | null => {
    for (const chapter of chapters) {
        const p = progressMap[chapter.id];
        const isMastered = p && (p.state === 'mastered' || p.masteryScore >= 80);
        if (!isMastered) {
            return chapter;
        }
    }
    return chapters[chapters.length - 1] || null; // If all completed, return last one
};

// Unified video fetcher querying D1 first, then falling back to YouTube with mathematical scoring
const fetchVideoForRecommendation = async (
    chapter: SyllabusTopic,
    subject: string,
    type: 'oneshot' | 'quick_revision' | 'topic_wise',
    targetExam: string,
    userId: string,
    userClass: string,
    subtopic: string | null = null,
    forceRefresh: boolean = false
): Promise<Video | null> => {
    try {
        const { getWeakTopics } = await import('./topicStrengthService');
        const weakTopicsPool = await getWeakTopics(userId, 10, userClass, targetExam);

        // 1. Query local cache / D1 DB first
        const libraryVideos = await getLibraryForChapter(chapter.id, targetExam, subject, chapter.class, forceRefresh);
        
        let filteredVideos = libraryVideos;
        if (type === 'quick_revision') {
            filteredVideos = libraryVideos.filter(v => v.type === 'quick_revision');
        } else if (type === 'oneshot') {
            filteredVideos = libraryVideos.filter(v => v.type === 'oneshot' || v.type === 'detailed');
        } else if (type === 'topic_wise' && subtopic) {
            filteredVideos = libraryVideos.filter(v => {
                if (v.type === 'topic_wise') return true;
                const title = v.title.toLowerCase();
                const sub = subtopic.toLowerCase();
                return title.includes(sub) || sub.split(' ').filter(w => w.length > 3).some(w => title.includes(w));
            });
        }

        if (filteredVideos.length > 0) {
            const scored = scoreVideos(filteredVideos, userId, chapter.id, subtopic, userClass, targetExam, weakTopicsPool);
            const unwatched = scored.filter(sv => !isVideoFinished(sv.video.id, userId, userClass, targetExam));
            const pool = unwatched.length > 0 ? unwatched : scored;
            const selectPool = pool.slice(0, 3);
            const chosen = selectPool[Math.floor(Math.random() * selectPool.length)];
            return chosen.video;
        }

        // 2. YouTube Search API Fallback with strict mathematical scoring
        let searchQuery = '';
        if (type === 'quick_revision') {
            searchQuery = `"one shot" "${chapter.topic}" ${targetExam} ${chapter.class} revision quick recap`;
        } else if (type === 'oneshot') {
            searchQuery = `"${chapter.topic}" ${targetExam} ${chapter.class} detailed full chapter complete lecture one shot`;
        } else if (type === 'topic_wise' && subtopic) {
            searchQuery = `"${subtopic}" ${chapter.topic} ${targetExam} ${chapter.class} topic explanation lecture`;
        } else {
            searchQuery = `"${chapter.topic}" ${targetExam} ${chapter.class} complete lecture`;
        }

        console.log(`[RecommendationService] D1 Cache Miss. Searching YouTube API: "${searchQuery}"`);
        const playlist = await getVideoByTopicIdCached(searchQuery, targetExam, userId, userClass, forceRefresh);
        
        if (playlist && playlist.videos.length > 0) {
            const scored = scoreVideos(playlist.videos, userId, chapter.id, subtopic, userClass, targetExam, weakTopicsPool);
            const unwatched = scored.filter(sv => !isVideoFinished(sv.video.id, userId, userClass, targetExam));
            const pool = unwatched.length > 0 ? unwatched : scored;
            const selectPool = pool.slice(0, 3);
            const chosen = selectPool[Math.floor(Math.random() * selectPool.length)];
            return chosen.video;
        }

        // 3. FINAL FALLBACK: Reuse the D1 library already fetched at step 1 (no type filter).
        // libraryVideos may be empty if D1 has no data yet — in that case we accept null.
        // This avoids a redundant second D1 call for the same chapter.
        console.warn(`[RecommendationService] YouTube API exhausted. Falling back to any D1 video for: ${chapter.topic}`);
        if (libraryVideos.length > 0) {
            const scored = scoreVideos(libraryVideos, userId, chapter.id, null, userClass, targetExam, weakTopicsPool);
            const pool = scored.filter(sv => !isVideoFinished(sv.video.id, userId, userClass, targetExam));
            const finalPool = pool.length > 0 ? pool : scored;
            const chosen = finalPool[Math.floor(Math.random() * Math.min(3, finalPool.length))];
            console.log(`[RecommendationService] ✅ D1 Fallback found: ${chosen.video.title}`);
            return chosen.video;
        }
    } catch (e) {
        console.error(`[RecommendationService] Fetch error for ${chapter.topic} (${type}):`, e);
    }
    return null;
};


export const getRecommendedVideos = async (
    userId: string,
    userClass: string = 'Class 12th',
    targetExam: string = 'JEE',
    forceRefresh: boolean = false
): Promise<ActiveRecommendation[]> => {
    try {
        const cacheKey = `exam_compass_recommended_videos_v7_${userId}_${userClass.replace(/\s+/g, '_')}_${targetExam.replace(/\s+/g, '_')}`;
        
        if (forceRefresh) {
            console.log('[RecommendationService] Force Refresh: invalidating all caches...');
            clearActiveRecommendation(userId);
        }

        // 1. Check Local Cache
        if (!forceRefresh) {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const cached: { recommendations: ActiveRecommendation[], timestamp: number } = JSON.parse(cachedRaw);
                const twentyFourHours = 24 * 60 * 60 * 1000;
                const isExpired = Date.now() - cached.timestamp > twentyFourHours;
                const anyFinished = cached.recommendations.some(r => isVideoFinished(r.video.id, userId, userClass, targetExam));
                
                if (!isExpired && !anyFinished) {
                    console.log('[RecommendationService] Returning cached recommendations');
                    return cached.recommendations;
                }
            }
        }

        console.log('[RecommendationService] Invalidation / Force Refresh: Re-calculating recommendations...');
        
        const subjects = getSubjectsForUser(userClass, targetExam);
        const progressMap = SubtopicProgressService.getAllProgress(userId);
        
        const ongoingChapters: { chapter: SyllabusTopic, subject: string }[] = [];
        const masteredChapters: { chapter: SyllabusTopic, subject: string }[] = [];
        
        for (const subject of subjects) {
            const chapters = getChaptersForUser(userClass, targetExam, subject);
            const ongoing = getOngoingChapter(chapters, progressMap);
            if (ongoing) {
                ongoingChapters.push({ chapter: ongoing, subject });
            }
            
            chapters.forEach(c => {
                const p = progressMap[c.id];
                if (p && (p.state === 'mastered' || p.masteryScore >= 80)) {
                    masteredChapters.push({ chapter: c, subject });
                }
            });
        }

        const recommendations: ActiveRecommendation[] = [];
        const activeVideoIds = new Set<string>();

        // Determine the primary ongoing chapter (Physics first, then by subjects order)
        let primaryOngoingChapter: SyllabusTopic | null = ongoingChapters[0]?.chapter || null;
        const primaryOngoingSubject = ongoingChapters[0]?.subject || subjects[0] || 'Physics';
        if (!primaryOngoingChapter) {
            const fallbackChapters = getChaptersForUser(userClass, targetExam, subjects[0] || 'Physics');
            primaryOngoingChapter = fallbackChapters[0] || null;
        }

        // ─── VIDEO 1: RECAP / REVISION ───
        // For users with mastered chapters → recap a finished chapter
        // For NEW users (no mastered chapters) → quick revision of their CURRENT ongoing chapter
        let recapChapter: SyllabusTopic | null = null;
        let recapSubject = '';
        let recapReason = '';

        if (masteredChapters.length > 0) {
            // Pick a random recently-mastered chapter for spaced revision
            const chosen = masteredChapters[Math.floor(Math.random() * masteredChapters.length)];
            recapChapter = chosen.chapter;
            recapSubject = chosen.subject;
            recapReason = `✅ Revision: Recap of completed ${recapChapter.topic}`;
        } else if (primaryOngoingChapter) {
            // NEW USER: Slot 1 = quick recap/introduction of the current ongoing chapter
            recapChapter = primaryOngoingChapter;
            recapSubject = primaryOngoingSubject;
            recapReason = `🎯 Quick Intro: Get started with ${recapChapter.topic}`;
        }

        let video1: Video | null = null;
        if (recapChapter) {
            video1 = await fetchVideoForRecommendation(
                recapChapter,
                recapSubject,
                'quick_revision',
                targetExam,
                userId,
                userClass,
                null,
                forceRefresh
            );

            if (!video1) {
                // Backup: use oneshot if quick revision unavailable
                video1 = await fetchVideoForRecommendation(
                    recapChapter,
                    recapSubject,
                    'oneshot',
                    targetExam,
                    userId,
                    userClass,
                    null,
                    forceRefresh
                );
            }
        }

        if (video1) {
            recommendations.push({
                video: video1,
                topic: recapChapter?.topic || 'Physics',
                reason: recapReason || 'Summary / Recap',
                generatedAt: Date.now()
            });
            activeVideoIds.add(video1.id);
        }

        // ─── VIDEO 2: ONGOING CORE / DETAILED (long one-shot of current chapter) ───
        const ongoingChapter1 = primaryOngoingChapter;
        const ongoingSubject1 = primaryOngoingSubject;

        let video2: Video | null = null;
        if (ongoingChapter1) {
            video2 = await fetchVideoForRecommendation(
                ongoingChapter1,
                ongoingSubject1,
                'oneshot',
                targetExam,
                userId,
                userClass,
                null,
                forceRefresh
            );
        }

        if (video2 && !activeVideoIds.has(video2.id)) {
            recommendations.push({
                video: video2,
                topic: ongoingChapter1?.topic || 'Physics',
                reason: `📚 Full Chapter: ${ongoingChapter1?.topic}`,
                generatedAt: Date.now()
            });
            activeVideoIds.add(video2.id);
        }

        // ─── VIDEO 3: SUBTOPIC-SPECIFIC of the same or next-subject ongoing chapter ───
        // Prefer 2nd subject's ongoing chapter for variety; if same chapter then pick next subtopic
        let ongoingChapter2 = ongoingChapters[1]?.chapter || ongoingChapters[0]?.chapter || null;
        let ongoingSubject2 = ongoingChapters[1]?.subject || ongoingChapters[0]?.subject || subjects[1] || 'Chemistry';

        if (!ongoingChapter2 && ongoingChapter1) {
            ongoingChapter2 = ongoingChapter1;
            ongoingSubject2 = ongoingSubject1;
        }

        let video3: Video | null = null;
        let subtopicText = '';
        if (ongoingChapter2) {
            const p = progressMap[ongoingChapter2.id];
            const checked = p?.checkedSubtopics || [];
            const subtopics = ongoingChapter2.subtopics || [];
            // Pick the first uncompleted subtopic, or the first one for new users
            const firstUncompleted = subtopics.find(s => !checked.includes(s)) || subtopics[0] || null;

            if (firstUncompleted) {
                subtopicText = firstUncompleted;
                video3 = await fetchVideoForRecommendation(
                    ongoingChapter2,
                    ongoingSubject2,
                    'topic_wise',
                    targetExam,
                    userId,
                    userClass,
                    firstUncompleted,
                    forceRefresh
                );
            }
        }

        if (!video3 && ongoingChapter2) {
            // Backup: another video of the same ongoing chapter
            video3 = await fetchVideoForRecommendation(
                ongoingChapter2,
                ongoingSubject2,
                'oneshot',
                targetExam,
                userId,
                userClass,
                null,
                forceRefresh
            );
        }

        if (video3 && !activeVideoIds.has(video3.id)) {
            recommendations.push({
                video: video3,
                topic: ongoingChapter2?.topic || 'Chemistry',
                reason: subtopicText ? `🔬 Topic Focus: ${subtopicText}` : `📖 Chapter Study: ${ongoingChapter2?.topic}`,
                generatedAt: Date.now()
            });
            activeVideoIds.add(video3.id);
        }

        // Fill remaining gaps to keep exactly 3 recommendations
        if (recommendations.length < 3) {
            for (const subject of subjects) {
                if (recommendations.length >= 3) break;
                const chapters = getChaptersForUser(userClass, targetExam, subject);
                if (chapters.length > 0) {
                    const fallbackCh = chapters[0];
                    const fallbackVideo = await fetchVideoForRecommendation(
                        fallbackCh,
                        subject,
                        'oneshot',
                        targetExam,
                        userId,
                        userClass,
                        null,
                        false
                    );
                    if (fallbackVideo && !activeVideoIds.has(fallbackVideo.id)) {
                        recommendations.push({
                            video: fallbackVideo,
                            topic: fallbackCh.topic,
                            reason: `Suggested Core: ${fallbackCh.topic}`,
                            generatedAt: Date.now()
                        });
                        activeVideoIds.add(fallbackVideo.id);
                    }
                }
            }
        }

        // Save Cache
        if (recommendations.length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify({
                recommendations,
                timestamp: Date.now()
            }));
        }

        return recommendations;

    } catch (e) {
        console.error('[RecommendationService] Error in getRecommendedVideos:', e);
        return [];
    }
};

export const clearActiveRecommendation = (userId: string) => {
    // Clear both individual legacy and new array caches
    localStorage.removeItem(`exam_compass_active_recommendation_${userId}`);
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
        if (
            k.startsWith(`exam_compass_recommended_videos_v6_${userId}`) ||
            k.startsWith(`exam_compass_recommended_videos_v7_${userId}`) ||
            k.startsWith('vid_cache_v5_')
        ) {
            localStorage.removeItem(k);
        }
    });
};

export const getActiveRecommendation = async (
    userId: string,
    userClass: string = 'Class 12th',
    targetExam: string = 'JEE',
    forceRefresh: boolean = false
): Promise<ActiveRecommendation | null> => {
    try {
        const recs = await getRecommendedVideos(userId, userClass, targetExam, forceRefresh);
        if (recs && recs.length > 0) {
            // Video 2 is the core ongoing chapter lecture
            const core = recs.find(r => r.reason.startsWith('Detailed Explanation') || r.reason.startsWith('Suggested Core'));
            return core || recs[1] || recs[0];
        }
    } catch (e) {
        console.error('[RecommendationService] Error in getActiveRecommendation:', e);
    }
    return null;
};
