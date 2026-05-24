/**
 * 📡 RSS Feed Generator (NEXUS v2)
 * 
 * Generates an RSS 2.0 feed from the latest blog posts.
 * Enables students to subscribe via RSS readers, and feeds
 * into Google News and other aggregators.
 * 
 * Run: npx tsx scripts/generate-rss.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BASE_URL = 'https://examcompass.pages.dev';
const SITE_NAME = 'Exam Compass';
const FEED_LIMIT = 50; // Latest 50 posts in the feed

interface BlogEntry {
    slug: string;
    title: string;
    description: string;
    date: string;
    category: string;
}

function parseFrontmatter(content: string, slug: string): BlogEntry {
    const fm: Record<string, string> = {};
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
        fmMatch[1].split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*["']?(.*?)["']?\s*$/);
            if (match) fm[match[1]] = match[2];
        });
    }
    return {
        slug,
        title: fm.title || slug.replace(/-/g, ' '),
        description: (fm.description || '').substring(0, 300),
        date: fm.date || new Date().toISOString().split('T')[0],
        category: fm.category || 'Education',
    };
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function main() {
    console.log('📡 RSS Feed Generator\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    
    // Parse all entries
    const entries: BlogEntry[] = files.map(file => {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        return parseFrontmatter(content, slug);
    });

    // Sort by date (newest first) and take top N
    entries.sort((a, b) => b.date.localeCompare(a.date));
    const latest = entries.slice(0, FEED_LIMIT);

    // Build RSS XML
    const items = latest.map(e => {
        const pubDate = new Date(e.date).toUTCString();
        return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${BASE_URL}/blog/${e.slug}/</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${e.slug}/</guid>
      <description>${escapeXml(e.description)}</description>
      <category>${escapeXml(e.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    }).join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Revision Notes &amp; Study Guides</title>
    <link>${BASE_URL}/blog/</link>
    <description>Daily JEE, NEET, CBSE revision notes and practice MCQs crafted by top rankers. Updated every day by Jules AI.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/logo.png</url>
      <title>${SITE_NAME}</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

    // Write RSS feed
    const feedPath = path.join(PUBLIC_DIR, 'feed.xml');
    fs.writeFileSync(feedPath, rss);
    console.log(`✅ Generated feed.xml (${latest.length} items)`);

    // Also write an Atom feed alias
    fs.writeFileSync(path.join(PUBLIC_DIR, 'rss.xml'), rss);
    console.log(`✅ Generated rss.xml (alias)`);

    console.log('\n✨ RSS feed generation complete!');
}

main();
