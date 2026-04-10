/**
 * 🎬 YouTube Shorts Script Generator (AI Powered)
 * 
 * Uses Gemini AI to intelligently process a blog post and generate a highly-engaging
 * 60-second video script with retention hooks and visual cues.
 * 
 * Run: npx tsx scripts/social/shorts-generator.ts [slug]
 * Run all recent: npx tsx scripts/social/shorts-generator.ts --recent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodeRouter } from '../utils/nodeRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../../src/content/blogs');
const OUTPUT_DIR = path.join(__dirname, '../../social-output/shorts');
const BASE_URL = 'https://examcompass.pages.dev';

async function generateScriptWithAI(slug: string, content: string): Promise<string | null> {
    const prompt = `
    You are an expert YouTube Shorts and TikTok content creator specialized in EdTech.
    Your objective is to convert the following academic study material into an engaging, 
    high-retention 60-second vertical video script.

    BLOG CONTENT TO CONVERT:
    ${content.slice(0, 3000)} // Truncating to avoid massive token usage

    RULES FOR THE SCRIPT:
    1. Hook (0-5s): Must instantly grab attention. Open a "curiosity gap."
    2. Body (5-50s): Extract the 3 most crucial, highest-yield points or an insane 'trap/trick' from the text. Keep language punchy.
    3. CTA (50-60s): Tell them to grab the full chapter notes at the link in bio.
    4. Visuals: Provide brief [Visual/B-Roll] directives for the editor.
    5. Output strictly as a readable Markdown script. Include 3 catchy title options and hashtags at the end.
    6. Tone: Fast-paced, authoritative, high-energy.
    `;

    try {
        console.log(`🎬 Requesting High-Energy Script Generator (Tier: T3)...`);
        return await nodeRouter.route([{ role: "user", content: prompt }], 'T3');
    } catch (e: any) {
        console.error(`❌ AI Generation failed for ${slug}:`, e.message);
        return null;
    }
}

async function main() {
    console.log('\n🎬 AI YouTube Shorts Script Generator\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const args = process.argv.slice(2);
    let slugsToProcess: string[] = [];
    
    if (args.includes('--recent')) {
        const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
        const withDates = files.map(f => {
            const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
            const dateMatch = content.match(/date:\s*["']?([\d-]+)/);
            return { file: f, date: dateMatch ? dateMatch[1] : '0000-00-00' };
        }).sort((a, b) => b.date.localeCompare(a.date));
        
        slugsToProcess = withDates.slice(0, 3).map(f => f.file.replace('.md', ''));
        console.log(`📋 Processing 3 most recent blogs via AI...\n`);
    } else if (args.length > 0 && !args[0].startsWith('--')) {
        slugsToProcess = [args[0]];
    } else {
        console.log("Please specify a slug or use --recent.");
        process.exit(1);
    }
    let generated = 0;
    
    for (const slug of slugsToProcess) {
        const filePath = path.join(BLOG_DIR, `${slug}.md`);
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Not found: ${slug}`);
            continue;
        }
        
        console.log(`🤖 Prompting Gemini for ${slug}...`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const script = await generateScriptWithAI(slug, content);
        
        if (script) {
            const outputPath = path.join(OUTPUT_DIR, `${slug}.md`);
            fs.writeFileSync(outputPath, script, 'utf-8');
            console.log(`✅ ${slug} → AI script ready`);
            generated++;
        }
        
        // Anti-rate-limit sleep
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`\n📊 Generated ${generated} AI script(s) in: ${OUTPUT_DIR}`);
    console.log('✨ Done!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
