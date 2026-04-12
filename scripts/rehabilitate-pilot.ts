import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { godSafeParse } from './utils/god-json.ts';
import { standardizeMarkdown } from './utils/jules-quality.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3
].filter(Boolean) as string[];

const GEMINI_KEYS = [
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2
].filter(Boolean) as string[];

const groq = new Groq({ apiKey: GROQ_KEYS[0] });

async function callLlm(system: string, user: string): Promise<string | null> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        return completion.choices[0]?.message?.content || "";
    } catch (err) {
        const key = GEMINI_KEYS[1] || GEMINI_KEYS[0];
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });
        const data: any = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
}

function sanitizeMarkdown(body: string): { content: string, regenNeeded: boolean } {
    let repaired = body;
    let regenNeeded = false;

    // 1. Purge [object Object]
    repaired = repaired.replace(/\[object Object\]/g, '');

    // 2. Fix malformed HTML div class
    repaired = repaired.replace(/<div \[class\]\((.*?)\)="(.*?)">/g, '<div class="$2">');

    // 3. Fix JSON squashing
    repaired = repaired.replace(/\{[\s\S]*?"heading":[\s\S]*?"body":[\s\S]*?\}/g, (match) => {
        try {
            const parsed = godSafeParse(match);
            if (parsed && parsed.heading && parsed.body && !parsed.isScraped) {
                return `\n## ${parsed.heading}\n\n${parsed.body}\n`;
            }
            // If it was scraped or failed, it might be truncated
            if (match.length > 200) {
                regenNeeded = true;
                return ""; // Delete truncated junk
            }
        } catch (e) {
            regenNeeded = true;
            return "";
        }
        return match;
    });

    // 4. Fix raw LaTeX (Better regex, avoid nesting)
    const latexCommands = ['frac', 'sqrt', 'sum', 'int', 'alpha', 'beta', 'gamma', 'Delta', 'theta', 'phi', 'sin', 'cos', 'tan', 'sec', 'cosec', 'cot'];
    for (const cmd of latexCommands) {
        // Match ONLY if not already enclosed in $ or $$
        // Positive lookbehind for $ is tricky in some engines, we use a simpler approach
        const regex = new RegExp(`(?<!\\$)\\\\${cmd}\\{[^{}]*\\}(?:\\{[^{}]*\\})?|(?<!\\$)\\\\${cmd}_[\\w\\d]+|(?<!\\$)\\\\${cmd}\\^[^\\s]+`, 'g');
        repaired = repaired.replace(regex, (match) => {
            // Check if match is surrounded by $ (simple check)
            return `$${match}$`;
        });
    }

    // 5. Final nested $ fix: remove $$...$$ if created by above
    repaired = repaired.replace(/\$\$+(.*?)\$\$+/g, (match, inner) => `$${inner.replace(/\$/g, '')}$`);
    // Fix $\sin{\theta}$ -> $\sin{\theta}$ (wait, that's already correct, but we want to avoid $\sin{\theta}$)
    
    // Fix tab-character issue
    repaired = repaired.replace(/\t(heta|phi|alpha|beta|gamma|Delta)/g, '\\$1');

    return { content: repaired, regenNeeded };
}

async function rehabilitateBlog(slug: string) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return;

    let rawContent = fs.readFileSync(filePath, 'utf8');
    const fmMatch = rawContent.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) return;

    let frontmatter = fmMatch[1];
    let body = fmMatch[2];

    console.log(`🔧 Rehabilitating ${slug}...`);

    // Step 1: Sanitize
    const { content: sanitizedBody, regenNeeded: initialRegen } = sanitizeMarkdown(body);
    body = sanitizedBody;
    let finalRegen = initialRegen || body.length < 3000;

    // Step 2: Strategic Refinement
    if (finalRegen) {
        console.log(`🧬 Deep Strategic Refinement required for ${slug}...`);
        const titleMatch = frontmatter.match(/title:\s*"(.*?)"/);
        const title = titleMatch ? titleMatch[1] : slug;

        const refinement = await callLlm(
            "You are a Senior Academic SEO Strategist. Rewrite the following blog body to fix technical corruption and ensure 100% accurate LaTeX math. YOU MUST USE $ for inline math and $$ for block equations. NO JSON inside the body. Return JSON: {\"body\": \"markdown content\"}",
            `Title: ${title}\nContext: This blog is for CBSE 2026/JEE/NEET. Ensure Formula Bank, solved PYQs, and MCQs are present and technically accurate.\nExisting Body (might be truncated):\n${body.substring(0, 4000)}`
        );

        if (refinement) {
            const parsed = godSafeParse(refinement);
            if (parsed?.body && parsed.body.length > 500) {
                body = parsed.body;
            }
        }
    }

    // Step 3: Standardize
    const titleMatch = frontmatter.match(/title:\s*"(.*?)"/);
    const heroMatch = frontmatter.match(/heroImage:\s*"(.*?)"/);
    const practiceMatch = frontmatter.match(/practice_link:\s*"(.*?)"/);

    const finalContent = standardizeMarkdown(body, {
        title: titleMatch ? titleMatch[1] : slug,
        heroImage: heroMatch ? heroMatch[1] : "",
        lastUpdated: new Date().toISOString().split('T')[0],
        practiceLink: practiceMatch ? practiceMatch[1] : ""
    });

    fs.writeFileSync(filePath, finalContent);
    console.log(`✅ Success: ${slug}`);
}

const pilotBlogs = [
    'computer-networks-class-12-notes',
    'trigonometric-functions-class-11-revision-notes-jee-neet',
    '3d-geometry-intro-class-11-revision-notes-jee-neet'
];

(async () => {
    for (const b of pilotBlogs) {
        await rehabilitateBlog(b);
    }
    console.log('\n✨ Pilot Rehabilitation Complete!');
})();
