
import type { Track } from '../../store/vibeStore';

export type RankFeatures = Record<string, number>;

export interface UserProfile {
    affirmations: {
        favoriteArtists: string[];
        favoriteGenres: string[];
        dislikedArtists: string[];
        dislikedTracks?: string[]; // Added
        languages: string[];
    };
    affinityVector: number[]; // Derived from history
    languageWeights: Record<string, number>;
    fatigueScore: number;
    churnRisk: number;
    lastActive: number;
}

export interface RecommendationContext {
    timeOfDay: number; // 0-23
    deviceType: 'mobile' | 'desktop';
    currentSessionId: string;
    recentTracks: Track[]; // Last 5 tracks
    currentTrack: Track | null;
    isAutoplay: boolean;
    location?: any | null;
    isExplorationFlush?: boolean;
    manualIntentOverride?: boolean; // True if user skipped rapidly or manually searched, forces zero flow continuity
}

export interface ScoredTrack {
    track: Track;
    score: number;
    debug: {
        total: number;
        breakdown: Record<string, number>; // "similarity": 0.25, etc.
    };
}

export interface RankWeights {
    // New 9-Component System Mapping
    longTermSimilarity: number;
    shortTermIntent: number;
    artistAffinity: number;
    languageMatch: number;
    flowContinuity: number;
    exploration: number;

    // Penalties & Boosts
    fatiguePenalty: number;
    genreOverexposure: number;
    popularity: number;

    // Legacy / Other
    moodContext: number;
}

// Default weights for "Home" - Aligned with Behavior-Driven Scoring (Step 3)
export const DEFAULT_WEIGHTS: RankWeights = {
    longTermSimilarity: 0.30,
    shortTermIntent: 0.25,
    artistAffinity: 0.15,
    languageMatch: 0.10,
    flowContinuity: 0.10,
    exploration: 0.10,

    fatiguePenalty: 0.10, // Dynamic penalty weight
    genreOverexposure: 0.05,
    popularity: 0.05,
    moodContext: 0.0, // Deprecated in favor of Flow/Short-Term
};
