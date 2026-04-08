
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, standardizeMarkdown, BlogPostJSON, QualityReport, Section } from './utils/jules-quality.js';
import { godSafeParse } from './utils/god-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');

// --- API ROTATION CORE ---
const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY, process.env.VITE_GROQ_API_KEY_2, process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4, process.env.VITE_GROQ_API_KEY_5, process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

const GEMINI_KEYS = [
    process.env.VITE_GEMINI_API_KEY, process.env.VITE_GEMINI_API_KEY_2, process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4, process.env.VITE_GEMINI_API_KEY_5, process.env.VITE_GEMINI_API_KEY_6
].filter(Boolean) as string[];

let currentGroqIndex = 0;
let currentGeminiIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateGroq() {
    currentGroqIndex = (currentGroqIndex + 1) % GROQ_KEYS.length;
    groq = new Groq({ apiKey: GROQ_KEYS[currentGroqIndex] });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGemini(system: string, user: string): Promise<string | null> {
    const key = GEMINI_KEYS[currentGeminiIndex];
    if (!key) return null;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
            })
        });
        if (!response.ok) {
            if (response.status === 429) {
                console.error(`🚨 FATAL QUOTA EXHAUSTION: Gemini API limit reached in Patch Generator. Triggering hard stop.`);
                process.exit(1);
            }
            return null;
        }
        const data: any = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch { return null; }
}

async function generatePatch(topic: string, sectionName: string): Promise<any> {
    console.log(`🩹 Generating patch for: ${sectionName}...`);
    const system = `You are a JEE/NEET Ranker. Output ONLY valid JSON for a missing blog section.
    Rules: Double-escape LaTeX \\\\frac{} and use Markdown for the body.`;
    const user = `Generate the missing section "${sectionName}" for the topic "${topic}".
    Return as JSON: { "heading": "${sectionName}", "body": "Detailed content...", "table": { "headers": [], "rows": [[]] } }`;

    // Try Groq First
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        return godSafeParse(completion.choices[0]?.message?.content || "");
    } catch (err: any) {
        if (err?.status === 429 || err?.message?.includes('429')) {
             console.error(`🚨 FATAL QUOTA EXHAUSTION: Groq API limit reached in Patch Generator. Triggering hard stop.`);
             process.exit(1);
        }
        rotateGroq();
        const gem = await callGemini(system, user);
        return gem ? godSafeParse(gem) : null;
    }
}

// --- MAIN PATCH ENGINE ---
async function patchSystem() {
    console.log("🛠️ Jules Self-Healing: Starting Patch Engine...");

    const latestReportFile = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('pipeline-') && f.endsWith('.json'))
        .sort().reverse()[0];

    if (!latestReportFile) return console.log("📭 No pipeline report found.");

    const reportPath = path.join(REPORTS_DIR, latestReportFile);
    const reportList = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const patchable = reportList.filter((b: any) => 
        b.status === "failed" && 
        b.quality_report?.regenerate_all === false && 
        b.quality_report?.patch_missing_sections?.length > 0
    );

    console.log(`🔍 Found ${patchable.length} patchable blogs.`);

    for (const blog of patchable) {
        const filePath = path.join(BLOG_DIR, `${blog.slug}.md`);
        if (!fs.existsSync(filePath)) continue;

        console.log(`\n🩹 Patching: ${blog.slug}`);
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        
        // Extract title/topic from filename/content
        const topic = blog.slug.replace(/-/g, ' ');

        const patches: Section[] = [];
        for (const sectionName of blog.quality_report.patch_missing_sections) {
            const patch = await generatePatch(topic, sectionName);
            if (patch) patches.push(patch);
            await sleep(2000);
        }

        if (patches.length > 0) {
            // Append patches to the bottom of the content but before the footer
            const footerSplit = "---";
            const parts = originalContent.split(footerSplit);
            
            // Reconstruct the JSON object for quality check
            // (In a real scenario, we'd parse the whole MD, but for patching we can just append)
            const patchMarkdown = patches.map(p => `\n## ${p.heading}\n\n${p.body}\n`).join('\n');
            
            // Very basic injection before the last horizontal rule (footer)
            let newContent = originalContent;
            const lastHrIdx = originalContent.lastIndexOf("\n---\n\n### 🚀 Ready to Ace");
            if (lastHrIdx !== -1) {
                newContent = originalContent.slice(0, lastHrIdx) + patchMarkdown + originalContent.slice(lastHrIdx);
            } else {
                newContent += patchMarkdown;
            }

            fs.writeFileSync(filePath, newContent);
            console.log(`✅ Patched and Updated: ${blog.slug}`);
            
            // Update report status (Local only)
            blog.status = "patched";
        }
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportList, null, 2));
    console.log("\n✨ Self-Healing cycle complete.");
}

patchSystem().catch(console.error);
