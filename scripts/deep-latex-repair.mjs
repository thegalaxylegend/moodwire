/**
 * DEEP LATEX REPAIR SCRIPT — Fixing Delimiters and Complex Typos
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

    // 1. Fix { ... } and \{ ... \} used as math delimiters
    // Pattern: { \frac... } or \{ \frac... \}
    const pseudoDelimRegex = /[\\\{]\{([\s\S]*?)\}[\\\}]/g;
    const pseudoDelimCount = (content.match(pseudoDelimRegex) || []).length;
    if (pseudoDelimCount > 0) {
        content = content.replace(pseudoDelimRegex, (match, formula) => {
            // If it's short, use inline $. If it has \lim or \frac or is long, use block $$.
            const trimmed = formula.trim();
            if (trimmed.includes('\\frac') || trimmed.includes('\\lim') || trimmed.includes('\\sum') || trimmed.length > 50) {
                return `\n\n$$ ${trimmed} $$\n\n`;
            }
            return `$${trimmed}$`;
        });
        fixes.push(`Pseudo-delimiters { } → $ or $$ (${pseudoDelimCount}x)`);
    }

    // 2. Fix raw LaTeX blocks that missed delimiters
    // Pattern: lines starting with math commands that are not in $ or $$
    const rawMathRegex = /^(?!\s*[-\d*#$|])\s*(\\(?:lim|frac|sin|cos|tan|sqrt|log|exp|int|sum|partial|nabla|theta|alpha|beta|gamma|delta|phi|psi|omega|pi|infty)[\s\S]*?)$/gm;
    const rawMathCount = (content.match(rawMathRegex) || []).length;
    if (rawMathCount > 0) {
        content = content.replace(rawMathRegex, (match, formula) => {
            return `\n$$ ${formula.trim()} $$\n`;
        });
        fixes.push(`Raw LaTeX blocks → $$ $$ (${rawMathCount}x)`);
    }

    // 3. Fix \sort' and other broken \sqrt variants
    // "\sort’d^2 - b^2}" -> "\sqrt{d^2 - b^2}"
    if (content.includes("\\sort'")) {
        content = content.replace(/\\sort'([^}]*)\}/g, "\\sqrt{$1}");
        fixes.push(`Fixed \\sort' broken sqrt`);
    }

    // 4. Fix double dollar signs that might have been accidentally created with extra spaces
    content = content.replace(/\$\$\s+\$\$/g, '$$$$');

    // 5. Fix \frac{}{} where arguments are missing or broken
    // e.g. \frac{}{} might happen if SLR was removed and left empty braces
    const emptyFracRegex = /\\frac\{\s*\}\{\s*\}/g;
    if (content.match(emptyFracRegex)) {
        content = content.replace(emptyFracRegex, '\\frac{a}{b}');
        fixes.push(`Fixed empty \\frac{ }{ }`);
    }

    // 6. Fix \theta and other symbols often missing backslashes or having weird prefixes
    // "ex^2" -> "$x^2$" if in context of math, but this is risky. 
    // Let's stick to obvious typos.

    // 7. Fix $...$ inside $...$ (nested delimiters)
    const nestedMathRegex = /\$\$([\s\S]*?)\$([\s\S]*?)\$([\s\S]*?)\$\$/g;
    if (content.match(nestedMathRegex)) {
        content = content.replace(nestedMathRegex, '$$$1$2$3$$');
        fixes.push(`Fixed nested math delimiters`);
    }

    // 8. Fix "circa" and "CIRC" again just in case some were missed or in different case
    content = content.replace(/\^circ/gi, '^{\\circ}');

    // 9. Fix double newlines around $$ to ensure proper block rendering
    content = content.replace(/\n\s*\$\$\s*\n/g, '\n\n$$\n');
    content = content.replace(/\n\s*\$\$\s*([^\n])/g, '\n\n$$\n$1');

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Deep LaTeX repair completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
report.forEach(r => {
    console.log(`📝 ${r.file}`);
    r.fixes.forEach(f => console.log(`   • ${f}`));
});
