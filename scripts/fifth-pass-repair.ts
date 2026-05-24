/**
 * FIFTH PASS — Comprehensive naked LaTeX wrapping
 * Wraps ANY remaining LaTeX commands found outside $ delimiters
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

const CMDS = 'frac|sqrt|sin|cos|tan|int|sum|prod|lim|theta|alpha|delta|sigma|lambda|pi|nabla|partial|ln|log|circ|text|vec|infty|leq|geq|neq|approx|equiv|pm|times|mu|phi|psi|epsilon|rho|tau|nu|Delta|cdot|ldots|propto|sec|csc|cot|omega|beta|gamma|rightarrow|leftarrow|Rightarrow|mathbb|mathrm|overline|underline|hat|bar|binom|displaystyle|cancel|perp|parallel|subset|supset|cup|cap|forall|exists|notin|mathbf|mathcal';
const cmdRe = new RegExp('\\\\(?:' + CMDS + ')');

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const orig = content;

    const lines = content.split('\n');
    let inFM = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.replace(/\r$/, '').trim();

        if (trimmed === '---') { inFM = !inFM; continue; }
        if (inFM) continue;
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```') ||
            trimmed.startsWith('|') || trimmed.startsWith('!') ||
            trimmed.startsWith('📖') || trimmed.startsWith('- 📖') ||
            trimmed.includes('[DOI') || trimmed.includes('http') ||
            trimmed.startsWith('*This') || trimmed.startsWith('*Content') ||
            trimmed.startsWith('*🔓')) continue;

        // Strip content inside existing $...$ to check for naked LaTeX
        const stripped = line.replace(/\$[^$]+\$/g, 'MATH');
        if (!cmdRe.test(stripped)) continue;

        // This line has naked LaTeX. Let's fix it.
        // Strategy: find contiguous runs of LaTeX outside $ and wrap them

        let result = '';
        let j = 0;
        while (j < line.length) {
            if (line[j] === '$') {
                // Find matching closing $
                const end = line.indexOf('$', j + 1);
                if (end !== -1) {
                    result += line.substring(j, end + 1);
                    j = end + 1;
                } else {
                    result += line[j];
                    j++;
                }
            } else {
                // We're outside $ — scan for LaTeX commands
                let segment = '';
                let k = j;
                while (k < line.length && line[k] !== '$') {
                    segment += line[k];
                    k++;
                }

                // Now wrap any LaTeX in this segment
                // Find runs that contain backslash commands
                segment = wrapNakedMath(segment);

                result += segment;
                j = k;
            }
        }

        lines[i] = result;
    }
    content = lines.join('\n');

    // Final: Fix any $$ that got created (not block math)
    // Inline $$ is always wrong
    content = content.replace(/\$\$([^$\n]+)\$\$/g, (m, inner) => `$${inner}$`);

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\n🔧 Fifth pass repaired ${totalFixes} files.`);

function wrapNakedMath(segment: string): string {
    // Don't touch segments that are just prose
    if (!cmdRe.test(segment)) return segment;

    // Strategy: find the longest substring that contains LaTeX and wrap it
    // We look for patterns like: PROSE $EQUATION$ PROSE or PROSE NAKED_EQUATION PROSE

    // Pattern 1: "**Answer:** B) \frac{...}" → "**Answer:** B) $\frac{...}$"
    segment = segment.replace(
        /(\*\*Answer:\*\*\s*[A-D]\)\s*)(\\[a-zA-Z].*?)(\s*\*\*|\s*$)/g,
        (m, prefix, math, suffix) => `${prefix}$${math.trim()}$${suffix}`
    );

    // Pattern 2: "**Answer:** LETTER) TEXT, explanation" — answer with explanation
    segment = segment.replace(
        /(\*\*Answer:\*\*\s*[A-D]\)\s*)(\\[a-zA-Z][^,]*)(,\s+.*)/g,
        (m, prefix, math, rest) => `${prefix}$${math.trim()}$${rest}`
    );

    // Pattern 3: Lines like "O(n \log n)" — CS complexity
    segment = segment.replace(
        /O\(([^)]*\\[a-zA-Z][^)]*)\)/g,
        (m, inner) => `$O(${inner})$`
    );

    // Pattern 4: Standalone naked math: "\frac{...}{...}" or "\sin \theta"
    // This is a greedy match — find contiguous LaTeX tokens
    segment = segment.replace(
        /((?:^|\s|[:(]))(\\(?:frac|sqrt|sin|cos|tan|int|sum|prod|lim|theta|alpha|delta|sigma|lambda|pi|ln|log|circ|text|vec|nabla|partial|infty|sec|csc|cot|mu|phi|psi|epsilon|rho|tau|nu|Delta|cdot|pm|times|div|rightarrow|leftarrow|Rightarrow|propto|leq|geq|neq|approx|equiv|overline|hat|bar|binom|mathrm|mathbb|omega|beta|gamma)[^,.\s]*(?:\{[^}]*\})*(?:\s*[=+\-*/^_{}()\[\]\\a-zA-Z0-9.|]+)*)/g,
        (m, before, math) => {
            const cleaned = math.trim();
            if (!cleaned || cleaned.length < 3) return m;
            // Don't wrap if it's already inside something that looks wrapped
            return `${before}$${cleaned}$`;
        }
    );

    // Pattern 5: "a \times b" type patterns
    segment = segment.replace(
        /([a-zA-Z0-9])\s*(\\times)\s*([a-zA-Z0-9])/g,
        '$$$1 \\times $3$$'
    );

    // Clean up: remove $$ (double dollar) that aren't block math
    segment = segment.replace(/\$\$/g, '$');

    return segment;
}
