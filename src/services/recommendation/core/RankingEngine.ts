import type { Track } from '../../../store/vibeStore';
import type { UserProfile, RecommendationContext, RankWeights, ScoredTrack } from '../types';
import { FeatureExtractor } from './FeatureExtractor';
import { DynamicWeightSystem } from './DynamicWeightSystem';

export class RankingEngine {
    private weights: RankWeights;
    private dynamicWeights: DynamicWeightSystem;

    // Soft Noise Guard (Deprecated Hard Block)
    // We keep this list but use it for mild penalties, not 99% bans.
    private readonly NOISE_KEYWORDS = [
        'loop', 'bgm', 'background', 'instrumental', 'beat', 'beats',
        'ambient', 'relaxing', 'meditation', 'yoga', 'extended mix', 'jukebox',
        'collection', 'slowed', 'reverb', '8d audio', 'no lyrics', 'pure music',
        'nature sounds', 'rain sounds', 'focus', 'study',
        'phunk', 'phonk', 'drift', 'sigma', 'gigachad', 'brazilian funk', 'bass boosted'
    ];

    constructor(weights: RankWeights) {
        this.weights = weights;
        this.dynamicWeights = new DynamicWeightSystem();
    }

    public getDynamicSystem(): DynamicWeightSystem {
        return this.dynamicWeights;
    }

    public scoreCandidate(
        candidate: Track,
        userProfile: UserProfile,
        context: RecommendationContext
    ): ScoredTrack {
        const scores: Record<string, number> = {};
        const titleLower = candidate.title.toLowerCase();
        const artistLower = candidate.artist.toLowerCase();
        const contentInfo = `${titleLower} ${artistLower} ${candidate.genre || ''}`.toLowerCase();

        // --- STEP 1: INITIAL QUALITY CHECK (Soft Filters) ---
        let qualityMultiplier = 1.0;

        // Duration Check
        if (candidate.duration) {
            if (candidate.duration > 900) qualityMultiplier *= 0.5; // Soft penalty for very long tracks
            else if (candidate.duration < 45) qualityMultiplier *= 0.7; // Soft penalty for very short
        }

        // Noise Check (Behavior Driven)
        const isNoise = this.NOISE_KEYWORDS.some(k => contentInfo.includes(k));
        if (isNoise) {
            const userGenres = (userProfile.affirmations.favoriteGenres || []).map(g => g.toLowerCase());
            const allowsNoise = userGenres.some(g =>
                ['lofi', 'ambient', 'instrumental', 'phunk', 'electronic', 'workout'].includes(g)
            );

            // If user likes noise/phunk, NO penalty. If not, moderate penalty (not 99% ban).
            if (!allowsNoise) {
                qualityMultiplier *= 0.4; // 60% reduction, not 95%
            }
        }

        // --- STEP 2: BEHAVIOR-DRIVEN SCORING (The 9 Components) ---

        // 1. Long-Term Similarity (30%)
        const trackVec = FeatureExtractor.normalizeAudioFeatures(candidate);
        scores.longTermSimilarity = FeatureExtractor.cosineSimilarity(userProfile.affinityVector, trackVec);

        // 2. Short-Term Intent (25%)
        // Compare against last 3 tracks to capture "Now"
        // We need a short-term vector from context.recentTracks (last 3)
        const shortTermVec = FeatureExtractor.getShortTermAffinityVector(context.recentTracks.slice(0, 3));
        scores.shortTermSimilarity = FeatureExtractor.cosineSimilarity(shortTermVec, trackVec);

        // 3. Artist Affinity (15%) - Behavior Adjusted
        const baseArtistAffinity = userProfile.affirmations.favoriteArtists.some(
            a => artistLower.includes(a.toLowerCase())
        ) ? 1.0 : 0.0;

        const dynamicArtistMult = this.dynamicWeights.getArtistMultiplier(candidate.artist);
        scores.artistAffinity = baseArtistAffinity * dynamicArtistMult;

        // 4. Language Compatibility (10%) - Dynamic
        scores.languageScore = 0;
        const userLangs = userProfile.affirmations.languages || ['English'];
        if (candidate.language && userLangs.includes(candidate.language)) {
            scores.languageScore = 1.0;
        } else if (!candidate.language) {
            scores.languageScore = 0.5; // Assume neutral if unknown
        }
        // Apply session boost if user switched languages
        scores.languageScore *= this.dynamicWeights.getLanguageMultiplier(candidate.language || '');

        // 5. Flow Score (10%) - Energy/Tempo Continuity
        scores.flowScore = 0.5;
        if (context.currentTrack && !context.manualIntentOverride) {
            const currentEnergy = context.currentTrack.audioFeatures?.energy || 0.5;
            const candidateEnergy = candidate.audioFeatures?.energy || 0.5;
            const diff = Math.abs(currentEnergy - candidateEnergy);

            // We want smooth transitions (diff < 0.3) generally, unless user is chaotic
            scores.flowScore = 1.0 - diff;

            // Mood protection: Don't kill the vibe
            if (currentEnergy < 0.3 && candidateEnergy > 0.8) scores.flowScore *= 0.2; // Jarring
        } else if (context.manualIntentOverride) {
            // Intent override! User skipped rapidly or manually picked, they want a shift.
            // Give all tracks a max flow score so energy transitions are no longer penalized.
            scores.flowScore = 1.0; 
        }

        // Apply Energy Fatigue from dynamic system
        const energyMult = this.dynamicWeights.getEnergyMultiplier(candidate.audioFeatures?.energy || 0.5);
        scores.flowScore *= energyMult;

        // 6. Exploration Score (10%) - Structured Discovery
        // If track is NOT in history and NOT in favorites
        const isNew = !userProfile.affirmations.dislikedTracks?.includes(candidate.id) &&
            !context.recentTracks.some(t => t.id === candidate.id); // Simple check

        scores.explorationScore = isNew ? 1.0 : 0.0;

        // --- FINAL SCORE AGGREGATION ---
        // Formula: (LTerms * W1) + (STerms * W2) + ...

        // WEEK 3: EXPLORATION SPIKE (Entropy Pulse)
        let explorationWeight = this.weights.exploration;
        if (context.isExplorationFlush) {
            explorationWeight += 0.15;
            // console.log("🌪️ Exploration Spike Active (+0.15)");
        }

        const finalScore =
            (scores.longTermSimilarity * this.weights.longTermSimilarity) +
            (scores.shortTermSimilarity * this.weights.shortTermIntent) +
            (scores.artistAffinity * this.weights.artistAffinity) +
            (scores.languageScore * this.weights.languageMatch) +
            (scores.flowScore * this.weights.flowContinuity) +
            (scores.explorationScore * explorationWeight);

        // --- SOURCE TRUST MULTIPLIER (WEEK 2) ---
        // Combination of Structural Baseline + Session-Adaptive Frustration
        const trustTier = candidate.trustTier || 0.8;
        const baselineMultiplier = 0.85 + (0.15 * trustTier);
        const adaptiveMultiplier = this.dynamicWeights.getAdaptiveTrustMultiplier(trustTier);

        const finalTrustMultiplier = baselineMultiplier * adaptiveMultiplier;

        // Apply Quality Multiplier (Soft filter)
        let totalScore = finalScore * qualityMultiplier * finalTrustMultiplier;

        // --- Dislike Logic (Hard Block with Decay support) ---
        // Note: Dislike check should ideally be done before scoring to save CPU, 
        // but if we support decay, we might score it but penalize heavily?
        // For now, caller handles absolute dislikes. We handle "Soft" dislikes if passed in context?
        // Assuming caller filters absolute dislikes.

        // Ensure score doesn't go negative
        const resultScore = Math.max(0.01, totalScore);

        return {
            track: candidate,
            score: resultScore,
            debug: { total: resultScore, breakdown: scores }
        };
    }
}
