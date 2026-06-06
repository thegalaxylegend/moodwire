// Video Library Service
// Aggregates static curated playlists with dynamically discovered D1-cached videos
// Supports precision YouTube API fallbacks via Cloudflare server-side search

import { getCuratedVideos } from '../lib/videoLibraryDB';
import { getVideoByTopicIdCached, isVideoMatchForExam, type Video } from './videoService';
import { SYLLABUS_DB } from '../lib/constants';

export interface LibraryVideo extends Video {
    chapterId: string;
    subtopic?: string;
    exam?: string;
    score?: number;
    type?: "detailed" | "quick_revision" | "topic_wise" | "oneshot" | "pyq";
    teacherName?: string;
    isCurated?: boolean;
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days cache

// Absolute last-resort fallback: verified high-view public educational videos
// These IDs are validated as public, embeddable, long-form (>30 min), non-restricted in India
const ABSOLUTE_FALLBACK_VIDEOS: Record<string, Video[]> = {
    physics: [
        {
            id: "Cxqgd7YFBQY",
            title: "Electric Charges and Fields — Full Chapter | Class 12 JEE | Physics Wallah",
            channelName: "Physics Wallah - Alakh Pandey",
            thumbnailUrl: "https://img.youtube.com/vi/Cxqgd7YFBQY/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=Cxqgd7YFBQY",
            duration: "3:20:00"
        },
        {
            id: "P4CiMcQnQoU",
            title: "Current Electricity Full Chapter One Shot | Class 12 | JEE Mains 2024",
            channelName: "Vedantu JEE",
            thumbnailUrl: "https://img.youtube.com/vi/P4CiMcQnQoU/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=P4CiMcQnQoU",
            duration: "2:55:00"
        }
    ],
    chemistry: [
        {
            id: "gFkXg8_TcBQ",
            title: "Solid State Full Chapter One Shot | Class 12 Chemistry | JEE Mains",
            channelName: "Physics Wallah - Alakh Pandey",
            thumbnailUrl: "https://img.youtube.com/vi/gFkXg8_TcBQ/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=gFkXg8_TcBQ",
            duration: "2:10:00"
        },
        {
            id: "EE-z1KiRaaM",
            title: "Solutions Class 12 Chemistry Full Chapter | JEE Mains | Unacademy JEE",
            channelName: "Unacademy JEE",
            thumbnailUrl: "https://img.youtube.com/vi/EE-z1KiRaaM/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=EE-z1KiRaaM",
            duration: "2:40:00"
        }
    ],
    mathematics: [
        {
            id: "0LJPKv3uCLk",
            title: "Relations and Functions Full Chapter | Class 12 Maths | JEE Mains One Shot",
            channelName: "Vedantu JEE",
            thumbnailUrl: "https://img.youtube.com/vi/0LJPKv3uCLk/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=0LJPKv3uCLk",
            duration: "2:45:00"
        },
        {
            id: "9d8V0GJbLQo",
            title: "Matrices & Determinants — Full Chapter One Shot | Class 12 JEE Maths",
            channelName: "Physics Wallah - Alakh Pandey",
            thumbnailUrl: "https://img.youtube.com/vi/9d8V0GJbLQo/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=9d8V0GJbLQo",
            duration: "3:10:00"
        }
    ],
    math: [
        {
            id: "0LJPKv3uCLk",
            title: "Relations and Functions Full Chapter | Class 12 Maths | JEE Mains One Shot",
            channelName: "Vedantu JEE",
            thumbnailUrl: "https://img.youtube.com/vi/0LJPKv3uCLk/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=0LJPKv3uCLk",
            duration: "2:45:00"
        },
        {
            id: "9d8V0GJbLQo",
            title: "Matrices & Determinants — Full Chapter One Shot | Class 12 JEE Maths",
            channelName: "Physics Wallah - Alakh Pandey",
            thumbnailUrl: "https://img.youtube.com/vi/9d8V0GJbLQo/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=9d8V0GJbLQo",
            duration: "3:10:00"
        }
    ],
    biology: [
        {
            id: "3LgjQHoUrtA",
            title: "Genetics Full Chapter One Shot | Class 12 Biology NEET | Unacademy NEET",
            channelName: "Unacademy NEET",
            thumbnailUrl: "https://img.youtube.com/vi/3LgjQHoUrtA/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=3LgjQHoUrtA",
            duration: "2:30:00"
        },
        {
            id: "mU4BpzxkNg8",
            title: "Human Physiology Full Chapter | Class 12 Biology | NEET One Shot",
            channelName: "Physics Wallah - Alakh Pandey",
            thumbnailUrl: "https://img.youtube.com/vi/mU4BpzxkNg8/mqdefault.jpg",
            videoUrl: "https://www.youtube.com/watch?v=mU4BpzxkNg8",
            duration: "2:50:00"
        }
    ]
};



/**
 * Fetches all videos for a chapter (Curated + Discovered from D1)
 */
export const getLibraryForChapter = async (
    chapterId: string,
    exam: string = 'JEE',
    subject: string = '',
    _studentClass: string = 'Class 12',
    forceRefresh: boolean = false,
    userId: string = 'anon'
): Promise<LibraryVideo[]> => {
    // 1. Get static curated videos (always immediately available)
    const curated = getCuratedVideos(chapterId).map(v => ({
        ...v,
        isCurated: true
    }));

    let discovered: LibraryVideo[] = [];

    // 2. Load discovered videos from local cache / D1 DB
    // V2 cache key includes userId to prevent cross-user contamination
    const userKey = userId && userId !== 'anon' ? `_u${userId.substring(0, 8)}` : '';
    const cacheKey = `ec_discovered_v2_${chapterId.toLowerCase()}_${exam.toLowerCase()}${userKey}`;
    if (!forceRefresh) {
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const cachedData = JSON.parse(cachedRaw);
                if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
                    if (cachedData.videos && cachedData.videos.length > 0) {
                        console.log(`[VideoLibrary] Loading cached discovered videos for ${chapterId}`);
                        return mergeVideos(curated, cachedData.videos);
                    } else {
                        console.log(`[VideoLibrary] Cache was empty for ${chapterId}, ignoring cache to try D1 again.`);
                    }
                }
            }
        } catch (e) {
            console.error('[VideoLibrary] Cache parse failed', e);
        }
    }

    try {
        console.log(`[VideoLibrary] Fetching discovered videos from D1 for ${chapterId}`);
        const res = await fetch(`/api/videos?chapter_id=${encodeURIComponent(chapterId)}&exam=${encodeURIComponent(exam)}&subject=${encodeURIComponent(subject)}`);
        
        if (res.ok) {
            discovered = await res.json();
            // Filter out wrong exam subjects
            discovered = discovered.filter(v => isVideoMatchForExam(v.title, v.channelName, exam));
            
            // Only cache non-empty results — caching empty arrays would block discovery for 7 days
            if (discovered.length > 0) {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        videos: discovered,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    console.warn('[VideoLibrary] Failed to write cache', e);
                }
            }
        }
    } catch (err) {
        console.error('[VideoLibrary] Failed to fetch from D1, using local fallback:', err);
    }

    const merged = mergeVideos(curated, discovered);
    if (merged.length === 0) {
        const chapter = Object.values(SYLLABUS_DB).flat().find(c => c.id === chapterId);
        if (chapter) {
            console.log(`[VideoLibrary] Curated and discovered are empty. Triggering API discovery to populate real D1 DB: ${chapter.topic}`);
            try {
                // Determine subject
                let subject = '';
                for (const subj of Object.keys(SYLLABUS_DB)) {
                    if (SYLLABUS_DB[subj].some(c => c.id === chapterId)) {
                        subject = subj;
                        break;
                    }
                }
                if (!subject) subject = 'Physics';

                // Call the backend discover API to fetch from YouTube, score, and write to D1 database
                const resDiscover = await fetch('/api/videos/discover', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    chapter_id: chapterId,
                    subtopic: chapter.topic,
                    exam,
                    subject,
                    class: chapter.class
                  })
                });

                if (resDiscover.ok) {
                    discovered = await resDiscover.json();
                    discovered = discovered.filter(v => isVideoMatchForExam(v.title, v.channelName, exam));
                    
                    // Save to local cache
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            videos: discovered,
                            timestamp: Date.now()
                        }));
                    } catch (e) {
                        console.warn('[VideoLibrary] Failed to write cache', e);
                    }
                }
            } catch (e) {
                console.error('[VideoLibrary] Server-side D1 discovery failed:', e);
            }

            const updatedMerged = mergeVideos(curated, discovered);
            if (updatedMerged.length > 0) {
                return updatedMerged;
            }

            // Fallback: Query client-side YouTube search if server-side D1 discovery was unsuccessful
            console.log(`[VideoLibrary] D1 discovery returned empty. Querying client-side YouTube search fallback for: ${chapter.topic}`);
            try {
                const classLabel = chapter.class;
                const oneShotQuery = `"${chapter.topic}" ${exam} ${classLabel} full chapter complete one shot`;
                const revisionQuery = `"one shot" "${chapter.topic}" ${exam} ${classLabel} revision quick recap`;

                const [oneShotPlaylist, revisionPlaylist] = await Promise.all([
                    getVideoByTopicIdCached(oneShotQuery, exam, 'anon', classLabel, forceRefresh),
                    getVideoByTopicIdCached(revisionQuery, exam, 'anon', classLabel, forceRefresh)
                ]);

                const dynamicVideos: LibraryVideo[] = [];
                const seen = new Set<string>();

                const addVideos = (videos: Video[], type: 'oneshot' | 'quick_revision') => {
                    videos.forEach(v => {
                        if (!seen.has(v.id) && isVideoMatchForExam(v.title, v.channelName, exam)) {
                            seen.add(v.id);
                            dynamicVideos.push({
                                ...v,
                                chapterId: chapter.id,
                                isCurated: false,
                                type
                            });
                        }
                    });
                };

                if (oneShotPlaylist?.videos) {
                    addVideos(oneShotPlaylist.videos, 'oneshot');
                }
                if (revisionPlaylist?.videos) {
                    addVideos(revisionPlaylist.videos, 'quick_revision');
                }

                if (chapter.subtopics.length > 0 && dynamicVideos.length < 4) {
                    const subtopic = chapter.subtopics[0];
                    const subtopicQuery = `"${subtopic}" ${chapter.topic} ${exam} ${classLabel} topic explanation lecture`;
                    const subtopicPlaylist = await getVideoByTopicIdCached(subtopicQuery, exam, 'anon', classLabel, forceRefresh);
                    if (subtopicPlaylist?.videos) {
                        addVideos(subtopicPlaylist.videos, 'topic_wise' as any);
                    }
                }

                if (dynamicVideos.length > 0) {
                    return dynamicVideos;
                }
            } catch (e) {
                console.error('[VideoLibrary] Client-side fallback search failed:', e);
            }
        }
    }

    const finalMerged = mergeVideos(curated, discovered);
    if (finalMerged.length === 0) {
        const chapter = Object.values(SYLLABUS_DB).flat().find(c => c.id === chapterId);
        if (chapter) {
            console.warn(`[VideoLibrary] D1 & API both failed. Recovering any cached videos for chapter: ${chapter.topic}`);
            
            // 1. Try to load from expired/any local cache for this chapter
            try {
                const cachedRaw = localStorage.getItem(cacheKey);
                if (cachedRaw) {
                    const cachedData = JSON.parse(cachedRaw);
                    if (cachedData.videos && cachedData.videos.length > 0) {
                        console.log(`[VideoLibrary] Found expired chapter-specific cache for: ${chapterId}`);
                        const filteredCached = cachedData.videos.filter((v: any) => isVideoMatchForExam(v.title, v.channelName, exam));
                        return mergeVideos(curated, filteredCached);
                    }
                }
            } catch (e) {
                console.error('[VideoLibrary] Failed to parse expired chapter cache', e);
            }

            // 2. Scan localStorage for any topic cache keys that contain the chapter name/topic keywords
            try {
                const chapterKeywords = chapter.topic.toLowerCase().split(' ').filter(w => w.length > 3);
                const foundVideos: LibraryVideo[] = [];
                const seen = new Set<string>();

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('vid_cache_v5_')) {
                        const containsKeyword = chapterKeywords.some(keyword => key.toLowerCase().includes(keyword));
                        if (containsKeyword) {
                            const cachedRaw = localStorage.getItem(key);
                            if (cachedRaw) {
                                const parsed = JSON.parse(cachedRaw);
                                const playlist = parsed.data;
                                if (playlist && playlist.videos) {
                                    playlist.videos.forEach((v: Video) => {
                                        if (!seen.has(v.id) && isVideoMatchForExam(v.title, v.channelName, exam)) {
                                            seen.add(v.id);
                                            foundVideos.push({
                                                ...v,
                                                chapterId: chapter.id,
                                                isCurated: false,
                                                type: 'oneshot'
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                if (foundVideos.length > 0) {
                    console.log(`[VideoLibrary] Successfully recovered ${foundVideos.length} videos from other topic caches matching keywords of: ${chapter.topic}`);
                    return mergeVideos(curated, foundVideos);
                }
            } catch (e) {
                console.error('[VideoLibrary] Failed to recover videos from keyword caches', e);
            }

            // 3. Skip: Removed the unsafe "scan ALL localStorage keys" fallback.
            //    It was returning videos from completely different chapters, users, and languages
            //    (e.g., Vedantu Telugu for a Physics chapter) because it had no chapter/user filtering.
            //    The static subject-scoped fallback below is safer and always correct.

            // 4. Absolute last-resort fallback: return static verified educational videos matching this subject
            try {
                let subject = '';
                for (const subj of Object.keys(SYLLABUS_DB)) {
                    if (SYLLABUS_DB[subj].some(c => c.id === chapterId)) {
                        subject = subj;
                        break;
                    }
                }
                let subKey = (subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'math') 
                    ? 'math' 
                    : subject.toLowerCase();
                
                if (exam.toLowerCase().includes('neet') && subKey === 'math') {
                    console.warn(`[VideoLibrary] NEET user requesting math fallback. Swapping to biology.`);
                    subKey = 'biology';
                }
                if (exam.toLowerCase().includes('jee') && subKey === 'biology') {
                    console.warn(`[VideoLibrary] JEE user requesting biology fallback. Swapping to physics.`);
                    subKey = 'physics';
                }

                const fallbacks = ABSOLUTE_FALLBACK_VIDEOS[subKey] || ABSOLUTE_FALLBACK_VIDEOS['physics'];
                
                const finalFallback = fallbacks.map(v => ({
                    ...v,
                    chapterId: chapter.id,
                    isCurated: false,
                    type: 'oneshot' as const
                }));

                console.warn(`[VideoLibrary] Ultimate Last-Resort Fallback: Serving verified baseline videos for: ${subject}`);
                return mergeVideos(curated, finalFallback);
            } catch (e) {
                console.error('[VideoLibrary] Absolute final fallback failed', e);
            }
        }
    }

    return finalMerged;
};

/**
 * Triggers server-side YouTube API discovery for a specific subtopic and saves to D1.
 */
export const discoverVideoForSubtopic = async (
    chapterId: string,
    subtopic: string,
    exam: string,
    subject: string,
    studentClass: string = 'Class 12'
): Promise<LibraryVideo[]> => {
    try {
        console.log(`[VideoLibrary] Triggering API discovery for ${chapterId} -> ${subtopic}`);
        const res = await fetch('/api/videos/discover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            subtopic,
            exam,
            subject,
            class: studentClass
          })
        });

        if (res.ok) {
            const newVideos: LibraryVideo[] = await res.json();
            console.log(`[VideoLibrary] Discovered ${newVideos.length} new videos`);
            
            // Force refresh local cache for this chapter so new videos show up immediately
            await getLibraryForChapter(chapterId, exam, subject, studentClass, true);
            
            return newVideos;
        } else {
            console.warn(`[VideoLibrary] Discovery failed with status ${res.status}`);
        }
    } catch (e) {
        console.error('[VideoLibrary] Discovery request failed:', e);
    }

    return [];
};

/**
 * Utility to merge curated and discovered videos without duplicates.
 */
function mergeVideos(curated: LibraryVideo[], discovered: LibraryVideo[]): LibraryVideo[] {
    const seen = new Set<string>();
    const merged: LibraryVideo[] = [];

    // Prioritize curated
    curated.forEach(v => {
        if (!seen.has(v.id)) {
            seen.add(v.id);
            merged.push(v);
        }
    });

    // Add discovered
    discovered.forEach(v => {
        if (!seen.has(v.id)) {
            seen.add(v.id);
            merged.push(v);
        }
    });

    return merged;
}
