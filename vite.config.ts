import 'dotenv/config'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare D1 Dev-Proxy Plugin
//
// Runs ONLY in the Vite dev server (Node.js process). It intercepts
// POST /api/questions before Vite can 404 it, and queries your D1 database
// via the Cloudflare REST API — server-to-server.
//
// ✅  Credentials stay in Node.js: NEVER bundled into the browser.
// ✅  Reads only from process.env — no hardcoded secrets anywhere.
// ✅  If env vars are missing it logs a warning and lets the request pass
//     through so the app can fall back to local-db.json / Firestore.
// ─────────────────────────────────────────────────────────────────────────────
function cloudflareD1DevProxy(): Plugin {
  // These are read at server start-time from .env (non-VITE_ prefix = never
  // bundled to the browser by Vite).
  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '');
  const CF_DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580'; // wrangler.toml value (public)
  const CF_D1_TOKEN   = process.env.CLOUDFLARE_D1_TOKEN?.replace(/['"]/g, '');

  const enabled = !!(CF_ACCOUNT_ID && CF_D1_TOKEN);

  const D1_API_BASE = enabled
    ? `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DB_ID}`
    : '';

  // Node-side fetch to Cloudflare REST API (server → Cloudflare, never browser)
  async function queryD1(sql: string, params: any[] = []): Promise<any[]> {
    const resp = await fetch(`${D1_API_BASE}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CF_D1_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`D1 REST ${resp.status}: ${text}`);
    }
    const data = await resp.json() as any;
    if (!data.success) throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
    return data.result?.[0]?.results ?? [];
  }

  function safeParse(str: string | undefined | null, fallback: any = []) {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function mapRow(row: any) {
    return {
      id: row.id,
      exam: row.exam,
      class: row.class,
      subject: row.subject,
      topic_id: row.primary_topic_id,
      topic: row.primary_topic,
      subtopic: row.primary_subtopic || row.primary_topic,
      type: row.type || 'MCQ',
      difficulty_score: row.difficulty_score,
      difficulty_band: row.difficulty_band,
      question: row.question_text,
      question_text: row.question_text,
      options: safeParse(row.options, []),
      correct_answer: row.correct_answer,
      explanation: row.explanation || '',
      solution_steps: safeParse(row.solution_steps, []),
      concept_tags: safeParse(row.concept_tags, []),
      error_trap_type: row.error_trap_type || 'general.miscellaneous',
      key_formula: row.key_formula || '',
      source_exam: row.source_exam || '',
      year: row.year || null,
      confidence: row.confidence ?? 0.8,
      verified: !!row.verified,
      quality_tier: row.quality_tier || 'standard',
      created_at: row.created_at,
      usage_count: 0,
      also_for: safeParse(row.also_for, []),
    };
  }

  function normalizeExam(exam: string) {
    const e = exam.toLowerCase();
    if (e.includes('neet'))                                     return 'NEET';
    if (e.includes('advanced'))                                 return 'JEEAdvanced';
    if (e.includes('board') || e.includes('foundation'))       return 'Board';
    return 'JEEMains';
  }

  return {
    name: 'cloudflare-d1-dev-proxy',
    apply: 'serve', // only active during `vite dev`, never in `vite build`

    configureServer(server) {
      if (!enabled) {
        console.warn(
          '\n[D1 DevProxy] ⚠️  CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_D1_TOKEN not set in .env\n' +
          '              /api/questions will fall back to local-db.json / Firestore.\n'
        );
      } else {
        console.log('[D1 DevProxy] ✅ Cloudflare D1 proxy active for /api/questions');
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // CORS pre-flight
        if (req.method === 'OPTIONS' && (url.startsWith('/api/questions') || url.startsWith('/api/videos'))) {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        if (url.startsWith('/api/questions')) {
          if (req.method !== 'POST') return next();
          if (!enabled) return next();

          const CORS_JSON = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          };

          try {
            // Read request body (Node stream)
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const body = JSON.parse(Buffer.concat(chunks).toString());

            const { needs, exam, abilityScore = 1000 } = body as {
              needs: Array<{ topic: string; count: number; topic_id?: string }>;
              exam: string;
              abilityScore?: number;
            };

            if (!Array.isArray(needs) || !exam) {
              res.writeHead(400, CORS_JSON);
              res.end(JSON.stringify({ error: 'needs[] and exam are required' }));
              return;
            }

            const normExam = normalizeExam(exam);
            const allQuestions: any[] = [];
            const selectedIds = new Set<string>();

            for (const group of needs) {
              const { topic, count, topic_id } = group;
              if (!topic || !count) continue;

              const tid = topic_id ?? topic.toLowerCase().replace(/[^a-z0-9_]/g, '_');
              const likeExam = `%"${normExam}"%`;

              // 70/20/10 ELO split
              const bands = [
                { rating: abilityScore - 150, n: Math.max(0, Math.floor(count * 0.7)) },
                { rating: abilityScore,       n: Math.max(0, Math.floor(count * 0.2)) },
                { rating: abilityScore + 250, n: Math.max(0, count - Math.floor(count * 0.7) - Math.floor(count * 0.2)) },
              ];

              for (const band of bands) {
                if (band.n <= 0) continue;
                let needed = band.n;

                // Expanding ELO window
                for (let w = 200; needed > 0 && w <= 1500; w += 200) {
                  const excl = selectedIds.size > 0
                    ? `AND id NOT IN (${[...selectedIds].map(() => '?').join(',')})` : '';
                  const sql = `
                    SELECT * FROM questions
                    WHERE (exam = ? OR also_for LIKE ?)
                      AND (primary_topic_id = ? OR primary_topic = ?)
                      AND difficulty_score BETWEEN ? AND ?
                      ${excl}
                    ORDER BY RANDOM() LIMIT ?`;
                  const params = [
                    normExam, likeExam, tid, topic,
                    band.rating - w, band.rating + w,
                    ...selectedIds, needed,
                  ];
                  try {
                    const rows = await queryD1(sql, params);
                    for (const r of rows) {
                      allQuestions.push(mapRow(r));
                      selectedIds.add(r.id);
                      needed--;
                    }
                  } catch { /* expand window */ }
                }

                // No-difficulty fallback for this band
                if (needed > 0) {
                  const excl = selectedIds.size > 0
                    ? `AND id NOT IN (${[...selectedIds].map(() => '?').join(',')})` : '';
                  const sql = `
                    SELECT * FROM questions
                    WHERE (exam = ? OR also_for LIKE ?)
                      AND (primary_topic_id = ? OR primary_topic = ?)
                      ${excl}
                    ORDER BY RANDOM() LIMIT ?`;
                  const params = [normExam, likeExam, tid, topic, ...selectedIds, needed];
                  try {
                    const rows = await queryD1(sql, params);
                    for (const r of rows) { allQuestions.push(mapRow(r)); selectedIds.add(r.id); }
                  } catch { /* ignore */ }
                }
              }

              // Last resort: any question from this exam
              if (!allQuestions.some(q => q.topic === topic)) {
                try {
                  const rows = await queryD1(
                    'SELECT * FROM questions WHERE exam = ? ORDER BY RANDOM() LIMIT ?',
                    [normExam, count]
                  );
                  for (const r of rows) {
                    if (!selectedIds.has(r.id)) { allQuestions.push(mapRow(r)); selectedIds.add(r.id); }
                  }
                } catch { /* ignore */ }
              }
            }

            res.writeHead(200, CORS_JSON);
            res.end(JSON.stringify(allQuestions));

          } catch (err: any) {
            console.error('[D1 DevProxy] Handler error:', err?.message);
            // Fall through to the app's own fallback (local-db.json / Firestore)
            res.writeHead(503, CORS_JSON);
            res.end(JSON.stringify({ error: 'D1 proxy error — falling back' }));
          }
          return;
        }

        if (url.startsWith('/api/videos')) {
          const CORS_JSON = {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          };

          if (!enabled) {
            res.writeHead(200, CORS_JSON);
            res.end(JSON.stringify([]));
            return;
          }

          const parsedUrl = new URL(url, 'http://localhost');

          if (req.method === 'GET') {
            try {
              const chapterId = parsedUrl.searchParams.get('chapter_id');
              if (!chapterId) {
                res.writeHead(400, CORS_JSON);
                res.end(JSON.stringify({ error: 'chapter_id is required' }));
                return;
              }

              const sql = `
                SELECT * FROM discovered_videos 
                WHERE chapter_id = ? AND is_available = 1
                ORDER BY score DESC
              `;
              const rows = await queryD1(sql, [chapterId]);
              const videos = rows.map((row: any) => ({
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

              res.writeHead(200, CORS_JSON);
              res.end(JSON.stringify(videos));
              return;
            } catch (err: any) {
              console.error('[D1 DevProxy] GET videos error:', err?.message);
              res.writeHead(500, CORS_JSON);
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          if (req.method === 'POST') {
            const isDiscover = parsedUrl.pathname.endsWith('/discover');
            if (!isDiscover) {
              res.writeHead(405, CORS_JSON);
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) chunks.push(chunk as Buffer);
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const { chapter_id, subtopic, exam, subject, class: studentClass } = body;

              if (!chapter_id || !subtopic || !exam || !subject) {
                res.writeHead(400, CORS_JSON);
                res.end(JSON.stringify({ error: 'chapter_id, subtopic, exam, and subject are required' }));
                return;
              }

              const cleanChapterName = chapter_id
                .replace(/^[a-z]+_\d+_/i, '')
                .replace(/_/g, ' ');
              const searchQuery = `${cleanChapterName} ${subtopic} ${exam} complete lecture in English/Hindi`;

              console.log(`[D1 DevProxy] Searching YouTube for: "${searchQuery}"`);

              const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=8&videoEmbeddable=true&relevanceLanguage=en&regionCode=IN&key=${process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY}`;
              const searchResponse = await fetch(searchUrl);

              if (!searchResponse.ok) {
                const errData = await searchResponse.json() as any;
                console.error('[D1 DevProxy] YouTube API Error:', errData);
                res.writeHead(searchResponse.status, CORS_JSON);
                res.end(JSON.stringify({ error: 'YouTube Search API failed', details: errData }));
                return;
              }

              const searchData = await searchResponse.json() as any;
              if (!searchData.items || searchData.items.length === 0) {
                res.writeHead(200, CORS_JSON);
                res.end(JSON.stringify([]));
                return;
              }

              const videoIds = searchData.items.map((item: any) => item.id.videoId);
              const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,status&id=${videoIds.join(',')}&key=${process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY}`;
              const detailsResponse = await fetch(detailsUrl);

              if (!detailsResponse.ok) {
                res.writeHead(500, CORS_JSON);
                res.end(JSON.stringify({ error: 'Failed to fetch details' }));
                return;
              }

              const detailsData = await detailsResponse.json() as any;
              const videoDetailsMap = new Map();

              for (const item of detailsData.items || []) {
                const isEmbeddable = item.status?.embeddable !== false;
                const isPublic = item.status?.privacyStatus === 'public';
                const hasRestriction = item.contentDetails?.regionRestriction?.blocked?.includes('IN');

                // Convert ISO duration
                const match = item.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                let durationStr = '0:00';
                if (match) {
                  const hours = match[1] ? parseInt(match[1]) : 0;
                  const minutes = match[2] ? parseInt(match[2]) : 0;
                  const seconds = match[3] ? parseInt(match[3]) : 0;
                  durationStr = hours > 0
                    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }

                // Format view count
                const viewNum = parseInt(item.statistics?.viewCount || '0');
                let viewStr = '0 views';
                if (viewNum >= 1000000) viewStr = `${(viewNum / 1000000).toFixed(1)}M views`;
                else if (viewNum >= 1000) viewStr = `${(viewNum / 1000).toFixed(0)}K views`;
                else viewStr = `${viewNum} views`;

                videoDetailsMap.set(item.id, {
                  duration: durationStr,
                  viewCount: viewStr,
                  isAvailable: isEmbeddable && isPublic && !hasRestriction
                });
              }

              const discoveredVideos = [];
              for (const item of searchData.items) {
                const videoId = item.id.videoId;
                const snippet = item.snippet;
                const details = videoDetailsMap.get(videoId);

                if (!details || !details.isAvailable) continue;

                // Duration filter
                const parts = details.duration.split(':').map(Number);
                let durationSec = 0;
                if (parts.length === 3) durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) durationSec = parts[0] * 60 + parts[1];
                else durationSec = parts[0] || 0;

                if (durationSec < 180) continue;

                let score = 50;
                if (durationSec >= 480 && durationSec <= 3600) score += 20;
                else if (durationSec > 3600) score += 15;

                const channel = snippet.channelTitle.toLowerCase();
                if (
                  channel.includes('physics wallah') || channel.includes('jee wallah') ||
                  channel.includes('competition wallah') || channel.includes('neet wallah') ||
                  channel.includes('vedantu') || channel.includes('unacademy') ||
                  channel.includes('mohit tyagi') || channel.includes('mathongo')
                ) {
                  score += 20;
                }

                const title = snippet.title.toLowerCase();
                if (title.includes(exam.toLowerCase())) score += 10;
                if (title.includes(subtopic.toLowerCase())) score += 10;

                // Save to D1
                const insertSql = `
                  INSERT INTO discovered_videos (
                    id, title, channel_name, thumbnail_url, duration, view_count,
                    chapter_id, subtopic, subject, class, exam, score
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    score = EXCLUDED.score,
                    fetched_at = (unixepoch())
                `;

                await queryD1(insertSql, [
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
                ]);

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

              res.writeHead(200, CORS_JSON);
              res.end(JSON.stringify(discoveredVideos));
              return;

            } catch (err: any) {
              console.error('[D1 DevProxy] POST discover error:', err?.message);
              res.writeHead(500, CORS_JSON);
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }
        }

        return next();
      });
    },
  };
}

export default defineConfig(() => {
  const isSSR = process.argv.includes('--ssr') || process.argv.includes('ssr');
  console.log(`🛠️  Vite Build - Mode: ${isSSR ? 'SSR' : 'CSR'}`);

  return {
    define: {
      // Firebase config is public-facing (required in browser). These are already
      // committed to .env.example and are safe to include in the browser bundle.
      'process.env.VITE_FIREBASE_API_KEY':              JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN':          JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID':           JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET':       JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID':  JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID':               JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
      'process.env.VITE_FIREBASE_MEASUREMENT_ID':       JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID),
    },

    plugins: [
      cloudflareD1DevProxy(), // server-side only; never runs in browser
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo.png', 'robots.txt', 'sitemap.xml'],
        manifest: {
          name: 'Exam Compass',
          short_name: 'ExamCompass',
          description: 'AI-Powered Exam Preparation Platform',
          theme_color: '#8b5cf6',
          background_color: '#0a0a0f',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'logo.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/admin\/.*/, /firestore\.googleapis\.com/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin.includes('firestore.googleapis.com') ||
                url.origin.includes('google-analytics.com') ||
                url.origin.includes('datadoghq.com'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
        devOptions: { enabled: false, type: 'module' },
      }),
    ],

    resolve: {
      alias: {},
      dedupe: ['three'],
    },

    build: {
      modulePreload: {
        resolveDependencies: (_filename: string, deps: string[]) =>
          deps.filter(dep =>
            !dep.includes('vendor-3d') &&
            !dep.includes('vendor-markdown') &&
            !dep.includes('mermaid') &&
            !dep.includes('html2pdf') &&
            !dep.includes('html2canvas') &&
            !dep.includes('jspdf') &&
            !dep.includes('cytoscape') &&
            !dep.includes('katex')
          ),
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: isSSR,
          manualChunks: isSSR ? undefined : {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-lucide':   ['lucide-react'],
            'vendor-motion':   ['framer-motion'],
            'vendor-markdown': ['react-markdown', 'remark-gfm'],
            'vendor-3d':       ['three', '@react-three/fiber', '@react-three/drei'],
          },
        },
      },
    },

    ssr: {
      noExternal: ['react-helmet-async', 'framer-motion', 'lucide-react', 'react-router-dom', 'react-router', 'vite-plugin-pwa'],
    },
  };
})
