import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { standardizeMarkdown } from './utils/jules-quality';

dotenv.config();

const keys = [
  process.env.GROQ_API_KEY,
  process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5,
  process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: keys[currentKeyIndex] });

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blogs');

function parseFile(content: string) {
  const normalized = content.replace(/\r\n/g, '\n');
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = normalized.match(frontmatterRegex);
  if (match) {
    const fm = match[1];
    const body = match[2];
    const dateMatch = fm.match(/date:\s*['"]?([^'"]+)['"]?/);
    const date = dateMatch ? dateMatch[1].trim() : '1970-01-01';
    const titleMatch = fm.match(/title:\s*["'](.+?)["']/);
    const title = titleMatch ? titleMatch[1] : '';
    const categoryMatch = fm.match(/category:\s*["']?(.+?)["']?\s*$/m);
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    const heroMatch = fm.match(/heroImage:\s*["']?(.+?)["']?\s*$/m);
    const heroImage = heroMatch ? heroMatch[1].trim() : '';
    const practiceMatch = fm.match(/practice_link:\s*["']?(.+?)["']?\s*$/m);
    const practice_link = practiceMatch ? practiceMatch[1].trim() : '';
    return { frontmatter: `---\n${fm}\n---`, body, date, title, category, heroImage, practice_link };
  }
  return { frontmatter: '', body: content, date: '1970-01-01', title: '', category: '', heroImage: '', practice_link: '' };
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  console.log('  🔄 Key rotation → index ' + currentKeyIndex);
  groq = new Groq({ apiKey: keys[currentKeyIndex] });
}

async function fixBlogContent(body: string, title: string, category: string, retries = 5): Promise<string> {
  const rulesPath = path.join(process.cwd(), 'BLOG_RULES.md');
  const rules = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf-8').slice(0, 2000) : '';

  // Subject Guard: Force correct category based on title
  let correctedCategory = category;
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('limit') || lowerTitle.includes('derivative') || lowerTitle.includes('matrix') || lowerTitle.includes('determinant') || lowerTitle.includes('integral')) {
    correctedCategory = 'Mathematics';
  } else if (lowerTitle.includes('chemistry') || lowerTitle.includes('metallurgy') || lowerTitle.includes('atom') || lowerTitle.includes('solution')) {
    correctedCategory = 'Chemistry';
  } else if (lowerTitle.includes('physics') || lowerTitle.includes('current') || lowerTitle.includes('optics') || lowerTitle.includes('motion')) {
    correctedCategory = 'Physics';
  }

  // Pre-processing: Strip redundant footers and AI boilerplate
  let cleanBody = body
    .replace(/---[\s\S]*?curated by Jules[\s\S]*?---/gi, '')
    .replace(/\*This post was curated by Jules[\s\S]*?\*/gi, '')
    .trim();

  const prompt = `You are a top 1% JEE/NEET ranker (Ayush's senior editor). You are rewriting this blog into the "GRANDMASTER QUICK REVISION" format.
  
  SUBJECT: ${correctedCategory}
  TOPIC: ${title}

  STRICT CONTENT RULES:
  1. NO LONG PARAGRAPHS. If a paragraph is longer than 3 lines, break it into bullet points.
  2. SCANNABLE DEPTH: Don't just list topics. Explain the "Why" and "How" using short, punchy sentences.
  3. $$LaTeX$$: Every formula MUST be in LaTeX. Double-escape backslashes (e.g. \\\\frac).
  4. VOICE: Peer mentor. Mention "I used to get confused by..." or "The trick I used was...".

  MANDATORY SECTIONS (MUST GENERATE IN THIS ORDER):

  1. "## 🚀 Quick Recall" — EXACTLY 5-7 high-yield bullet points summarizing the entire chapter for 5-minute revision. DO NOT SKIP.
  
  2. "## 🎯 What WILL Come" — Specific exam data and frequencies based on last 5 years.

  3. "## 📚 Detailed Revision Notes" — This is the meat.
     - Use ### subheadings for every sub-topic.
     - Under each ###, provide 1-2 punchy theory sentences followed by a bulleted list of 5+ facts/properties.
     - High-yield formulas in $$LaTeX$$.
     - "Ayush's Pro-Tip" in italics.

  4. "## 🪤 The 5 Trap Mistakes" — Format: **Mistake:** [Description] | **Fix:** [How to avoid].

  5. "## ✏️ 3 Solved PYQs" — Step-by-step solutions for real past questions.

  6. "## 👁️ Ayush's Note" — A personal story or unique pattern you noticed in last 10 years of papers.

  7. "## 🔁 Last 5 Minutes Box" — 3 hard formulas + 2 final traps.

  OUTPUT: Return ONLY markdown body. No frontmatter. No intro text.

  SOURCE TEXT:
  ${cleanBody}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2, // Lower temperature for more factual consistency
      max_tokens: 7800,
    });
    return chatCompletion.choices[0]?.message?.content || body;
  } catch (error: any) {
    const msg = error?.message || '';
    if ((error?.status === 429 || msg.includes('rate_limit')) && retries > 0) {
      rotateKey();
      await new Promise(r => setTimeout(r, 5000));
      return fixBlogContent(body, title, category, retries - 1);
    }
    return body;
  }
}

async function main() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

  const fileData = files.map(file => {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseFile(content);
    return { name: file, path: filePath, ...parsed };
  });

  fileData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent10 = fileData.slice(0, 10);
  console.log(`\n🚀 Jules: Performing DETAILED QUICK REVISION fix on 10 most recent blogs...\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < recent10.length; i++) {
    const file = recent10[i];
    process.stdout.write(`[${i + 1}/10] ${file.name.padEnd(50)} `);

    let correctedCategory = file.category;
    const lowerTitle = file.title.toLowerCase();
    if (lowerTitle.includes('limit') || lowerTitle.includes('derivative') || lowerTitle.includes('matrix') || lowerTitle.includes('determinant') || lowerTitle.includes('integral')) {
      correctedCategory = 'Mathematics';
    }

    const fixedBody = await fixBlogContent(file.body, file.title, correctedCategory);

    if (fixedBody && fixedBody.length > 1000) {
      let newFm = file.frontmatter;
      if (correctedCategory !== file.category) {
        newFm = newFm.replace(/category:\s*(["']?).*?\1/m, `category: "${correctedCategory}"`);
      }

      // Standardize the content structure
      const standardizedBody = standardizeMarkdown(fixedBody.trim(), {
        title: file.title,
        heroImage: file.heroImage || `/blog-images/${file.name.replace('.md', '.webp')}`,
        lastUpdated: file.date,
        practiceLink: file.practice_link || `/class-11/physics/${file.name.replace('.md', '')}`
      });
      
      const fullContent = `${newFm}\n\n${standardizedBody}\n`;
      fs.writeFileSync(file.path, fullContent, 'utf-8');
      console.log(`✅ ${standardizedBody.length} chars`);
      updated++;
    } else {
      console.log('❌ failed');
      failed++;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Updated : ${updated}`);
  console.log(`❌ Failed  : ${failed}`);
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);
