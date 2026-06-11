
import type { UserProfile, RecommendationContext } from '../types';

export const UserBehavior = {

    // Updates profile based on real-time signal
    updateProfileShortTerm: (profile: UserProfile, signal: 'skip' | 'complete' | 'like', trackFeatures: number[]): UserProfile => {
        const newProfile = { ...profile };
        const learningRate = 0.05; // How fast to adapt

        if (signal === 'skip') {
            // Move AWAY from track features (reduce affinity)
            newProfile.affinityVector = newProfile.affinityVector.map((val, i) =>
                val - (trackFeatures[i] - val) * (learningRate * 0.5) // Smaller penalty than reward
            );
            newProfile.churnRisk += 0.05;
        }
        else if (signal === 'complete' || signal === 'like') {
            // Move TOWARDS track features
            newProfile.affinityVector = newProfile.affinityVector.map((val, i) =>
                val + (trackFeatures[i] - val) * learningRate
            );
            newProfile.churnRisk = Math.max(0, newProfile.churnRisk - 0.02);
            newProfile.fatigueScore = Math.max(0, newProfile.fatigueScore - 0.05);
        }

        // Clip 0-1
        newProfile.affinityVector = newProfile.affinityVector.map(v => Math.max(0, Math.min(1, v)));

        return newProfile;
    },

    calculateFatigue: (context: RecommendationContext): number => {
        // Simple heuristic: Long session = Higher fatigue
        // In real app, check variety of recent artists
        const sessionLength = context.recentTracks.length;
        return Math.min(1.0, sessionLength / 50);
    }
};
