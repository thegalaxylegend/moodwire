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
        const slug = path.basename(filePath, '.md');
        metadata = `heroImage: "/blog-images/${slug}.webp"
title: "${topic} Class Revision Notes — JEE & NEET 2026 Grandmaster Guide"
description: "${topic} Revision Notes for JEE & NEET 2026. Detailed formulas, PYQs, and MCQs."
category: "Revision"
date: "2026-04-26"
practice_link: "/class-11/biology/${slug}"`;
    }

    const prompt = `
    You are Jules, a Master Educator and SEO Grandmaster.
    Rewrite and expand this blog post on "${topic}" to be 2000+ words.
    
    CRITICAL REQUIREMENTS:
    1. EXTREME DEPTH: Cover every sub-topic, anatomical structure, physiological process, and clinical significance.
    2. PERFECT FORMATTING: Use Markdown headings, lists, and bold text.
    3. MANDATORY SECTIONS:
       - Table of Contents
       - High-Yield Key Points (Anatomy & Physiology)
       - "Ayush's Note" (Strategic advice for the exam)
       - "The 5 Marks-Crushing Traps" (Detailed common mistakes)
       - 10 Advanced Practice MCQs with answers.
       - 3 Solved High-Yield Questions (NEET style).
       - "Last 5 Minutes Box" (Condensed summary).
    
    RETURN THE MARKDOWN BODY ONLY. DO NOT INCLUDE FRONTMATTER.
    `;

    const result = await nodeRouter.route(
        [{ role: "system", content: `You are a master Biology educator.` }, { role: "user", content: prompt }],
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
    await expandFile('c:/Users/Admin/Downloads/Desktop/src/content/blogs/body-fluids-and-circulation-class-11-revision-notes-neet.md', 'Body Fluids and Circulation');
}

main();
