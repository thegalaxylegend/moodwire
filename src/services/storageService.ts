
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
}

const STORAGE_KEY = 'exam_compass_local_history';
const MAX_HISTORY_ITEMS = 30;
const MAX_DETAILED_ITEMS = 5; // Only keep full question data for the most recent 5 tests

export const storageService = {
    /**
     * Saves a test attempt to local history with smart pruning
     */
    saveTestAttempt: (attempt: TestHistoryEntry) => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let history: TestHistoryEntry[] = raw ? JSON.parse(raw) : [];

            // 1. Add new attempt to the front
            history.unshift(attempt);

            // 2. Prune total items to 30
            if (history.length > MAX_HISTORY_ITEMS) {
                history = history.slice(0, MAX_HISTORY_ITEMS);
            }

            // 3. Strip heavy "details" from items older than the top 5
            // This ensures we keep the scores but don't fill the 5MB browser limit
            history = history.map((item, index) => {
                if (index >= MAX_DETAILED_ITEMS && item.details) {
                    const { details, ...lightweightItem } = item;
                    return lightweightItem;
                }
                return item;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            console.log(`[Storage] Saved attempt. History size: ${history.length} items.`);
        } catch (e) {
            console.error("[Storage] Failed to save test attempt:", e);
            // If storage is full, try an aggressive purge
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                storageService.emergencyPurge();
            }
        }
    },

    /**
     * Retrieves history
     */
    getHistory: (): TestHistoryEntry[] => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * Emergency Purge: Keep only the absolute latest 3 items to free space
     */
    emergencyPurge: () => {
        try {
            const history = storageService.getHistory();
            const emergencySet = history.slice(0, 3).map(item => {
                const { details, ...light } = item;
                return light;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencySet));
            console.warn("[Storage] Emergency purge executed due to quota issues.");
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
};
