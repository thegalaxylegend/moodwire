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

const YOUTUBE_API_KEY = import.meta.env?.VITE_YOUTUBE_API_KEY;
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
const buildSearchQuery = (topicId: string, exam: string = '', studentClass: string = ''): string => {
    // 1. Convert slug to name
    const topicName = topicId
        .replace(/^(physics|chemistry|mathematics|maths|biology|history|geography|polity|economy|english|science|social-science)-/i, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th', '8', '9', '10'].some(c => studentClass.includes(c));
    const isDropper = studentClass.toLowerCase().includes('dropper');

    // 2. Specialized query for English Literature
    if (topicId.toLowerCase().includes('english')) {
        return `${topicName} ${studentClass} English full chapter explanation animation lecture`;
    }

    // 3. Junior Optimization (8, 9, 10)
    if (isJunior) {
        return `${topicName} ${studentClass} complete foundation lecture NCERT`;
    }

    // 4. Dropper Optimization (JEE/NEET)
    if (isDropper) {
        return `${topicName} ${exam} one shot complete revision for dropper`;
    }

    // 5. Senior Optimization (11, 12)
    return `${topicName} ${studentClass} ${exam} full chapter complete lecture in English/Hindi`;
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
export const getVideoByTopicId = async (topicId: string, exam: string = 'JEE', studentClass: string = ''): Promise<Playlist | null> => {
    // Check if the daily API quota is already known to be exhausted
    try {
        const quotaExceededUntil = localStorage.getItem('yt_quota_exceeded_until');
        if (quotaExceededUntil && Date.now() < parseInt(quotaExceededUntil)) {
            console.log(`[VideoService] 🚫 YouTube API quota is currently exhausted (block cached). Using fallback for: ${topicId}`);
            return getFallbackPlaylist(topicId);
        }
    } catch (e) {}

    if (!YOUTUBE_API_KEY) {
        console.error('YouTube API key not configured');
        return getFallbackPlaylist(topicId);
    }

    const searchQuery = buildSearchQuery(topicId, exam, studentClass);
    console.log('Searching YouTube for:', searchQuery);

    try {
        // Search for videos
        const searchResponse = await fetch(
            `${YOUTUBE_SEARCH_URL}?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=15&videoEmbeddable=true&relevanceLanguage=en&regionCode=IN&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            console.error('[VideoService] ❌ YouTube API error:', errorData);
            
            // Check for quota exceeded error
            const isQuotaError = 
                errorData?.error?.errors?.[0]?.reason === 'quotaExceeded' || 
                errorData?.error?.message?.toLowerCase().includes('quota exceeded');
                
            if (isQuotaError) {
                // Calculate next midnight Pacific Time (approx 8 AM UTC)
                const now = new Date();
                const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));
                if (now.getUTCHours() >= 8) {
                    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
                }
                try {
                    localStorage.setItem('yt_quota_exceeded_until', String(nextReset.getTime()));
                    console.warn('[VideoService] ⚠️ YouTube API Quota Exceeded! Fallback mode enabled until reset at:', nextReset.toUTCString());
                } catch (e) {}
            }

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
            // 1. Duration Preference (8-60 mins = 480-3600s, or > 60 mins for One Shots)
            if (seconds >= 480 && seconds <= 3600) {
                score += 60; // Sweet spot for chapter parts
            } else if (seconds > 3600) {
                score += 50; // One shots/Marathons are very valuable
            } else if (seconds >= 180) {
                score += 20; // 3-8 mins is a bit short but okay
            }

            // 2. Exam Relevance in Title
            const title = item.snippet.title.toLowerCase();
            const examLower = exam.toLowerCase();
            if (title.includes(examLower)) score += 30;

            // 3. Trusted Channels (Bias towards major Edu-tech if reliability is key)
            const channel = item.snippet.channelTitle.toLowerCase();
            if (channel.includes('physics wallah') || channel.includes('unacademy') || channel.includes('vedantu') ||
                channel.includes('byju') || channel.includes('adda247') || channel.includes('apni kaksha') ||
                channel.includes('compettishun') || channel.includes('mathongo') || channel.includes('khan academy') ||
                channel.includes('edumantra') || channel.includes('magnet brains') || channel.includes('pankaj sir') ||
                channel.includes('alakh pandey') || channel.includes('e-saral')) {
                score += 40; // Increased boost for trusted channels
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
                'worth it', 'truth', 'exposed', 'syllabus', 'weightage', 'cutoff',
                'selection', 'drop', 'failure', 'success story', 'guidance', 'planning',
                'daily routine', 'my journey', 'reaction', 'books to follow', 'news', 'update'
            ];
            const titleLower = title.toLowerCase();
            if (strategyKeywords.some(key => titleLower.includes(key))) {
                score -= 300; // Increased nuclear penalty
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


// Fallback mapping of popular educational topics to verified working YouTube video lists
const FALLBACK_TOPIC_VIDEO_MAP: Record<string, Video[]> = {
    "physics-kinematics": [
        {
            "id": "K_a09clEnlA",
            "title": "Kinematics - One Shot -Complete Chapter | Class 11/JEE MAINS/NEET",
            "channelName": "Physics Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/K_a09clEnlA/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=K_a09clEnlA",
            "duration": "1:30:09"
        },
        {
            "id": "fnKn6DDCLIY",
            "title": "Kinematics (1D & 2D) in One Shot | NEET 2025",
            "channelName": "Unacademy NEET Toppers",
            "thumbnailUrl": "https://img.youtube.com/vi/fnKn6DDCLIY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=fnKn6DDCLIY",
            "duration": "3:41:09"
        },
        {
            "id": "hY9zZrYuDVk",
            "title": "KINEMATICS in One Shot: All Concepts & PYQs Covered | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/hY9zZrYuDVk/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=hY9zZrYuDVk",
            "duration": "9:01:51"
        },
        {
            "id": "AskjZPBWyyU",
            "title": "Motion in A Straight Line in ONE SHOT | All Concepts & PYQs | Class 11 NEET",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/AskjZPBWyyU/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=AskjZPBWyyU",
            "duration": "5:22:26"
        }
    ],
    "modern-physics": [
        {
            "id": "_bRQvz8YHaU",
            "title": "Class 12th Complete MODERN PHYSICS in One Video 🔥",
            "channelName": "NCERT Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/_bRQvz8YHaU/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=_bRQvz8YHaU",
            "duration": "1:33:31"
        },
        {
            "id": "ebOF14qP21k",
            "title": "MODERN PHYSICS in One Shot: All Concepts & PYQs Covered | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/ebOF14qP21k/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=ebOF14qP21k",
            "duration": "5:58:06"
        },
        {
            "id": "V76QPpoWVwA",
            "title": "MODERN PHYSICS in One Shot: All Concepts & PYQs Covered | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/V76QPpoWVwA/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=V76QPpoWVwA",
            "duration": "10:41:45"
        },
        {
            "id": "NpW-f7n0YIo",
            "title": "Class 12 Physics Marathon 🔥 | Complete Class 12 Modern Physics | Boards",
            "channelName": "NCERT Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/NpW-f7n0YIo/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=NpW-f7n0YIo",
            "duration": "2:42:35"
        }
    ],
    "laws-of-motion": [
        {
            "id": "Bpku8KXkqdA",
            "title": "LAWS OF MOTION in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/Bpku8KXkqdA/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=Bpku8KXkqdA",
            "duration": "3:41:43"
        },
        {
            "id": "iwaCd0HfqBY",
            "title": "LAWS OF MOTION in ONE SHOT | All Concepts & PYQs | Class 11 NEET",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/iwaCd0HfqBY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=iwaCd0HfqBY",
            "duration": "4:34:44"
        },
        {
            "id": "Eds9lqi_BsU",
            "title": "Laws of Motion: COMPLETE Chapter in 1 Video | Full Revision | Class 11 Arjuna JEE",
            "channelName": "Arjuna JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/Eds9lqi_BsU/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=Eds9lqi_BsU",
            "duration": "1:02:31"
        },
        {
            "id": "FPo_9MMi5wY",
            "title": "NEWTON LAWS OF MOTION + FRICTION in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/FPo_9MMi5wY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=FPo_9MMi5wY",
            "duration": "2:49:13"
        }
    ],
    "work-energy-power": [
        {
            "id": "7xtHHm8IgEo",
            "title": "WORK ENERGY POWER & CENTRE OF MASS in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/7xtHHm8IgEo/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=7xtHHm8IgEo",
            "duration": "3:56:37"
        },
        {
            "id": "lDa5ZWZOuT4",
            "title": "WORK, ENERGY & POWER in ONE SHOT | All Concepts & PYQs | Class 11 NEET",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/lDa5ZWZOuT4/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=lDa5ZWZOuT4",
            "duration": "4:53:56"
        },
        {
            "id": "Ce-1sflLTj8",
            "title": "WORK, ENERGY & POWER, VERTICAL CIRCULAR DYNAMICS in ONE SHOT || All Concepts & PYQ || Ummeed NEET",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/Ce-1sflLTj8/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=Ce-1sflLTj8",
            "duration": "5:34:31"
        },
        {
            "id": "EpjLT1qC44g",
            "title": "Work, Power And Energy | Full Chapter in ONE SHOT | Class 11 Physics 🔥",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/EpjLT1qC44g/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=EpjLT1qC44g",
            "duration": "4:04:10"
        }
    ],
    "units-and-measurements": [
        {
            "id": "hbga-xhCB4E",
            "title": "UNITS & MEASUREMENT in ONE SHOT || All Concepts, Tricks & PYQ || Ummeed NEET",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/hbga-xhCB4E/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=hbga-xhCB4E",
            "duration": "5:25:46"
        },
        {
            "id": "d5GSONrjwFs",
            "title": "Class 11 Physics Chapter 1 One Shot || Unit and Measurement (मात्रक एवं मापन )",
            "channelName": "PW Bihar Board",
            "thumbnailUrl": "https://img.youtube.com/vi/d5GSONrjwFs/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=d5GSONrjwFs",
            "duration": "1:59:25"
        },
        {
            "id": "bin4OCO-LSc",
            "title": "Units & Measurements in ONE SHOT 🔥 | Class 11 Physics Chapter 1",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/bin4OCO-LSc/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=bin4OCO-LSc",
            "duration": "3:17:39"
        },
        {
            "id": "YX5sLwRtULk",
            "title": "UNIT AND DIMENSION Unit and Dimensions FULL CHAPTER | Class 11th Chapter 1 | Arjuna JEE",
            "channelName": "Arjuna JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/YX5sLwRtULk/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=YX5sLwRtULk",
            "duration": "3:51:51"
        }
    ],
    "chemical-bonding": [
        {
            "id": "F3ZSvrLBeik",
            "title": "CHEMICAL BONDING : Complete Chapter in 1 Video || Concepts+PYQs || Class 11 JEE",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/F3ZSvrLBeik/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=F3ZSvrLBeik",
            "duration": "8:32:35"
        },
        {
            "id": "kS8s_WX0IlY",
            "title": "CHEMICAL BONDING in One Shot: All Concepts & PYQs Covered | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/kS8s_WX0IlY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=kS8s_WX0IlY",
            "duration": "9:29:34"
        },
        {
            "id": "CY0T91GX5XY",
            "title": "CHEMICAL BONDING in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/CY0T91GX5XY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=CY0T91GX5XY",
            "duration": "2:34:34"
        },
        {
            "id": "WEj8nkbsCfs",
            "title": "Chemical Bonding in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/WEj8nkbsCfs/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=WEj8nkbsCfs",
            "duration": "8:12:06"
        }
    ],
    "organic-chemistry-basics": [
        {
            "id": "rF3es9wABNg",
            "title": "General Organic Chemistry (GOC) | Full Chapter in ONE SHOT | Class 11 Chemistry 🔥",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/rF3es9wABNg/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=rF3es9wABNg",
            "duration": "1:45:49"
        },
        {
            "id": "dmQLjCnlkiM",
            "title": "General Organic Chemistry (GOC) Class 11 One shot 🔥 | All Concepts + NCERT",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/dmQLjCnlkiM/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=dmQLjCnlkiM",
            "duration": "1:08:31"
        },
        {
            "id": "9J8GGNY8M5k",
            "title": "GENERAL ORGANIC CHEMISTRY in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/9J8GGNY8M5k/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=9J8GGNY8M5k",
            "duration": "3:15:54"
        },
        {
            "id": "09KkYQNOo0I",
            "title": "GOC in ONE SHOT | All Concepts & PYQs | Class 11 NEET",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/09KkYQNOo0I/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=09KkYQNOo0I",
            "duration": "5:45:41"
        }
    ],
    "structure-of-atom": [
        {
            "id": "8iSmD3OhWV0",
            "title": "STRUCTURE OF ATOM in ONE SHOT | All Concepts, Tricks & PYQs | NEET 2026",
            "channelName": "Yakeen",
            "thumbnailUrl": "https://img.youtube.com/vi/8iSmD3OhWV0/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=8iSmD3OhWV0",
            "duration": "4:18:06"
        },
        {
            "id": "yMPNzINbwXg",
            "title": "STRUCTURE OF ATOM in 1 Shot || FULL Chapter Coverage || Class 11th Chemistry",
            "channelName": "NCERT Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/yMPNzINbwXg/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=yMPNzINbwXg",
            "duration": "3:58:11"
        },
        {
            "id": "ae1qJxylnn4",
            "title": "Structure of Atom in ONE SHOT | All Concepts & PYQs Covered | Class 11 JEE",
            "channelName": "PW JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/ae1qJxylnn4/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=ae1qJxylnn4",
            "duration": "9:04:31"
        },
        {
            "id": "rf6p4q5chdE",
            "title": "Atomic Structure | Full Chapter in ONE SHOT | Class 11 Chemistry 🔥",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/rf6p4q5chdE/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=rf6p4q5chdE",
            "duration": "6:27:39"
        }
    ],
    "some-basic-concepts": [
        {
            "id": "xbYYwCWq4qA",
            "title": "Mole Concepts in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/xbYYwCWq4qA/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=xbYYwCWq4qA",
            "duration": "3:21:14"
        },
        {
            "id": "HFFxW46gs8I",
            "title": "MOLE CONCEPT & REDOX REACTION in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/HFFxW46gs8I/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=HFFxW46gs8I",
            "duration": "2:23:08"
        },
        {
            "id": "tMHrpmJH5I8",
            "title": "Mole Concept in ONE SHOT | All Concepts & PYQs Covered | Class 11 JEE",
            "channelName": "PW JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/tMHrpmJH5I8/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=tMHrpmJH5I8",
            "duration": "10:37:53"
        },
        {
            "id": "TipuzNSmutc",
            "title": "MOLE CONCEPT in 1 Shot: FULL CHAPTER COVERAGE || Prachand NEET",
            "channelName": "Yakeen",
            "thumbnailUrl": "https://img.youtube.com/vi/TipuzNSmutc/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=TipuzNSmutc",
            "duration": "7:09:16"
        }
    ],
    "mathematical-induction": [
        {
            "id": "4v-uGOhHDRY",
            "title": "Principle Of Mathematical Induction | Class 11 Maths | One Shot Video",
            "channelName": "EduMitra",
            "thumbnailUrl": "https://img.youtube.com/vi/4v-uGOhHDRY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=4v-uGOhHDRY",
            "duration": "1:21:53"
        },
        {
            "id": "3ezx5QXaeHE",
            "title": "Mathematical Reasoning Class 11 | One Shot | JEE | Arvind Kalia Sir | Vedantu",
            "channelName": "Vedantu JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/3ezx5QXaeHE/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=3ezx5QXaeHE",
            "duration": "1:11:02"
        },
        {
            "id": "JIXkwmIEfdA",
            "title": "Mathematical Induction 01 | PMI and Homework Discussion | Class 11/JEE",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/JIXkwmIEfdA/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=JIXkwmIEfdA",
            "duration": "57:49"
        },
        {
            "id": "-YxBrVbLcdY",
            "title": "Principle of Mathematical Induction 01 | PMI | Class 11 | JEE",
            "channelName": "Alakh Pandey",
            "thumbnailUrl": "https://img.youtube.com/vi/-YxBrVbLcdY/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=-YxBrVbLcdY",
            "duration": "43:08"
        }
    ],
    "quadratic-equations": [
        {
            "id": "2OWGLoHhq-w",
            "title": "Complete Quadratic Equation for JEE Main 2025 (Part 1) | One Shot",
            "channelName": "MathonGo",
            "thumbnailUrl": "https://img.youtube.com/vi/2OWGLoHhq-w/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=2OWGLoHhq-w",
            "duration": "1:15:34"
        },
        {
            "id": "xfljVBVyjfs",
            "title": "JEE Brief: QUADRATIC EQUATIONS in One Shot | JEE Main & Advanced",
            "channelName": "Vora Classes",
            "thumbnailUrl": "https://img.youtube.com/vi/xfljVBVyjfs/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=xfljVBVyjfs",
            "duration": "4:34:42"
        },
        {
            "id": "oF4E7Voy4Xk",
            "title": "MANZIL: QUADRATIC EQUATIONS in 1 Shot 🔥",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/oF4E7Voy4Xk/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=oF4E7Voy4Xk",
            "duration": "6:07:36"
        },
        {
            "id": "ikvhgYy7Iw4",
            "title": "Quadratic Equation in 1 Shot - Full Chapter Revision || for JEE Main & Advanced",
            "channelName": "Arjuna JEE",
            "thumbnailUrl": "https://img.youtube.com/vi/ikvhgYy7Iw4/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=ikvhgYy7Iw4",
            "duration": "2:03:01"
        }
    ],
    "trigonometric-functions": [
        {
            "id": "FTai93ssi1Q",
            "title": "Trigonometry | One Shot | #BounceBack Series | Unacademy Atoms",
            "channelName": "JEE Legends",
            "thumbnailUrl": "https://img.youtube.com/vi/FTai93ssi1Q/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=FTai93ssi1Q",
            "duration": "5:56:17"
        },
        {
            "id": "pzzoBw3cm1Q",
            "title": "Trigonometry Class 11 | JEE Main & Advanced",
            "channelName": "JEE Nexus by Unacademy",
            "thumbnailUrl": "https://img.youtube.com/vi/pzzoBw3cm1Q/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=pzzoBw3cm1Q",
            "duration": "5:07:32"
        },
        {
            "id": "0DgG7LxiYzk",
            "title": "TRIGONOMETRIC FUNCTIONS in One Shot: All Concepts Covered || JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/0DgG7LxiYzk/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=0DgG7LxiYzk",
            "duration": "6:29:16"
        },
        {
            "id": "nPfXdk4YpLM",
            "title": "Trigonometry Class 11 | One Shot | JEE Main & Advanced | Arvind Kalia Sir",
            "channelName": "JEE Nexus by Unacademy",
            "thumbnailUrl": "https://img.youtube.com/vi/nPfXdk4YpLM/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=nPfXdk4YpLM",
            "duration": "3:57:03"
        }
    ],
    "matrices-determinants": [
        {
            "id": "uJSzQlzG3kg",
            "title": "Complete Matrices in 90 Minutes for JEE Main 2025 | One Shot Series",
            "channelName": "MathonGo",
            "thumbnailUrl": "https://img.youtube.com/vi/uJSzQlzG3kg/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=uJSzQlzG3kg",
            "duration": "1:42:02"
        },
        {
            "id": "ZtTDs2FZ2Qw",
            "title": "Manzil 2025: MATRICES in One Shot | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/ZtTDs2FZ2Qw/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=ZtTDs2FZ2Qw",
            "duration": "7:31:59"
        },
        {
            "id": "uhq_WUNlvh8",
            "title": "Manzil 2026: DETERMINANTS in One Shot | JEE Main & Advanced",
            "channelName": "JEE Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/uhq_WUNlvh8/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=uhq_WUNlvh8",
            "duration": "5:36:46"
        },
        {
            "id": "mQSKw6rkqaM",
            "title": "Matrices and Determinants | Mission Advanced 2026 | MathonGo",
            "channelName": "MathonGo",
            "thumbnailUrl": "https://img.youtube.com/vi/mQSKw6rkqaM/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=mQSKw6rkqaM",
            "duration": "2:26:35"
        }
    ],
    "cell-cycle-and-division": [
        {
            "id": "4bTa-o535Jw",
            "title": "Cell Cycle And Cell Division | Full Chapter in ONE SHOT | Class 11 Biology 🔥",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/4bTa-o535Jw/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=4bTa-o535Jw",
            "duration": "4:47:44"
        },
        {
            "id": "ln8ZcNjF8xc",
            "title": "CELL CYCLE & CELL DIVISION - Complete Chapter in One Video || Class 11th NEET",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/ln8ZcNjF8xc/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=ln8ZcNjF8xc",
            "duration": "1:14:24"
        },
        {
            "id": "G_UJZbEp4Ek",
            "title": "CELL CYCLE & CELL DIVISION in ONE SHOT | All Concept & PYQ | NEET 2026",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/G_UJZbEp4Ek/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=G_UJZbEp4Ek",
            "duration": "2:51:37"
        },
        {
            "id": "MAu9CwD0_lQ",
            "title": "CELL CYCLE AND CELL DIVISION in 1 Shot: Theory+PYQs || Prachand NEET",
            "channelName": "Yakeen",
            "thumbnailUrl": "https://img.youtube.com/vi/MAu9CwD0_lQ/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=MAu9CwD0_lQ",
            "duration": "4:02:11"
        }
    ],
    "human-physiology": [
        {
            "id": "MJG2Mwue4l0",
            "title": "HUMAN PHYSIOLOGY 4 in ONE SHOT || All Concepts, Tricks & PYQ || NEET 2026",
            "channelName": "Yakeen",
            "thumbnailUrl": "https://img.youtube.com/vi/MJG2Mwue4l0/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=MJG2Mwue4l0",
            "duration": "3:18:40"
        },
        {
            "id": "u5wOicCsERg",
            "title": "Breathing & Exchange of Gases | Full Chapter in ONE SHOT | Class 11 Biology 🔥",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/u5wOicCsERg/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=u5wOicCsERg",
            "duration": "1:51:54"
        },
        {
            "id": "TeZb-rRvT2c",
            "title": "Human Physiology (Part: 1) - Complete Unit in One Shot || NEET 2026 || Vipin Sir",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/TeZb-rRvT2c/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=TeZb-rRvT2c",
            "duration": "3:29:46"
        },
        {
            "id": "8qMEmWjt7zg",
            "title": "Complete Biology: Human Physiology One Shot | NEET",
            "channelName": "Unacademy NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/8qMEmWjt7zg/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=8qMEmWjt7zg",
            "duration": "6:04:12"
        }
    ],
    "genetics": [
        {
            "id": "E8T_8RN1jvo",
            "title": "Evolution in 61 Minutes | Class 12th Zoology | Mind Map Series",
            "channelName": "NCERT Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/E8T_8RN1jvo/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=E8T_8RN1jvo",
            "duration": "1:01:16"
        },
        {
            "id": "8KchjdZVgqM",
            "title": "Principle of Inheritance and Variations FULL CHAPTER | Class 12th BOTANY",
            "channelName": "Lakshya NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/8KchjdZVgqM/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=8KchjdZVgqM",
            "duration": "5:35:38"
        },
        {
            "id": "0L09dhQLcts",
            "title": "Genetics (Part: 1) - Complete Unit in One Shot || NEET 2026 || Vipin Sir",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/0L09dhQLcts/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=0L09dhQLcts",
            "duration": "3:40:11"
        },
        {
            "id": "x3U83f9eFSo",
            "title": "Evolution in ONE SHOT | All Concept & PYQ | Class 12 NEET",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/x3U83f9eFSo/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=x3U83f9eFSo",
            "duration": "3:44:58"
        }
    ],
    "photosynthesis": [
        {
            "id": "8pARJFHbL0o",
            "title": "Photosynthesis in Higher Plants | Full Chapter in ONE SHOT | Class 11 Biology",
            "channelName": "PW Class 11 Science",
            "thumbnailUrl": "https://img.youtube.com/vi/8pARJFHbL0o/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=8pARJFHbL0o",
            "duration": "4:11:35"
        },
        {
            "id": "d6pfq-0CwZc",
            "title": "PHOTOSYNTHESIS IN HIGHER PLANTS - Complete Chapter in One Video || Class 11th NEET",
            "channelName": "Competition Wallah",
            "thumbnailUrl": "https://img.youtube.com/vi/d6pfq-0CwZc/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=d6pfq-0CwZc",
            "duration": "1:23:45"
        },
        {
            "id": "BM2P8Ul6DBc",
            "title": "PHOTOSYNTHESIS IN HIGHER PLANT & THE LIVING WORLD in ONE SHOT | NEET 2026",
            "channelName": "PW NEET",
            "thumbnailUrl": "https://img.youtube.com/vi/BM2P8Ul6DBc/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=BM2P8Ul6DBc",
            "duration": "2:17:31"
        },
        {
            "id": "Z-CeHYCVTO8",
            "title": "PHOTOSYNTHESIS IN HIGHER PLANTS in 1 Shot || Prachand NEET",
            "channelName": "Yakeen",
            "thumbnailUrl": "https://img.youtube.com/vi/Z-CeHYCVTO8/mqdefault.jpg",
            "videoUrl": "https://www.youtube.com/watch?v=Z-CeHYCVTO8",
            "duration": "5:01:07"
        }
    ]
};

// Fallback playlist generator with dynamic topic and subject matching
const getFallbackPlaylist = (topicId: string): Playlist => {
    const cleanId = topicId.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Convert ID to a readable title
    const topicTitle = topicId
        .replace(/^(physics|chemistry|mathematics|maths|biology|history|geography|polity|economy|english|science|social-science)-/i, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    let videos: Video[] = FALLBACK_TOPIC_VIDEO_MAP[cleanId];

    if (!videos || videos.length === 0) {
        // Fallback dynamically by subject keywords
        if (
            cleanId.includes('physic') || cleanId.includes('motion') || cleanId.includes('force') || 
            cleanId.includes('kinemat') || cleanId.includes('work') || cleanId.includes('energy') || 
            cleanId.includes('power') || cleanId.includes('gravit') || cleanId.includes('solid') || 
            cleanId.includes('fluid') || cleanId.includes('wave') || cleanId.includes('electro') || 
            cleanId.includes('current') || cleanId.includes('magnet') || cleanId.includes('optics') || 
            cleanId.includes('atom') || cleanId.includes('nuclei') || cleanId.includes('semicond')
        ) {
            videos = FALLBACK_TOPIC_VIDEO_MAP['physics-kinematics'];
        } else if (
            cleanId.includes('chem') || cleanId.includes('bond') || cleanId.includes('organic') || 
            cleanId.includes('inorganic') || cleanId.includes('physical') || cleanId.includes('solution') || 
            cleanId.includes('electro') || cleanId.includes('kinet') || cleanId.includes('coordinat') || 
            cleanId.includes('halo') || cleanId.includes('alcohol') || cleanId.includes('phenol') || 
            cleanId.includes('aldehyde') || cleanId.includes('ketone') || cleanId.includes('amine') || 
            cleanId.includes('biomolec') || cleanId.includes('equilibrium') || cleanId.includes('redox')
        ) {
            videos = FALLBACK_TOPIC_VIDEO_MAP['chemical-bonding'];
        } else if (
            cleanId.includes('math') || cleanId.includes('set') || cleanId.includes('relation') || 
            cleanId.includes('trig') || cleanId.includes('induc') || cleanId.includes('complex') || 
            cleanId.includes('inequal') || cleanId.includes('permut') || cleanId.includes('combin') || 
            cleanId.includes('binom') || cleanId.includes('sequence') || cleanId.includes('series') || 
            cleanId.includes('line') || cleanId.includes('conic') || cleanId.includes('limit') || 
            cleanId.includes('derivat') || cleanId.includes('reason') || cleanId.includes('stat') || 
            cleanId.includes('prob') || cleanId.includes('matrix') || cleanId.includes('determin') || 
            cleanId.includes('continu') || cleanId.includes('integr') || cleanId.includes('vect') || 
            cleanId.includes('geometry') || cleanId.includes('program')
        ) {
            videos = FALLBACK_TOPIC_VIDEO_MAP['quadratic-equations'];
        } else if (
            cleanId.includes('bio') || cleanId.includes('living') || cleanId.includes('classif') || 
            cleanId.includes('plant') || cleanId.includes('animal') || cleanId.includes('morphol') || 
            cleanId.includes('anatom') || cleanId.includes('cell') || cleanId.includes('division') || 
            cleanId.includes('cycle') || cleanId.includes('physio') || cleanId.includes('genetics') || 
            cleanId.includes('inherit') || cleanId.includes('evolut') || cleanId.includes('health') || 
            cleanId.includes('disease') || cleanId.includes('microbe') || cleanId.includes('biotech') || 
            cleanId.includes('organism') || cleanId.includes('population') || cleanId.includes('eco') || 
            cleanId.includes('biodiv')
        ) {
            videos = FALLBACK_TOPIC_VIDEO_MAP['cell-cycle-and-division'];
        } else {
            // Default ultimate fallback
            videos = FALLBACK_TOPIC_VIDEO_MAP['physics-kinematics'];
        }
    }

    return {
        id: `fallback-${cleanId}`,
        topicId: topicId,
        title: `${topicTitle} Lectures`,
        videos: videos
    };
};

// LocalStorage-based caching (User Device Only)
export const getVideoByTopicIdCached = async (topicId: string, exam: string = 'JEE', _userId: string = 'anon', studentClass: string = '', forceRefresh: boolean = false): Promise<Playlist | null> => {
    // V4 Cache key isolated by topic and exam (shared across users on the same device)
    const topicKey = `vid_cache_v4_${topicId.toLowerCase().trim()}_${exam.toLowerCase()}`;

    try {
        // 1. Check LocalStorage (Only if not force refreshing)
        if (!forceRefresh) {
            const cachedRaw = localStorage.getItem(topicKey);
            if (cachedRaw) {
                const cached = JSON.parse(cachedRaw);
                // 7 days cache for videos (reducing YouTube API quota consumption)
                if (Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    console.log('Found cached videos in LocalStorage for:', topicId);
                    return cached.data;
                }
            }
        }

        // 2. Fetch from API
        console.log('Fetching fresh results from API for:', topicId, exam, studentClass);
        const result = await getVideoByTopicId(topicId, exam, studentClass);

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
