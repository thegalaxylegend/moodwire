import { getAdaptiveQuestionBatch } from './questionEngine';

/**
 * Predictive Pre-fetching Service
 * Pre-warms mock exam questions in the background based on user profile.
 */

const PREFETCH_CACHE_KEY = 'exam_compass_prefetched_test';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 Hour

export interface PrefetchedTest {
    questions: any[];
    timestamp: number;
    targetExam: string;
    abilityScore: number;
}

export const mockPrefetchService = {
    /**
     * Starts pre-fetching a Quick Test batch in the background.
     */
    prefetchQuickTest: async (_uid: string, targetExam: string, currentAbility: number, userClass: string) => {
        try {
            // 1. Check if we already have a fresh prefetch
            const cached = localStorage.getItem(PREFETCH_CACHE_KEY);
            if (cached) {
                const data: PrefetchedTest = JSON.parse(cached);
                const isStale = (Date.now() - data.timestamp) > CACHE_EXPIRY;
                const isMismatch = data.targetExam !== targetExam || data.abilityScore !== currentAbility;
                
                if (!isStale && !isMismatch) {
                    console.log("[Prefetch] Fresh cache exists. Skipping background fetch.");
                    return;
                }
            }

            console.log("[Prefetch] Pre-warming Quick Test in background...");

            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);
            const isNeet = targetExam.toUpperCase().includes('NEET');

            let needs: Array<{ subject: string; topic: string; count: number }> = [];

            if (isJunior) {
                needs = [{ subject: 'General', topic: 'Mathematics and Science', count: 10 }];
            } else if (isNeet) {
                needs = [
                    { subject: 'Biology', topic: 'Biology', count: 4 },
                    { subject: 'Physics', topic: 'Physics', count: 3 },
                    { subject: 'Chemistry', topic: 'Chemistry', count: 3 }
                ];
            } else {
                needs = [
                    { subject: 'Mathematics', topic: 'Mathematics', count: 4 },
                    { subject: 'Physics', topic: 'Physics', count: 3 },
                    { subject: 'Chemistry', topic: 'Chemistry', count: 3 }
                ];
            }

            // Execute batch retrieval (Fallback to AI happens internally)
            const questions = await getAdaptiveQuestionBatch(
                needs,
                targetExam,
                currentAbility,
                () => { /* Background progress not shown to user */ }
            );

            if (questions && questions.length > 0) {
                const prefetch: PrefetchedTest = {
                    questions,
                    timestamp: Date.now(),
                    targetExam,
                    abilityScore: currentAbility
                };
                localStorage.setItem(PREFETCH_CACHE_KEY, JSON.stringify(prefetch));
                console.log(`[Prefetch] Pre-warmed ${questions.length} questions for Quick Test.`);
            }
        } catch (e) {
            console.error("[Prefetch] Background pre-fetch failed:", e);
        }
    },

    /**
     * Consumes the prefetched test if valid.
     */
    consumePrefetch: (targetExam: string, _currentAbility: number): any[] | null => {
        const cached = localStorage.getItem(PREFETCH_CACHE_KEY);
        if (!cached) return null;

        try {
            const data: PrefetchedTest = JSON.parse(cached);
            const isStale = (Date.now() - data.timestamp) > CACHE_EXPIRY;
            const isMismatch = data.targetExam !== targetExam; // Ability might drift slightly, so we prioritize exam match

            if (isStale || isMismatch) {
                localStorage.removeItem(PREFETCH_CACHE_KEY);
                return null;
            }

            // Consume and clear to prevent reuse of same questions immediately
            localStorage.removeItem(PREFETCH_CACHE_KEY);
            return data.questions;
        } catch (e) {
            return null;
        }
    }
};
