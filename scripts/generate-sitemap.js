import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const SITEMAP_INDEX_NAME = 'sitemap.xml';
const ROBOTS_NAME = 'robots.txt';
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'seo-manifest.json');

const BASE_URL = 'https://examcompass.pages.dev';

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

        // Group URLs by explicit sitemapGroup from manifest
        const categories = {};
        let questionCount = 0;
        let questionBatch = 1;

        urls.forEach(url => {
            const meta = manifest[url];
            if (!meta || meta.sitemapGroup === null) return;

            const group = meta.sitemapGroup || 'core'; // Fallback

            if (group === 'questions') {
                const sitemapName = `sitemap-questions-batch${questionBatch}`;
                if (!categories[sitemapName]) categories[sitemapName] = [];
                categories[sitemapName].push(url);
                questionCount++;
                if (questionCount >= 5000) {
                    questionBatch++;
                    questionCount = 0;
                }
            } else {
                if (!categories[group]) categories[group] = [];
                categories[group].push(url);
            }
        });

        // Ensure directories exist
        const dirs = [PUBLIC_DIR, DIST_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const categorySitemaps = [];

        // Generate individual sitemaps
        for (const [category, catUrls] of Object.entries(categories)) {
            const sitemapName = category.startsWith('sitemap-') ? `${category}.xml` : `sitemap-${category}.xml`;
            categorySitemaps.push(sitemapName);

            const sitemapEntries = catUrls.map(url => {
                const meta = manifest[url];
                let priority = meta.priority || 0.5;
                let changefreq = 'monthly';

                if (url === '/') { priority = 1.0; changefreq = 'daily'; }
                else if (meta.type === 'exam') { priority = 1.0; changefreq = 'daily'; }
                else if (meta.type === 'hub') { priority = 0.8; changefreq = 'weekly'; }
                else if (meta.type === 'blog-index') { priority = 0.9; changefreq = 'daily'; }
                else if (meta.type === 'blog-post') { priority = 0.8; changefreq = 'weekly'; }
                else if (meta.type === 'topic') { priority = 0.7; changefreq = 'weekly'; }
                else if (url.includes('/q/')) { priority = 0.5; changefreq = 'monthly'; }

                const escapedLoc = escapeXml(`${BASE_URL}${url}`);

                // Use manifest dates if available; for blog posts use their date, otherwise omit lastmod for static pages
                const rawLastmod = meta.lastmod || meta.updatedAt || meta.publishedTime || meta.date;
                let lastmod = '';
                if (rawLastmod) {
                    try {
                        const d = new Date(rawLastmod);
                        if (!isNaN(d.getTime())) {
                            lastmod = d.toISOString().split('T')[0];
                        }
                    } catch(e) {}
                }

                // Build the URL entry - only include lastmod if we have a real date
                const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
                return `  <url>
    <loc>${escapedLoc}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
            });

            const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join('')}\n</urlset>`;
            dirs.forEach(dir => {
                fs.writeFileSync(path.join(dir, sitemapName), content);
            });
        }

        // Generate Sitemap Index - Include all generated sitemaps for 100% indexing coverage
        const indexEntries = categorySitemaps.map(name => {
            return `  <sitemap>
    <loc>${BASE_URL}/${name}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
        });

        const indexContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('\n')}\n</sitemapindex>`;

        // Generate Robots.txt
        const robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /login

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
Sitemap: ${BASE_URL}/${SITEMAP_INDEX_NAME}
`;

        // Write Index and Robots
        dirs.forEach(dir => {
            fs.writeFileSync(path.join(dir, SITEMAP_INDEX_NAME), indexContent);
            fs.writeFileSync(path.join(dir, ROBOTS_NAME), robotsContent);
        });

        console.log(`✅ Sitemap Index and ${categorySitemaps.length} category sitemaps written to public/ and dist/.`);

    } catch (e) {
        console.error("❌ Sitemap Generation Failed:", e.message);
        process.exit(1);
    }
}

generateSitemap();
