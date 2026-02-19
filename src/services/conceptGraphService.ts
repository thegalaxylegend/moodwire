
import { SYLLABUS_DB } from '../lib/constants';
import type { SyllabusTopic } from '../lib/constants';

export interface DependencyInsight {
    topic: string;
    instability_score: number; // How likely this is the root cause
    dependent_weak_topics: string[];
}

export const ConceptGraphService = {
    /**
     * Identifies potential "root cause" topics based on current weak topics.
     * Uses the dependency map to find common ancestors.
     */
    findRootCauseInstabilities: (weakTopics: string[], subject?: string): DependencyInsight[] => {
        const insights: Record<string, DependencyInsight> = {};

        // Flatten syllabus for easier lookup
        const allTopics: SyllabusTopic[] = subject
            ? SYLLABUS_DB[subject] || []
            : Object.values(SYLLABUS_DB).flat();

        weakTopics.forEach(weakTopicName => {
            const topicData = allTopics.find(t => t.topic === weakTopicName);
            if (!topicData || !topicData.prerequisites) return;

            topicData.prerequisites.forEach(pre => {
                if (!insights[pre]) {
                    insights[pre] = {
                        topic: pre,
                        instability_score: 0,
                        dependent_weak_topics: []
                    };
                }
                insights[pre].dependent_weak_topics.push(weakTopicName);
                // Weight based on how many weak topics it affects
                insights[pre].instability_score += 0.5;
            });
        });

        return Object.values(insights).sort((a, b) => b.instability_score - a.instability_score);
    },

    /**
     * Gets a full dependency path for a topic (for visualization)
     */
    getPrerequisitePath: (topicName: string, subject?: string): string[] => {
        const path: string[] = [];
        const allTopics = subject ? SYLLABUS_DB[subject] || [] : Object.values(SYLLABUS_DB).flat();

        const traverse = (name: string) => {
            const topic = allTopics.find(t => t.topic === name);
            if (topic && topic.prerequisites) {
                topic.prerequisites.forEach(pre => {
                    if (!path.includes(pre)) {
                        path.push(pre);
                        traverse(pre);
                    }
                });
            }
        };

        traverse(topicName);
        return path;
    }
};
