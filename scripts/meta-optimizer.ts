/**
 * 🚀 AI Meta Optimizer (Feature 3.2)
 * 
 * Automatically re-writes Title and Meta Description for blogs that:
 * 1. Have high impressions in Google Search (from search-intelligence.json)
 * 2. Have low CTR (< 2.5%)
 * 
 * It uses the "Top Query" from GSC to align the metadata with what users are searching for.
 * 
 * Run: npx tsx scripts/meta-optimizer.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodeRouter } from './utils/nodeRouter.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTELLIGENCE_FILE = path.join(__dirname, '../jules-reports/search-intelligence.json');
const BLOGS_DIR = path.join(__dirname, '../src/content/blogs');
const LOG_FILE = path.join(__dirname, '../jules-reports/seo-optimization-log.json');

async function optimizeMeta(url: string, data: any) {
    const slug = url.split('/').pop() || '';
    const filePath = path.join(BLOGS_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found for slug: ${slug}`);
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const currentTitle = frontmatter.match(/title:\s*"(.*?)"/)?.[1] || '';
    const currentDesc = frontmatter.match(/description:\s*"(.*?)"/)?.[1] || '';

    const prompt = `
You are an SEO expert. Optimize the Title and Meta Description for a blog post based on real Google Search data.

TARGET KEYWORD: "${data.topQuery}" (This search query is getting high impressions but low clicks)
CURRENT TITLE: "${currentTitle}"
CURRENT DESCRIPTION: "${currentDesc}"
IMPRESSIONS: ${data.impressions}

REQUIREMENTS:
1. TITLE: Must include the TARGET KEYWORD naturally. Keep it under 60 characters. Make it high-intent and "clicky" (curiosity, value, or speed).
2. DESCRIPTION: Must include the TARGET KEYWORD. Keep it between 140-160 characters. Include a call to action.
3. CONTEXT: Maintain the "Grandmaster Guide" or "Exam Compass" branding if it fits.

OUTPUT FORMAT (JSON ONLY):
{
  "optimizedTitle": "...",
  "optimizedDescription": "..."
}
`;

    console.log(`🤖 Optimizing [${slug}] for query: "${data.topQuery}"...`);

    try {
        const responseText = await nodeRouter.route([{ role: "user", content: prompt }], 'T4', { 
            jsonMode: true 
        });
        
        const optimized = JSON.parse(responseText);

        // Update frontmatter
        const updatedFrontmatter = frontmatter
            .replace(`title: "${currentTitle}"`, `title: "${optimized.optimizedTitle}"`)
            .replace(`description: "${currentDesc}"`, `description: "${optimized.optimizedDescription}"`);

        const updatedContent = content.replace(frontmatterMatch[0], `---
${updatedFrontmatter.trim()}
---`);

        fs.writeFileSync(filePath, updatedContent);

        return {
            slug,
            query: data.topQuery,
            old: { title: currentTitle },
            new: { title: optimized.optimizedTitle },
            impressions: data.impressions,
            ctr: data.ctr
        };

    } catch (error: any) {
        if (error?.message?.includes('429') || error?.status === 429) {
            console.error(`🚨 FATAL QUOTA EXHAUSTION: API limit reached. Triggering hard stop.`);
            process.exit(1);
        }
        console.error(`❌ Optimization failed for ${slug}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('\n🚀 Starting AI Meta Optimization...');

    if (!fs.existsSync(INTELLIGENCE_FILE)) {
        console.log('📊 No search intelligence report found. Run npm run seo:gsc first.');
        return;
    }

    const report = JSON.parse(fs.readFileSync(INTELLIGENCE_FILE, 'utf-8'));
    const opportunities = Object.entries(report.pages)
        .filter(([url, data]: [string, any]) => data.isOpportunity)
        .map(([url, data]: [string, any]) => ({ url, ...data }));

    if (opportunities.length === 0) {
        console.log('✅ No low-CTR opportunities detected in current data.');
        return;
    }

    const MAX_OPTS = 6;
    let opsToProcess = opportunities;
    if (opportunities.length > MAX_OPTS) {
        console.log(`⚠️ SAFETY VALVE: Found ${opportunities.length} opportunities, but limiting to ${MAX_OPTS} per run to protect quota.`);
        opsToProcess = opportunities.slice(0, MAX_OPTS);
    } else {
        console.log(`🎯 Found ${opportunities.length} opportunities to optimize.\n`);
    }

    const logs: any[] = fs.existsSync(LOG_FILE) ? JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')) : [];
    
    for (const opt of opsToProcess) {
        const result = await optimizeMeta(opt.url, opt);
        if (result) {
            logs.push({
                timestamp: new Date().toISOString(),
                ...result
            });
        }
    }

    const PUBLIC_LOG_FILE = path.join(__dirname, '../public/jules-reports/seo-optimization-log.json');
    if (!fs.existsSync(path.dirname(PUBLIC_LOG_FILE))) fs.mkdirSync(path.dirname(PUBLIC_LOG_FILE), { recursive: true });

    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    fs.writeFileSync(PUBLIC_LOG_FILE, JSON.stringify(logs, null, 2));

    console.log(`\n✨ Optimization complete! Page updates logged.`);
    console.log(`📄 Log saved: jules-reports/seo-optimization-log.json`);
    console.log(`📄 Public sync: public/jules-reports/seo-optimization-log.json\n`);
}

main();
