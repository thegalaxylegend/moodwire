import { db } from './lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { migrateLeaderboardData } from './services/leaderboardService';
import { migrateTopicStats } from './services/topicStrengthService';
import { migrateSavedLecturesCloud } from './services/savedLectureService';

/**
 * Migration Service
 * Deep-moves all user data between Firestore UIDs.
 * Used for merging split accounts (Email/Password -> Google).
 */
export const performDeepMigration = async (oldUserId: string, newUserId: string) => {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return;

    console.log(`[Migration] Starting deep migration from ${oldUserId} to ${newUserId}`);

    // 1. Migrate Leaderboard (Async)
    migrateLeaderboardData(oldUserId, newUserId);

    // 2. Migrate Topic Stats (Async)
    migrateTopicStats(oldUserId, newUserId);

    // 2b. Migrate Saved Lectures (Async)
    migrateSavedLecturesCloud(oldUserId, newUserId);

    // 3. Migrate Mock Attempts
    try {
        const mockSnap = await getDocs(query(collection(db, 'mock_attempts'), where('user_id', '==', oldUserId)));
        if (!mockSnap.empty) {
            const batch = writeBatch(db);
            mockSnap.docs.forEach(d => {
                batch.set(doc(db, 'mock_attempts', d.id), { ...d.data(), user_id: newUserId }, { merge: true });
                batch.delete(d.ref);
            });
            await batch.commit();
            console.log(`[Migration] Moved ${mockSnap.size} mock attempts.`);
        }
    } catch (e) { console.error("[Migration] Mock attempts failed:", e); }

    // 4. Migrate Syllabus Progress
    try {
        const syllabusSnap = await getDocs(query(collection(db, 'syllabus'), where('user_id', '==', oldUserId)));
        if (!syllabusSnap.empty) {
            const batch = writeBatch(db);
            syllabusSnap.docs.forEach(d => {
                batch.set(doc(db, 'syllabus', d.id), { ...d.data(), user_id: newUserId }, { merge: true });
                batch.delete(d.ref);
            });
            await batch.commit();
            console.log(`[Migration] Moved ${syllabusSnap.size} syllabus items.`);
        }
    } catch (e) { console.error("[Migration] Syllabus failed:", e); }

    // 5. Migrate Diagnostic Results
    try {
        const diagSnap = await getDocs(query(collection(db, 'diagnostic_results'), where('user_id', '==', oldUserId)));
        if (!diagSnap.empty) {
            const batch = writeBatch(db);
            diagSnap.docs.forEach(d => {
                batch.set(doc(db, 'diagnostic_results', d.id), { ...d.data(), user_id: newUserId }, { merge: true });
                batch.delete(d.ref);
            });
            await batch.commit();
            console.log(`[Migration] Moved ${diagSnap.size} diagnostic results.`);
        }
    } catch (e) { console.error("[Migration] Diagnostic failed:", e); }

    console.log("[Migration] Deep migration complete.");
    window.dispatchEvent(new CustomEvent('migration-complete'));
};
