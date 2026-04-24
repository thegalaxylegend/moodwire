const fs = require('fs');
const path = require('path');

const r = JSON.parse(fs.readFileSync('./jules-reports/sanity-guard-report.json', 'utf8'));
const files = r.issues.filter(i => i.errors && i.errors.some(e => e.includes('$$ markers (odd number)'))).map(i => i.file);

const d = 'src/content/blogs';

for (const f of files) {
    const p = path.join(d, f);
    let c = fs.readFileSync(p, 'utf8');
    
    // Check if the $$ count is odd
    const fmMatch = c.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    if (!fmMatch) continue;
    
    let body = fmMatch[2];
    const matchCount = (body.match(/\$\$/g) || []).length;
    
    if (matchCount % 2 !== 0) {
        console.log(`Fixing ${f} (Count: ${matchCount})`);
        // Find last index of $$ in body
        const lastIdx = body.lastIndexOf('$$');
        if (lastIdx !== -1) {
            // Replace the last $$ with a single $
            body = body.substring(0, lastIdx) + '$' + body.substring(lastIdx + 2);
            c = fmMatch[1] + body;
            fs.writeFileSync(p, c, 'utf8');
        }
    }
}
console.log('Fixed odd $$ counts.');
