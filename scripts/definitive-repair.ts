/**
 * DEFINITIVE BLOG REPAIR — Single pass, all patterns
 * Fixes: frontmatter, hallucinated commands, constants, unclosed $, stray $, naked math, garbage tokens
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

const PROSE_WORDS = 'is|are|was|were|the|of|for|in|on|at|and|or|but|not|that|this|has|have|had|can|could|should|would|will|then|than|with|from|by|as|be|been|using|we|since|here|its|it|which|where|when|who|how|if|also|only|because|while|so|positive|negative|angle|side|effect|increases|decreases|value|values|depends|lies|defined|remember|forget|does|do|may|many|most|make|sure|cm|Find|Let|Therefore|Solving|Taking|Since|Substitute|Practice|Review|Always|Check|Use|Remember|Forgetting|Not|The|Many|Similarly|For|It|Consider|Choose|When|Don|Put|Continue|Content|This';

let totalFixes = 0;
const flagged: string[] = [];

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let c = fs.readFileSync(filePath, 'utf-8');
    const orig = c;

    // === PHASE 0: Flag irrecoverable files ===
    if (c.includes('(suggestion limit reached)')) {
        c = c.replace(/\(suggestion limit reached\)/g, '');
        c = c.replace(/manualReview: false/, 'manualReview: true');
        flagged.push(file);
    }

    // === PHASE 1: Frontmatter ===
    c = c.replace(/^-\$--/gm, '---');
    // Remove stray $ in title values
    c = c.replace(/(title: "[^"]*?)\$([^"]*?")/g, '$1$2');
    // Lone $ on its own line
    c = c.replace(/^\$\s*$/gm, '');

    // === PHASE 2: Hallucinated LaTeX commands ===
    c = c.replace(/\\franc\b/g, '\\frac');
    c = c.replace(/\\sort\b/g, '\\sqrt');
    c = c.replace(/\\CIRC\b/g, '\\circ');
    c = c.replace(/\\circa\b/g, '\\circ');
    c = c.replace(/\\proto\b/g, '\\propto');
    c = c.replace(/\\tank\b/g, '\\tanh');
    c = c.replace(/\\INT\b/g, '\\int');

    // === PHASE 3: Chemistry constants ===
    c = c.replace(/APK_b\b/g, 'pK_b');
    c = c.replace(/APK_a\b/g, 'pK_a');
    c = c.replace(/OK_by\b/g, 'K_b');
    c = c.replace(/OK_b\b/g, 'K_b');
    c = c.replace(/OK_a\b/g, 'K_a');
    c = c.replace(/K_by\b/g, 'K_b');
    c = c.replace(/\bpOK_b\b/g, 'pK_b');
    c = c.replace(/\bpOK_a\b/g, 'pK_a');

    // === PHASE 4: Text artifacts ===
    c = c.replace(/Solved Yes/g, 'Solved PYQs');
    c = c.replace(/\bPDQ\b/g, 'PYQ');
    c = c.replace(/\+ CD\b/g, '+ C');
    c = c.replace(/\+ CD\$/g, '+ C$');

    // === PHASE 5: Stray $ in non-math (links, emojis) ===
    c = c.replace(/- \$📖/g, '- 📖');
    c = c.replace(/^\$📖/gm, '📖');
    c = c.replace(/Revision\$ —/g, 'Revision —');
    c = c.replace(/Mathematics Revision\$ —/g, 'Mathematics Revision —');
    // Fix "- $📖 [Title$ — Guide" patterns generically
    c = c.replace(/\$\s*—\s*Grandmaster Guide/g, ' — Grandmaster Guide');

    // === PHASE 6: Wrap naked math lines ===
    // Lines starting with -/bullet that have \ commands but NO $ at all
    const lines = c.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') ||
            trimmed.startsWith('!') || trimmed.startsWith('```') || trimmed.startsWith('|') ||
            trimmed.startsWith('*') || trimmed.startsWith('[')) continue;

        // Bullet + naked LaTeX (no $ anywhere but has backslash commands)
        const bulletMatch = line.match(/^(\s*-\s+)(.*\\(?:sin|cos|tan|frac|sqrt|int|sum|prod|lim|theta|alpha|beta|gamma|delta|omega|sigma|lambda|pi|ln|log|left|right|circ|propto|text|begin|end|vec|hat|nabla|partial|infty|leq|geq|neq|approx|equiv|pm|times|div|rightarrow|leftarrow|Rightarrow|cdot|ldots|sec|csc|cot|mu|phi|psi|epsilon|rho|tau|nu|chi|xi|kappa|Delta|displaystyle|cancel|mathrm|mathbb|binom|overline|underline|boxed|bar|perp|parallel|subset|supset|cup|cap|forall|exists|notin|mathbf|mathcal).*)$/);
        if (bulletMatch && !line.includes('$') && !line.includes('[') && !line.includes('http')) {
            // Check if it contains a " — " separator (formula — explanation)
            const parts = bulletMatch[2].split(' — ');
            if (parts.length === 2) {
                lines[i] = `${bulletMatch[1]}$${parts[0].trim()}$ — ${parts[1].trim()}`;
            } else {
                lines[i] = `${bulletMatch[1]}$${bulletMatch[2].trim()}$`;
            }
        }
    }
    c = lines.join('\n');

    // === PHASE 7: Close unclosed $ before prose words ===
    // Pattern: $MATH_STUFF PROSE_WORD → $MATH_STUFF$ PROSE_WORD
    const closeRegex = new RegExp(
        `\\$([^$\\n]{1,80}?)\\s+(${PROSE_WORDS})(?=\\s|[,.\\'\\)\\*]|$)`,
        'gm'
    );
    // Run multiple passes since one fix may reveal another
    for (let pass = 0; pass < 5; pass++) {
        const before = c;
        c = c.replace(closeRegex, (match, math, word) => {
            // Don't close if the math part itself looks like prose (no backslash or math symbols)
            if (!/[\\^_{}]/.test(math) && !/\d/.test(math)) return match;
            return `$${math.trimEnd()}$ ${word}`;
        });
        if (c === before) break;
    }

    // === PHASE 8: Fix specific remaining patterns ===
    // "be ex" → "be $x$" (variable x written as "ex")
    c = c.replace(/\bbe ex\b/g, 'be $x$');
    c = c.replace(/\bbe by\b/g, 'be $y$');
    // "ex =" at start of equation context
    c = c.replace(/\bex = /g, '$x$ = ');
    // "Let ex" → "Let $x$"
    c = c.replace(/\bLet ex\b/g, 'Let $x$');

    // Fix $+IN → $+I$ (inductive effect)
    c = c.replace(/\$\+IN effect/g, '$+I$ effect');
    c = c.replace(/\$\+IN\b/g, '$+I$');

    // === PHASE 9: Final cleanup ===
    // Remove double $$ that aren't block math
    // (Block math should be on its own line; inline $$ is always wrong)
    c = c.replace(/\$\$([^$\n]+)\$\$/g, (match, inner) => {
        // If it's on its own line, keep as block math
        return `$${inner}$`;
    });

    // Fix \\the\na → \\theta (newline corruption from \t being evaluated)
    // This is unlikely after git checkout but just in case
    c = c.replace(/\\the\r?\na\b/g, '\\theta');

    if (c !== orig) {
        fs.writeFileSync(filePath, c, 'utf-8');
        totalFixes++;
        console.log(`✅ ${file}`);
    }
}

console.log(`\n🔧 Repaired ${totalFixes} files.`);
if (flagged.length > 0) {
    console.log(`\n⚠️ ${flagged.length} files flagged for manual review (had "suggestion limit reached"):`);
    flagged.forEach(f => console.log(`   - ${f}`));
}
