import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix \circa -> \circ
    content = content.replace(/\\circa/g, '\\circ');
    // Fix \CIRC -> \circ
    content = content.replace(/\\CIRC/g, '\\circ');

    // Fix unclosed basic inline math: $\sin \theta, -> $\sin \theta$,
    // Match a single $ followed by typical math (backslash, letters) up to a space/comma, without a closing $
    const inlineMathPattern = /\$([a-zA-Z\\]+)\s+([a-zA-Z\\]+)([\s,\.])/g;
    content = content.replace(inlineMathPattern, (match, p1, p2, p3) => {
        // Only if it doesn't already end with $
        // E.g. $\sin \theta, -> $\sin \theta$,
        if (p1.startsWith('\\')) {
            return `$${p1} ${p2}$${p3}`;
        }
        return match;
    });

    // Fix $\sin \theta$  with missing $ in front
    // sometimes it's just `\sin \theta` without $
    content = content.replace(/ \s*\\sin \s*\\theta\s* /g, ' $\\sin \\theta$ ');
    content = content.replace(/ \s*\\cos \s*\\theta\s* /g, ' $\\cos \\theta$ ');
    content = content.replace(/ \s*\\tan \s*\\theta\s* /g, ' $\\tan \\theta$ ');

    // Fix (suggestion limit reached) which broke integrals
    content = content.replace(/\(suggestion limit reached\)/g, '');

    // Fix "ex." and "by." typos
    content = content.replace(/be ex\./g, 'be $x$.');
    content = content.replace(/be by\./g, 'be $y$.');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\nApplied final patch to ${totalFixes} files.`);
