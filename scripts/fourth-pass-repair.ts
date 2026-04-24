/**
 * FOURTH PASS — Fix split-dollar formulas in "**Label:** EQUATION — description" patterns
 * These lines have partial $ wrapping like: $\frac{a}{b}$ = \alpha \delta T
 * The whole equation before " — " needs to be in one $...$
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

    // === FIX A: "- **Label:** PARTIAL$MATH$ = NAKED_MATH — description" ===
    // Rewrap everything between the colon and the " — " in a single $...$
    content = content.replace(
        /^(\s*-\s+\*\*[^*]+(?:Formula|Law|Equation|Rule|Identity|Theorem|Principle|Relation):\*\*\s+)(.*?)(\s+—\s+.*)$/gm,
        (match, prefix, equation, suffix) => {
            // Strip all existing $ from the equation part
            let clean = equation.replace(/\$/g, '').trim();
            // Remove stray closing braces at end
            while (clean.endsWith('}') && (clean.match(/\{/g) || []).length < (clean.match(/\}/g) || []).length) {
                clean = clean.slice(0, -1);
            }
            if (!clean) return match;
            return `${prefix}$${clean}$${suffix}`;
        }
    );

    // === FIX B: Same for generic "- **Label:** EQUATION — desc" without specific keywords ===
    content = content.replace(
        /^(\s*-\s+\*\*[^*]+:\*\*\s+)(.*?\\[a-zA-Z].*?)(\s+—\s+.*)$/gm,
        (match, prefix, equation, suffix) => {
            // Only fix if equation has mix of $ and naked math
            if (!equation.includes('\\')) return match;
            let clean = equation.replace(/\$/g, '').trim();
            while (clean.endsWith('}') && (clean.match(/\{/g) || []).length < (clean.match(/\}/g) || []).length) {
                clean = clean.slice(0, -1);
            }
            if (!clean) return match;
            return `${prefix}$${clean}$${suffix}`;
        }
    );

    // === FIX C: "- **Label:** VAR = EQUATION — desc" (starts with variable) ===
    content = content.replace(
        /^(\s*-\s+\*\*[^*]+:\*\*\s+)([A-Za-z_]+(?:\{[^}]*\})?\s*=\s*.*?\\[a-zA-Z].*?)(\s+—\s+.*)$/gm,
        (match, prefix, equation, suffix) => {
            let clean = equation.replace(/\$/g, '').trim();
            while (clean.endsWith('}') && (clean.match(/\{/g) || []).length < (clean.match(/\}/g) || []).length) {
                clean = clean.slice(0, -1);
            }
            return `${prefix}$${clean}$${suffix}`;
        }
    );

    // === FIX D: Naked "- **Label:** EQUATION — desc" where EQUATION starts with a variable ===
    // e.g. "- **Internal Energy Formula:** \delta U = Q + W — ..."
    // or   "- **Stefan-Boltzmann Law:** E = \sigma T^4 — ..."
    content = content.replace(
        /^(\s*-\s+\*\*[^*]+:\*\*\s+)([A-Za-z_()\\][^—]*?\\[a-zA-Z][^—]*)(\s+—\s+.*)$/gm,
        (match, prefix, equation, suffix) => {
            // Don't double-wrap if already has balanced $
            const dollarCount = (equation.match(/\$/g) || []).length;
            if (dollarCount >= 2 && dollarCount % 2 === 0) return match;
            let clean = equation.replace(/\$/g, '').trim();
            while (clean.endsWith('}') && (clean.match(/\{/g) || []).length < (clean.match(/\}/g) || []).length) {
                clean = clean.slice(0, -1);
            }
            return `${prefix}$${clean}$${suffix}`;
        }
    );

    // === FIX E: Lines like "- Q = hA(T_1 - T_2) — description" (no bold, no $) ===
    content = content.replace(
        /^(\s*-\s+)([A-Za-z_]+\s*=\s*[^—]*?(?:\\[a-zA-Z]|[_^{])[^—]*)(\s+—\s+.*)$/gm,
        (match, prefix, equation, suffix) => {
            if (equation.includes('$')) return match;
            return `${prefix}$${equation.trim()}$${suffix}`;
        }
    );

    // === FIX F: Fix mismatched brace/dollar: $\sqrt{\frac{3RT}{M}$} ===
    // Pattern: $ before closing brace that should be inside the $
    content = content.replace(/\$\}/g, '}$');

    // === FIX G: Fix $\frac{1}{\sqrt{2}$ → $\frac{1}{\sqrt{2}}$ ===
    // Misplaced $ inside braces
    content = content.replace(/\\sqrt\{([^}$]*)\$\}/g, '\\sqrt{$1}$');
    content = content.replace(/\\frac\{([^}$]*)\$\}/g, '\\frac{$1}$');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\n🔧 Fourth pass repaired ${totalFixes} files.`);
