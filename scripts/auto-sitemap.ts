/**
 * 🗺️ Auto Sitemap Regenerator (NEXUS v2)
 * 
 * Scans all blog markdown files and regenerates sitemap-blogs.xml
 * with proper lastmod dates, priority, and changefreq values.
 * Also pings Google and Bing with the updated sitemap.
 * 
 * Run: npx tsx scripts/auto-sitemap.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL = 'https://examcompass.pages.dev';

interface SitemapEntry {
    slug: string;
    lastmod: string;
    priority: string;
    changefreq: string;
}

function parseFrontmatterDate(content: string): string {
    const dateMatch = content.match(/date:\s*["']?([^"'\n]+)["']?/);
    if (dateMatch) {
        try {
            const d = new Date(dateMatch[1]);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        } catch { /* fallback */ }
    }
    return new Date().toISOString().split('T')[0];
}

function main() {
    console.log('🗺️ Auto Sitemap Regenerator\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Found ${files.length} blog files\n`);

    const entries: SitemapEntry[] = [];

    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const lastmod = parseFrontmatterDate(content);
        
        // Higher priority for Class 11-12, JEE, NEET content
        const isHighPriority = /class-1[12]|jee|neet/i.test(slug);
        const priority = isHighPriority ? '0.8' : '0.6';
        
        // Freshly updated = weekly, older = monthly
        const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(lastmod).getTime()) / (1000 * 60 * 60 * 24)
        );
        const changefreq = daysSinceUpdate < 30 ? 'weekly' : 'monthly';

        entries.push({ slug, lastmod, priority, changefreq });
    }

    // Sort by lastmod (newest first)
    entries.sort((a, b) => b.lastmod.localeCompare(a.lastmod));

    // Generate XML
    const xmlEntries = entries.map(e => `  <url>
    <loc>${BASE_URL}/blog/${e.slug}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    // Write sitemap
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap-blogs.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`✅ Generated sitemap-blogs.xml (${entries.length} URLs)`);

    // Update last modified date in main sitemap index if it exists
    const mainSitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    if (fs.existsSync(mainSitemapPath)) {
        let mainSitemap = fs.readFileSync(mainSitemapPath, 'utf-8');
        const today = new Date().toISOString().split('T')[0];
        
        // Update the lastmod for sitemap-blogs.xml entry
        if (mainSitemap.includes('sitemap-blogs.xml')) {
            mainSitemap = mainSitemap.replace(
                /(<loc>[^<]*sitemap-blogs\.xml<\/loc>\s*<lastmod>)[^<]*(<\/lastmod>)/,
                `$1${today}$2`
            );
            fs.writeFileSync(mainSitemapPath, mainSitemap);
            console.log(`✅ Updated sitemap.xml index (lastmod → ${today})`);
        }
    }

    console.log('\n✨ Sitemap regeneration complete!');
}

// Ping search engines (called separately after deploy)
async function pingSearchEngines() {
    const sitemapUrl = `${BASE_URL}/sitemap.xml`;
    
    const engines = [
        { name: 'Google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
        { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    ];

    for (const engine of engines) {
        try {
            const res = await fetch(engine.url);
            if (res.ok) {
                console.log(`📡 Pinged ${engine.name} — OK`);
            } else {
                console.warn(`⚠️ ${engine.name} ping returned ${res.status}`);
            }
        } catch (err: any) {
            console.warn(`⚠️ ${engine.name} ping failed: ${err.message}`);
        }
    }
}

main();

// Ping if --ping flag is passed
if (process.argv.includes('--ping')) {
    pingSearchEngines().catch(console.error);
}
