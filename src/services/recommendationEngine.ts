


interface Track {
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    url?: string;
    vibe?: string;
    genre?: string;
    mood?: string;
    duration?: number;
}

interface UserProfile {
    topGenres: Record<string, number>;
    favoriteArtists: Record<string, number>;
    recentMoods: Record<string, number>;
    averageEnergy: number; // 0-1
}

interface ContextSignal {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    currentActivity?: string;
    currentMood?: string; // Inferred or explicit
}

class RecommendationEngine {

    // --- 1. User Profiling ---

    public generateUserProfile(history: Track[], favorites: Track[]): UserProfile {
        const profile: UserProfile = {
            topGenres: {},
            favoriteArtists: {},
            recentMoods: {},
            averageEnergy: 0.5
        };

        const processTrack = (track: Track, weight: number) => {
            if (track.genre) {
                profile.topGenres[track.genre] = (profile.topGenres[track.genre] || 0) + weight;
            }
            if (track.artist) {
                profile.favoriteArtists[track.artist] = (profile.favoriteArtists[track.artist] || 0) + weight;
            }
            if (track.mood) {
                profile.recentMoods[track.mood] = (profile.recentMoods[track.mood] || 0) + weight;
            }
        };

        // Weight history: Recent tracks have higher weight
        history.slice(0, 50).forEach((track, index) => {
            const recencyWeight = 1 - (index / 50); // 1.0 down to 0.0
            processTrack(track, recencyWeight * 1.0);
        });

        // Weight favorites: High constant weight
        favorites.forEach(track => {
            processTrack(track, 2.0);
        });

        return profile;
    }

    // --- 2. Context Awareness ---

    public getContextSignal(): ContextSignal {
        const hour = new Date().getHours();
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        let timeOfDay: ContextSignal['timeOfDay'] = 'night';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';

        return {
            timeOfDay,
            dayOfWeek: day
        };
    }

    // --- 3. Emotional & Attribute Mapping ---

    private getMoodEnergy(mood?: string): number {
        // Simple mapping of Audius moods to energy levels (0-1)
        const moodMap: Record<string, number> = {
            'Upbeat': 0.9, 'Excited': 0.95, 'Aggressive': 0.9,
            'Empowering': 0.8, 'Cool': 0.6, 'Gritty': 0.7,
            'Peaceful': 0.2, 'Sentimental': 0.3, 'Tender': 0.2, 'Easygoing': 0.4,
            'Yearning': 0.4, 'Sophisticated': 0.5, 'Brooding': 0.3,
            'Fiery': 0.85, 'Defiant': 0.8, 'Romantic': 0.4, 'Stirring': 0.6
        };
        return moodMap[mood || ''] || 0.5;
    }

    // --- 4. Scoring Logic (The "Master Prompt" Formula) ---

    private calculateScore(track: Track, profile: UserProfile, context: ContextSignal, skippedTracks: Set<string>, completedTracks: Set<string>): number {

        // F. Skip Penalty (Heavy)
        if (skippedTracks.has(track.id)) {
            return -100; // Immediate disqualification
        }

        let score = 0;

        // G. Completion Boost (Small)
        if (completedTracks.has(track.id)) {
            score += 0.2; // Liked it enough to finish before
        }


        // A. Taste Similarity (35%)
        const genreScore = profile.topGenres[track.genre || ''] ? Math.min(profile.topGenres[track.genre || ''], 5) / 5 : 0;
        const artistScore = profile.favoriteArtists[track.artist] ? 1 : 0;
        const tasteScore = (genreScore * 0.7) + (artistScore * 0.3);
        score += 0.35 * tasteScore;

        // B. Mood Match (25%)
        // Match context/time of day to ideal energy
        let idealEnergy = 0.5;
        if (context.timeOfDay === 'morning') idealEnergy = 0.8; // Wake up
        if (context.timeOfDay === 'night') idealEnergy = 0.3; // Chill
        if (context.timeOfDay === 'evening') idealEnergy = 0.6; // Party/Relax

        const trackEnergy = this.getMoodEnergy(track.mood);
        const energyDiff = Math.abs(trackEnergy - idealEnergy);
        const moodMatch = 1 - energyDiff; // Closer is better
        score += 0.25 * moodMatch;

        // C. Behavioral Reinforcement (15%)
        // (Simulated: If we had skip data, we'd use it. For now, we prefer tracks with similar mood to recent history)
        const recentMoodScore = profile.recentMoods[track.mood || ''] ? 0.5 : 0;
        score += 0.15 * recentMoodScore;

        // D. Diversity/Discovery Boost (15%)
        const isNovel = !profile.topGenres[track.genre || ''];
        score += 0.15 * (isNovel ? 1 : 0);

        // E. Novelty/Random Factor (10%)
        score += 0.10 * Math.random();

        return score;
    }

    // --- 5. Main Recommendation Pipeline ---

    public rankTracks(candidates: Track[], history: Track[], favorites: Track[], skipped: string[] = [], completed: string[] = []): Track[] {
        const profile = this.generateUserProfile(history, favorites);
        const context = this.getContextSignal();

        const skippedSet = new Set(skipped);
        const completedSet = new Set(completed);

        // Filter out duplicates (tracks already in history recently)
        const recentTrackIds = new Set(history.slice(0, 20).map(t => t.id));
        const filteredCandidates = candidates.filter(t => !recentTrackIds.has(t.id));

        // Score
        const scoredTracks = filteredCandidates.map(track => ({
            track,
            score: this.calculateScore(track, profile, context, skippedSet, completedSet)
        }));

        // Sort
        scoredTracks.sort((a, b) => b.score - a.score);

        // Return top tracks
        return scoredTracks.map(s => s.track);
    }
}

export const recommendationEngine = new RecommendationEngine();
