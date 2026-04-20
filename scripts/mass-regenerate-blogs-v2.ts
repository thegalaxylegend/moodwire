import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { nodeRouter } from './utils/nodeRouter.js';
import { TaskTier } from '../src/lib/routingConfig.js';
import { standardizeMarkdown, sanitizeAiText } from './utils/jules-quality.js';
import { blogs } from '../src/data/blogs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const PERFECTION_PROMPT = `You are a top 1% academic mentor. Generate an EXTREMELY DETAILED "Grandmaster Revision Guide" for the topic below.
STRICT RULES:
1. Output ONLY pure Markdown.
2. NEVER use JSON structures like {"heading":...} in the body.
3. LaTeX: Use $ for inline math and $$ for block math. 
4. DO NOT double-escape backslashes. Use \frac, not \\frac.
5. **LENGTH & DEPTH**: Target 2000-3000 words of high-density academic content. Every H2 section should be long, thorough, and provide deep insights. NO THIN CONTENT.
6. **MCQ FORMATTING**: For the 5 Practice MCQs, you MUST put each option (A, B, C, D) on a NEW LINE.
   Example:
   1. Question text?
   - A) Option 1
   - B) Option 2
   - C) Option 3
   - D) Option 4
7. STRUCTURE: Use H2 (##) and H3 (###) headers. Use bullet points for almost everything to maintain high scan-ability.
8. SECTIONS REQUIRED:
   - Quick Recall (Markdown div with class "quick-summary")
   - Formula Bank (Comprehensive list with derivations/explanations)
   - The 5 Mistakes That Cost Marks (Specific student traps with detailed fixes)
   - 3 Solved PYQs (Exhaustive step-by-step solutions)
   - The One Thing Most Students Get Wrong (Deep conceptual breakthrough)
   - Last 5 Minutes Box (Ultra-condensed summary)
   - 5 Practice MCQs with answers (Options on separate lines).
9. VOICE: Direct, punchy, student-to-student mentor tone.`;

async function regenerate(blog: any) {
    const slug = blog.id;
    console.log(`🚀 Regenerating: ${slug}...`);
    
    // Extract metadata from title
    const titleParts = blog.title.split(' — ')[0];
    const gradeMatch = titleParts.match(/Class \d+/);
    const grade = gradeMatch ? gradeMatch[0] : 'Class 12';
    
    // Clean topic from grade and other suffixes
    let topic = titleParts;
    const suffixes = ["Revision", "Exam Prep", "Recap", "Grandmaster Guide", "Notes", grade];
    suffixes.forEach(s => {
        const reg = new RegExp(s, 'gi');
        topic = topic.replace(reg, '');
    });
    topic = topic.replace(/\s+/g, ' ').trim();

    const prompt = `Topic: ${topic}
Grade/Target: ${grade}
Full Context: ${blog.title}
${PERFECTION_PROMPT}`;

    try {
        // T1 uses the best models (Gemini Pro, Llama 3.3 70B)
        const rawContent = await nodeRouter.route([{ role: "user", content: prompt }], 'T1' as TaskTier);
        if (!rawContent) throw new Error("Empty content from LLM");

        const sanitized = sanitizeAiText(rawContent).replace(/```markdown\s*|```/g, '').trim();
        
        const finalMarkdown = standardizeMarkdown(sanitized, {
            title: blog.title,
            heroImage: blog.image,
            lastUpdated: new Date().toISOString().split('T')[0],
            practiceLink: `/practice/${slug}`,
            manualReview: false
        });

        const filePath = path.join(BLOG_DIR, `${slug}.md`);
        fs.writeFileSync(filePath, finalMarkdown);
        console.log(`✅ Success: ${slug}`);
    } catch (err: any) {
        console.error(`❌ Failed ${slug}: ${err.message}`);
    }
}

(async () => {
    const startIndex = 0; // Can be adjusted to resume
    const itemsToProcess = blogs.slice(startIndex);
    
    console.log(`📚 Starting mass regeneration of ${itemsToProcess.length} blogs...`);
    
    for (const blog of itemsToProcess) {
        await regenerate(blog);
        // Small delay to prevent hitting local rate limit trackers too fast
        await new Promise(r => setTimeout(r, 1500)); 
    }
    
    console.log('\n✨ Mass Regeneration Complete!');
})();
