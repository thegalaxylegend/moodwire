import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const SITEMAP_NAME = 'sitemap.xml';
const ROBOTS_NAME = 'robots.txt';
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'seo-manifest.json');

const BASE_URL = 'https://examcompass.web.app';

async function generateSitemap() {
    console.log('🚀 Generating Sitemap from Manifest...');

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

        const sitemapEntries = urls.map(url => {
            const meta = manifest[url];
            let priority = meta.priority || 0.5;
            let changefreq = 'monthly';

            // Explicit logic check
            if (url === '/') { priority = 1.0; changefreq = 'daily'; }
            else if (meta.type === 'exam') { priority = 1.0; changefreq = 'daily'; }
            else if (meta.type === 'hub') { priority = 0.8; changefreq = 'weekly'; }
            else if (meta.type === 'topic') { priority = 0.7; changefreq = 'weekly'; }
            else if (url.includes('/q/')) { priority = 0.5; changefreq = 'monthly'; }

            return `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
        });

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('')}
</urlset>`;

        const robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Sitemap: ${BASE_URL}/${SITEMAP_NAME}
`;

        // Write to BOTH public (for source) and dist (for deployment)
        const dirs = [PUBLIC_DIR, DIST_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, SITEMAP_NAME), sitemapContent);
            fs.writeFileSync(path.join(dir, ROBOTS_NAME), robotsContent);
        });

        console.log(`✅ Sitemap with ${sitemapEntries.length} URLs written to public/ and dist/.`);

    } catch (e) {
        console.error("❌ Sitemap Generation Failed:", e.message);
        process.exit(1);
    }
}

generateSitemap();
