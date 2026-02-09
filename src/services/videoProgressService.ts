/**
 * Video Progress Service
 * Tracks which videos have been completed and when.
 */

interface CompletedVideo {
    id: string;
    finishedAt: number;
}

const STORAGE_KEY = 'exam_compass_completed_videos';

export const markVideoAsFinished = (videoId: string) => {
    try {
        const completedRaw = localStorage.getItem(STORAGE_KEY);
        const completed: CompletedVideo[] = completedRaw ? JSON.parse(completedRaw) : [];

        // Check if already exists, update timestamp if so
        const existingIdx = completed.findIndex(v => v.id === videoId);
        if (existingIdx !== -1) {
            completed[existingIdx].finishedAt = Date.now();
        } else {
            completed.push({ id: videoId, finishedAt: Date.now() });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
        console.log(`[VideoProgress] Marked video ${videoId} as finished.`);
    } catch (e) {
        console.error('Failed to mark video as finished', e);
    }
};

export const getCompletedVideos = (): CompletedVideo[] => {
    try {
        const completedRaw = localStorage.getItem(STORAGE_KEY);
        return completedRaw ? JSON.parse(completedRaw) : [];
    } catch {
        return [];
    }
};

/**
 * Returns true if the video was finished more than 24 hours ago.
 * These videos should be removed from recommendations.
 */
export const isVideoExpiredFinished = (videoId: string): boolean => {
    const completed = getCompletedVideos();
    const entry = completed.find(v => v.id === videoId);
    if (!entry) return false;

    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - entry.finishedAt > twentyFourHours;
};

/**
 * Returns true if the video has been finished at all.
 */
export const isVideoFinished = (videoId: string): boolean => {
    const completed = getCompletedVideos();
    return completed.some(v => v.id === videoId);
};
