/**
 * Second-pass naked LaTeX wrapping.
 * The first pass only caught \frac{simple}{simple} patterns.
 * This pass wraps entire LaTeX formula chains in $ delimiters.
 * 
 * Strategy: Find lines with \frac or \text NOT inside $...$ and
 * wrap the entire formula expression (including nested braces).
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const DRY_RUN = process.argv.includes('--dry-run');

let totalFixed = 0;
let totalWraps = 0;

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    
    // Split into frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) continue;
    const frontmatter = fmMatch[1];
    let body = fmMatch[2];
    
    const lines = body.split('\n');
    let insideBlockMath = false;
    let wrapCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Track $$ block math
        if (/^\s*\$\$/.test(line)) { insideBlockMath = !insideBlockMath; continue; }
        if (insideBlockMath) continue;
        if (/^\s*\|/.test(line)) continue; // Skip tables
        
        // Split on existing $ boundaries
        const parts = line.split(/(\$[^$]+\$)/);
        let modified = false;
        
        for (let p = 0; p < parts.length; p++) {
            if (p % 2 === 1) continue; // Inside existing $...$
            
            let seg = parts[p];
            
            // Find naked LaTeX: a backslash command followed by brace content
            // that isn't already wrapped in $
            // We need to find the FULL expression including all nested {} pairs
            
            let newSeg = '';
            let si = 0;
            
            while (si < seg.length) {
                // Look for \ followed by a known LaTeX command
                if (seg[si] === '\\' && si + 1 < seg.length) {
                    const rest = seg.substring(si);
                    const cmdMatch = rest.match(/^\\(frac|text|sqrt|overline|underline|vec|hat|bar|tilde|boxed|mathrm|mathbb|mathcal|binom|cancel)\{/);
                    
                    if (cmdMatch) {
                        // Found a naked LaTeX command. Find the extent of the expression.
                        // Walk forward, tracking brace depth, until we've consumed
                        // all {...}{...} pairs belonging to this command
                        let end = cmdMatch[0].length;
                        let depth = 1; // We're inside the first {
                        
                        while (end < rest.length && depth > 0) {
                            if (rest[end] === '{') depth++;
                            if (rest[end] === '}') depth--;
                            end++;
                        }
                        
                        // Check if there's another {...} immediately after (for \frac{a}{b})
                        while (end < rest.length && rest[end] === '{') {
                            depth = 1;
                            end++;
                            while (end < rest.length && depth > 0) {
                                if (rest[end] === '{') depth++;
                                if (rest[end] === '}') depth--;
                                end++;
                            }
                        }
                        
                        // Also consume trailing ^{...} or _{...} or \times etc
                        while (end < rest.length) {
                            if (rest[end] === '^' || rest[end] === '_') {
                                end++;
                                if (end < rest.length && rest[end] === '{') {
                                    depth = 1; end++;
                                    while (end < rest.length && depth > 0) {
                                        if (rest[end] === '{') depth++;
                                        if (rest[end] === '}') depth--;
                                        end++;
                                    }
                                } else if (end < rest.length) {
                                    end++; // Single char subscript/superscript
                                }
                            } else if (rest.substring(end).match(/^\\(times|cdot|pm|mp|leq|geq|neq|approx|equiv|rightarrow|leftarrow|Rightarrow)\b/)) {
                                const opMatch = rest.substring(end).match(/^\\[a-z]+/i);
                                end += opMatch[0].length;
                                // Skip whitespace
                                while (end < rest.length && rest[end] === ' ') end++;
                            } else {
                                break;
                            }
                        }
                        
                        const expr = rest.substring(0, end);
                        newSeg += '$' + expr + '$';
                        si += end;
                        modified = true;
                    } else {
                        newSeg += seg[si];
                        si++;
                    }
                } else {
                    newSeg += seg[si];
                    si++;
                }
            }
            
            if (modified) {
                parts[p] = newSeg;
            }
        }
        
        if (modified) {
            lines[i] = parts.join('');
            wrapCount++;
        }
    }
    
    if (wrapCount > 0) {
        body = lines.join('\n');
        // Fix double-wrapping: $$...$$ where we wrapped something already in context
        body = body.replace(/\$\$([^$]+)\$\$/g, (match, inner) => {
            // Only fix if it's inline (no newlines)
            if (!inner.includes('\n')) return '$' + inner + '$';
            return match;
        });
        
        content = frontmatter + body;
        if (!DRY_RUN) {
            fs.writeFileSync(filePath, content, 'utf-8');
        }
        totalFixed++;
        totalWraps += wrapCount;
        if (totalFixed <= 15) console.log(`✅ ${file.replace('.md','')}: ${wrapCount} lines wrapped`);
    }
}

if (totalFixed > 15) console.log(`   ... and ${totalFixed - 15} more files`);
console.log(`\n📊 Total: ${totalFixed} files, ${totalWraps} lines wrapped`);
if (DRY_RUN) console.log('🧪 DRY RUN — re-run without --dry-run');
