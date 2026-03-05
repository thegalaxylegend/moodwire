import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getCurrentSeasonKey } from './leaderboardService';
import { batchUpdateTopicStrength } from './topicStrengthService';

/**
 * Sync Service
 * Recalculates leaderboard scores from historical mock_attempts.
 * This fixes the "Missing Old Data" issue.
 */
export const syncHistoricalScoresToLeaderboard = async (userId: string, userProfile: { displayName: string, avatar?: string }) => {
    if (!userId) return;

    console.log(`[SyncService] Starting score sync for ${userId}...`);
    const seasonKey = getCurrentSeasonKey();
    const [year, month] = seasonKey.split('-');

    // Define the start of the current season (month) to avoid double-counting old seasons
    const seasonStart = new Date(parseInt(year), parseInt(month) - 1, 1);

    try {
        // 1. Fetch all mock attempts for THIS user in THIS season
        const mockQ = query(
            collection(db, 'mock_attempts'),
            where('user_id', '==', userId)
        );

        const mockSnap = await getDocs(mockQ);
        if (mockSnap.empty) {
            console.log("[SyncService] No mock attempts found to sync.");
            return;
        }

        // Filter for current month client-side (easier than complex Firestore range queries if indexes aren't ready)
        const currentMonthAttempts = mockSnap.docs.filter(d => {
            const data = d.data();
            const date = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at);
            return date >= seasonStart;
        });

        if (currentMonthAttempts.length === 0) {
            console.log("[SyncService] No attempts found for the current month.");
            return;
        }

        const totalHistoricalScore = currentMonthAttempts.reduce((sum, doc) => sum + (doc.data().score || 0), 0);
        const totalHistoricalTests = currentMonthAttempts.length;

        console.log(`[SyncService] Found ${totalHistoricalTests} tests with ${totalHistoricalScore} total points for this month.`);

        // 2. Perform Atomic Update to Leaderboard
        const leaderboardRef = doc(db, 'leaderboards', seasonKey, 'users', userId);

        await runTransaction(db, async (transaction) => {
            await transaction.get(leaderboardRef);

            // We set (not merge-sum) because we want to RE-SYNC the whole month's progress 
            // from the source of truth (mock_attempts).
            // However, this might overwrite scores from "Quick tests" if those weren't in mock_attempts.
            // Wait, MockGenerator DOES save to mock_attempts.

            transaction.set(leaderboardRef, {
                userId,
                user: {
                    displayName: userProfile.displayName || 'Anonymous',
                    avatar: userProfile.avatar || null
                },
                totalScore: totalHistoricalScore, // Full rebuild from attempts
                testsTaken: totalHistoricalTests,
                lastUpdated: serverTimestamp(),
                syncedAt: serverTimestamp()
            }, { merge: true });
        });

        console.log(`[SyncService] Successfully synced ${totalHistoricalScore} points to leaderboard.`);
        return totalHistoricalScore;

    } catch (e) {
        console.error("[SyncService] Sync failed:", e);
        throw e;
    }
};

/**
 * Auto-Syllabus Completion
 * Marks topics as completed in Firestore if accuracy is high.
 */
export const markTopicsAsCompletedFromResults = async (userId: string, results: Array<{ topic: string, isCorrect: boolean }>) => {
    if (!userId || !results.length) return;

    // Group results by topic
    const topicStats: Record<string, { correct: number, total: number }> = {};
    results.forEach(r => {
        if (!topicStats[r.topic]) topicStats[r.topic] = { correct: 0, total: 0 };
        topicStats[r.topic].total++;
        if (r.isCorrect) topicStats[r.topic].correct++;
    });

    const batch = writeBatch(db);
    let updatedCount = 0;

    for (const [topic, stats] of Object.entries(topicStats)) {
        const accuracy = (stats.correct / stats.total) * 100;

        // Threshold for Auto-Mastery: 70% accuracy
        if (accuracy >= 70) {
            const docId = `${userId}_${topic.toLowerCase().replace(/\s+/g, '_')}`;
            const syllabusRef = doc(db, 'syllabus', docId);

            batch.set(syllabusRef, {
                user_id: userId,
                topic: topic,
                is_completed: true,
                completed_at: serverTimestamp(),
                source: 'mock_test_auto'
            }, { merge: true });
            updatedCount++;
        }
    }

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`[SyncService] Auto-marked ${updatedCount} topics as completed.`);
    }
};

/**
 * Deep Sync: Syllabus from Mocks
 * Scans ALL historical mocks and marks topics as completed if they meet the threshold.
 */
export const syncSyllabusFromMocks = async (userId: string) => {
    if (!userId) return;

    console.log(`[SyncService] Starting deep syllabus sync for ${userId}...`);
    try {
        const mockQ = query(collection(db, 'mock_attempts'), where('user_id', '==', userId));
        const mockSnap = await getDocs(mockQ);

        if (mockSnap.empty) return;

        // Collect all question results from all mocks
        const allResults: Array<{ topic: string, isCorrect: boolean }> = [];

        mockSnap.docs.forEach(d => {
            const data = d.data();
            const details = data.details;
            if (details && Array.isArray(details.questions) && Array.isArray(details.answers)) {
                details.questions.forEach((q: any, i: number) => {
                    allResults.push({
                        topic: q.topic,
                        isCorrect: details.answers[i] === q.correctAnswer
                    });
                });
            }
        });

        if (allResults.length > 0) {
            await markTopicsAsCompletedFromResults(userId, allResults);
        }

    } catch (e) {
        console.error("[SyncService] Deep syllabus sync failed:", e);
    }
};

/**
 * Deep Sync: AI Profile (user_topic_stats) from Mocks
 * Scans ALL historical mocks and rebuilds the topic strength profile.
 * Crucial for old users who bypassed the diagnostic test to still get personalized AI recommendations.
 */
export const syncTopicStatsFromMocks = async (userId: string, userClass?: string, targetExam?: string) => {
    if (!userId) return;

    console.log(`[SyncService] Starting deep AI Profile (Topic Stats) sync for ${userId}...`);
    try {
        const mockQ = query(collection(db, 'mock_attempts'), where('user_id', '==', userId));
        const mockSnap = await getDocs(mockQ);

        if (mockSnap.empty) {
            console.log("[SyncService] No mock history found to rebuild AI profile.");
            return;
        }

        // Collect all question results from all mocks to reconstruct the AI profile
        const allQuestionsToSync: Array<{ topic: string, subject?: string, isCorrect: boolean, errorType?: any }> = [];

        mockSnap.docs.forEach(d => {
            const data = d.data();
            const details = data.details;
            if (details && Array.isArray(details.questions) && Array.isArray(details.answers)) {
                details.questions.forEach((q: any, i: number) => {
                    allQuestionsToSync.push({
                        topic: q.topic || 'General',
                        subject: q.subject || 'General',
                        isCorrect: details.answers[i] === q.correctAnswer
                    });
                });
            }
        });

        if (allQuestionsToSync.length > 0) {
            console.log(`[SyncService] Rebuilding AI Profile from ${allQuestionsToSync.length} historical questions...`);
            await batchUpdateTopicStrength(userId, allQuestionsToSync, userClass, targetExam);
            console.log(`[SyncService] AI Profile rebuilt successfully.`);
        }

    } catch (e) {
        console.error("[SyncService] Deep AI Profile sync failed:", e);
    }
};
