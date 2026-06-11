
import type { ScoredTrack, RecommendationContext } from '../types';

export class DiversityReRanker {
    /**
     * Applies soft penalties based on recent history to ensure variety.
     * Rule: Multiplicative decay preserves the underlying ranking quality 
     * while nudging the user toward variety.
     */
    public static reRank(
        candidates: ScoredTrack[],
        context: RecommendationContext
    ): ScoredTrack[] {
        if (candidates.length === 0) return candidates;

        const recentTracks = context.recentTracks.slice(0, 5);
        if (recentTracks.length === 0) return candidates;

        // 1. Gather stats from recent history
        const recentArtists = recentTracks.map(t => t.artist);
        const recentSources = recentTracks.map(t => t.source);
        const recentGenres = recentTracks.map(t => t.genre).filter(Boolean) as string[];

        const sourceCounts: Record<string, number> = {};
        recentSources.forEach(s => {
            if (s) sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        });

        return candidates.map(st => {
            const track = st.track;
            let diversityMultiplier = 1.0;

            // --- A. Artist Soft Decay ---
            // 10% reduction per repeat in last 5. Floor at 0.70.
            const artistRepeats = recentArtists.filter(a => a === track.artist).length;
            if (artistRepeats > 0) {
                const artistPenalty = Math.max(0.70, 1 - (0.10 * artistRepeats));
                diversityMultiplier *= artistPenalty;
            }

            // --- B. Source Cluster Penalty ---
            // If one source dominates > 60% of last 5, penalize that source slightly.
            if (track.source) {
                const sourceShare = (sourceCounts[track.source] || 0) / recentTracks.length;
                if (sourceShare > 0.6) {
                    diversityMultiplier *= 0.90;
                }
            }

            // --- C. Genre Soft Decay ---
            // 5% reduction per repeat. Floor at 0.80.
            if (track.genre) {
                const genreRepeats = recentGenres.filter(g => g === track.genre).length;
                if (genreRepeats > 0) {
                    const genrePenalty = Math.max(0.80, 1 - (0.05 * genreRepeats));
                    diversityMultiplier *= genrePenalty;
                }
            }

            // PROTECT THE ANCHOR: Global Floor for Multiplier
            // WEEK 3: DIVERSITY ENTROPY SPIKE
            // Lower floor from 0.75 -> 0.60 during flush to allow deeper variety.
            const globalFloor = context.isExplorationFlush ? 0.60 : 0.75;
            const finalMultiplier = Math.max(globalFloor, diversityMultiplier);
            const finalScore = st.score * finalMultiplier;

            // LOG STABILITY CHECK
            if (finalMultiplier < 0.80) {
                // console.log(`[Diversity] Nudging ${track.title} by ${track.artist} (multiplier: ${finalMultiplier.toFixed(2)})`);
            }

            return {
                ...st,
                score: finalScore,
                debug: {
                    ...st.debug,
                    diversityMultiplier: finalMultiplier,
                    originalScore: st.score
                }
            };
        }).sort((a, b) => b.score - a.score);
    }
}
