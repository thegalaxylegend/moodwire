const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/content/blogs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let totalStandaloneMath = 0;

function isStandaloneMath(line) {
    // Strip existing inline $ to check the bare content
    const bareLine = line.replace(/\$/g, '').trim();
    if (bareLine.length === 0) return false;
    
    // If it already has block math, ignore
    if (line.includes('$$')) return false;

    // Must contain some math indicators
    if (!/(\\[a-zA-Z]+|=|f'\(x\)|[+\-*\/^])/.test(bareLine)) return false;

    // Check for prose words (words with 4+ letters that don't start with \)
    // First, remove all LaTeX commands
    const withoutLatex = bareLine.replace(/\\[a-zA-Z]+/g, '');
    
    // Check remaining words
    const words = withoutLatex.match(/[a-zA-Z]{3,}/g) || [];
    
    // Filter out common math variables/functions that might not have a backslash
    const proseWords = words.filter(w => !['sin', 'cos', 'tan', 'log', 'lim', 'max', 'min'].includes(w.toLowerCase()));
    
    if (proseWords.length > 1) return false; // Too much prose
    
    // Must have a high density of math characters or specific LaTeX commands
    if (/\\(lim|sin|cos|tan|frac|int|sum|prod|alpha|beta|gamma|theta|pi|infty|rightarrow)/.test(bareLine)) return true;
    if (bareLine.includes("f'(x) =")) return true;
    if (bareLine.startsWith("=")) return true;
    
    return false;
}

for (const f of files) {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const lines = c.split('\n');
    let insideBlock = false;
    let fileMatches = 0;
    for (const line of lines) {
        if (/^\s*\$\$/.test(line)) { insideBlock = !insideBlock; continue; }
        if (insideBlock) continue;
        if (/^\s*\|/.test(line)) continue;
        if (/^#/.test(line)) continue; // Headings
        if (/^- /.test(line) && line.length > 50) continue; // Long list items
        
        if (isStandaloneMath(line)) {
            fileMatches++;
            console.log(`[${f}] MATCH: ${line}`);
        }
    }
    if (fileMatches > 0) totalStandaloneMath++;
}

console.log(`\nFound standalone math lines in ${totalStandaloneMath} files.`);
