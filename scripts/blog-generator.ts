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
    "mixtral-8x7b-32768",
    "llama-3.1-8b-instant"
];

const GROQ_PROMPT_MODEL = "llama-3.1-8b-instant"; // Fast model for image prompts

async function downloadHeroImage(subject: string, topic: string, slug: string): Promise<string> {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return `/blog-images/${slug}.webp`;

    console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);

    const artPromptUser = `Describe a mesmerizing, scientific, 8k cinematic 3D illustration of "${topic}" for a ${subject} student blog. Focus on colors and educational clarity. No text.`;
    
    let artDirection = `A professional scientific diagram of ${topic} for ${subject} students.`;
    
    try {
        const promptGen = await groq.chat.completions.create({
            messages: [{ role: "user", content: artPromptUser }],
            model: GROQ_PROMPT_MODEL, // Use cheaper model for prompts
            max_tokens: 150
        });
        artDirection = promptGen.choices[0]?.message?.content || artDirection;
    } catch (e) {
        console.warn("⚠️ Groq prompt gen failed, using fallback art direction.");
    }

    const seeds = [Math.floor(Math.random() * 10000), 42, 1234];
    const models = ['flux', 'turbo', 'pro'];

    for (let i = 0; i < 3; i++) {
        try {
            console.log(`🖌️ Image Attempt ${i + 1}/3 (Model: ${models[i]})...`);
            const encodedPrompt = encodeURIComponent(artDirection);
            const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=563&seed=${seeds[i]}&model=${models[i]}&nologo=true`;

            const response = await fetch(imageUrl);
            const contentType = response.headers.get('content-type');
            
            if (!response.ok || !contentType?.startsWith('image/')) {
                throw new Error(`Invalid response (${response.status} ${contentType})`);
            }

            const bufferBuffer = await response.arrayBuffer();
            const { default: sharp } = await import('sharp');
            await sharp(Buffer.from(bufferBuffer))
                .resize(1000, 563)
                .webp({ quality: 80 })
                .toFile(webpPath);

            console.log(`✅ Image saved: ${slug}.webp`);
            return `/blog-images/${slug}.webp`;
        } catch (err: any) {
            console.warn(`⚠️ Image attempt ${i + 1} failed: ${err.message}`);
        }
    }

    console.error("❌ All image generation retries failed, using fallback.");
    return `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200&h=630`;
}

async function generateBlogs() {
    console.log(`🤖 Jules: Starting Blog Generation (Queued)...`);

    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 No queue found. Run chapter-queue-builder first.");
        return;
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));

    for (const item of queue) {
        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${item.class})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.targetSlug} (File already exists).`);
            continue;
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);
        
        const systemPrompt = `You are Ayush's senior content editor at Exam Compass. 
        IDENTITY: Peer mentor, student who cracked JEE/NEET. 
        STYLE: Peer-to-peer, detailed, data-driven, use LaTeX.
        RULES: Follow BLOG_RULES.md precisely. Min 2000 words.
        FORBIDDEN: "In conclusion", "Delve into", "Needless to say", corporate fluff.`;

        const userPrompt = `
        TOPIC: ${item.topic}
        SUBJECT: ${item.subject}
        CLASS: ${item.class}
        TASK: Generate BODY content for a blog post. START with "Quick Recall Box". 
        Include: Table of Contents, JEE/NEET data, Core Concepts (Tables/LaTeX), Ayush's Note, Shortcut Formula, Trap Questions, 5-10 Practice MCQs, Related Notes Links, Final Expert Insight.
        AIM FOR 2500+ WORDS.
        `;

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
description: "Master ${item.topic} for ${item.class} ${item.subject} with peer-mentor notes, JEE/NEET data, and personal tips."
keywords: "${item.topic} notes, ${item.class} ${item.subject}, JEE ${item.topic}, NEET ${item.topic}, Exam Compass"
---

# ${item.topic} ${item.class} Notes for ${item.subject}

![${item.topic} revision notes for ${item.class} students](${heroImagePath})

*Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

${content}

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
                    fs.writeFileSync(filePath, finalMarkdown);
                    console.log(`✅ Success: ${item.targetSlug}.md saved (${finalMarkdown.length} chars).`);
                    success = true;
                    break;
                }
            } catch (err: any) {
                if (err?.status === 429) {
                    console.warn(`⚠️ 429 Rate Limit on ${model}. Trying next model...`);
                } else {
                    console.error(`❌ Error with ${model}:`, err.message);
                    break; 
                }
            }
        }
    }

    console.log("\n🎊 Jules: All blogs in queue processed!");
}

generateBlogs().catch(err => {
    console.error("❌ Jules Fatal Error:", err);
    process.exit(1);
});
