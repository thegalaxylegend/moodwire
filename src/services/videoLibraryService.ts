// Video Library Service
// Aggregates static curated playlists with dynamically discovered D1-cached videos
// Supports precision YouTube API fallbacks via Cloudflare server-side search

import { getCuratedVideos } from '../lib/videoLibraryDB';
import type { Video } from './videoService';

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

/**
 * Fetches all videos for a chapter (Curated + Discovered from D1)
 */
export const getLibraryForChapter = async (
    chapterId: string,
    exam: string = 'JEE',
    _subject: string = '',
    _studentClass: string = 'Class 12',
    forceRefresh: boolean = false
): Promise<LibraryVideo[]> => {
    // 1. Get static curated videos (always immediately available)
    const curated = getCuratedVideos(chapterId).map(v => ({
        ...v,
        isCurated: true
    }));

    // 2. Load discovered videos from local cache / D1 DB
    const cacheKey = `ec_discovered_v1_${chapterId.toLowerCase()}_${exam.toLowerCase()}`;
    if (!forceRefresh) {
        try {
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                const cachedData = JSON.parse(cachedRaw);
                if (Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
                    console.log(`[VideoLibrary] Loading cached discovered videos for ${chapterId}`);
                    return mergeVideos(curated, cachedData.videos);
                }
            }
        } catch (e) {
            console.error('[VideoLibrary] Cache parse failed', e);
        }
    }

    try {
        console.log(`[VideoLibrary] Fetching discovered videos from D1 for ${chapterId}`);
        const res = await fetch(`/api/videos?chapter_id=${encodeURIComponent(chapterId)}&exam=${encodeURIComponent(exam)}`);
        
        if (res.ok) {
            const discovered: LibraryVideo[] = await res.json();
            
            // Save to local cache
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    videos: discovered,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('[VideoLibrary] Failed to write cache', e);
            }

            return mergeVideos(curated, discovered);
        }
    } catch (err) {
        console.error('[VideoLibrary] Failed to fetch from D1, using local fallback:', err);
    }

    return curated;
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
