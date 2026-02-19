
/**
 * EloService - Real-time Ability Scoring (Adaptive Learning)
 * Based on the Elo rating system used in chess and competitive gaming.
 * Adapted for EdTech to simulate CAT/JEE percentile behavior.
 */

const K_FACTOR = 32; // Standard Elo K-factor
const DIFFICULTY_LEVELS = {
    'Easy': 400,
    'Medium': 1000,
    'Hard': 1600
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
    }
};
