
export interface SessionMetric {
    questionIndex: number;
    isCorrect: boolean;
    timeSpent: number;
    timestamp: number;
}

export const FatigueService = {
    /**
     * Analyzes current session metrics to detect cognitive fatigue.
     * Heuristic: If accuracy in the last 1/3 of the session is 30% lower than the first 1/3, 
     * or if avg time spent per question is increasing by >50%.
     */
    detectFatigue: (sessionHistory: SessionMetric[]): { fatigued: boolean; reason?: string } => {
        if (sessionHistory.length < 10) return { fatigued: false };

        const total = sessionHistory.length;
        const firstHalf = sessionHistory.slice(0, Math.floor(total / 2));
        const secondHalf = sessionHistory.slice(Math.floor(total / 2));

        const firstAccuracy = firstHalf.filter(s => s.isCorrect).length / firstHalf.length;
        const secondAccuracy = secondHalf.filter(s => s.isCorrect).length / secondHalf.length;

        const firstAvgTime = firstHalf.reduce((acc, s) => acc + s.timeSpent, 0) / firstHalf.length;
        const secondAvgTime = secondHalf.reduce((acc, s) => acc + s.timeSpent, 0) / secondHalf.length;

        // Condition 1: Accuracy drop
        if (secondAccuracy < firstAccuracy * 0.7) {
            return {
                fatigued: true,
                reason: "Sudden drop in accuracy detected. Your brain might need a 5-minute breather."
            };
        }

        // Condition 2: Sluggishness (increasing time)
        if (secondAvgTime > firstAvgTime * 1.6) {
            return {
                fatigued: true,
                reason: "You're taking significantly longer to process questions. Fatigue might be setting in."
            };
        }

        // Condition 3: Rushing (decreasing time + decreasing accuracy)
        if (secondAvgTime < firstAvgTime * 0.5 && secondAccuracy < 0.4) {
            return {
                fatigued: true,
                reason: "You are rushing through questions with low accuracy. Take a moment to focus or rest."
            };
        }

        return { fatigued: false };
    }
};
