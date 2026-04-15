
import { getWeakTopics } from './topicStrengthService';
import { FatigueService } from './fatigueService';
import { SpacedRepetitionService } from './spacedRepetitionService';
import { MistakeNotebookService } from './mistakeNotebookService';
import { SYLLABUS_DB, EXAM_SUBJECT_MAPPING } from '../lib/constants';

export interface DailyMission {
    id: string;
    title: string;
    description: string;
    type: 'practice' | 'review' | 'rest' | 'discovery' | 'srs_review' | 'mistake_retry';
    topic: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    rewardXp: number;
    completed: boolean;
    urgencyLevel?: 'normal' | 'intensive' | 'war';
    metadata?: {
        cardCount?: number;       // For SRS review missions
        mistakeCount?: number;    // For mistake retry missions
        daysToExam?: number;      // For urgency display
    };
}

// ─── URGENCY ENGINE ──────────────────────────────────────

const calculateUrgency = (examDate?: string): { level: 'normal' | 'intensive' | 'war'; daysLeft: number } => {
    if (!examDate) return { level: 'normal', daysLeft: -1 };
    
    const now = new Date();
    const exam = new Date(examDate);
    const diffMs = exam.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { level: 'war', daysLeft: 0 };
    if (daysLeft <= 30) return { level: 'war', daysLeft };
    if (daysLeft <= 90) return { level: 'intensive', daysLeft };
    return { level: 'normal', daysLeft };
};

const getMissionCount = (urgency: 'normal' | 'intensive' | 'war'): number => {
    switch (urgency) {
        case 'war': return 7;
        case 'intensive': return 5;
        default: return 3;
    }
};

// ─── MISSION SERVICE ─────────────────────────────────────

export const MissionService = {
    generateMissions: async (
        userId: string,
        fatigueHistory: any[],
        userClass?: string,
        targetExam?: string,
        examDate?: string
    ): Promise<DailyMission[]> => {
        const weakTopics = await getWeakTopics(userId, 10, userClass, targetExam);
        const { fatigued } = FatigueService.detectFatigue(fatigueHistory);
        const { level: urgency, daysLeft } = calculateUrgency(examDate);
        const maxMissions = getMissionCount(urgency);

        const missions: DailyMission[] = [];

        // ──── PRIORITY 0: Spaced Repetition Review (ALWAYS FIRST) ────
        const srsSession = await SpacedRepetitionService.getDueCards(userId, 25);
        if (srsSession.total_due > 0) {
            missions.push({
                id: `mission-srs-${Date.now()}`,
                title: `🧠 Review ${srsSession.total_due} Due Cards`,
                description: srsSession.overdue_count > 0
                    ? `${srsSession.overdue_count} cards are overdue! Your memory is fading — review now to retain what you've learned.`
                    : `${srsSession.total_due} cards are scheduled for review today. Stay on top of your retention curve.`,
                type: 'srs_review',
                topic: 'Spaced Review',
                subject: 'All Subjects',
                difficulty: 'Medium',
                rewardXp: Math.min(srsSession.total_due * 10, 250),
                completed: false,
                urgencyLevel: urgency,
                metadata: {
                    cardCount: srsSession.total_due,
                    daysToExam: daysLeft
                }
            });
        }

        // ──── PRIORITY 1: Mistake Notebook Retry ────
        const unretriedMistakes = MistakeNotebookService.getUnretriedMistakes(userId, 10);
        if (unretriedMistakes.length > 0) {
            missions.push({
                id: `mission-mistakes-${Date.now()}`,
                title: `📕 Re-attempt ${unretriedMistakes.length} Mistakes`,
                description: `You have ${unretriedMistakes.length} wrong answers you haven't retried. Conquer them to prove mastery.`,
                type: 'mistake_retry',
                topic: unretriedMistakes[0].topic,
                subject: unretriedMistakes[0].subject,
                difficulty: 'Medium',
                rewardXp: Math.min(unretriedMistakes.length * 15, 200),
                completed: false,
                urgencyLevel: urgency,
                metadata: {
                    mistakeCount: unretriedMistakes.length,
                    daysToExam: daysLeft
                }
            });
        }

        // ──── PRIORITY 2: Foundation Fix (Weak Topics) ────
        if (weakTopics.length > 0 && missions.length < maxMissions) {
            const topWeak = weakTopics[0];
            missions.push({
                id: `mission-weak-${Date.now()}`,
                title: `Strengthen ${topWeak.topic}`,
                description: fatigued
                    ? `Watch a quick review lecture to refresh your fundamentals.`
                    : urgency === 'war'
                        ? `⚡ CRITICAL: Score above 80% on ${topWeak.topic}. Only ${daysLeft} days left!`
                        : `Score above 70% in a targeted practice test on this topic.`,
                type: fatigued ? 'discovery' : 'practice',
                topic: topWeak.topic,
                subject: MissionService.findSubjectForTopic(topWeak.topic),
                difficulty: urgency === 'war' ? 'Hard' : 'Medium',
                rewardXp: urgency === 'war' ? 200 : 150,
                completed: false,
                urgencyLevel: urgency,
                metadata: { daysToExam: daysLeft }
            });
        }

        // ──── PRIORITY 3: High-Impact Review ────
        if (weakTopics.length > 1 && missions.length < maxMissions) {
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
                completed: false,
                urgencyLevel: urgency,
                metadata: { daysToExam: daysLeft }
            });
        }

        // ──── PRIORITY 4: Discovery Mission ────
        if (missions.length < maxMissions) {
            const discoveryTopic = MissionService.findNextDiscoveryTopic(
                weakTopics.map(w => w.topic), userClass, targetExam
            );
            missions.push({
                id: `mission-discovery-${Date.now()}`,
                title: `Advance Study: ${discoveryTopic.topic}`,
                description: `Explore "${discoveryTopic.topic}" in ${discoveryTopic.subject} to stay ahead of your curriculum.`,
                type: 'discovery',
                topic: discoveryTopic.topic,
                subject: discoveryTopic.subject,
                difficulty: 'Easy',
                rewardXp: 80,
                completed: false,
                urgencyLevel: urgency,
                metadata: { daysToExam: daysLeft }
            });
        }

        // ──── WAR MODE: Extra missions when exam is <30 days ────
        if (urgency === 'war' && missions.length < maxMissions) {
            // Add extra weak topic drills
            for (let i = 2; i < weakTopics.length && missions.length < maxMissions; i++) {
                missions.push({
                    id: `mission-war-${i}-${Date.now()}`,
                    title: `⚡ Blitz: ${weakTopics[i].topic}`,
                    description: `${daysLeft} days to exam. Rapid-fire 10 questions on ${weakTopics[i].topic}.`,
                    type: 'practice',
                    topic: weakTopics[i].topic,
                    subject: MissionService.findSubjectForTopic(weakTopics[i].topic),
                    difficulty: 'Hard',
                    rewardXp: 120,
                    completed: false,
                    urgencyLevel: 'war',
                    metadata: { daysToExam: daysLeft }
                });
            }
        }

        // ──── INTENSIVE MODE: Extra review when 30-90 days ────
        if (urgency === 'intensive' && missions.length < maxMissions && weakTopics.length > 2) {
            missions.push({
                id: `mission-intensive-review-${Date.now()}`,
                title: `Deep Review: ${weakTopics[2].topic}`,
                description: `${daysLeft} days to go. Solve 10 mixed-difficulty questions.`,
                type: 'review',
                topic: weakTopics[2].topic,
                subject: MissionService.findSubjectForTopic(weakTopics[2].topic),
                difficulty: 'Medium',
                rewardXp: 100,
                completed: false,
                urgencyLevel: 'intensive',
                metadata: { daysToExam: daysLeft }
            });
        }

        // ──── FATIGUE OVERRIDE ────
        if (fatigued && missions.length > 0) {
            missions[0] = {
                id: 'mission-rest',
                title: 'Cognitive Recovery',
                description: 'Your mental battery is low. Take a 20-minute power nap or walk.',
                type: 'rest',
                topic: 'Well-being',
                subject: 'Mental Health',
                difficulty: 'Easy',
                rewardXp: 50,
                completed: false,
                urgencyLevel: urgency
            };
        }

        return missions.slice(0, maxMissions);
    },

    findSubjectForTopic: (topicName: string): string => {
        for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
            if (topics.some(t => t.topic === topicName)) return subject;
        }
        return 'General';
    },

    /**
     * Finds the next topic from the syllabus that the student hasn't practiced yet.
     */
    findNextDiscoveryTopic: (coveredTopics: string[], userClass?: string, targetExam?: string): { topic: string; subject: string } => {
        const examKey = (targetExam || 'class-12').toLowerCase().replace(/\s+/g, '-');
        const relevantSubjects = EXAM_SUBJECT_MAPPING[examKey] || Object.keys(SYLLABUS_DB);
        const classLevel = userClass || 'Class 12';
        const classNum = parseInt(classLevel.replace(/\D/g, '') || '12');

        for (const subject of relevantSubjects) {
            const topics = SYLLABUS_DB[subject] || [];
            const eligibleTopics = topics.filter(t => {
                const topicClassNum = parseInt(t.class.replace(/\D/g, '') || '12');
                return topicClassNum <= classNum;
            });

            for (const t of eligibleTopics) {
                if (!coveredTopics.includes(t.topic)) {
                    return { topic: t.topic, subject };
                }
            }
        }

        const allTopics = relevantSubjects.flatMap(s => (SYLLABUS_DB[s] || []).map(t => ({ ...t, subject: s })));
        const highPriority = allTopics.filter(t => t.weightage === 'High');
        if (highPriority.length > 0) {
            const pick = highPriority[Math.floor(Math.random() * highPriority.length)];
            return { topic: pick.topic, subject: pick.subject };
        }

        return { topic: 'General Review', subject: 'General' };
    }
};
