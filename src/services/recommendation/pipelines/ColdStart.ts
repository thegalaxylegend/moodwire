
import type { UserProfile } from '../types';

export const ColdStartService = {
    // Maps vibe/genre strings to approximate audio feature vectors
    // [energy, valence, dance, acoustic, instr, tempo]
    VIBE_VECTORS: {
        'Chill': [0.3, 0.4, 0.4, 0.8, 0.2, 0.4],
        'Party': [0.9, 0.8, 0.9, 0.1, 0.0, 0.8],
        'Focus': [0.2, 0.3, 0.1, 0.5, 0.9, 0.3],
        'Workout': [0.95, 0.6, 0.8, 0.0, 0.1, 0.9],
        'Romance': [0.4, 0.7, 0.5, 0.6, 0.1, 0.4],
        'Sad': [0.2, 0.1, 0.3, 0.7, 0.1, 0.3]
    } as Record<string, number[]>,

    generateInitialProfile: (
        preferences: { vibeTypes: string[], favoriteArtists: string[], languages: string[] }
    ): UserProfile => {

        // 1. Calculate Average Vector from Vibes
        // DEFAULT: Leaning towards Indian Pop / Acoustic (mid-high energy, high acousticness)
        let avgVector = [0.6, 0.6, 0.7, 0.6, 0.1, 0.6];
        if (preferences.vibeTypes && preferences.vibeTypes.length > 0) {
            const vectors = preferences.vibeTypes
                .map(v => ColdStartService.VIBE_VECTORS[v] || avgVector);

            // Compute column-wise mean
            avgVector = vectors[0].map((_, colIndex) =>
                vectors.reduce((sum, vec) => sum + vec[colIndex], 0) / vectors.length
            );
        }

        // 2. Language Weights - DEFAULT INDIAN PRIORITY
        const languageWeights: Record<string, number> = {};
        const defaultLangs = preferences.languages?.length ? preferences.languages : ['Hindi', 'Punjabi', 'Tamil', 'Telugu', 'Malayalam', 'English'];

        defaultLangs.forEach(lang => {
            // Give Hindi & Punjabi a slight default edge in India if none specified
            if (lang === 'Hindi' || lang === 'Punjabi') languageWeights[lang] = 1.2;
            else languageWeights[lang] = 1.0;
        });

        return {
            affirmations: {
                favoriteArtists: preferences.favoriteArtists || [],
                favoriteGenres: preferences.vibeTypes || [],
                dislikedArtists: [],
                languages: defaultLangs
            },
            affinityVector: avgVector,
            languageWeights,
            fatigueScore: 0,
            churnRisk: 0,
            lastActive: Date.now()
        };
    }
};
