/**
 * SANITY GUARD FIXER
 * Fixes: JSON Squashing, Unclosed LaTeX blocks, Odd number of $$
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blogs');

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;
const report = [];

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    let fixes = [];

    // 1. Fix JSON Squashing
    // Pattern: { "heading": "...", "body": "..." }
    const jsonRegex = /\{[\s\n]*"heading":\s*"([^"]+)",[\s\n]*"body":\s*"([\s\S]*?)"[\s\n]*\}/g;
    if (content.match(jsonRegex)) {
        content = content.replace(jsonRegex, (match, heading, body) => {
            // Unescape quotes and newlines in the body
            const cleanBody = body.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            return `## ${heading}\n\n${cleanBody}`;
        });
        fixes.push('Fixed JSON Squashing');
    }

    // 2. Fix unclosed LaTeX blocks (odd number of $$)
    const lines = content.split('\n');
    let inBlock = false;
    let newLines = [];
    for (let line of lines) {
        const count = (line.match(/\$\$/g) || []).length;
        if (count % 2 !== 0) {
            // If it's an odd number of $$ in a single line, it's likely a broken single-line block
            // Like "$$ formula $$" with a typo or just "$$ formula"
            if (line.includes('$$') && !line.includes('$$', line.indexOf('$$') + 2)) {
                // If it's at the end of the line, close it
                if (line.trim().endsWith('$$')) {
                     // already has it at end, maybe at start?
                } else {
                    line = line.trim() + ' $$';
                }
            }
        }
        newLines.push(line);
    }
    content = newLines.join('\n');

    // Global $$ count check
    const totalDollarCount = (content.match(/\$\$/g) || []).length;
    if (totalDollarCount % 2 !== 0) {
        // Find the last $$ and either remove it or add one at the end
        if (content.lastIndexOf('$$') > content.length - 100) {
            content = content + '\n$$';
        } else {
            // Remove the last rogue $$
            const lastIdx = content.lastIndexOf('$$');
            content = content.slice(0, lastIdx) + content.slice(lastIdx + 2);
        }
        fixes.push('Fixed odd number of $$ delimiters');
    }

    // 3. Fix the specific broken frac pattern that remains: $\frac{...}{ }
    content = content.replace(/\\frac\{([^\}]*)\}\{\s*\}/g, '\\frac{$1}{b}');

    // 4. Fix double-double dollars created by previous scripts
    content = content.replace(/\$\$\s*\$\$/g, '$$$$');

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Sanity Guard Fixer completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
