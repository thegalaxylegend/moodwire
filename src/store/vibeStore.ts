
import { create } from 'zustand';
import { ref, set as rtdbSet, serverTimestamp, push, onChildAdded, off } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { rtdb, auth, db } from '../lib/firebase';
import { cacheService } from '../services/cacheService';
import { onAuthStateChanged } from 'firebase/auth';
import { trackingService } from '../services/trackingService';
import { youtubeService } from '../services/youtubeService';
import { recommendationEngine } from '../services/recommendation/RecommendationService';

export interface Track {
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    url?: string;
    vibe?: string;
    genre?: string;
    mood?: string;
    language?: string;
    source?: 'audius' | 'youtube' | 'local';
    platformId?: string;
    audioFeatures?: {
        tempo?: number;
        energy?: number;
        danceability?: number;
        valence?: number;
        acousticness?: number;
        instrumentalness?: number;
    };
    duration?: number;
    popularityScore?: number;
    trustTier?: number; // 1.0 (Official), 0.8 (General), 0.4 (Noise/Rip)
    trustMetadata?: string; // Reason for trust tier
}

interface VibeState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    vibeId: string | null;
    isMaster: boolean;
    deviceId: string;
    ghostDataMode: boolean;
    history: Track[];
    favorites: Track[];
    dislikedTracks: string[]; // New: List of banned track IDs
    searchHistory: string[];
    skippedTracks: string[];
    completedTracks: string[];
    queue: Track[];
    isFullScreen: boolean;
    topGenres: string[];
    seekRequest: { time: number, ts: number } | null;
    recommendationMode: 'v3_weighted' | 'v4_ml';
    location: any | null;
    preferences: {
        languages: string[];
        favoriteArtists: string[];
        vibeTypes: string[];
        discoveryLevel: 'low' | 'balanced' | 'high';
        explicitFilter: boolean;
        isOnboarded?: boolean;
    };
    lastPlayNextCall: number; // For cooldown
    setRecommendationMode: (mode: 'v3_weighted' | 'v4_ml') => void;
    setTrack: (track: Track) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    togglePlay: () => void;
    joinVibe: (vibeId: string) => void;
    syncOut: () => void;
    setIsMaster: (isMaster: boolean) => void;
    setGhostDataMode: (enabled: boolean) => void;
    toggleFavorite: (track: Track) => void;
    toggleDislike: (trackId: string) => void; // New Action
    clearHistory: () => void;
    addToSearchHistory: (query: string) => void;
    clearSearchHistory: () => void;
    setQueue: (tracks: Track[]) => void;
    playNext: (reason?: string) => void;
    playPrevious: () => void;
    seekTo: (time: number) => void;
    toggleFullScreen: () => void;
    setFullScreen: (isFullScreen: boolean) => void;
    syncToCloud: () => void;
    updatePreferences: (prefs: Partial<VibeState['preferences']>) => void;
    fetchLocation: () => Promise<void>;
    sendReaction: (vibeId: string, emoji: string) => void;
    onReaction: (callback: (reaction: { id: string, emoji: string }) => void) => () => void;
    replaceCurrentTrack: (newTrack: Track) => void;
}

export const useVibeStore = create<VibeState>((set, get) => ({
    currentTrack: JSON.parse(localStorage.getItem('mw_current_track') || 'null'),
    isPlaying: false,
    volume: 80,
    progress: 0,
    duration: 0,
    vibeId: null,
    isMaster: false,
    deviceId: Math.random().toString(36).substring(7),
    ghostDataMode: false,
    history: JSON.parse(localStorage.getItem('mw_playback_history') || '[]'),
    favorites: JSON.parse(localStorage.getItem('mw_favorites') || '[]'),
    dislikedTracks: JSON.parse(localStorage.getItem('mw_disliked_tracks') || '[]'),
    searchHistory: JSON.parse(localStorage.getItem('mw_search_history') || '[]'),
    queue: [],
    isFullScreen: false,
    topGenres: JSON.parse(localStorage.getItem('mw_top_genres') || '[]'),
    skippedTracks: JSON.parse(localStorage.getItem('mw_skipped_tracks') || '[]'),
    completedTracks: JSON.parse(localStorage.getItem('mw_completed_tracks') || '[]'),
    seekRequest: null,
    lastPlayNextCall: 0,
    recommendationMode: (localStorage.getItem('mw_rec_mode') as 'v3_weighted' | 'v4_ml') || 'v3_weighted',
    location: null,
    preferences: JSON.parse(localStorage.getItem('mw_preferences') || JSON.stringify({
        languages: ['English', 'Hindi'],
        favoriteArtists: [],
        vibeTypes: ['Chill', 'Pop'],
        discoveryLevel: 'balanced',
        explicitFilter: false,
        isOnboarded: false
    })),

    syncToCloud: async () => {
        const user = auth.currentUser;
        if (!user) return;
        const state = get();
        try {
            await setDoc(doc(db, 'users', user.uid), {
                history: state.history.slice(0, 20),
                favorites: state.favorites,
                dislikedTracks: state.dislikedTracks, // Sync dislikes
                topGenres: state.topGenres,
                skippedTracks: state.skippedTracks.slice(-50),
                completedTracks: state.completedTracks.slice(-50),
                preferences: state.preferences,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error('Firestore sync error:', e);
        }
    },

    setTrack: (track) => {
        // If track is disliked, don't play it and skip to next (unless explicit user action forced it, but better safe)
        if (get().dislikedTracks.includes(track.id)) {
            console.warn(`Skipping disliked track: ${track.title}`);
            // If in queue, try next. If manual, allow it but warn.
            // For now, allow playback but log.
        }

        set((state) => {
            const newHistory = [track, ...state.history.filter(t => t.id !== track.id)].slice(0, 50);
            localStorage.setItem('mw_current_track', JSON.stringify(track));
            localStorage.setItem('mw_playback_history', JSON.stringify(newHistory));
            let newGenres = state.topGenres;
            if (track.genre) {
                newGenres = [track.genre, ...state.topGenres.filter(g => g !== track.genre)].slice(0, 10);
                localStorage.setItem('mw_top_genres', JSON.stringify(newGenres));
            }
            return { currentTrack: track, progress: 0, history: newHistory, topGenres: newGenres, isPlaying: true };
        });
        cacheService.saveTrack(track);
        trackingService.logEvent('track_play', { trackId: track.id, artist: track.artist });
        get().syncOut();
        get().syncToCloud();
    },

    setQueue: (tracks) => set({ queue: tracks }),
    setIsPlaying: (isPlaying) => { set({ isPlaying }); get().syncOut(); },
    setVolume: (volume) => set({ volume }),
    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),
    togglePlay: () => { set((s) => ({ isPlaying: !s.isPlaying })); get().syncOut(); },

    syncOut: () => {
        const state = get();
        if (state.vibeId && state.isMaster) {
            rtdbSet(ref(rtdb, `vibes/${state.vibeId}`), {
                currentTrack: state.currentTrack,
                isPlaying: state.isPlaying,
                progress: state.progress,
                updatedAt: Date.now()
            });
        }
    },

    playNext: (reason = 'Manual/Unknown') => {
        const { queue, currentTrack, progress, duration, skippedTracks, completedTracks, location, dislikedTracks, history, lastPlayNextCall } = get();

        // 🛡️ SKIP COOLDOWN (1.5s): Prevents rapid automatic skips
        const now = Date.now();
        if (now - lastPlayNextCall < 1500) {
            console.warn(`🕒 Skipping playNext (Cooldown). Reason: ${reason}`);
            return;
        }
        set({ lastPlayNextCall: now });

        console.log(`⏩ playNext Triggered | Reason: ${reason} | Track: ${currentTrack?.title}`);

        if ((window as any)._isAutoPlaying) return;

        if (currentTrack) {
            if (duration > 30 && progress < 20) {
                const newSkipped = [...skippedTracks, currentTrack.id].slice(-100);
                set({ skippedTracks: newSkipped });
                localStorage.setItem('mw_skipped_tracks', JSON.stringify(newSkipped));
                get().syncToCloud();

                // NEW: Register feedback
                recommendationEngine.handleFeedback('skip', currentTrack, { progress, duration });
            } else if (duration > 0 && progress > duration * 0.8) {
                const newCompleted = [...completedTracks, currentTrack.id].slice(-100);
                set({ completedTracks: newCompleted });
                localStorage.setItem('mw_completed_tracks', JSON.stringify(newCompleted));
                get().syncToCloud();

                // NEW: Register feedback
                recommendationEngine.handleFeedback('complete', currentTrack, { progress, duration });
            }
        }

        if (queue.length === 0) {
            if (currentTrack) {
                (window as any)._isAutoPlaying = true;

                // Step 4: Fix Autoplay - Prioritize Short Term Intent
                // Use last 3 tracks to build a "Context Query"
                const recentContext = [currentTrack, ...history.slice(0, 2)].filter(t => t);
                const uniqueArtists = [...new Set(recentContext.map(t => t.artist))].slice(0, 2);
                const dominantGenre = currentTrack.genre || 'music';

                let query = '';
                const useFavoriteSeed = get().favorites.length > 0 && Math.random() < 0.3; // Reduced chance for random fav
                const isExplorationFlush = recommendationEngine.isExplorationFlushActive();

                if (isExplorationFlush) {
                    // WEEK 3: QUERY PIVOT (Discovery Search)
                    // Ignore context, use broader preference-based discovery
                    const vibes = get().preferences.vibeTypes.slice(0, 2).join(' ');
                    query = `${vibes} music discovery mix`;
                    console.log('🌪️ VibeStore: EXPLORATION FLUSH! Pivot -> Discovery:', query);
                } else if (useFavoriteSeed) {
                    const randomFav = get().favorites[Math.floor(Math.random() * get().favorites.length)];
                    // Use query masking for safety
                    query = `${randomFav.artist} ${randomFav.genre || 'songs'} similar`;
                    console.log('🤖 VibeStore: Autoplay Seed -> Favorite:', randomFav.title);
                } else {
                    // Construct Intent-Based Query
                    const artistQuery = uniqueArtists.join(' ');
                    query = `${artistQuery} ${dominantGenre} similar songs`;
                    console.log('🤖 VibeStore: Autoplay Seed -> Context:', query);
                }

                // Step 5: Multi-Query Super Pool (Fixes Bottleneck & Focuses on Indian Popular Hits)
                const queriesToRun: string[] = [];
                const isIndia = location?.country === 'IN' || !location?.country; // Default to India
                const langs = get().preferences.languages || ['Hindi'];

                // 1. Primary Intent Query (Context or Discovery)
                if (isIndia && !query.includes('latest') && !query.includes('india')) {
                    query += ' indian hits';
                }
                queriesToRun.push(query);

                // 2. Popularity / Cold Start Fallback (Always fetch top charts to guarantee quality)
                queriesToRun.push('Bollywood Top Hits 2025');

                // 3. Regional / Language specific injection
                if (langs.includes('Punjabi')) {
                    queriesToRun.push('Latest Punjabi Hits 2025');
                } else if (langs.includes('Tamil') || langs.includes('Telugu')) {
                    queriesToRun.push('Trending South Indian Songs 2025');
                } else {
                    queriesToRun.push('Trending Indian Lofi Music'); // Safe fallback
                }

                console.log('🌪️ VibeStore: Firing Multi-Query Super Pool:', queriesToRun);

                // Fire all queries in parallel and merge results into a massive candidate pool
                Promise.all(queriesToRun.map(q => youtubeService.searchVideos(q, isIndia ? 'IN' : 'US')))
                    .then((results) => {
                        // Merge all pools and deduplicate by ID
                        const mergedPool = [...results[0], ...results[1], ...results[2]];
                        const uniqueMap = new Map();
                        for (const t of mergedPool) {
                            if (t && t.id) uniqueMap.set(t.id, t);
                        }
                        const finalSuperPool = Array.from(uniqueMap.values());
                        
                        console.log(`🧠 VibeStore: Feeding ${finalSuperPool.length} tracks to Scoring Engine`);

                        const isManualSkip = reason === 'Manual' || reason === 'Skip';
                        const isRapidSkip = currentTrack && duration > 0 && progress < 20;

                        const recommendations = recommendationEngine.getRecommendations(
                            finalSuperPool,
                            {
                                history: get().history,
                                favorites: get().favorites,
                                preferences: get().preferences,
                                currentTrack,
                                skippedIds: new Set([...get().skippedTracks, ...dislikedTracks]),
                                completedIds: new Set(get().completedTracks), // FIX 5: Implicit Feedback
                                location,
                                manualIntentOverride: isManualSkip || isRapidSkip // FIX 4: Detect manual intent to kill vibe-locking
                            }
                        );
                        if (recommendations.length > 0) {
                            set({ queue: recommendations.slice(1) });
                            get().setTrack(recommendations[0]);
                        }
                    })
                    .finally(() => { (window as any)._isAutoPlaying = false; });
            }
            return;
        }

        // Skip disliked tracks in queue if any
        let nextIndex = (currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1) + 1;
        while (nextIndex < queue.length && dislikedTracks.includes(queue[nextIndex].id)) {
            nextIndex++;
        }

        // If wrapped around or end of queue
        if (nextIndex >= queue.length) {
            nextIndex = 0;
        }

        get().setTrack(queue[nextIndex]);
    },

    playPrevious: () => {
        const { queue, currentTrack } = get();
        if (queue.length === 0) return;
        const index = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
        get().setTrack(queue[(index - 1 + queue.length) % queue.length]);
    },

    toggleFavorite: (track) => {
        set((state) => {
            const isFav = state.favorites.some(t => t.id === track.id);
            const next = isFav ? state.favorites.filter(t => t.id !== track.id) : [track, ...state.favorites];
            localStorage.setItem('mw_favorites', JSON.stringify(next));
            return { favorites: next };
        });
        get().syncToCloud();
    },

    toggleDislike: (trackId) => {
        set((state) => {
            const isDisliked = state.dislikedTracks.includes(trackId);
            const next = isDisliked
                ? state.dislikedTracks.filter(id => id !== trackId)
                : [...state.dislikedTracks, trackId];

            localStorage.setItem('mw_disliked_tracks', JSON.stringify(next));

            // If adding a dislike, also remove from favorites/queue if present
            if (!isDisliked) {
                const newFavs = state.favorites.filter(t => t.id !== trackId);
                const newQueue = state.queue.filter(t => t.id !== trackId);
                localStorage.setItem('mw_favorites', JSON.stringify(newFavs));
                return { dislikedTracks: next, favorites: newFavs, queue: newQueue };
            }

            return { dislikedTracks: next };
        });
        get().syncToCloud();

        // If current track is the one being disliked, skip it immediately
        const state = get();
        if (state.currentTrack?.id === trackId) {
            state.playNext();
        }
    },

    fetchLocation: async () => {
        const { geoLocationService } = await import('../services/geoLocationService');
        const loc = await geoLocationService.getLocation();
        if (loc) {
            set({ location: loc });
            if (loc.country === 'IN' && get().preferences.languages.length <= 1) {
                get().updatePreferences({ languages: ['Hindi', 'English', 'Punjabi'] });
            }
        }
    },

    updatePreferences: (newPrefs) => {
        set((state) => {
            const preferences = { ...state.preferences, ...newPrefs };
            localStorage.setItem('mw_preferences', JSON.stringify(preferences));
            return { preferences, queue: [] };
        });
        get().syncToCloud();
    },

    setRecommendationMode: (mode) => {
        localStorage.setItem('mw_rec_mode', mode);
        set({ recommendationMode: mode, queue: [] });
    },

    joinVibe: (vibeId) => set({ vibeId }),
    setIsMaster: (isMaster) => set({ isMaster }),
    setGhostDataMode: (enabled) => set({ ghostDataMode: enabled }),
    addToSearchHistory: (query) => {
        set(s => {
            const next = [query, ...s.searchHistory.filter(q => q !== query)].slice(0, 10);
            localStorage.setItem('mw_search_history', JSON.stringify(next));
            return { searchHistory: next };
        });
    },
    clearSearchHistory: () => { localStorage.removeItem('mw_search_history'); set({ searchHistory: [] }); },
    seekTo: (time) => set({ progress: time, seekRequest: { time, ts: Date.now() } }),
    toggleFullScreen: () => set(s => ({ isFullScreen: !s.isFullScreen })),
    setFullScreen: (is) => set({ isFullScreen: is }),
    clearHistory: () => { localStorage.removeItem('mw_playback_history'); set({ history: [] }); },

    sendReaction: (vibeId, emoji) => {
        const reactionsRef = ref(rtdb, `vibes/${vibeId}/reactions`);
        push(reactionsRef, { emoji, timestamp: serverTimestamp() });
    },

    onReaction: (callback) => {
        const state = get();
        if (!state.vibeId) return () => { };
        const reactionsRef = ref(rtdb, `vibes/${state.vibeId}/reactions`);
        const listener = onChildAdded(reactionsRef, (snapshot) => {
            const val = snapshot.val();
            if (val && (Date.now() - (val.timestamp || 0) < 10000)) {
                callback({ id: snapshot.key as string, emoji: val.emoji });
            }
        });
        return () => off(reactionsRef, 'child_added', listener);
    },

    replaceCurrentTrack: (newTrack) => {
        set((state) => {
            const newQueue = state.queue.map(t => t.id === state.currentTrack?.id ? newTrack : t);
            console.log('🔄 VibeStore: Replacing current track with fallback:', newTrack.title);
            return { currentTrack: newTrack, queue: newQueue };
        });
        get().syncOut();
    }

}));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
            const d = snap.data();
            let prefs = d.preferences || useVibeStore.getState().preferences;

            // Auto-onboard existing active users so we don't interrupt them
            if (prefs.isOnboarded === undefined) {
                if ((d.history && d.history.length > 5) || (d.favorites && d.favorites.length > 0)) {
                    prefs.isOnboarded = true;
                }
            }

            useVibeStore.setState({
                favorites: d.favorites || [],
                history: d.history || [],
                topGenres: d.topGenres || [],
                skippedTracks: d.skippedTracks || [],
                dislikedTracks: d.dislikedTracks || [], // Load dislikes
                completedTracks: d.completedTracks || [],
                preferences: prefs
            });
        }
    }
});
