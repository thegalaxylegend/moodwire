import { db } from '../lib/firebase';
import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    runTransaction,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';

// --- Types ---
export interface LeaderboardEntry {
    userId: string;
    totalScore: number;
    testsTaken: number;
    examType: string;
    user: {
        displayName: string;
        avatar?: string;
    };
    xp: number;
    rankName: string;
    lastUpdated: any;
    rank?: number; // Hydrated on client
}

// --- Constants ---
const DAILY_FULL_SCORE_LIMIT = 5; // First 5 tests get full score
const DAILY_REDUCED_SCORE_LIMIT = 10; // Next 5 get 50%
// After 10, score is 0 to prevent abuse

// --- Helpers ---

/**
 * Returns the current Month-Year key (e.g., "2026-02")
 * Uses fixed locale to ensure consistency regardless of user device time.
 */
export const getCurrentSeasonKey = (): string => {
    const now = new Date();
    // Using simple ISO-like format YYYY-MM
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // "2026-02"
};

/**
 * Updates the user's score in the monthly leaderboard.
 * Handles:
 * 1. Monthly Bucketing
 * 2. Rate Limiting (Fairness)
 * 3. Atomic Updates
 */
export const updateLeaderboard = async (
    userId: string,
    userProfile: { displayName: string, avatar?: string, xp?: number, rankName?: string },
    score: number,
    examType: string
) => {
    if (!userId || !score) return;

    const seasonKey = getCurrentSeasonKey();
    const todayStr = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD for rate limit key

    const leaderboardRef = doc(db, 'leaderboards', seasonKey, 'users', userId);

    try {
        await runTransaction(db, async (transaction) => {
            const leaderboardDoc = await transaction.get(leaderboardRef);
            let currentStats = leaderboardDoc.exists() ? leaderboardDoc.data() : {
                totalScore: 0,
                testsTaken: 0,
                dailyStats: { date: todayStr, count: 0 }
            };

            // Reset daily stats if it's a new day
            if (currentStats.dailyStats?.date !== todayStr) {
                currentStats.dailyStats = { date: todayStr, count: 0 };
            }

            const dailyCount = currentStats.dailyStats.count;
            let finalScoreToAdd = 0;

            // --- Fairness Logic ---
            if (dailyCount < DAILY_FULL_SCORE_LIMIT) {
                finalScoreToAdd = score;
            } else if (dailyCount < DAILY_REDUCED_SCORE_LIMIT) {
                finalScoreToAdd = Math.round(score * 0.5); // 50% penalty
            } else {
                finalScoreToAdd = 0; // abuse prevention
            }

            // If score is 0 due to limit, we still count the test attempt but don't add score
            // Actually, let's allow "testsTaken" to increment.

            transaction.set(leaderboardRef, {
                userId,
                user: {
                    displayName: userProfile.displayName || 'Anonymous',
                    avatar: userProfile.avatar || null
                },
                xp: userProfile.xp || currentStats.xp || 0,
                rankName: userProfile.rankName || currentStats.rankName || 'Novice',
                examType: examType || 'General',
                totalScore: (currentStats.totalScore || 0) + finalScoreToAdd,
                testsTaken: (currentStats.testsTaken || 0) + 1,
                lastUpdated: serverTimestamp(),
                dailyStats: {
                    date: todayStr,
                    count: dailyCount + 1
                }
            }, { merge: true });
        });

        console.log(`Leaderboard updated for ${seasonKey} | +${score}`);
    } catch (e) {
        console.error("Leaderboard update failed:", e);
        // Don't throw, we don't want to block the user flow for this
    }
};

/**
 * Fetches the top leaderboard for the current season.
 * @param limitCount Number of users to fetch
 * @param examType Optional filter for exam category (e.g., 'JEE Mains', 'NEET')
 * @param sortBy Metric to sort by ('totalScore' or 'xp')
 */
export const getLeaderboard = async (
    limitCount = 50,
    examType?: string,
    sortBy: 'totalScore' | 'xp' = 'totalScore'
): Promise<LeaderboardEntry[]> => {
    const seasonKey = getCurrentSeasonKey();
    const usersRef = collection(db, 'leaderboards', seasonKey, 'users');

    // Always query top first based on requested metric
    const baseQuery = query(
        usersRef,
        orderBy(sortBy, 'desc'),
        limit(100) // Fetch strict superset
    );

    try {
        const snap = await getDocs(baseQuery);
        let entries = snap.docs.map(d => ({
            ...d.data(),
            // Temporary rank, will be re-assigned after filter
            rank: 0
        } as LeaderboardEntry));

        // Filter if needed
        if (examType && examType !== 'All') {
            entries = entries.filter(e => e.examType === examType);
        }

        // Re-assign ranks and slice
        return entries.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, limitCount);

    } catch (e: any) {
        console.error("Leaderboard fetch failed:", e);
        return [];
    }
};


/**
 * Get a specific user's rank/stats for the current season
 */
export const getUserStats = async (userId: string): Promise<LeaderboardEntry | null> => {
    const seasonKey = getCurrentSeasonKey(); // "2026-02"
    const docRef = doc(db, 'leaderboards', seasonKey, 'users', userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
        return snap.data() as LeaderboardEntry;
    }

    // FALLBACK: Try unpadded month if today is in February/March 2026 (Migration window)
    const [year, month] = seasonKey.split('-');
    if (month.startsWith('0')) {
        const fallbackKey = `${year}-${parseInt(month)}`; // "2026-2"
        const fallbackRef = doc(db, 'leaderboards', fallbackKey, 'users', userId);
        const fallbackSnap = await getDoc(fallbackRef);
        if (fallbackSnap.exists()) {
            console.log(`[leaderboardService] Found fallback stats in ${fallbackKey}`);
            return fallbackSnap.data() as LeaderboardEntry;
        }
    }

    return null;
};

/**
 * DEV ONLY: Clears the current season's leaderboard.
 */
/**
 * Calculates a realistic "Predicted All India Rank" (AIR) based on score percentage.
 * Uses historical data trends for JEE Mains and NEET.
 */
export const calculatePredictedRank = (percentage: number, examType: string = 'JEE Mains') => {
    // 1. Normalize Exam Type
    const type = examType.toLowerCase();
    const isNEET = type.includes('neet') || type.includes('medical');
    // JEE is default fallback if not NEET

    // 2. Define Total Candidates (Approx 2025-26 Stats)
    const candidates = isNEET ? 2500000 : 1400000;

    // 3. Define Rank Brackets (Percentage -> Rank)
    // Interpolation Logic: Higher brackets have steeper gradients
    let predictedRank = candidates;

    if (isNEET) {
        // NEET (High cutoff, bunching at top)
        if (percentage >= 99) predictedRank = 1 + (100 - percentage) * 50; // 713+ -> Top 50
        else if (percentage >= 95) predictedRank = 50 + (99 - percentage) * 1000; // 684+ -> Top 4k
        else if (percentage >= 90) predictedRank = 4000 + (95 - percentage) * 3000; // 648+ -> Top 20k
        else if (percentage >= 80) predictedRank = 20000 + (90 - percentage) * 5000; // 576+ -> Top 70k
        else if (percentage >= 50) predictedRank = 70000 + (80 - percentage) * 15000;
        else predictedRank = 600000 + (50 - percentage) * 40000;
    } else {
        // JEE Mains (Harder exam, lower % for good rank)
        if (percentage >= 95) predictedRank = 1 + (100 - percentage) * 200; // 285+ -> Top 1000
        else if (percentage >= 90) predictedRank = 1000 + (95 - percentage) * 2000; // 270+ -> Top 11k
        else if (percentage >= 80) predictedRank = 11000 + (90 - percentage) * 3000; // 240+ -> Top 40k
        else if (percentage >= 60) predictedRank = 41000 + (80 - percentage) * 5000; // 180+ -> Top 140k
        else if (percentage >= 40) predictedRank = 141000 + (60 - percentage) * 10000;
        else predictedRank = 400000 + (40 - percentage) * 20000;
    }

    return Math.max(1, Math.round(predictedRank));
};


/**
 * Migrates leaderboard data from an old UID to a new UID.
 * This is used when a user switches login providers (e.g. Email -> Google).
 */
export const migrateLeaderboardData = async (oldUserId: string, newUserId: string) => {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return;

    const seasonKey = getCurrentSeasonKey();
    const oldRef = doc(db, 'leaderboards', seasonKey, 'users', oldUserId);
    const newRef = doc(db, 'leaderboards', seasonKey, 'users', newUserId);

    try {
        await runTransaction(db, async (transaction) => {
            const oldSnap = await transaction.get(oldRef);
            if (!oldSnap.exists()) return;

            const oldData = oldSnap.data();
            const newSnap = await transaction.get(newRef);
            const newData = newSnap.exists() ? newSnap.data() : { totalScore: 0, testsTaken: 0 };

            // Merge scores
            transaction.set(newRef, {
                ...oldData,
                userId: newUserId,
                totalScore: (oldData.totalScore || 0) + (newData.totalScore || 0),
                testsTaken: (oldData.testsTaken || 0) + (newData.testsTaken || 0),
                lastUpdated: serverTimestamp(),
                migration_source: oldUserId
            }, { merge: true });

            // Delete old entry to prevent double counting
            transaction.delete(oldRef);
        });
        console.log(`[leaderboardService] Successfully migrated leaderboard data from ${oldUserId} to ${newUserId}`);
    } catch (e) {
        console.error("[leaderboardService] Migration failed:", e);
    }
};

export const resetLeaderboard = async () => {
    const seasonKey = getCurrentSeasonKey();
    const usersRef = collection(db, 'leaderboards', seasonKey, 'users');
    const snap = await getDocs(usersRef);

    // Batch delete
    const batch = writeBatch(db);
    snap.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleared leaderboard for ${seasonKey}`);
    return snap.size;
};
