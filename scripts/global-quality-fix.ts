/**
 * Global Quality Fix Script
 * Applies checkBlogQuality logic to ALL local blogs to ensure total consistency.
 * 
 * Run: npx tsx scripts/global-quality-fix.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkBlogQuality, jsonToMarkdown, BlogPostJSON } from './utils/jules-quality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

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

    // Extract Sections
    const sections: any[] = [];
    const sectionParts = body.split(/\n##\s+/);
    
    // Part 0 is intro (usually "What is [Topic]?")
    let intro = "";
    const introMatch = sectionParts[0].match(/## What is .+?\?\r?\n\r?\n([\s\S]+)/);
    if (introMatch) {
        intro = introMatch[1].trim();
    } else {
        intro = sectionParts[0].trim();
    }

    // Process other sections
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

    // Extract Recall
    const recall: string[] = [];
    const recallSection = sectionParts.find(p => p.startsWith('Quick Recall Box'));
    if (recallSection) {
        const lines = recallSection.split('\n').slice(1);
        lines.forEach(l => {
            if (l.trim().startsWith('-')) recall.push(l.replace('-', '').trim());
        });
    }

    // Extract MCQs
    const mcqs: any[] = [];
    const mcqSection = sectionParts.find(p => p.startsWith('MCQs'));
    if (mcqSection) {
        const chunks = mcqSection.split(/\r?\n\r?\n\*\*(\d+)\.\s+/);
        for (let j = 1; j < chunks.length; j += 2) {
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

    // Detect class
    const classMatch = slug.match(/class-(\d+)/);
    const numericClass = classMatch ? parseInt(classMatch[1]) : 11;

    // Detect topic (chapter name)
    const topic = slug.replace(/-class-\d+-notes$/, '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    return {
        title,
        slug,
        subject,
        chapter_name: topic,
        exam_class: numericClass,
        last_updated: date,
        practice_link_path: practice_link,
        hero_image: "/blog-images/" + slug + ".webp", // Approximate
        content: {
            intro,
            sections,
            mcqs,
            quick_recall: recall
        }
    };
}

async function start() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`🚀 Starting Global Quality Fix for ${files.length} blogs...`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const slug = path.basename(file, '.md');

        const json = parseMarkdownToJSON(originalContent, slug);
        if (!json) {
            console.log(`❌ Failed to parse ${file}`);
            errorCount++;
            continue;
        }

        const report = checkBlogQuality(json);
        
        if (report.auto_fixed.length > 0) {
            console.log(`✅ Fixed ${file}: ${report.auto_fixed.map(f => f.field).join(', ')}`);
            const updatedMarkdown = jsonToMarkdown(json);
            fs.writeFileSync(filePath, updatedMarkdown);
            fixedCount++;
        }
        
        if (report.critical_failures.length > 0) {
            console.log(`⚠️ Quality Alert for ${file}: [${report.score}/100] ${report.critical_failures[0]}`);
        }
    }

    console.log(`\n🎉 Audit Complete!`);
    console.log(`✨ Auto-fixed: ${fixedCount}`);
    console.log(`❌ Parse Errors: ${errorCount}`);
}

start();
