// Topic Strength Tracking Service
// Tracks user's performance per topic in Firestore

import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    orderBy,
    // limit - Unused
} from 'firebase/firestore';

export interface TopicStat {
    id: string;
    user_id: string;
    topic: string;
    subject: string;
    correct_count: number;
    total_attempts: number;
    score_percentage: number;
    last_attempt: string;
    status: 'weak' | 'improving' | 'strong';
    user_class?: string;
    target_exam?: string;
}

// Update topic strength after answering a question
export const updateTopicStrength = async (
    userId: string,
    topic: string,
    subject: string,
    isCorrect: boolean,
    userClass?: string,
    targetExam?: string
): Promise<void> => {
    if (!userId || !topic) return;

    const cleanTopic = topic.trim();
    const cleanSubject = subject?.trim() || 'General';
    const cleanClass = userClass || 'General';
    const cleanExam = targetExam || 'General';

    // Create a consistent document ID (Composite Key for Isolation)
    // Format: userId_class_exam_topic
    const docId = `${userId}_${cleanClass}_${cleanExam}_${cleanTopic.toLowerCase().replace(/\s+/g, '_')}`;
    const docRef = doc(db, 'user_topic_stats', docId);

    try {
        // Get existing stats
        // We can just get by docId since it's unique enough now
        const snap = await import('firebase/firestore').then(mod => mod.getDoc(docRef));

        let correctCount = isCorrect ? 1 : 0;
        let totalAttempts = 1;

        if (snap.exists()) {
            const existing = snap.data();
            correctCount = (existing.correct_count || 0) + (isCorrect ? 1 : 0);
            totalAttempts = (existing.total_attempts || 0) + 1;
        }

        const percentage = Math.round((correctCount / totalAttempts) * 100);

        // Determine status based on percentage and trend
        let status: 'weak' | 'improving' | 'strong' = 'weak';
        if (percentage >= 75) {
            status = 'strong';
        } else if (percentage >= 50) {
            status = 'improving';
        }

        const statData: Omit<TopicStat, 'id'> = {
            user_id: userId,
            topic: cleanTopic,
            subject: cleanSubject,
            correct_count: correctCount,
            total_attempts: totalAttempts,
            score_percentage: percentage,
            last_attempt: new Date().toISOString(),
            status,
            user_class: userClass,
            target_exam: targetExam
        };

        await setDoc(docRef, statData, { merge: true });

    } catch (e) {
        console.error('Failed to update topic strength:', e);
    }
};

// Batch update topics after a test
export const batchUpdateTopicStrength = async (
    userId: string,
    questions: Array<{ topic: string; subject?: string; isCorrect: boolean }>,
    userClass?: string,
    targetExam?: string
): Promise<void> => {
    // Group by topic to aggregate stats
    const topicResults: Record<string, { subject: string; correct: number; total: number }> = {};

    questions.forEach(q => {
        const topic = q.topic?.trim() || 'General';
        if (!topicResults[topic]) {
            topicResults[topic] = { subject: q.subject || 'General', correct: 0, total: 0 };
        }
        topicResults[topic].total++;
        if (q.isCorrect) topicResults[topic].correct++;
    });

    // Update each topic
    for (const [topic, stats] of Object.entries(topicResults)) {
        for (let i = 0; i < stats.total; i++) {
            await updateTopicStrength(
                userId,
                topic,
                stats.subject,
                i < stats.correct, // First 'correct' count items are marked correct
                userClass,
                targetExam
            );
        }
    }
};

// Get user's weak topics (score < 50%)
// Filtered by user_id, class, and exam
export const getWeakTopics = async (
    userId: string,
    maxCount: number = 5,
    userClass?: string,
    targetExam?: string
): Promise<TopicStat[]> => {
    if (!userId) return [];

    try {
        let q = query(
            collection(db, 'user_topic_stats'),
            where('user_id', '==', userId)
        );

        // Add optional filters if provided
        if (userClass) {
            q = query(q, where('user_class', '==', userClass));
        }

        if (targetExam) {
            q = query(q, where('target_exam', '==', targetExam));
        }

        const snap = await getDocs(q);
        const allStats = snap.docs.map(d => ({ id: d.id, ...d.data() } as TopicStat));

        // Client-side filtering and sorting
        return allStats
            .filter(s => s.status === 'weak' || s.score_percentage < 50)
            .sort((a, b) => a.score_percentage - b.score_percentage)
            .slice(0, maxCount);

    } catch (e) {
        console.error('Failed to get weak topics:', e);
        return [];
    }
};

// Get user's strong topics (score >= 75%)
// Filtered by user_id, class, and exam
export const getStrongTopics = async (
    userId: string,
    maxCount: number = 5,
    userClass?: string,
    targetExam?: string
): Promise<TopicStat[]> => {
    if (!userId) return [];

    try {
        let q = query(
            collection(db, 'user_topic_stats'),
            where('user_id', '==', userId)
        );

        // Add optional filters if provided
        if (userClass) {
            q = query(q, where('user_class', '==', userClass));
        }

        if (targetExam) {
            q = query(q, where('target_exam', '==', targetExam));
        }

        const snap = await getDocs(q);
        const allStats = snap.docs.map(d => ({ id: d.id, ...d.data() } as TopicStat));

        // Client-side filtering and sorting
        return allStats
            .filter(s => s.status === 'strong' || s.score_percentage >= 75)
            .sort((a, b) => b.score_percentage - a.score_percentage)
            .slice(0, maxCount);

    } catch (e) {
        console.error('Failed to get strong topics:', e);
        return [];
    }
};

// Get all topic stats for a user
export const getAllTopicStats = async (userId: string): Promise<TopicStat[]> => {
    if (!userId) return [];

    try {
        const q = query(
            collection(db, 'user_topic_stats'),
            where('user_id', '==', userId),
            orderBy('last_attempt', 'desc')
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as TopicStat));

    } catch (e) {
        console.error('Failed to get topic stats:', e);
        return [];
    }
};


// Migrate topic stats between UIDs
export const migrateTopicStats = async (oldUserId: string, newUserId: string): Promise<void> => {
    if (!oldUserId || !newUserId || oldUserId === newUserId) return;

    try {
        const q = query(collection(db, 'user_topic_stats'), where('user_id', '==', oldUserId));
        const snap = await getDocs(q);

        if (snap.empty) return;

        const writeBatch = (await import('firebase/firestore')).writeBatch;
        const batch = writeBatch(db);

        snap.docs.forEach(d => {
            const data = d.data();
            const topic = data.topic;
            // Reconstruct new doc ID with new userId but keep class/exam
            const cleanClass = data.user_class || 'General';
            const cleanExam = data.target_exam || 'General';
            const docId = `${newUserId}_${cleanClass}_${cleanExam}_${topic.toLowerCase().replace(/\s+/g, '_')}`;

            const newRef = doc(db, 'user_topic_stats', docId);

            batch.set(newRef, { ...data, user_id: newUserId }, { merge: true });
            batch.delete(d.ref);
        });

        await batch.commit();
        console.log(`[topicStrengthService] Migrated ${snap.size} topic records to ${newUserId}`);
    } catch (e) {
        console.error('Migration failed:', e);
    }
};

// Quick update for single question (used during test)
export const recordQuestionResult = async (
    userId: string,
    topic: string,
    subject: string,
    isCorrect: boolean,
    userClass?: string,
    targetExam?: string
): Promise<void> => {
    await updateTopicStrength(userId, topic, subject, isCorrect, userClass, targetExam);
};
