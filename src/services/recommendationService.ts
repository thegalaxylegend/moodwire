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
        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
        const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

        let targetTopic = '';
        let reason = '';
        let freshVideo: Video | null = null;

        // A. Get Weakest Topics
        // Get a pool of weak topics to iterate through
        const weakTopicsPool = await getWeakTopics(userId, forceRefresh ? 10 : 5, userClass, targetExam);

        // If force refreshing, shuffle the pool to try different topics
        const candidateTopics = forceRefresh ? [...weakTopicsPool].sort(() => Math.random() - 0.5) : weakTopicsPool;

        for (const topicStat of candidateTopics) {
            const playlist = await getVideoByTopicIdCached(topicStat.topic, searchContext, userId, userClass, forceRefresh);

            if (playlist && playlist.videos.length > 0) {
                const freshVideos = playlist.videos.filter(v => !isVideoFinished(v.id, userId, userClass, targetExam));

                if (freshVideos.length > 0) {
                    targetTopic = topicStat.topic;
                    reason = forceRefresh ? `Targeted Review (${topicStat.score_percentage}%)` : `Weakest Topic (${topicStat.score_percentage}%)`;
                    freshVideo = forceRefresh
                        ? freshVideos[Math.floor(Math.random() * freshVideos.length)]
                        : freshVideos[0];
                    break;
                }
            }
        }

        // B. Fallback: Random subject rotation if no weak topics yielded a fresh video
        if (!freshVideo) {
            const subjects = isJunior ? ['Mathematics', 'Science', 'Social Science', 'English'] : ['Physics', 'Chemistry', 'Math'];
            const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);

            for (const subject of shuffledSubjects) {
                const playlist = await getVideoByTopicIdCached(subject, searchContext, userId, userClass, forceRefresh);
                if (playlist && playlist.videos.length > 0) {
                    const freshVideos = playlist.videos.filter(v => !isVideoFinished(v.id, userId, userClass, targetExam));
                    if (freshVideos.length > 0) {
                        targetTopic = subject;
                        reason = 'General Improvement';
                        freshVideo = forceRefresh
                            ? freshVideos[Math.floor(Math.random() * freshVideos.length)]
                            : freshVideos[0];
                        break;
                    }
                }
            }
        }

        // C. Fallback: Re-watch the first video of the weakest topic if absolutely no fresh videos are available
        if (!freshVideo && candidateTopics.length > 0) {
            const firstTopic = candidateTopics[0];
            const playlist = await getVideoByTopicIdCached(firstTopic.topic, searchContext, userId, userClass, false);
            if (playlist && playlist.videos.length > 0) {
                targetTopic = firstTopic.topic;
                reason = `Re-watch: Weakest Topic (${firstTopic.score_percentage}%)`;
                freshVideo = playlist.videos[0];
            }
        }

        if (!freshVideo) {
            return null;
        }

        // D. Save as Active
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

            for (const topicStat of candidateTopics) {
                if (recommendations.length >= 3) break;

                const playlist = await getVideoByTopicIdCached(topicStat.topic, searchContext, userId, userClass);

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
