/**
 * DEEP SANITY FIXER
 * More aggressive JSON and LaTeX fixing
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

    // 1. More aggressive JSON Squashing fix
    // It might not be a valid JSON, just looking like one
    const looseJsonRegex = /\{\s*"heading":\s*"([^"]+)",\s*"body":\s*"([\s\S]*?)"\s*\}/g;
    if (content.match(looseJsonRegex)) {
        content = content.replace(looseJsonRegex, (match, heading, body) => {
            const cleanBody = body.replace(/\\n/g, '\n').replace(/\\"/g, '"');
            return `\n## ${heading}\n\n${cleanBody}\n`;
        });
        fixes.push('Fixed JSON Squashing (Loose)');
    }

    // 2. Fix odd number of $$ by scanning the whole file
    const matches = content.match(/\$\$/g);
    if (matches && matches.length % 2 !== 0) {
        // If there's an odd number, find the one that doesn't have a partner nearby
        // Or just append one at the end if it's near the end
        if (content.lastIndexOf('$$') > content.length - 200) {
            content += '\n$$';
        } else {
            // Find a line that starts with $$ and doesn't end with $$
            const lines = content.split('\n');
            let fixedOdd = false;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('$$') && !lines[i].trim().endsWith('$$')) {
                    lines[i] = lines[i].trim() + ' $$';
                    fixedOdd = true;
                    break;
                }
            }
            if (!fixedOdd) {
                // Just remove the last rogue one
                const lastIdx = content.lastIndexOf('$$');
                content = content.slice(0, lastIdx) + content.slice(lastIdx + 2);
            }
        }
        fixes.push('Corrected odd $$ delimiter count');
    }

    // 3. Fix the "lb EQ 0" typo once and for all
    content = content.replace(/lb\s*EQ\s*0/g, '$b \\neq 0$');

    // 4. Fix split \fracs that look like \frac{...} ... { }
    content = content.replace(/\\frac\{([^\}]*)\}\s*\{([^\}]*)\}/g, '\\frac{$1}{$2}');

    // 5. Final spacing cleanup
    content = content.replace(/\n{4,}/g, '\n\n\n');

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Deep Sanity Fixer completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
