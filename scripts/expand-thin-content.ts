/**
 * 🔧 Thin Content Expander — Expands 4 critically thin blogs to ≥800 words
 * 
 * Uses Groq LLM to generate additional academic content for blogs that are
 * below the 800-word minimum threshold.
 * 
 * Run: npx tsx scripts/expand-thin-content.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { godSafeParse } from './utils/god-json.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
    groq = new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
    console.log(`🔄 Rotating to Groq Key #${currentKeyIndex + 1}...`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callLlm(system: string, user: string, attempt = 1): Promise<string | null> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            max_tokens: 3000,
            temperature: 0.7
        });
        return completion.choices[0]?.message?.content || null;
    } catch (err: any) {
        if (attempt < GROQ_KEYS.length) {
            console.warn(`⚠️ Key #${currentKeyIndex + 1} error: ${err.message?.substring(0, 50)}`);
            rotateKey();
            await sleep(2000);
            return callLlm(system, user, attempt + 1);
        }
        return null;
    }
}

// Target files: all below 800 words
const THIN_FILES = [
    'jee-advanced-math-difficulty-trends-class-11-revision-notes-jee-neet.md',
    'jee-mains-chemistry-repeated-concepts-class-11-revision-notes-neet.md',
    'planning-in-india-class-11-revision-notes-jee-neet.md',
    'structure-of-the-atom-class-11-revision-notes-neet.md'
];

async function expandBlog(file: string) {
    const fp = path.join(BLOG_DIR, file);
    if (!fs.existsSync(fp)) { console.log(`SKIP: ${file} not found`); return; }
    
    let content = fs.readFileSync(fp, 'utf-8');
    
    // Extract frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) { console.log(`SKIP: ${file} has no frontmatter`); return; }
    
    const frontmatter = fmMatch[1];
    const body = fmMatch[2];
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    
    // Extract title
    const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
    const title = titleMatch ? titleMatch[1] : file.replace(/-/g, ' ').replace('.md', '');
    
    console.log(`\n📝 Expanding: ${file}`);
    console.log(`   Current: ${wordCount} words → Target: 900+ words`);
    console.log(`   Need: ~${Math.max(200, 900 - wordCount)} more words`);
    
    const wordsNeeded = Math.max(200, 900 - wordCount);
    
    const response = await callLlm(
        `You are a GRANDMASTER academic content writer. You write authoritative revision notes for Indian competitive exams (JEE/NEET/CBSE). Your content is precise, exam-focused, and uses LaTeX for formulas.

RULES:
- Write in academic markdown
- Use LaTeX with $...$ for inline and $$...$$ for block math
- Include practical exam tips
- Be specific — no filler content
- Do NOT repeat existing content — write NEW unique sections`,
        
        `I need you to generate ${wordsNeeded}+ words of HIGH QUALITY additional content for this blog:

TITLE: ${title}
EXISTING CONTENT (summary):
${body.substring(0, 1500)}

Generate 2-3 NEW sections that complement the existing content. Ideas:
- "🪤 Common Mistakes That Cost Marks" (5 bullet points)
- "🔁 Last 5 Minutes Revision Box" (key formulas/facts)  
- "📝 Practice MCQs" (3-4 MCQs with answers)
- "⚡ Quick Comparison Table" (if applicable)

Return JSON: {"sections": "full markdown content with ## headings, LaTeX formulas, and bullet points"}`
    );
    
    if (!response) {
        console.log(`   ❌ LLM returned null — skipping`);
        return;
    }
    
    const parsed = godSafeParse(response);
    if (!parsed?.sections || parsed.sections.length < 100) {
        console.log(`   ❌ Parsed content too short — skipping`);
        return;
    }
    
    // Append the new sections
    const newContent = frontmatter + body.trimEnd() + '\n\n' + parsed.sections.trim() + '\n';
    const newWordCount = newContent.replace(/^---[\s\S]*?---\n*/m, '').split(/\s+/).filter((w: string) => w.length > 0).length;
    
    fs.writeFileSync(fp, newContent);
    console.log(`   ✅ Expanded: ${wordCount} → ${newWordCount} words (+${newWordCount - wordCount})`);
}

async function main() {
    console.log('🔧 Thin Content Expander v1.0');
    console.log(`📋 Processing ${THIN_FILES.length} files...\n`);
    
    for (const file of THIN_FILES) {
        await expandBlog(file);
        await sleep(2000); // Rate limiting
    }
    
    console.log('\n═══════════════════════════════════════════');
    console.log('✨ Thin content expansion complete!');
    console.log('═══════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
