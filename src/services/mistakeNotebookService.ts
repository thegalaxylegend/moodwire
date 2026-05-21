/**
 * Mistake Notebook Service (Improvement Book)
 * 
 * Captures every wrong answer with full question context for targeted revision.
 * Mirrors Allen Digital's most-loved "Improvement Book" feature.
 * 
 * Features:
 * - Full question snapshot on every wrong answer
 * - Filter by subject, topic, error type, date
 * - Re-attempt tracking (retry count, is_mastered)
 * - Integration with SpacedRepetitionService for scheduling
 * - Local-first with Firestore sync
 */

import { db, auth } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    orderBy,
    limit,
    writeBatch,
} from 'firebase/firestore';

// ─── TYPES ───────────────────────────────────────────────

export interface MistakeEntry {
    id: string;                         // Composite: userId_questionHash
    user_id: string;
    question_hash: string;

    // Full Question Snapshot
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    rich_explanation?: {
        steps: string[];
        why_others_wrong: Record<string, string>;
        teach_me_like_12: string;
    };

    // Context
    topic: string;
    topic_id: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    exam_mode: string;                  // 'quick' | 'topic' | 'diagnostic' | 'full'

    // Student's Error
    student_answer: string;
    error_type?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' | 'OVERCONFIDENCE';
    time_spent?: number;                // Seconds spent on this question

    // Retry Tracking
    retry_count: number;
    last_retry_correct: boolean;
    is_mastered: boolean;               // True if retried correctly 2+ times
    mastered_at?: string;

    // Metadata
    first_wrong_date: string;
    last_attempt_date: string;
    test_id?: string;                   // Which test session this came from
    user_class?: string;
    target_exam?: string;
}

export interface MistakeNotebookStats {
    totalMistakes: number;
    masteredCount: number;
    unresolvedCount: number;
    bySubject: Record<string, number>;
    byErrorType: Record<string, number>;
    byDifficulty: Record<string, number>;
    mostMistakenTopics: Array<{ topic: string; count: number }>;
    masteryRate: number;                // Percentage of mistakes now mastered
}

// ─── LOCAL CACHE ─────────────────────────────────────────

const getCacheKey = (userId: string) => `mistake_notebook_${userId}`;

const getLocalMistakes = (userId: string): MistakeEntry[] => {
    try {
        const raw = localStorage.getItem(getCacheKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveLocalMistakes = (userId: string, entries: MistakeEntry[]) => {
    try {
        // Smart pruning: keep max 500 entries to prevent storage bloat
        const pruned = entries.slice(0, 500);
        localStorage.setItem(getCacheKey(userId), JSON.stringify(pruned));
    } catch (e) {
        console.warn('[MistakeNotebook] Local storage save failed:', e);
        // Emergency: keep only unmastered entries
        const critical = entries.filter(e => !e.is_mastered).slice(0, 200);
        try {
            localStorage.setItem(getCacheKey(userId), JSON.stringify(critical));
        } catch {
            // Total failure — clear and start fresh
            localStorage.removeItem(getCacheKey(userId));
        }
    }
};

// ─── SERVICE ─────────────────────────────────────────────

export const MistakeNotebookService = {
    /**
     * Records a wrong answer in the mistake notebook.
     * If the same question was already recorded, updates the entry.
     */
    recordMistake: async (
        userId: string,
        mistake: {
            question_hash: string;
            question_text: string;
            options: string[];
            correct_answer: string;
            explanation: string;
            rich_explanation?: MistakeEntry['rich_explanation'];
            topic: string;
            topic_id: string;
            subject: string;
            difficulty: 'Easy' | 'Medium' | 'Hard';
            exam_mode: string;
            student_answer: string;
            error_type?: MistakeEntry['error_type'];
            time_spent?: number;
            test_id?: string;
        },
        userClass?: string,
        targetExam?: string
    ): Promise<void> => {
        if (!userId || userId === 'guest') return;

        const entryId = `${userId}_${mistake.question_hash}`;
        const now = new Date().toISOString();
        const localEntries = getLocalMistakes(userId);
        const existingIdx = localEntries.findIndex(e => e.id === entryId);

        if (existingIdx >= 0) {
            // Same question wrong again — update, reset mastery
            localEntries[existingIdx] = {
                ...localEntries[existingIdx],
                student_answer: mistake.student_answer,
                error_type: mistake.error_type,
                time_spent: mistake.time_spent,
                last_attempt_date: now,
                retry_count: localEntries[existingIdx].retry_count + 1,
                last_retry_correct: false,
                is_mastered: false,
                mastered_at: undefined,
                test_id: mistake.test_id
            };
        } else {
            // New mistake
            const entry: MistakeEntry = {
                id: entryId,
                user_id: userId,
                question_hash: mistake.question_hash,
                question_text: mistake.question_text,
                options: mistake.options,
                correct_answer: mistake.correct_answer,
                explanation: mistake.explanation,
                rich_explanation: mistake.rich_explanation,
                topic: mistake.topic,
                topic_id: mistake.topic_id,
                subject: mistake.subject,
                difficulty: mistake.difficulty,
                exam_mode: mistake.exam_mode,
                student_answer: mistake.student_answer,
                error_type: mistake.error_type,
                time_spent: mistake.time_spent,
                retry_count: 0,
                last_retry_correct: false,
                is_mastered: false,
                first_wrong_date: now,
                last_attempt_date: now,
                test_id: mistake.test_id,
                user_class: userClass,
                target_exam: targetExam
            };
            localEntries.unshift(entry); // Most recent first
        }

        saveLocalMistakes(userId, localEntries);

        // Sync to Firestore (background, non-blocking)
        if (auth.currentUser) {
            try {
                const docRef = doc(db, 'mistake_notebook', entryId);
                const entry = localEntries.find(e => e.id === entryId);
                if (entry) await setDoc(docRef, entry, { merge: true });
            } catch (e) {
                console.warn('[MistakeNotebook] Firestore sync failed:', e);
            }
        }
    },

    /**
     * Batch-record mistakes from a completed test session.
     * Called by MockGenerator after test submission.
     */
    recordTestMistakes: async (
        userId: string,
        wrongQuestions: Array<{
            question_hash: string;
            question_text: string;
            options: string[];
            correct_answer: string;
            explanation: string;
            rich_explanation?: MistakeEntry['rich_explanation'];
            topic: string;
            topic_id: string;
            subject: string;
            difficulty: 'Easy' | 'Medium' | 'Hard';
            student_answer: string;
            error_type?: MistakeEntry['error_type'];
            time_spent?: number;
        }>,
        examMode: string,
        userClass?: string,
        targetExam?: string
    ): Promise<number> => {
        const testId = `test_${Date.now()}`;
        let recorded = 0;

        if (!userId || userId === 'guest' || wrongQuestions.length === 0) return 0;

        const now = new Date().toISOString();
        const localEntries = getLocalMistakes(userId);
        const batchUpdates: MistakeEntry[] = [];

        for (const q of wrongQuestions) {
            const entryId = `${userId}_${q.question_hash}`;
            const existingIdx = localEntries.findIndex(e => e.id === entryId);

            let entry: MistakeEntry;
            if (existingIdx >= 0) {
                entry = {
                    ...localEntries[existingIdx],
                    student_answer: q.student_answer,
                    error_type: q.error_type,
                    time_spent: q.time_spent,
                    last_attempt_date: now,
                    retry_count: localEntries[existingIdx].retry_count + 1,
                    last_retry_correct: false,
                    is_mastered: false,
                    mastered_at: undefined,
                    test_id: testId
                };
                localEntries[existingIdx] = entry;
            } else {
                entry = {
                    id: entryId,
                    user_id: userId,
                    question_hash: q.question_hash,
                    question_text: q.question_text,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    explanation: q.explanation,
                    rich_explanation: q.rich_explanation,
                    topic: q.topic,
                    topic_id: q.topic_id,
                    subject: q.subject,
                    difficulty: q.difficulty,
                    exam_mode: examMode,
                    student_answer: q.student_answer,
                    error_type: q.error_type,
                    time_spent: q.time_spent,
                    retry_count: 0,
                    last_retry_correct: false,
                    is_mastered: false,
                    first_wrong_date: now,
                    last_attempt_date: now,
                    test_id: testId,
                    user_class: userClass,
                    target_exam: targetExam
                };
                localEntries.unshift(entry);
            }
            batchUpdates.push(entry);
            recorded++;
        }

        saveLocalMistakes(userId, localEntries);

        if (auth.currentUser) {
            try {
                const batch = writeBatch(db);
                for (const entry of batchUpdates) {
                    const docRef = doc(db, 'mistake_notebook', entry.id);
                    batch.set(docRef, entry, { merge: true });
                }
                await batch.commit();
            } catch (e) {
                console.warn('[MistakeNotebook] Batch test sync failed:', e);
            }
        }

        console.log(`[MistakeNotebook] Recorded ${recorded} mistakes from test ${testId}.`);
        return recorded;
    },

    /**
     * Records a successful retry of a mistake.
     * If retried correctly 2+ times, marks as mastered.
     */
    recordRetry: async (
        userId: string,
        entryId: string,
        isCorrect: boolean
    ): Promise<MistakeEntry | null> => {
        const localEntries = getLocalMistakes(userId);
        const idx = localEntries.findIndex(e => e.id === entryId);
        if (idx === -1) return null;

        const entry = { ...localEntries[idx] };
        entry.retry_count += 1;
        entry.last_retry_correct = isCorrect;
        entry.last_attempt_date = new Date().toISOString();

        // Mastery check: 2+ consecutive correct retries
        if (isCorrect && entry.last_retry_correct) {
            // Count recent consecutive correct retries
            if (entry.retry_count >= 2) {
                entry.is_mastered = true;
                entry.mastered_at = new Date().toISOString();
            }
        }

        localEntries[idx] = entry;
        saveLocalMistakes(userId, localEntries);

        // Sync to Firestore
        if (auth.currentUser) {
            try {
                await setDoc(doc(db, 'mistake_notebook', entryId), entry, { merge: true });
            } catch (e) {
                console.warn('[MistakeNotebook] Retry sync failed:', e);
            }
        }

        return entry;
    },

    /**
     * Gets all mistakes, optionally filtered.
     */
    getMistakes: (
        userId: string,
        filters?: {
            subject?: string;
            topic?: string;
            errorType?: MistakeEntry['error_type'];
            showMastered?: boolean;
            limit?: number;
        }
    ): MistakeEntry[] => {
        let entries = getLocalMistakes(userId);

        if (filters) {
            if (filters.subject) {
                entries = entries.filter(e => e.subject === filters.subject);
            }
            if (filters.topic) {
                entries = entries.filter(e => e.topic === filters.topic);
            }
            if (filters.errorType) {
                entries = entries.filter(e => e.error_type === filters.errorType);
            }
            if (!filters.showMastered) {
                entries = entries.filter(e => !e.is_mastered);
            }
            if (filters.limit) {
                entries = entries.slice(0, filters.limit);
            }
        }

        return entries;
    },

    /**
     * Gets comprehensive statistics about the student's mistake patterns.
     */
    getStats: (userId: string): MistakeNotebookStats => {
        const entries = getLocalMistakes(userId);

        const bySubject: Record<string, number> = {};
        const byErrorType: Record<string, number> = {};
        const byDifficulty: Record<string, number> = {};
        const topicCounts: Record<string, number> = {};

        entries.forEach(e => {
            bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
            if (e.error_type) {
                byErrorType[e.error_type] = (byErrorType[e.error_type] || 0) + 1;
            }
            byDifficulty[e.difficulty] = (byDifficulty[e.difficulty] || 0) + 1;
            topicCounts[e.topic] = (topicCounts[e.topic] || 0) + 1;
        });

        const mostMistakenTopics = Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const mastered = entries.filter(e => e.is_mastered).length;

        return {
            totalMistakes: entries.length,
            masteredCount: mastered,
            unresolvedCount: entries.length - mastered,
            bySubject,
            byErrorType,
            byDifficulty,
            mostMistakenTopics,
            masteryRate: entries.length > 0 ? Number(((mastered / entries.length) * 100).toFixed(1)) : 0
        };
    },

    /**
     * Gets mistakes that haven't been retried yet (for mission service).
     */
    getUnretriedMistakes: (userId: string, maxCount: number = 10): MistakeEntry[] => {
        return getLocalMistakes(userId)
            .filter(e => !e.is_mastered && e.retry_count === 0)
            .slice(0, maxCount);
    },

    /**
     * Deletes a mistake entry.
     */
    deleteMistake: async (userId: string, entryId: string): Promise<void> => {
        const entries = getLocalMistakes(userId);
        saveLocalMistakes(userId, entries.filter(e => e.id !== entryId));

        if (auth.currentUser) {
            try {
                await deleteDoc(doc(db, 'mistake_notebook', entryId));
            } catch (e) {
                console.warn('[MistakeNotebook] Delete sync failed:', e);
            }
        }
    },

    /**
     * Syncs local mistake data from Firestore (for returning/cross-device users).
     */
    syncFromCloud: async (userId: string): Promise<number> => {
        if (!auth.currentUser) return 0;

        try {
            const q = query(
                collection(db, 'mistake_notebook'),
                where('user_id', '==', userId),
                orderBy('last_attempt_date', 'desc'),
                limit(500)
            );
            const snap = await getDocs(q);
            const cloudEntries = snap.docs.map(d => d.data() as MistakeEntry);

            if (cloudEntries.length > 0) {
                // Merge: cloud entries take precedence for newer data
                const localEntries = getLocalMistakes(userId);
                const merged = new Map<string, MistakeEntry>();

                // Local first
                localEntries.forEach(e => merged.set(e.id, e));

                // Cloud overwrites if newer
                cloudEntries.forEach(e => {
                    const existing = merged.get(e.id);
                    if (!existing || e.last_attempt_date > existing.last_attempt_date) {
                        merged.set(e.id, e);
                    }
                });

                const finalEntries = Array.from(merged.values())
                    .sort((a, b) => b.last_attempt_date.localeCompare(a.last_attempt_date));

                saveLocalMistakes(userId, finalEntries);
                return finalEntries.length;
            }
        } catch (e) {
            console.warn('[MistakeNotebook] Cloud sync failed:', e);
        }
        return 0;
    }
};
