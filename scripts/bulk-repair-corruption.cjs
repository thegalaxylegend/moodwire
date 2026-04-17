/**
 * 🔧 BULK CORRUPTION REPAIR — Zero API Calls
 * 
 * Fixes ALL known corruption patterns across every blog using
 * pure deterministic string/regex operations. No LLM calls.
 * 
 * Run: node scripts/bulk-repair-corruption.cjs
 * Dry run: node scripts/bulk-repair-corruption.cjs --dry-run
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const DRY_RUN = process.argv.includes('--dry-run');

// ═══════════════════════════════════════════════════════
// KNOWN LATEX COMMANDS — used for case-normalization
// and naked-wrapping detection
// ═══════════════════════════════════════════════════════
const LATEX_COMMANDS = [
    'frac', 'text', 'times', 'sqrt', 'sum', 'int', 'prod',
    'alpha', 'beta', 'gamma', 'delta', 'theta', 'Delta', 'Sigma',
    'pi', 'mu', 'lambda', 'omega', 'epsilon', 'phi', 'psi',
    'rho', 'sigma', 'tau', 'eta', 'zeta', 'nu', 'xi',
    'infty', 'partial', 'nabla', 'cdot', 'ldots', 'cdots',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'pm', 'mp',
    'cap', 'cup', 'subset', 'supset', 'in', 'notin',
    'forall', 'exists', 'lim', 'log', 'ln', 'sin', 'cos', 'tan',
    'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan',
    'left', 'right', 'overline', 'underline', 'hat', 'bar',
    'vec', 'dot', 'ddot', 'tilde', 'mathbb', 'mathcal', 'mathrm',
    'binom', 'choose', 'pmatrix', 'bmatrix', 'vmatrix',
    'displaystyle', 'textstyle', 'scriptstyle',
    'hline', 'quad', 'qquad', 'space', 'negthickspace',
    'begin', 'end', 'item', 'label', 'ref', 'cite',
    'boxed', 'cancel', 'color', 'textcolor',
];

// Build case-insensitive lookup: lowercase → correct casing
const COMMAND_CORRECT_CASE = {};
for (const cmd of LATEX_COMMANDS) {
    COMMAND_CORRECT_CASE[cmd.toLowerCase()] = cmd;
}

function repairBlog(filePath) {
    const slug = path.basename(filePath, '.md');
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    const fixes = [];

    // Separate frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    let frontmatter = fmMatch ? fmMatch[1] : '';
    let body = fmMatch ? fmMatch[2] : content;

    // ═══════════════════════════════════════════════════════
    // FIX 1: Remove "(suggestion limit reached)" spam
    // ═══════════════════════════════════════════════════════
    const slrCount = (body.match(/\(suggestion limit reached\)/g) || []).length;
    if (slrCount > 0) {
        body = body.replace(/\(suggestion limit reached\)/g, '');
        // Clean orphaned content: lines that became empty or near-empty
        body = body.replace(/^[\s,\-*]*$/gm, '');
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Removed ${slrCount} "(suggestion limit reached)" artifacts`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 2: Case-normalize LaTeX commands
    // e.g., \fRAC → \frac, \tEXT → \text, \tTIMES → \times
    // ═══════════════════════════════════════════════════════
    let caseFixCount = 0;
    // Match backslash followed by letters (potential LaTeX command)
    body = body.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
        const lower = cmd.toLowerCase();
        if (COMMAND_CORRECT_CASE[lower] && cmd !== COMMAND_CORRECT_CASE[lower]) {
            caseFixCount++;
            return '\\' + COMMAND_CORRECT_CASE[lower];
        }
        return match;
    });
    if (caseFixCount > 0) {
        fixes.push(`Case-normalized ${caseFixCount} LaTeX commands`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 3: Wrap naked LaTeX in $...$ delimiters
    // Detects patterns like \frac{...}{...} or \text{...}
    // that aren't already inside $ delimiters
    // ═══════════════════════════════════════════════════════
    let wrapCount = 0;
    
    // Strategy: Process line by line. For each line, find naked LaTeX
    // commands and wrap them. Skip lines that are already inside $$ blocks.
    const lines = body.split('\n');
    let insideBlockMath = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Track $$ block math boundaries
        const blockMathMarkers = (line.match(/\$\$/g) || []).length;
        if (blockMathMarkers % 2 !== 0) {
            insideBlockMath = !insideBlockMath;
        }
        if (insideBlockMath) continue;
        
        // Skip table header/separator lines
        if (/^\s*\|/.test(line)) continue;
        
        // Skip lines that are already fully wrapped in $...$
        if (/^\$[^$]+\$$/.test(line.trim())) continue;

        // Find naked LaTeX: \command{...} NOT preceded by $
        // We need to be careful not to break existing inline math
        
        // Pattern: Match \frac{...}{...} or \text{...} that are NOT inside $...$
        // We do this by splitting the line on $ boundaries and only processing non-math segments
        const segments = line.split(/(\$[^$]*\$)/);
        let modified = false;
        
        for (let s = 0; s < segments.length; s++) {
            // Even indices are outside $...$, odd are inside
            if (s % 2 === 0) {
                const seg = segments[s];
                
                // Match \frac{...}{...} patterns (with nested braces)
                const newSeg = seg.replace(
                    /\\(frac|sqrt|text|overline|underline|vec|hat|bar|tilde|mathbb|mathcal|mathrm|boxed)\{/g,
                    (match, cmd) => {
                        // Check if this is already preceded by $ (edge case)
                        const idx = seg.indexOf(match);
                        if (idx > 0 && seg[idx - 1] === '$') return match;
                        modified = true;
                        return '$\\' + cmd + '{';
                    }
                );
                
                if (newSeg !== seg) {
                    segments[s] = newSeg;
                }
            }
        }
        
        if (modified) {
            let newLine = segments.join('');
            
            // Now close the $ we opened. For each unclosed $, find the end of
            // the LaTeX expression and close it.
            // Simple approach: count $ and add closing $ if odd
            const dollarCount = (newLine.match(/\$/g) || []).length;
            if (dollarCount % 2 !== 0) {
                // Find the last LaTeX expression boundary (end of {...} chain)
                // and append $
                // Strategy: find the last } that's part of a LaTeX command
                // and add $ after it
                newLine = balanceInlineMath(newLine);
            }
            
            lines[i] = newLine;
            wrapCount++;
        }
    }
    
    if (wrapCount > 0) {
        body = lines.join('\n');
        fixes.push(`Wrapped naked LaTeX in ${wrapCount} lines with $ delimiters`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 4: "Solved Yes" → "Solved PYQs"
    // ═══════════════════════════════════════════════════════
    if (body.includes('Solved Yes')) {
        body = body.replace(/Solved Yes/g, 'Solved PYQs');
        fixes.push('Fixed "Solved Yes" → "Solved PYQs"');
    }

    // ═══════════════════════════════════════════════════════
    // FIX 5: Clear stale manualReview flags
    // ═══════════════════════════════════════════════════════
    if (frontmatter.includes('manualReview: true')) {
        frontmatter = frontmatter.replace('manualReview: true', 'manualReview: false');
        fixes.push('Cleared stale manualReview flag');
    }

    // ═══════════════════════════════════════════════════════
    // FIX 6: JSON squashing extraction
    // {"heading": "...", "body": "..."} → clean markdown
    // ═══════════════════════════════════════════════════════
    const jsonSquashRegex = /^\s*\{\s*\n?\s*"heading"\s*:\s*"([^"]*?)"\s*,\s*\n?\s*"body"\s*:\s*"/gm;
    let jsMatch;
    let jsonFixCount = 0;
    while ((jsMatch = jsonSquashRegex.exec(body)) !== null) {
        // Find the closing of this JSON block
        const startIdx = jsMatch.index;
        let braceDepth = 0;
        let endIdx = startIdx;
        for (let c = startIdx; c < body.length; c++) {
            if (body[c] === '{') braceDepth++;
            if (body[c] === '}') {
                braceDepth--;
                if (braceDepth === 0) {
                    endIdx = c + 1;
                    break;
                }
            }
        }
        
        if (endIdx > startIdx) {
            const jsonBlock = body.substring(startIdx, endIdx);
            // Extract heading and body from the JSON
            const headingExtract = jsMatch[1];
            // Get body content: everything between "body": " and the closing
            const bodyMatch = jsonBlock.match(/"body"\s*:\s*"([\s\S]*?)"\s*[,}]/);
            if (bodyMatch) {
                let extractedBody = bodyMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                
                const replacement = extractedBody;
                body = body.substring(0, startIdx) + replacement + body.substring(endIdx);
                jsonFixCount++;
            }
        }
    }
    if (jsonFixCount > 0) {
        fixes.push(`Extracted ${jsonFixCount} JSON-squashed blocks`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 7: Clean up orphaned formatting
    // ═══════════════════════════════════════════════════════
    // Remove lines that are just commas, dashes, or whitespace leftover
    body = body.replace(/^\s*[,;]\s*$/gm, '');
    // Remove triple+ newlines
    body = body.replace(/\n{3,}/g, '\n\n');
    // Fix orphaned LaTeX that lost its expression
    body = body.replace(/\$\s*\$/g, ''); // Empty inline math
    body = body.replace(/\$\$\s*\$\$/g, ''); // Empty block math

    // Reassemble
    content = frontmatter + body;
    
    const wasModified = content !== original;
    if (wasModified && !DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    
    return { slug, fixes, wasModified };
}

/**
 * Attempts to balance inline $ delimiters that we opened during wrapping.
 * Finds sequences like $\frac{a}{b} without closing $ and adds one.
 */
function balanceInlineMath(line) {
    // Split into segments by $
    const parts = line.split('$');
    // If odd number of $ (including our new ones), we need to close one
    if (parts.length % 2 === 0) {
        // We have an unclosed $. Find where to close it.
        // Look for the pattern: the last segment that starts with \ (LaTeX)
        // and find the end of its brace sequence
        const lastPart = parts[parts.length - 1];
        
        // Find the end of the LaTeX expression
        // Walk through and find where braces balance
        let braceDepth = 0;
        let closeIdx = -1;
        for (let i = 0; i < lastPart.length; i++) {
            if (lastPart[i] === '{') braceDepth++;
            if (lastPart[i] === '}') {
                braceDepth--;
                if (braceDepth === 0) {
                    closeIdx = i;
                    // Don't break yet — there might be more {}{} pairs
                }
            }
            // Stop if we hit a space/dash/comma after braces have balanced
            if (braceDepth === 0 && closeIdx >= 0 && /[\s,\-—]/.test(lastPart[i])) {
                break;
            }
        }
        
        if (closeIdx >= 0) {
            parts[parts.length - 1] = lastPart.substring(0, closeIdx + 1) + '$' + lastPart.substring(closeIdx + 1);
        } else {
            // Fallback: just append $ at end
            parts[parts.length - 1] = lastPart + '$';
        }
        return parts.join('$');
    }
    return line;
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🔧 BULK CORRUPTION REPAIR v1.0');
    console.log('  Zero API calls — Pure deterministic fixes');
    console.log('═'.repeat(60));
    
    if (DRY_RUN) console.log('\n🧪 DRY RUN — No files will be modified.\n');
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');
    console.log(`📂 Scanning ${files.length} blog files...\n`);

    let totalFixed = 0;
    let totalFixes = 0;
    const fixCounts = {};

    for (const file of files) {
        const result = repairBlog(path.join(BLOG_DIR, file));
        
        if (result.fixes.length > 0) {
            totalFixed++;
            totalFixes += result.fixes.length;
            console.log(`🔧 ${result.slug}`);
            for (const fix of result.fixes) {
                console.log(`   ✅ ${fix}`);
                // Count fix types
                const type = fix.split(' ').slice(0, 3).join(' ');
                fixCounts[type] = (fixCounts[type] || 0) + 1;
            }
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('  📊 REPAIR SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  Total blogs scanned:  ${files.length}`);
    console.log(`  Blogs repaired:       ${totalFixed}`);
    console.log(`  Total fixes applied:  ${totalFixes}`);
    console.log(`  Blogs clean:          ${files.length - totalFixed}`);
    console.log('\n  Fix breakdown:');
    for (const [type, count] of Object.entries(fixCounts).sort((a,b) => b[1] - a[1])) {
        console.log(`    ${type}: ${count}`);
    }
    console.log('═'.repeat(60));
    
    if (DRY_RUN) {
        console.log('\n🧪 DRY RUN complete. Re-run without --dry-run to apply fixes.');
    } else {
        console.log('\n✅ All repairs applied. Run sync-blogs next.');
    }
}

main();
