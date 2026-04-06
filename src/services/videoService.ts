// YouTube API Video Service
// Dynamically fetches videos based on topic and filters unavailable ones

export interface Video {
    id: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    viewCount?: string;
    user_class?: string; // Optional tagging for bookmarks
}

export interface Playlist {
    id: string;
    topicId: string;
    title: string;
    videos: Video[];
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Debug: Check if API key is loaded
if (!YOUTUBE_API_KEY) {
    console.error('[VideoService] ❌ YouTube API Key is missing! Videos will not load.');
} else {
    console.log('[VideoService] ✅ YouTube API Key loaded:', YOUTUBE_API_KEY.substring(0, 10) + '...');
}

// Convert ISO 8601 duration to readable format
const formatDuration = (isoDuration: string): string => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format view count
const formatViewCount = (count: string): string => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K views`;
    return `${num} views`;
};

// Build search query based on topic
const buildSearchQuery = (topicId: string, exam: string = ''): string => {
    // 1. Convert slug to name
    const topicName = topicId
        .replace(/^(physics|chemistry|mathematics|maths|biology|history|geography|polity|economy|english|science|social-science)-/i, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // 2. Specialized query for English Literature
    if (topicId.toLowerCase().includes('english')) {
        return `${topicName} English full chapter explanation animation`;
    }

    // 3. General query - Focus on actual lectures/one-shots
    return `${topicName} full chapter ${exam} complete lecture`;
};

// Fetch video details (duration, view count) to filter out unavailable ones
const fetchVideoDetails = async (videoIds: string[]): Promise<Map<string, { duration: string; viewCount: string; isAvailable: boolean }>> => {
    const details = new Map();

    if (!YOUTUBE_API_KEY || videoIds.length === 0) return details;

    try {
        const response = await fetch(
            `${YOUTUBE_VIDEOS_URL}?part=contentDetails,statistics,status&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) {
            console.error('Failed to fetch video details');
            return details;
        }

        const data = await response.json();

        for (const item of data.items || []) {
            // Check if video is embeddable and public
            const isEmbeddable = item.status?.embeddable !== false;
            const isPublic = item.status?.privacyStatus === 'public';
            const hasRestriction = item.contentDetails?.regionRestriction?.blocked?.includes('IN');

            details.set(item.id, {
                duration: formatDuration(item.contentDetails?.duration || 'PT0S'),
                viewCount: formatViewCount(item.statistics?.viewCount || '0'),
                isAvailable: isEmbeddable && isPublic && !hasRestriction
            });
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
    }

    return details;
};

// Main function to search YouTube videos by topic
export const getVideoByTopicId = async (topicId: string, exam: string = 'JEE'): Promise<Playlist | null> => {
    if (!YOUTUBE_API_KEY) {
        console.error('YouTube API key not configured');
        return getFallbackPlaylist(topicId);
    }

    const searchQuery = buildSearchQuery(topicId, exam);
    console.log('Searching YouTube for:', searchQuery);

    try {
        // Search for videos
        const searchResponse = await fetch(
            `${YOUTUBE_SEARCH_URL}?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=15&videoEmbeddable=true&relevanceLanguage=en&regionCode=IN&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            console.error('[VideoService] ❌ YouTube API error:', errorData);
            console.error('[VideoService] Check your API key and ensure YouTube Data API v3 is enabled');
            return getFallbackPlaylist(topicId);
        }

        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            console.log('No videos found for topic:', topicId);
            return getFallbackPlaylist(topicId);
        }

        // Get video IDs for detail lookup
        const videoIds = searchData.items.map((item: any) => item.id.videoId);

        // Fetch details to filter unavailable videos
        const videoDetails = await fetchVideoDetails(videoIds);

        interface ScoredVideo {
            video: Video;
            score: number;
        }

        const scoredVideos: ScoredVideo[] = [];

        for (const item of searchData.items) {
            const videoId = item.id.videoId;
            const details = videoDetails.get(videoId);

            // Skip if video is not available or details missing
            if (!details || !details.isAvailable) continue;

            // Strict Filter: Shorts (< 3 mins = 180s)
            // Parse duration back from "H:MM:SS" or "MM:SS"
            const timeParts = details.duration.split(':').map(Number);
            let seconds = 0;
            if (timeParts.length === 3) {
                seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            } else if (timeParts.length === 2) {
                seconds = timeParts[0] * 60 + timeParts[1];
            } else {
                seconds = timeParts[0] || 0; // Fallback
            }

            // STRICT FILTER: < 3 mins (180s)
            if (seconds < 180) continue;

            let score = 0;

            // RANKING LOGIC
            // 1. Duration Preference (8-45 mins = 480-2700s)
            if (seconds >= 480 && seconds <= 2700) {
                score += 50; // High preference
            } else if (seconds > 2700) {
                score += 20; // Long videos (One shots) are okay but slightly less preferred than focused topics
            } else {
                score += 10; // 3-8 mins is okay but looks like quick summary
            }

            // 2. Exam Relevance in Title
            const title = item.snippet.title.toLowerCase();
            const examLower = exam.toLowerCase();
            if (title.includes(examLower)) score += 30;

            // 3. Trusted Channels (Bias towards major Edu-tech if reliability is key)
            const channel = item.snippet.channelTitle.toLowerCase();
            if (channel.includes('physics wallah') || channel.includes('unacademy') || channel.includes('vedantu') ||
                channel.includes('byju') || channel.includes('adda247') || channel.includes('apni kaksha') ||
                channel.includes('compettishun') || channel.includes('mathongo')) {
                score += 10;
            }

            // 4. View Count Boost
            // Basic heuristic: >100k views gets a bump
            if (details.viewCount.includes('K') || details.viewCount.includes('M')) {
                const viewStr = details.viewCount.replace(' views', '');
                let views = 0;
                if (viewStr.includes('M')) views = parseFloat(viewStr) * 1000000;
                else if (viewStr.includes('K')) views = parseFloat(viewStr) * 1000;
                else views = parseInt(viewStr);

                if (views > 100000) score += 5;
            }

            // 5. [NEW] Strategy/Meta Filter (HEAVY PENALTY)
            const strategyKeywords = [
                'strategy', 'roadmap', 'best books', 'how to start', 'timetable',
                'motivation', 'vlog', 'preparation guide', 'mistakes', 'enough',
                'skip', 'important chapters', 'high priority', 'best teachers',
                'percentile', 'score', 'marks', 'tips', 'tricks', 'how to score',
                'worth it', 'truth', 'exposed'
            ];
            const titleLower = title.toLowerCase();
            if (strategyKeywords.some(key => titleLower.includes(key))) {
                score -= 200; // Nuclear penalty
            }

            // 6. [NEW] Question/Comparison Filter (Discussion penalty)
            if (title.includes('?') || titleLower.includes('vs') || titleLower.includes(' vs ')) {
                score -= 100;
            }

            // 7. [NEW] Content Type Weighting (BONUS)
            if (titleLower.includes('one shot') || titleLower.includes('full chapter') ||
                titleLower.includes('complete') || titleLower.includes('marathon') ||
                titleLower.includes('lecture') || titleLower.includes('ncert')) {
                score += 50;
            }

            scoredVideos.push({
                video: {
                    id: videoId,
                    title: item.snippet.title,
                    channelName: item.snippet.channelTitle,
                    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    duration: details.duration,
                    viewCount: details.viewCount
                },
                score: score
            });
        }

        // Sort by score descending
        scoredVideos.sort((a, b) => b.score - a.score);

        // Limit to top 4 strict
        const finalVideos = scoredVideos.slice(0, 4).map(sv => sv.video);

        // If filtering removed everything, fallback
        if (finalVideos.length === 0) {
            console.log('All videos filtered out by strict rules, using fallback');
            return getFallbackPlaylist(topicId);
        }

        return {
            id: `playlist-${topicId}`,
            topicId: topicId,
            title: buildSearchQuery(topicId, exam).split(' ').slice(0, 3).join(' '),
            videos: finalVideos
        };

    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return getFallbackPlaylist(topicId);
    }
};


// Fallback playlist with verified working videos
const getFallbackPlaylist = (topicId: string): Playlist => {
    return {
        id: 'fallback-playlist',
        topicId: topicId,
        title: 'Recommended Lectures',
        videos: [
            {
                id: 'ZM8ECpBuQYE',
                title: 'Motion in a Straight Line | Complete Chapter',
                channelName: 'Physics Wallah Foundation',
                thumbnailUrl: 'https://img.youtube.com/vi/ZM8ECpBuQYE/mqdefault.jpg',
                videoUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
                duration: '2:30:00'
            },
            {
                id: 'bY7zpwSxQaE',
                title: 'Physics Complete Course | Class 11 & 12',
                channelName: 'Unacademy JEE',
                thumbnailUrl: 'https://img.youtube.com/vi/bY7zpwSxQaE/mqdefault.jpg',
                videoUrl: 'https://www.youtube.com/watch?v=bY7zpwSxQaE',
                duration: '3:00:00'
            },
            {
                id: 'pnWvVu4bIxQ',
                title: 'JEE Main Physics - Important Concepts',
                channelName: 'Vedantu JEE',
                thumbnailUrl: 'https://img.youtube.com/vi/pnWvVu4bIxQ/mqdefault.jpg',
                videoUrl: 'https://www.youtube.com/watch?v=pnWvVu4bIxQ',
                duration: '1:45:00'
            }
        ]
    };
};

// LocalStorage-based caching (User Device Only)
export const getVideoByTopicIdCached = async (topicId: string, exam: string = 'JEE', userId: string = 'anon'): Promise<Playlist | null> => {
    // V3 Cache key isolated by userId
    const topicKey = `vid_cache_v3_${userId}_${topicId.toLowerCase().trim()}_${exam.toLowerCase()}`;

    try {
        // 1. Check LocalStorage
        const cachedRaw = localStorage.getItem(topicKey);
        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            // Optional: Check expiry (e.g. 24 hours)
            if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
                console.log('Found cached videos in LocalStorage for:', topicId);
                return cached.data;
            }
        }

        // 2. Fetch from API
        console.log('Fetching fresh results from API for:', topicId, exam);
        const result = await getVideoByTopicId(topicId, exam);

        if (result && result.videos.length > 0) {
            // 3. Save to LocalStorage
            localStorage.setItem(topicKey, JSON.stringify({
                data: result,
                timestamp: Date.now()
            }));
        }

        return result;

    } catch (e) {
        console.error("Cache error:", e);
        return getVideoByTopicId(topicId, exam);
    }
};

/**
 * Advanced Recommendation Engine:
 * 1. Finds user's weak topics
 * 2. Fetches best videos for those topics
 * 3. Filters out already watched videos
 */
export const getStrategicVideoRecommendations = async (
    userId: string, 
    exam: string, 
    userClass?: string
): Promise<Video[]> => {
    try {
        const { getWeakTopics } = await import('./topicStrengthService');
        const { getCompletedVideos } = await import('./videoProgressService');
        
        // 1. Get top 3 weak topics
        const weakTopics = await getWeakTopics(userId, 3, userClass, exam);
        const completedVideos = getCompletedVideos(userId, userClass, exam).map(v => v.id);

        const recommendedVideos: Video[] = [];

        // 2. Map topics to video fetch promises
        const fetchPromises = weakTopics.map(topic => getVideoByTopicIdCached(topic.topic, exam, userId));
        const playlists = await Promise.all(fetchPromises);

        playlists.forEach(playlist => {
            if (playlist && playlist.videos) {
                // 3. Filter out watched videos
                const freshVideos = playlist.videos.filter(v => !completedVideos.includes(v.id));
                recommendedVideos.push(...freshVideos);
            }
        });

        // 4. If we have too few videos from weak topics, add some general ones (JEE/NEET trending)
        if (recommendedVideos.length < 4) {
            const generalTopics = ['physics', 'chemistry', 'math'];
            const generalPlaylists = await Promise.all(
                generalTopics.map(t => getVideoByTopicIdCached(t, exam, userId))
            );
            generalPlaylists.forEach(p => {
                if (p && p.videos) {
                    const fresh = p.videos.filter(v => !completedVideos.includes(v.id));
                    recommendedVideos.push(...fresh);
                }
            });
        }

        // Shuffle and take top 8
        return recommendedVideos
            .sort(() => Math.random() - 0.5)
            .slice(0, 8);

    } catch (e) {
        console.error('[VideoService] Strategic recommendations failed:', e);
        return [];
    }
};

export const getRecommendedChannels = (exam: string) => {
    if (exam.toLowerCase().includes('jee')) {
        return ['Physics Wallah', 'Unacademy JEE', 'Mohit Tyagi', 'MathonGo', 'Vedantu JEE'];
    }
    if (exam.toLowerCase().includes('neet')) {
        return ['Physics Wallah', 'Unacademy NEET', 'Biomentors', 'Competition Wallah'];
    }
    return ['Physics Wallah', 'Unacademy', 'Aman Dhattarwal'];
};
