/**
 * Video Progress Service
 * Tracks which videos have been completed and when.
 */

interface CompletedVideo {
    id: string;
    finishedAt: number;
}

const getStorageKey = (userId: string, userClass?: string, targetExam?: string) => {
    return `exam_compass_completed_videos_${userId}_${userClass || 'General'}_${targetExam || 'General'}`;
};

const COLLECTION_NAME = 'video_progress';

export const markVideoAsFinished = (videoId: string, userId: string, userClass?: string, targetExam?: string) => {
    try {
        const key = getStorageKey(userId, userClass, targetExam);
        const completedRaw = localStorage.getItem(key);
        const completed: CompletedVideo[] = completedRaw ? JSON.parse(completedRaw) : [];

        // Check if already exists, update timestamp if so
        const existingIdx = completed.findIndex(v => v.id === videoId);
        if (existingIdx !== -1) {
            completed[existingIdx].finishedAt = Date.now();
        } else {
            completed.push({ id: videoId, finishedAt: Date.now() });
        }

        localStorage.setItem(key, JSON.stringify(completed));
        console.log(`[VideoProgress] Marked video ${videoId} as finished for ${userId} (${userClass}/${targetExam}).`);
        
        // Push to Cloud
        saveVideoProgressToCloud(videoId, userId, userClass, targetExam).catch(console.error);
    } catch (e) {
        console.error('Failed to mark video as finished', e);
    }
};

/**
 * Saves video progress to Firestore for cross-device sync.
 */
export const saveVideoProgressToCloud = async (videoId: string, userId: string, userClass?: string, targetExam?: string) => {
    try {
        const { db } = await import('../lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        
        const cleanClass = userClass || 'General';
        const cleanExam = targetExam || 'General';
        const docId = `${userId}_${cleanClass}_${cleanExam}_${videoId}`;
        const docRef = doc(db, COLLECTION_NAME, docId);

        await setDoc(docRef, {
            user_id: userId,
            user_class: cleanClass,
            target_exam: cleanExam,
            video_id: videoId,
            finished_at: Date.now(),
            last_updated: new Date().toISOString()
        }, { merge: true });
        
        console.log(`[VideoProgress] Synced ${videoId} to cloud for ${userId}`);
    } catch (e) {
        console.error('[VideoProgress] Cloud sync failed:', e);
    }
};

/**
 * Fetches all video progress from Cloud and merges with Local.
 */
export const syncVideoProgress = async (userId: string, userClass?: string, targetExam?: string) => {
    if (!userId) return;
    
    try {
        const { db } = await import('../lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        
        const cleanClass = userClass || 'General';
        const cleanExam = targetExam || 'General';
        
        const q = query(
            collection(db, COLLECTION_NAME),
            where('user_id', '==', userId),
            where('user_class', '==', cleanClass),
            where('target_exam', '==', cleanExam)
        );

        const snap = await getDocs(q);
        if (snap.empty) return;

        const cloudProgress = snap.docs.map(d => ({
            id: d.data().video_id,
            finishedAt: d.data().finished_at
        }));

        // Merge with local
        const key = getStorageKey(userId, userClass, targetExam);
        const localRaw = localStorage.getItem(key);
        const localProgress: CompletedVideo[] = localRaw ? JSON.parse(localRaw) : [];

        const mergedMap = new Map<string, number>();
        
        // Local first
        localProgress.forEach(v => mergedMap.set(v.id, v.finishedAt));
        // Cloud overrides if newer (or if local doesn't exist)
        cloudProgress.forEach(v => {
            const localTime = mergedMap.get(v.id);
            if (!localTime || v.finishedAt > localTime) {
                mergedMap.set(v.id, v.finishedAt);
            }
        });

        const finalMerged = Array.from(mergedMap.entries()).map(([id, finishedAt]) => ({ id, finishedAt }));
        localStorage.setItem(key, JSON.stringify(finalMerged));
        
        console.log(`[VideoProgress] Synced ${finalMerged.length} records from cloud for ${userId}`);
        return finalMerged;
    } catch (e) {
        console.error('[VideoProgress] Sync failed:', e);
    }
};

export const getCompletedVideos = (userId: string, userClass?: string, targetExam?: string): CompletedVideo[] => {
    try {
        const key = getStorageKey(userId, userClass, targetExam);
        const completedRaw = localStorage.getItem(key);
        return completedRaw ? JSON.parse(completedRaw) : [];
    } catch {
        return [];
    }
};

/**
 * Returns true if the video was finished more than 24 hours ago.
 * These videos should be removed from recommendations.
 */
export const isVideoExpiredFinished = (videoId: string, userId: string, userClass?: string, targetExam?: string): boolean => {
    const completed = getCompletedVideos(userId, userClass, targetExam);
    const entry = completed.find(v => v.id === videoId);
    if (!entry) return false;

    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - entry.finishedAt > twentyFourHours;
};

/**
 * Returns true if the video has been finished at all.
 */
export const isVideoFinished = (videoId: string, userId: string, userClass?: string, targetExam?: string): boolean => {
    const completed = getCompletedVideos(userId, userClass, targetExam);
    return completed.some(v => v.id === videoId);
};
