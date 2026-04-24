/**
 * THIRD PASS — Final cleanup for remaining edge cases
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const orig = content;

    const lines = content.split('\n');
    let inFrontmatter = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trimEnd();
        const stripped = trimmed.replace(/\r$/, '');

        // Track frontmatter
        if (stripped === '---') {
            inFrontmatter = !inFrontmatter;
            continue;
        }
        if (inFrontmatter) continue;

        // Skip empty, headings, code, images, tables, links, emoji links
        if (!stripped || stripped.startsWith('#') || stripped.startsWith('```') ||
            stripped.startsWith('|') || stripped.startsWith('!') ||
            stripped.startsWith('📖') || stripped.startsWith('- 📖') ||
            stripped.startsWith('*This') || stripped.startsWith('*Content') ||
            stripped.startsWith('*🔓') || stripped.startsWith('Continue') ||
            stripped.startsWith('Put your') || stripped.startsWith('1.') ||
            stripped.startsWith('2.') || stripped.startsWith('3.') ||
            stripped.includes('[DOI') || stripped.includes('http')) continue;

        // === FIX A: MCQ answer lines without $ ===
        // Handles: "A) \frac{...}" or "B) \cos \theta" (with or without leading spaces)
        // Also handles lines like just "A) \frac{1}{\sqrt{2}}"
        const mcqRe = /^(\s*[A-D]\)\s+)(\\[a-zA-Z].*?)(\s*\r?)$/;
        const mcqM = line.match(mcqRe);
        if (mcqM && !mcqM[2].includes('$')) {
            lines[i] = `${mcqM[1]}$${mcqM[2].trim()}$${mcqM[3]}`;
            continue;
        }

        // === FIX B: Naked bullet math with extra whitespace ===
        // "-   \sin^2 \theta + \cos^2 \theta = 1"
        const nakedRe = /^(\s*-\s{1,5})(\\(?:sin|cos|tan|frac|sqrt|int|sum|prod|lim|theta|alpha|beta|gamma|delta|omega|sigma|lambda|pi|ln|log|left|right|circ|propto|text|begin|end|vec|hat|nabla|partial|infty|leq|geq|neq|approx|equiv|pm|times|div|sec|csc|cot|mu|phi|psi|epsilon|rho|tau|nu|Delta|displaystyle|cancel|mathrm|mathbb|binom|overline|cdot|ldots|rightarrow|leftarrow|Rightarrow|perp|parallel|subset|supset|cup|cap|forall|exists|notin|mathbf|mathcal).*?)(\s*\r?)$/;
        const nakedM = line.match(nakedRe);
        if (nakedM && !nakedM[2].includes('$')) {
            const mathPart = nakedM[2].trim();
            const dashIdx = mathPart.indexOf(' — ');
            if (dashIdx > 0) {
                lines[i] = `${nakedM[1]}$${mathPart.substring(0, dashIdx).trim()}$ — ${mathPart.substring(dashIdx + 3).trim()}${nakedM[3]}`;
            } else {
                lines[i] = `${nakedM[1]}$${mathPart}$${nakedM[3]}`;
            }
            continue;
        }

        // === FIX C: Partial naked math after = sign ===
        // "  \\tan \\theta = $\\frac{...}$" — the \tan \theta before = has no $
        const partialRe = /^(\s*-\s{1,5})(\\[a-zA-Z][^$]*?=\s*)\$(.+)\$(\s*\r?)$/;
        const partialM = line.match(partialRe);
        if (partialM) {
            lines[i] = `${partialM[1]}$${partialM[2]}${partialM[3]}$${partialM[4]}`;
            continue;
        }
    }
    content = lines.join('\n');

    // === FIX D: Unclosed $ at end of line — final sweep ===
    // Count $ per line. If odd and line ends with math, add closing $.
    const lines3 = content.split('\n');
    for (let i = 0; i < lines3.length; i++) {
        const line = lines3[i];
        // Count unescaped $
        let count = 0;
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '$' && (j === 0 || line[j-1] !== '\\')) count++;
        }
        if (count % 2 !== 0) {
            const stripped = line.replace(/\r$/, '').trimEnd();
            // Don't touch frontmatter, headings, or lines with links
            if (stripped === '---' || stripped.startsWith('#') || stripped.includes('[') ||
                stripped.includes('heroImage') || stripped.includes('title:') ||
                stripped.includes('description:') || stripped.includes('date:') ||
                stripped.includes('category:') || stripped.includes('practice_link:') ||
                stripped.includes('manualReview:')) continue;

            // If ends with math-like char, add $
            if (/[a-zA-Z0-9\}\)\\\.]$/.test(stripped)) {
                lines3[i] = line.replace(/(\s*\r?)$/, (m) => `$${m}`);
            }
        }
    }
    content = lines3.join('\n');

    // === FIX E: "ex = 5\sqrt{3}$" → "$x = 5\sqrt{3}$" ===
    content = content.replace(/\bex = (\d+\\)/g, '$$x = $1');
    // "Solved for ex," → "Solved for $x$,"
    content = content.replace(/\bfor ex,/g, 'for $x$,');
    content = content.replace(/\bfor ex\b/g, 'for $x$');
    // "be ex" → "be $x$"  
    content = content.replace(/\bbe ex\b/g, 'be $x$');
    content = content.replace(/\bbe by\b/g, 'be $y$');

    // === FIX F: $\tan \theta depend$ → $\tan \theta$ depend ===
    content = content.replace(/(\$[^$]+?)\s+(depend|on|off)\$/g, '$1$ $2');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\n🔧 Third pass repaired ${totalFixes} files.`);
