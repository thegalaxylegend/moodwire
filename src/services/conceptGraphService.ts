
import { SYLLABUS_DB } from '../lib/constants';
import type { SyllabusTopic } from '../lib/constants';

export interface DependencyInsight {
    topic: string;
    instability_score: number; // How likely this is the root cause
    dependent_weak_topics: string[];
}

export const ConceptGraphService = {
    /**
     * Resolves a prerequisite ID to a human-readable topic name.
     * Prerequisites are stored as topic IDs (e.g., "phy_11_motion_line").
     */
    _resolvePrerequisiteName: (prereqId: string, allTopics: SyllabusTopic[]): string => {
        const found = allTopics.find(t => t.id === prereqId);
        return found ? found.topic : prereqId; // Fallback to raw ID if not found
    },

    /**
     * Identifies potential "root cause" topics based on current weak topics.
     * Uses the dependency map to find common ancestors.
     * Prerequisites are stored as topic IDs, so we resolve them to display names.
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

            topicData.prerequisites.forEach(prereqId => {
                // Resolve the prerequisite ID to a display name
                const prereqName = ConceptGraphService._resolvePrerequisiteName(prereqId, allTopics);

                if (!insights[prereqName]) {
                    insights[prereqName] = {
                        topic: prereqName,
                        instability_score: 0,
                        dependent_weak_topics: []
                    };
                }
                insights[prereqName].dependent_weak_topics.push(weakTopicName);
                // Weight based on how many weak topics it affects
                insights[prereqName].instability_score += 0.5;
            });
        });

        return Object.values(insights).sort((a, b) => b.instability_score - a.instability_score);
    },

    /**
     * Gets a full dependency path for a topic (for visualization).
     * Traverses by topic ID through the prerequisites chain.
     */
    getPrerequisitePath: (topicName: string, subject?: string): string[] => {
        const path: string[] = [];
        const allTopics = subject ? SYLLABUS_DB[subject] || [] : Object.values(SYLLABUS_DB).flat();

        const traverseById = (topicId: string) => {
            const topic = allTopics.find(t => t.id === topicId);
            if (topic && topic.prerequisites) {
                topic.prerequisites.forEach(prereqId => {
                    const prereqTopic = allTopics.find(t => t.id === prereqId);
                    const prereqName = prereqTopic ? prereqTopic.topic : prereqId;
                    if (!path.includes(prereqName)) {
                        path.push(prereqName);
                        traverseById(prereqId);
                    }
                });
            }
        };

        // Find the starting topic by name, then traverse its prerequisites by ID
        const startTopic = allTopics.find(t => t.topic === topicName);
        if (startTopic) {
            traverseById(startTopic.id);
        }
        return path;
    }
};
