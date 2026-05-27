import { isVideoFinished } from './videoProgressService';
import { SubtopicProgressService } from './subtopicProgressService';
import type { CuratedVideo } from '../lib/videoLibraryDB';
import type { Video } from './videoService';

// Extended type that includes scoring details
export interface ScoredVideo {
    video: Video | CuratedVideo;
    score: number;
    relevanceReason: string;
}

/**
 * Ranks videos using a mathematical scoring formula based on user learning state.
 * Formula:
 *   Score = 0.35 * TopicRelevance + 0.25 * QualityScore + 0.20 * TypeBonus + 0.15 * UrgencyBonus - 0.05 * WatchedPenalty
 */
export const scoreVideos = (
    videos: (Video | CuratedVideo)[],
    userId: string,
    chapterId: string,
    currentSubtopic: string | null,
    userClass: string,
    exam: string,
    weakTopics: Array<{ topic: string; score_percentage: number }>
): ScoredVideo[] => {
    // 1. Get student progress details
    const progress = SubtopicProgressService.getChapterProgress(userId, chapterId);
    const mastery = progress ? progress.masteryScore : 0;
    
    // Check if this chapter is flagged as review needed
    const isReviewNeeded = progress ? progress.state === 'review_needed' : false;

    // Check if this chapter is in the user's weak topics list
    const weakTopicMatch = weakTopics.find(t => t.topic.toLowerCase().trim() === chapterId.toLowerCase().trim());
    const isWeakTopic = !!weakTopicMatch;

    return videos.map(video => {
        const isCurated = 'qualityScore' in video;
        const videoType = isCurated ? (video as CuratedVideo).type : 'detailed'; // default to detailed for discovered
        const videoQuality = isCurated ? (video as CuratedVideo).qualityScore : 70; // baseline for discovered

        let topicRelevance = 50; // default middle
        
        // 1. Topic Relevance (0-100)
        // If we are looking for a specific subtopic, does the video title match it?
        if (currentSubtopic) {
            const cleanTitle = video.title.toLowerCase();
            const cleanSub = currentSubtopic.toLowerCase();
            if (cleanTitle.includes(cleanSub)) {
                topicRelevance = 100;
            } else {
                // partial match check
                const subwords = cleanSub.split(' ').filter(w => w.length > 3);
                const matches = subwords.filter(w => cleanTitle.includes(w)).length;
                if (subwords.length > 0) {
                    topicRelevance = 50 + Math.round((matches / subwords.length) * 50);
                }
            }
        } else {
            // General query: is it a comprehensive/oneshot video?
            if (videoType === 'oneshot' || videoType === 'detailed') {
                topicRelevance = 90;
            }
        }

        // 2. Quality Score (0-100)
        const quality = videoQuality;

        // 3. Type Bonus (0-100)
        // TypeBonus logic: mastery < 40% -> Detailed, 40-80% -> QuickRevision/Oneshot, >80% -> PYQ
        let typeBonus = 0;
        if (mastery < 40) {
            if (videoType === 'detailed') typeBonus = 100;
            else if (videoType === 'oneshot') typeBonus = 70;
            else if (videoType === 'quick_revision') typeBonus = 40;
        } else if (mastery >= 40 && mastery <= 80) {
            if (videoType === 'oneshot') typeBonus = 100;
            else if (videoType === 'quick_revision') typeBonus = 90;
            else if (videoType === 'detailed') typeBonus = 60;
            else if (videoType === 'topic_wise') typeBonus = 70;
        } else { // mastery > 80%
            if (videoType === 'pyq') typeBonus = 100;
            else if (videoType === 'oneshot') typeBonus = 70;
            else if (videoType === 'quick_revision') typeBonus = 80;
        }

        // 4. Urgency Bonus (0-100)
        // Inversely proportional to subtopic mastery score.
        let urgencyBonus = Math.max(0, 100 - mastery);
        if (isReviewNeeded) {
            urgencyBonus = Math.min(100, urgencyBonus + 30);
        }
        if (isWeakTopic) {
            urgencyBonus = Math.min(100, urgencyBonus + 20);
        }

        // 5. Already Watched Penalty (0 or 100)
        const isWatched = isVideoFinished(video.id, userId, userClass, exam);
        const watchedPenalty = isWatched ? 100 : 0;

        // Apply weights:
        // W1 = 0.35, W2 = 0.25, W3 = 0.20, W4 = 0.15, W5 = 0.05
        const finalScore = (0.35 * topicRelevance) +
                           (0.25 * quality) +
                           (0.20 * typeBonus) +
                           (0.15 * urgencyBonus) -
                           (0.05 * watchedPenalty);

        let relevanceReason = '';
        if (isWatched) {
            relevanceReason = 'Already watched (low priority)';
        } else if (currentSubtopic && topicRelevance > 70) {
            relevanceReason = `Direct match for: ${currentSubtopic}`;
        } else if (isReviewNeeded) {
            relevanceReason = 'Recommended for mock test remediation';
        } else if (mastery < 40 && videoType === 'detailed') {
            relevanceReason = 'Perfect for building core foundations';
        } else if (mastery >= 40 && mastery <= 80 && (videoType === 'oneshot' || videoType === 'quick_revision')) {
            relevanceReason = 'Highly recommended for quick revision';
        } else if (mastery > 80 && videoType === 'pyq') {
            relevanceReason = 'Best for practice with exam PYQs';
        } else {
            relevanceReason = 'Strategic recommendation based on mastery';
        }

        return {
            video,
            score: Math.round(finalScore * 10) / 10,
            relevanceReason
        };
    }).sort((a, b) => b.score - a.score);
};
