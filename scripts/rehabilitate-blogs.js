import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');

const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

async function rehabilitate() {
    console.log("🛠️ Starting Advanced Blog Rehabilitation...");
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const slug = file.replace('.md', '');

        console.log(`\n📄 Processing: ${file}`);

        // 1. Detect Subject
        let subject = 'General';
        const contentLower = content.toLowerCase() + slug.toLowerCase();
        if (contentLower.includes('biology') || contentLower.includes('plants') || contentLower.includes('animals') || contentLower.includes('cell')) subject = 'Biology';
        else if (contentLower.includes('physics') || contentLower.includes('motion') || contentLower.includes('energy') || contentLower.includes('force')) subject = 'Physics';
        else if (contentLower.includes('chemistry') || contentLower.includes('organic') || contentLower.includes('atoms') || contentLower.includes('elements')) subject = 'Chemistry';
        else if (contentLower.includes('math') || contentLower.includes('algebra') || contentLower.includes('trigonometry') || contentLower.includes('geometry')) subject = 'Mathematics';

        // 2. Fix/Add Frontmatter
        let frontmatter = {
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Master ${slug.replace(/-/g, ' ')} with peer-mentor notes, JEE/NEET data, and personal tips.`,
            category: subject,
            keywords: `${slug.replace(/-/g, ' ')}, ${subject}, Exam Compass`
        };

        const fmMatch = content.match(/---([\s\S]*?)---/);
        if (fmMatch) {
            const fmContent = fmMatch[1];
            const titleMatch = fmContent.match(/title:\s*["'](.*?)["']/);
            const descMatch = fmContent.match(/description:\s*["'](.*?)["']/);
            if (titleMatch) frontmatter.title = titleMatch[1];
            if (descMatch) frontmatter.description = descMatch[1];
            
            // Clean content by removing the old frontmatter for now
            content = content.replace(/---[\s\S]*?---/, '').trim();
        } else {
            // No frontmatter. Remove first H1 if it exists so we don't double it
            content = content.replace(/^# .*\n/g, '').trim();
        }

        // 3. Generate unique description if it's generic
        if (frontmatter.description.includes('Master ') && frontmatter.description.includes('with peer-mentor')) {
            console.log("   📝 Generating unique SEO description...");
            try {
                const seoCompletion = await groq.chat.completions.create({
                    messages: [{ 
                        role: "system", 
                        content: "Write a high-CTR meta description (max 155 chars) for a student study guide. Active voice. No quotes." 
                    }, { 
                        role: "user", 
                        content: `Topic: ${frontmatter.title}, Subject: ${subject}` 
                    }],
                    model: "llama-3.1-8b-instant",
                    max_tokens: 100
                });
                frontmatter.description = seoCompletion.choices[0]?.message?.content?.replace(/"/g, '').trim() || frontmatter.description;
            } catch (e) {
                console.warn("   ⚠️ Groq failed for desc.");
            }
        }

        // 4. Fix Images
        // If image is Unsplash, replace with local path so the repair script can catch it
        if (content.includes('unsplash.com')) {
            console.log("   🖼️ Marking Unsplash image for replacement...");
            content = content.replace(/\!\[.*?\]\(https:\/\/images\.unsplash\.com.*?\)/, `![${frontmatter.title} Notes](/blog-images/${slug}.webp)`);
        } else if (!content.includes('![') && !content.includes('.webp')) {
             // Missing image? Add placeholder
             content = `![${frontmatter.title} Notes](/blog-images/${slug}.webp)\n\n${content}`;
        }

        // 5. Remove junk
        content = content.replace(/##+ LaTeX Code[\s\S]*?(?=##|---|\Z)/g, '');
        content = content.replace(/^# #/gm, '#');

        // Reconstruct
        const newFileContent = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
category: "${frontmatter.category}"
keywords: "${frontmatter.keywords}"
---

# ${frontmatter.title}

${content}

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
        fs.writeFileSync(filePath, newFileContent);
    }

    console.log("\n✅ Rehabilitation complete.");
}

rehabilitate().catch(console.error);
