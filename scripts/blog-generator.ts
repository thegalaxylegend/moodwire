import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

// --- DATE DISTRIBUTOR ---
const getShiftedDate = () => {
    const blogsDir = path.join(__dirname, '../src/content/blogs');
    if (!fs.existsSync(blogsDir)) return new Date('2026-03-16').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const dateCounts: Record<string, number> = {};
    
    files.forEach(f => {
        const content = fs.readFileSync(path.join(blogsDir, f), 'utf8');
        const match = content.match(/\*Last Updated:\s*([A-Za-z]+ \d+, \d{4})/);
        if (match) {
            const d = match[1];
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        }
    });

    // Current date is March 17, 2026. Avoid today.
    let daysBack = 1;
    while (true) {
        const d = new Date('2026-03-17'); 
        d.setDate(d.getDate() - daysBack);
        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if ((dateCounts[dateStr] || 0) < 6) return dateStr;
        daysBack++;
        if (daysBack > 100) return dateStr;
    }
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
    'Biology':     'Biology',
    'Chemistry':   'Chemistry',
    'Physics':     'Physics',
    'Mathematics': 'Mathematics',
    'Civics':      'Social Science',
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

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));

    // Track generated slugs for Discord
    const generatedSlugsFile = path.join(__dirname, '../generated-slugs.txt');
    fs.writeFileSync(generatedSlugsFile, ''); // Reset file

    for (const item of queue) {
        const publishDate = getShiftedDate();
        
        // Trick 8: Dynamic Target Year
        const currentMonth = new Date().getMonth(); // 0 indexed
        const currentYear = new Date().getFullYear();
        const targetYear = currentMonth >= 8 ? currentYear + 1 : currentYear;

        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, Class ${item.class}, Year ${targetYear})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.targetSlug} (Exists).`);
            continue;
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
            
        const systemPrompt = `You are Ayush's senior content editor. Peer mentor style. Min 2500 words. Rule: Do not write any conclusion paragraphs. End the article abruptly after the final content section. All content H2s MUST be formulated as direct questions (e.g., "What are the key features of X?") to optimize for SEO Snippets. Exception: structural sections like 'Quick Recall Box', 'MCQs', 'Trap Exceptions', 'Ayush's Tips' MUST keep their original names. Follow BLOG_RULES.md strictly. Focus on tables, bold terms, and quick-scan headers.`;
        const userPrompt = `TOPIC: ${item.topic}, SUBJECT: ${item.subject}, CLASS: ${item.class}, EXAM TARGET YEAR: ${targetYear}. 
Start the body with EXACTLY this snippet under the title: "## What is ${item.topic}?\\n\\n${item.topic} is [one sentence definition]. It includes [2-3 key points]. For Class ${item.class} exam prep in ${targetYear}, the most important aspect is [exam-relevant point]." 
Then generate bodies starting with Quick Recall Box. Style: "Quick Revision & Recap". Include Ayush's Personal Note (1st person), ${promptAdditions} Highlight "Trap Exceptions" for quick review. DO NOT include closing remarks.`;

        let success = false;
        for (const model of GROQ_MODELS) {
            try {
                console.log(`📝 Attempting generation with ${model}...`);
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    model: model,
                    temperature: 0.6,
                    max_tokens: 8000
                });

                let content = chatCompletion.choices[0]?.message?.content;
                if (content) {
                    content = content.replace(/^# .*\n/g, '').trim(); // Remove generated H1
                    const cleanClass = item.class.replace(/class/i, '').trim();

                    const category = SUBJECT_CATEGORIES[item.subject] || 'General';
                    const finalMarkdown = `---
title: "${item.topic} Class ${cleanClass} Quick Recap — MCQs, Key Points & PDF Download"
description: "${seoDescription}"
category: "${category}"
keywords: "${item.topic} quick recap, ${item.topic} trap questions, class ${cleanClass} ${item.subject} MCQs, ${item.topic} pdf download, Exam Compass"
date: "${publishDate}"
---

![${item.topic} notes for students](${heroImagePath})

*Last Updated: ${publishDate}*

${content}
`;
                    fs.writeFileSync(filePath, finalMarkdown);
                    fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
                    console.log(`✅ Success: ${item.targetSlug}.md saved.`);
                    success = true;
                    
                    // CRITICAL: Delay 15s to avoid 429 Rate Limit on next blog
                    console.log("⏳ Cooling down Groq (15s)...");
                    await new Promise(r => setTimeout(r, 15000));
                    break;
                }
            } catch (err: any) {
                if (err?.status === 429) {
                    console.warn(`⚠️ 429 Rate Limit on ${model}. Trying next model...`);
                    await new Promise(r => setTimeout(r, 5000)); // Short wait on 429
                } else {
                    console.error(`❌ Error with ${model}:`, err.message);
                }
            }
        }

        // --- STEP 4: GEMINI ULTIMATE FALLBACK ---
        if (!success) {
            console.log("🛡️ Groq failed all models. Triggering Gemini backup...");
            const content = await generateWithGemini(systemPrompt, userPrompt);
            if (content) {
                const cleanContent = content.replace(/^# .*\n/g, '').trim();
                const cleanClass = item.class.replace(/class/i, '').trim();
                
                const category = SUBJECT_CATEGORIES[item.subject] || 'General';
                const finalMarkdown = `---
title: "${item.topic} Class ${cleanClass} Quick Recap — MCQs, Key Points & PDF Download"
description: "${seoDescription}"
category: "${category}"
keywords: "${item.topic} quick recap, ${item.topic} trap questions, class ${cleanClass} ${item.subject} MCQs, ${item.topic} pdf download, Exam Compass"
date: "${publishDate}"
---

![${item.topic} notes for students](${heroImagePath})

*Last Updated: ${publishDate}*

${cleanContent}
`;
                fs.writeFileSync(filePath, finalMarkdown);
                fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
                console.log(`✅ Success: ${item.targetSlug}.md saved (via Gemini).`);
                success = true;
                
                console.log("⏳ Cooling down Gemini (10s)...");
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }
    
    // FINAL STEP: Sync the blog registry automatically
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
