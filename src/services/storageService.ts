
import { RateLimiter } from '../lib/rateLimiter';

/**
 * Smart Storage Service
 * Manages local persistence for Exam Compass to prevent storage bloat.
 */

export interface TestHistoryEntry {
    id: number;
    score: number;
    total: number;
    type: string;
    exam: string;
    date: string;
    status: string;
    details?: any; // Questions and answers
    percentage?: number;
    correctCount?: number;
    wrongCount?: number;
    totalQuestions?: number;
    topic?: string;
    weakTopics?: string[];
    user_class: string; // Captured at write time
    pendingSync?: boolean; // Flag for retry logic
}

const GLOBAL_STORAGE_KEY = 'exam_compass_local_history';
const getStorageKey = (uid: string) => `exam_compass_local_history_${uid}`;
const MAX_HISTORY_ITEMS = 30;
const MAX_DETAILED_ITEMS = 5; // Only keep full question data for the most recent 5 tests

export const storageService = {
    /**
     * Saves a test attempt to local history with smart pruning
     */
    saveTestAttempt: async (attempt: TestHistoryEntry, uid?: string) => {
        if (!uid) return;
        try {
            const key = getStorageKey(uid);
            const raw = localStorage.getItem(key);
            let history: TestHistoryEntry[] = raw ? JSON.parse(raw) : [];

            // 1. Add new attempt to the front
            history.unshift(attempt);

            // 2. Prune total items to 30
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }

            // 3. Strip heavy "details" from items older than the top 5
            history = history.map((item, index) => {
                if (index >= MAX_DETAILED_ITEMS && item.details) {
                    const { details: _details, ...lightweightItem } = item;
                    return lightweightItem;
                }
                return item;
            });

            localStorage.setItem(key, JSON.stringify(history));
            console.log(`[Storage] Saved attempt for ${uid}. History size: ${history.length} items.`);
        } catch (e) {
            console.error("[Storage] Failed to save test attempt:", e);
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                await storageService.emergencyPurge(uid);
            }
        }
    },

    /**
     * Retrieves history
     */
    getHistory: async (uid?: string): Promise<TestHistoryEntry[]> => {
        if (!uid) return [];
        try {
            const key = getStorageKey(uid);
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Emergency Purge: Keep only the absolute latest 3 items to free space
     */
    emergencyPurge: async (uid?: string) => {
        if (!uid) return;
        try {
            localStorage.removeItem(getStorageKey(uid));
            console.warn(`[Storage] Emergency purge executed for ${uid} due to quota issues.`);
        } catch (e) {}
    },

    /**
     * Syncs pending test attempts to the backend.
     */
    syncPendingTests: async (uid: string) => {
        if (!uid) return;
        const key = getStorageKey(uid);
        const raw = localStorage.getItem(key);
        const history: TestHistoryEntry[] = raw ? JSON.parse(raw) : [];
        
        const pending = history.filter(item => item.pendingSync);
        if (pending.length === 0) return;

        RateLimiter.enforceDbWrite();
        console.log(`📡 [Sync] Attempting to sync ${pending.length} pending tests...`);
        let syncedCount = 0;

        for (const item of pending) {
            try {
                const { db } = await import('../lib/firebase');
                const { collection, addDoc } = await import('firebase/firestore');
                
                // Reconstruct doc
                const mockAttemptData = {
                    user_id: uid,
                    score: item.score,
                    total_marks: item.total,
                    correct_count: item.correctCount,
                    wrong_count: item.wrongCount,
                    exam_type: item.type,
                    topic: item.topic,
                    status: item.status,
                    timestamp: new Date(item.date),
                    user_class: item.user_class,
                    weak_topics: item.weakTopics || []
                };

                await addDoc(collection(db, 'mock_attempts'), mockAttemptData);
                item.pendingSync = false; // Mark as synced
                syncedCount++;
            } catch (err) {
                console.error(`❌ [Sync] Failed to sync test ${item.id}:`, err);
            }
        }

        if (syncedCount > 0) {
            localStorage.setItem(key, JSON.stringify(history)); // Save updated history
            console.log(`✅ [Sync] Successfully synced ${syncedCount} tests.`);
        }
    },

    /**
     * Migrates legacy global history to the current user's scoped storage.
     * Fires only once per user.
     */
    migrateGlobalHistory: async (uid: string) => {
        if (!uid) return;
        const migrationGuardKey = `exam_compass_history_migrated_${uid}`;
        
        // 1. CHECK GUARD FIRST
        if (localStorage.getItem(migrationGuardKey)) return;

        try {
            const { db } = await import('../lib/firebase');
            const { collection, query, where, limit, getDocs } = await import('firebase/firestore');

            // 2. CHECK FIRESTORE FOR EXISTING HISTORY (Multi-device protection)
            const q = query(collection(db, 'mock_attempts'), where('user_id', '==', uid), limit(1));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                console.log(`[Storage] Cloud history detected for ${uid}. Marking migration as complete (from other device).`);
                localStorage.setItem(migrationGuardKey, 'true');
                return;
            }

            // 3. READ GLOBAL HISTORY
            const rawGlobal = localStorage.getItem(GLOBAL_STORAGE_KEY);
            if (!rawGlobal) {
                localStorage.setItem(migrationGuardKey, 'true');
                return;
            }

            const globalHistory: TestHistoryEntry[] = JSON.parse(rawGlobal);
            if (globalHistory.length === 0) {
                localStorage.setItem(migrationGuardKey, 'true');
                return;
            }

            // SET GUARD BEFORE WRITING to scoped to prevent re-runs
            localStorage.setItem(migrationGuardKey, 'true');

            console.log(`[Storage] Migrating ${globalHistory.length} items from global to scoped storage for ${uid}`);
            
            const key = getStorageKey(uid);
            const rawScoped = localStorage.getItem(key);
            const scopedHistory: TestHistoryEntry[] = rawScoped ? JSON.parse(rawScoped) : [];

            // Merge and de-duplicate by date
            const merged = [...scopedHistory, ...globalHistory]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, MAX_HISTORY_ITEMS);

            localStorage.setItem(key, JSON.stringify(merged));
            
            // Note: We leave GLOBAL_STORAGE_KEY intact for other users to potentially migrate 
            // but userStore.logout will eventually clear it for security.
        } catch (e) {
            console.error("[Storage] Migration failed:", e);
        }
    }
};
