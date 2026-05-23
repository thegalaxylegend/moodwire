import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { standardizeMarkdown } from './utils/jules-quality.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function surgicalSanitize(body: string): string {
    let repaired = body;

    // 1. Recover content from Squashed JSON (Robust V4)
    // Find ALL chunks starting with {"heading" but not necessarily having "table"
    const jsonRegex = /\{(?:\r?\n)?\s*"heading"\s*:\s*"(.*?)"\s*,\s*"body"\s*:\s*"(.*?)(?:"\s*,|"\s*\}|$)/gs;
    repaired = repaired.replace(jsonRegex, (match, heading, bodyText) => {
        const cleanHeading = heading.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const cleanBody = bodyText.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        console.log(`   💎 Surgically extracted: ${cleanHeading.substring(0, 30)}...`);
        return `\n## ${cleanHeading}\n\n${cleanBody}\n`;
    });

    // 2. Wrap raw LaTeX (Surgically, without nesting)
    // Fixed: Ensure we only wrap if NOT already inside $ or $$
    const latexCmds = ['frac', 'sqrt', 'sum', 'int', 'alpha', 'beta', 'gamma', 'Delta', 'theta', 'phi', 'sin', 'cos', 'tan', 'sec', 'cosec', 'cot'];
    for (const cmd of latexCmds) {
        // Find command that is NOT preceded or followed by $
        const regex = new RegExp(`(?<![$\\\])\\\\${cmd}(?:\\{[^{}]*\\}|_[\\w\\d]+|\\^[^\\s]+|\\s|$)`, 'g');
        repaired = repaired.replace(regex, (match) => `$${match}$`);
    }

    // 3. Fix malformed HTML div class (Greedy matching)
    repaired = repaired.replace(/<div\s+\[class\].*?="(.*?)">/gi, '<div class="$1">');

    // 4. Remove [object Object] (Placeholder only)
    repaired = repaired.replace(/\[object Object\]/g, '');

    return repaired;
}

async function rehabilitateBlog(slug: string) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return;

    const rawContent = fs.readFileSync(filePath, 'utf8');
    const fmMatch = rawContent.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) return;

    const frontmatter = fmMatch[1];
    const body = fmMatch[2];

    console.log(`🔧 Surgically Rehabilitating ${slug}...`);
    const sanitizedBody = surgicalSanitize(body);
    
    const titleMatch = frontmatter.match(/title:\s*"(.*?)"/);
    const heroMatch = frontmatter.match(/heroImage:\s*"(.*?)"/);
    const practiceMatch = frontmatter.match(/practice_link:\s*"(.*?)"/);

    const finalContent = standardizeMarkdown(sanitizedBody, {
        title: titleMatch ? titleMatch[1] : slug,
        heroImage: heroMatch ? heroMatch[1] : "",
        lastUpdated: new Date().toISOString().split('T')[0],
        practiceLink: practiceMatch ? practiceMatch[1] : ""
    });

    fs.writeFileSync(filePath, finalContent);
    console.log(`✅ Success: ${slug}`);
}

(async () => {
    // Run on ALL blogs that fail the guard
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
        await rehabilitateBlog(file.replace('.md', ''));
    }
    console.log('\n✨ Library Rehabilitation Complete!');
})();
