import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { nodeRouter } from '../scripts/utils/nodeRouter.ts';
import { checkLatexIntegrity } from '../scripts/utils/jules-quality.ts';

const FILE_PATH = 'c:/Users/Admin/Downloads/Desktop/src/content/blogs/binomial-theorem-class-11-revision-notes-jee.md';

async function expand() {
    const content = fs.readFileSync(FILE_PATH, 'utf-8');
    const [meta, ...bodyParts] = content.split('---');
    
    console.log("🚀 Expanding Binomial Theorem blog to meet Sanity Guard requirements...");

    const prompt = `
    You are Jules, a Master Educator and SEO Grandmaster.
    I have a blog post that is too thin (652 words) and has broken LaTeX. 
    It MUST be expanded to 2000+ words to pass the Sanity Guard.
    
    CRITICAL REQUIREMENTS:
    1. USE PROPER LATEX. Wrap EVERYTHING in $ for inline and $$ for blocks.
    2. Add these mandatory sections:
       - Detailed Formula Bank with $...$ formatting.
       - "Ayush's Note" (Exam Strategy).
       - "The 5 Marks-Crushing Traps" (Detailed warnings).
       - 10 Practice MCQs (A, B, C, D format).
       - 3 Solved PYQs from JEE Main/Advanced.
       - "Last 5 Minutes Box" (Quick Recap).
    3. The tone must be "Academic Grandmaster" - extremely detailed but high readability.
    4. Fix all naked LaTeX like "binom{n}{k}" to "$\\binom{n}{k}$".
    
    RETURN THE FULL MARKDOWN BODY ONLY.
    `;

    const result = await nodeRouter.route(
        [{ role: "system", content: "You are a master math content creator." }, { role: "user", content: prompt }],
        'T1'
    );

    if (result) {
        const fixedBody = checkLatexIntegrity(result);
        const finalContent = `---\n${meta.trim()}\n---\n\n${fixedBody}`;
        fs.writeFileSync(FILE_PATH, finalContent);
        console.log("✅ Successfully expanded to " + fixedBody.split(' ').length + " words.");
    }
}

expand();
