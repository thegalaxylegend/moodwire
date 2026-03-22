import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, BlogPostJSON, QualityReport, Section, MCQ } from './utils/jules-quality.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

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
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
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
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

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

        const imageBuffer = Buffer.from(await response.arrayBuffer());
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

async function generateGeminiImage(subject: string, topic: string, webpPath: string): Promise<boolean> {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return false;

    try {
        console.log(`🚀 Primary APIs down. Asking Gemini to design SVG...`);
        const prompt = `Generate a beautiful, complex, and modern SVG for a blog cover image. 
        Topic: ${topic}
        Subject: ${subject}
        Style: Dark mode, neon colors, futuristic, scientific diagrams, no text, high detail.
        Format: Return ONLY the raw SVG code starting with <svg. 1200x630. DO NOT use markdown code blocks.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        const data: any = await response.json();
        let svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Aggressive cleanup for valid SVG
        svg = svg.replace(/```svg/gi, "").replace(/```/gi, "").trim();
        if (svg.includes("<svg") && !svg.startsWith("<svg")) {
            svg = svg.substring(svg.indexOf("<svg"));
        }

        if (!svg.includes("<svg")) throw new Error("Invalid SVG from Gemini");

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

    // Priority 2: Gemini SVG
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

const GRANDMASTER_IDENTITY = `You are Ayush's senior content editor at Exam Compass. 
Your voice is that of a PEER MENTOR (a student who cracked the exam helping juniors). 
Voice: Specific, data-driven, authentic student tone. NO FILLER.`;

const CROSS_SECTION_RULES = `
RULES:
1. NO CONCLUSION sections.
2. NO FILLER PHRASES: "In conclusion", "Delve into", "Important to note", "Master [Topic] today".
3. Use ONLY $ for inline math and $$ for block math.
4. Factual Accuracy: Kangchenjunga is highest peak in India. Ganga is longest river.
`;

// --- SMART RECOVERY WRAPPER ---
async function callLlmWithFallback(system: string, user: string, isJson: boolean = false): Promise<string> {
    // 70B for content and outlines, 8B only for structured metadata
    const isMetadata = user.includes("MCQ") || user.includes("quick_recall");
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
            console.log(`🛡️ Rate Limited on ${primaryModel}. Falling back to Gemini...`);
            const gemini = await generateWithGemini(system + (isJson ? "\nReturn ONLY valid JSON." : ""), user);
            if (gemini) return gemini;
        }
        throw err;
    }
}

async function generateOutline(item: any, targetYear: number): Promise<string[]> {
    console.log(`📑 Jules: Planning massive 10-point outline for ${item.topic}...`);
    const system = GRANDMASTER_IDENTITY;
    const user = `Create an EXHAUSTIVE 10-point outline of direct question headings (ending in "?") for a 3000-word revision guide on "${item.topic}".
    The headings MUST cover every single sub-topic for Class ${String(item.class).replace(/\D/g, '')} in ${targetYear}.
    MANDATORY: You MUST include exact headings for "What is Ayush's Note on ${item.topic}?", "What is the key Shortcut or Trick for ${item.topic}?", and "What are common Trap Questions for ${item.topic}?".
    Return ONLY a JSON array of strings. Example: { "headings": ["What is...?", "How does...?", ...] }`;
    const raw = await callLlmWithFallback(system, user, true);
    try {
        const data = JSON.parse(raw);
        return data.headings || data.outline || Object.values(data)[0] as string[];
    } catch {
        return [`What is ${item.topic}?`, `Core concepts of ${item.topic}?`].slice(0, 10);
    }
}

async function generateIntro(item: any, targetYear: number, displayClass: string): Promise<string> {
    console.log(`✍️ Jules: Crafting 500-word Peer Mentor intro...`);
    const system = `${GRANDMASTER_IDENTITY}\n${CROSS_SECTION_RULES}`;
    const user = `Write a massive, 500-800 word introduction for "${item.topic}" for ${displayClass} exam prep in ${targetYear}.
    Structure: Set the stage, explain exam weightage, and provide a personal/conceptual hook.`;
    
    return await callLlmWithFallback(system, user, false);
}

async function generateSection(item: any, heading: string, displayClass: string, targetYear: number): Promise<Section> {
    console.log(`📖 Jules: Writing 800-word deep-dive: ${heading}...`);
    const system = `${GRANDMASTER_IDENTITY}\n${CROSS_SECTION_RULES}`;
    const user = `Write an EXHAUSTIVE, 800-word deep-dive section for the heading: "${heading}".
    STRICT RULE: The first paragraph must follow this structure: "[Heading Topic] is [one-sentence definition]. It includes [2–3 key components]. For ${displayClass} exam prep in ${targetYear}, the most important aspect is [core exam focus]."
    Expand with technical depth and tables. Return JSON: { "heading": "${heading}", "body": "...", "table": { "headers": [], "rows": [[]] } }`;

    const raw = await callLlmWithFallback(system, user, true);
    try {
        return JSON.parse(raw);
    } catch {
        return { heading, body: raw };
    }
}

async function generateExtras(item: any): Promise<{ mcqs: MCQ[], recall: string[] }> {
    console.log(`🎯 Jules: Generating MCQs and Quick Recall...`);
    const system = GRANDMASTER_IDENTITY;
    const user = `Generate 5 high-yield MCQs and 7 Quick Recall bullet points for "${item.topic}".
    Return as JSON: { "mcqs": [...], "quick_recall": [...] }`;
    const raw = await callLlmWithFallback(system, user, true);
    try {
        const data = JSON.parse(raw);
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
        let qualityReport: QualityReport | null = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !finalPost) {
            attempts++;
            console.log(`📡 Multi-Pass Attempt ${attempts}/${maxAttempts} for ${item.topic}...`);

            try {
                const outline = await generateOutline(item, targetYear);
                const intro = await generateIntro(item, targetYear, displayClass);
                
                const sections: Section[] = [];
                for (const heading of outline) {
                    sections.push(await generateSection(item, heading, displayClass, targetYear));
                    // 3-second delay to avoid rate limits
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
                    ? `${item.topic} ${displayClass} Notes — Quick Revision for ${examTag} ${targetYear}`
                    : `${item.topic} ${displayClass} Notes — CBSE ${targetYear} Quick Revision`;

                const assembled: BlogPostJSON = {
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

                // --- QUALITY CHECK GATE ---
                const report = checkBlogQuality(assembled);
                qualityReport = report;

                if (report.passed) {
                    finalPost = assembled;
                } else {
                    console.log(`❌ QUALITY FAILED (Score: ${report.score}). Errors: ${report.critical_failures.join(', ')}`);
                }
            } catch (err: any) {
                console.error(`🚨 Pass failed: ${err.message}`);
            }
        }

        // --- FINAL PUBLISH OR FAIL ---
        const finalStatus = finalPost ? (qualityReport?.auto_fixed.length ? "published_with_fixes" : "published") : "failed";
        pipelineReport.push({
            slug: item.targetSlug,
            status: finalStatus,
            quality_score: qualityReport?.score || 0,
            retries: attempts - 1
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
        console.error("❌ One or more blogs failed quality check.");
        process.exit(1);
    }

    // FINAL STEP: Sync the blog registry
    console.log("\n🔄 Jules: Triggering Registry Sync...");
    try {
        const { execSync } = await import('child_process');
        execSync('node scripts/sync-blogs.js', { stdio: 'inherit' });
    } catch (e: any) {
        console.error("⚠️ Registry Sync failed:", e.message);
    }
}

generateBlogs().catch(err => {
    console.error("❌ Jules Fatal Error:", err);
    process.exit(1);
});

