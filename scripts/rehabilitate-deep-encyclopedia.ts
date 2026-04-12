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

interface BlogItem {
    slug: string;
    subject: string;
    topic: string;
    grade: string;
    target: string;
}

const PILOT_BLOGS: BlogItem[] = [
    {
        slug: 'computer-networks-class-12-notes',
        subject: 'Computer Science',
        topic: 'Computer Networks',
        grade: 'Class 12',
        target: 'Boards 2026'
    },
    {
        slug: 'trigonometric-functions-class-11-revision-notes-jee-neet',
        subject: 'Mathematics',
        topic: 'Trigonometric Functions',
        grade: 'Class 11',
        target: 'JEE & Boards 2026'
    },
    {
        slug: '3d-geometry-intro-class-11-revision-notes-jee-neet',
        subject: 'Mathematics',
        topic: '3D Geometry',
        grade: 'Class 11',
        target: 'JEE & Boards 2026'
    }
];

const PERFECTION_PROMPT = `You are an elite academic editor enforcing the "DEEP ENCYCLOPEDIA" (LTHK 2.0) principle.
STRICT RULES:
1. NO CONVERSATIONAL FILLER: Delete all introductory/outro phrases ("Welcome", "In this section"). Start directly with facts.
2. TECHNICAL DEPTH: Provide EXHAUSTIVE, university-level explanations. Each major point must be 40-70 words of solid, fact-heavy data. NO ONE-LINE DEFINITIONS.
3. HIERARCHY: Clear H3/H4 structure. Bold all key terms.
4. SCAN-ABILITY: Use bullet points, but each bullet must be a dense paragraph of information explaining 'How it works', 'Why it matters', and 'Technical Specifications'.
5. RIGOR: Mention specific RFCs, IEEE standards, historical derivations, and edge-cases.
6. DERIVATIONS: Provide full step-by-step rigorous derivations using LaTeX ($ for inline, $$ for block).
7. NO REPETITION: Do not write the section title inside the body.`;

// Helper to call LLM for a specific section
async function generateSection(topic: string, subject: string, context: string, sectionTitle: string, customRules: string): Promise<string> {
    const prompt = `Topic: ${topic} (${subject})\nSection: ${sectionTitle}\n${PERFECTION_PROMPT}\n\nCustom Rule for this section: ${customRules}\nContext: ${context}`;

    let result = await nodeRouter.route([{ role: "user", content: prompt }], 'T1' as TaskTier);
    return result || "";
}

/**
 * Robustly extracts a JSON array from AI-generated response text,
 * handling conversational preamble and malformed backtick wrappers.
 */
function extractJsonArray(text: string): any[] {
    if (!text) return [];
    try {
        // Find the balanced range of the first [ and last ]
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start === -1 || end === -1 || end < start) return [];
        
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        // Secondary attempt: strip markdown code blocks
        try {
            const stripped = text.replace(/```json|```/g, '').trim();
            const start = stripped.indexOf('[');
            const end = stripped.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                return JSON.parse(stripped.substring(start, end + 1));
            }
        } catch (inner) {
            console.error("  ❌ Deep JSON Extraction failed.");
        }
        return [];
    }
}

import { writeAtomicRegistry } from './utils/registry-atomizer.ts';

/**
 * Fix P3.2, P3.3, P3.5: Atomic Registry & Collision Guard
 */
async function syncRegistryAtomic(item: BlogItem, title: string) {
    const registryPath = path.join(__dirname, '../src/data/blogs.ts');
    
    try {
        let content = fs.readFileSync(registryPath, 'utf8');
        
        // 1. Double-Check Existence (Collision Guard P3.3)
        if (content.includes(`"id": "${item.slug}"`)) {
            console.log(`  ⚠️ Registry entry for ${item.slug} already exists. Skipping sync.`);
            return;
        }

        const newEntry = `    {
        "id": "${item.slug}",
        "title": "${title}",
        "description": "${title} Revision Notes. Last Updated: ${new Date().toISOString().split('T')[0]}.",
        "category": "Revision",
        "date": "${new Date().toISOString().split('T')[0]}",
        "readTime": "15 min read",
        "image": "/blog-images/${item.slug}.webp"
    },`;

        // 2. Atomic Injection via centralized shadow mirror
        const updatedContent = content.replace('export const blogs: Blog[] = [', `export const blogs: Blog[] = [\n${newEntry}`);
        
        const success = writeAtomicRegistry(registryPath, updatedContent);
        if (!success) {
            throw new Error("Registry-Atomizer failed to write.");
        }
    } catch (err) {
        throw new Error(`Registry Sync Failed: ${err}`);
    }
}

async function deepRegenerate(item: BlogItem) {
    // Fix P3.5: Strict Lowercase Slugs
    const safeSlug = item.slug.toLowerCase().trim();
    const cleanTopic = item.topic.replace(/[`]/g, ''); 
    
    console.log(`\n🪐 STARTING DEEP ENCYCLOPEDIA PRODUCTION: ${safeSlug} ...`);
    
    // Existence Guard (File System Collision P3.3)
    const filePath = path.join(BLOG_DIR, `${safeSlug}.md`);
    if (fs.existsSync(filePath)) {
        console.log(`  🛑 File ${safeSlug}.md already exists. Path protected. Skipping.`);
        return;
    }

    // PHASE 1: OUTLINE
    console.log(`  🖋️ Planning detailed hierarchical outline...`);
    const outlinePrompt = `Generate a high-density LTHK outline for "${cleanTopic}".
    Output ONLY a JSON array of objects: [{ "title": "Section Title", "context": "Detailed description of what to cover" }]
    Include exactly 5 major Sections.`;
    
    const outlineRaw = await nodeRouter.route([{ role: "user", content: outlinePrompt }], 'T2' as TaskTier);
    let outline = extractJsonArray(outlineRaw || "");
    
    if (outline.length === 0) {
        outline = [
            { title: "Introduction and Definitions", context: "Formal introduction to the topic." },
            { title: "Core Concepts", context: "Detailed breakdown." },
            { title: "Mathematical Framework", context: "Step-by-step derivations." }
        ];
    }

    // PHASE 2: MODULE WRITING
    let bodyBlocks: string[] = [];
    for (const [idx, section] of outline.entries()) {
        console.log(`  🖋️ Module ${idx + 1}/${outline.length}: ${section.title}...`);
        const block = await generateSection(item.topic, item.subject, section.context, section.title, "Exhaustive technical detail. 800+ words.");
        bodyBlocks.push(`\n## ${section.title}\n\n${block}`);
    }

    // PHASE 3: SPECIALIZED BLOCKS
    const pyqs = await generateSection(item.topic, item.subject, "3 complex PYQs with solutions.", "Solved PYQs", "");
    const mcqPrompt = `Generate 5 Practice MCQs for ${item.topic}. Options on NEW lines.`;
    const mcqs = await nodeRouter.route([{ role: "user", content: mcqPrompt }], 'T1' as TaskTier);

    // ASSEMBLY
    console.log(`  🏗️ Assembling LTHK Manuscript...`);
    const fullBody = bodyBlocks.join('\n\n') + `\n\n## Solved PYQs\n\n${pyqs}` + `\n\n## Practice MCQs\n\n${mcqs}`;
    
    const finalTitle = `${item.topic} ${item.grade} (${item.subject}) Comprehensive Notes — ${item.target} Encyclopedia`;
    const finalMarkdown = standardizeMarkdown(fullBody, {
        title: finalTitle,
        heroImage: `/blog-images/${safeSlug}.webp`,
        lastUpdated: new Date().toISOString().split('T')[0],
        practiceLink: `/practice/${safeSlug}`
    });

    // ATOMIC SAVE (Fix P3.6: Consistency Guard)
    try {
        fs.writeFileSync(filePath, finalMarkdown);
        await syncRegistryAtomic({ ...item, slug: safeSlug }, finalTitle);
        console.log(`✨ PERFECTED & SYNCED: ${safeSlug}`);
    } catch (err) {
        console.error(`  ❌ ATOMIC FAILURE: ${err}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Rollback file if registry fails
    }
}

async function runPilot() {
    for (const item of PILOT_BLOGS) {
        await deepRegenerate(item);
    }
    console.log("\n🚀 ALL PILOT BLOGS UPGRADED TO DEEP ENCYCLOPEDIA STATUS.");
}

runPilot().catch(console.error);
