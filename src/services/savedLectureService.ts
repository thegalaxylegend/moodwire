import { db } from '../lib/firebase';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import type { Video } from './videoService';

const COLLECTION_NAME = 'saved_lectures';

/**
 * Saves a lecture video to Firestore.
 * Document ID: userId_videoId
 */
export const saveLectureToCloud = async (userId: string, video: Video, userClass?: string, targetExam?: string): Promise<void> => {
    if (!userId || !video.id) return;

    try {
        const cleanClass = userClass || 'General';
        const cleanExam = targetExam || 'General';
        const docId = `${userId}_${cleanClass}_${cleanExam}_${video.id}`;
        const docRef = doc(db, COLLECTION_NAME, docId);

        await setDoc(docRef, {
            user_id: userId,
            user_class: cleanClass,
            target_exam: cleanExam,
            video_id: video.id,
            title: video.title,
            channel_name: video.channelName,
            thumbnail_url: video.thumbnailUrl,
            video_url: video.videoUrl,
            duration: video.duration,
            saved_at: new Date().toISOString()
        }, { merge: true });

        console.log(`[savedLectureService] Video ${video.id} saved to cloud for user ${userId} (${cleanClass}/${cleanExam})`);
    } catch (e) {
        console.error('[savedLectureService] Error saving lecture:', e);
        throw e;
    }
};

/**
 * Removes a lecture video from Firestore.
 */
export const removeLectureFromCloud = async (userId: string, videoId: string, userClass?: string, targetExam?: string): Promise<void> => {
    if (!userId || !videoId) return;

    try {
        const cleanClass = userClass || 'General';
        const cleanExam = targetExam || 'General';
        const docId = `${userId}_${cleanClass}_${cleanExam}_${videoId}`;
        await deleteDoc(doc(db, COLLECTION_NAME, docId));
        console.log(`[savedLectureService] Video ${videoId} removed from cloud (${cleanClass}/${cleanExam})`);
    } catch (e) {
        console.error('[savedLectureService] Error removing lecture:', e);
        throw e;
    }
};

/**
 * Fetches all saved lectures for a user from Firestore.
 */
export const getSavedLecturesFromCloud = async (userId: string, userClass?: string, targetExam?: string): Promise<Video[]> => {
    if (!userId) return [];

    try {
        let q = query(
            collection(db, COLLECTION_NAME),
            where('user_id', '==', userId)
        );

        if (userClass) {
            q = query(q, where('user_class', '==', userClass));
        }
        if (targetExam) {
            q = query(q, where('target_exam', '==', targetExam));
        }

        q = query(q, orderBy('saved_at', 'desc'));

        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: data.video_id,
                title: data.title,
                channelName: data.channel_name,
                thumbnailUrl: data.thumbnail_url,
                videoUrl: data.video_url,
                duration: data.duration,
                user_class: data.user_class
            } as Video;
        });
    } catch (e) {
        console.error('[savedLectureService] Error fetching lectures:', e);
        return [];
    }
};

/**
 * Migrates local storage lectures to Firestore.
 * Call this when a guest logs in or on first visit.
 */
export const migrateLocalToCloud = async (userId: string): Promise<void> => {
    if (!userId) return;

    const SAVED_LECTURES_KEY_PREFIX = 'exam-compass-saved-lectures';
    // Check both generic and user-specific local storage keys
    const localKeys = [SAVED_LECTURES_KEY_PREFIX, `${SAVED_LECTURES_KEY_PREFIX}-${userId}`];

    let allLocalLectures: Video[] = [];
    localKeys.forEach(key => {
        try {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            allLocalLectures = [...allLocalLectures, ...items];
        } catch (e) { }
    });

    if (allLocalLectures.length === 0) return;

    // Filter unique by ID
    const uniqueLectures = Array.from(new Map(allLocalLectures.map(v => [v.id, v])).values());

    console.log(`[savedLectureService] Migrating ${uniqueLectures.length} local lectures to cloud...`);

    const batch = writeBatch(db);
    uniqueLectures.forEach(video => {
        const docId = `${userId}_${video.id}`;
        const docRef = doc(db, COLLECTION_NAME, docId);
        batch.set(docRef, {
            user_id: userId,
            video_id: video.id,
            title: video.title,
            channel_name: video.channelName,
            thumbnail_url: video.thumbnailUrl,
            video_url: video.videoUrl,
            duration: video.duration,
            saved_at: new Date().toISOString()
        }, { merge: true });
    });

    try {
        await batch.commit();
        // Clean up local storage
        localKeys.forEach(key => localStorage.removeItem(key));
        console.log('[savedLectureService] Migration successful');
    } catch (e) {
        console.error('[savedLectureService] Migration failed:', e);
    }
};

/**
 * Migrates saved lectures between user IDs (e.g. merging accounts).
 */
export const migrateSavedLecturesCloud = async (oldUserId: string, newUserId: string): Promise<void> => {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return;

    try {
        const q = query(collection(db, COLLECTION_NAME), where('user_id', '==', oldUserId));
        const snap = await getDocs(q);

        if (snap.empty) return;

        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            const data = d.data();
            const newDocId = `${newUserId}_${data.video_id}`;
            batch.set(doc(db, COLLECTION_NAME, newDocId), { ...data, user_id: newUserId }, { merge: true });
            batch.delete(d.ref);
        });

        await batch.commit();
        console.log(`[savedLectureService] Migrated ${snap.size} lectures to ${newUserId}`);
    } catch (e) {
        console.error('[savedLectureService] Migration failed:', e);
    }
};
