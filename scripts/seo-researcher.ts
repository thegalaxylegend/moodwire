/**
 * 📈 SEO Growth Researcher (Feature 3.0)
 * 
 * Intelligence:
 * 1. Analyzes Google Search Console (GSC) impressions from search-intelligence.json
 * 2. Cross-references with syllabus-completion.json to find content gaps.
 * 3. Uses Gemini 2.5 Pro to identify "Golden Topics": High search interest + Missing content.
 * 4. Generates growth-queue.json for the blog generator.
 * 
 * Run: npx tsx scripts/seo-researcher.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { nodeRouter } from './utils/nodeRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTEL_PATH = path.join(__dirname, '../dist/jules-reports/search-intelligence.json');
const SYLLABUS_PATH = path.join(__dirname, '../jules-reports/syllabus-completion.json');
const OUTPUT_PATH = path.join(__dirname, '../jules-reports/growth-queue.json');

async function main() {
    console.log('\n🔍 Starting SEO Growth Research Pass...');

    if (!fs.existsSync(INTEL_PATH) || !fs.existsSync(SYLLABUS_PATH)) {
        console.error('❌ Missing data files. Ensure GSC and Syllabus reports exist.');
        process.exit(1);
    }

    const intel = JSON.parse(fs.readFileSync(INTEL_PATH, 'utf-8'));
    const syllabus = JSON.parse(fs.readFileSync(SYLLABUS_PATH, 'utf-8'));

    // Trim data to stay within token limits for Pro
    const gscPages = Object.fromEntries(Object.entries(intel.pages).slice(0, 50));

    const prompt = `You are a Senior SEO Content Strategist for ExamCompass (an Indian exam prep site for JEE/NEET/CBSE).
    
    DATA INPUTS:
    1. GSC Intel: ${JSON.stringify(gscPages)}
    2. Syllabus Completion: ${JSON.stringify(syllabus.bySubject)}
    
    TASK:
    Analyze which "Golden Topics" we should target next.
    A "Golden Topic" is:
    - Highly searched (High impressions in GSC or related to high-impression clusters).
    - Missing from our current syllabus completion (especially in subjects below 100%).
    - Likely to attract "Low Volume/High Intent" traffic (e.g. specific Class 10/11 board topics).
    
    OUTPUT FORMAT (Valid JSON only):
    {
        "strategy": "Brief summary of the focus (e.g. Class 10 Math gaps)",
        "queue": [
            { "topic": "Exact Chapter Title", "subject": "Physics/Chemistry/Math/Biology", "priority": 1-10, "reason": "Why this specific topic?" }
        ]
    }`;

    let response = "";
    try {
        console.log(`🤖 [SEO Intel] Requesting Elite Strategic Analysis (Tier: T5)...`);
        response = await nodeRouter.route([], 'T1', {
            system: "You are a Senior SEO Content Strategist for ExamCompass (an Indian exam prep site for JEE/NEET/CBSE).",
            user: prompt,
            jsonMode: true
        });
    } catch (err: any) {
        console.error('❌ All Models & Keys in SEO Strategy chain failed:', err.message);
        process.exit(1);
    }

    try {
        fs.writeFileSync(OUTPUT_PATH, response);
        console.log('✅ Growth Strategy Saved to:', OUTPUT_PATH);
        
        const parsed = JSON.parse(response);
        console.log(`\n🚀 TOP TARGET: ${parsed.queue[0].topic} (${parsed.queue[0].subject})`);
        console.log(`💡 Rationale: ${parsed.queue[0].reason}\n`);
    } catch (err: any) {
        console.error('❌ JSON Parsing/Writing Failed:', err.message);
    }
}

main();
