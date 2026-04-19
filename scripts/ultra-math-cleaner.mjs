/**
 * ULTRA-PRECISION MATH CLEANER
 * Target: Tokenized math blocks like $\frac$-b \pm $\sqrt{...}$ and $ \frac$p$q$
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

    // 1. Fix "split" fractions: $\frac$num$den$ -> $\frac{num}{den}$
    const splitFracRegex = /\$\\frac\$([^\$]*)\$([^\$]*)\$/g;
    if (content.match(splitFracRegex)) {
        content = content.replace(splitFracRegex, '$\\frac{$1}{$2}$');
        fixes.push('Fixed split fractions');
    }

    // 2. Fix tokenized math blocks: $token$ $token$ $token$ -> $token token token$
    // This is hard to do without false positives, but we can look for specific sequences
    const tokenizedRegex = /\$([^\$]*)\$\s*\$([^\$]*)\$/g;
    let iterations = 0;
    while (content.match(tokenizedRegex) && iterations < 10) {
        content = content.replace(tokenizedRegex, '$$1 $2$');
        iterations++;
    }
    if (iterations > 0) fixes.push('Merged tokenized math blocks');

    // 3. Fix the specific \frac pattern from quadratic notes: $\frac$-b \pm $\sqrt{{b^2 - 4ac}}$2a$
    // This often looks like: $\frac token token token$token$
    const complexFracRegex = /\$\\frac\s*([^\$]*)\s*\$([^\$]*)\s*\$([^\$]*)\$/g;
    if (content.match(complexFracRegex)) {
        content = content.replace(complexFracRegex, '$$\\frac{$1}{$3} $2$$');
        fixes.push('Fixed complex split fractions');
    }

    // 4. Fix double dollar signs created by merging
    content = content.replace(/\$\$\s*\$\$/g, '$$');

    // 5. Fix \sqrt{...$}$ (common mistake where $ is inside the brace)
    const sqrtFixRegex = /\\sqrt\{([^\$]*)\$\}/g;
    if (content.match(sqrtFixRegex)) {
        content = content.replace(sqrtFixRegex, '\\sqrt{$1}$');
        fixes.push('Fixed sqrt brace/dollar mismatch');
    }

    // 6. Fix \frac{...$}{...$}
    const fracFixRegex = /\\frac\{([^\$]*)\$\}\{([^\$]*)\$\}/g;
    if (content.match(fracFixRegex)) {
        content = content.replace(fracFixRegex, '\\frac{$1}{$2}$');
        fixes.push('Fixed frac brace/dollar mismatch');
    }

    // 7. Remove any trailing $ at the end of a line that doesn't have a matching opening $
    const lines = content.split('\n');
    let lineFixed = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const count = (line.match(/\$/g) || []).length;
        if (count % 2 !== 0 && line.endsWith('$')) {
            lines[i] = line.slice(0, -1);
            lineFixed = true;
        }
    }
    if (lineFixed) {
        content = lines.join('\n');
        fixes.push('Fixed unmatched trailing $');
    }

    // 8. Fix "PYQs" again just to be sure
    content = content.replace(/Solved Yes/g, 'Solved PYQs');

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Ultra-precision math cleaning completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
report.forEach(r => {
    console.log(`📝 ${r.file}`);
    r.fixes.forEach(f => console.log(`   • ${f}`));
});
