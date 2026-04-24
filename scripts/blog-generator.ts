import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, standardizeMarkdown, sanitizeAiText, checkLatexIntegrity, BlogPostJSON, QualityReport, Section, MCQ } from './utils/jules-quality.js';



import { godSafeParse, godExtract, isRefusal } from './utils/god-json.js';
import { ExternalApiService } from '../src/services/externalApiService.js';
import { AcademicSearchService } from '../src/services/academicSearchService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Orchestration using shared NodeRouter
import { nodeRouter } from './utils/nodeRouter.js';
import { TaskTier } from '../src/lib/routingConfig.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const getShiftedDate = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const QUEUE_FILE = path.join(__dirname, '../queue.json');
const GROWTH_QUEUE_FILE = path.join(__dirname, '../jules-reports/growth-queue.json');
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
    try {
        console.log(`🚀 Tier 2 Imaging: Asking Gemini to design SVG...`);
        const prompt = `You are an SVG generator. Output ONLY valid SVG code. No explanations, no markdown.

Create a 1200x630 SVG image for: "${topic}" (${subject}).
Style: Dark background (#0a0a1a), neon cyan/purple accents, geometric shapes, scientific aesthetic.
Start your response with <svg and end with </svg>. Nothing else.`;

        const svg = await nodeRouter.route([{ role: "user", content: prompt }], 'T3');
        if (!svg) return false;
        
        // Aggressive cleanup for valid SVG
        let cleanSvg = svg.replace(/```(?:svg|xml|html)?\s*/gi, "").replace(/```/gi, "").trim();
        cleanSvg = cleanSvg.replace(/^<\?xml[^>]*\?>\s*/i, ""); // strip XML declaration
        if (cleanSvg.includes("<svg") && !cleanSvg.startsWith("<svg")) {
            cleanSvg = cleanSvg.substring(cleanSvg.indexOf("<svg"));
        }
        const closingIdx = cleanSvg.lastIndexOf("</svg>");
        if (closingIdx > 0) {
            cleanSvg = cleanSvg.substring(0, closingIdx + 6);
        }

        if (!cleanSvg.startsWith("<svg")) throw new Error("Invalid SVG from Gemini");

        // Ensure width/height attributes exist for sharp
        if (!cleanSvg.includes('width=')) {
            cleanSvg = cleanSvg.replace('<svg', '<svg width="1200" height="630"');
        }
        const safeSvg = cleanSvg.replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');
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
        
        // Validate prompt isn't too short (likely corrupted/truncated or over-condensed)
        if (data.evolvedPrompt.length < 500) {
            console.warn(`⚠️ Evolved prompt too short (${data.evolvedPrompt.length} chars, min 500). Using defaults.`);
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
Target Length: Aim for a comprehensive 1500 to 2000 words. Do not give thin content.
Voice: Specific, data-driven, authentic student tone. NO FILLER. No fluff. No introductions.

Format Rule: A student reads this once, closes the tab, and walks into the exam confident.
DO NOT use phrases like "In conclusion", "delve into", "comprehensive", "embark on your journey".`;

const CROSS_SECTION_RULES_DEFAULT = `
RULES FOR THE LAST-NIGHT REVISION FORMAT:
1. NO INTRODUCTIONS. NO DEFINITIONS. NO PREREQUISITES. Start directly with high-yield exam insights.
2. LATEX RULE (CRITICAL FOR RENDERING): 
   - Every formula MUST be rendered cleanly. You MUST wrap ALL inline math in $...$ and block math in $$...$$. 
   - NEVER output raw commands like \\frac, \\sum, \\alpha, \\beta, or \\rightarrow without $ delimiters. Every single math symbol must be in $.
   - NEVER use \\( ... \\) or \\[ ... \\]. ONLY use $...$ and $$...$$.
   - NEVER escape dollar signs for math (do not write \\$).
   - NEVER put markdown bolding/italics inside math blocks (do not do $**x**$ or $$**y**$$). Use \\mathbf{} instead.
3. BULLET POINTS OVER PARAGRAPHS: NEVER WRITE WALLS OF TEXT. Use bullet points (- ) for 80% of your content. If you must use paragraphs (like in PYQ explanations), keep them under 3 sentences.
4. NO HTML TAGS: Never output malformed HTML like <div [class]="...">. Use pure markdown.
5. NO JSON SQUASHING: Do not output {"heading": "...", "body": "..."} inside your markdown output. Output raw, clean Github-Flavored Markdown.
6. TABLES AND STRUCTURE: If you generate comparisons or tabular data, you MUST use strict Github-Flavored Markdown tables with pipes (|).
7. STRICT RULE: Focus entirely on what's examined, not just general knowledge.
`;

// Dynamic temperature — evolved or default 0.7
const EVOLVED_TEMPERATURE: number = (evolvedPromptData as EvolvedPromptData | null)?.temperature || 0.7;

/**
 * NEW: Generates a grade-specific academic identity to prevent scope creep (Class 10) 
 * while allowing maximum depth for Entrance Prep (Class 11-12).
 */
function getAcademicIdentity(numericClass: number, subject: string): string {
    const baseStyle = usingEvolvedPrompt ? evolvedPromptData!.evolvedPrompt : GRANDMASTER_IDENTITY_DEFAULT;
    
    let boundaryRule = "";
    if (numericClass <= 10) {
        boundaryRule = `
STRICT ACADEMIC BOUNDARY (CLASS ${numericClass}): 
- You are a CBSE Board Exam Specialist. 
- You MUST stay 100% within the NCERT/CBSE School Syllabus. 
- DO NOT include JEE Advanced, NEET, or College-level theorems (like Cardano's, Descartes' Rule, or complex Calculus). 
- If a student reads this, they should feel it is perfectly aligned with their school textbook.`;
    } else {
        boundaryRule = `
STRICT ACADEMIC DEPTH (CLASS ${numericClass}): 
- You are a JEE Advanced & NEET Grandmaster. 
- You ARE ALLOWED and encouraged to use any advanced shortcut, theorem, or high-level concept that helps with JEE Advanced or NEET exams. 
- Provide maximum mathematical/scientific depth while maintaining board-level clarity.`;
    }

    return `${baseStyle}\n${boundaryRule}\n\n${CROSS_SECTION_RULES_DEFAULT}`;
}

// Get subject-specific targets from evolved data
function getSubjectTargets(subject: string): { minWords: number; maxWords: number; mcqCount: number } {
    if (evolvedPromptData?.subjectTargets) {
        const targets = evolvedPromptData.subjectTargets[subject];
        if (targets) return { minWords: targets.minWords, maxWords: targets.maxWords, mcqCount: targets.mcqCount };
    }
    // Fallback defaults
    return { minWords: 2000, maxWords: 4000, mcqCount: 5 };
}

/**
 * NEW: Research Phase
 * Uses Exa AI and Jina to fetch real-world CBSE/NCERT data before generation.
 */
async function researchTopic(item: any, targetYear: number): Promise<string> {
    console.log(`🔍 Jules: Starting Neural Research for "${item.topic}"...`);
    
    // Safety check for class
    const displayClass = (item.class || '10').replace(/\D/g, '');
    const query = `CBSE Class ${displayClass} ${item.subject} ${item.topic} official syllabus and important questions ${targetYear}`;
    const searchResults = await ExternalApiService.searchWeb(query, 2);
    
    if (!searchResults || searchResults.length === 0) {
        console.warn("⚠️ Research Phase: No search results found. Proceeding with AI internal knowledge.");
        return "";
    }

    let contextBuffer = "--- RESEARCH CONTEXT (ACTUAL EXAM DATA 2026) ---\n";
    
    for (const result of searchResults) {
        console.log(`   📄 Reading: ${result.title}...`);
        // Try to get highlighting first (fast)
        if (result.highlights && result.highlights.length > 0) {
            contextBuffer += `[Source: ${result.title}]\n${result.highlights.join('\n')}\n\n`;
        } else {
            // Fallback to Jina for full page reading (slower)
            const content = await ExternalApiService.getMarkdownFromUrl(result.url);
            if (content) {
                contextBuffer += `[Source: ${result.title}]\n${content.substring(0, 1500)}...\n\n`;
            }
        }
    }

    // 2. Academic Grounding (arXiv)
    if (['Physics', 'Mathematics', 'Maths', 'Chemistry', 'Science'].includes(item.subject)) {
        console.log(`   📚 Checking arXiv for scientific grounding...`);
        const arxiv = await AcademicSearchService.searchArXiv(item.topic, 2);
        if (arxiv && arxiv.length > 0) {
            contextBuffer += `\n[Scientific Grounding - arXiv]:\n`;
            arxiv.forEach(paper => {
                contextBuffer += `- Title: ${paper.title}\n  Summary: ${paper.summary.substring(0, 300)}...\n`;
            });
        }
    }

    // 2b. Semantic Scholar Grounding (High Impact Papers)
    if (['Physics', 'Chemistry', 'Biology', 'Science'].includes(item.subject)) {
        console.log(`   🎓 Checking Semantic Scholar for high-impact papers...`);
        const papers = await AcademicSearchService.searchSemanticScholar(item.topic, 1);
        if (papers && papers.length > 0) {
            contextBuffer += `\n[High Impact Paper - Semantic Scholar]:\n`;
            papers.forEach(p => {
                contextBuffer += `- Title: ${p.title} (${p.year})\n  Summary: ${p.abstract.substring(0, 300)}...\n`;
            });
        }
    }

    // 3. Optional: Add Wolfram context for Math/Science
    if (['Physics', 'Chemistry', 'Mathematics', 'Science'].includes(item.subject)) {
        console.log(`   🔢 Checking Wolfram Alpha for precision data...`);
        const wolfram = await ExternalApiService.getWolframResults(item.topic);
        if (wolfram && wolfram.pods) {
            const primary = wolfram.pods.find((p: any) => p.id === 'Definition' || p.id === 'Result');
            if (primary) {
                contextBuffer += `[Wolfram Alpha Precision Data]: ${primary.subpods[0].plaintext}\n\n`;
            }
        }
    }

    // 4. Textbook Grounding (Open Library)
    console.log(`   📖 Referencing standard literature...`);
    const books = await AcademicSearchService.searchBooks(`${item.subject} ${item.topic}`, 2);
    if (books && books.length > 0) {
        contextBuffer += `\n[Reference Literature]:\n`;
        books.forEach(book => {
            contextBuffer += `- ${book.title} (by ${book.author}, ${book.year})\n`;
        });
    }

    // 4b. NASA Imagery (Visual Grounding for Space/Atmosphere)
    if (['Physics', 'Science', 'Geography'].includes(item.subject) && (item.topic.includes('Space') || item.topic.includes('Sun') || item.topic.includes('Atmosphere') || item.topic.includes('Light'))) {
        console.log(`   🚀 Checking NASA for real scientific imagery...`);
        const nasa = await ExternalApiService.searchNasaImages(item.topic, 1);
        if (nasa && nasa.length > 0) {
            contextBuffer += `\n[NASA Visual Evidence]:\n`;
            nasa.forEach((img: any) => {
                contextBuffer += `- Title: ${img.title}\n  Description: ${img.description}\n  URL: ${img.imageUrl}\n`;
            });
        }
    }

    // 5. General Context (Wikipedia) - Optimized
    const wiki = await AcademicSearchService.getWikiSummary(item.topic);
    if (wiki) {
        contextBuffer += `\n[Wikipedia Overview]: ${wiki.extract}\n`;
    }

    // --- TOKEN GUARD: Strict Character Cap ---
    // Ensuring we don't spam the LLM with too much context. 
    // 6000 chars is roughly 1500 tokens, which is a healthy balance.
    if (contextBuffer.length > 6000) {
        console.log(`   ✂️ Token Guard: Truncating research context to 6000 chars.`);
        contextBuffer = contextBuffer.substring(0, 6000) + "... [Truncated for Token Efficiency]";
    }

    console.log(`✅ Research Phase complete (${contextBuffer.length} chars gathered).`);
    return contextBuffer;
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

export async function callLlmWithFallback(system: string, user: string, isJson: boolean = false): Promise<string | null> {
    const isMetadata = user.includes("SEO") || user.includes("slug") || user.includes("recall");
    const isHardScience = user.includes("Physics") || user.includes("Chemistry") || user.includes("Math") || user.includes("Formula");
    
    // Tiered Target Selection
    let tier: TaskTier = isMetadata ? 'T5' : (isHardScience ? 'T2' : 'T3');

    try {
        return await nodeRouter.route([{ role: "system", content: system }, { role: "user", content: user }], tier, {
             jsonMode: isJson,
             temperature: EVOLVED_TEMPERATURE
        });
    } catch (err: any) {
        console.error(`🚨 Jules: Generation Tier ${tier} FAILED even after full rotation/waterfall.`);
        return null;
    }
}

async function generateOutline(item: any, targetYear: number, researchContext: string): Promise<string[]> {
    console.log(`📑 Jules: Using fixed Last-Night Revision Format for ${item.topic}...`);
    // Research context can be used here to dynamically adjust the outline if needed,
    // but for now we stick to the proven high-conversion layout.
    return [
        "⚡ Formula Bank",
        "🪤 The 5 Mistakes That Cost Marks",
        "✏️ 3 Solved PYQs",
        "🧠 The One Thing Most Students Get Wrong",
        "👁️ Ayush's Note",
        "🔁 Last 5 Minutes Box"
    ];
}

async function generateIntro(item: any, targetYear: number, displayClass: string, researchContext: string): Promise<string> {
    return ""; // Intro removed as per layout rules
}

async function generateSection(item: any, heading: string, displayClass: string, targetYear: number, researchContext: string): Promise<Section> {
    console.log(`📖 Jules: Writing section: ${heading}...`);
    const numericClass = Number(item.class.replace(/\D/g, ''));
    const system = getAcademicIdentity(numericClass, item.subject);
    const ctxBlock = researchContext ? `\n\n---\n📚 VERIFIED EXAM DATA (USE AS PRIMARY SOURCE):\n${researchContext}\n---\n` : "";
    
    // ── Per-heading prompt blueprints ────────────────────────────────────
    const LATEX_RULE = `LaTeX rules (CRITICAL — breaking these breaks the website):
- Block formulas: $$\\frac{a}{b}$$   (double dollar, newline before and after)
- Inline formulas: $v = u + at$      (single dollar)
- ALWAYS use curly braces: \\frac{numerator}{denominator}, \\sqrt{x}, \\text{units}
- NEVER output raw commands outside delimiters: write $\\Delta T$ not \\Delta T
- NEVER output $$  $$ (empty blocks) — they break the renderer
- NEVER use \\( \\) or \\[ \\]. Use $ and $$.
- NEVER mix markdown with math: do not write $**E=mc^2**$. Use $\\mathbf{E=mc^2}$.
- NEVER escape dollar signs for formulas (no \\$).`;

    let specificDirective = "";
    if (heading.includes("Formula Bank")) {
        specificDirective = `You are producing the FORMULA BANK for ${item.topic} (${displayClass} ${item.subject}, ${targetYear} exam).
This is the single most important section. A student will photograph this and use it in the exam hall.

DELIVER:
- Every formula the chapter requires — no exceptions
- Group by sub-topic with a bold sub-heading (e.g. **Kinematics Formulas**)
- Each formula on its own line:
  - **Name of formula:** $$\\LaTeX$$ — variable meanings in plain English
- After each formula group, add a 1-line "Examiner's Trap" note
- End with a quick "Which formula when?" decision table in Markdown table format

${LATEX_RULE}
MINIMUM: 20 distinct formulas. AIM FOR 30+.`;

    } else if (heading.includes("Mistakes")) {
        specificDirective = `You are producing the "5 MISTAKES THAT COST MARKS" section for ${item.topic}.
Think like an examiner who has marked 10,000 scripts.

FOR EACH MISTAKE use EXACTLY this structure:
- **Mistake 1 — [Short catchy name]:**
  - 🔴 **What students write:** [exact wrong step / formula]
  - ✅ **What examiners expect:** [correct approach]
  - 💸 **Marks lost:** [1 / 2 / 3 marks]
  - 🔧 **The fix (30-second trick):** [memorable rule]

Provide EXACTLY 5 mistakes. Use real LaTeX where relevant.
${LATEX_RULE}`;

    } else if (heading.includes("PYQs")) {
        specificDirective = `You are producing "3 SOLVED PYQs" for ${item.topic} (${displayClass}, year range 2018–${targetYear}).
Use REAL questions from JEE/NEET/CBSE Boards. If unsure, create a question in the exact style of those papers.

FOR EACH QUESTION:
- **Q[N] ([Year] [Board]):** [Full question text with LaTeX]
  - 🪤 **Trap:** [what 70% of students do wrong — 1 sentence]
  - 🧮 **Solution (Step-by-step):**
    Step 1: [action] → $[formula/calculation]$
    Step 2: …
    **Final Answer:** $$[answer with units]$$
  - ⚡ **Speed trick:** [how to solve it in under 60 seconds]

Separate the 3 questions with a horizontal rule (---)
${LATEX_RULE}`;

    } else if (heading.includes("One Thing")) {
        specificDirective = `You are producing "THE ONE THING MOST STUDENTS GET WRONG" for ${item.topic}.
This must feel like a secret whispered by a 99-percentiler who's studied 8,000 past questions.

STRUCTURE:
- **The misconception (what 85% believe):** [common wrong mental model]
- **The reality (what 99% know):** [correct deep understanding]
- **The diagnostic question:** [A single MCQ-style question that reveals if a student has the misconception]
  - If you answered [wrong option]: you have the misconception → fix: [one sentence fix]
  - If you answered [right option]: you are in the top 5% → now extend this: [advanced insight]
- **How to never forget this:** [a mnemonic or visual analogy]

${LATEX_RULE}
Target: 400+ words. This section must feel premium and exclusive.`;

    } else if (heading.includes("Ayush")) {
        specificDirective = `You are producing "AYUSH'S NOTE" — ultra-rare exam intelligence for ${item.topic}.
This is knowledge that cannot be found in any NCERT textbook or coaching material.
It comes from 15+ years of PYQ pattern analysis by a top JEE mentor.

DELIVER EXACTLY 4 bullet points:
- **🔮 The Hidden Pattern:** [A non-obvious connection between ${item.topic} and another chapter that appears in 30%+ of papers]
- **🎯 The "Always Check" Rule:** [A boundary condition or edge case that examiners love to test]
- **📊 PYQ Frequency Intel:** [Exact sub-topics of ${item.topic} asked in 2019, 2021, 2023 papers — with year citations]
- **⚡ The 30-Second Shortcut:** [A technique to answer a specific question type in under 30 seconds]

Tone: Mentor-to-student, authentic, not corporate. No filler.`;

    } else if (heading.includes("Last 5 Minutes")) {
        specificDirective = `You are producing the "LAST 5 MINUTES BOX" — the final thing a student reads before sleeping.
Every word costs. Ruthless brevity is the goal.

DELIVER IN THIS EXACT ORDER (no deviation):

**⚡ Core Formulas** (exactly 5):
- $[formula 1]$ — [what it gives you]
- …

**🧠 Must-Know Facts** (exactly 3):
- [fact 1]
- …

**🚫 Never Forget** (exactly 2 traps):
- ❌ [wrong assumption] → ✅ [correct approach]
- …

**🎯 If you can only remember ONE thing:** [single sentence summary]

${LATEX_RULE}
ABSOLUTELY NO prose paragraphs. Bullets only.`;

    } else {
        specificDirective = `Provide a detailed, exam-focused revision summary for "${heading}" on the topic ${item.topic}.
Use bullet points for 90% of content. Aim for 400+ words.
${LATEX_RULE}`;
    }

    const user = `${ctxBlock}
═══════════════════════════════════════════════
📌 TASK: Write section "${heading}" for the ExamCompass blog post:
   Topic: ${item.topic} | Class: ${displayClass} | Subject: ${item.subject} | Year: ${targetYear}
═══════════════════════════════════════════════

${specificDirective}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 OUTPUT FORMAT RULES (violations break the website):
1. Output RAW MARKDOWN ONLY — no JSON, no code fences, no \`\`\`json blocks
2. Start writing immediately — no preamble like "Sure! Here is..."
3. Every heading inside the section must use ### (not ##)
4. No HTML tags whatsoever
5. ${LATEX_RULE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const raw = await callLlmWithFallback(system, user, false);

    // ── Newton formula verification (non-blocking) ──────────────────────
    if (heading.includes("Formula Bank") && ['Mathematics', 'Maths', 'Physics'].includes(item.subject)) {
        const formulaMatch = raw?.match(/\$\$(.*?)\$\$/s);
        if (formulaMatch?.[1]) {
            try {
                const cleaned = formulaMatch[1].replace(/\\/g, '').trim();
                const result = await AcademicSearchService.mathOperation('simplify', cleaned);
                if (result && !result.toLowerCase().includes('error')) {
                    console.log(`   ✅ Newton: ${cleaned.slice(0, 40)} → ${result}`);
                }
            } catch { /* Newton is picky — silent failure is fine */ }
        }
    }

    // ── Rich section-specific fallback ─────────────────────────────────
    const ayushFallback: Section = {
        heading,
        body: [
            `- **🔮 Hidden Pattern for ${item.topic}:** After analysing 15 years of PYQ blueprints, this topic consistently features in the "application" category — not definition. Examiners test boundary conditions.`,
            `- **🎯 The Most Common Trap:** ~70% of students misapply the core formula under time pressure. Always confirm your variable assignments before substituting.`,
            `- **⚡ Jules Insight:** ${item.topic} connects directly to at least 2 other chapters in ${item.subject || 'this subject'}. Cross-topic questions appear in 40% of papers — build a mental map.`,
            `- **📅 Last-Night Focus:** 12 hours before the exam? Focus on exceptions and edge cases — that's where ${targetYear} marks are hidden.`,
            `- **🧠 Active Recall Check:** Close your eyes and list 3 core facts about ${item.topic}. If you can't, re-read this section once more.`,
        ].join('\n'),
        needsReview: true,
        table: { headers: [], rows: [] },
    };

    // Guard: null / empty response
    if (!raw || raw.trim().length < 30) {
        console.warn(`⚠️ Empty response for "${heading}". Using fallback.`);
        return ayushFallback;
    }

    // Guard: refusal detection
    if (isRefusal(raw)) {
        console.error(`🛡️ LLM refused "${heading}". Injecting fallback.`);
        return ayushFallback;
    }

    // Guard: JSON squash detection — if LLM returned JSON instead of markdown
    const looksLikeJson = raw.trimStart().startsWith('{') || raw.includes('"body"') || raw.includes('"heading"');
    let bodyContent = raw;
    if (looksLikeJson) {
        console.warn(`⚠️ JSON squash detected for "${heading}" — extracting body via god-JSON.`);
        const extracted = godExtract(raw, ['body']);
        bodyContent = typeof extracted?.body === 'string' && extracted.body.length > 50
            ? extracted.body
            : raw; // If extraction fails, use the raw (might still have content)
    }

    // Sanitise + LaTeX repair
    const sanitised = sanitizeAiText(bodyContent);
    const fixed = checkLatexIntegrity(sanitised);

    if (!fixed || fixed.length < 50) {
        console.warn(`🛡️ Content too thin for "${heading}". Using fallback.`);
        return ayushFallback;
    }

    return { heading, body: fixed, table: { headers: [], rows: [] }, needsReview: false };
}


export async function generateExtras(item: any, researchContext: string): Promise<{ mcqs: MCQ[], recall: string[] }> {
    console.log(`🧠 Jules: Generating MCQs + Quick Recall for ${item.topic}...`);
    const numericClass = Number(item.class.replace(/\D/g, ''));
    const system = getAcademicIdentity(numericClass, item.subject);
    const ctxBlock = researchContext ? `\n\n---\nREAL PYQ DATA (USE AS QUESTION SOURCE):\n${researchContext}\n---\n` : '';

    const user = `${ctxBlock}
═══════════════════════════════════════════════════════════
📌 TASK: Generate MCQs + Quick Recall for "${item.topic}"
   Subject: ${item.subject} | Class: ${item.class}
═══════════════════════════════════════════════════════════

PART A — 5 HIGH-YIELD MCQs
Each MCQ must be genuinely exam-level (not trivial). Requirements:
- Mix difficulty: 2 easy (direct formula), 2 medium (application), 1 hard (multi-step)
- At least 2 MCQs must use numbers / calculations with LaTeX
- The "answer_text" must explain WHY the other 3 options are wrong (not just state the right answer)
- Use LaTeX for all formulas: $inline$ or $$block$$

PART B — GRANDMASTER CONCEPTUAL SUMMARY (quick_recall)
- Exactly 8 declarative statements — the chapter's 8 core truths
- Format: "Concept name: [statement]"
- NO questions, NO "Find the...", NO task items
- These must be the 8 things a student MUST know to score full marks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 RETURN VALID JSON ONLY — no prose before or after:
{
  "mcqs": [
    {
      "question": "string with LaTeX if needed",
      "options": ["option text only", "option text", "option text", "option text"],
      "answer": "A",
      "answer_text": "Explanation of why A is correct and B/C/D are wrong."
    }
  ],
  "quick_recall": [
    "Concept 1: declarative statement",
    "Concept 2: declarative statement"
  ]
}
RULES: "options" must be a JSON array of exactly 4 plain strings (NO "A)" prefix).
       "answer" must be exactly one of: A B C D
       All string values must be plain text or LaTeX — NO nested objects.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    const raw = await callLlmWithFallback(system, user, true);
    if (!raw) return { mcqs: [], recall: [] };
    
    // Guard: refusal
    if (isRefusal(raw)) {
        console.warn(`🛡️ LLM refused extras for "${item.topic}". Using fallback recall.`);
        return {
            mcqs: [],
            recall: [
                `${item.topic}: Core concept — define it precisely before applying any formula.`,
                `${item.topic}: Application — always check units and boundary conditions.`,
                `${item.topic}: PYQ Pattern — examiners test edge cases more than standard cases.`,
                `${item.topic}: Common mistake — sign errors and formula misremembering under pressure.`,
                `${item.topic}: Speed tip — memorise the most-used formula first, derive the rest.`,
            ]
        };
    }

    // God-JSON extraction (never throws — returns safe defaults)
    const data = godExtract(raw, ['mcqs', 'quick_recall']);

    // ── MCQ coercion & validation ─────────────────────────────────────────
    const VALID_ANSWERS = new Set(['A','B','C','D']);
    const rawMcqs: any[] = Array.isArray(data.mcqs) ? data.mcqs : [];
    const mcqs: MCQ[] = rawMcqs
        .filter(m => m && typeof m === 'object')
        .map((m: any): MCQ | null => {
            const question = checkLatexIntegrity(sanitizeAiText(String(m.question ?? ''))).trim();
            if (question.length < 10) return null;
            let opts: string[] = [];
            if (Array.isArray(m.options)) {
                opts = m.options.map((o: any) =>
                    sanitizeAiText(typeof o === 'string' ? o : String(o ?? ''))
                        .replace(/^[A-Da-d][).]\s*/, '').trim()
                ).filter((o: string) => o.length > 0);
            }
            if (opts.length < 4) return null;
            let answer = String(m.answer ?? '').trim().toUpperCase().charAt(0);
            if (!VALID_ANSWERS.has(answer)) answer = 'A';
            const answer_text = checkLatexIntegrity(sanitizeAiText(String(m.answer_text ?? ''))).trim()
                || `Option ${answer} is correct for this question.`;
            return { question, options: opts.slice(0, 4), answer, answer_text };
        })
        .filter((m): m is MCQ => m !== null);

    // ── Quick recall coercion ─────────────────────────────────────────────
    const rawRecall: any[] = Array.isArray(data.quick_recall) ? data.quick_recall : [];
    const recall: string[] = rawRecall
        .map((r: any) => sanitizeAiText(typeof r === 'string' ? r : JSON.stringify(r)).trim())
        .filter((r: string) => r.length > 5);

    const recallFallback = [
        `${item.topic}: Definition — know the precise NCERT definition cold.`,
        `${item.topic}: Formula anchor — derive everything else from 1 master formula.`,
        `${item.topic}: PYQ frequency — appears annually in CBSE; every 2 years in JEE Mains.`,
        `${item.topic}: Calculation trap — always verify units before substituting values.`,
        `${item.topic}: Application — mostly multi-step numerical problems in exams.`,
        `${item.topic}: Cross-topic — connects to at least 2 adjacent chapters; know the bridge.`,
    ];

    return {
        mcqs,
        recall: recall.length >= 3 ? recall : recallFallback,
    };
}


async function generateBlogs() {
    const isRefineOnly = process.argv.includes('--refine-only');
    const isNewOnly = process.argv.includes('--new-only');
    
    let modeLabel = 'Unified';
    if (isRefineOnly) modeLabel = 'Refinement-Only';
    if (isNewOnly) modeLabel = 'New-Only';
    
    console.log(`🤖 Jules: Starting ${modeLabel} Blog Generation...`);

    const REPORTS_DIR = path.join(__dirname, '../jules-reports');
    const FAILED_DIR = path.join(__dirname, '../jules-failed');
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR);
    if (!fs.existsSync(FAILED_DIR)) fs.mkdirSync(FAILED_DIR);

    // 1. Load New Topics Queue
    let queue: any[] = [];
    if (!isRefineOnly && fs.existsSync(QUEUE_FILE)) {
        queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }

    // 1.1 Load SEO Growth Queue (High Yield Topics)
    if (!isRefineOnly && fs.existsSync(GROWTH_QUEUE_FILE)) {
        try {
            const growthData = JSON.parse(fs.readFileSync(GROWTH_QUEUE_FILE, 'utf8'));
            if (growthData?.queue) {
                console.log(`📈 Loaded ${growthData.queue.length} Golden Topics from SEO Growth Queue.`);
                // Merge into main queue
                queue = [...queue, ...growthData.queue];
            }
        } catch (e) {
            console.warn("⚠️ Failed to parse Growth Queue, skipping SEO topics.");
        }
    }

    // 2. Load Refinement (Decay) Queue - Merge all pending tasks
    const regenFiles = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('regen-queue-') && f.endsWith('.json'));
    
    let allRegenItems: any[] = [];
    for (const file of regenFiles) {
        try {
            const filePath = path.join(REPORTS_DIR, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(content)) {
                allRegenItems = [...allRegenItems, ...content];
            }
        } catch (err) {
            console.error(`⚠️ Failed to read regen file ${file}:`, err);
        }
    }

    if (allRegenItems.length > 0) {
        console.log(`📂 Found ${allRegenItems.length} total refinement items across ${regenFiles.length} files.`);
        
        // Deduplicate by slug
        const uniqueRegen = Array.from(new Map(allRegenItems.map(item => [item.slug, item])).values());
        
        // --- 2.1 Metadata Repair & Conversion ---
        const formattedRegen = uniqueRegen.map((item: any) => {
            let subject = 'General';
            let topic = item.slug.replace(/-/g, ' ');
            let examClass = '10';

            // Heuristic for Class detection from slug
            if (item.slug.includes('-class-11')) examClass = '11';
            else if (item.slug.includes('-class-12')) examClass = '12';
            else if (item.slug.includes('-class-9')) examClass = '9';
            else if (item.slug.includes('-class-8')) examClass = '8';

            const blogPath = path.join(BLOG_DIR, `${item.slug}.md`);
            if (fs.existsSync(blogPath)) {
                try {
                    const content = fs.readFileSync(blogPath, 'utf-8');
                    const subjectMatch = content.match(/subject:\s*['"]?([^'"\n]+)/);
                    const categoryMatch = content.match(/category:\s*['"]?([^'"\n]+)/);
                    const classMatch = content.match(/exam_class:\s*(\d+)/) || content.match(/class:\s*(\d+)/);
                    if (subjectMatch) subject = subjectMatch[1].trim();
                    else if (categoryMatch) subject = categoryMatch[1].trim();
                    if (classMatch) examClass = classMatch[1].trim();
                } catch { }
            }
            return { topic, targetSlug: item.slug, subject, class: examClass, isRegeneration: true, reason: item.reason };
        });
        
        queue = [...queue, ...formattedRegen];
    }

    if (queue.length === 0) {
        console.log("📭 No new or refinement blogs in queue.");
        return;
    }

    // --- Slot allocation ---
    const MAX_NEW_PER_RUN = 3;
    const MAX_REGEN_PER_RUN = isRefineOnly ? 6 : 3; // 6 slots if refining only
    const MAX_BLOGS_PER_RUN = isRefineOnly ? MAX_REGEN_PER_RUN : (MAX_NEW_PER_RUN + (isNewOnly ? 0 : MAX_REGEN_PER_RUN));

    let newQueue: any[];
    let regenQueue: any[];

    if (isRefineOnly) {
        newQueue = [];
        regenQueue = queue.filter((item: any) => item.isRegeneration).slice(0, MAX_REGEN_PER_RUN);
    } else if (isNewOnly) {
        newQueue = queue.filter((item: any) => !item.isRegeneration).slice(0, MAX_NEW_PER_RUN);
        regenQueue = [];
    } else {
        newQueue = queue.filter((item: any) => !item.isRegeneration).slice(0, MAX_NEW_PER_RUN);
        regenQueue = queue.filter((item: any) => item.isRegeneration).slice(0, MAX_REGEN_PER_RUN);
    }
    queue = [...newQueue, ...regenQueue];

    console.log(`🎯 Queue allocation: ${newQueue.length} new + ${regenQueue.length} refinements`);
    console.log(`🚀 Processing combined queue: ${queue.length} items`);
    const pipelineReport: any[] = [];

    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-dry-run');
    if (isDryRun) console.log("🧪 DRY RUN MODE ENABLED");

    const generatedSlugsFile = path.join(__dirname, '../generated-slugs.txt');
    // NOTE: We no longer reset the file here to allow accumulation in multi-step workflows.
    // Resetting should happen at the start of the CI job.

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

        // --- NEW: RESEARCH PHASE ---
        const researchContext = await researchTopic(item, targetYear);

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
                    const outline = await generateOutline(item, targetYear, researchContext);
                    const intro = await generateIntro(item, targetYear, displayClass, researchContext);
                    
                    const sections: Section[] = [];
                    for (const heading of outline) {
                        sections.push(await generateSection(item, heading, displayClass, targetYear, researchContext));
                        await new Promise(r => setTimeout(r, 3000));
                    }

                    const extras = await generateExtras(item, researchContext);

                    const SUBJECT_EXAM: Record<string, string> = {
                        'Physics': 'JEE & NEET', 'Chemistry': 'JEE & NEET',
                        'Mathematics': 'JEE', 'Biology': 'NEET',
                        'Computer Science': 'GATE & Boards',
                        'Science': 'CBSE Boards', 'Social Science': 'CBSE Boards',
                        'English': 'CBSE Boards',
                        'History': 'CBSE Boards', 'Geography': 'CBSE Boards',
                        'Civics': 'CBSE Boards', 'Economics': 'CBSE Boards',
                        'Political Science': 'CBSE Boards'
                    };
                    const examTag = numericClass >= 11
                        ? (SUBJECT_EXAM[item.subject] || 'CBSE')
                        : 'CBSE';

                    const seoTitle = numericClass >= 11
                        ? `${item.topic} Class ${numericClass} ${item.subject} Revision — ${examTag} ${targetYear} Grandmaster Guide`
                        : `${item.topic} Class ${numericClass} ${item.subject} Recap — ${examTag} ${targetYear} Quick Guide`;

                    // Area 5: Practice Link Routing (Dynamic for all subjects)
                    // We now use a dynamic base that respects the actual class (10, 11, or 12)
                    let practiceBase = `/class-${numericClass}/${item.subject.toLowerCase().replace(/ /g, '-')}`;
                    
                    // Special case overrides if the subject slug differs from the name
                    const SUBJECT_SLUG_OVERRIDES: Record<string, string> = {
                        "Social Science": "social-science",
                        "Computer Science": "computer-science",
                        "Business Studies": "business-studies",
                        "Political Science": "political-science"
                    };

                    const cleanSubjectSlug = SUBJECT_SLUG_OVERRIDES[item.subject] || item.subject.toLowerCase();
                    practiceBase = `/class-${numericClass}/${cleanSubjectSlug}`;

                    // The topic slug on the practice page is just the slugified topic name
                    // NOT the full blog-post-style slug
                    const topicSlug = item.topic.toLowerCase().trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w-]+/g, '')
                        .replace(/--+/g, '-');

                    const practiceLink = `${practiceBase}/${topicSlug}`.replace(/\/+/g, '/');

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
                        postToRepair.content.intro = await generateIntro(item, targetYear, displayClass, researchContext);
                    }
                    
                    if (needsSections || (qualityReport?.patch_missing_sections.some(s => s.toLowerCase().includes("section")) ?? false)) {
                        if (needsSections && qualityReport?.regenerate_all) {
                            console.log(`  📝 Regenerating All Sections...`);
                            const outline = await generateOutline(item, targetYear, researchContext);
                            postToRepair.content.sections = [];
                            for (const heading of outline) {
                                postToRepair.content.sections.push(await generateSection(item, heading, displayClass, targetYear, researchContext));
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } else {
                            // Check for specific section repairs from the patch list
                            for (const patchTitle of qualityReport?.patch_missing_sections || []) {
                                if (patchTitle.toLowerCase().includes("section") || patchTitle.includes("Note") || patchTitle.includes("Questions")) {
                                    console.log(`  📝 Repairing specific section: ${patchTitle}`);
                                    // If it's a completely missing section, push it. If it's a weak one, replace it.
                                    const index = postToRepair.content.sections.findIndex(s => s.heading.toLowerCase().includes(patchTitle.toLowerCase()));
                                    const newSec = await generateSection(item, patchTitle, displayClass, targetYear, researchContext);
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
                        const extras = await generateExtras(item, researchContext);
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
                        const newExtras = await generateExtras(item, researchContext);
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
                        const ayushSection = await generateSection(item, `What is Ayush's Note on ${item.topic}?`, displayClass, targetYear, researchContext);
                        assembled.content.sections.push(ayushSection);
                    }
                    if (!bodyCheck.includes("trap question") && !bodyCheck.includes("common mistakes")) {
                        console.log(`  📝 Generating missing "Trap Questions" section...`);
                        const trapSection = await generateSection(item, `What are common Trap Questions for ${item.topic}?`, displayClass, targetYear, researchContext);
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

    // --- SAVE REPORT WITH MERGE ---
    const dailyReportPath = path.join(REPORTS_DIR, `pipeline-${new Date().toISOString().split('T')[0]}.json`);
    
    let finalReport = pipelineReport;
    if (fs.existsSync(dailyReportPath)) {
        try {
            const existingContent = fs.readFileSync(dailyReportPath, 'utf8');
            const existingData = JSON.parse(existingContent);
            if (Array.isArray(existingData)) {
                // Deduplicate reports if the same blog was processed twice (unlikely but safe)
                const existingSlugs = new Set(existingData.map(r => r.slug));
                const newResults = pipelineReport.filter(r => !existingSlugs.has(r.slug));
                finalReport = [...existingData, ...newResults];
                console.log(`🔄 Merged ${newResults.length} results into existing daily report (${existingData.length} existing).`);
            }
        } catch (e: any) {
            console.warn(`⚠️ Could not merge existing report: ${e.message}`);
        }
    }

    fs.writeFileSync(dailyReportPath, JSON.stringify(finalReport, null, 2));
    console.log(`📊 Pipeline report saved: ${dailyReportPath}`);

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
    // NEXUS v2: Exit with 1 so the workflow correctly detects failures.
    // Task 23 (Auditor) runs with if: always() so it will still capture crash logs.
    process.exit(1);
});

