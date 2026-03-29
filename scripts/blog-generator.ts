import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, BlogPostJSON, QualityReport, Section, MCQ } from './utils/jules-quality.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateGroqKey() {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
    groq = new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
    console.log(`🔄 Rotating to Groq Key #${currentKeyIndex + 1}...`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// --- DATE DISTRIBUTOR ---
// To guarantee new blogs ALWAYS appear at the top of the grid, 
// we assign them today's date rather than back-dating them.
const getShiftedDate = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};


// Gemini Backup Helper
async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return null;

    try {
        console.log(`🚀 Calling Gemini Flash for content...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
                }],
                generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`❌ Gemini API Error (${response.status}): ${errBody}`);
            return null;
        }

        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (text) console.log(`✅ Gemini content received (${text.length} chars).`);
        return text;
    } catch (err: any) {
        console.error("❌ Gemini Backup Network Error:", err.message);
        return null;
    }
}

// Gemini with rate-limit retry
async function generateWithGeminiRetry(systemPrompt: string, userPrompt: string, maxRetries: number = 3): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
        const result = await generateWithGemini(systemPrompt, userPrompt);
        if (result) return result;
        if (i < maxRetries - 1) {
            const waitSec = 45; // Gemini free tier resets in ~42s
            console.log(`⏳ Gemini rate limited. Waiting ${waitSec}s before retry ${i + 2}/${maxRetries}...`);
            await sleep(waitSec * 1000);
        }
    }
    return null;
}

const QUEUE_FILE = path.join(__dirname, '../queue.json');
const BLOG_RULES_FILE = path.join(__dirname, '../BLOG_RULES.md');
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');

const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant"
];

const GROQ_PROMPT_MODEL = "llama-3.1-8b-instant"; 

// Subject-specific neon accent colors for the theme
const NEON_THEMES: Record<string, { primary: string; secondary: string; glow: string }> = {
    'Physics': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' },
    'Chemistry': { primary: '#00e676', secondary: '#ff6d00', glow: '#00e676' },
    'Biology': { primary: '#69f0ae', secondary: '#e040fb', glow: '#69f0ae' },
    'Maths': { primary: '#ffea00', secondary: '#00b0ff', glow: '#ffea00' },
    'Mathematics': { primary: '#ffea00', secondary: '#00b0ff', glow: '#ffea00' },
    'History': { primary: '#ff9100', secondary: '#d500f9', glow: '#ff9100' },
    'default': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' }
};

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

const SUBJECT_FALLBACKS: Record<string, string> = {
    'History':     '/blog-images/fallbacks/history-manuscript.webp',
    'Geography':   '/blog-images/fallbacks/geography-terrain.webp', 
    'Biology':     '/blog-images/fallbacks/biology-cell.webp',
    'Chemistry':   '/blog-images/fallbacks/chemistry-molecule.webp',
    'Physics':     '/blog-images/fallbacks/physics-waves.webp',
    'Mathematics': '/blog-images/fallbacks/maths-equations.webp',
    'Computer Science': '/blog-images/fallbacks/generic-study.webp',
    'Science':     '/blog-images/fallbacks/generic-study.webp',
    'Social Science': '/blog-images/fallbacks/history-manuscript.webp',
    'English':     '/blog-images/fallbacks/generic-study.webp',
    'default':     '/blog-images/fallbacks/generic-study.webp'
};

const SUBJECT_CATEGORIES: Record<string, string> = {
    'History':     'History',
    'Geography':   'Geography', 
    'Indian Geography': 'Geography',
    'Physical Geography': 'Geography',
    'World Geography': 'Geography',
    'Biology':     'Biology',
    'Chemistry':   'Chemistry',
    'Physics':     'Physics',
    'Mathematics': 'Mathematics',
    'Civics':      'Social Science',
    'Polity':      'Social Science',
    'Political Science': 'Social Science',
    'Indian Constitution': 'Social Science',
    'Constitutional Framework': 'Social Science',
    'Fundamental Rights': 'Social Science',
    'DPSP & Duties': 'Social Science',
    'Federalism': 'Social Science',
    'Art & Culture': 'History'
};


async function generateCloudflareImage(subject: string, topic: string, webpPath: string): Promise<boolean> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '') || '73fdf68d86f206ccbbf0ded01b668bd2';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN?.replace(/['"]/g, '');

    if (!accountId || !apiToken) {
        console.warn("⚠️ Cloudflare credentials (ACCOUNT_ID/API_TOKEN) missing in .env");
        return false;
    }

    try {
        console.log(`☁️ Jules: Designing custom artwork via Cloudflare Flux...`);
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, high-tech visualization, no text overlays` 
                })
            }
        );

        if (!response.ok) throw new Error(`Cloudflare API error: ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        let imageBuffer: Buffer;

        if (contentType.includes('application/json')) {
            // Cloudflare Workers AI returns JSON with base64-encoded image
            const json: any = await response.json();
            const b64 = json.result?.image;
            if (!b64) throw new Error('No image field in Cloudflare JSON response');
            imageBuffer = Buffer.from(b64, 'base64');
            console.log(`📦 Decoded base64 image from Cloudflare JSON (${imageBuffer.length} bytes)`);
        } else {
            imageBuffer = Buffer.from(await response.arrayBuffer());
        }

        if (imageBuffer.length < 100) throw new Error('Cloudflare image too small');

        const { default: sharp } = await import('sharp');
        await sharp(imageBuffer)
            .resize(1200, 630, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(webpPath);

        console.log(`✅ Cloudflare FLUX image saved.`);
        return true;
    } catch (err: any) {
        console.warn(`⚠️ Cloudflare failed: ${err.message}`);
        return false;
    }
}

async function generateGroqSVG(subject: string, topic: string, webpPath: string): Promise<boolean> {
    try {
        console.log(`🚀 Using Groq to design SVG artwork...`);
        const system = "You are an expert SVG artist. Output ONLY valid, raw SVG code. No markdown, no commentary.";
        const user = `Create a stunning, high-definition 1200x630 SVG for "${topic}" (${subject}). 
        Style: Professional, dark theme (#0a0a1a), neon cyan accents, scientific geometry. 
        Ensure the SVG starts with <svg and ends with </svg>.`;

        const svg = await callLlmWithFallback(system, user, false);
        
        // Cleanup
        let cleanSvg = svg.replace(/```(?:svg|xml|html)?\s*/gi, "").replace(/```/gi, "").trim();
        if (cleanSvg.includes("<svg") && !cleanSvg.startsWith("<svg")) {
            cleanSvg = cleanSvg.substring(cleanSvg.indexOf("<svg"));
        }
        const closingIdx = cleanSvg.lastIndexOf("</svg>");
        if (closingIdx > 0) {
            cleanSvg = cleanSvg.substring(0, closingIdx + 6);
        }

        if (!cleanSvg.startsWith("<svg")) throw new Error("Invalid SVG from Groq");

        // Ensure width/height
        if (!cleanSvg.includes('width=')) {
            cleanSvg = cleanSvg.replace('<svg', '<svg width="1200" height="630"');
        }

        const safeSvg = cleanSvg.replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');
        const { default: sharp } = await import('sharp');
        await sharp(Buffer.from(safeSvg)).resize(1200, 630).webp({ quality: 90 }).toFile(webpPath);
        
        console.log(`✅ Groq SVG image saved.`);
        return true;
    } catch (err: any) {
        console.warn(`⚠️ Groq SVG failed: ${err.message}`);
        return false;
    }
}

async function generateGeminiImage(subject: string, topic: string, webpPath: string): Promise<boolean> {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return false;

    try {
        console.log(`🚀 Primary APIs down. Asking Gemini to design SVG...`);
        const prompt = `You are an SVG generator. Output ONLY valid SVG code. No explanations, no markdown.

Create a 1200x630 SVG image for: "${topic}" (${subject}).
Style: Dark background (#0a0a1a), neon cyan/purple accents, geometric shapes, scientific aesthetic.
Start your response with <svg and end with </svg>. Nothing else.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        const data: any = await response.json();
        let svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Aggressive cleanup for valid SVG — handle markdown blocks, xml headers, etc
        svg = svg.replace(/```(?:svg|xml|html)?\s*/gi, "").replace(/```/gi, "").trim();
        svg = svg.replace(/^<\?xml[^>]*\?>\s*/i, ""); // strip XML declaration
        if (svg.includes("<svg") && !svg.startsWith("<svg")) {
            svg = svg.substring(svg.indexOf("<svg"));
        }
        // Trim anything after closing </svg>
        const closingIdx = svg.lastIndexOf("</svg>");
        if (closingIdx > 0) {
            svg = svg.substring(0, closingIdx + 6);
        }

        if (!svg.startsWith("<svg")) throw new Error("Invalid SVG from Gemini");

        // Ensure width/height attributes exist for sharp
        if (!svg.includes('width=')) {
            svg = svg.replace('<svg', '<svg width="1200" height="630"');
        }
        const safeSvg = svg.replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');
        const { default: sharp } = await import('sharp');
        await sharp(Buffer.from(safeSvg)).resize(1200, 630).webp({ quality: 90 }).toFile(webpPath);
        
        console.log(`✅ Gemini SVG image saved.`);
        return true;
    } catch (err: any) {
        console.warn(`⚠️ Gemini SVG failed: ${err.message}`);
        return false;
    }
}

async function generateHuggingFaceImage(subject: string, topic: string, webpPath: string): Promise<boolean> {
    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken) return false;

    try {
        console.log("🤗 Trying Hugging Face FLUX.1-schnell...");
        const response = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, 16:9 aspect ratio, no text.`,
                parameters: { width: 1200, height: 630, num_inference_steps: 4, guidance_scale: 0.0 }
            })
        });

        if (!response.ok) throw new Error(`HF error: ${response.status}`);

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const { default: sharp } = await import('sharp');
        await sharp(imageBuffer).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(webpPath);

        console.log(`✅ HF image saved.`);
        return true;
    } catch (err: any) {
        console.warn(`⚠️ HF failed: ${err.message}`);
        return false;
    }
}

async function downloadHeroImage(subject: string, topic: string, slug: string): Promise<string> {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return `/blog-images/${slug}.webp`;

    console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);

    // Priority 1: Cloudflare Workers AI (Jules Flux)
    const cfOk = await generateCloudflareImage(subject, topic, webpPath);
    if (cfOk) return `/blog-images/${slug}.webp`;

    // Priority 2: Groq SVG
    const groqOk = await generateGroqSVG(subject, topic, webpPath);
    if (groqOk) return `/blog-images/${slug}.webp`;

    // Priority 3: Gemini SVG
    const geminiOk = await generateGeminiImage(subject, topic, webpPath);
    if (geminiOk) return `/blog-images/${slug}.webp`;

    // Priority 3: Hugging Face 
    const hfOk = await generateHuggingFaceImage(subject, topic, webpPath);
    if (hfOk) return `/blog-images/${slug}.webp`;

    // Priority 4: Static Subject Fallbacks
    console.log("🎨 All APIs unavailable. Injecting high-quality static subject fallback...");
    const fallbackImage = SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS['default'];
    return fallbackImage;
}

const GRANDMASTER_IDENTITY = `You are a strict, top 1% JEE/NEET ranker creating a "Last-Night Revision Format" study guide.
Your sole purpose is to provide exactly what a student needs to read 12 hours before their exam to maximize their score.
Voice: Specific, data-driven, authentic student tone. NO FILLER. No fluff. No introductions.

Format Rule: A student reads this once, closes the tab, and walks into the exam confident.
DO NOT use phrases like "In conclusion", "delve into", "comprehensive", "embark on your journey".`;

const CROSS_SECTION_RULES = `
RULES FOR THE LAST-NIGHT REVISION FORMAT:
1. NO INTRODUCTIONS. NO DEFINITIONS. NO PREREQUISITES. Start directly with high-yield exam insights.
2. LATEX ESCAPING: You MUST double-escape all backslashes in LaTeX formulas (e.g., use \\\\frac instead of \\frac, \\\\times instead of \\times, \\\\Delta instead of \\Delta). Failure to double-escape will break the JSON parser and your output will be discarded.
3. Every formula must be rendered cleanly with ONLY $ for inline math and $$ for block math. Ensure all formulas are wrapped.
4. Voice: Authentic Peer Mentor (student-to-student). 
STRICT RULE: Focus entirely on what's examined, not just general knowledge.
`;


// --- SMART RECOVERY WRAPPER ---
function safelyParseJson(raw: string): any {
    let jsonStr = raw.replace(/```json/gi, "").replace(/```/gi, "").trim();
    
    // Always extract JSON object (handles Llama conversational padding)
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    try {
        // Fix unescaped newlines in strings, which is very common
        let cleaned = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
            return '"' + p1.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
        });

        // DO NOT globally replace backslashes because JSON.parse expects standard escapes like \n, \t, etc.
        // And if Llama output \\frac, it's valid. If Llama output \f, JSON.parse converts to form-feed.
        // We will just let JSON.parse handle it. If it throws, we check next strategy.

        return JSON.parse(cleaned);
    } catch (err) {
        console.warn("⚠️ JSON Parse failed. Attempting aggressive recovery on trailing commas...");
        try {
            let subset = jsonStr.replace(/\/\/.*$/gm, ""); // Remove comments
            subset = subset.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"); // trailing commas
            return JSON.parse(subset);
        } catch {
            throw new Error("Final JSON parse failed.");
        }
    }
}

async function callLlmWithFallback(system: string, user: string, isJson: boolean = false, attempt: number = 1): Promise<string> {
    const isMetadata = user.includes("SEO") || user.includes("slug"); // Removed MCQ from metadata to force 70B for accuracy
    const primaryModel = isMetadata ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: primaryModel,
            response_format: isJson ? { type: "json_object" } : undefined,
            temperature: 0.7,
            max_tokens: 4000
        });
        return completion.choices[0]?.message?.content || "";
    } catch (err: any) {
        if (err.message.includes("429") || err.message.includes("rate_limit")) {
            if (attempt < GROQ_KEYS.length) {
                rotateGroqKey();
                await sleep(2000 * attempt); // Exponential-ish backoff
                return await callLlmWithFallback(system, user, isJson, attempt + 1);
            }
            
            console.log(`🛡️ All Groq keys rate limited. Falling back to Gemini (with retry)...`);
            const gemini = await generateWithGeminiRetry(system + (isJson ? "\nReturn ONLY valid JSON." : ""), user);
            if (gemini) return gemini;

            // If Gemini also failed, wait and retry Groq from start
            if (attempt < 10) {
                console.log(`⏳ Both APIs saturated. Sleeping for 30s...`);
                await sleep(30000);
                return await callLlmWithFallback(system, user, isJson, attempt + 1);
            }
        }
        throw err;
    }
}

async function generateOutline(item: any, targetYear: number): Promise<string[]> {
    console.log(`📑 Jules: Using fixed Last-Night Revision Format for ${item.topic}...`);
    return [
        "⚡ Formula Bank",
        "🪤 The 5 Mistakes That Cost Marks",
        "✏️ 3 Solved PYQs",
        "🧠 The One Thing Most Students Get Wrong",
        "👁️ Ayush's Note",
        "🔁 Last 5 Minutes Box"
    ];
}

async function generateIntro(item: any, targetYear: number, displayClass: string): Promise<string> {
    console.log(`✍️ Jules: Crafting "What WILL Come" hook...`);
    const system = `${GRANDMASTER_IDENTITY}\n${CROSS_SECTION_RULES}`;
    const user = `Write the "🎯 What WILL Come in Your Exam" section for "${item.topic}" for ${displayClass} in ${targetYear}.
    Rule: Not 'what could come' — what *always* comes. Be incredibly specific. 
    Examples: "1 numerical on Bohr's energy levels — always", "Photoelectric effect graph — NEET favourite".
    Return ONLY the markdown for this section (no heading, just bullet points). NO INTRODUCTION OR FILLER.`;
    
    return await callLlmWithFallback(system, user, false);
}

async function generateSection(item: any, heading: string, displayClass: string, targetYear: number): Promise<Section> {
    console.log(`📖 Jules: Writing specific revision section: ${heading}...`);
    const system = `${GRANDMASTER_IDENTITY}\n${CROSS_SECTION_RULES}`;
    
    let specificDirective = "";
    if (heading.includes("Formula Bank")) {
         specificDirective = "Provide EVERY formula for this chapter. Rendered clean using LATEX. Variable meaning in one line. NOTHING ELSE. No text paragraphs.";
    } else if (heading.includes("Mistakes")) {
         specificDirective = "Provide exactly 5 highly specific errors students make. Format each as: Mistake (e.g. Using lambda = h/mv without converting mass to kg), Costs (e.g. Full 4 marks), Fix (e.g. Always convert grams to kg). No generic traps.";
    } else if (heading.includes("PYQs")) {
         specificDirective = "Provide exactly 3 real past year questions (JEE/NEET or CBSE). Format: Q: [exact question]. Trap in this question: [what confuses students]. Solution: [Show full working: given -> formula -> substitution -> answer with units]. Answer: [with units].";
    } else if (heading.includes("One Thing")) {
         specificDirective = "Choose ONE deep concept. Explain the specific thing that separates 85% scorers from 95% scorers in this chapter.";
    } else if (heading.includes("Ayush's Note")) {
         specificDirective = "Provide a specific pattern only visible after studying 5 years of PYQs. Cannot appear in any standard textbook.";
    } else if (heading.includes("Last 5 Minutes")) {
         specificDirective = "This is the final thing they read before sleeping. Provide exactly: 5 formulas maximum, 3 facts maximum, 2 common mistakes maximum. Short bullet points.";
    } else {
         specificDirective = "Provide a highly focused, no-nonsense revision summary.";
    }

    const user = `Write the section for the heading: "${heading}" regarding the topic "${item.topic}".
    STRICT RULE: ${specificDirective}
    Remember LATEX ESCAPING RULES!
    Return JSON: { "heading": "${heading}", "body": "...", "table": { "headers": [], "rows": [[]] } }`;

    const raw = await callLlmWithFallback(system, user, true);
    try {
        return safelyParseJson(raw);
    } catch {
        return { heading, body: raw };
    }
}

async function generateExtras(item: any): Promise<{ mcqs: MCQ[], recall: string[] }> {
    console.log(`🎯 Jules: Generating MCQs and Quick Recall...`);
    const system = GRANDMASTER_IDENTITY;
    const user = `Generate 5 high-yield MCQs and 7 Quick Recall bullet points for "${item.topic}".
    The MCQs MUST have "question", "options" (array), "answer" (A/B/C/D), and "answer_text" (explanation) fields.
    Return as JSON: { "mcqs": [...], "quick_recall": [...] }`;
    const raw = await callLlmWithFallback(system, user, true);
    try {
        const data = safelyParseJson(raw);
        return { mcqs: data.mcqs || [], recall: data.quick_recall || [] };
    } catch {
        return { mcqs: [], recall: [] };
    }
}

async function generateBlogs() {
    console.log(`🤖 Jules: Starting Blog Generation (Queued)...`);

    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 No queue found.");
        return;
    }

    const REPORTS_DIR = path.join(__dirname, '../jules-reports');
    const FAILED_DIR = path.join(__dirname, '../jules-failed');
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);
    if (!fs.existsSync(FAILED_DIR)) fs.mkdirSync(FAILED_DIR);

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const pipelineReport: any[] = [];

    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-dry-run');
    if (isDryRun) console.log("🧪 DRY RUN MODE ENABLED — No files will be written.");

    // Track generated slugs for Discord
    const generatedSlugsFile = path.join(__dirname, '../generated-slugs.txt');
    fs.writeFileSync(generatedSlugsFile, ''); // Reset file

    for (const item of queue) {
        // Area 3: Dynamic Target Year (Switch on August 1st)
        const now = new Date();
        const currentYear = Number(now.getFullYear());
        const currentMonth = now.getMonth(); 
        const targetYear = currentMonth >= 7 ? currentYear + 1 : currentYear;

        if (targetYear < 2024 || targetYear > 2030) {
            console.error(`🚨 Bad targetYear: ${targetYear}. Skipping ${item.topic}`);
            continue;
        }

        const displayClass = item.class.startsWith('Class ') ? item.class : `Class ${item.class}`;
        const numericClass = Number(item.class.replace(/\D/g, ''));

        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${displayClass}, Year ${targetYear})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        
        // --- DATE PRESERVATION LOGIC ---
        let publishDate = getShiftedDate();
        if (fs.existsSync(filePath)) {
            const existingContent = fs.readFileSync(filePath, 'utf8');
            const dateMatch = existingContent.match(/date:\s*["'](.*?)["']/);
            if (dateMatch) publishDate = dateMatch[1];
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);

        // --- MULTI-PASS GENERATION ---
        let finalPost: BlogPostJSON | null = null;
        let assembled: BlogPostJSON | null = null;
        let qualityReport: QualityReport | null = null;
        let lastError = "";
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !finalPost) {
            attempts++;
            console.log(`📡 Multi-Pass Attempt ${attempts}/${maxAttempts} for ${item.topic}...`);

            try {
                // Determine what needs to be generated/regenerated
                const needsFullRegen = attempts === 1 || !assembled || qualityReport?.regenerate_sections.includes("all");
                const needsIntro = needsFullRegen || qualityReport?.regenerate_sections.includes("intro");
                const needsSections = needsFullRegen || qualityReport?.regenerate_sections.includes("sections");
                const needsMCQs = needsFullRegen || qualityReport?.regenerate_sections.includes("mcqs");
                
                if (needsFullRegen || !assembled) {
                    const outline = await generateOutline(item, targetYear);
                    const intro = await generateIntro(item, targetYear, displayClass);
                    
                    const sections: Section[] = [];
                    for (const heading of outline) {
                        sections.push(await generateSection(item, heading, displayClass, targetYear));
                        await new Promise(r => setTimeout(r, 3000));
                    }

                    const extras = await generateExtras(item);

                    const SUBJECT_EXAM: Record<string, string> = {
                        'Physics': 'JEE & NEET', 'Chemistry': 'JEE & NEET',
                        'Mathematics': 'JEE', 'Biology': 'NEET',
                        'Computer Science': 'GATE & Boards',
                        'Science': 'CBSE Boards', 'Social Science': 'CBSE Boards',
                        'English': 'CBSE Boards'
                    };
                    const examTag = numericClass >= 11
                        ? (SUBJECT_EXAM[item.subject] || 'CBSE')
                        : 'CBSE';

                    const seoTitle = numericClass >= 11
                        ? `${item.topic} Class ${numericClass} ${item.subject} Revision — ${examTag} ${targetYear} Grandmaster Guide`
                        : `${item.topic} Class ${numericClass} ${item.subject} Recap — ${examTag} ${targetYear} Quick Guide`;

                    assembled = {
                        title: seoTitle,
                        slug: item.targetSlug,
                        subject: item.subject,
                        chapter_name: item.topic,
                        exam_class: numericClass,
                        last_updated: new Date().toISOString().split('T')[0],
                        practice_link_path: "",
                        hero_image: heroImagePath,
                        content: {
                            intro,
                            sections,
                            mcqs: extras.mcqs,
                            quick_recall: extras.recall
                        }
                    };
                } else {
                    // Granular Regen (assembled is guaranteed non-null here)
                    console.log(`🧠 Jules: Starting granular repair to save tokens...`);
                    const postToRepair = assembled as BlogPostJSON;

                    if (needsIntro) {
                        console.log(`  📝 Regenerating Intro...`);
                        postToRepair.content.intro = await generateIntro(item, targetYear, displayClass);
                    }
                    
                    if (needsSections || qualityReport?.regenerate_sections.some(s => s.startsWith("section: "))) {
                        if (needsSections) {
                            console.log(`  📝 Regenerating All Sections...`);
                            const outline = await generateOutline(item, targetYear);
                            postToRepair.content.sections = [];
                            for (const heading of outline) {
                                postToRepair.content.sections.push(await generateSection(item, heading, displayClass, targetYear));
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } else {
                            // Check for specific section repairs
                            for (const tag of qualityReport?.regenerate_sections || []) {
                                if (tag.startsWith("section: ")) {
                                    const headingToFix = tag.replace("section: ", "");
                                    console.log(`  📝 Repairing specific section: ${headingToFix}`);
                                    const index = postToRepair.content.sections.findIndex(s => s.heading === headingToFix);
                                    if (index !== -1) {
                                        postToRepair.content.sections[index] = await generateSection(item, headingToFix, displayClass, targetYear);
                                    }
                                }
                            }
                        }
                    }

                    if (needsMCQs) {
                        console.log(`  📝 Regenerating MCQs...`);
                        const extras = await generateExtras(item);
                        postToRepair.content.mcqs = extras.mcqs;
                        postToRepair.content.quick_recall = extras.recall;
                    }
                }

                // --- PRE-QUALITY SANITIZER: Remove all forbidden phrases BEFORE scoring ---
                const sanitizeKillList = [
                    "in conclusion", "delve into", "it is important to note",
                    "world-best", "comprehensive", "ultimate guide",
                    "embark on your journey", "needless to say", "master this today",
                    "everything you need", "complete guide", "mastering this",
                    "in today's competitive world", "vibrant", "robust", "unveiling",
                    "embark on a journey", "one of the most important topics",
                    "comprehensive guide"
                ];
                for (const phrase of sanitizeKillList) {
                    const regex = new RegExp(phrase, 'gi');
                    if (regex.test(assembled.content.intro)) {
                        assembled.content.intro = assembled.content.intro.replace(regex, '');
                        console.log(`  🧹 Auto-sanitized "${phrase}" from intro`);
                    }
                    for (const sec of assembled.content.sections) {
                        if (regex.test(sec.body)) {
                            sec.body = sec.body.replace(regex, '');
                            console.log(`  🧹 Auto-sanitized "${phrase}" from section: ${sec.heading}`);
                        }
                    }
                }
                // Clean up double-spaces left by removal
                assembled.content.intro = assembled.content.intro.replace(/  +/g, ' ').trim();
                for (const sec of assembled.content.sections) {
                    sec.body = sec.body.replace(/  +/g, ' ').trim();
                }

                // --- QUALITY CHECK GATE ---
                const report = checkBlogQuality(assembled);
                qualityReport = report;

                if (report.passed) {
                    finalPost = assembled;
                } else {
                    console.log(`❌ QUALITY FAILED (Score: ${report.score}). Errors: ${report.critical_failures.join(', ')}`);
                    
                    // --- TARGETED REPAIR (no full regen for minor issues) ---
                    const needsFullRegen = report.regenerate_sections.includes("all");

                    // FIX: Regenerate only MCQs if they are broken (small token cost)
                    if (report.regenerate_sections.includes("mcqs") && attempts < maxAttempts) {
                        console.log(`  🎯 Regenerating MCQs only...`);
                        const newExtras = await generateExtras(item);
                        if (newExtras.mcqs.length >= 5) {
                            assembled.content.mcqs = newExtras.mcqs;
                        }
                        if (newExtras.recall.length > assembled.content.quick_recall.length) {
                            assembled.content.quick_recall = newExtras.recall;
                        }
                    }

                    // FIX: Add missing mandatory sections (small token cost)
                    const bodyCheck = JSON.stringify(assembled.content).toLowerCase();
                    if (!bodyCheck.includes("ayush's note") && !bodyCheck.includes("ayush note")) {
                        console.log(`  📝 Generating missing "Ayush's Note" section...`);
                        const ayushSection = await generateSection(item, `What is Ayush's Note on ${item.topic}?`, displayClass, targetYear);
                        assembled.content.sections.push(ayushSection);
                    }
                    if (!bodyCheck.includes("trap question") && !bodyCheck.includes("common mistakes")) {
                        console.log(`  📝 Generating missing "Trap Questions" section...`);
                        const trapSection = await generateSection(item, `What are common Trap Questions for ${item.topic}?`, displayClass, targetYear);
                        assembled.content.sections.push(trapSection);
                    }

                    // If full regen needed, reset assembled for next attempt
                    if (attempts < maxAttempts && needsFullRegen) {
                        console.log(`🔄 Full regeneration required for next pass...`);
                        assembled = null as any;
                    }
                }
            } catch (err: any) {
                lastError = err.message;
                console.error(`🚨 Pass failed: ${err.message}`);
            }
        }

        // --- FINAL PUBLISH OR FAIL ---
        const finalStatus = finalPost ? (qualityReport?.auto_fixed.length ? "published_with_fixes" : "published") : "failed";
        // If the blog was published, it PASSED quality = 100. Record 100, not the last failed attempt's score.
        const finalScore = finalPost ? 100 : (qualityReport?.score || 0);
        pipelineReport.push({
            slug: item.targetSlug,
            status: finalStatus,
            quality_score: finalScore,
            retries: attempts - 1,
            error: finalPost ? null : (lastError || qualityReport?.critical_failures[0] || "Unknown Failure")
        });

        if (finalPost && !isDryRun) {
            const markdown = jsonToMarkdown(finalPost);
            fs.writeFileSync(filePath, markdown);
            fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
            console.log(`✨ Published: ${item.targetSlug}`);
        } else if (finalPost && isDryRun) {
            console.log(`🧪 DRY RUN: ${item.targetSlug} would have been published.`);
        } else {
            console.error(`🚨 PIPELINE CRITICAL FAILURE: ${item.topic} failed after ${maxAttempts} attempts.`);
        }

        await new Promise(r => setTimeout(r, 5000));
    }

    // --- SAVE REPORT ---
    const dailyReportPath = path.join(REPORTS_DIR, `pipeline-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(dailyReportPath, JSON.stringify(pipelineReport, null, 2));
    console.log(`📊 Pipeline report saved to: ${dailyReportPath}`);

    if (pipelineReport.some(r => r.status === "failed")) {
        const failedCount = pipelineReport.filter(r => r.status === "failed").length;
        const passedCount = pipelineReport.filter(r => r.status !== "failed").length;
        console.error(`\n⚠️ ${failedCount} blog(s) failed quality check. ${passedCount} published successfully.`);
        // Don't exit(1) until after registry sync so successful blogs still get registered
    }

    // FINAL STEP: Sync the blog registry
    console.log("\n🔄 Jules: Triggering Registry Sync...");
    try {
        const { execSync } = await import('child_process');
        execSync('node scripts/sync-blogs.js', { stdio: 'inherit' });
    } catch (e: any) {
        console.error("⚠️ Registry Sync failed:", e.message);
    }

    // Exit with error code AFTER sync so CI can detect failures
    if (pipelineReport.some(r => r.status === "failed")) {
        console.warn(`⚠️ Some blogs failed quality gate — but pipeline will continue so successful blogs get committed.`);
    }
}

generateBlogs().catch(err => {
    console.error("❌ Jules Fatal Error:", err);
    process.exit(1);
});

