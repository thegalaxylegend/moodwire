import { getWeakTopics, type TopicStat } from './topicStrengthService';
import { getAdaptiveQuestionBatch } from './questionEngine';

export interface RemediationPackage {
    topic: string;
    focus: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD';
    questions: any[];
}

export const remediationService = {
    /**
     * Identifies the primary error pattern for a given topic stat.
     */
    getPrimaryErrorFocus: (stat: TopicStat): 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' => {
        const ea = stat.error_analysis;
        if (!ea) return 'CONCEPTUAL'; // Default fallback

        const counts = [
            { type: 'CONCEPTUAL' as const, value: ea.conceptualCount },
            { type: 'SILLY' as const, value: ea.sillyCount },
            { type: 'TIME' as const, value: ea.timePressureCount + (ea.misreadCount || 0) } // Grouping minor categories
        ];

        return counts.sort((a, b) => b.value - a.value)[0].type;
    },

    /**
     * Generates a targeted remediation set for the user's current weaknesses.
     */
    generateRemediationSet: async (userId: string, userClass?: string, targetExam?: string) => {
        // 1. Get top 3 weakest topics
        const weakTopics = await getWeakTopics(userId, 3, userClass, targetExam);
        if (weakTopics.length === 0) return null;

        // 2. Build the batch request
        const items = weakTopics.map(stat => ({
            subject: stat.subject,
            topic: stat.topic,
            count: 2, // 2 questions per topic for a quick remediation burst
            difficulty: stat.status === 'weak' ? 'Easy' : 'Medium' as 'Easy' | 'Medium' | 'Hard'
        }));

        // 3. Fetch questions (Note: Current getAdaptiveQuestionBatch needs update to support remediationFocus per item)
        // For now, we fetch them and assume the engine will handle standard adaptive logic.
        // Future refinement: pass the remediationFocus into the batch generator.
        const questions = await getAdaptiveQuestionBatch(userId, userId, targetExam || 'General', { items });

        return {
            topics: weakTopics.map(t => t.topic),
            focus: remediationService.getPrimaryErrorFocus(weakTopics[0]),
            questions
        };
    }
};
