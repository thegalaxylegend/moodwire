const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/content/blogs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'undefined.md');

let total = 0;
let criticalCount = 0;
const issues = { slr: 0, caseMangle: 0, jsonSquash: 0, nakedLatex: 0, solvedYes: 0, orphaned: 0 };
const criticalSlugs = new Set();

for (const f of files) {
    total++;
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const slug = f.replace('.md', '');
    let hasCritical = false;

    // 1. (suggestion limit reached)
    if (c.includes('(suggestion limit reached)')) { issues.slr++; hasCritical = true; }
    
    // 2. Case-mangled
    const badCase = c.match(/\\(fRAC|FRAC|tEXT|TEXT|tTIMES|TIMES|sQRT|SQRT)/g);
    if (badCase && badCase.length > 0) { issues.caseMangle++; hasCritical = true; }
    
    // 3. JSON squash - on its own line
    if (/^\s*\{\s*"heading"\s*:\s*"[^"]*"\s*,\s*"body"\s*:/m.test(c)) { issues.jsonSquash++; hasCritical = true; }
    
    // 4. Naked LaTeX - \frac{ or \text{ NOT inside $...$ or $$...$$
    let nakedCount = 0;
    const lines = c.split('\n');
    let inBlockMath = false;
    for (const line of lines) {
        if (/^\s*\$\$/.test(line)) { inBlockMath = !inBlockMath; continue; }
        if (inBlockMath) continue;
        
        // Split line by $ to separate inside vs outside inline math
        const segments = line.split(/(\$[^$]+\$)/);
        for (let i = 0; i < segments.length; i++) {
            if (i % 2 === 0) { // Outside inline math
                const nakedMatch = segments[i].match(/\\(frac|text|sqrt|binom)\{/g);
                if (nakedMatch) {
                    nakedCount += nakedMatch.length;
                }
            }
        }
    }
    if (nakedCount > 3) { issues.nakedLatex++; hasCritical = true; }
    
    // 5. Solved Yes
    if (c.includes('Solved Yes')) { issues.solvedYes++; }

    if (hasCritical) { criticalCount++; criticalSlugs.add(slug); }
}

console.log('\n' + '='.repeat(60));
console.log('  TRUE POST-FIX VERIFICATION SCAN');
console.log('='.repeat(60));
console.log(`  Total blogs: ${total}`);
console.log('');
console.log(`  🔴 (suggestion limit reached): ${issues.slr} ${issues.slr === 0 ? '✅' : ''}`);
console.log(`  🔴 Case-mangled LaTeX:          ${issues.caseMangle} ${issues.caseMangle === 0 ? '✅' : ''}`);
console.log(`  🔴 JSON squashing:              ${issues.jsonSquash} ${issues.jsonSquash === 0 ? '✅' : ''}`);
console.log(`  🔴 Naked LaTeX (>3):            ${issues.nakedLatex} ${issues.nakedLatex === 0 ? '✅' : ''}`);
console.log(`  🟡 "Solved Yes":                ${issues.solvedYes} ${issues.solvedYes === 0 ? '✅' : ''}`);
console.log('');
console.log(`  CRITICAL blogs remaining: ${criticalCount}`);
if (criticalCount > 0) {
    console.log('  Affected:');
    for (const s of [...criticalSlugs].slice(0, 10)) console.log(`    → ${s}`);
}
console.log('='.repeat(60));
