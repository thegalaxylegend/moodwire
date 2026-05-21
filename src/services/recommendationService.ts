import { getWeakTopics } from './topicStrengthService';
import { getVideoByTopicIdCached, type Video } from './videoService';
import { isVideoFinished, isVideoExpiredFinished } from './videoProgressService';

export interface ActiveRecommendation {
    video: Video;
    topic: string;
    reason: string;
    generatedAt: number;
}

const STORAGE_KEY = 'exam_compass_active_recommendation';

export const getActiveRecommendation = async (
    userId: string,
    userClass?: string,
    targetExam?: string,
    forceRefresh: boolean = false
): Promise<ActiveRecommendation | null> => {
    try {
        // 1. Check existing recommendation in LocalStorage (Only if not force refreshing)
        if (!forceRefresh) {
            const cachedRaw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
            if (cachedRaw) {
                const cached: ActiveRecommendation = JSON.parse(cachedRaw);

                const twentyFourHours = 24 * 60 * 60 * 1000;
                const isTimeExpired = Date.now() - cached.generatedAt > twentyFourHours;
                const isFinished = isVideoFinished(cached.video.id, userId, userClass, targetExam);

                // Check if it's expired (finished > 24h ago) OR if it's been 24h and not finished (rotation)
                if (isVideoExpiredFinished(cached.video.id, userId, userClass, targetExam) || (isTimeExpired && !isFinished)) {
                    console.log('[RecommendationService] Active video expired (finished or timed out). Clearing.');
                    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
                    // Proceed to generate new one
                } else {
                    return cached;
                }
            }
        } else {
            console.log('[RecommendationService] Force Refresh: Ignoring cache.');
            localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
        }

        // 2. Generate NEW Recommendation
        console.log('[RecommendationService] Generating new recommendation...');

        // A. Get Weakest Topic
        // If force refreshing, get more topics to pick from
        const weakTopics = await getWeakTopics(userId, forceRefresh ? 10 : 1, userClass, targetExam);
        let targetTopic = '';
        let reason = '';

        if (weakTopics.length > 0) {
            // Pick a random one from the pool if refreshing
            const idx = forceRefresh ? Math.floor(Math.random() * weakTopics.length) : 0;
            targetTopic = weakTopics[idx].topic;
            reason = forceRefresh ? `Targeted Review (${weakTopics[idx].score_percentage}%)` : `Weakest Topic (${weakTopics[idx].score_percentage}%)`;
        } else {
            // Fallback: Random subject rotation
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
            const subjects = isJunior ? ['Mathematics', 'Science', 'Social Science', 'English'] : ['Physics', 'Chemistry', 'Math'];
            targetTopic = subjects[Math.floor(Math.random() * subjects.length)];
            reason = 'General Improvement';
        }

        // B. Get Video for Topic
        // Search Context depends on class
        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
        const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

        const playlist = await getVideoByTopicIdCached(targetTopic, searchContext, userId, userClass, forceRefresh);

        if (!playlist || playlist.videos.length === 0) {
            return null;
        }

        // Find a video that hasn't been finished ever (active or expired)
        // We really want a fresh one.
        const freshVideos = playlist.videos.filter(v => !isVideoFinished(v.id, userId, userClass, targetExam));

        if (freshVideos.length === 0) {
            return null;
        }

        // Randomize from fresh pool if force refreshing
        const freshVideo = forceRefresh 
            ? freshVideos[Math.floor(Math.random() * freshVideos.length)] 
            : freshVideos[0];

        if (!freshVideo) {
            // All videos for this weak topic are finished!
            // TODO: Move to next weak topic. For now, fallback to first (re-watch) or return null?
            // Let's return null so UI handles "All caught up" or we pick next topic recursively (advanced)
            return null;
        }

        // C. Save as Active
        const newRec: ActiveRecommendation = {
            video: freshVideo,
            topic: targetTopic,
            reason: reason,
            generatedAt: Date.now()
        };

        localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newRec));
        return newRec;

    } catch (e) {
        console.error('[RecommendationService] Error:', e);
        return null;
    }
};

export const clearActiveRecommendation = (userId: string) => {
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
};

export const getRecommendedVideos = async (
    userId: string,
    userClass?: string,
    targetExam?: string,
    forceRefresh: boolean = false
): Promise<ActiveRecommendation[]> => {
    try {
        if (forceRefresh) {
            console.log('[RecommendationService] Force refreshing all recommendations...');
            clearActiveRecommendation(userId);
        }

        const recommendations: ActiveRecommendation[] = [];

        // 1. Get the Primary (Active) Recommendation
        const activeRec = await getActiveRecommendation(userId, userClass, targetExam, forceRefresh);
        if (activeRec) {
            recommendations.push(activeRec);
        }

        // 2. If we have less than 3, fetch more from other weak topics
        if (recommendations.length < 3) {
            // Get more weak topics (limit 15 to have a larger pool for variety)
            const weakTopics = await getWeakTopics(userId, 15, userClass, targetExam);

            // Filter out the topic we already have
            const existingTopics = new Set(recommendations.map(r => r.topic));
            let candidateTopics = weakTopics.filter(t => !existingTopics.has(t.topic));

            // [NEW] Shuffle candidates for variety on every refresh
            candidateTopics = candidateTopics.sort(() => Math.random() - 0.5);

            // Context for search
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
            const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

            const BATCH_SIZE = 5;
            for (let i = 0; i < candidateTopics.length; i += BATCH_SIZE) {
                if (recommendations.length >= 3) break;

                const batch = candidateTopics.slice(i, i + BATCH_SIZE);
                const promises = batch.map(topicStat =>
                    getVideoByTopicIdCached(topicStat.topic, searchContext, userId, userClass)
                        .then(playlist => ({ topicStat, playlist }))
                        .catch(err => {
                            console.error(`[RecommendationService] Error fetching video for topic ${topicStat.topic}:`, err);
                            return { topicStat, playlist: null };
                        })
                );

                const results = await Promise.all(promises);

                for (const { topicStat, playlist } of results) {
                    if (recommendations.length >= 3) break;

                    if (playlist && playlist.videos.length > 0) {
                        // Try to find a video not already in our list (by ID)
                        const existingVideoIds = new Set(recommendations.map(r => r.video.id));
                        const freshVideo = playlist.videos.find(v => !existingVideoIds.has(v.id) && !isVideoFinished(v.id, userId, userClass, targetExam));

                        if (freshVideo) {
                            recommendations.push({
                                video: freshVideo,
                                topic: topicStat.topic,
                                reason: `Weak Topic (${topicStat.score_percentage}%)`,
                                generatedAt: Date.now()
                            });
                            existingTopics.add(topicStat.topic);
                        }
                    }
                }
            }
        }

        // 3. Fallback: If still less than 3, add random subject videos
        if (recommendations.length < 3) {
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
            const subjects = isJunior ? ['Mathematics', 'Science', 'Social Science', 'English'] : ['Physics', 'Chemistry', 'Math'];
            const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

            // Shuffle subjects
            const shuffled = subjects.sort(() => 0.5 - Math.random());

            for (const subject of shuffled) {
                if (recommendations.length >= 3) break;
                // If we already have a generic subject topic? (Actually topics are usually specific like "Rotational Motion", but sometimes just "Physics" if data is sparse)

                // Let's try to get a video for the subject generally if we haven't targeted a specific chapter
                // Or pick a random chapter? 
                // For simplicity, let's just search the Subject Name

                const playlist = await getVideoByTopicIdCached(subject, searchContext, userId, userClass);
                if (playlist && playlist.videos.length > 0) {
                    const existingVideoIds = new Set(recommendations.map(r => r.video.id));
                    const freshVideo = playlist.videos.find(v => !existingVideoIds.has(v.id));

                    if (freshVideo) {
                        recommendations.push({
                            video: freshVideo,
                            topic: subject,
                            reason: 'Suggested for you',
                            generatedAt: Date.now()
                        });
                    }
                }
            }
        }

        return recommendations;

    } catch (e) {
        console.error('[RecommendationService] Error fetching multiple videos:', e);
        return [];
    }
};
