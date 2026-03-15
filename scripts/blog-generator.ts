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

async function downloadHeroImage(subject: string, topic: string, slug: string) {
    const imagePath = path.join(IMAGE_DIR, `${slug}.png`);
    if (fs.existsSync(imagePath)) return `/blog-images/${slug}.png`;

    try {
        console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);
        
        // 1. Generate a "Master Illustrator" Prompt using Groq
        const promptGen = await groq.chat.completions.create({
            messages: [{
                role: "system",
                content: "You are a world-class 3D scientific illustrator. Your style is: dark mode, neon-lit, 3D holographic diagrams, cinematic lighting, 8k resolution, minimalist but detailed."
            }, {
                role: "user",
                content: `Generate a detailed midjourney-style image prompt for a hero image about the topic: "${topic}" for ${subject}. 
                Instructions:
                - Focus on: A 3D scientific diagram or abstract conceptual illustration.
                - Colors: Neon cyan, purple, and electric blue.
                - Background: Dark, deep black, professional.
                - Style: High-tech, futuristic, educational but stunning.
                - NO TEXT in the image.
                - Output ONLY the prompt text, nothing else.`
            }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7
        });

        const artPrompt = promptGen.choices[0]?.message?.content || `${topic} scientific diagram, neon, 3D, dark background`;
        console.log(`✍️ Art Direction: ${artPrompt.substring(0, 100)}...`);

        // 2. Fetch the image from a high-quality AI provider (Flux / SDXL)
        const encodedPrompt = encodeURIComponent(artPrompt);
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1200&height=630&seed=${Math.floor(Math.random() * 100000)}&model=flux`;

        const response = await fetch(imageUrl);
        const contentType = response.headers.get('content-type');
        
        if (!response.ok || !contentType || !contentType.startsWith('image/')) {
            throw new Error(`Invalid image response: ${response.status} ${contentType}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(imagePath, Buffer.from(buffer));
        
        console.log(`✅ Hero image created: ${slug}.png`);
        return `/blog-images/${slug}.png`;
    } catch (err) {
        console.error("❌ Image generation failed, using fallback:", err);
        return "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200&h=630"; // Better abstract fallback
    }
}

async function generateBlogs() {
    console.log("🤖 Jules: Starting Blog Generation (Groq 70B Versatile)...");

    // 1. Read Queue
    if (!fs.existsSync(QUEUE_FILE)) {
        console.error("❌ No queue.json found. Run Task 1 first!");
        process.exit(1);
    }
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));

    // 2. Read Rules
    const blogRules = fs.readFileSync(BLOG_RULES_FILE, 'utf8');

    for (const item of queue) {
        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${item.class})`);
        
        // 3. Create Hero Image with AI Prompt
        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);
        
        const prompt = `
        TOPIC: ${item.topic}
        SUBJECT: ${item.subject}
        CLASS: ${item.class}
        TARGET_SLUG: ${item.targetSlug}
        HERO_IMAGE: ${heroImagePath}
        DATE: ${new Date().toISOString().split('T')[0]}

        ACT AS: Ayush's senior content editor at Exam Compass. 
        IDENTITY: Peer mentor, student who cracked JEE/NEET. 
        RULES: Follow BLOG_RULES.md strictly.

        RULES CONTENT:
        ${blogRules}

        TASK: 
        Generate a high-quality blog post in Markdown format for the given topic. 
        Ensure you include ALL 10 mandatory sections from BLOG_RULES.md.
        Maintain student peer-mentor voice. No corporate jargon. No NCERT paraphrasing.
        Embed 5+ MCQs with solutions. 
        Embed Ayush's Note box with a personal mistake and fix.
        Add CSS classes as specified in rules.
        Use LaTeX for all formulas.
        Minimum word count for this type: 2000-3500 words. (BE DETAILED).

        IMAGE PLACEMENT:
        Place the HERO_IMAGE at the very top of the post (below SEO metadata) using this format:
        ![${item.topic} notes for ${item.class}](${heroImagePath})

        OUTPUT ONLY THE RAW MARKDOWN CONTENT.
        `;

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "You are an expert exam content editor. You write high-quality, SEO-optimized blog posts for students." },
                    { role: "user", content: prompt }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_completion_tokens: 8192,
                top_p: 1,
                stream: false
            });

            const content = chatCompletion.choices[0]?.message?.content;
            if (content) {
                const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
                fs.writeFileSync(filePath, content);
                console.log(`✅ Success: ${item.targetSlug}.md saved.`);
            }
        } catch (err) {
            console.error(`❌ Error generating ${item.topic}:`, err);
        }
    }

    console.log("\n🎊 Jules: All blogs in queue generated!");
}

generateBlogs().catch(err => {
    console.error("❌ Jules Fatal Error:", err);
    process.exit(1);
});
