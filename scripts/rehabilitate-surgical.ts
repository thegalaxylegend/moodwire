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

    // 1. Recover content from Squashed JSON (Safe Extraction)
    // We look for chunks starting with {"heading" and process them individually
    const jsonChunks = repaired.match(/\{"heading":[\s\S]*?("body":|$)/g);
    if (jsonChunks) {
        for (const chunk of jsonChunks) {
            // Use simpler regex for each chunk to avoid backtracking
            const headingMatch = chunk.match(/"heading"\s*:\s*"(.*?)"/);
            const bodyMatch = chunk.match(/"body"\s*:\s*"(.*)/s);
            
            if (headingMatch && bodyMatch) {
                let extractedBody = bodyMatch[1];
                // Clean up trailing JSON junk (", }, etc.)
                extractedBody = extractedBody.replace(/"\s*,\s*"table"[\s\S]*$/, '');
                extractedBody = extractedBody.replace(/"\s*\}\s*$/, '');
                
                const cleanHeading = headingMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                const cleanBody = extractedBody.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                
                console.log(`   💎 Surgically extracted: ${cleanHeading.substring(0, 30)}...`);
                // Replace the chunk in the main body
                repaired = repaired.replace(chunk, `\n## ${cleanHeading}\n\n${cleanBody}\n`);
            }
        }
    }

    // 2. Wrap raw LaTeX (Surgically, without nesting)
    const latexCmds = ['frac', 'sqrt', 'sum', 'int', 'alpha', 'beta', 'gamma', 'Delta', 'theta', 'phi', 'sin', 'cos', 'tan', 'sec', 'cosec', 'cot'];
    for (const cmd of latexCmds) {
        // Negative lookbehind for $ and \
        const regex = new RegExp(`(?<![$\\\])\\\\${cmd}(?:\\{[^{}]*\\}|_[\\w\\d]+|\\^[^\\s]+|\\s|$)`, 'g');
        repaired = repaired.replace(regex, (match) => `$${match}$`);
    }

    // 3. Fix malformed HTML div class
    repaired = repaired.replace(/<div \[class\]\((.*?)\)="(.*?)">/g, '<div class="$2">');
    repaired = repaired.replace(/<div \[class\]="(.*?)">/g, '<div class="$1">');

    // 4. Remove [object Object] (Placeholder only)
    repaired = repaired.replace(/\[object Object\]/g, '');

    return repaired;
}

async function rehabilitateBlog(slug: string) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return;

    let rawContent = fs.readFileSync(filePath, 'utf8');
    const fmMatch = rawContent.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) return;

    let frontmatter = fmMatch[1];
    let body = fmMatch[2];

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

const pilotBlogs = [
    'computer-networks-class-12-notes',
    'trigonometric-functions-class-11-revision-notes-jee-neet',
    '3d-geometry-intro-class-11-revision-notes-jee-neet'
];

(async () => {
    for (const b of pilotBlogs) {
        await rehabilitateBlog(b);
    }
    console.log('\n✨ Surgical Pilot Complete!');
})();
