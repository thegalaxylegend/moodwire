/**
 * 🎬 YouTube Video Enricher (NEXUS v2 — Feature 3.2)
 * 
 * Searches YouTube for educational videos matching blog topics
 * from trusted channels and returns embeddable content.
 * 
 * Uses YouTube Data API v3 (free 10K quota/day).
 * Falls back to a search link if no API key is configured.
 * 
 * Usage:
 *   import { findYouTubeVideo, buildVideoEmbed } from './utils/youtube-enricher.ts';
 *   const video = await findYouTubeVideo('Thermodynamics Class 11', 'Physics');
 *   if (video) content += buildVideoEmbed(video);
 */

import 'dotenv/config';

// Trusted educational YouTube channel IDs
const TRUSTED_CHANNELS: Record<string, string[]> = {
    'Physics': [
        'UCZDRMhVc-O03UiDEoriIS9A', // Physics Wallah
        'UCYO_jab_esuFRV4b17AJtAw', // 3Blue1Brown
        'UC7DdEm33SyaTDtWYGO2CwdA', // Physics Galaxy
    ],
    'Chemistry': [
        'UCZDRMhVc-O03UiDEoriIS9A', // Physics Wallah
        'UCEWpbFLzoYGPfuWUMFPSaoA', // The Organic Chemistry Tutor
    ],
    'Mathematics': [
        'UCYO_jab_esuFRV4b17AJtAw', // 3Blue1Brown
        'UCEWpbFLzoYGPfuWUMFPSaoA', // The Organic Chemistry Tutor
        'UCZDRMhVc-O03UiDEoriIS9A', // Physics Wallah
    ],
    'Biology': [
        'UCZDRMhVc-O03UiDEoriIS9A', // Physics Wallah
        'UCiGT12LjbsNpLeIRR-wKbPw', // Shomu's Biology
    ],
};

export interface YouTubeVideoResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    description: string;
}

/**
 * Searches YouTube for educational videos matching the given topic.
 * Prioritizes trusted educational channels.
 */
export async function findYouTubeVideo(
    topic: string, 
    subject: string
): Promise<YouTubeVideoResult | null> {
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY;
    
    if (!apiKey) {
        // No API key — return null silently (feature is opt-in)
        return null;
    }

    // Build a search query focused on educational content
    const searchQuery = `${topic} ${subject} JEE NEET revision explanation`;
    
    try {
        const params = new URLSearchParams({
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            maxResults: '5',
            videoDuration: 'medium', // 4-20 min (ideal for study)
            relevanceLanguage: 'en',
            safeSearch: 'strict',
            key: apiKey,
        });

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
        );

        if (!response.ok) {
            const err = await response.text();
            console.warn(`⚠️ YouTube API error (${response.status}): ${err.substring(0, 200)}`);
            return null;
        }

        const data: any = await response.json();
        const items = data.items || [];

        if (items.length === 0) return null;

        // Prioritize videos from trusted channels
        const trustedChannelIds = TRUSTED_CHANNELS[subject] || [];
        const trustedVideo = items.find((item: any) => 
            trustedChannelIds.includes(item.snippet.channelId)
        );

        const bestVideo = trustedVideo || items[0];
        
        return {
            videoId: bestVideo.id.videoId,
            title: bestVideo.snippet.title,
            channelTitle: bestVideo.snippet.channelTitle,
            thumbnailUrl: bestVideo.snippet.thumbnails?.medium?.url || '',
            description: (bestVideo.snippet.description || '').substring(0, 200),
        };
    } catch (err: any) {
        console.warn(`⚠️ YouTube search failed: ${err.message}`);
        return null;
    }
}

/**
 * Builds a markdown embed block for a YouTube video.
 * Includes responsive iframe and VideoObject schema comment.
 */
export function buildVideoEmbed(video: YouTubeVideoResult): string {
    return `

---

## 🎬 Watch: Visual Explanation

> 📺 **${video.title}** — by *${video.channelTitle}*

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:12px;margin:1rem 0;">
<iframe src="https://www.youtube.com/embed/${video.videoId}?rel=0" 
  style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" 
  allowfullscreen loading="lazy" 
  title="${video.title.replace(/"/g, '&quot;')}">
</iframe>
</div>

<!-- VideoObject Schema (consumed by generate-schema.ts) -->
<!-- VIDEO_SCHEMA:${JSON.stringify({ id: video.videoId, title: video.title, channel: video.channelTitle, thumb: video.thumbnailUrl })} -->

`;
}

/**
 * Builds a fallback YouTube search link (no API key needed).
 * Used when YouTube API is not configured.
 */
export function buildYouTubeSearchLink(topic: string): string {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' JEE NEET revision')}`;
    return `\n> 🎬 **[Watch video explanations on YouTube →](${searchUrl})**\n`;
}
