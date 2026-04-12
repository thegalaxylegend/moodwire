import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { nodeRouter } from './utils/nodeRouter.js';
import { TaskTier } from '../src/lib/routingConfig.js';
import { standardizeMarkdown } from './utils/jules-quality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const PILOT_BLOGS = [
    {
        slug: 'computer-networks-class-12-notes',
        subject: 'Computer Science',
        topic: 'Computer Networks',
        grade: 'Class 12',
        target: 'GATE & Boards 2026'
    },
    {
        slug: 'trigonometric-functions-class-11-revision-notes-jee-neet',
        subject: 'Mathematics',
        topic: 'Trigonometric Functions',
        grade: 'Class 11',
        target: 'JEE & NEET 2026'
    },
    {
        slug: '3d-geometry-intro-class-11-revision-notes-jee-neet',
        subject: 'Mathematics',
        topic: '3D Geometry',
        grade: 'Class 11',
        target: 'JEE & NEET 2026'
    }
];

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

async function regenerate(item: typeof PILOT_BLOGS[0]) {
    console.log(`🚀 Regenerating Perfection: ${item.slug}...`);
    
    const prompt = `Topic: ${item.topic} (${item.subject})
Grade/Target: ${item.grade} (${item.target})
${PERFECTION_PROMPT}`;

    try {
        const content = await nodeRouter.route([{ role: "user", content: prompt }], 'T1' as TaskTier);
        if (!content) throw new Error("LLM return empty content");

        const sanitized = content.replace(/```markdown\s*|```/g, '').trim();
        
        const finalMarkdown = standardizeMarkdown(sanitized, {
            title: `${item.topic} ${item.grade} ${item.subject} Revision — ${item.target} Grandmaster Guide`,
            heroImage: `/blog-images/${item.slug}.webp`,
            lastUpdated: new Date().toISOString().split('T')[0],
            practiceLink: `/practice/${item.slug}`
        });

        const filePath = path.join(BLOG_DIR, `${item.slug}.md`);
        fs.writeFileSync(filePath, finalMarkdown);
        console.log(`✅ Perfected: ${item.slug}`);
    } catch (err: any) {
        console.error(`❌ Failed to regenerate ${item.slug}: ${err.message}`);
    }
}

(async () => {
    for (const blog of PILOT_BLOGS) {
        await regenerate(blog);
        await new Promise(r => setTimeout(r, 2000)); // Rate limit safety
    }
    console.log('\n✨ Pilot Perfection Complete! Run sanity-guard to verify.');
})();
