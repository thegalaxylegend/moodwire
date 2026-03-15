import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const RSS_NAME = 'rss.xml';
const MANIFEST_PATH = path.join(PUBLIC_DIR, 'seo-manifest.json');

const BASE_URL = 'https://examcompass.web.app';

async function generateRSS() {
    console.log('🚀 Generating RSS Feed...');

    try {
        if (!fs.existsSync(MANIFEST_PATH)) {
            console.error('❌ Manifest not found.');
            process.exit(1);
        }

        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const urls = Object.keys(manifest);

        const escapeXml = (unsafe) => {
            if (!unsafe) return '';
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

        const blogPosts = urls
            .filter(url => manifest[url].type === 'blog-post')
            .map(url => ({
                url: `${BASE_URL}${url}`,
                title: manifest[url].title || url.split('/').pop().replace(/-/g, ' '),
                description: manifest[url].description || '',
                date: manifest[url].date || manifest[url].lastmod || manifest[url].updatedAt || new Date().toISOString()
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50); // Keep last 50 for RSS

        const rssItems = blogPosts.map(post => `
        <item>
            <title>${escapeXml(post.title)}</title>
            <link>${escapeXml(post.url)}</link>
            <description>${escapeXml(post.description)}</description>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
            <guid isPermaLink="true">${escapeXml(post.url)}</guid>
        </item>`).join('');

        const rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Exam Compass Blog &amp; Resources</title>
        <link>${BASE_URL}</link>
        <description>AI-powered exam preparation, notes, strategies, and PYQs for JEE, NEET, UPSC, and board exams.</description>
        <language>en-in</language>
        <atom:link href="${BASE_URL}/${RSS_NAME}" rel="self" type="application/rss+xml" />
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${rssItems}
    </channel>
</rss>`;

        const dirs = [PUBLIC_DIR, DIST_DIR];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, RSS_NAME), rssContent);
        });

        console.log(`✅ RSS Feed generated with ${blogPosts.length} posts.`);

    } catch (e) {
        console.error("❌ RSS Generation Failed:", e.message);
        process.exit(1);
    }
}

generateRSS();
