import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { nodeRouter } from '../scripts/utils/nodeRouter.ts';
import { checkLatexIntegrity } from '../scripts/utils/jules-quality.ts';

async function expandFile(filePath: string, topic: string) {
    console.log(`🚀 Expanding ${topic} blog...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Attempt to extract existing metadata if any
    let metadata = "";
    if (content.startsWith('---')) {
        const parts = content.split('---');
        if (parts.length >= 3) {
            metadata = parts[1].trim();
        }
    }

    if (!metadata) {
        // Fallback metadata if wiped
        const slug = path.basename(filePath, '.md');
        metadata = `heroImage: "/blog-images/${slug}.webp"
title: "${topic} Class Revision Notes — JEE & NEET 2026 Grandmaster Guide"
description: "${topic} Revision Notes for JEE & NEET 2026. Detailed formulas, PYQs, and MCQs."
category: "Revision"
date: "2026-04-26"
practice_link: "/class-11/mathematics/${slug}"`;
    }

    const prompt = `
    You are Jules, a Master Educator and SEO Grandmaster.
    Rewrite and expand this blog post on "${topic}" to be 2000+ words.
    
    CRITICAL REQUIREMENTS:
    1. EXTREME DEPTH: Cover every sub-topic, derivation, and edge case.
    2. PERFECT LATEX: Wrap all math in $ for inline and $$ for blocks. 
       Example: $x^2$, $$\\frac{a}{b}$$. 
       NEVER use raw backslashes without wrapping.
    3. MANDATORY SECTIONS:
       - Table of Contents
       - High-Yield Formula Bank
       - "Ayush's Note" (Strategic advice for the exam)
       - "The 5 Marks-Crushing Traps" (Detailed common mistakes)
       - 10 Advanced Practice MCQs with answers.
       - 3 Solved PYQs (Previous Year Questions) from JEE/NEET.
       - "Last 5 Minutes Box" (Condensed summary).
    4. Fix all current LaTeX errors like "nabla", "binom", "frac" being naked.
    
    RETURN THE MARKDOWN BODY ONLY. DO NOT INCLUDE FRONTMATTER.
    `;

    const result = await nodeRouter.route(
        [{ role: "system", content: `You are a master ${topic.includes('Theorem') ? 'Mathematics' : 'Physics'} content creator.` }, { role: "user", content: prompt }],
        'T1'
    );

    if (result) {
        const fixedBody = checkLatexIntegrity(result);
        const finalContent = `---\n${metadata}\n---\n\n${fixedBody}`;
        fs.writeFileSync(filePath, finalContent);
        console.log(`✅ Successfully expanded ${topic} to ${fixedBody.split(' ').length} words.`);
    }
}

async function main() {
    await expandFile('c:/Users/Admin/Downloads/Desktop/src/content/blogs/binomial-theorem-class-11-revision-notes-jee.md', 'Binomial Theorem');
    await expandFile('c:/Users/Admin/Downloads/Desktop/src/content/blogs/electromagnetic-waves-class-12-notes.md', 'Electromagnetic Waves');
}

main();
