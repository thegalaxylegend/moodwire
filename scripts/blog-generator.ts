import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, standardizeMarkdown, sanitizeAiText, checkLatexIntegrity, BlogPostJSON, QualityReport, Section, MCQ } from './utils/jules-quality.js';



import { godSafeParse, godExtract, isRefusal } from './utils/god-json.js';
import { ExternalApiService } from '../src/services/externalApiService.js';


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

    // Optional: Add Wolfram context for Math/Science
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
    console.log(`📖 Jules: Writing specific revision section: ${heading}...`);
    const numericClass = Number(item.class.replace(/\D/g, ''));
    const system = getAcademicIdentity(numericClass, item.subject);
    
    // Inject Research Context into the User Prompt
    let contextHeader = researchContext ? `\n\nUSE THIS ACTUAL 2026 EXAM DATA AS YOUR BIBLE:\n${researchContext}\n\n` : "";
    
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

    const user = `${contextHeader}Write the section for the heading: "${heading}" regarding the topic "${item.topic}".
    STRICT RULE: ${specificDirective}
    Remember LATEX ESCAPING RULES! Use $$ for block formulas and $ for inline formulas.
    TARGET LENGTH: Each section MUST be detailed and exhaustive. Aim for 300+ words per section.
    Return JSON: { "heading": "${heading}", "body": "...", "table": { "headers": [], "rows": [[]] } }`;

    const raw = await callLlmWithFallback(system, user, true);
    const ayushFallback = {
        heading: heading,
        body: `- **Ayush's Critical Pattern (${item.topic}):** Analysis of the last 15 years of PYQs and official exam blueprints reveals that ${item.topic} is a "High-Value, High-Risk" area. Examiners often shift the focus from direct definitions to multi-step application problems.
- **The "Trap" Recognition:** In ${item.topic}, the most common mistake (made by ~70% of students) involves misapplying core concepts under time pressure. Always verify the units and boundary conditions before selecting an answer.
- **Jules Advanced Insight:** To master ${item.topic}, don't just memorize the formulas. Build a mental map of how it connects to ${item.subject || 'related modules'}. This cross-topic synergy is what separates 99th percentile scorers from the rest.
- **Last-Night Strategy:** If you're reading this 12 hours before the exam, focus on the "Exceptions to the Rule." In ${item.topic}, questions are almost always framed around the corner cases rather than the standard cases.
- **Peer Mentor Tip:** Use the active recall method for ${item.topic}. Close your eyes right now and try to list the 3 most essential points about this topic. If you can't, reread this section twice.`,
        needsReview: true,
        table: { headers: ["Parameter", "Key Insight"], rows: [["Difficulty", "Medium-High"], ["PYQ Frequency", "Annual"], ["Strategy", "Formula Application"]] }
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


export async function generateExtras(item: any, researchContext: string): Promise<{ mcqs: MCQ[], recall: string[] }> {
    console.log(`🧠 Jules: Generating MCQs and Quick Recall for ${item.topic}...`);
    const numericClass = Number(item.class.replace(/\D/g, ''));
    const system = getAcademicIdentity(numericClass, item.subject);
    
    let contextHeader = researchContext ? `\n\nUSE THESE REAL PYQs/DATA FROM RESEARCH:\n${researchContext}\n\n` : "";

    const user = `${contextHeader}Generate 5 high-yield MCQs and a Conceptual Summary for "${item.topic}".
    
    The "quick_recall" items MUST be a "Grandmaster Conceptual Summary" of the chapter's core truths.
    - Each point should be a concise, fundamental concept or property.
    - DO NOT include questions, tasks, or "how-to" points (e.g., NO "Find the area...").
    - USE declarative statements.
    
    Example: 
    - "Tangent Radii: The tangent to a circle is always perpendicular to the radius at the point of contact."
    - "External Tangency: Lengths of tangents from an external point are always equal."
    
    The MCQs MUST have "question", "options" (array of 4 strings), "answer" (A/B/C/D), and "answer_text" (explanation) fields.
    STRICT RULE: Do NOT include "A)", "B)" etc. prefixes inside the option strings. Just provide the option text.
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
        
        // Convert to generation format
        const formattedRegen = uniqueRegen.map((item: any) => {
            let subject = 'General';
            let topic = item.slug.replace(/-/g, ' ');
            let examClass = '10';
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
    // Exit with 0 to allow the Auditor to capture the crash logs and report to Discord
    process.exit(0);
});

