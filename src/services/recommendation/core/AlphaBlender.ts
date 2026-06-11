
import { DEFAULT_WEIGHTS, type RankWeights } from '../types';

export class AlphaBlender {
    /**
     * Blends default weights with learned ML weights using a safety alpha.
     * Formula: FinalWeight = (Default * (1 - alpha)) + (Learned * alpha)
     * AND constrained to +/- 15% of Default to maintain structural heuristics.
     */
    public static blend(
        learnedWeights: Partial<RankWeights>,
        alpha: number = 0.4
    ): RankWeights {
        const blended = { ...DEFAULT_WEIGHTS };

        (Object.keys(DEFAULT_WEIGHTS) as Array<keyof RankWeights>).forEach(key => {
            const defaultVal = DEFAULT_WEIGHTS[key];
            // Fix key mapping for ML names if needed
            const mlKey = this.mapToMLKey(key);
            const learnedVal = (learnedWeights as any)[mlKey] ?? defaultVal;

            // 1. Calculate the raw blend
            const blendedVal = (defaultVal * (1 - alpha)) + (learnedVal * alpha);

            // 2. Apply the Safety Clamp (+/- 15% of Default)
            // This ensures ML can only 'nudge' the heuristics, never override them.
            const maxAllowed = defaultVal * 1.15;
            const minAllowed = defaultVal * 0.85;

            blended[key] = Math.max(minAllowed, Math.min(maxAllowed, blendedVal));
        });

        return blended;
    }

    private static mapToMLKey(key: string): string {
        // Map RankingEngine keys to ML Feature keys if they differ
        const mapping: Record<string, string> = {
            'longTermSimilarity': 'longTermSimilarity',
            'shortTermIntent': 'shortTermSimilarity', // ML uses 'shortTermSimilarity'
            'artistAffinity': 'artistAffinity',
            'languageMatch': 'languageScore',
            'flowContinuity': 'flowScore',
            'exploration': 'explorationScore',
            'fatiguePenalty': 'artistFatigue',
            'genreOverexposure': 'genreFatigue'
        };
        return mapping[key] || key;
    }
}
