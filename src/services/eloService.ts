
/**
 * EloService - Real-time Ability Scoring (Adaptive Learning)
 * Based on the Elo rating system used in chess and competitive gaming.
 * Adapted for EdTech to simulate CAT/JEE percentile behavior.
 * 
 * Enhanced with Per-Subject Calibration Profiles for granular difficulty targeting.
 */

const K_FACTOR = 32; // Standard Elo K-factor

export interface CalibrationProfile {
    overall: number;
    uncertainty: number;               // Rating Deviation (RD)
    subjectRatings: Record<string, number>;
    topicRatings: Record<string, number>;
    learningVelocity: number;
    conceptVectors: Record<string, number>;    // Cognitive skills (0.0 - 1.0)
    totalAttempts: number;
    streakCounter: number;             // Correct answers in a row
    learningMomentum: number;          // Acceleration of learning (-50 to +50)
    recentTopics: string[];            // Last 3 unique topics for diversity check
    lastCalibrated: string;
}

export const DEFAULT_CALIBRATION: CalibrationProfile = {
    overall: 1000,
    uncertainty: 350, // Initial high uncertainty (Glicko RD)
    subjectRatings: {
        physics: 1000,
        chemistry: 1000,
        math: 1000,
        biology: 1000,
        history: 1000
    },
    topicRatings: {},
    learningVelocity: 0,
    conceptVectors: {
        visualization: 0.5,
        abstraction: 0.5,
        precision: 0.5,
        stamina: 0.5
    },
    totalAttempts: 0,
    streakCounter: 0,
    learningMomentum: 0,
    recentTopics: [],
    lastCalibrated: new Date().toISOString()
};

export const EloService = {
    /**
     * Calculates Cognitive Load Index (CLI) based on active user interaction telemetry.
     * Scale: 0.0 (Perfect Flow) to 1.0 (Extreme Fatigue/Frustration).
     */
    calculateCognitiveLoad: (telemetry: {
        hesitationS: number;        // Seconds spent before first click
        switchCount: number;        // Option switches during question
        timeSpentS: number;         // Total seconds spent on current question
        expectedTimeS: number;      // Standard expected time
        consecutiveWrongs: number;  // Incorrect answers in this session
    }): number => {
        let load = 0.1;

        // 1. Hesitation Penalty (Doubt / Lack of conceptual confidence)
        if (telemetry.hesitationS > 25) load += 0.25;
        else if (telemetry.hesitationS > 12) load += 0.15;

        // 2. Revision Penalty (Indecision / Panic shifts)
        if (telemetry.switchCount > 3) load += 0.3;
        else if (telemetry.switchCount > 1) load += 0.15;

        // 3. Time Penalty (Struggle / Stuck)
        if (telemetry.timeSpentS > telemetry.expectedTimeS * 2) load += 0.25;
        else if (telemetry.timeSpentS > telemetry.expectedTimeS * 1.3) load += 0.12;

        // 4. Session Fatigue (Success rate decay)
        load += Math.min(0.2, telemetry.consecutiveWrongs * 0.08);

        return Math.max(0.0, Math.min(1.0, load));
    },

    /**
     * Recommends the next difficulty adjustment based on current cognitive load.
     * If Cognitive Load > 0.68, shifts to "Comfort" to rebuild confidence and prevent blockages.
     */
    recommendDifficultyBanding: (
        cognitiveLoad: number
    ): { mix: 'Comfort' | 'Challenge' | 'Stretch'; adjustment: number; alertUser: boolean } => {
        if (cognitiveLoad > 0.68) {
            return { mix: 'Comfort', adjustment: -150, alertUser: true };
        }
        if (cognitiveLoad > 0.42) {
            return { mix: 'Challenge', adjustment: 0, alertUser: false };
        }
        return { mix: 'Stretch', adjustment: 250, alertUser: false };
    },

    /**
     * Calculates the new ability score after a question attempt.
     * v4.0: Includes Rich Outcomes (Time, Hints, Confidence)
     */
    calculateNewAbility: (
        currentAbility: number, 
        questionRating: number, 
        outcome: {
            isCorrect: boolean;
            solveTimeS: number;
            hintsUsed: number;
            expectedTimeS?: number;
        }
    ): number => {
        // Expected outcome (Probability of winning)
        const expectedScore = 1 / (1 + Math.pow(10, (questionRating - currentAbility) / 400));

        // ── RICH OUTCOME WEIGHTING ──
        // 1.0 = Perfect Correct, 0.0 = Wrong
        // 0.8 = Correct but slow/hints, 0.2 = Wrong but close/fast try
        let actualScore = outcome.isCorrect ? 1.0 : 0.0;

        if (outcome.isCorrect) {
            // Penalize for hints
            if (outcome.hintsUsed > 0) actualScore -= Math.min(0.3, outcome.hintsUsed * 0.1);
            
            // Penalize for extreme slowness (Productive Struggle vs. Stuck)
            const expected = outcome.expectedTimeS || 120;
            if (outcome.solveTimeS > expected * 2.5) actualScore -= 0.2;
        } else {
            // Small reward for "fast try" (not giving up immediately)
            if (outcome.solveTimeS > 30 && outcome.solveTimeS < 300) actualScore += 0.05;
        }

        actualScore = Math.max(0, Math.min(1, actualScore));

        // New Rating
        const change = K_FACTOR * (actualScore - expectedScore);
        return currentAbility + change;
    },

    /**
     * Continuous Difficulty Targeting (Banding Strategy)
     * Returns a target question rating for the student.
     */
    getTargetDifficulty: (abilityScore: number, mix: 'Comfort' | 'Challenge' | 'Stretch' = 'Challenge'): number => {
        switch (mix) {
            case 'Comfort': return abilityScore - 150;
            case 'Stretch': return abilityScore + 250;
            default: return abilityScore;
        }
    },

    /**
     * Calculates "Percentile" based on ability score (Heuristic for demo).
     * In a live app, this would query the distribution of all users.
     */
    calculatePercentile: (abilityScore: number): number => {
        // Normal distribution estimate: Mean=1000, StdDev=300
        const z = (abilityScore - 1000) / 300;
        // Approximation of the Error Function (erf)
        const percentile = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-Math.pow(z, 2) * (4 / Math.PI + 0.1 * Math.pow(z, 2)) / (1 + 0.1 * Math.pow(z, 2)))));
        return Math.floor(percentile * 100);
    },

    /**
     * Updates the per-subject calibration profile after an attempt.
     * Provides granular tracking beyond the single abilityScore.
     */
    updateCalibration: (
        calibration: CalibrationProfile,
        subject: string,
        topic: string,
        questionRating: number,
        outcome: { 
            isCorrect: boolean; 
            solveTimeS: number; 
            hintsUsed: number;
            hesitationS?: number;      // Time to first interaction
            switchCount?: number;      // Number of times answer was changed
        },
        conceptTags?: string[]
    ): CalibrationProfile => {
        // 1. Apply Temporal Decay (Regress if inactive)
        let processedProfile = EloService.applyTemporalDecay(calibration);
        const newProfile = { ...processedProfile };
        let subKey = subject.toLowerCase().trim();
        if (subKey === 'mathematics') subKey = 'math';
        
        // 2. Update Overall (Moving Average)
        const oldOverall = newProfile.overall;
        newProfile.overall = EloService.calculateNewAbility(oldOverall, questionRating, outcome);
        
        // 2. Update Subject
        if (newProfile.subjectRatings[subKey] !== undefined) {
            newProfile.subjectRatings[subKey] = EloService.calculateNewAbility(newProfile.subjectRatings[subKey], questionRating, outcome);
        }

        // 3. Update Topic (Granular)
        const topicId = topic.toLowerCase().replace(/\s+/g, '_');
        if (!newProfile.topicRatings) newProfile.topicRatings = {};
        const currentTopicRating = newProfile.topicRatings[topicId] || 1000;
        newProfile.topicRatings[topicId] = EloService.calculateNewAbility(currentTopicRating, questionRating, outcome);

        // 4. Behavioral Adjustment (Shift to Uncertainty instead of Gain Punishment)
        // High hesitation or switching increases uncertainty (RD), signaling unstable mastery
        if (outcome.hesitationS && outcome.hesitationS > 30) {
            newProfile.uncertainty = Math.min(350, newProfile.uncertainty + 25);
        }
        if (outcome.switchCount && outcome.switchCount > 2) {
            newProfile.uncertainty = Math.min(350, newProfile.uncertainty + 15);
        }

        const change = Math.abs(newProfile.overall - oldOverall);
        
        // Hints still directly dampen gain as they are a concrete assistance
        if (outcome.isCorrect && outcome.hintsUsed > 0) {
            const hintMultiplier = Math.max(0.4, 1 - (outcome.hintsUsed * 0.2));
            const dampenedGain = (newProfile.overall - oldOverall) * hintMultiplier;
            newProfile.overall = oldOverall + dampenedGain;
        }

        // 5. Update Concept Vectors (Cognitive Skills)
        if (conceptTags && newProfile.conceptVectors) {
            conceptTags.forEach(tag => {
                const normalized = tag.toLowerCase().trim();
                if (newProfile.conceptVectors![normalized] !== undefined) {
                    // Slow, probabilistic updates (v4.1)
                    const delta = outcome.isCorrect ? 0.01 : -0.005;
                    newProfile.conceptVectors![normalized] = Math.max(0.1, Math.min(1.0, newProfile.conceptVectors![normalized] + delta));
                }
            });
        }

        newProfile.learningVelocity = (0.3 * change) + (0.7 * (newProfile.learningVelocity || 0));

        // 6. Update Momentum and Topic Diversity
        const abilityDelta = newProfile.overall - oldOverall;
        newProfile.learningMomentum = (0.2 * abilityDelta) + (0.8 * (newProfile.learningMomentum || 0));
        
        const currentTopics = newProfile.recentTopics || [];
        if (!currentTopics.includes(topic)) {
            newProfile.recentTopics = [topic, ...currentTopics].slice(0, 5);
        }

        // 7. Update Streak and RD Normalization Pressure
        if (outcome.isCorrect) {
            newProfile.streakCounter = (newProfile.streakCounter || 0) + 1;
        } else {
            newProfile.streakCounter = 0;
        }

        // 8. Update Uncertainty (RD shrinks with attempts + stable streaks)
        const currentUncertainty = newProfile.uncertainty || 350;
        let rdShrink = (320 / Math.max(1, newProfile.totalAttempts));
        
        // Context-Aware Streak Bonus: 
        // Only give full bonus if student is performing across varied topics
        if (newProfile.streakCounter >= 3) {
            const topicDiversity = new Set(newProfile.recentTopics).size;
            const diversityMultiplier = topicDiversity >= 2 ? 1.0 : 0.5;
            rdShrink += (newProfile.streakCounter * 2 * diversityMultiplier);
        }

        newProfile.uncertainty = Math.max(30, currentUncertainty - rdShrink);

        newProfile.lastCalibrated = new Date().toISOString();

        return newProfile;
    },

    /**
     * Applies temporal decay to a profile based on inactivity.
     * Prevents "stale mastery" and increases uncertainty.
     */
    applyTemporalDecay: (profile: CalibrationProfile): CalibrationProfile => {
        const last = new Date(profile.lastCalibrated).getTime();
        const now = Date.now();
        const daysInactive = Math.floor((now - last) / (1000 * 60 * 60 * 24));

        if (daysInactive <= 7) return profile;

        const decayedProfile = { ...profile };
        
        // 1. Increase uncertainty first (RD) - System becomes less certain of user's current level
        const rdIncrease = (daysInactive - 7) * 8;
        decayedProfile.uncertainty = Math.min(350, (decayedProfile.uncertainty || 30) + rdIncrease);

        // 2. Regress rating only after prolonged inactivity (30+ days)
        if (daysInactive > 30) {
            const weeksLate = Math.floor((daysInactive - 30) / 7);
            const regressionFactor = Math.pow(0.995, weeksLate); // Even more conservative: 0.5% per week
            decayedProfile.overall = 1000 + (decayedProfile.overall - 1000) * regressionFactor;
            
            // Apply to subjects too
            Object.keys(decayedProfile.subjectRatings).forEach(s => {
                decayedProfile.subjectRatings[s] = 1000 + (decayedProfile.subjectRatings[s] - 1000) * regressionFactor;
            });
        }

        return decayedProfile;
    },

    /**
     * Gets the target difficulty for a specific subject based on the calibration profile.
     */
    getSubjectDifficultyRating: (calibration: CalibrationProfile, subject: string): number => {
        const subKey = subject.toLowerCase();
        return calibration.subjectRatings[subKey] || calibration.overall;
    },

    /**
     * Returns a confidence label based on attempt count.
     */
    getConfidenceLevel: (calibration: CalibrationProfile): 'Low' | 'Medium' | 'High' => {
        if (calibration.totalAttempts < 10) return 'Low';
        if (calibration.totalAttempts < 50) return 'Medium';
        return 'High';
    },

    /**
     * Gets a human-readable summary of the calibration profile.
     */
    getCalibrationSummary: (calibration: CalibrationProfile): {
        strongSubjects: string[];
        weakSubjects: string[];
        overallTier: string;
    } => {
        const subjects = ['physics', 'chemistry', 'math', 'biology'] as const;
        const strong: string[] = [];
        const weak: string[] = [];

        subjects.forEach(s => {
            const rating = calibration.subjectRatings[s] || 1000;
            if (rating > 1200) strong.push(s.charAt(0).toUpperCase() + s.slice(1));
            else if (rating < 800) weak.push(s.charAt(0).toUpperCase() + s.slice(1));
        });

        let overallTier = 'Intermediate';
        if (calibration.overall > 1400) overallTier = 'Advanced';
        else if (calibration.overall > 1200) overallTier = 'Proficient';
        else if (calibration.overall < 600) overallTier = 'Beginner';
        else if (calibration.overall < 800) overallTier = 'Developing';

        return { strongSubjects: strong, weakSubjects: weak, overallTier };
    }
};
