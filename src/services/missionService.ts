
import { getWeakTopics, type TopicStat } from './topicStrengthService';
import { FatigueService } from './fatigueService';
import { SYLLABUS_DB } from '../lib/constants';

export interface DailyMission {
    id: string;
    title: string;
    description: string;
    type: 'practice' | 'review' | 'rest' | 'discovery';
    topic: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    rewardXp: number;
    completed: boolean;
}

export const MissionService = {
    generateMissions: async (userId: string, fatigueHistory: any[]): Promise<DailyMission[]> => {
        const weakTopics = await getWeakTopics(userId, 10);
        const { fatigued } = FatigueService.detectFatigue(fatigueHistory);

        const missions: DailyMission[] = [];

        // 1. Foundation Fix Mission (From Root Cause/Weak Topics)
        if (weakTopics.length > 0) {
            const topWeak = weakTopics[0];
            missions.push({
                id: `mission-weak-${Date.now()}`,
                title: `Strengthen ${topWeak.topic}`,
                description: fatigued
                    ? `Watch a quick review lecture to refresh your fundamentals.`
                    : `Score above 70% in a targeted practice test on this topic.`,
                type: fatigued ? 'discovery' : 'practice',
                topic: topWeak.topic,
                subject: MissionService.findSubjectForTopic(topWeak.topic),
                difficulty: fatigued ? 'Easy' : 'Medium',
                rewardXp: 150,
                completed: false
            });
        }

        // 2. High-Impact Review (Always include one review)
        if (weakTopics.length > 1) {
            const reviewTopic = weakTopics[1];
            missions.push({
                id: `mission-review-${Date.now()}`,
                title: `Quick Drill: ${reviewTopic.topic}`,
                description: `Solve 5 medium-difficulty questions to improve stability.`,
                type: 'review',
                topic: reviewTopic.topic,
                subject: MissionService.findSubjectForTopic(reviewTopic.topic),
                difficulty: 'Medium',
                rewardXp: 100,
                completed: false
            });
        }

        // 3. Spacing Repetition / Discovery
        missions.push({
            id: `mission-discovery-${Date.now()}`,
            title: `Advance Study: New Concept`,
            description: `Explore the next chapter in your curriculum to stay ahead.`,
            type: 'discovery',
            topic: 'General',
            subject: 'General',
            difficulty: 'Easy',
            rewardXp: 80,
            completed: false
        });

        // 4. Fatigue Override: If severely fatigued, swap a mission for a "Mindful Break"
        if (fatigued) {
            missions[0] = {
                id: 'mission-rest',
                title: 'Cognitive Recovery',
                description: 'Your mental battery is low. Take a 20-minute power nap or walk.',
                type: 'rest',
                topic: 'Well-being',
                subject: 'Mental Health',
                difficulty: 'Easy',
                rewardXp: 50,
                completed: false
            };
        }

        return missions;
    },

    findSubjectForTopic: (topicName: string): string => {
        for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
            if (topics.some(t => t.topic === topicName)) return subject;
        }
        return 'General';
    }
};
