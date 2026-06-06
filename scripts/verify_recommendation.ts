
import { recommendationEngine } from '../src/services/recommendation/RecommendationService';
import { FeatureExtractor } from '../src/services/recommendation/core/FeatureExtractor';
import { ScoringEngine } from '../src/services/recommendation/core/ScoringEngine';
import { DEFAULT_WEIGHTS } from '../src/services/recommendation/types';

// Mock Track
const mockTrack = (id: string, title: string, artist: string, tempo: number, energy: number, genre: string): any => ({
    id, title, artist, genre,
    audioFeatures: { tempo, energy, danceability: 0.5, valence: 0.5, acousticness: 0, instrumentalness: 0 },
    popularityScore: 0.5,
    recencyScore: 0.9
});

const runVerification = () => {
    console.log("🚀 Starting Recommendation Engine V2 Verification...");

    // 1. Feature Extraction Test
    const track1 = mockTrack("t1", "Hype Song", "Drake", 140, 0.9, "HipHop");
    const features = FeatureExtractor.normalizeAudioFeatures(track1);
    console.log("✅ Feature Extractor Output:", features);
    if (features.length !== 6 || features[0] !== 0.9) console.error("❌ Feature mismatch");

    // 2. User Profile Construction
    const history = [
        mockTrack("t1", "Hype Song", "Drake", 140, 0.9, "HipHop"),
        mockTrack("t2", "Chill Song", "Lofi Girl", 80, 0.2, "Lofi"),
    ];
    const affinity = FeatureExtractor.getUserAffinityVector(history);
    console.log("✅ User Affinity Vector:", affinity);

    // 3. Scoring Engine Test
    const engine = new ScoringEngine(DEFAULT_WEIGHTS);
    const candidate = mockTrack("t3", "Mid Energy", "Drake", 110, 0.6, "HipHop");

    const userProfile = {
        affirmations: { favoriteArtists: ["Drake"], favoriteGenres: [], dislikedArtists: [], languages: ["English"] },
        affinityVector: affinity,
        languageWeights: { "English": 1 },
        fatigueScore: 0,
        churnRisk: 0,
        lastActive: Date.now()
    };

    const context = {
        timeOfDay: 20, // Evening (High Energy)
        deviceType: "mobile" as const,
        currentSessionId: "test_sess",
        recentTracks: [],
        currentTrack: null,
        isAutoplay: true
    };

    const scoreResult = engine.scoreCandidate(candidate, userProfile, context);
    console.log("✅ Candidate Score:", scoreResult.score);
    console.log("✅ Score Breakdown:", scoreResult.debug.breakdown);

    if (scoreResult.score > 0 && scoreResult.debug.breakdown.artistAffinity === 1.0) {
        console.log("🎉 VERIFICATION PASSED: Engine is producing logical scores.");
    } else {
        console.error("❌ VERIFICATION FAILED: Scores are zero or logic missing.");
    }
};

runVerification();
