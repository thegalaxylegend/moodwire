
import type { TopicStat } from './topicStrengthService';

export interface DailyMission {
    title: string;
    tasks: {
        id: string;
        label: string;
        type: 'PRACTICE' | 'REVISION' | 'DRILL' | 'MOCK';
        topic: string;
        subject: string;
        target_count?: number;
        completed: boolean;
    }[];
    motivation: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const MissionPlannerService = {
    /**
     * Generates a personalized daily mission based on user stats.
     */
    generateDailyMission: (
        _userId: string,
        weakTopics: TopicStat[],
        examName: string,
        daysToExam?: number
    ): DailyMission => {
        const tasks: DailyMission['tasks'] = [];

        // 1. Practice Task for the most critical weak topic
        if (weakTopics.length > 0) {
            const topWeak = weakTopics[0];
            tasks.push({
                id: 'practice-1',
                label: `Master ${topWeak.topic}: Solve 15 questions`,
                type: 'PRACTICE',
                topic: topWeak.topic,
                subject: topWeak.subject,
                target_count: 15,
                completed: false
            });
        }

        // 2. Speed Drill for a "Medium" difficulty topic
        const mediumTopic = weakTopics.find(t => (t.weakness_score || 0) < 0.6) || weakTopics[1];
        if (mediumTopic) {
            tasks.push({
                id: 'drill-1',
                label: `Speed Drill: 5-min challenge on ${mediumTopic.topic}`,
                type: 'DRILL',
                topic: mediumTopic.topic,
                subject: mediumTopic.subject,
                target_count: 5,
                completed: false
            });
        }

        // 3. Revision Task for a strong topic (to prevent decay)
        tasks.push({
            id: 'revision-1',
            label: `Quick Revision: Review formulas for your strong areas`,
            type: 'REVISION',
            topic: 'Mixed',
            subject: 'General',
            completed: false
        });

        // 4. Intensity adjustment based on exam date
        let motivation = "Keep pushing! Consistency is the key to 99th percentile.";
        let priority: DailyMission['priority'] = 'MEDIUM';

        if (daysToExam && daysToExam < 30) {
            motivation = "Exam is approaching! Focus on high-weightage weak areas today.";
            priority = 'HIGH';
            tasks.push({
                id: 'mock-1',
                label: `Full ${examName} Mini-Mock (10 Qs)`,
                type: 'MOCK',
                topic: 'Full Syllabus',
                subject: 'All',
                target_count: 10,
                completed: false
            });
        }

        return {
            title: `Mission ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            tasks,
            motivation,
            priority
        };
    }
};
