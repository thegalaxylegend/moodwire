/**
 * Subtopic Progress Service
 *
 * Tracks per-chapter mastery state for the sequential learning journey.
 * Stores locally (instant) and syncs to Firestore (background).
 *
 * Schema per chapter:
 *   checkedSubtopics: string[]   — which subtopic checkboxes are ticked
 *   masteryScore: number         — 0-100, set after Active Recall quiz pass
 *   state: 'locked'|'next'|'in_progress'|'mastered'|'review_needed'
 *   lastUpdated: ISO string
 */

import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export type ChapterState = 'locked' | 'next' | 'in_progress' | 'mastered' | 'review_needed';

export interface ChapterProgress {
    topicId: string;
    checkedSubtopics: string[];
    masteryScore: number;       // 0-100
    state: ChapterState;
    videosWatched: string[];    // videoIds confirmed watched
    lastUpdated: string;
}

// ─── LOCAL CACHE ─────────────────────────────────────────

const CACHE_PREFIX = 'ec_chapter_progress_';

const getLocalProgress = (userId: string): Record<string, ChapterProgress> => {
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const saveLocalProgress = (userId: string, data: Record<string, ChapterProgress>) => {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(data));
    } catch (e) {
        console.warn('[SubtopicProgress] localStorage save failed:', e);
    }
};

// ─── SERVICE ─────────────────────────────────────────────

export const SubtopicProgressService = {

    /**
     * Get progress for a single chapter.
     */
    getChapterProgress: (userId: string, topicId: string): ChapterProgress | null => {
        const all = getLocalProgress(userId);
        return all[topicId] || null;
    },

    /**
     * Get all chapter progress for a user (full map).
     */
    getAllProgress: (userId: string): Record<string, ChapterProgress> => {
        return getLocalProgress(userId);
    },

    /**
     * Toggle a subtopic checkbox. Updates state to 'in_progress' automatically.
     * Fires Firestore sync in background.
     */
    toggleSubtopic: async (
        userId: string,
        topicId: string,
        subtopic: string,
        totalSubtopics: number
    ): Promise<ChapterProgress> => {
        const all = getLocalProgress(userId);
        const existing = all[topicId] || {
            topicId,
            checkedSubtopics: [],
            masteryScore: 0,
            state: 'in_progress' as ChapterState,
            videosWatched: [],
            lastUpdated: new Date().toISOString()
        };

        const checked = new Set(existing.checkedSubtopics);
        if (checked.has(subtopic)) {
            checked.delete(subtopic);
        } else {
            checked.add(subtopic);
        }

        const newChecked = Array.from(checked);
        const completionRatio = totalSubtopics > 0 ? newChecked.length / totalSubtopics : 0;

        // Auto-derive state based on completion
        let state: ChapterState = 'in_progress';
        if (completionRatio === 1) {
            state = existing.masteryScore >= 80 ? 'mastered' : 'in_progress';
        }
        if (existing.state === 'review_needed') {
            state = 'review_needed'; // Don't override explicit review flags
        }
        if (existing.masteryScore >= 80 && completionRatio === 1) {
            state = 'mastered';
        }

        const updated: ChapterProgress = {
            ...existing,
            checkedSubtopics: newChecked,
            state,
            lastUpdated: new Date().toISOString()
        };

        all[topicId] = updated;
        saveLocalProgress(userId, all);

        // Background Firestore sync
        SubtopicProgressService.syncChapterToCloud(userId, updated);

        return updated;
    },

    /**
     * Mark a video as watched for a chapter.
     */
    markVideoWatched: async (userId: string, topicId: string, videoId: string): Promise<void> => {
        const all = getLocalProgress(userId);
        const existing = all[topicId] || {
            topicId,
            checkedSubtopics: [],
            masteryScore: 0,
            state: 'in_progress' as ChapterState,
            videosWatched: [],
            lastUpdated: new Date().toISOString()
        };

        if (!existing.videosWatched.includes(videoId)) {
            existing.videosWatched = [...existing.videosWatched, videoId];
        }

        // Move from 'next' to 'in_progress' on first video watch
        if (existing.state === 'next' || existing.state === 'locked') {
            existing.state = 'in_progress';
        }
        existing.lastUpdated = new Date().toISOString();

        all[topicId] = existing;
        saveLocalProgress(userId, all);
        SubtopicProgressService.syncChapterToCloud(userId, existing);
    },

    /**
     * Set mastery score after an Active Recall quiz.
     * If score >= 80, marks chapter as 'mastered'.
     * If score < 80, marks as 'review_needed'.
     */
    setMasteryScore: async (userId: string, topicId: string, score: number): Promise<ChapterProgress> => {
        const all = getLocalProgress(userId);
        const existing = all[topicId] || {
            topicId,
            checkedSubtopics: [],
            masteryScore: 0,
            state: 'in_progress' as ChapterState,
            videosWatched: [],
            lastUpdated: new Date().toISOString()
        };

        const newState: ChapterState = score >= 80 ? 'mastered' : 'review_needed';
        const updated: ChapterProgress = {
            ...existing,
            masteryScore: score,
            state: newState,
            lastUpdated: new Date().toISOString()
        };

        all[topicId] = updated;
        saveLocalProgress(userId, all);
        SubtopicProgressService.syncChapterToCloud(userId, updated);

        return updated;
    },

    /**
     * Initialize a chapter as 'next' (the active upcoming chapter).
     * Used to highlight "Your Next Chapter" on the Lectures page.
     */
    setChapterAsNext: (userId: string, topicId: string): void => {
        const all = getLocalProgress(userId);
        if (!all[topicId]) {
            all[topicId] = {
                topicId,
                checkedSubtopics: [],
                masteryScore: 0,
                state: 'next',
                videosWatched: [],
                lastUpdated: new Date().toISOString()
            };
            saveLocalProgress(userId, all);
        }
    },

    /**
     * Flag a chapter as 'review_needed' from external triggers (e.g., Mock Test results).
     */
    flagForReview: async (userId: string, topicId: string): Promise<void> => {
        const all = getLocalProgress(userId);
        const existing = all[topicId];
        if (existing && existing.state === 'mastered') {
            existing.state = 'review_needed';
            existing.lastUpdated = new Date().toISOString();
            all[topicId] = existing;
            saveLocalProgress(userId, all);
            SubtopicProgressService.syncChapterToCloud(userId, existing);
        }
    },

    /**
     * Calculate mastery percentage for a subject (0-100).
     * Used to drive the Subject Progress Ring on the Lectures page.
     */
    getSubjectMastery: (userId: string, topicIds: string[]): number => {
        if (topicIds.length === 0) return 0;
        const all = getLocalProgress(userId);
        const mastered = topicIds.filter(id => all[id]?.state === 'mastered').length;
        return Math.round((mastered / topicIds.length) * 100);
    },

    /**
     * Sync a single chapter to Firestore (background, non-blocking).
     */
    syncChapterToCloud: async (userId: string, progress: ChapterProgress): Promise<void> => {
        if (!auth.currentUser || !userId || userId === 'guest') return;
        try {
            const docRef = doc(db, 'chapter_progress', `${userId}_${progress.topicId}`);
            await setDoc(docRef, { ...progress, user_id: userId }, { merge: true });
        } catch (e) {
            console.warn('[SubtopicProgress] Firestore sync failed (non-critical):', e);
        }
    },

    /**
     * Load all chapter progress from Firestore (called on app load if local cache is empty).
     */
    loadFromCloud: async (userId: string): Promise<void> => {
        if (!auth.currentUser || !userId || userId === 'guest') return;
        const local = getLocalProgress(userId);
        if (Object.keys(local).length > 0) return; // Already have local data

        try {
            const q = query(collection(db, 'chapter_progress'), where('user_id', '==', userId));
            const snap = await getDocs(q);
            const fromCloud: Record<string, ChapterProgress> = {};
            snap.docs.forEach(d => {
                const data = d.data() as ChapterProgress;
                fromCloud[data.topicId] = data;
            });
            if (Object.keys(fromCloud).length > 0) {
                saveLocalProgress(userId, fromCloud);
                console.log(`[SubtopicProgress] Loaded ${Object.keys(fromCloud).length} chapters from cloud.`);
            }
        } catch (e) {
            console.warn('[SubtopicProgress] Cloud load failed:', e);
        }
    }
};
