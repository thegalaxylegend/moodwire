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
    targetExam?: string
): Promise<ActiveRecommendation | null> => {
    try {
        // 1. Check existing recommendation in LocalStorage
        const cachedRaw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        if (cachedRaw) {
            const cached: ActiveRecommendation = JSON.parse(cachedRaw);

            // Check if it's expired (finished > 24h ago)
            if (isVideoExpiredFinished(cached.video.id)) {
                console.log('[RecommendationService] Active video expired. Clearing.');
                localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
                // Proceed to generate new one
            } else if (isVideoFinished(cached.video.id)) {
                // If finished but not expired, we STILL return it so the user can see it's done
                // But typically we might want to show it as "Completed" in UI
                return cached;
            } else {
                // Determine if we should refresh based on time (e.g. if it's been 7 days and not finished?)
                // For now, sticky until finished.
                return cached;
            }
        }

        // 2. Generate NEW Recommendation
        console.log('[RecommendationService] Generating new recommendation...');

        // A. Get Weakest Topic
        const weakTopics = await getWeakTopics(userId, 1, userClass, targetExam);
        let targetTopic = '';
        let reason = '';

        if (weakTopics.length > 0) {
            targetTopic = weakTopics[0].topic;
            reason = `Weakest Topic (${weakTopics[0].score_percentage}%)`;
        } else {
            // Fallback: Random subject rotation
            const subjects = ['Physics', 'Chemistry', 'Math'];
            targetTopic = subjects[Math.floor(Math.random() * subjects.length)];
            reason = 'General Improvement';
        }

        // B. Get Video for Topic
        // Search Context depends on class
        const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
        const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

        const playlist = await getVideoByTopicIdCached(targetTopic, searchContext);

        if (!playlist || playlist.videos.length === 0) {
            return null;
        }

        // Find a video that hasn't been finished ever (active or expired)
        // We really want a fresh one.
        const freshVideo = playlist.videos.find(v => !isVideoFinished(v.id));

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
    targetExam?: string
): Promise<ActiveRecommendation[]> => {
    try {
        const recommendations: ActiveRecommendation[] = [];

        // 1. Get the Primary (Active) Recommendation
        const activeRec = await getActiveRecommendation(userId, userClass, targetExam);
        if (activeRec) {
            recommendations.push(activeRec);
        }

        // 2. If we have less than 3, fetch more from other weak topics
        if (recommendations.length < 3) {
            // Get more weak topics (limit 5 to have a pool)
            const weakTopics = await getWeakTopics(userId, 5, userClass, targetExam);

            // Filter out the topic we already have
            const existingTopics = new Set(recommendations.map(r => r.topic));
            const candidateTopics = weakTopics.filter(t => !existingTopics.has(t.topic));

            // Context for search
            const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
            const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

            for (const topicStat of candidateTopics) {
                if (recommendations.length >= 3) break;

                const playlist = await getVideoByTopicIdCached(topicStat.topic, searchContext);

                if (playlist && playlist.videos.length > 0) {
                    // Try to find a video not already in our list (by ID)
                    const existingVideoIds = new Set(recommendations.map(r => r.video.id));
                    const freshVideo = playlist.videos.find(v => !existingVideoIds.has(v.id) && !isVideoFinished(v.id));

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
            const subjects = ['Physics', 'Chemistry', 'Math'];

            // Shuffle subjects
            const shuffled = subjects.sort(() => 0.5 - Math.random());

            const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(userClass || '');
            const searchContext = isJunior ? (userClass || 'Class 10') : (targetExam || 'JEE');

            for (const subject of shuffled) {
                if (recommendations.length >= 3) break;
                // If we already have a generic subject topic? (Actually topics are usually specific like "Rotational Motion", but sometimes just "Physics" if data is sparse)

                // Let's try to get a video for the subject generally if we haven't targeted a specific chapter
                // Or pick a random chapter? 
                // For simplicity, let's just search the Subject Name

                const playlist = await getVideoByTopicIdCached(subject, searchContext);
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
