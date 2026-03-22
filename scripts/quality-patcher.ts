/**
 * Quality Patcher Script
 * Automatically fixes "missing parts" (MCQs, word count) in existing blogs using LLM.
 * Targets the 5 lowest-scoring blogs each run.
 * 
 * Run: npx tsx scripts/quality-patcher.ts
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

// Reuse the extraction logic from our previous script
function parseMarkdownToJSON(content: string, slug: string): BlogPostJSON | null {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) return null;

    const frontmatter = fmMatch[1];
    const body = content.slice(fmMatch[0].length);

    const getValue = (key: string) => {
        const match = frontmatter.match(new RegExp(`${key}:\\s*"(.+?)"`));
        return match ? match[1] : "";
    };

    const title = getValue('title');
    const subject = getValue('category');
    const date = getValue('date');
    const practice_link = getValue('practice_link');

    const sections: any[] = [];
    const sectionParts = body.split(/\n##\s+/);
    
    let intro = "";
    if (sectionParts[0].includes('## What is')) {
        const introMatch = sectionParts[0].match(/## What is .+?\?\r?\n\r?\n([\s\S]+)/);
        intro = introMatch ? introMatch[1].trim() : sectionParts[0].trim();
    } else {
        intro = sectionParts[0].replace(/^# .+\r?\n\r?/, '').trim();
    }

    for (let i = 1; i < sectionParts.length; i++) {
        const part = sectionParts[i];
        if (part.startsWith('MCQs') || part.startsWith('Quick Recall Box')) continue;

        const lines = part.split('\n');
        const heading = lines[0].trim();
        let bodyText = lines.slice(1).join('\n').trim();
        
        // Basic table extraction
        let table: any = undefined;
        if (bodyText.includes('| --- |')) {
            const tableLines = bodyText.match(/\|.+\|/g);
            if (tableLines && tableLines.length > 2) {
                const headers = tableLines[0].split('|').map(s => s.trim()).filter(s => s);
                const rows = tableLines.slice(2).map(r => r.split('|').map(s => s.trim()).filter(s => s));
                table = { headers, rows };
                bodyText = bodyText.replace(/\|[\s\S]+\|/g, '').trim();
            }
        }
        sections.push({ heading, body: bodyText, table });
    }

    const recall: string[] = [];
    const recallSection = sectionParts.find(p => p.startsWith('Quick Recall Box'));
    if (recallSection) {
        const lines = recallSection.split('\n').slice(1);
        lines.forEach(l => {
            if (l.trim().startsWith('-')) recall.push(l.replace('-', '').trim());
        });
    }

    const mcqs: any[] = [];
    const mcqSection = sectionParts.find(p => p.startsWith('MCQs'));
    if (mcqSection) {
        const chunks = mcqSection.split(/\r?\n\r?\n\*\*(\d+)\.\s+/);
        for (let j = 1; j < chunks.length; j += 2) {
            if (!chunks[j+1]) continue;
            const question = chunks[j+1].split('\n')[0].trim();
            const rest = chunks[j+1];
            const options = (rest.match(/^[A-D]\) .+/gm) || []).map(o => o.trim());
            const answerMatch = rest.match(/\*\*Answer:\*\* ([A-D])\) (.+)/);
            if (answerMatch) {
                mcqs.push({
                    question,
                    options,
                    answer: answerMatch[1],
                    answer_text: answerMatch[2]
                });
            }
        }
    }

    const classMatch = slug.match(/class-(\d+)/);
    const numericClass = classMatch ? parseInt(classMatch[1]) : 11;
    const topic = slug.split('-revision-notes')[0].replace(/-class-\d+/, '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    return {
        title, slug, subject, chapter_name: topic,
        exam_class: numericClass, last_updated: date,
        practice_link_path: practice_link,
        hero_image: "/blog-images/" + slug + ".webp",
        content: { intro, sections, mcqs, quick_recall: recall }
    };
}

async function patchBlog(blog: BlogPostJSON) {
    console.log(`🛠️ Patching ${blog.slug}...`);
    
    const missingMCQs = blog.content.mcqs.length < 5;
    const missingAyush = !JSON.stringify(blog.content).toLowerCase().includes("ayush's note");
    const missingTraps = !JSON.stringify(blog.content).toLowerCase().includes("trap questions");

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert JEE/NEET teacher and a successful student. Generate missing content in JSON format. Rules: 1. Voice: First-person student mentor (Ayush). 2. Detail: Highly technical, deep 2000-word context. 3. STRICT: No conclusion phrases. No generic openings. No 'Delve into'." },
                { role: "user", content: `Chapter: ${blog.chapter_name}, Class: ${blog.exam_class}, Subject: ${blog.subject}. 
                
                Requirements:
                - Generate 'intro': A deep, 400-word opening covering the weightage and exam context. (STRING)
                ${missingAyush ? "- Generate 'ayush_note': Experimental student mistakes and hacks (min 150 words). (STRING)" : ""}
                ${missingTraps ? "- Generate 'trap_questions': 3 specific exam traps. (STRING)" : ""}
                ${missingMCQs ? `- Generate ${5 - blog.content.mcqs.length} MORE MCQs (Total min 5).` : ""}
                - Provide one extra 'deep_section' with heading/body/table.
                
                Format: { "intro": "...", "ayush_note": "...", "trap_questions": "...", "mcqs": [...], "deep_section": { "heading": "...", "body": "..." } }` }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });

        const patchData = JSON.parse(completion.choices[0]?.message?.content || "{}");
        
        // Coerce types to avoid [object Object]
        const getString = (val: any) => typeof val === 'string' ? val : (val ? JSON.stringify(val) : "");

        if (patchData.intro) blog.content.intro = getString(patchData.intro);
        
        if (patchData.ayush_note) {
            blog.content.sections.unshift({ 
                heading: "Ayush's Note — The Mistake I Made", 
                body: getString(patchData.ayush_note) 
            });
        }
        
        if (patchData.trap_questions) {
            blog.content.sections.push({ 
                heading: "Trap Questions & Exceptions to Watch Out For", 
                body: getString(patchData.trap_questions) 
            });
        }

        if (patchData.mcqs && Array.isArray(patchData.mcqs)) {
            blog.content.mcqs = [...blog.content.mcqs, ...patchData.mcqs].slice(0, 10);
        }

        if (patchData.deep_section) {
            blog.content.sections.push({
                heading: getString(patchData.deep_section.heading || "Deep Dive Analysis"),
                body: getString(patchData.deep_section.body || ""),
                table: patchData.deep_section.table 
            });
        }
        
        console.log(`   ✅ Content expanded safely.`);
    } catch (e: any) {
        console.error(`   ❌ Failed to patch via LLM: ${e.message}`);
    }
}

async function start() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const candidates: { json: BlogPostJSON, score: number, filePath: string }[] = [];

    console.log(`🚀 Analyzing ${files.length} blogs for quality gaps...`);

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const json = parseMarkdownToJSON(content, file.replace('.md', ''));
        
        if (json) {
            const report = checkBlogQuality(json);
            candidates.push({ json, score: report.score, filePath });
        }
    }

    // Sort by lowest score
    candidates.sort((a, b) => a.score - b.score);
    
    const worst5 = candidates.slice(0, 5);
    console.log(`Worst 5 candidates identified (Scores: ${worst5.map(c => c.score).join(', ')})`);

    for (const item of worst5) {
        await patchBlog(item.json);
        const updatedMarkdown = jsonToMarkdown(item.json);
        fs.writeFileSync(item.filePath, updatedMarkdown);
    }

    console.log(`\n🎉 Quality Patch Complete!`);
}

start();
