
import { ScoringEngine } from '../src/services/recommendation/core/ScoringEngine';
import { DiversityReRanker } from '../src/services/recommendation/core/DiversityReRanker';
import { DEFAULT_WEIGHTS, type UserProfile, type RecommendationContext } from '../src/services/recommendation/types';
import type { Track } from '../src/store/vibeStore';

// 1. SETUP MOCK DATA
const favoriteArtist = "Arijit Singh";
const otherArtists = ["Weekend", "Drake", "Taylor Swift", "Diljit Dosanjh", "Pritam"];

const generatePool = (size: number): Track[] => {
    return Array.from({ length: size }).map((_, i) => ({
        id: `track-${i}`,
        title: `Song ${i}`,
        artist: i < size * 0.4 ? favoriteArtist : otherArtists[i % otherArtists.length],
        source: i % 3 === 0 ? 'youtube' : 'audius',
        genre: i < size * 0.4 ? 'Bollywood' : 'Pop',
        audioFeatures: { energy: 0.6, valence: 0.5, tempo: 100 }
    }));
};

const mockUserProfile: UserProfile = {
    affirmations: {
        favoriteArtists: [favoriteArtist],
        favoriteGenres: ['Bollywood'],
        dislikedArtists: [],
        languages: ['Hindi', 'English']
    },
    affinityVector: [0.8, 0.7, 0.6, 0.2, 0.0, 0.5], // Biased toward high energy/valence
    languageWeights: { 'Hindi': 1.0, 'English': 0.8 },
    fatigueScore: 0,
    churnRisk: 0,
    lastActive: Date.now()
};

// 2. SIMULATION ENGINE
function runSim() {
    console.log("🚀 STARTING TRUST MEASUREMENT SIMULATION...\n");

    const pool = generatePool(50);
    const engine = new ScoringEngine(DEFAULT_WEIGHTS);

    // Simulate short-term history: 3 songs already played from the favorite artist
    const recentHistory: Track[] = Array.from({ length: 3 }).map((_, i) => ({
        id: `hist-${i}`,
        title: `History ${i}`,
        artist: favoriteArtist,
        source: 'youtube',
        genre: 'Bollywood'
    }));

    const context: RecommendationContext = {
        timeOfDay: 20,
        deviceType: 'desktop',
        currentSessionId: 'test-session',
        recentTracks: recentHistory,
        currentTrack: null,
        isAutoplay: true
    };

    // --- CASE A: BEFORE (Raw Scoring Only) ---
    // Realistic Gaps: 
    // - Favorites (0-15): 0.95
    // - Strong Discovery (15-25): 0.80
    // - General (25+): 0.50
    const rawScored = pool.map((t, i) => {
        const base = engine.scoreCandidate(t, mockUserProfile, context);
        let realisticScore = 0.50;
        if (i < 15) realisticScore = 0.95;
        else if (i < 25) realisticScore = 0.80;
        return { ...base, score: realisticScore };
    }).sort((a, b) => b.score - a.score);

    // --- CASE B: AFTER (Diversity Re-Ranking) ---
    const reRanked = DiversityReRanker.reRank([...rawScored], context);

    // 3. ANALYZE TOP 10
    const top10Before = rawScored.slice(0, 10);
    const top10After = reRanked.slice(0, 10);

    // Metric Calculations
    const getStats = (list: any[]) => {
        const artists = list.map(st => st.track.artist);
        const sources = list.map(st => st.track.source);
        const repeats = artists.filter(a => a === favoriteArtist).length;

        // Spacing
        const indices = artists.map((a, i) => a === favoriteArtist ? i : -1).filter(i => i !== -1);
        let avgSpacing = 0;
        if (indices.length > 1) {
            const distances = indices.slice(1).map((idx, i) => idx - indices[i]);
            avgSpacing = distances.reduce((a, b) => a + b, 0) / distances.length;
        } else if (indices.length === 1) {
            avgSpacing = 10; // Maximized spacing for single instance
        }

        const ytCount = sources.filter(s => s === 'youtube').length;
        return { repeats, ytCount, avgSpacing };
    };

    const beforeStats = getStats(top10Before);
    const afterStats = getStats(top10After);

    console.log("\nSCORE SNAPSHOT (Top 3):");
    console.log("BEFORE (Raw):");
    top10Before.slice(0, 3).forEach(st => console.log(` - [${st.score.toFixed(2)}] ${st.track.artist} - ${st.track.title}`));
    console.log("AFTER (Re-Ranked):");
    top10After.slice(0, 3).forEach(st => console.log(` - [${st.score.toFixed(2)}] ${st.track.artist} - ${st.track.title}`));

    // Top-1 & Top-3 Survival
    const originalTop1Id = top10Before[0].track.id;
    const isTop1Surviving = top10After[0].track.id === originalTop1Id;
    const isTop3Surviving = top10After.slice(0, 3).some(st => st.track.id === originalTop1Id);

    console.log("---------- RESULTS ----------");
    console.log(`Metric                | Before  | After   | Delta`);
    console.log(`-----------------------------------------------`);
    console.log(`Artist Repeats (Top10)| ${beforeStats.repeats}       | ${afterStats.repeats}       | ${afterStats.repeats - beforeStats.repeats}`);
    console.log(`YouTube Dominance     | ${beforeStats.ytCount}       | ${afterStats.ytCount}       | ${afterStats.ytCount - beforeStats.ytCount}`);
    console.log(`Avg Artist Spacing    | ${beforeStats.avgSpacing.toFixed(1)}     | ${afterStats.avgSpacing.toFixed(1)}     | +${(afterStats.avgSpacing - beforeStats.avgSpacing).toFixed(1)}`);
    console.log(`-----------------------------------------------`);
    console.log(`\nTRUST ANCHOR VERIFICATION:`);
    console.log(`✅ Top-1 Survival: ${isTop1Surviving ? 'YES (Anchor Strong)' : 'NO (Pushed Down)'}`);
    console.log(`✅ Top-3 Survival: ${isTop3Surviving ? 'YES (Anchor Stable)' : 'NO (Bully Detected)'}`);
    console.log(`\nSubjective Feel: ${afterStats.avgSpacing > beforeStats.avgSpacing ? "MOVES LIKE A DJ (Spacing Increased)" : "STUCK IN LOOP"}`);
}

runSim();
