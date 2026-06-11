
import { RankingEngine } from './core/RankingEngine';
import { DiversityReRanker } from './core/DiversityReRanker';
import { DEFAULT_WEIGHTS, type RecommendationContext, type ScoredTrack } from './types';
import type { Track } from '../../store/vibeStore';
import { ConfigProvider } from './services/ConfigProvider';
import { ProfileService } from './services/ProfileService';
import { TelemetryService } from './services/TelemetryService';

/**
 * RecommendationService (Orchestrator)
 * 
 * A tiered recommendation system inspired by Spotify/YouTube architecture.
 * Layers:
 * 1. Retrieval (Candidate Filtering & Hygiene)
 * 2. Ranking (Behavioral Scoring Engine)
 * 3. Re-Ranking (Diversity, Serendipity, Business Logic)
 * 4. Observability (Batched Telemetry)
 */
export class RecommendationService {
    private engine: RankingEngine;
    private engineVersion: number = 0;
    private configProvider: ConfigProvider;
    private profileService: ProfileService;
    private telemetry: TelemetryService;
    
    private flushTTL: number = 0;
    private lastRankIds: string[] = [];

    constructor() {
        this.engine = new RankingEngine(DEFAULT_WEIGHTS);
        this.profileService = new ProfileService();
        this.telemetry = new TelemetryService();
        
        this.configProvider = new ConfigProvider(DEFAULT_WEIGHTS, (newWeights) => {
            this.engineVersion++;
            this.engine = new RankingEngine(newWeights);
            console.log(`🧬 Orchestrator: Engine Hot-Swap to v${this.engineVersion}`);
        });
    }

    public getRecommendations(
        pool: Track[],
        userContext: {
            history: Track[];
            favorites: Track[];
            preferences: any;
            currentTrack: Track | null;
            skippedIds: Set<string>;
            completedIds?: Set<string>;
            location?: any | null;
            manualIntentOverride?: boolean;
        },
        limit: number = 10
    ): Track[] {
        const sessionId = 'session_' + Math.floor(Date.now() / 3600000);

        // 0. DYNAMIC STATE MGMT
        const dynamicSystem = this.engine.getDynamicSystem();
        if (dynamicSystem.isFlushRequired()) {
            this.flushTTL = 2;
            dynamicSystem.consumeFlushRequest();
        }

        // 1. PROFILE RESOLUTION
        const profile = this.profileService.getProfile(userContext);
        if (!profile) {
            this.telemetry.logFallback("Profile initialization failed", sessionId);
            return pool.slice(0, limit);
        }

        const context: RecommendationContext = {
            timeOfDay: new Date().getHours(),
            deviceType: (typeof window !== 'undefined' && window.innerWidth < 768) ? 'mobile' : 'desktop',
            currentSessionId: sessionId,
            recentTracks: this.flushTTL > 0 ? [] : userContext.history.slice(0, 20),
            currentTrack: userContext.currentTrack,
            isAutoplay: true,
            location: userContext.location,
            isExplorationFlush: this.flushTTL > 0,
            manualIntentOverride: userContext.manualIntentOverride
        };

        // 2. RETRIEVAL & HYGIENE (Tier 1)
        const effectivePool = this.retrieveCandidates(pool, userContext);

        // 3. RANKING (Tier 2)
        const currentVersion = this.engineVersion;
        const scoredCandidates: ScoredTrack[] = effectivePool
            .map(t => {
                const scored = this.engine.scoreCandidate(t, profile, context);
                // Soft quality penalty instead of hard filtering
                if (!t.artwork) scored.score *= 0.7;
                return scored;
            })
            .filter(st => st.score > 0.01); // Adaptive threshold for long-tail discovery

        scoredCandidates.sort((a, b) => b.score - a.score);

        // 4. RE-RANKING (Tier 3)
        let reRanked = DiversityReRanker.reRank(scoredCandidates, context);

        // Serendipity Injection
        reRanked = this.injectSerendipity(reRanked, scoredCandidates);

        // 5. VOLATILITY & TELEMETRY
        const currentIds = reRanked.slice(0, limit).map(st => st.track.id);
        const volatility = this.calculateVolatility(currentIds);
        this.lastRankIds = currentIds;

        this.telemetry.logRecommendationBatch(
            reRanked.slice(0, limit), 
            context, 
            {
                volatility,
                engineVersion: currentVersion,
                violationCount: dynamicSystem.getViolationCount(),
                adaptiveTrustMult: dynamicSystem.getAdaptiveTrustMultiplier(0.8)
            }
        );

        if (this.flushTTL > 0) this.flushTTL--;

        return reRanked.slice(0, limit).map(st => st.track);
    }

    private retrieveCandidates(pool: Track[], userContext: any): Track[] {
        const recentIds = new Set(userContext.history.slice(0, 100).map((t: Track) => t.id));
        
        // Identity Dedup with Fuzzy Matching
        const getIdentityKey = (t: Track) => {
            const cleanTitle = t.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
            const cleanArtist = t.artist.toLowerCase().replace(/[^\w\s]/g, '').trim();
            return `${cleanTitle}|${cleanArtist}`;
        };

        const recentIdentityKeys = new Set(
            userContext.history.slice(0, 50).map((t: Track) => getIdentityKey(t))
        );

        const seenIds = new Set<string>();
        const seenKeys = new Set<string>();

        return pool.filter(t => {
            if (userContext.skippedIds.has(t.id)) return false;
            if (recentIds.has(t.id) || seenIds.has(t.id)) return false;
            if (t.id === userContext.currentTrack?.id) return false;

            const key = getIdentityKey(t);
            if (recentIdentityKeys.has(key) || seenKeys.has(key)) return false;

            seenIds.add(t.id);
            seenKeys.add(key);
            return true;
        });
    }

    private injectSerendipity(reRanked: ScoredTrack[], candidates: ScoredTrack[]): ScoredTrack[] {
        if (reRanked.length > 5 && Math.random() < 0.25) {
            // Find a "discovery" track: low similarity but decent overall quality
            const wildcard = candidates.find(st => 
                st.score < 0.3 && 
                st.score > 0.05 && 
                !reRanked.slice(0, 5).some(r => r.track.id === st.track.id)
            );
            
            if (wildcard) {
                const copy = [...reRanked];
                const insertPos = Math.floor(Math.random() * 2) + 1;
                copy.splice(insertPos, 0, wildcard);
                return copy;
            }
        }
        return reRanked;
    }

    private calculateVolatility(newIds: string[]): number {
        if (this.lastRankIds.length === 0 || newIds.length === 0) return 0;
        const overlap = newIds.filter(id => this.lastRankIds.includes(id)).length;
        return (overlap / newIds.length) * 100;
    }

    public handleFeedback(type: 'skip' | 'complete' | 'like', track: Track, context?: { duration?: number, progress?: number }) {
        if (!track) return;
        const dynamicSystem = this.engine.getDynamicSystem();
        const progress = context?.progress || 0;

        if (type === 'skip') {
            dynamicSystem.registerSkip(track, progress);
        } else if (type === 'complete') {
            dynamicSystem.registerCompletion(track, progress);
        }
    }

    public isExplorationFlushActive(): boolean {
        return this.flushTTL > 0;
    }

    public dispose() {
        this.configProvider.dispose();
    }
}

export const recommendationEngine = new RecommendationService();
