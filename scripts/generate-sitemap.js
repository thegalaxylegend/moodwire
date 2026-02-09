
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt');
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'seo-manifest.json');

const BASE_URL = 'https://examcompass.web.app';

async function generateSitemap() {
    console.log('🚀 Starting Automated Sitemap Generation from Manifest...');

    try {
        if (!fs.existsSync(MANIFEST_PATH)) {
            console.error('❌ SEO Manifest not found. Run generate-seo-manifest.js first.');
            return;
        }

        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const dynamicUrls = Object.keys(manifest);

        let urls = [];

        // 1. Static Core Routes
        urls.push({ loc: '/', priority: 1.0, changefreq: 'daily' });
        urls.push({ loc: '/login', priority: 0.8, changefreq: 'monthly' });
        urls.push({ loc: '/signup', priority: 0.8, changefreq: 'monthly' });

        // 2. Add all routes from manifest
        dynamicUrls.forEach(url => {
            const meta = manifest[url];
            urls.push({
                loc: url,
                priority: meta.type === 'hub' ? 0.9 : 0.7,
                changefreq: 'weekly'
            });
        });

        // Generate XML
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        fs.writeFileSync(SITEMAP_PATH, sitemapContent);
        console.log(`✅ Sitemap generated at ${SITEMAP_PATH} with ${urls.length} URLs`);

        // Generate Robots.txt
        const robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;
        fs.writeFileSync(ROBOTS_PATH, robotsContent);
        console.log(`✅ Robots.txt generated at ${ROBOTS_PATH}`);

    } catch (e) {
        console.error("❌ Error generating sitemap:", e.message);
    }
}

generateSitemap();
