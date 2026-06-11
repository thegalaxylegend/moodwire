
import type { Track } from '../../../store/vibeStore';

export const FeatureExtractor = {

    // --- 1. Audio Feature Normalization (with Text Inference) ---
    normalizeAudioFeatures: (track: Track): number[] => {
        let f = track.audioFeatures || {};

        // Inference Strategy for YouTube/Audius tracks without ML data
        if (!track.audioFeatures) {
            const text = `${track.title} ${track.genre || ''} ${track.vibe || ''}`.toLowerCase();

            // Default: Neutral
            let energy = 0.5;
            let valence = 0.5;
            let dance = 0.5;
            let acoustic = 0.1;

            // High Energy / Aggressive / Party Keywords
            if (text.includes('phunk') || text.includes('remix') || text.includes('club') || text.includes('party') ||
                text.includes('dance') || text.includes('gym') || text.includes('workout') || text.includes('energy') ||
                text.includes('pump') || text.includes('shubh') || text.includes('badshah') || text.includes('moose wala')) {
                energy = 0.95;
                dance = 0.9;
                valence = 0.75;
                acoustic = 0.05;
            }
            // Low Energy / Sad / Emotional Keywords
            else if (text.includes('sad') || text.includes('dard') || text.includes('bewafa') || text.includes('emotional') ||
                text.includes('heartbroken') || text.includes('lofi') || text.includes('slow') ||
                text.includes('ambient') || text.includes('relax') || text.includes('sleep') ||
                text.includes('broken') || text.includes('rona') || text.includes('dukh')) {
                energy = 0.2;
                dance = 0.2;
                valence = 0.25;
                acoustic = 0.85;
            }
            // Romantic / Love / Emotional Feel-good
            else if (text.includes('love') || text.includes('romantic') || text.includes('romance') ||
                text.includes('pyar') || text.includes('ishq') || text.includes('dil') ||
                text.includes('acoustic') || text.includes('unplugged') || text.includes('arijit singh lo-fi')) {
                energy = 0.35;
                dance = 0.4;
                valence = 0.7; // High valence = positive/happy emotion
                acoustic = 0.75;
            }

            return [energy, valence, dance, acoustic, 0.0, 0.6];
        }

        // Ensure all are 0-1 range if data exists
        return [
            (f.energy || 0.5),
            (f.valence || 0.5),
            (f.danceability || 0.5),
            (f.acousticness || 0.1),
            (f.instrumentalness || 0.0),
            (Math.min(f.tempo || 120, 200)) / 200 // Normalize BPM
        ];
    },

    // --- 2. User Profile Vector Construction ---
    getUserAffinityVector: (history: Track[], favorites: Track[] = [], skippedIds: Set<string> = new Set(), completedIds: Set<string> = new Set()): number[] => {
        const cleanHistory = history.filter(t => !skippedIds.has(t.id)).slice(0, 30);

        if (cleanHistory.length === 0 && favorites.length === 0) return [0.5, 0.5, 0.5, 0.5, 0.1, 0.5];

        let weightedSum = [0, 0, 0, 0, 0, 0];
        let totalWeight = 0;

        // 1. Process Favorites (Very High Weight: 3.0x)
        favorites.forEach(track => {
            const vec = FeatureExtractor.normalizeAudioFeatures(track);
            const weight = 3.0; // Boosted from 2.0
            vec.forEach((val, i) => weightedSum[i] += val * weight);
            totalWeight += weight;
        });

        // 2. Process History (Focus on RECENT context + COMPLETION status)
        cleanHistory.forEach((track, idx) => {
            const vec = FeatureExtractor.normalizeAudioFeatures(track);
            let weight = Math.exp(-0.15 * idx); // Slightly slower decay to capture more history

            // FIX 5: Implicit Feedback Weighting
            if (completedIds.has(track.id)) {
                weight *= 2.0; // Double weight if user finished the song
            } else {
                weight *= 0.5; // Half weight if it was just a partial listen (passive)
            }

            // Boost very recent tracks (0, 1, 2) to lock in the vibe
            if (idx < 3) weight *= 1.5;

            vec.forEach((val, i) => weightedSum[i] += val * weight);
            totalWeight += weight;
        });

        const vector = weightedSum.map(val => val / (totalWeight || 1));
        return vector;
    },

    // New: Explicit Short-Term Vector (Just the last 3 tracks)
    getShortTermAffinityVector: (recentTracks: Track[]): number[] => {
        // Take last 3 tracks
        const shortMem = recentTracks.slice(0, 3);
        if (shortMem.length === 0) return [0.5, 0.5, 0.5, 0.5, 0.1, 0.5];

        let weightedSum = [0, 0, 0, 0, 0, 0];
        let totalWeight = 0;

        shortMem.forEach((track, idx) => {
            const vec = FeatureExtractor.normalizeAudioFeatures(track);
            // Most recent (idx 0) gets highest weight
            const weight = 3.0 - idx;
            vec.forEach((val, i) => weightedSum[i] += val * weight);
            totalWeight += weight;
        });

        return weightedSum.map(val => val / (totalWeight || 1));
    },

    // --- 3. Math Utils ---
    cosineSimilarity: (vecA: number[], vecB: number[]): number => {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
        const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
        return (magA && magB) ? dot / (magA * magB) : 0;
    }
};
