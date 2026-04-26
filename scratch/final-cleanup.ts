import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { nodeRouter } from '../scripts/utils/nodeRouter.ts';
import { checkLatexIntegrity } from '../scripts/utils/jules-quality.ts';

const REPORT_PATH = 'c:/Users/Admin/Downloads/Desktop/jules-reports/sanity-guard-report.json';
const BLOG_DIR = 'c:/Users/Admin/Downloads/Desktop/src/content/blogs';

async function expandFile(file: string, topic: string) {
    const filePath = path.join(BLOG_DIR, file);
    console.log(`🚀 Expanding ${topic} blog (${file})...`);
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
        const slug = file.replace('.md', '');
        metadata = `heroImage: "/blog-images/${slug}.webp"
title: "${topic} Class Revision Notes — JEE & NEET 2026 Grandmaster Guide"
description: "${topic} Revision Notes for JEE & NEET 2026. Detailed formulas, PYQs, and MCQs."
category: "Revision"
date: "2026-04-26"
practice_link: "/class-11/${slug}"`;
    }

    const prompt = `
    You are Jules, a Master Educator and SEO Grandmaster.
    Rewrite and expand this blog post on "${topic}" to be 2000+ words.
    
    CRITICAL REQUIREMENTS:
    1. EXTREME DEPTH: Cover every sub-topic, formula, concept, and application.
    2. PERFECT LATEX: Wrap all math in $ for inline and $$ for blocks. 
    3. MANDATORY SECTIONS:
       - Table of Contents
       - High-Yield Formula Bank
       - "Ayush's Note" (Strategic advice for the exam)
       - "The 5 Marks-Crushing Traps" (Detailed common mistakes)
       - 10 Advanced Practice MCQs with answers.
       - 3 Solved High-Yield Questions (JEE/NEET style).
       - "Last 5 Minutes Box" (Condensed summary).
    
    RETURN THE MARKDOWN BODY ONLY. DO NOT INCLUDE FRONTMATTER.
    `;

    const result = await nodeRouter.route(
        [{ role: "system", content: `You are a master educator in the subject of ${topic}.` }, { role: "user", content: prompt }],
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
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const thinFiles = report.issues.filter((issue: any) => 
        issue.errors.some((err: string) => err.includes('Critical Thin Content'))
    );

    console.log(`🎯 Found ${thinFiles.length} files with critical thin content.`);

    for (const issue of thinFiles) {
        const topic = issue.file.replace('.md', '').split('-').join(' ');
        await expandFile(issue.file, topic);
    }
}

main();
