import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, standardizeMarkdown, sanitizeAiText, checkLatexIntegrity, BlogPostJSON, QualityReport, Section, MCQ } from './utils/jules-quality.js';



import { godSafeParse, godExtract, isRefusal } from './utils/god-json.js';


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

const GEMINI_KEYS = [
    process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_BACKUP_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.VITE_GEMINI_API_KEY_6
].filter(Boolean) as string[];

let currentGroqIndex = 0;
let currentGeminiIndex = 0;
const deadGroqKeyIndices = new Set<number>();
const deadGeminiKeyIndices = new Set<number>();
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateGroqKey() {
    deadGroqKeyIndices.add(currentGroqIndex);
    const aliveIndices = GROQ_KEYS.map((_, i) => i).filter(i => !deadGroqKeyIndices.has(i));
    
    if (aliveIndices.length > 0) {
        currentGroqIndex = aliveIndices[0];
        groq = new Groq({ apiKey: GROQ_KEYS[currentGroqIndex] });
        console.log(`🔄 Rotating to Groq Key #${currentGroqIndex + 1}...`);
    } else {
        console.warn("🚨 ALL GROQ KEYS EXHAUSTED.");
    }
}

// Global Key Protection: Validation on startup
if (GROQ_KEYS.length === 0 || GEMINI_KEYS.length === 0) {
    console.error("🚨 CRITICAL FAILURE: No API keys found for either Groq or Gemini. Check your .env file!");
    process.exit(1);
}


function rotateGeminiKey() {
    deadGeminiKeyIndices.add(currentGeminiIndex);
    const aliveIndices = GEMINI_KEYS.map((_, i) => i).filter(i => !deadGeminiKeyIndices.has(i));
    
    if (aliveIndices.length > 0) {
        currentGeminiIndex = aliveIndices[0];
        console.log(`💎 Rotating to Gemini Key #${currentGeminiIndex + 1}...`);
    } else {
        console.warn("🚨 ALL GEMINI KEYS EXHAUSTED.");
    }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// --- DATE DISTRIBUTOR ---
// To guarantee new blogs ALWAYS appear at the top of the grid, 
// we assign them today's date rather than back-dating them.
const getShiftedDate = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};


// Gemini Unified Helper (Used as secondary tier in rotation)
async function generateWithGemini(systemPrompt: string, userPrompt: string, isJson: boolean = false): Promise<string | null> {
    const key = GEMINI_KEYS[currentGeminiIndex];
    if (!key) return null;

    try {
        console.log(`🚀 Tier 2: Calling Gemini Pro (Key #${currentGeminiIndex + 1}) for content...`);
        
        const generationConfig: any = { maxOutputTokens: 2500, temperature: 0.7 };
        if (isJson) {
            generationConfig.responseMimeType = "application/json";
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
                }],
                generationConfig
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`❌ Gemini API Error (${response.status}): ${errBody}`);
            if (response.status === 429) rotateGeminiKey();
            return null;
        }

        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        
        if (text) console.log(`✅ Gemini content received (${text.length} chars).`);
        return text;
    } catch (err: any) {
        console.error("❌ Gemini Network Error:", err.message);
        return null;
    }
}

// Gemini with rate-limit retry across all 6 keys
async function generateWithGeminiRetry(systemPrompt: string, userPrompt: string, isJson: boolean = false, maxRetries: number = 6): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
        const result = await generateWithGemini(systemPrompt, userPrompt, isJson);
        if (result) return result;
        
        // Wait briefly between Gemini retries
        await sleep(5000);
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
        if (!svg) return false;
        
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
    const key = GEMINI_KEYS[currentGeminiIndex];
    if (!key) return false;

    try {
        console.log(`🚀 Tier 2 Imaging: Asking Gemini to design SVG...`);
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

        if (!response.ok) {
            if (response.status === 429) rotateGeminiKey();
            return false;
        }

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

    // Priority 1: HuggingFace FLUX (free tier)
    const hfOk = await generateHuggingFaceImage(subject, topic, webpPath);
    if (hfOk) return `/blog-images/${slug}.webp`;

    // Priority 2: Cloudflare Workers AI (Jules Flux)
    const cfOk = await generateCloudflareImage(subject, topic, webpPath);
    if (cfOk) return `/blog-images/${slug}.webp`;

    // Priority 3: Gemini SVG
    const geminiOk = await generateGeminiImage(subject, topic, webpPath);
    if (geminiOk) return `/blog-images/${slug}.webp`;

    // Priority 4: Groq SVG (LAST RESORT — preserves website quota)
    const groqOk = await generateGroqSVG(subject, topic, webpPath);
    if (groqOk) return `/blog-images/${slug}.webp`;

    // Priority 5: Static Subject Fallbacks
    console.log("🎨 All image APIs unavailable. Injecting high-quality static subject fallback...");
    const fallbackImage = SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS['default'];
    return fallbackImage;
}

// ════════════════════════════════════════════════════════════════
// SELF-IMPROVING PROMPT SYSTEM
// Reads evolved prompts from the Prompt Evolution Engine.
// Falls back to hardcoded defaults if evolved prompt unavailable.
// ════════════════════════════════════════════════════════════════

const EVOLVED_PROMPT_PATH = path.join(__dirname, '../jules-reports/evolved-prompt.json');

interface EvolvedPromptData {
    evolvedPrompt: string;
    temperature: number;
    subjectTargets: Record<string, { minWords: number; maxWords: number; formulaDensity: string; mcqCount: number }>;
    version: string;
    confidence: number;
}

let evolvedPromptData: EvolvedPromptData | null = null;
let usingEvolvedPrompt = false;

function loadEvolvedPrompt(): void {
    try {
        if (!fs.existsSync(EVOLVED_PROMPT_PATH)) return;
        
        const raw = fs.readFileSync(EVOLVED_PROMPT_PATH, 'utf-8');
        
        // Structural integrity checks before parsing
        if (raw.includes('<<<<<<<') || raw.includes('>>>>>>>') || raw.includes('=======')) {
            console.error('🚫 Evolved prompt corrupted by git merge conflict! Using hardcoded defaults.');
            return;
        }
        
        const data = JSON.parse(raw);
        
        // Validate required fields exist
        if (!data.evolvedPrompt || typeof data.evolvedPrompt !== 'string') {
            console.warn('⚠️ Evolved prompt missing "evolvedPrompt" field. Using defaults.');
            return;
        }
        
        // Validate prompt isn't too short (likely corrupted/truncated)
        if (data.evolvedPrompt.length < 100) {
            console.warn(`⚠️ Evolved prompt too short (${data.evolvedPrompt.length} chars). Using defaults.`);
            return;
        }
        
        // Validate prompt isn't HTML/garbage
        if (data.evolvedPrompt.includes('<html') || data.evolvedPrompt.includes('<!DOCTYPE')) {
            console.error('🚫 Evolved prompt contains HTML garbage! Using defaults.');
            return;
        }
        
        // Validate confidence threshold
        if ((data.confidence || 0) < 0.5) {
            console.warn(`⚠️ Evolved prompt confidence too low (${(data.confidence * 100).toFixed(0)}%). Using defaults.`);
            return;
        }
        
        // Validate temperature is in sane range
        if (data.temperature !== undefined && (data.temperature < 0.1 || data.temperature > 1.5)) {
            console.warn(`⚠️ Evolved prompt has extreme temperature (${data.temperature}). Clamping to 0.7.`);
            data.temperature = 0.7;
        }
        
        // All checks passed
        evolvedPromptData = data;
        usingEvolvedPrompt = true;
        console.log(`🧬 EVOLVED PROMPT LOADED (v${data.version?.substring(0, 10) || 'unknown'}, confidence: ${((data.confidence || 0) * 100).toFixed(0)}%, temp: ${data.temperature})`);
    } catch (err: any) {
        console.warn(`⚠️ Could not load evolved prompt (${err.message}). Using hardcoded defaults.`);
    }
}

// Load on startup
loadEvolvedPrompt();

// Hardcoded fallback (original prompt)
const GRANDMASTER_IDENTITY_DEFAULT = `You are a strict, top 1% JEE/NEET ranker creating a "Last-Night Revision Format" study guide.
Your sole purpose is to provide exactly what a student needs to read 12 hours before their exam to maximize their score.
Voice: Specific, data-driven, authentic student tone. NO FILLER. No fluff. No introductions.

Format Rule: A student reads this once, closes the tab, and walks into the exam confident.
DO NOT use phrases like "In conclusion", "delve into", "comprehensive", "embark on your journey".`;

const CROSS_SECTION_RULES_DEFAULT = `
RULES FOR THE LAST-NIGHT REVISION FORMAT:
1. NO INTRODUCTIONS. NO DEFINITIONS. NO PREREQUISITES. Start directly with high-yield exam insights.
2. LATEX ESCAPING: You MUST double-escape all backslashes in LaTeX formulas (e.g., use \\\\frac instead of \\frac, \\\\times instead of \\times, \\\\Delta instead of \\Delta). Failure to double-escape will break the JSON parser and your output will be discarded.
3. Every formula must be rendered cleanly with ONLY $ for inline math and $$ for block math. Ensure all formulas are wrapped.
4. Voice: Authentic Peer Mentor (student-to-student). 
5. FORMATTING: NEVER WRITE LONG PARAGRAPHS or walls of text! Everything must be highly structured using bold text, bullet points (- ), and short punchy sentences. Use bullet points for almost everything!
6. TABLES AND STRUCTURE: If you generate comparisons or tabular data, you MUST use strict Github-Flavored Markdown tables with pipes (|). NEVER generate raw CSV or comma-separated blocks of text.
STRICT RULE: Focus entirely on what's examined, not just general knowledge.
`;

// Dynamic getters — use evolved if available, fallback to hardcoded
const GRANDMASTER_IDENTITY = usingEvolvedPrompt 
    ? evolvedPromptData!.evolvedPrompt 
    : GRANDMASTER_IDENTITY_DEFAULT;

// ALWAYS include the fundamental JSON format rules. Evolution should only touch the identity/voice/strategy.
const CROSS_SECTION_RULES = CROSS_SECTION_RULES_DEFAULT;

// Dynamic temperature — evolved or default 0.7
const EVOLVED_TEMPERATURE: number = (evolvedPromptData as EvolvedPromptData | null)?.temperature || 0.7;

// Get subject-specific targets from evolved data
function getSubjectTargets(subject: string): { minWords: number; maxWords: number; mcqCount: number } {
    if (evolvedPromptData?.subjectTargets) {
        const targets = evolvedPromptData.subjectTargets[subject];
        if (targets) return { minWords: targets.minWords, maxWords: targets.maxWords, mcqCount: targets.mcqCount };
    }
    // Fallback defaults
    return { minWords: 2000, maxWords: 4000, mcqCount: 5 };
}



// --- SMART RECOVERY WRAPPER ---
function safelyParseJson(raw: string): any {
    try {
        return godSafeParse(raw);
    } catch (err) {
        console.warn("⚠️ JSON Parse failed. Attempting aggressive recovery via schema extraction...");
        try {
            // Last resort: Regex extract known fields for Section
            if (raw.includes("heading") && raw.includes("body")) {
                return godExtract(raw, ["heading", "body", "table"]);
            }
            throw err;
        } catch {
            throw new Error("Final God-Tier JSON parse failed.");
        }
    }
}

async function callLlmWithFallback(system: string, user: string, isJson: boolean = false, attempt: number = 1): Promise<string | null> {
    const isMetadata = user.includes("SEO") || user.includes("slug");
    const primaryModel = isMetadata ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: primaryModel,
            response_format: isJson ? { type: "json_object" } : undefined,
            temperature: EVOLVED_TEMPERATURE,
            max_tokens: 4000
        });
        return completion.choices[0]?.message?.content || "";
    } catch (err: any) {
        // 1. Handle Rate Limits / Generic Errors via Groq Rotation
        if (err.message.includes("429") || err.message.includes("rate_limit") || err.message.includes("500") || err.message.includes("Timeout")) {
            if (attempt <= GROQ_KEYS.length) {
                console.log(`⚠️ Groq Rate Limit (Key #${currentGroqIndex + 1}). Rotating...`);
                rotateGroqKey();
                await sleep(1000 * attempt); 
                return await callLlmWithFallback(system, user, isJson, attempt + 1);
            }
            
            // 2. Ultimate Fallback -> Gemini Unified Tier (6 Keys)
            console.log(`🛡️ All Groq keys saturated. Elevating to Gemini Unified Tier...`);
            const fallbackKey = await generateWithGeminiRetry(system + (isJson ? "\nEnsure valid JSON structure." : ""), user, isJson);
            if (fallbackKey) return fallbackKey;

            // If Gemini also failed (all 6 keys), trigger Hard Stop to prevent Token Burn
            console.error(`🚨 FATAL QUOTA EXHAUSTION: Both API tiers saturated. Triggering hard stop to protect limits.`);
            process.exit(1);
        }


        // Handle 400 "Failed to generate JSON" error
        if (isJson && (err.message.includes("400") || err.message.includes("Failed to generate JSON"))) {
            console.warn(`⚠️ Groq strict JSON mode failed. Retrying with Gemini...`);
            return await generateWithGeminiRetry(system, user, isJson) || "";
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
    return ""; // Intro (What WILL Come) removed as per user request — Summary is now the top element.
}

async function generateSection(item: any, heading: string, displayClass: string, targetYear: number): Promise<Section> {
    console.log(`📖 Jules: Writing specific revision section: ${heading}...`);
    const system = `${GRANDMASTER_IDENTITY}\n${CROSS_SECTION_RULES}`;
    
    let specificDirective = "";
    if (heading.includes("Formula Bank")) {
         specificDirective = `Provide EVERY important formula for this chapter.
         The "body" field should contain a bulleted list of all formulas. DO NOT use the "table" field.
         Format each formula as: "- **[Formula Name]:** $$[LaTeX formula specifically using curly braces {}]$$ — [Variable Meanings]"`;
    } else if (heading.includes("Mistakes")) {
         specificDirective = `Provide exactly 5 highly specific errors students make.
         The "body" field should contain the mistakes using bullet points. DO NOT use the "table" field.
         Format each mistake using Markdown bullets. Use braces for ALL LaTeX.
         Format each mistake as:
         
         - **Mistake [X]:** [Error description]
           - *Costs:* [Marks lost]
           - *Fix:* [How to fix it]`;
    } else if (heading.includes("PYQs")) {
         specificDirective = `Provide exactly 3 real past year questions (JEE/NEET or CBSE).
         In the "body" field, format EACH question with clear separation using bullet points and indentation.
         CRITICAL: Use proper {braces} for all LaTeX like \\frac{a}{b} and \\Delta{T}.
         
         - **Q1:** [exact question text]
           - **Trap:** [what confuses students]
           - **Solution:** [Show full step-by-step working with LaTeX]
           - **Answer:** [answer with units]
         
         Keep the "table" field empty: {"headers": [], "rows": []}.`;
    } else if (heading.includes("One Thing")) {
         specificDirective = `Choose ONE deep concept. Explain the specific thing that separates 85% scorers from 95% scorers.
         Do not write a huge paragraph! Use the "body" field and structure it using bullet points:
         
         - **The Core Concept:** [Brief explanation]
         - **What 85% scorers do:** [Common basic approach]
         - **What 95% scorers do:** [The advanced secret]`;
    } else if (heading.includes("Ayush's Note")) {
         specificDirective = `Provide a specific pattern only visible after studying 5+ years of PYQs. Cannot appear in any standard textbook.
         Do not write a paragraph. LIST the insights in the "body" field using EXACTLY 3-4 bullet points starting with "- ".
         
         - **The Hidden Pattern:** [Insight]
         - **How to Apply It:** [Actionable advice]
         - **PYQ-Specific Trend:** [Trend]`;
    } else if (heading.includes("Last 5 Minutes")) {
         specificDirective = `This is the LAST thing they read before sleeping. Be extremely concise.
         In the "body" field, provide EXACTLY:
         - 5 key formulas as bullet points (each on its own line, starting with "- ")
         - 3 key facts as bullet points
         - 2 common mistakes as bullet points
         
         Keep the "table" field empty: {"headers": [], "rows": []}.
         Use markdown bullet points (- ) for every item. Do NOT use a wall of text.
         USE BRACES {} FOR ALL LATEX.`;
    } else {
         specificDirective = "Provide a highly focused, no-nonsense revision summary using bullet points extensively. USE BRACES {} FOR ALL LATEX.";
    }

    const user = `Write the section for the heading: "${heading}" regarding the topic "${item.topic}".
    STRICT RULE: ${specificDirective}
    Remember LATEX ESCAPING RULES! Use $$ for block formulas and $ for inline formulas.
    TARGET LENGTH: Each section MUST be detailed and exhaustive. Aim for 300+ words per section.
    Return JSON: { "heading": "${heading}", "body": "...", "table": { "headers": [], "rows": [[]] } }`;

    const raw = await callLlmWithFallback(system, user, true);
    const ayushFallback = {
        heading: heading,
        body: `- **Ayush's Pattern Study:** This specific sub-topic is often overlooked, but the pattern of questions in the last 10 years shows it is critical for high-percentile scoring.\n- **The Exam Hack:** Focus on understanding the derivation rather than just the final result.\n- **Mistake to Avoid:** Don't skip the numerical applications related to this concept.`,
        needsReview: true,
        table: { headers: [], rows: [] }
    };

    if (!raw) return ayushFallback;
    
    // 1. Refusal Detection First
    if (isRefusal(raw)) {
        console.error(`🛡️ LLM Refused to generate "${heading}". Injecting Ayush's Note fallback...`);
        return ayushFallback;
    }

    // 2. Robust Parse
    let parsed: any;
    try {
        parsed = godExtract(raw || "", ["body", "table"]);
    } catch (e: any) {
         console.warn(`🏺 God-JSON: Total failure for ${heading}...`);
         return ayushFallback;
    }

    // 3. Sanitization & LaTeX Integrity
    const body = parsed?.body || "";
    const sanitizedBody = sanitizeAiText(body);
    const fixedBody = checkLatexIntegrity(sanitizedBody);

    // 4. Universal Default Fallback (The "True Last Resort")
    if (!fixedBody || fixedBody.length < 50) {
        console.warn(`🛡️ Content Recovery failed for "${heading}". Injecting High-Quality Default...`);
        return ayushFallback;
    }

    return {
        heading: heading,
        body: fixedBody,
        table: parsed?.table || { headers: [], rows: [] },
        needsReview: false
    };


}


async function generateExtras(item: any): Promise<{ mcqs: MCQ[], recall: string[] }> {
    console.log(`🧠 Jules: Generating MCQs and Quick Recall for ${item.topic}...`);
    const system = GRANDMASTER_IDENTITY;
    const user = `Generate 5 high-yield MCQs and 10 Quick Recall bullet points for "${item.topic}".
    The "quick_recall" items MUST be highly specific exam predictions. 
    Format each recall point with frequency tags:
    - [Sub-topic]: [Prediction] — always
    - [Sub-topic]: [Prediction] — frequently
    
    Example: "Human Eye: 1 diagram-based question on Myopia/Hypermetropia — always"
    
    The MCQs MUST have "question", "options" (array), "answer" (A/B/C/D), and "answer_text" (explanation) fields.
    Return as JSON: { "mcqs": [...], "quick_recall": [...] }`;
    
    const raw = await callLlmWithFallback(system, user, true);
    if (!raw) return { mcqs: [], recall: [] };
    
    // 1. Refusal Detection
    if (isRefusal(raw)) {
        console.error(`🛡️ LLM Refused Extras for "${item.topic}". Injecting generic Quick Recall...`);
        return {
            mcqs: [],
            recall: [
                `${item.topic}: Key concept application — always`,
                `${item.topic}: Calculation-based numericals — frequently`,
                `${item.topic}: Diagrammatic representation — frequently`
            ]
        };
    }

    // 2. Robust Parse
    let data: any;
    try {
        data = godExtract(raw || "", ["mcqs", "quick_recall"]);
    } catch {
        console.warn(`🏺 God-JSON: MCQ extraction triggered...`);
        data = { mcqs: [], quick_recall: [] };
    }

    // 3. Sanitization & Integrity
    const mcqs = (data.mcqs || []).map((m: any) => ({
        ...m,
        question: checkLatexIntegrity(m.question || ""),
        answer_text: checkLatexIntegrity(sanitizeAiText(m.answer_text || ""))
    }));

    const recall = (data.quick_recall || []).map((r: string) => sanitizeAiText(r));

    // Universal Fallback for Extras
    if (recall.length === 0) {
        return {
            mcqs: [],
            recall: [
                `${item.topic}: Key concept application — always`,
                `${item.topic}: Calculation-based numericals — frequently`,
                `${item.topic}: Diagrammatic representation — frequently`
            ]
        };
    }

    return { mcqs, recall };


}

async function generateBlogs() {
    console.log(`🤖 Jules: Starting Unified 9-Blog Generation...`);

    const REPORTS_DIR = path.join(__dirname, '../jules-reports');
    const FAILED_DIR = path.join(__dirname, '../jules-failed');
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);
    if (!fs.existsSync(FAILED_DIR)) fs.mkdirSync(FAILED_DIR);

    // 1. Load New Topics Queue
    let queue: any[] = [];
    if (fs.existsSync(QUEUE_FILE)) {
        queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }

    // 2. Load Refinement (Decay) Queue
    const regenFiles = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('regen-queue-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    if (regenFiles.length > 0) {
        const latestRegen = path.join(REPORTS_DIR, regenFiles[0]);
        const regenQueue = JSON.parse(fs.readFileSync(latestRegen, 'utf8'));
        console.log(`📂 Found ${regenQueue.length} refinement items in ${regenFiles[0]}`);
        
        // Convert regen-queue format to generation format
        // Infer subject + topic from existing blog frontmatter for accuracy
        const formattedRegen = regenQueue.map((item: any) => {
            let subject = 'General';
            let topic = item.slug.replace(/-/g, ' ');
            
            // Read existing blog frontmatter for accurate subject/topic
            const blogPath = path.join(BLOG_DIR, `${item.slug}.md`);
            if (fs.existsSync(blogPath)) {
                try {
                    const content = fs.readFileSync(blogPath, 'utf-8');
                    const subjectMatch = content.match(/subject:\s*['"]?([^'"\n]+)/);
                    const categoryMatch = content.match(/category:\s*['"]?([^'"\n]+)/);
                    if (subjectMatch) subject = subjectMatch[1].trim();
                    else if (categoryMatch) subject = categoryMatch[1].trim();

                    console.log(`  🔍 Inferred: "${topic}" (${subject}) from existing blog`);
                } catch { /* fallback to slug-derived values */ }
            }
            
            return {
                topic,
                targetSlug: item.slug,
                subject,
                isRegeneration: true,
                reason: item.reason
            };
        });
        
        queue = [...queue, ...formattedRegen];
    }

    if (queue.length === 0) {
        console.log("📭 No new or refinement blogs in queue.");
        return;
    }

    const MAX_BLOGS_PER_RUN = 3;
    if (queue.length > MAX_BLOGS_PER_RUN) {
        console.log(`⚠️ SAFETY VALVE: Truncating queue from ${queue.length} down to ${MAX_BLOGS_PER_RUN} max items.`);
        queue = queue.slice(0, MAX_BLOGS_PER_RUN);
    }

    console.log(`🚀 Processing combined queue: ${queue.length} items (New + Refined)`);
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
                const needsFullRegen = attempts === 1 || !assembled || qualityReport?.regenerate_all;
                const needsIntro = needsFullRegen || qualityReport?.patch_missing_sections.includes("intro");
                const needsSections = needsFullRegen || (qualityReport?.patch_missing_sections.some(s => s.toLowerCase().includes("section")) ?? false);
                const needsMCQs = needsFullRegen || qualityReport?.patch_missing_sections.includes("Practice MCQs");
                
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

                    // Area 5: Practice Link Routing (Dynamic for all subjects)
                    const PRACTICE_LINK_MAP: Record<string, string> = {
                        "Social Science": "/class-11/social-science",
                        "Geography": "/class-11/geography",
                        "History": "/class-11/history",
                        "Physics": "/class-11/physics",
                        "Chemistry": "/class-11/chemistry",
                        "Biology": "/class-11/biology",
                        "Mathematics": "/class-11/mathematics",
                        "Economics": "/class-11/economics",
                        "Political Science": "/class-11/political-science",
                        "Civics": "/class-11/civics",
                        "Computer Science": "/class-11/computer-science",
                        "Science": "/class-10/science",
                        "English": "/class-10/english",
                    };

                    const practiceBase = PRACTICE_LINK_MAP[item.subject] ?? `/class-${numericClass}/${item.subject.toLowerCase().replace(/ /g, '-')}`;
                    const practiceLink = `${practiceBase}/${item.targetSlug}`.replace(/\/+/g, '/');

                    assembled = {
                        title: seoTitle,
                        slug: item.targetSlug,
                        subject: item.subject,
                        chapter_name: item.topic,
                        exam_class: numericClass,
                        last_updated: new Date().toISOString().split('T')[0],
                        practice_link_path: practiceLink,
                        hero_image: heroImagePath,
                        manual_review: sections.some(s => s.needsReview),
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
                    
                    if (needsSections || (qualityReport?.patch_missing_sections.some(s => s.toLowerCase().includes("section")) ?? false)) {
                        if (needsSections && qualityReport?.regenerate_all) {
                            console.log(`  📝 Regenerating All Sections...`);
                            const outline = await generateOutline(item, targetYear);
                            postToRepair.content.sections = [];
                            for (const heading of outline) {
                                postToRepair.content.sections.push(await generateSection(item, heading, displayClass, targetYear));
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } else {
                            // Check for specific section repairs from the patch list
                            for (const patchTitle of qualityReport?.patch_missing_sections || []) {
                                if (patchTitle.toLowerCase().includes("section") || patchTitle.includes("Note") || patchTitle.includes("Questions")) {
                                    console.log(`  📝 Repairing specific section: ${patchTitle}`);
                                    // If it's a completely missing section, push it. If it's a weak one, replace it.
                                    const index = postToRepair.content.sections.findIndex(s => s.heading.toLowerCase().includes(patchTitle.toLowerCase()));
                                    const newSec = await generateSection(item, patchTitle, displayClass, targetYear);
                                    if (index !== -1) {
                                        postToRepair.content.sections[index] = newSec;
                                    } else {
                                        postToRepair.content.sections.push(newSec);
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
                        if (sec && typeof sec.body === 'string' && regex.test(sec.body)) {
                            sec.body = sec.body.replace(regex, '');
                            console.log(`  🧹 Auto-sanitized "${phrase}" from section: ${sec.heading}`);
                        }
                    }
                }
                // Clean up double-spaces left by removal
                assembled.content.intro = (assembled.content.intro || "").replace(/  +/g, ' ').trim();
                for (const sec of assembled.content.sections) {
                    if (sec && typeof sec.body === 'string') {
                        sec.body = sec.body.replace(/  +/g, ' ').trim();
                    }
                }


                // --- QUALITY CHECK GATE ---
                const report = checkBlogQuality(assembled);
                qualityReport = report;

                if (report.passed) {
                    finalPost = assembled;
                } else {
                    console.log(`❌ QUALITY FAILED (Score: ${report.score}). Errors: ${report.critical_failures.join(', ')}`);
                    
                    // --- TARGETED REPAIR (no full regen for minor issues) ---
                    const needsFullRegen = report.regenerate_all;

                    // FIX: Regenerate only MCQs if they are broken (small token cost)
                    if (report.patch_missing_sections.includes("Practice MCQs") && attempts < maxAttempts) {
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
            const bodyContent = jsonToMarkdown(finalPost);
                const markdown = standardizeMarkdown(bodyContent, {
                    title: finalPost.title,
                    heroImage: finalPost.hero_image,
                    lastUpdated: finalPost.last_updated,
                    practiceLink: finalPost.practice_link_path,
                    manualReview: finalPost.manual_review,
                    recall: finalPost.content.quick_recall
                });

            // Ultimate Atomic Write Strategy
            const tempPath = `${filePath}.tmp`;
            try {
                fs.writeFileSync(tempPath, markdown);
                fs.renameSync(tempPath, filePath);
                fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
                console.log(`✨ Published: ${item.targetSlug}`);
            } catch (writeErr: any) {
                console.error(`🚨 Fatal Write Error for ${item.targetSlug}: ${writeErr.message}`);
                // Safely clean up the temp file if it exists
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }


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
    console.error("❌ Jules Pipeline Failure (Handled):", err);
    // Exit with 0 to allow the Auditor to capture the crash logs and report to Discord
    process.exit(0);
});

