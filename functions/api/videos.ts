// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS VIDEOS D1 ROUTER — Cloudflare Pages Function
// Handles curated library fetches, YouTube search fallback, and D1 caching
// ═══════════════════════════════════════════════════════════════════

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<D1RunResult>;
}

interface D1Result<T = any> {
  results: T[];
  success: boolean;
  error?: string;
}

interface D1RunResult {
  success: boolean;
  error?: string;
}

interface Env {
  DB?: D1Database;
  YOUTUBE_API_KEY?: string;
}

interface DiscoveredVideoRow {
  id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  duration: string;
  view_count: string;
  chapter_id: string;
  subtopic: string;
  subject: string;
  class: string;
  exam: string;
  score: number;
  fetched_at: number;
  is_available: number;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Convert ISO 8601 duration to readable format
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format view count
function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (isNaN(num)) return '0 views';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K views`;
  return `${num} views`;
}

// Parse duration to seconds
function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const url = new URL(request.url);
    const chapterId = url.searchParams.get('chapter_id');
    const exam = url.searchParams.get('exam') || 'JEE';

    if (!chapterId) {
      return err('chapter_id parameter is required', 400);
    }

    if (!env.DB) {
      // If DB is missing, return empty discovered results (frontend will fall back to static)
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Query D1 for discovered videos of this chapter
    const sql = `
      SELECT * FROM discovered_videos 
      WHERE chapter_id = ? AND is_available = 1
      ORDER BY score DESC
    `;
    const res = await env.DB.prepare(sql).bind(chapterId).all<DiscoveredVideoRow>();

    const videos = (res.results || []).map(row => ({
      id: row.id,
      title: row.title,
      channelName: row.channel_name,
      thumbnailUrl: row.thumbnail_url,
      videoUrl: `https://www.youtube.com/watch?v=${row.id}`,
      duration: row.duration,
      viewCount: row.view_count,
      chapterId: row.chapter_id,
      subtopic: row.subtopic,
      exam: row.exam,
      score: row.score,
    }));

    return new Response(JSON.stringify(videos), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[videos GET API] Error:', e);
    return err(e?.message || 'Internal server error', 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const url = new URL(request.url);
    const isDiscover = url.pathname.endsWith('/discover');

    if (!isDiscover) {
      return err('Method Not Allowed', 405);
    }

    if (!env.DB) {
      return err('D1 Database binding missing', 503);
    }

    const apiKey = env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return err('Server YouTube API Key not configured', 500);
    }

    const body = await request.json() as any;
    const { chapter_id, subtopic, exam, subject, class: studentClass } = body;

    if (!chapter_id || !subtopic || !exam || !subject) {
      return err('chapter_id, subtopic, exam, and subject are required in request body', 400);
    }

    // 1. Build a highly specific search query
    // Example: "Electric Charges and Fields Gauss Law JEE One Shot"
    const cleanChapterName = chapter_id
      .replace(/^(phy|che|math|bio)_12_/i, '')
      .replace(/_/g, ' ');
    
    // Clean teacher references / keywords for high precision
    const searchQuery = `${cleanChapterName} ${subtopic} ${exam} complete lecture in English/Hindi`;
    
    console.log(`[D1 Video Discover] Searching YouTube for: "${searchQuery}"`);

    // 2. Fetch search results from YouTube API
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=8&videoEmbeddable=true&relevanceLanguage=en&regionCode=IN&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json() as any;
      console.error('[D1 Video Discover] YouTube Search API Error:', errorData);
      
      const isQuotaError = 
        errorData?.error?.errors?.[0]?.reason === 'quotaExceeded' || 
        errorData?.error?.message?.toLowerCase().includes('quota exceeded');
        
      if (isQuotaError) {
        return err('YouTube API Quota Exceeded. Fallback to offline library.', 429);
      }
      return err('Failed to fetch search results from YouTube API', 502);
    }

    const searchData = await searchResponse.json() as any;
    if (!searchData.items || searchData.items.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId);

    // 3. Fetch video details (duration, viewCount, status) to filter out unavailable/shorts
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,status&id=${videoIds.join(',')}&key=${apiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    
    if (!detailsResponse.ok) {
      return err('Failed to fetch video details from YouTube API', 502);
    }

    const detailsData = await detailsResponse.json() as any;
    const videoDetailsMap = new Map<string, { duration: string; viewCount: string; isAvailable: boolean }>();

    for (const item of detailsData.items || []) {
      const isEmbeddable = item.status?.embeddable !== false;
      const isPublic = item.status?.privacyStatus === 'public';
      const hasRestriction = item.contentDetails?.regionRestriction?.blocked?.includes('IN');

      videoDetailsMap.set(item.id, {
        duration: formatDuration(item.contentDetails?.duration || 'PT0S'),
        viewCount: formatViewCount(item.statistics?.viewCount || '0'),
        isAvailable: isEmbeddable && isPublic && !hasRestriction
      });
    }

    const discoveredVideos: any[] = [];

    // 4. Score and filter videos
    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const snippet = item.snippet;
      const details = videoDetailsMap.get(videoId);

      if (!details || !details.isAvailable) continue;

      const durationSec = parseDurationToSeconds(details.duration);
      if (durationSec < 180) continue; // Skip shorts (< 3 mins)

      // Base scoring algorithm
      let score = 50; // Starting baseline

      // Duration preference:
      if (durationSec >= 480 && durationSec <= 3600) {
        score += 20; // Sweet spot for specific subtopics (8-60 mins)
      } else if (durationSec > 3600) {
        score += 15; // Longer lectures are good
      }

      // Channel relevance
      const channel = snippet.channelTitle.toLowerCase();
      if (
        channel.includes('physics wallah') || channel.includes('jee wallah') || 
        channel.includes('competition wallah') || channel.includes('neet wallah') ||
        channel.includes('vedantu') || channel.includes('unacademy') || 
        channel.includes('mohit tyagi') || channel.includes('mathongo')
      ) {
        score += 20;
      }

      // Title matching
      const title = snippet.title.toLowerCase();
      if (title.includes(exam.toLowerCase())) score += 10;
      if (title.includes(subtopic.toLowerCase())) score += 10;

      // Save to D1
      const insertSql = `
        INSERT INTO discovered_videos (
          id, title, channel_name, thumbnailUrl, duration, view_count, 
          chapter_id, subtopic, subject, class, exam, score, fetched_at, is_available
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'), 1)
        ON CONFLICT(id) DO UPDATE SET
          score = ?,
          fetched_at = strftime('%s','now')
      `;
      
      const params = [
        videoId,
        snippet.title,
        snippet.channelTitle,
        details.viewCount, // Wait, thumbnail_url is next
      ];
      
      // Let's bind properly matching columns:
      // columns: id, title, channel_name, thumbnail_url, duration, view_count, chapter_id, subtopic, subject, class, exam, score, fetched_at, is_available
      await env.DB.prepare(`
        INSERT INTO discovered_videos (
          id, title, channel_name, thumbnail_url, duration, view_count, 
          chapter_id, subtopic, subject, class, exam, score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          score = EXCLUDED.score,
          fetched_at = (unixepoch())
      `).bind(
        videoId,
        snippet.title,
        snippet.channelTitle,
        snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        details.duration,
        details.viewCount,
        chapter_id,
        subtopic,
        subject,
        studentClass || 'Class 12',
        exam,
        score
      ).run();

      discoveredVideos.push({
        id: videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        duration: details.duration,
        viewCount: details.viewCount,
        chapterId: chapter_id,
        subtopic: subtopic,
        exam: exam,
        score: score
      });
    }

    return new Response(JSON.stringify(discoveredVideos), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[videos POST API] Error:', e);
    return err(e?.message || 'Internal server error', 500);
  }
}
