
import { RecommendationService } from '../src/services/recommendation/RecommendationService';
import { ScoringEngine } from '../src/services/recommendation/core/ScoringEngine';
import { DEFAULT_WEIGHTS } from '../src/services/recommendation/types';

/**
 * CHAOS WEEK: Phase 1 - Forensic Stress Test
 * This script simulates adversarial user behavior to test system resilience.
 */
async function runChaosSimulation() {
    console.log("🧬 CHAOS WEEK: Beginning Stress Test Simulation...\n");

    const service = new RecommendationService();
    // @ts-ignore - access for test
    const engine = service.engine;

    const mockPool = Array.from({ length: 100 }, (_, i) => ({
        id: `track-${i}`,
        title: `Chaos Track ${i}`,
        artist: i % 5 === 0 ? "Loyal Artist" : `Artist ${i}`,
        source: i % 10 === 0 ? 'audius' : 'youtube',
        trustTier: i % 7 === 0 ? 0.4 : 0.8,
        trustMetadata: 'Chaos Test Metadata',
        artwork: 'https://example.com/art.jpg', // MUST have artwork to pass pre-filter
        energy: (i % 10) / 10,
        popularityScore: 0.5,
        audioFeatures: { energy: (i % 10) / 10, valence: 0.5, danceability: 0.5 }
    } as any));

    const scenarios = [
        { name: "1. Hyper-loyal Fan", behavior: "Play same artist 10 times" },
        { name: "2. Genre Whiplash", behavior: "Sudden energy jump from 0.1 to 0.9" },
        { name: "3. Passive Ghost", behavior: "10 completions, 0 skips" },
        { name: "4. The Gaslighter", behavior: "Skip only high-trust official tracks" },
        { name: "5. Flush Abuse", behavior: "Trigger back-to-back deadlock conditions" }
    ];

    for (const scenario of scenarios) {
        console.log(`--- Scenario: ${scenario.name} ---`);
        console.log(`Behavior: ${scenario.behavior}`);

        let history: any[] = [];
        const dynamicSystem = engine.getDynamicSystem();

        if (scenario.name === "1. Hyper-loyal Fan") {
            const track = mockPool.find(t => t.artist === "Loyal Artist")!;
            for (let i = 0; i < 10; i++) {
                service.handleFeedback('complete', track, { duration: 180, progress: 180 });
                history.push(track);
            }
        }

        if (scenario.name === "2. Genre Whiplash") {
            const lowEnergy = mockPool.find(t => t.energy < 0.2)!;
            const highEnergy = mockPool.find(t => t.energy > 0.8)!;
            service.handleFeedback('complete', lowEnergy, { duration: 180, progress: 180 });
            service.handleFeedback('skip', highEnergy, { duration: 180, progress: 5 });
        }

        if (scenario.name === "4. The Gaslighter") {
            const highTrust = mockPool.find(t => t.trustTier === 1.0) || mockPool[0];
            for (let i = 0; i < 5; i++) {
                service.handleFeedback('skip', highTrust, { duration: 180, progress: 10 });
            }
        }

        const recs = service.getRecommendations(mockPool, {
            history,
            favorites: [],
            preferences: { vibeTypes: ['coding'] },
            currentTrack: history[history.length - 1] || null,
            skippedIds: new Set()
        });

        console.log(`Result: Generated ${recs.length} recommendations.`);
        console.log(`Trust Multiplier: ${dynamicSystem.getAdaptiveTrustMultiplier(0.8).toFixed(3)}`);
        console.log(`Is Flush Active: ${service.isExplorationFlushActive()}\n`);
    }

    console.log("✅ CHAOS WEEK: Initial Simulation Complete.");
}

runChaosSimulation().catch(console.error);
