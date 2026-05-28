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

// Helper to determine the "previous class" relative to the user's current class for recap fallbacks
const getPreviousClass = (userClass: string): string => {
    if (userClass.includes('12')) return 'Class 11';
    if (userClass.includes('11')) return 'Class 10';
    if (userClass.includes('10')) return 'Class 9';
    if (userClass.includes('9')) return 'Class 8';
    return 'Class 8';
};

// Helper to get chapters matching user's class and subject (Dropper-aware)
const getChaptersForUser = (userClass: string, targetExam: string, subject: string): SyllabusTopic[] => {
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

// Helper to filter chapters for a specific class (for Recap fallback)
const getChaptersForClassAndSubject = (classLabel: string, subject: string): SyllabusTopic[] => {
    const chapters = SYLLABUS_DB[subject] || [];
    const cleanClass = classLabel.replace(/th/gi, '').trim(); // e.g. "Class 11"
    return chapters.filter(c => c.class.replace(/th/gi, '').trim() === cleanClass);
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
            if (unwatched.length > 0) {
                return unwatched[0].video;
            }
            return scored[0].video;
        }

        // 2. YouTube Search API Fallback with strict mathematical scoring
        let searchQuery = '';
        if (type === 'quick_revision') {
            searchQuery = `${chapter.topic} ${targetExam} ${chapter.class} quick revision recap lecture`;
        } else if (type === 'oneshot') {
            searchQuery = `${chapter.topic} ${targetExam} ${chapter.class} full chapter complete one shot`;
        } else if (type === 'topic_wise' && subtopic) {
            searchQuery = `${subtopic} ${chapter.topic} ${targetExam} ${chapter.class} detailed explanation lecture`;
        } else {
            searchQuery = `${chapter.topic} ${targetExam} ${chapter.class} complete lecture`;
        }

        console.log(`[RecommendationService] D1 Cache Miss. Searching YouTube API: "${searchQuery}"`);
        const playlist = await getVideoByTopicIdCached(searchQuery, targetExam, userId, userClass, forceRefresh);
        
        if (playlist && playlist.videos.length > 0) {
            const scored = scoreVideos(playlist.videos, userId, chapter.id, subtopic, userClass, targetExam, weakTopicsPool);
            const unwatched = scored.filter(sv => !isVideoFinished(sv.video.id, userId, userClass, targetExam));
            if (unwatched.length > 0) {
                return unwatched[0].video;
            }
            return scored[0].video;
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
        const cacheKey = `exam_compass_recommended_videos_v6_${userId}_${userClass.replace(/\s+/g, '_')}_${targetExam.replace(/\s+/g, '_')}`;
        
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

        // ─── VIDEO 1: RECAP / REVISION ───
        let recapChapter: SyllabusTopic | null = null;
        let recapSubject = '';
        let recapReason = '';
        
        if (masteredChapters.length > 0) {
            const chosen = masteredChapters[Math.floor(Math.random() * masteredChapters.length)];
            recapChapter = chosen.chapter;
            recapSubject = chosen.subject;
            recapReason = `Revision: Recap of completed ${recapChapter.topic}`;
        } else {
            const prevClass = getPreviousClass(userClass);
            let prevClassChapters: { chapter: SyllabusTopic, subject: string }[] = [];
            for (const subject of subjects) {
                const chapters = getChaptersForClassAndSubject(prevClass, subject);
                chapters.forEach(c => {
                    prevClassChapters.push({ chapter: c, subject });
                });
            }
            
            if (prevClassChapters.length > 0) {
                const highWeight = prevClassChapters.filter(c => c.chapter.weightage === 'High');
                const pool = highWeight.length > 0 ? highWeight : prevClassChapters;
                const chosen = pool[Math.floor(Math.random() * pool.length)];
                recapChapter = chosen.chapter;
                recapSubject = chosen.subject;
                recapReason = `Revision: Reviewing ${recapChapter.class} ${recapChapter.topic}`;
            }
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
                // Core backup if quick revision is missing
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
                reason: recapReason || 'Summary / Recap of completed chapter',
                generatedAt: Date.now()
            });
            activeVideoIds.add(video1.id);
        }

        // ─── VIDEO 2: ONGOING CORE / DETAILED ───
        let ongoingChapter1 = ongoingChapters[0]?.chapter || null;
        let ongoingSubject1 = ongoingChapters[0]?.subject || 'Physics';
        
        if (!ongoingChapter1) {
            const targetClassChapters = getChaptersForUser(userClass, targetExam, 'Physics');
            ongoingChapter1 = targetClassChapters[0] || null;
        }

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
                reason: `Detailed Explanation: Ongoing chapter ${ongoingChapter1?.topic}`,
                generatedAt: Date.now()
            });
            activeVideoIds.add(video2.id);
        }

        // ─── VIDEO 3: ONGOING SPECIFIC TOPIC ───
        let ongoingChapter2 = ongoingChapters[1]?.chapter || ongoingChapters[0]?.chapter || null;
        let ongoingSubject2 = ongoingChapters[1]?.subject || ongoingChapters[0]?.subject || 'Chemistry';
        
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
            // General detailed explanation backup
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
                reason: subtopicText ? `Specific Topic: ${subtopicText}` : `Topic of ongoing chapter ${ongoingChapter2?.topic}`,
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
        if (k.startsWith(`exam_compass_recommended_videos_v6_${userId}`)) {
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
