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

    // Advanced Metrics
    avg_time?: number;          // Average time spent in seconds
    last_5_accuracy?: number;   // Accuracy of last 5 attempts
    last_5_results?: boolean[]; // History for last_5_accuracy
    easy_failures?: number;     // Count of failures on easy questions
    repeated_mistakes?: number; // Count of repeated mistakes on same topic
    misconception_tags?: string[];
    weakness_score?: number;     // Calculated score

    // Error Pattern Intelligence (AI 2.0)
    last_error_type?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' | 'OVERCONFIDENCE';
    error_analysis?: {
        conceptualCount: number;
        sillyCount: number;
        timePressureCount: number;
        misreadCount: number;
        totalErrors: number;
    };
}

// Calculate weakness score based on the formula:
// weakness_score = (1 - total_accuracy) * 0.3 + (1 - last_5_accuracy) * 0.2 + time_penalty * 0.15 + easy_failure_penalty * 0.15 + error_pattern_penalty * 0.2
export const calculateWeaknessScore = (stat: Partial<TopicStat>): number => {
    const totalAccuracy = (stat.total_attempts || 0) > 0 ? (stat.correct_count || 0) / (stat.total_attempts || 1) : 1;
    const last5Accuracy = stat.last_5_accuracy !== undefined ? stat.last_5_accuracy : totalAccuracy;

    // Normalize penalties to 0-1 range
    const timePenalty = Math.min((stat.avg_time || 0) / 120, 1);
    const easyFailurePenalty = Math.min((stat.easy_failures || 0) / (stat.total_attempts || 1), 1);

    // Error pattern penalty: focus on conceptual mistakes
    const conceptualRatio = (stat.error_analysis?.conceptualCount || 0) / (stat.error_analysis?.totalErrors || 1);
    const sillyRatio = (stat.error_analysis?.sillyCount || 0) / (stat.error_analysis?.totalErrors || 1);
    const errorPenalty = (conceptualRatio * 0.8) + (sillyRatio * 0.2); // Conceptual is worse than silly

    const score =
        (1 - totalAccuracy) * 0.30 +
        (1 - last5Accuracy) * 0.20 +
        timePenalty * 0.15 +
        easyFailurePenalty * 0.15 +
        errorPenalty * 0.20;

    return Number(score.toFixed(3));
};

// Update topic strength after answering a question
export const updateTopicStrength = async (
    userId: string,
    topic: string,
    subject: string,
    isCorrect: boolean,
    params: {
        difficulty?: 'Easy' | 'Medium' | 'Hard',
        timeSpent?: number, // in seconds
        misconceptionTags?: string[],
        userClass?: string,
        targetExam?: string,
        errorType?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' | 'OVERCONFIDENCE'
    } = {}
): Promise<void> => {
    const { difficulty, timeSpent, misconceptionTags, userClass, targetExam, errorType } = params;
    if (!userId || userId === 'guest' || !topic) return;

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
        const snap = await import('firebase/firestore').then(mod => mod.getDoc(docRef));

        let correctCount = isCorrect ? 1 : 0;
        let totalAttempts = 1;
        let avgTime = timeSpent || 60; // Default 60s if not provided
        let last5Results = [isCorrect];
        let easyFailures = (!isCorrect && difficulty === 'Easy') ? 1 : 0;
        let repeatedMistakes = 0;
        let existingTags: string[] = misconceptionTags || [];
        let errorAnalysis = {
            conceptualCount: (!isCorrect && errorType === 'CONCEPTUAL') ? 1 : 0,
            sillyCount: (!isCorrect && errorType === 'SILLY') ? 1 : 0,
            timePressureCount: (!isCorrect && errorType === 'TIME') ? 1 : 0,
            misreadCount: (!isCorrect && errorType === 'MISREAD') ? 1 : 0,
            totalErrors: isCorrect ? 0 : 1
        };

        if (snap.exists()) {
            const existing = snap.data() as TopicStat;
            correctCount = (existing.correct_count || 0) + (isCorrect ? 1 : 0);
            totalAttempts = (existing.total_attempts || 0) + 1;

            // Running average for time
            avgTime = ((existing.avg_time || 60) * (existing.total_attempts || 0) + (timeSpent || 60)) / totalAttempts;

            // Last 5 results
            last5Results = [...(existing.last_5_results || []), isCorrect].slice(-5);

            // Easy failures
            easyFailures = (existing.easy_failures || 0) + ((!isCorrect && difficulty === 'Easy') ? 1 : 0);

            // Error Analysis
            const prevEA = existing.error_analysis || { conceptualCount: 0, sillyCount: 0, timePressureCount: 0, misreadCount: 0, totalErrors: 0 };
            errorAnalysis = {
                conceptualCount: prevEA.conceptualCount + (!isCorrect && errorType === 'CONCEPTUAL' ? 1 : 0),
                sillyCount: prevEA.sillyCount + (!isCorrect && errorType === 'SILLY' ? 1 : 0),
                timePressureCount: prevEA.timePressureCount + (!isCorrect && errorType === 'TIME' ? 1 : 0),
                misreadCount: prevEA.misreadCount + (!isCorrect && errorType === 'MISREAD' ? 1 : 0),
                totalErrors: prevEA.totalErrors + (isCorrect ? 0 : 1)
            };

            // Repeated mistakes: if it was weak and they fail again
            repeatedMistakes = (existing.repeated_mistakes || 0);
            if (!isCorrect && (existing.status === 'weak' || (existing.weakness_score || 0) > 0.6)) {
                repeatedMistakes++;
            }

            // Tags
            existingTags = Array.from(new Set([...(existing.misconception_tags || []), ...(misconceptionTags || [])]));
        }

        const percentage = Math.round((correctCount / totalAttempts) * 100);
        const last5Accuracy = last5Results.filter(Boolean).length / last5Results.length;

        // Determine status based on weakness_score
        const partialStat: Partial<TopicStat> = {
            correct_count: correctCount,
            total_attempts: totalAttempts,
            avg_time: avgTime,
            last_5_accuracy: last5Accuracy,
            easy_failures: easyFailures,
            repeated_mistakes: repeatedMistakes,
            error_analysis: errorAnalysis
        };

        const weaknessScore = calculateWeaknessScore(partialStat);

        let status: 'weak' | 'improving' | 'strong' = 'weak';
        if (weaknessScore < 0.3) {
            status = 'strong';
        } else if (weaknessScore < 0.6) {
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
            target_exam: targetExam,
            avg_time: avgTime,
            last_5_accuracy: last5Accuracy,
            last_5_results: last5Results,
            easy_failures: easyFailures,
            repeated_mistakes: repeatedMistakes,
            misconception_tags: existingTags,
            weakness_score: weaknessScore,
            error_analysis: errorAnalysis,
            last_error_type: errorType
        };

        await setDoc(docRef, statData, { merge: true });

    } catch (e) {
        console.error('Failed to update topic strength:', e);
    }
};

// Batch update topics after a test
export const batchUpdateTopicStrength = async (
    userId: string,
    questions: Array<{ topic: string; subject?: string; isCorrect: boolean; errorType?: TopicStat['last_error_type'] }>,
    userClass?: string,
    targetExam?: string
): Promise<void> => {
    // Group by topic to aggregate stats
    const topicResults: Record<string, { subject: string; results: Array<{ isCorrect: boolean, errorType?: TopicStat['last_error_type'] }> }> = {};

    questions.forEach(q => {
        const topic = q.topic?.trim() || 'General';
        if (!topicResults[topic]) {
            topicResults[topic] = { subject: q.subject || 'General', results: [] };
        }
        topicResults[topic].results.push({ isCorrect: q.isCorrect, errorType: q.errorType });
    });

    // Update each topic
    for (const [topic, stats] of Object.entries(topicResults)) {
        for (const res of stats.results) {
            await updateTopicStrength(
                userId,
                topic,
                stats.subject,
                res.isCorrect,
                {
                    userClass,
                    targetExam,
                    errorType: res.errorType
                }
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
    if (!userId || userId === 'guest') return [];

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

        // Client-side filtering and sorting by weakness_score (descending)
        return allStats
            .filter(s => s.status === 'weak' || (s.weakness_score || 0) > 0.4)
            .sort((a, b) => (b.weakness_score || 0) - (a.weakness_score || 0))
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
    if (!userId || userId === 'guest') return [];

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
    if (!userId || userId === 'guest') return [];

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
    if (!oldUserId || !newUserId || oldUserId === newUserId || oldUserId === 'guest' || newUserId === 'guest') return;

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
    params: {
        difficulty?: 'Easy' | 'Medium' | 'Hard',
        timeSpent?: number,
        misconceptionTags?: string[],
        userClass?: string,
        targetExam?: string,
        errorType?: TopicStat['last_error_type']
    } = {}
): Promise<void> => {
    await updateTopicStrength(userId, topic, subject, isCorrect, params);
};
