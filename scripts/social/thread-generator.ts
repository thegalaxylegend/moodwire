/**
 * 🧵 Twitter/X Thread Generator (AI Powered)
 * 
 * Uses Gemini AI to intelligently process a blog post and generate a highly-engaging
 * Twitter thread optimized for viral reach and education.
 * 
 * Run: npx tsx scripts/social/thread-generator.ts [slug]
 * Run all recent: npx tsx scripts/social/thread-generator.ts --recent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../../src/content/blogs');
const OUTPUT_DIR = path.join(__dirname, '../../social-output/threads');
const BASE_URL = 'https://examcompass.pages.dev';

async function generateThreadWithAI(slug: string, content: string): Promise<string | null> {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ VITE_GEMINI_API_KEY is missing in .env");
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are an expert ghostwriter creating a viral Twitter/X Thread for EdTech.
    Your objective is to convert the following academic study material into an engaging, 
    value-dense 5-7 tweet thread.

    BLOG CONTENT TO CONVERT:
    ${content.slice(0, 3000)} // Truncated for token limit

    RULES FOR THE THREAD:
    1. Tweet 1 (Hook): The opener. Must stop the scroll. State the massive benefit or common mistake. No hashtags here.
    2. Tweet 2-5 (Value): Break down the concepts clearly. Use engaging spacing. Limit to 280 chars per tweet. Emojis welcome but don't overdo it.
    3. Final Tweet (CTA): Drive traffic to the full post: '${BASE_URL}/blog/${slug}' and ask for a retweet.
    4. Provide the output clearly separated by "---" between tweets.
    `;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e: any) {
        console.error(`❌ AI Generation failed for ${slug}:`, e.message);
        return null;
    }
}

async function main() {
    console.log('\n🧵 AI Twitter/X Thread Generator\n');
    
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
        const script = await generateThreadWithAI(slug, content);
        
        if (script) {
            const outputPath = path.join(OUTPUT_DIR, `${slug}.md`);
            fs.writeFileSync(outputPath, script, 'utf-8');
            console.log(`✅ ${slug} → AI thread ready`);
            generated++;
        }
        
        // Anti-rate-limit sleep
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`\n📊 Generated ${generated} AI thread(s) in: ${OUTPUT_DIR}`);
    console.log('✨ Done!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
