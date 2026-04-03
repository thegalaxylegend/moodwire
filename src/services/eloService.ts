
/**
 * EloService - Real-time Ability Scoring (Adaptive Learning)
 * Based on the Elo rating system used in chess and competitive gaming.
 * Adapted for EdTech to simulate CAT/JEE percentile behavior.
 * 
 * Enhanced with Per-Subject Calibration Profiles for granular difficulty targeting.
 */

const K_FACTOR = 32; // Standard Elo K-factor
const DIFFICULTY_LEVELS: Record<string, number> = {
    'Easy': 400,
    'Medium': 1000,
    'Hard': 1600
};

export interface CalibrationProfile {
    overall: number;
    physics: number;
    chemistry: number;
    math: number;
    biology: number;
    history: number;
    totalAttempts: number;
    correctStreak: number;
    wrongStreak: number;
    lastCalibrated: string;
}

export const DEFAULT_CALIBRATION: CalibrationProfile = {
    overall: 1000,
    physics: 1000,
    chemistry: 1000,
    math: 1000,
    biology: 1000,
    history: 1000,
    totalAttempts: 0,
    correctStreak: 0,
    wrongStreak: 0,
    lastCalibrated: new Date().toISOString()
};

export const EloService = {
    /**
     * Calculates the new ability score after a question attempt.
     * @param currentAbility - Current User Elo (default 1000)
     * @param questionDifficulty - Stored difficulty ('Easy', 'Medium', 'Hard')
     * @param isCorrect - Whether the user got it right
     */
    calculateNewAbility: (currentAbility: number, questionDifficulty: 'Easy' | 'Medium' | 'Hard', isCorrect: boolean): number => {
        const questionRating = DIFFICULTY_LEVELS[questionDifficulty];

        // Expected outcome (Probability of winning)
        const expectedScore = 1 / (1 + Math.pow(10, (questionRating - currentAbility) / 400));

        // Actual outcome
        const actualScore = isCorrect ? 1 : 0;

        // New Rating
        const newRating = currentAbility + K_FACTOR * (actualScore - expectedScore);

        return Math.round(newRating);
    },

    /**
     * Maps Elo score back to difficulty levels for question selection.
     */
    getTargetDifficulty: (abilityScore: number): 'Easy' | 'Medium' | 'Hard' => {
        if (abilityScore < 600) return 'Easy';
        if (abilityScore > 1400) return 'Hard';
        return 'Medium';
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
        questionDifficulty: 'Easy' | 'Medium' | 'Hard',
        isCorrect: boolean
    ): CalibrationProfile => {
        const subjectKey = subject.toLowerCase() as keyof CalibrationProfile;
        const currentSubjectRating = typeof calibration[subjectKey] === 'number'
            ? (calibration[subjectKey] as number)
            : 1000;

        const newSubjectRating = EloService.calculateNewAbility(
            currentSubjectRating,
            questionDifficulty,
            isCorrect
        );

        const newOverall = EloService.calculateNewAbility(
            calibration.overall,
            questionDifficulty,
            isCorrect
        );

        return {
            ...calibration,
            [subjectKey]: newSubjectRating,
            overall: newOverall,
            totalAttempts: calibration.totalAttempts + 1,
            correctStreak: isCorrect ? calibration.correctStreak + 1 : 0,
            wrongStreak: isCorrect ? 0 : calibration.wrongStreak + 1,
            lastCalibrated: new Date().toISOString()
        };
    },

    /**
     * Gets the target difficulty for a specific subject based on the calibration profile.
     */
    getSubjectDifficulty: (calibration: CalibrationProfile, subject: string): 'Easy' | 'Medium' | 'Hard' => {
        const subjectKey = subject.toLowerCase() as keyof CalibrationProfile;
        const rating = typeof calibration[subjectKey] === 'number'
            ? (calibration[subjectKey] as number)
            : calibration.overall;

        return EloService.getTargetDifficulty(rating);
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
            const rating = calibration[s];
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
