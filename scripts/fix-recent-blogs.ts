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

async function callGroq(prompt: string, temperature = 0.7, retries = 5): Promise<string> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature,
      max_tokens: 7800,
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error: any) {
    const msg = error?.message || '';
    if ((error?.status === 429 || msg.includes('rate_limit')) && retries > 0) {
      rotateKey();
      await new Promise(r => setTimeout(r, 5000));
      return callGroq(prompt, temperature, retries - 1);
    }
    throw error;
  }
}

async function fixBlogContent(body: string, title: string, category: string, practiceLink: string): Promise<string> {
  // Pre-processing
  let cleanBody = body
    .replace(/---[\s\S]*?curated by Jules[\s\S]*?---/gi, '')
    .replace(/\*This post was curated by Jules[\s\S]*?\*/gi, '')
    .replace(/<div class="quick-summary">[\s\S]*?<\/div>/gi, '')
    .replace(/## 📋 Table of Contents[\s\S]*?(?=##|$)/gi, '')
    .replace(/## (?:🚀 )?(?:Quick Recall|Summary|Last Night Summary)[\s\S]*?(?=##|$)/gi, '')
    .trim();

  // PASS 1: Granular Theory (0-40%)
  const part1Prompt = `You are a Grandmaster Educator. Write Part 1 (First 40%) of an ULTRA-DEEP, 3,000-word revision guide for: ${title}.
  
  STRICT RULES:
  1. Use ### for sub-topics and #### for sub-sub-topics.
  2. Granularity is key. Cover every minor concept.
  3. Short, punchy bullet points. No long paragraphs.
  4. Block LaTeX ($$ ... $$) for all formulas.
  5. NO TOC, NO Intro.
  
  SOURCE: ${cleanBody.slice(0, 5000)}`;

  // PASS 2: Granular Theory (41-80%)
  const part2Prompt = `You are a Grandmaster Educator. Write Part 2 (Middle 40%) of an ULTRA-DEEP, 3,000-word revision guide for: ${title}.
  
  STRICT RULES:
  1. Continue from where Part 1 ends. Use ### and ####.
  2. Include "## 🪤 The 5 Trap Mistakes" (Deep explanation).
  3. Every sub-sub-topic must have its own #### header.
  
  SOURCE: ${cleanBody.slice(0, 5000)}`;

  // PASS 3: Advanced Theory & Test Center Integration (81-100%)
  const part3Prompt = `You are a Grandmaster Educator. Write Part 3 (Final 20%) AND the Test Center Integration for: ${title}.
  
  RULES:
  1. Cover remaining advanced concepts.
  2. MANDATORY: Create a "## 📝 Master the Test Center — Step-by-Step Learning" section.
  3. Explain WHY they should use the Test Center at ${practiceLink} to learn.
  4. Use a tone that makes them want to bookmark this and come back daily.
  5. End with "## 🔁 Last 5 Minutes Box".
  
  SOURCE: ${cleanBody.slice(0, 5000)}`;

  try {
    console.log(`    Step 1: Deep Theory Part 1...`);
    const part1 = await callGroq(part1Prompt, 0.8);
    console.log(`    Step 2: Deep Theory Part 2 & Traps...`);
    const part2 = await callGroq(part2Prompt, 0.8);
    console.log(`    Step 3: Advanced & Test Center...`);
    const part3 = await callGroq(part3Prompt, 0.8);
    
    return `${part1}\n\n${part2}\n\n${part3}`;
  } catch (error) {
    console.error(`      Error in content generation:`, error);
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

    const practiceLink = file.practice_link || `/class-11/physics/${file.name.replace('.md', '')}`;
    const fixedBody = await fixBlogContent(file.body, file.title, correctedCategory, practiceLink);

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
        practiceLink: practiceLink
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
