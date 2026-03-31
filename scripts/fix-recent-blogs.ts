import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

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
  // Handle both \n and \r\n line endings
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
    return { frontmatter: `---\n${fm}\n---`, body, date, title, category };
  }
  return { frontmatter: '', body: content, date: '1970-01-01', title: '', category: '' };
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  console.log('  🔄 Key rotation → index ' + currentKeyIndex);
  groq = new Groq({ apiKey: keys[currentKeyIndex] });
}

async function fixBlogContent(body: string, title: string, category: string, retries = 5): Promise<string> {
  // Read BLOG_RULES.md for the system prompt
  const rulesPath = path.join(process.cwd(), 'BLOG_RULES.md');
  const rules = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf-8').slice(0, 2000) : '';

  const prompt = `You are a senior content editor at Exam Compass. You are rewriting a revision blog to meet strict quality standards.

BLOG RULES (MANDATORY):
- Minimum 2000 words for chapter revision notes
- Voice: peer mentor (student-to-student). NOT corporate. NOT AI-sounding.
- NO phrases: "In conclusion", "delve into", "comprehensive", "embark on your journey", "needless to say"
- Mix bullet points WITH short explanatory paragraphs (not 100% bullets)
- Every concept must have enough detail that a student can LEARN from it, not just see a topic name

CHAPTER: "${title}"
SUBJECT: "${category}"

YOUR TASK — Rewrite this blog into a COMPREHENSIVE, DETAILED revision guide:

1. "## 📖 Chapter Overview" — 5-7 sentence paragraph summarizing what this chapter covers and why it matters for exams. Include specific exam data (e.g. "2-3 questions from this chapter appear every year in JEE Mains").

2. "## 📚 Detailed Revision Notes" — This is the MAIN section and must be LONG and THOROUGH:
   - Break into ### sub-topics (e.g. "### Pyrometallurgy", "### Froth Floatation")
   - Under each sub-topic: 
     * 2-3 sentence explanation of the concept
     * Key facts as bullet points (with bold key terms)
     * Important reactions/formulas in $$LaTeX$$
     * Example or application (1-2 lines)
   - AIM: A student reading ONLY this section should be able to answer 80% of exam questions on this chapter.
   - TARGET: 1200+ words for this section alone.

3. Keep ALL existing sections below if they appear in the source (clean them up):
   "## 🎯 What WILL Come in Your Exam" — keep but make bullets specific with exam citations
   "## ⚡ Formula Bank" — keep all formulas, ensure $$LaTeX$$ is clean
   "## 🪤 The 5 Mistakes That Cost Marks" — keep but add 2-3 sentence explanations
   "## ✏️ 3 Solved PYQs" — keep, ensure full step-by-step solutions (not just answer)
   "## 🧠 The One Thing Most Students Get Wrong" — keep, expand with a clear example
   "## 👁️ Ayush's Note" — KEEP THIS. It's required! First-person, specific mistake Ayush made.
   "## 🔁 Last 5 Minutes Box" — keep, 5 formulas + 3 facts + 2 traps
   "## 📝 Practice MCQs" — keep all MCQs with full answer explanations

4. QUALITY RULES:
   - Don't just list topic names — explain them. "Roasting: Heating ores in air" is too short.
     Better: "Roasting involves heating sulfide ores in excess air to convert them to oxides. For example, copper pyrite (CuFeS₂) is roasted to give Cu₂S. The key reaction is: $$2CuFeS_2 + O_2 \\rightarrow Cu_2S + 2FeS + SO_2$$"
   - Every formula in the Formula Bank must have variable definitions
   - PYQ solutions must show working, not just the answer
   - Mistakes section must explain WHY students make the mistake and HOW to avoid it

5. CRITICAL: The content must be about "${title}" and "${category}" ONLY. Do NOT generate content about a different subject. If the source text has wrong-subject content, write correct content for the actual topic "${title}".

6. OUTPUT: Return ONLY the markdown body. No frontmatter. No "Here is the rewritten blog" commentary.

SOURCE TEXT TO REWRITE:
${body}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 7500,
    });
    return chatCompletion.choices[0]?.message?.content || body;
  } catch (error: any) {
    const msg = error?.message || '';
    if ((error?.status === 429 || msg.includes('rate_limit')) && retries > 0) {
      rotateKey();
      await new Promise(r => setTimeout(r, 4000));
      return fixBlogContent(body, title, category, retries - 1);
    }
    if (msg.includes('invalid_api_key') && retries > 0) {
      rotateKey();
      await new Promise(r => setTimeout(r, 1000));
      return fixBlogContent(body, title, category, retries - 1);
    }
    console.error('  ❌ Groq error:', msg.slice(0, 200));
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
  const recent30 = fileData.slice(0, 30);
  console.log(`\n📝 Found ${files.length} blogs. Reformatting 30 most recent...\n`);
  console.log('─'.repeat(60));

  let updated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < recent30.length; i++) {
    const file = recent30[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/30] ${file.name.slice(0, 50).padEnd(52)} `);

    if (file.body.trim().length < 200) {
      console.log('⏭ too short');
      skipped++;
      continue;
    }

    // Skip already processed (has our new structure marker)
    if (file.body.includes('## 📖 Chapter Overview') && file.body.includes('## 📚 Detailed Revision Notes')) {
      console.log('✓ done');
      skipped++;
      continue;
    }

    const fixedBody = await fixBlogContent(file.body, file.title, file.category);

    // Quality gate: must be at least 1500 chars (prevent thin content)
    if (fixedBody && fixedBody !== file.body && fixedBody.length > 1500) {
      const newContent = `${file.frontmatter}\n\n${fixedBody.trim()}\n`;
      fs.writeFileSync(file.path, newContent, 'utf-8');
      const wordCount = fixedBody.split(/\s+/).length;
      console.log(`✅ ${wordCount} words`);
      updated++;
    } else if (fixedBody.length <= 1500) {
      console.log(`⚠ too thin (${fixedBody.length} chars)`);
      failed++;
    } else {
      console.log('⚠ no change');
      failed++;
    }

    // 3.5s throttle
    await new Promise(r => setTimeout(r, 3500));
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Updated : ${updated}`);
  console.log(`⏭ Skipped : ${skipped}`);
  console.log(`⚠  Failed  : ${failed}`);
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);
