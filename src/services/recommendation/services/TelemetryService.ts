
import { trackingService } from '../../trackingService';
import type { RecommendationContext, ScoredTrack } from '../types';

export class TelemetryService {
    public logRecommendationBatch(
        decisions: ScoredTrack[],
        ctx: RecommendationContext,
        metrics: {
            volatility: number;
            engineVersion: number;
            violationCount: number;
            adaptiveTrustMult: number;
        }
    ) {
        const batch = decisions.map((d, idx) => ({
            trackId: d.track.id,
            rank: idx,
            score: d.score,
            region: ctx.location?.country || 'unknown',
            provider: d.track.source,
            trustTier: d.track.trustTier || 0.8,
            violations: metrics.violationCount,
            adaptiveMult: metrics.adaptiveTrustMult,
            isFlushPulse: ctx.isExplorationFlush || false,
            volatility: metrics.volatility,
            engineVersion: metrics.engineVersion,
            features: d.debug.breakdown,
            sessionId: ctx.currentSessionId,
            surface: ctx.isAutoplay ? 'autoplay' : 'home'
        }));

        trackingService.logEvent('recommendation_batch_served', {
            count: batch.length,
            sessionId: ctx.currentSessionId,
            avgScore: batch.reduce((acc, b) => acc + b.score, 0) / (batch.length || 1),
            items: batch
        });
    }

    public logFallback(reason: string, sessionId: string) {
        trackingService.logEvent('recommendation_fallback', {
            reason,
            sessionId,
            timestamp: Date.now()
        });
        console.warn(`⚠️ Recommendation Fallback [${sessionId}]: ${reason}`);
    }
}
