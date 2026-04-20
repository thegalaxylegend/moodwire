/**
 * 🔥 MASS BLOG REGENERATION v3.1 — Dual Provider (Groq + Gemini)
 * 
 * Uses Groq Llama-3.3-70B as PRIMARY (fast, reliable)
 * Falls back to Gemini 2.5 Flash if Groq fails
 * 
 * Usage:
 *   TEST (10 blogs):  npx tsx scripts/mass-regen-v3.ts --test
 *   ALL blogs:        npx tsx scripts/mass-regen-v3.ts --all
 *   RESUME:           npx tsx scripts/mass-regen-v3.ts --all --start=50
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORT_FILE = path.join(__dirname, '../jules-reports/regen-report.json');

// ═══════════════════════════════════════════════════
// API KEY POOLS
// ═══════════════════════════════════════════════════
const GROQ_KEYS = [
  process.env.VITE_GROQ_API_KEY,
  process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5,
  process.env.VITE_GROQ_API_KEY_6,
].filter(Boolean) as string[];

const GEMINI_KEYS = [
  process.env.VITE_GEMINI_API_KEY,
  process.env.VITE_GEMINI_API_KEY_2,
  process.env.VITE_GEMINI_API_KEY_3,
  process.env.VITE_GEMINI_API_KEY_4,
  process.env.VITE_GEMINI_API_KEY_5,
  process.env.VITE_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

let groqIdx = 0;
let geminiIdx = 0;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are a top 1% JEE/NEET/CBSE academic mentor. Generate a "Grandmaster Last-Night Revision Guide" in pure Markdown.

ABSOLUTE RULES:
1. Output ONLY pure GitHub-Flavored Markdown. NO JSON. NO HTML. NO code fences.
2. Use ## for H2 and ### for H3. Use bullet points (- ) for 80% of content.
3. Each bullet on its own line. Blank line between sections.
4. Target 2000-3000 words. You MUST write in extreme depth for every section to reach this target.

LaTeX RULES (CRITICAL):
1. Inline math: $\\frac{a}{b}$  Block math on own lines: $$E = mc^2$$
2. ALWAYS use backslash: \\frac \\sqrt \\times \\div \\alpha \\beta \\gamma \\delta \\theta \\sigma \\mu \\pi \\omega \\lambda \\infty \\partial \\left \\right \\sin \\cos \\tan \\log \\ln \\lim \\sum \\int \\prod \\leq \\geq \\neq \\approx \\equiv \\pm \\cdot \\vec \\bar \\hat \\overline \\text \\mathrm
3. ALWAYS use curly braces: \\frac{num}{den}, \\sqrt{x}
4. NEVER output raw words like "frac" "sqrt" "sigma" "alpha" without backslash
5. NEVER double-escape: \\frac NOT \\\\frac
6. NEVER leave math without $ delimiters

ANTI-CORRUPTION:
1. NO placeholder words (desert, sort, AR, CIRC) instead of LaTeX
2. NO truncation markers
3. NO squashing bullet points into one line

REQUIRED SECTIONS (in order):
1. ## ⚡ Formula Bank
2. ## 🪤 The 5 Mistakes That Cost Marks
3. ## ✏️ 3 Solved PYQs (full step-by-step solutions)
4. ## 🧠 The One Thing Most Students Get Wrong
5. ## 👁️ Ayush's Note
6. ## 🔁 Last 5 Minutes Box
7. ## 📝 Practice MCQs (5 MCQs, options on SEPARATE lines)

MCQ FORMAT:
**1. Question?**
- A) Option
- B) Option
- C) Option
- D) Option
**Answer: B) Explanation.**

VOICE: Direct, punchy, student-to-student. NO filler phrases.`;

// ═══════════════════════════════════════════════════
// BLOG REGISTRY
// ═══════════════════════════════════════════════════
interface BlogEntry { id: string; title: string; description: string; category: string; date: string; image: string; }

function loadBlogRegistry(): BlogEntry[] {
  const raw = fs.readFileSync(path.join(__dirname, '../src/data/blogs.ts'), 'utf-8');
  const entries: BlogEntry[] = [];
  const re = /\{\s*"id":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"description":\s*"([^"]+)",\s*"category":\s*"([^"]+)",\s*"date":\s*"([^"]+)",\s*"readTime":\s*"[^"]+",\s*"image":\s*"([^"]+)"\s*\}/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    entries.push({ id: m[1], title: m[2], description: m[3], category: m[4], date: m[5], image: m[6] });
  }
  return entries;
}

function extractMeta(blog: BlogEntry) {
  const titleCore = blog.title.split(' — ')[0].trim();
  const gradeMatch = titleCore.match(/Class\s+(\d+)/i);
  const grade = gradeMatch ? `Class ${gradeMatch[1]}` : 'Class 12';
  const numericClass = gradeMatch ? parseInt(gradeMatch[1]) : 12;
  let topic = titleCore;
  [grade, 'Revision', 'Exam Prep', 'Recap', 'Grandmaster Guide', 'Notes'].forEach(r => {
    topic = topic.replace(new RegExp(r, 'gi'), '');
  });
  const subjectPatterns: [RegExp, string][] = [
    [/Physics/i, 'Physics'], [/Chemistry/i, 'Chemistry'], [/Biology/i, 'Biology'],
    [/Mathematics|Maths/i, 'Mathematics'], [/Economics/i, 'Economics'],
    [/History/i, 'History'], [/Geography/i, 'Geography'],
    [/Computer|GATE|DBMS|Network|Operating/i, 'Computer Science'],
  ];
  let subject = 'General';
  for (const [pat, subj] of subjectPatterns) {
    if (pat.test(blog.title) || pat.test(blog.id)) { subject = subj; break; }
  }
  topic = topic.replace(new RegExp(subject, 'gi'), '').replace(/\s+/g, ' ').trim();
  if (!topic) topic = titleCore;
  return { topic, grade, numericClass, subject };
}

// ═══════════════════════════════════════════════════
// DUAL PROVIDER GENERATION
// ═══════════════════════════════════════════════════
async function callGroq(prompt: string): Promise<string | null> {
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    const key = GROQ_KEYS[groqIdx % GROQ_KEYS.length];
    groqIdx++;
    try {
      const client = new Groq({ apiKey: key });
      const result = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 8000,
      });
      const text = result.choices[0]?.message?.content;
      if (text && text.length > 500) return text;
    } catch (err: any) {
      const is429 = err.status === 429 || err.message?.includes('429');
      console.warn(`   ⚠️ Groq key ${(groqIdx-1)%GROQ_KEYS.length}: ${err.message?.slice(0,60)}`);
      if (is429) await sleep(3000);
      else await sleep(1000);
    }
  }
  return null;
}

async function callGemini(prompt: string): Promise<string | null> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = GEMINI_KEYS[geminiIdx % GEMINI_KEYS.length];
    geminiIdx++;
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.5, maxOutputTokens: 8192 } });
      const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${prompt}`);
      const text = result.response.text();
      if (text && text.length > 500) return text;
    } catch (err: any) {
      console.warn(`   ⚠️ Gemini key ${(geminiIdx-1)%GEMINI_KEYS.length}: ${err.message?.slice(0,60)}`);
      await sleep(2000);
    }
  }
  return null;
}

async function generate(blog: BlogEntry): Promise<string | null> {
  const { topic, grade, numericClass, subject } = extractMeta(blog);
  const boundary = numericClass <= 10
    ? `Stay within NCERT/CBSE ${grade} syllabus only.`
    : `Include JEE Advanced & NEET level shortcuts.`;
  
  const prompt = `Generate a complete Grandmaster Revision Guide for:
Topic: ${topic} | Subject: ${subject} | Grade: ${grade}
Target: ${numericClass <= 10 ? 'CBSE Board 2026' : 'JEE/NEET 2026'}
${boundary}
Output ONLY pure Markdown. Follow ALL rules exactly.`;

  // Try Groq first (fast), then Gemini (fallback)
  const groqResult = await callGroq(prompt);
  if (groqResult) return groqResult;
  
  console.log(`   🔄 Groq exhausted, trying Gemini...`);
  const geminiResult = await callGemini(prompt);
  if (geminiResult) return geminiResult;
  
  return null;
}

// ═══════════════════════════════════════════════════
// POST-PROCESSING & VALIDATION
// ═══════════════════════════════════════════════════
function postProcess(content: string): string {
  let f = content;
  f = f.replace(/^```(?:markdown)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();
  f = f.replace(/\\\\frac/g, '\\frac').replace(/\\\\sqrt/g, '\\sqrt')
    .replace(/\\\\times/g, '\\times').replace(/\\\\left/g, '\\left')
    .replace(/\\\\right/g, '\\right').replace(/\\\\text/g, '\\text');
  
  const s = (f.match(/(?<!\$)\$(?!\$)/g) || []).length;
  if (s % 2 !== 0) f += '$';
  const d = (f.match(/\$\$/g) || []).length;
  if (d % 2 !== 0) f += '\n$$\n';
  const ob = (f.match(/\{/g) || []).length;
  const cb = (f.match(/\}/g) || []).length;
  if (ob > cb) f += '}'.repeat(ob - cb);
  return f;
}

function validate(content: string): string[] {
  const issues: string[] = [];
  const wc = content.split(/\s+/).length;
  if (wc < 600) issues.push(`Short: ${wc} words`);
  for (const sec of ['Formula', 'Mistake', 'PYQ', 'Ayush', 'Last 5', 'MCQ']) {
    if (!content.toLowerCase().includes(sec.toLowerCase())) issues.push(`Missing: ${sec}`);
  }
  return issues;
}

function assembleFinal(blog: BlogEntry, body: string): string {
  const today = new Date().toISOString().split('T')[0];
  const cleanTitle = blog.title.split(' — ')[0].trim();
  return `---
heroImage: "${blog.image}"
title: "${cleanTitle} — Grandmaster Guide"
description: "${cleanTitle} — Grandmaster Guide Revision Notes. Last Updated: ${today}."
category: "Exam Notes"
date: "${today}"
practice_link: "/practice/${blog.id}"
manualReview: false
---

${body}

---

### 🚀 Ready to Ace Your Exam?
Put your knowledge to the test! Take the free [**Practice Mock Test**](/practice/${blog.id}) now and track your progress against thousands of students.

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const startArg = args.find(a => a.startsWith('--start='));
  const startIndex = startArg ? parseInt(startArg.split('=')[1]) : 0;

  console.log('\n' + '═'.repeat(55));
  console.log('🔥 MASS BLOG REGENERATION v3.1 (Groq + Gemini)');
  console.log(`📊 Mode: ${isTest ? 'TEST (10)' : 'FULL (all)'} | Groq: ${GROQ_KEYS.length} keys | Gemini: ${GEMINI_KEYS.length} keys`);
  console.log('═'.repeat(55) + '\n');

  const allBlogs = loadBlogRegistry();
  let blogs: BlogEntry[];

  if (isTest) {
    const testSlugs = [
      'integrals-class-12-notes','differential-equations-class-12-notes',
      'trigonometric-functions-class-11-revision-notes-jee-neet',
      'wave-optics-class-12-notes','chemical-kinetics-class-12-notes',
      'atoms-class-12-notes','comparing-quantities-class-8-notes',
      'linear-equations-in-two-variables-class-9-notes',
      'coordinate-geometry-class-10-notes',
      'data-handling-class-8-notes',
    ];
    blogs = allBlogs.filter(b => testSlugs.includes(b.id));
    if (blogs.length < 10) blogs.push(...allBlogs.filter(b => !testSlugs.includes(b.id)).slice(0, 10 - blogs.length));
  } else {
    blogs = allBlogs.slice(startIndex);
  }

  console.log(`🎯 Processing ${blogs.length} blogs\n`);
  const report = { success: [] as string[], failed: [] as string[], issues: [] as string[], startedAt: new Date().toISOString(), completedAt: '' };

  let consecutiveFailures = 0;

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    const { topic, subject, grade } = extractMeta(blog);
    const filePath = path.join(BLOG_DIR, `${blog.id}.md`);
    
    // IDEMPOTENCY CHECK: Skip if already generated and looks good
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, 'utf-8');
      const wc = existing.split(/\s+/).length;
      if (existing.includes('Grandmaster Guide') && wc > 800) {
        console.log(`[${i+1}/${blogs.length}] ⏭️ Skipping ${topic} (Already exists and looks good: ${wc} words)`);
        continue;
      }
    }

    console.log(`[${i+1}/${blogs.length}] 🚀 ${topic} (${subject}, ${grade})`);

    const raw = await generate(blog);
    if (!raw) {
      console.log(`[${i+1}/${blogs.length}] ❌ FAILED\n`);
      report.failed.push(blog.id);
      consecutiveFailures++;
      
      if (consecutiveFailures >= 3) {
        console.warn(`🚨 3 consecutive failures detected. Network might be down. Waiting 60s...`);
        await sleep(60000);
      } else {
        await sleep(5000);
      }
      continue;
    }

    consecutiveFailures = 0;
    const processed = postProcess(raw);
    const vi = validate(processed);
    if (vi.length > 0) {
      console.log(`   ⚠️ ${vi.join(', ')}`);
      report.issues.push(`${blog.id}: ${vi.join('; ')}`);
    }

    const final = assembleFinal(blog, processed);
    fs.writeFileSync(path.join(BLOG_DIR, `${blog.id}.md`), final);
    const wc = processed.split(/\s+/).length;
    console.log(`[${i+1}/${blogs.length}] ✅ ${wc} words\n`);
    report.success.push(blog.id);

    await sleep(2500); // Rate limit safety
  }

  report.completedAt = new Date().toISOString();
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log('═'.repeat(55));
  console.log(`✅ Success: ${report.success.length} | ❌ Failed: ${report.failed.length} | ⚠️ Issues: ${report.issues.length}`);
  console.log('═'.repeat(55) + '\n');
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
