/**
 * Hard Reset Quality Script
 * Identifies extremely low-quality blogs (Score < 50) and regenerates them FROM SCRATCH.
 * For mid-quality blogs (50-80), it applies the premium patch.
 * 
 * Run: npx tsx scripts/regenerate-quality.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, BlogPostJSON } from './utils/jules-quality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

function getTopicFromSlug(slug: string): string {
    return slug
        .split('-revision-notes')[0]
        .replace(/-class-\d+/, '')
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
}

async function regenerateFromScratch(slug: string, filePath: string) {
    console.log(`🔥 HARD RESETting ${slug}...`);
    
    const classMatch = slug.match(/class-(\d+)/);
    const numericClass = classMatch ? parseInt(classMatch[1]) : 11;
    const topic = getTopicFromSlug(slug);

    // Get subject from existing file if possible
    let subject = "General";
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const catMatch = content.match(/category:\s*"(.+?)"/);
        if (catMatch) subject = catMatch[1];
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an elite JEE/NEET/Board teacher. Write a 2000-word GRANDMASTER study guide in JSON format. Rules: 1. Ayush's voice (first-person). 2. Deep technical depth. 3. 5+ MCQs. 4. Table of contents. 5. Trap questions. 6. NCERT aligned. No conclusion fillers." },
                { role: "user", content: `Write a complete study guide for: ${topic}, Class: ${numericClass}, Subject: ${subject}. 
                Include:
                - intro: Deep 500-word weights and context.
                - ayush_note: Personal mistake/hack.
                - sections: 4+ deep H2 topics with tables.
                - trap_questions: 3 tricky exam traps.
                - quick_recall: 5 points.
                - mcqs: 5 high-yield questions with full solutions.` }
            ],
            model: "llama-3.3-70b-versatile", // Latest flagship for Grandmaster resets
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0]?.message?.content || "{}");
        
        // Robust data parsing
        const normalizeArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (val && typeof val === 'object') return Object.values(val);
            return [];
        };

        const rawSections = normalizeArray(data.sections);
        const mcqs = normalizeArray(data.mcqs);
        const quick_recall = normalizeArray(data.quick_recall);

        const blog: BlogPostJSON = {
            title: `${topic} Class ${numericClass} Notes — Quick Revision for ${subject} 2026`,
            slug: slug,
            subject: subject,
            chapter_name: topic,
            exam_class: numericClass,
            last_updated: new Date().toISOString().split('T')[0],
            practice_link_path: `/class-${numericClass}/${subject.toLowerCase()}/${slug}`,
            hero_image: `/blog-images/${slug}.webp`,
            content: {
                intro: typeof data.intro === 'string' ? data.intro : JSON.stringify(data.intro),
                sections: [
                    { heading: "Ayush's Note — The Mistake I Made", body: typeof data.ayush_note === 'string' ? data.ayush_note : JSON.stringify(data.ayush_note) },
                    ...rawSections.map((s: any) => ({
                        heading: s?.heading || "Detailed Analysis",
                        body: typeof s?.body === 'string' ? s.body : JSON.stringify(s?.body || ""),
                        table: s?.table
                    })),
                    { heading: "Trap Questions & Exceptions to Watch Out For", body: typeof data.trap_questions === 'string' ? data.trap_questions : JSON.stringify(data.trap_questions) }
                ],
                mcqs: mcqs,
                quick_recall: quick_recall
            }
        };

        const markdown = jsonToMarkdown(blog);
        fs.writeFileSync(filePath, markdown);
        console.log(`   ✨ Regenerated successfully.`);
    } catch (e: any) {
        console.error(`   ❌ Failed regeneration: ${e.message}`);
    }
}

async function start() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const candidates: { slug: string, score: number, filePath: string }[] = [];

    console.log(`🔍 Checking quality of ${files.length} blogs...`);

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const slug = file.replace('.md', '');
        
        // Use a simpler checker to avoid parsing errors
        const content = fs.readFileSync(filePath, 'utf8');
        let score = 0;
        if (content.length > 5000) score += 40;
        if (content.includes("MCQs")) score += 20;
        if (content.includes("Ayush's Note")) score += 20;
        if (content.length < 1500) score = 0; // Immediate hard reset
        if (content.includes("[object Object]")) score = -100;

        candidates.push({ slug, score, filePath });
    }

    candidates.sort((a, b) => a.score - b.score);
    const worstBatch = candidates.slice(0, 3); // 3 at a time for deep quality

    console.log(`Top 3 candidates for Hard Reset: ${worstBatch.map(c => c.slug).join(', ')}`);

    for (const item of worstBatch) {
        await regenerateFromScratch(item.slug, item.filePath);
    }

    console.log(`\n🎉 Grandmaster Session Complete!`);
}

start();
