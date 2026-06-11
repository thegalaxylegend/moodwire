
import { recommendationEngine } from './recommendation/RecommendationService';
import { ContextualEngine } from './recommendation/core/ContextualEngine';

const HOST_CACHE_KEY = 'audius_host_v1';
const REQUEST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const memoryCache: Record<string, { data: any; timestamp: number }> = {};

let hostList: string[] = [];
let currentHostIndex = 0;

const BACKUP_GATEWAYS = [
    "https://discoveryprovider.audius.co",
    "https://discoveryprovider2.audius.co",
    "https://discoveryprovider3.audius.co",
    "https://audius-discovery-1.cultur3.com",
    "https://audius-dp.singapore.creatorseed.com"
];

// Timeout wrapper — prevents requests from hanging indefinitely
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const fetchWithTimeout = (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
};

const getAudiusHost = async (forceRefresh = false) => {
    // If we have a list and aren't forcing a refresh, return current
    if (hostList.length > 0 && !forceRefresh) {
        return hostList[currentHostIndex];
    }

    // Try to load from cache first if not forcing
    const stored = localStorage.getItem(HOST_CACHE_KEY);
    if (stored && !forceRefresh) {
        hostList = JSON.parse(stored);
        if (hostList.length > 0) return hostList[0];
    }

    try {
        console.log('🌐 Fetching new Audius Gateway list...');
        const response = await fetchWithTimeout("https://api.audius.co", {});
        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
            hostList = data.data;
            // Shuffle for load balancing
            for (let i = hostList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [hostList[i], hostList[j]] = [hostList[j], hostList[i]];
            }
            currentHostIndex = 0;
            localStorage.setItem(HOST_CACHE_KEY, JSON.stringify(hostList));
            console.log(`✅ Audius Gateways refreshed. Active: ${hostList[0]}`);
            return hostList[0];
        }
    } catch (error) {
        console.error('❌ Failed to fetch Audius gateways', error);
    }

    // Fallback to backup gateways if main API fails
    console.warn('⚠️ Main Audius API failed. Using backup gateways.');
    hostList = BACKUP_GATEWAYS;
    return hostList[Math.floor(Math.random() * hostList.length)];
};

const rotateHost = () => {
    if (hostList.length > 0) {
        currentHostIndex = (currentHostIndex + 1) % hostList.length;
        console.warn(`⚠️ Rotating Audius Gateway to: ${hostList[currentHostIndex]}`);
        return hostList[currentHostIndex];
    }
    return "https://api.audius.co";
};

const formatTrack = (t: any, host: string) => {
    if (!t) return null;

    // Quality Filter: Penalize karaoke/covers to surface original-sounding tracks
    let title = (t.title || '').toLowerCase();
    let isCover = title.includes('karaoke') || title.includes('cover') || title.includes('8d') || title.includes('instrumental version');

    let baseTrust = t.user?.is_verified ? 1.0 : 0.8;
    if (isCover) baseTrust -= 0.3; // Heavy penalty for karaoke on indie platforms

    return {
        id: t.id,
        title: t.title,
        artist: t.user?.name || t.artist || 'Unknown Artist',
        artwork: t.artwork?.["480x480"] || t.artwork?.["150x150"] || t.artwork?.["scale_600x600"] || '',
        url: `${host}/v1/tracks/${t.id}/stream?app_name=MOODWIRE`,
        genre: t.genre,
        mood: t.mood,
        duration: t.duration || 0,
        source: 'audius',
        trustTier: Math.max(0.1, baseTrust),
        trustMetadata: t.user?.is_verified ? 'Verified Audius Artist' : (isCover ? 'Low Quality Match' : 'Audius Indie')
    };
};

export const audiusService = {
    refreshHost: () => {
        return rotateHost();
    },

    getStreamUrl: async (trackId: string) => {
        const host = await getAudiusHost();
        return `${host}/v1/tracks/${trackId}/stream?app_name=MOODWIRE`;
    },
    getTrendingTracks: async (genre?: string) => {
        const key = genre ? `trending_${genre}` : 'trending_global';
        if (memoryCache[key] && (Date.now() - memoryCache[key].timestamp < REQUEST_CACHE_TTL)) return memoryCache[key].data;

        const fetchData = async (retry = false): Promise<any[]> => {
            try {
                const host = await getAudiusHost(retry);
                const url = genre
                    ? `${host}/v1/tracks/trending?genre=${encodeURIComponent(genre)}&limit=30&app_name=MOODWIRE`
                    : `${host}/v1/tracks/trending?limit=30&app_name=MOODWIRE`;

                const response = await fetchWithTimeout(url);
                if (!response.ok) throw new Error(`Audius API Error: ${response.status}`);
                const data = await response.json();
                const rawTracks = (data.data || []).map((t: any) => formatTrack(t, host)).filter(Boolean);
                
                // Deduplicate by ID and Identity
                const uniqueTracksMap = new Map();
                for (const t of rawTracks) {
                    const identityKey = `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`;
                    if (!uniqueTracksMap.has(t.id) && !Array.from(uniqueTracksMap.values()).some(existing => {
                        return `${existing.title.toLowerCase().trim()}|${existing.artist.toLowerCase().trim()}` === identityKey;
                    })) {
                        uniqueTracksMap.set(t.id, t);
                    }
                }
                const tracks = Array.from(uniqueTracksMap.values());
                if (tracks.length > 0) {
                    memoryCache[key] = { data: tracks, timestamp: Date.now() };
                }
                return tracks;
            } catch (error: any) {
                if (!retry) {
                    console.warn(`⚠️ Audius Fetch Failed (${genre || 'Global'}). Retrying with new host...`, error?.name);
                    rotateHost();
                    return fetchData(true);
                }
                console.error(`❌ Audius Trending Fetch Failed Final (${genre || 'Global'})`, error);
                return [];
            }
        };

        return fetchData();
    },

    getTrendingIndianTracks: async (region: 'North' | 'South' | 'Punjabi' | 'Lofi' = 'North') => {
        const regionalKeywords = {
            'North': ['Arijit Singh', 'Pritam', 'Bollywood Hits', 'Hindi Pop', 'Badshah', 'Shreya Ghoshal', 'Desi Hip Hop', 'Neha Kakkar', 'Jubin Nautiyal', 'Kishore Kumar Hits'],
            'South': ['Anirudh Ravichander', 'Tamil Hits', 'Telugu Top', 'Devi Sri Prasad', 'AR Rahman', 'Sid Sriram', 'Malayalam Pop', 'Vijay Thalapathy Hits', 'S.S. Thaman', 'Mahesh Babu Hits'],
            'Punjabi': ['Punjabi Pop', 'Diljit Dosanjh', 'AP Dhillon', 'Karan Aujla', 'Sidhu Moose Wala', 'Punjabi Hip Hop', 'Guru Randhawa', 'Sharry Maan', 'Shubh', 'Tion Wayne Punjabi'],
            'Lofi': ['Bollywood Lofi', 'Hindi Lofi', 'Indian Chillwave', 'Desi Lofi', 'Arijit Lofi', 'Chill Bollywood', 'Midnight Hindi', 'Desi Chill Vibes']
        };

        const keywords = regionalKeywords[region] || regionalKeywords['North'];

        const fetchData = async (retry = false): Promise<any[]> => {
            try {
                const host = await getAudiusHost(retry);
                // Fetch for top 5 keywords in parallel to ensure a full list
                const searchPromises = keywords.slice(0, 5).map(k =>
                    fetchWithTimeout(`${host}/v1/tracks/search?query=${encodeURIComponent(k)}&limit=20&app_name=MOODWIRE`)
                        .then(res => res.ok ? res.json() : { data: [] })
                        .catch(() => ({ data: [] }))  // Individual keyword failure shouldn't block others
                );

                const searchResults = await Promise.all(searchPromises);
                const allTracks = searchResults.flatMap(res => res.data || []);

                // Deduplicate by ID and Identity Key
                const uniqueTracksMap = new Map();
                for (const t of allTracks) {
                    if (!t) continue;
                    const id = t.id;
                    const identityKey = `${(t.title || '').toLowerCase().trim()}|${(t.user?.name || t.artist || '').toLowerCase().trim()}`;
                    
                    if (!uniqueTracksMap.has(id) && !Array.from(uniqueTracksMap.values()).some(existing => {
                        const existingKey = `${(existing.title || '').toLowerCase().trim()}|${(existing.user?.name || existing.artist || '').toLowerCase().trim()}`;
                        return existingKey === identityKey;
                    })) {
                        uniqueTracksMap.set(id, t);
                    }
                }
                const uniqueTracks = Array.from(uniqueTracksMap.values());

                // Shuffle slightly
                for (let i = uniqueTracks.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [uniqueTracks[i], uniqueTracks[j]] = [uniqueTracks[j], uniqueTracks[i]];
                }

                return uniqueTracks.map((t: any) => formatTrack(t, host)).filter(Boolean);
            } catch (error: any) {
                if (!retry) {
                    console.warn(`⚠️ Audius Indian Tracks Fetch Failed (${region}). Retrying...`, error?.name);
                    rotateHost();
                    return fetchData(true);
                }
                return [];
            }
        };

        return fetchData();
    },

    searchTracks: async (query: string) => {
        if (!query?.trim()) return [];

        const cacheKey = `search_${query.trim().toLowerCase()}`;
        if (memoryCache[cacheKey] && (Date.now() - memoryCache[cacheKey].timestamp < REQUEST_CACHE_TTL)) {
            return memoryCache[cacheKey].data;
        }

        const fetchData = async (retry = false): Promise<any[]> => {
            try {
                const host = await getAudiusHost(retry);
                const response = await fetchWithTimeout(`${host}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=40&app_name=MOODWIRE`);
                if (!response.ok) throw new Error(`Audius API Error: ${response.status}`);
                const data = await response.json();
                const rawTracks = (data.data || []).map((t: any) => formatTrack(t, host)).filter(Boolean);

                // Deduplicate by ID and Identity
                const uniqueTracksMap = new Map();
                for (const t of rawTracks) {
                    const identityKey = `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`;
                    if (!uniqueTracksMap.has(t.id) && !Array.from(uniqueTracksMap.values()).some(existing => {
                        return `${existing.title.toLowerCase().trim()}|${existing.artist.toLowerCase().trim()}` === identityKey;
                    })) {
                        uniqueTracksMap.set(t.id, t);
                    }
                }
                const tracks = Array.from(uniqueTracksMap.values());

                if (tracks.length > 0) {
                    memoryCache[cacheKey] = { data: tracks, timestamp: Date.now() };
                }
                return tracks;
            } catch (error: any) {
                if (!retry) {
                    console.warn(`⚠️ Audius Search Failed ('${query}'). Retrying with new host...`, error?.name);
                    rotateHost();
                    return fetchData(true);
                }
                return [];
            }
        };

        return fetchData();
    },

    async getSmartRecommendations(params: {
        history: any[],
        favorites: any[],
        skipped?: string[],
        preferences?: any,
        currentTrack?: any,
        location?: any
    }) {
        // ... helper for backward compat (redirects to home feed's 'Section 2' logic essentially)
        // For now, let's keep getSmartRecommendations as a fallback or just use getHomeFeed.
        const feed = await this.getHomeFeed(params);
        return [...feed.section1, ...feed.section2, ...feed.section3];
    },

    getHomeFeed: async (params: {
        history: any[],
        favorites: any[],
        skipped?: string[],
        completed?: string[],
        preferences?: any,
        currentTrack?: any,
        location?: any,
        forceRefresh?: boolean
    }) => {
        const { history, favorites, skipped = [], completed = [], preferences = {}, currentTrack = null, location = null, forceRefresh = false } = params;
        const prefsHash = (preferences.favoriteArtists || []).join('-') + '_' + (preferences.vibeTypes || []).join('-');
        const CACHE_KEY = `moodwire_home_feed_v4_${prefsHash.replace(/[^a-zA-Z0-9_-]/g, '')}`; // Dynamic based on selections
        const FEED_TTL = 30 * 60 * 1000; // 30 minutes

        // Check Persistent Cache First
        if (!forceRefresh) {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < FEED_TTL) {
                        console.log('🚀 Serving Home Feed from cache (Instant Load)');
                        return data;
                    }
                } catch (e) {
                    sessionStorage.removeItem(CACHE_KEY);
                }
            }
        }

        // 1. Get Time-Based Context
        const context = ContextualEngine.getTimeBasedContext(location);

        const sections = {
            section1: [] as any[], // Recent Session
            section2: [] as any[], // Long Term Taste / Regional Mix
            section3: [] as any[], // Artist Focus
            section4: [] as any[], // Discovery
            section5: [] as any[], // Trending Regional
            section6: [] as any[], // Contextual (Time-Based)
            section7: [] as any[], // Lofi / Chill
            section8: [] as any[], // Upbeat / Party
            section1Title: 'Recently Played',
            section2Title: 'Daily Mix',
            section3Title: 'More for you',
            section5Title: 'Trending Now',
            section6Title: `Perfect for the ${context.timeOfDay}`
        };

        try {
            const promises: any[] = [];
            const userContext = { history, favorites, preferences, currentTrack, skippedIds: new Set(skipped), completedIds: new Set(completed), location };
            const isNewUser = history.length === 0 && favorites.length === 0;
            const langs = preferences.languages || ['Hindi', 'English'];
            const vibes = preferences.vibeTypes || ['Pop', 'Chill'];
            const favArtists = preferences.favoriteArtists || [];

            if (isNewUser) {
                // ===============================================
                // COLD START FEED — Curated for brand new users
                // Uses onboarding data if available, else defaults
                // ===============================================
                console.log('🆕 Cold Start Feed: Building curated first experience');

                // S1: Use onboarding favorite artists if available, else trending hits
                if (favArtists.length > 0) {
                    const seedArtist = favArtists[Math.floor(Math.random() * Math.min(favArtists.length, 3))];
                    sections.section1Title = `Best of ${seedArtist}`;
                    promises.push(audiusService.searchTracks(`${seedArtist} best hits`));
                } else {
                    sections.section1Title = 'Bollywood Top Hits';
                    promises.push(audiusService.searchTracks('Bollywood Top Hits 2025'));
                }

                // S2: Vibe-based discovery — use onboarding vibes
                const vibeQuery = vibes.slice(0, 2).join(' ') + ' music mix';
                sections.section2Title = `${vibes[0] || 'Chill'} Vibes`;
                promises.push(audiusService.searchTracks(vibeQuery));

                // S3: Second favorite artist or popular discovery
                if (favArtists.length > 1) {
                    const secondArtist = favArtists[1];
                    sections.section3Title = `Best of ${secondArtist}`;
                    promises.push(audiusService.searchTracks(secondArtist));
                } else {
                    sections.section3Title = 'Popular Right Now';
                    promises.push(audiusService.searchTracks('Popular Indian Songs'));
                }

                // S4: Regional discovery based on language preference
                if (langs.includes('Punjabi')) {
                    promises.push(audiusService.getTrendingIndianTracks('Punjabi'));
                } else if (langs.includes('Tamil') || langs.includes('Telugu') || langs.includes('Malayalam')) {
                    promises.push(audiusService.getTrendingIndianTracks('South'));
                } else {
                    promises.push(audiusService.getTrendingIndianTracks('North'));
                }

                // S5: Trending — always use global trending for fresh diversity
                sections.section5Title = 'Trending Worldwide';
                promises.push(audiusService.getTrendingTracks());

                // S6: Contextual (Time-Based) 
                const keyword = context.boostedKeywords[Math.floor(Math.random() * context.boostedKeywords.length)];
                promises.push(audiusService.searchTracks(`${keyword} vibes`));

                // S7: Lofi / Chill — universal appeal for first-timers
                promises.push(audiusService.getTrendingIndianTracks('Lofi'));

                // S8: Third favorite artist or genre-based discovery
                if (favArtists.length > 2) {
                    promises.push(audiusService.searchTracks(`${favArtists[2]} songs`));
                } else {
                    // Use a different vibe query for variety
                    const altVibes = ['Acoustic', 'Indie', 'R&B', 'Electronic'].filter(v => !vibes.includes(v));
                    const altQuery = (altVibes[0] || 'Indie') + ' music discovery';
                    promises.push(audiusService.searchTracks(altQuery));
                }

            } else {
                // ===============================================
                // RETURNING USER FEED — Personalized sections
                // ===============================================

                // 1. RECENT SESSION (Short Term)
                const recentSeeds = history.slice(0, 3);
                if (recentSeeds.length > 0) {
                    const query = `${recentSeeds[0].artist} ${recentSeeds[0].genre || ''} hits`;
                    promises.push(audiusService.searchTracks(query).then(pool =>
                        recommendationEngine.getRecommendations(pool, userContext, 15)
                    ));
                } else {
                    promises.push(audiusService.getTrendingIndianTracks('North'));
                }

                // 2. LONG TERM TASTE (Favorites Mix)
                if (favorites.length > 0) {
                    const favs = [...favorites].sort(() => 0.5 - Math.random()).slice(0, 2);
                    const query = `${favs[0].artist} ${favs[1]?.artist || ''} mix`;
                    promises.push(audiusService.searchTracks(query).then(pool =>
                        recommendationEngine.getRecommendations(pool, userContext, 15)
                    ));
                } else {
                    // Use vibe-based discovery instead of same regional call
                    const vibeQuery = vibes.slice(0, 2).join(' ') + ' new music';
                    promises.push(audiusService.searchTracks(vibeQuery));
                }

                // 3. ARTIST FOCUS
                const historyArtists = favorites.map((t: any) => t.artist);
                const allArtists = [...new Set([...favArtists, ...historyArtists])].filter(a => a && a !== 'Unknown Artist');
                if (allArtists.length > 0) {
                    const seedArtist = allArtists[Math.floor(Math.random() * allArtists.length)];
                    sections.section3Title = `Best of ${seedArtist}`;
                    promises.push(audiusService.searchTracks(seedArtist));
                } else {
                    sections.section3Title = "Bollywood Chartbusters";
                    promises.push(audiusService.searchTracks('Bollywood Top Hits'));
                }

                // 4. DISCOVERY — Regional based on language
                if (langs.includes('Punjabi') || (!langs.includes('Tamil') && !langs.includes('Telugu'))) {
                    promises.push(audiusService.getTrendingIndianTracks('Punjabi'));
                } else {
                    promises.push(audiusService.getTrendingIndianTracks('South'));
                }

                // 5. TRENDING — Use a DIFFERENT regional set than section 4 to avoid duplicates
                if (langs.includes('Tamil') || langs.includes('Telugu')) {
                    sections.section5Title = "Top South Indian Tracks";
                    promises.push(audiusService.getTrendingIndianTracks('South'));
                } else {
                    // Use North Indian (Hindi) trending — NOT Punjabi again!
                    sections.section5Title = "Top Hindi Hits";
                    promises.push(audiusService.getTrendingIndianTracks('North'));
                }

                // 6. CONTEXTUAL (Time Based)
                const keyword = context.boostedKeywords[Math.floor(Math.random() * context.boostedKeywords.length)];
                promises.push(audiusService.searchTracks(`${keyword} indian chill`));

                // 7. LOFI / CHILL 
                promises.push(audiusService.getTrendingIndianTracks('Lofi'));

                // 8. GLOBAL CHARTS / UPBEAT
                promises.push(audiusService.getTrendingTracks());
            }

            // Use allSettled so one failing section doesn't block the entire feed
            const results = await Promise.allSettled(promises);

            // Helper to clean and filter by artwork
            const clean = (arr: any[]) => (arr || []).filter(t => t && t.artwork && t.artwork.trim() !== '');
            const extract = (r: PromiseSettledResult<any[]>) => r.status === 'fulfilled' ? r.value : [];

            // Cross-section deduplication to prevent showing the same song multiple times
            const seenIdsInFeed = new Set<string>();
            const seenKeysInFeed = new Set<string>();
            const seenShortKeys = new Set<string>(); // Fuzzy matching for near-dupes

            // Normalize title for matching: strips common noise like (Official Video), [HD], ft. XYZ, etc.
            const normalizeTitle = (title: string): string => {
                return title
                    .toLowerCase()
                    .replace(/\s*[\(\[].*?[\)\]]\s*/g, '')    // Remove (Official Video), [HD], etc.
                    .replace(/\s*[-–—|].*$/g, '')              // Remove " - Artist Name" suffix
                    .replace(/\b(official|video|audio|lyric|lyrics|full|song|hd|4k|mv)\b/gi, '')
                    .replace(/[^a-z0-9\s]/g, '')               // Remove special chars
                    .replace(/\s+/g, ' ')                       // Collapse whitespace
                    .trim();
            };

            const dedupAndClean = (arr: any[], count: number = 15) => {
                // Shuffle top 40 for variety on refresh, UNLESS it's already exact count (e.g. pre-ranked ML output)
                let pool = (arr || []);
                if (pool.length > count) {
                    const topN = pool.slice(0, Math.max(count * 2, 40));
                    pool = topN.sort(() => 0.5 - Math.random());
                }

                const cleaned = clean(pool);
                const result = [];
                for (const t of cleaned) {
                    if (result.length >= count) break;
                    const exactKey = `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`;
                    const normalizedTitle = normalizeTitle(t.title);
                    const shortKey = `${normalizedTitle.slice(0, 20)}|${t.artist.toLowerCase().trim()}`;

                    if (seenIdsInFeed.has(t.id) || seenKeysInFeed.has(exactKey) || seenShortKeys.has(shortKey)) {
                        continue;
                    }
                    seenIdsInFeed.add(t.id);
                    seenKeysInFeed.add(exactKey);
                    seenShortKeys.add(shortKey);
                    result.push(t);
                }
                return result;
            };

            sections.section1 = dedupAndClean(extract(results[0]));
            sections.section2 = dedupAndClean(extract(results[1]));
            sections.section3 = dedupAndClean(extract(results[2]));
            sections.section4 = dedupAndClean(extract(results[3]));
            sections.section5 = dedupAndClean(extract(results[4]));
            sections.section6 = dedupAndClean(extract(results[5]));
            sections.section7 = dedupAndClean(extract(results[6]));
            sections.section8 = dedupAndClean(extract(results[7]));

            // Log any failed sections for debugging
            results.forEach((r, i) => {
                if (r.status === 'rejected') console.warn(`⚠️ Home Feed Section ${i + 1} failed:`, r.reason?.message || r.reason);
            });

            // Save to Cache
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                data: sections,
                timestamp: Date.now()
            }));

            return sections;

        } catch (e) {
            console.error('HomeFeed Error', e);
            return sections;
        }
    }
};
