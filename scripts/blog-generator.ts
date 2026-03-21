import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, BlogPostJSON, QualityReport } from './utils/jules-quality.js';


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
        console.log("🚀 Using Gemini Backup for content generation...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
                }],
                generationConfig: { maxOutputTokens: 8000, temperature: 0.7 }
            })
        });

        const data: any = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        console.error("❌ Gemini Backup failed:", err);
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
        Format: Return ONLY the raw SVG code. 1200x630.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        const data: any = await response.json();
        let svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        svg = svg.replace(/```svg/g, "").replace(/```/g, "").trim();

        if (!svg.includes("<svg")) throw new Error("Invalid SVG from Gemini");

        // Escape dangerous characters to prevent XML parsing failure
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
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed (August = 7)
        const targetYear = currentMonth >= 7 ? currentYear + 1 : currentYear;


        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, Class ${item.class}, Year ${targetYear})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        
        // --- DATE PRESERVATION LOGIC ---
        // If the blog already exists, we MUST preserve its original release date.
        let publishDate = getShiftedDate();
        if (fs.existsSync(filePath)) {
            const existingContent = fs.readFileSync(filePath, 'utf8');
            const dateMatch = existingContent.match(/date:\s*["'](.*?)["']/);
            if (dateMatch) {
                publishDate = dateMatch[1];
                console.log(`📅 Preserving original date: ${publishDate}`);
            }
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);

        
        // --- STEP 1: GENERATE DYNAMIC SEO DESCRIPTION ---
        console.log("📑 Jules: Crafting unique SEO description...");
        let seoDescription = `Interactive quick recap for ${item.topic} Class ${item.class} — MCQs, key points, trap questions + free PDF download.`;
        try {
            const seoCompletion = await groq.chat.completions.create({
                messages: [{ 
                    role: "system", 
                    content: "You are an SEO specialist. Write a high-click-through meta description (max 155 chars) for a blog post. YOU MUST INCLUDE these exact words at the end: 'MCQs, key points, + free PDF download'. Do not use quotes." 
                }, { 
                    role: "user", 
                    content: `Topic: ${item.topic}, Subject: ${item.subject}, Class: ${item.class}. Focus: Quick Revision, Trap Questions.` 
                }],
                model: "llama-3.1-8b-instant",
                max_tokens: 100
            });
            seoDescription = seoCompletion.choices[0]?.message?.content?.replace(/"/g, '').trim() || seoDescription;
        } catch (e) {}

        const isScience = ['Physics', 'Chemistry', 'Biology', 'Maths', 'Mathematics'].includes(item.subject);
        const promptAdditions = isScience 
            ? 'Include high-yield JEE/NEET data, Core Concepts, Formulae Tables (Use ONLY $ for inline math and $$ for block math. DO NOT duplicate math as plain text before the LaTeX), and MCQs.' 
            : 'Include historical timelines, maps contexts, Core Concepts, and MCQs. DO NOT include any mathematical equations, formulas, or JEE/NEET data.';
        
        let factCheckRules = '';
        if (item.subject === 'Geography' || item.topic.toLowerCase().includes('geography')) {
            factCheckRules = `
            FACT CHECK RULES FOR GEOGRAPHY:
            1. Highest Peak in India: Kangchenjunga (NOT Mount Everest).
            2. Longest River in India: Ganga (NOT Indus).
            3. Western Ghats are older than Himalayas.
            4. Tropic of Cancer passes through 8 Indian states.`;
        }
            
        const systemPrompt = `You are Ayush's senior content editor. Return ONLY valid JSON.
        
        STRICT RULES — violating any of these will cause the post to be rejected:
        1. FIRST PARAGRAPH ENFORCEMENT: The very first paragraph under every main H2 heading must follow this structure: "[Topic] is [one-sentence definition]. It includes [2–3 key components]. For Class ${item.class.replace(/\D/g, '')} exam prep in ${targetYear}, the most important aspect is [core exam focus]."
        2. QUESTION HEADERS: ALL H2 headings must be phrased as direct questions ending in "?". (e.g., "What is ${item.topic}?")
        3. STRUCTURAL EXCEPTION: Keep these exact H3 labels: "Quick Recall Box", "Trap Exceptions", "Ayush's Tips", "Historical Timelines", "MCQs", "Maps Context", "Core Concepts".
        4. TABLE CLOSING: Always close a markdown or JSON table completely before starting any Ayush's Tips/notes. A note must never appear as a row inside a table.
        5. MCQ MANDATE: Every MCQ must include: question, 4 options (a/b/c/d), and a bold "**Answer: [letter]) [Text]** — [One-sentence explanation]."
        6. FACTUAL ACCURACY: India's highest peak is Kangchenjunga (NOT Everest). India's longest river is the Ganga (NOT Indus).
        7. NO PREAMBLE: Return ONLY valid JSON.
        
        JSON SCHEMA:
        {
          "title": "${item.topic} Class ${item.class.replace(/\D/g, '')} Notes for ${targetYear}",
          "slug": "${item.targetSlug}",
          "subject": "...",
          "chapter_name": "${item.topic}",
          "exam_class": ${item.class.replace(/\D/g, '')},
          "last_updated": "${new Date().toISOString().split('T')[0]}",
          "practice_link_path": "...",
          "hero_image": "${heroImagePath}",
          "content": {
            "intro": "...",
            "sections": [
              { "heading": "What is ...?", "body": "...", "table": { "headers": ["Col1", "Col2"], "rows": [["val", "val"]] } }
            ],
            "mcqs": [
              { "question": "...", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "answer": "b", "answer_text": "text" }
            ],
            "quick_recall": ["point 1", "point 2"]
          }
        }`;


        const userPrompt = `TOPIC: ${item.topic}, SUBJECT: ${item.subject}, CLASS: ${item.class}, EXAM TARGET YEAR: ${targetYear}. 
        Write a deep-dive revision guide. Style: "Quick Revision & Recap". Include Ayush's Personal Note (1st person), ${promptAdditions}. Highlight "Trap Exceptions" for quick review.`;

        let finalPost: BlogPostJSON | null = null;
        let qualityReport: QualityReport | null = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !finalPost) {
            attempts++;
            console.log(`📡 Attempt ${attempts}/${maxAttempts} for ${item.topic}...`);

            let rawJson = "";
            let success = false;

            for (const model of GROQ_MODELS) {
                try {
                    console.log(`📝 Calling Groq JSON Mode (${model})...`);
                    const chatCompletion = await groq.chat.completions.create({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        model: model,
                        response_format: { type: "json_object" },
                        temperature: 0.6,
                        max_tokens: 8000
                    });

                    rawJson = chatCompletion.choices[0]?.message?.content || "";
                    if (rawJson) {
                        success = true;
                        break;
                    }
                } catch (err: any) {
                    console.warn(`⚠️ Model ${model} failed: ${err.message}`);
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

            if (!success) {
                console.log("🛡️ Groq failed. Attempting Gemini Backup (JSON Mode)...");
                const geminiRaw = await generateWithGemini(systemPrompt + "\nIMPORTANT: Return ONLY valid JSON.", userPrompt);
                if (geminiRaw) {
                    rawJson = geminiRaw;
                    success = true;
                }
            }

            if (success && rawJson) {
                try {
                    const parsed: BlogPostJSON = JSON.parse(rawJson);
                    
                    // --- QUALITY CHECK GATE ---
                    const report = checkBlogQuality(parsed);
                    qualityReport = report;

                    if (report.passed) {
                        console.log(`✅ QUALITY PASSED (Score: ${report.score}/100)`);
                        finalPost = parsed;
                    } else if (attempts < maxAttempts) {
                        console.log(`❌ QUALITY FAILED (Score: ${report.score}). Critical: ${report.critical_failures.join(', ')}`);
                        
                        if (report.regenerate_sections.length > 0) {
                            console.log(`🔧 Attempting targeted regeneration for: ${report.regenerate_sections.join(', ')}`);
                            const targetPrompt = `The quality check failed. Sections that failed: ${report.regenerate_sections.join(', ')}. Reasons: ${report.critical_failures.join('; ')}. 
                            Regenerate ONLY these sections for the post "${item.topic}". Return only valid JSON for these specific sections. 
                            Rules: MCQ must have answer, no personal notes in tables, facts must be 100% correct.`;
                            
                            const fixCompletion = await groq.chat.completions.create({
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: targetPrompt }
                                ],
                                model: GROQ_PROMPT_MODEL,
                                response_format: { type: "json_object" },
                                temperature: 0.3
                            });

                            const fixedData = JSON.parse(fixCompletion.choices[0]?.message?.content || "{}");
                            // Merge fixes
                            if (fixedData.content) {
                                if (fixedData.content.mcqs) parsed.content.mcqs = fixedData.content.mcqs;
                                if (fixedData.content.sections) {
                                    fixedData.content.sections.forEach((newSec: any) => {
                                        const idx = parsed.content.sections.findIndex(s => s.heading === newSec.heading);
                                        if (idx !== -1) parsed.content.sections[idx] = newSec;
                                    });
                                }
                            }
                            
                            // Re-check after partial fix
                            const secondReport = checkBlogQuality(parsed);
                            if (secondReport.passed) {
                                console.log(`✅ POST RECOVERED (Score: ${secondReport.score})`);
                                finalPost = parsed;
                                qualityReport = secondReport;
                            }
                        }
                    }
                } catch (e: any) {
                    console.error("❌ JSON Parse Failed:", e.message);
                }
            }
        }

        // --- FINAL PUBLISH OR FAIL ---
        const finalStatus = finalPost ? (qualityReport?.auto_fixed.length ? "published_with_fixes" : "published") : "failed";
        pipelineReport.push({
            slug: item.targetSlug,
            status: finalStatus,
            quality_score: qualityReport?.score || 0,
            retries: attempts - 1,
            auto_fixed: qualityReport?.auto_fixed || [],
            critical_failures: qualityReport?.critical_failures || [],
            warnings: qualityReport?.warnings || []
        });

        if (finalPost && !isDryRun) {
            const markdown = jsonToMarkdown(finalPost);
            fs.writeFileSync(filePath, markdown);
            fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
            console.log(`✨ Published: ${item.targetSlug}`);
        } else if (finalPost && isDryRun) {
            console.log(`🧪 DRY RUN: ${item.targetSlug} would have been published.`);
        } else {

            const failPath = path.join(FAILED_DIR, `${item.targetSlug}-failed.json`);
            fs.writeFileSync(failPath, JSON.stringify({ item, report: qualityReport }, null, 2));
            console.error(`🚨 PIPELINE CRITICAL FAILURE: ${item.topic} failed quality gate after ${maxAttempts} attempts.`);
        }

        // --- COOLDOWN ---
        await new Promise(r => setTimeout(r, 10000));
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

