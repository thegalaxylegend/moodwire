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

async function downloadHeroImage(subject: string, topic: string, slug: string): Promise<string> {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return `/blog-images/${slug}.webp`;

    console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);
    
    // Improved Subject-Specific Fallbacks
    const fallbacks: Record<string, string> = {
        'Biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=1000',
        'Physics': 'https://images.unsplash.com/photo-1636466497217-39a814035f42?auto=format&fit=crop&q=80&w=1000',
        'Chemistry': 'https://images.unsplash.com/photo-1532187875605-18d8d2170e9f?auto=format&fit=crop&q=80&w=1000',
        'Maths': 'https://images.unsplash.com/photo-1509228468518-180dd48219d8?auto=format&fit=crop&q=80&w=1000',
        'Mathematics': 'https://images.unsplash.com/photo-1509228468518-180dd48219d8?auto=format&fit=crop&q=80&w=1000'
    };

    const defaultFallback = fallbacks[subject] || fallbacks['Biology'];

    const artPromptUser = `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, 8k, no text.`;
    
    const seeds = [Math.floor(Math.random() * 10000), 42, 1234];
    const models = ['flux', 'turbo', 'pro'];

    for (let i = 0; i < 3; i++) {
        try {
            console.log(`🖌️ Image Attempt ${i + 1}/3 (Model: ${models[i]})...`);
            const encodedPrompt = encodeURIComponent(artPromptUser);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&seed=${seeds[i]}&model=${models[i]}&nologo=true`;

            const response = await fetch(imageUrl);
            const contentType = response.headers.get('content-type');
            
            if (!response.ok || !contentType?.startsWith('image/')) {
                throw new Error(`Invalid response (${response.status} ${contentType})`);
            }

            const bufferBuffer = await response.arrayBuffer();
            const { default: sharp } = await import('sharp');
            await sharp(Buffer.from(bufferBuffer))
                .resize(1200, 630, { fit: 'cover' })
                .webp({ quality: 85 })
                .toFile(webpPath);

            console.log(`✅ Image saved: ${slug}.webp`);
            return `/blog-images/${slug}.webp`;
        } catch (err: any) {
            console.warn(`⚠️ Image attempt ${i + 1} failed.`);
        }
    }

    console.error("❌ Pollinations blocked. Using high-quality theme fallback.");
    return defaultFallback;
}

async function generateBlogs() {
    console.log(`🤖 Jules: Starting Blog Generation (Queued)...`);

    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 No queue found.");
        return;
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));

    for (const item of queue) {
        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${item.class})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.targetSlug} (Exists).`);
            continue;
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);
        
        // --- STEP 1: GENERATE DYNAMIC SEO DESCRIPTION ---
        console.log("📑 Jules: Crafting unique SEO description...");
        let seoDescription = `Master ${item.topic} for ${item.class} ${item.subject} with peer-mentor notes, JEE/NEET data, and personal tips.`;
        try {
            const seoCompletion = await groq.chat.completions.create({
                messages: [{ 
                    role: "system", 
                    content: "You are an SEO specialist. Write a high-click-through meta description (max 155 chars) for a blog post. Do not use quotes. Use active voice." 
                }, { 
                    role: "user", 
                    content: `Topic: ${item.topic}, Subject: ${item.subject}, Class: ${item.class}. Target: JEE/NEET students.` 
                }],
                model: "llama-3.1-8b-instant",
                max_tokens: 100
            });
            seoDescription = seoCompletion.choices[0]?.message?.content?.replace(/"/g, '').trim() || seoDescription;
        } catch (e) {}

        const systemPrompt = `You are Ayush's senior content editor. Peer mentor style. Min 2500 words. Rule: No "In conclusion". Use LaTeX. Follow BLOG_RULES.md strictly.`;
        const userPrompt = `TOPIC: ${item.topic}, SUBJECT: ${item.subject}, CLASS: ${item.class}. Generate BODY starting with Quick Recall Box. Include Ayush's Personal Note (1st person), JEE/NEET data, Core Concepts, Formulae, MCQs.`;

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
                    content = content.replace(/^# .*\n/g, '').trim();

                    const finalMarkdown = `---
title: "${item.topic} ${item.class} Notes — Exam Compass"
description: "${seoDescription}"
category: "${item.subject}"
keywords: "${item.topic} notes, ${item.class} ${item.subject}, JEE ${item.topic}, NEET ${item.topic}, Exam Compass"
---

# ${item.topic} ${item.class} Notes for ${item.subject}

![${item.topic} notes for students](${heroImagePath})

*Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

${content}

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
                    fs.writeFileSync(filePath, finalMarkdown);
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
