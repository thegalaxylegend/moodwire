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

// Gemini Image function removed as it fails consistently with SVG parsing and lacks webp quality
// Local SVG generation function replaced by static fallbacks


async function downloadHeroImage(subject: string, topic: string, slug: string): Promise<string> {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return `/blog-images/${slug}.webp`;

    console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);

    const artPromptUser = `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, 8k, no text.`;
    
    const seeds = [Math.floor(Math.random() * 10000), 42, 1234];
    const models = ['flux', 'turbo', 'flux-realism'];

    for (let i = 0; i < 3; i++) {
        try {
            console.log(`🖌️ Image Attempt ${i + 1}/3 (Model: ${models[i]})...`);
            const encodedPrompt = encodeURIComponent(artPromptUser);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&seed=${seeds[i]}&model=${models[i]}&nologo=true`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(imageUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ExamCompass/1.0',
                    'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*',
                    'Referer': 'https://examcompass.pages.dev/'
                }
            });
            clearTimeout(timeout);

            const contentType = response.headers.get('content-type');
            
            if (!response.ok || !contentType?.startsWith('image/')) {
                throw new Error(`Invalid response (${response.status} ${contentType})`);
            }

            const bufferData = await response.arrayBuffer();
            if (bufferData.byteLength < 5000) {
                throw new Error(`Response too small (${bufferData.byteLength} bytes) — likely not a real image`);
            }

            const { default: sharp } = await import('sharp');
            await sharp(Buffer.from(bufferData))
                .resize(1200, 630, { fit: 'cover' })
                .webp({ quality: 85 })
                .toFile(webpPath);

            console.log(`✅ Image saved: ${slug}.webp (${(bufferData.byteLength / 1024).toFixed(0)}KB)`);
            return `/blog-images/${slug}.webp`;
        } catch (err: any) {
            console.warn(`⚠️ Image attempt ${i + 1} failed: ${err.message?.substring(0, 80)}`);
            if (i < 2) {
                console.log("⏳ Waiting 10s before retry...");
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }

    console.log("🎨 Pollinations unavailable. Injecting high-quality static subject fallback...");
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
        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${item.class})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.targetSlug} (Exists).`);
            continue;
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);
        
        // --- STEP 1: GENERATE DYNAMIC SEO DESCRIPTION ---
        console.log("📑 Jules: Crafting unique SEO description...");
        let seoDescription = `Quick ${item.topic} Revision Notes & Recap for Class ${item.class} ${item.subject}. Peer-mentor notes, high-yield insights, and personal tricks to master the chapter fast.`;
        try {
            const seoCompletion = await groq.chat.completions.create({
                messages: [{ 
                    role: "system", 
                    content: "You are an SEO specialist. Write a high-click-through meta description (max 155 chars) for a blog post targeting 'Quick Revision' and 'Recap' keywords. Do not use quotes. Use active voice." 
                }, { 
                    role: "user", 
                    content: `Topic: ${item.topic}, Subject: ${item.subject}, Class: ${item.class}. Focus: Quick Revision, Formula Recap, Short Notes.` 
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
            
        const systemPrompt = `You are Ayush's senior content editor. Peer mentor style. Min 2500 words. Rule: Do not write any conclusion paragraphs. End the article abruptly after the final content section. Content must be high-yield, extremely scannable, and serve as a "Quick Revision & Recap" alternative to traditional PDF notes. Follow BLOG_RULES.md strictly. Focus on tables, bold terms, and quick-scan headers.`;
        const userPrompt = `TOPIC: ${item.topic}, SUBJECT: ${item.subject}, CLASS: ${item.class}. Generate bodies starting with Quick Recall Box. Style: "Quick Revision & Recap". Include Ayush's Personal Note (1st person), ${promptAdditions} Highlight "Trap Exceptions" for quick review. DO NOT include closing remarks.`;

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

                    const finalMarkdown = `---
title: "${item.topic} Class ${cleanClass} Quick Revision Notes & Recap — Exam Compass"
description: "${seoDescription}"
category: "${item.subject}"
keywords: "${item.topic} quick revision, ${item.topic} recap notes, class ${cleanClass} ${item.subject} summary, quick notes, Exam Compass"
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
                
                const finalMarkdown = `---
title: "${item.topic} Class ${cleanClass} Quick Revision Notes & Recap — Exam Compass"
description: "${seoDescription}"
category: "${item.subject}"
keywords: "${item.topic} quick revision, ${item.topic} recap notes, class ${cleanClass} ${item.subject} summary, quick notes, Exam Compass"
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
