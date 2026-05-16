import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'seo-manifest.json');

const BASE_URL = 'https://examcompass.pages.dev';

// Google limits: 50,000 URLs per sitemap, 50MB per file
const MAX_URLS_PER_SITEMAP = 45000;

async function generateSitemap() {
    console.log('🚀 Generating Sitemaps from Manifest...');

    try {
        if (!fs.existsSync(MANIFEST_PATH)) {
            console.error('❌ Manifest not found.');
            process.exit(1);
        }

        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const urls = Object.keys(manifest);

        if (urls.length === 0) {
            throw new Error("Manifest is empty.");
        }

        const escapeXml = (unsafe) => {
            return unsafe.replace(/[<>&'"]/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
            });
        };

        // Ensure directories exist
        const dirs = [PUBLIC_DIR, DIST_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // ============================================================
        // STRATEGY: Generate a SINGLE flat sitemap.xml
        // This avoids the child sitemap 404 problem on Cloudflare Pages.
        // Only include pages that are "index, follow" (no noindex pages).
        // ============================================================
        
        const indexableUrls = urls.filter(url => {
            const meta = manifest[url];
            if (!meta) return false;
            // Skip noindex pages — Google shouldn't see them in sitemaps
            if (meta.robots && meta.robots.includes('noindex')) return false;
            // Skip dashboard/login routes
            if (url.startsWith('/dashboard') || url === '/login') return false;
            return true;
        });

        console.log(`📊 Total manifest URLs: ${urls.length}`);
        console.log(`📊 Indexable URLs for sitemap: ${indexableUrls.length}`);

        // Sort by priority (highest first) for crawl budget optimization
        indexableUrls.sort((a, b) => {
            const pa = manifest[a].priority || 0.5;
            const pb = manifest[b].priority || 0.5;
            return pb - pa;
        });

        const today = new Date().toISOString().split('T')[0];

        // Generate sitemap entries
        const sitemapEntries = indexableUrls.slice(0, MAX_URLS_PER_SITEMAP).map(url => {
            const meta = manifest[url];
            let priority = meta.priority || 0.5;
            let changefreq = 'monthly';

            if (url === '/') { priority = 1.0; changefreq = 'daily'; }
            else if (meta.type === 'exam') { priority = 1.0; changefreq = 'daily'; }
            else if (meta.type === 'hub') { priority = 0.8; changefreq = 'weekly'; }
            else if (meta.type === 'blog-index') { priority = 0.9; changefreq = 'daily'; }
            else if (meta.type === 'blog-post') { priority = 0.8; changefreq = 'weekly'; }
            else if (meta.type === 'topic') { priority = 0.7; changefreq = 'weekly'; }
            else if (meta.type === 'collection') { priority = 0.8; changefreq = 'weekly'; }
            else if (url.includes('/q/')) { priority = 0.5; changefreq = 'monthly'; }

            const escapedLoc = escapeXml(`${BASE_URL}${url}`);

            // Use manifest dates if available
            const rawLastmod = meta.lastmod || meta.updatedAt || meta.publishedTime || meta.date;
            let lastmod = today; // Default to today
            if (rawLastmod) {
                try {
                    const d = new Date(rawLastmod);
                    if (!isNaN(d.getTime())) {
                        lastmod = d.toISOString().split('T')[0];
                    }
                } catch(e) {}
            }

            return `  <url>
    <loc>${escapedLoc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
        });

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join('\n')}\n</urlset>`;

        // Write the SINGLE sitemap to both public/ and dist/
        dirs.forEach(dir => {
            fs.writeFileSync(path.join(dir, 'sitemap.xml'), sitemapContent);
        });

        console.log(`✅ Single sitemap.xml generated with ${sitemapEntries.length} URLs.`);

        // ============================================================
        // ROBOTS.TXT
        // ============================================================
        const robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /login
Disallow: /admin/
Disallow: /onboarding

# Specific rules for AI Crawlers
User-agent: GPTBot
Allow: /
Disallow: /dashboard/

User-agent: Claude-Web
Allow: /
Disallow: /dashboard/

User-agent: ChatGPT-User
Allow: /
Disallow: /dashboard/

User-agent: OAI-SearchBot
Allow: /
Disallow: /dashboard/

User-agent: Google-Extended
Allow: /
Disallow: /dashboard/

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`;

        dirs.forEach(dir => {
            fs.writeFileSync(path.join(dir, 'robots.txt'), robotsContent);
        });
        console.log(`✅ robots.txt written.`);

        // ============================================================
        // GENERATE _redirects 
        // ============================================================
        const redirectsContent = `# ============================================================
# ExamCompass _redirects for Cloudflare Pages (AUTO-GENERATED)
# Rules are processed top-to-bottom; first match wins.
# ============================================================

# === SPA routes that need client-side routing ===
/dashboard/*  /index.html  200
/admin/*      /index.html  200
/login        /index.html  200
/onboarding   /index.html  200

# === Proxy OG Image generator to Firebase Function ===
/api/og/*  https://us-central1-legendstech001.cloudfunctions.net/ogImage/:splat  200
/api/og    https://us-central1-legendstech001.cloudfunctions.net/ogImage  200
`;

        dirs.forEach(dir => {
            fs.writeFileSync(path.join(dir, '_redirects'), redirectsContent);
        });
        console.log(`✅ _redirects written.`);

        // ============================================================
        // CLOUDFLARE 404 SPA FALLBACK (Hard 404 for SEO)
        // ============================================================
        const sourceIndex = path.join(DIST_DIR, 'index.html');
        const target404 = path.join(DIST_DIR, '404.html');
        if (fs.existsSync(sourceIndex)) {
            fs.copyFileSync(sourceIndex, target404);
            console.log(`✅ 404.html generated from index.html to prevent Soft 404s.`);
        }

        // Print summary by type
        const typeCounts = {};
        indexableUrls.forEach(url => {
            const type = manifest[url].type || 'unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        console.log(`\n📋 Sitemap breakdown:`);
        Object.entries(typeCounts).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} URLs`);
        });

    } catch (e) {
        console.error("❌ Sitemap Generation Failed:", e.message);
        process.exit(1);
    }
}

generateSitemap();
