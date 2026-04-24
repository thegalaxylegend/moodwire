const fs = require('fs');
const path = require('path');
const d = 'src/content/blogs';
const files = fs.readdirSync(d).filter(f => f.endsWith('.md'));
let naked = 0;
const bad = [];
const CMDS = 'frac|sqrt|sin|cos|tan|int|sum|prod|lim|theta|alpha|delta|sigma|lambda|pi|nabla|partial|ln|log|circ|text|vec|infty|leq|geq|neq|approx|equiv|pm|times|mu|phi|psi|epsilon|rho|tau|nu|Delta|cdot|ldots|propto|sec|csc|cot|omega|beta|gamma';
const cmdRe = new RegExp('\\\\(?:' + CMDS + ')');

for (const f of files) {
    const c = fs.readFileSync(path.join(d, f), 'utf8');
    const lines = c.split('\n');
    let inFM = false;
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l === '---') { inFM = !inFM; continue; }
        if (inFM) continue;
        if (!l || l.startsWith('#') || l.startsWith('```') || l.startsWith('|') ||
            l.startsWith('!') || l.startsWith('[') || l.includes('[DOI') ||
            l.includes('http') || l.includes('Practice Mock') || l.startsWith('📖') ||
            l.startsWith('- 📖')) continue;

        // Remove content inside $...$ pairs
        const stripped = l.replace(/\$[^$]+\$/g, 'MATH');
        // Check if remaining text has LaTeX commands
        if (cmdRe.test(stripped)) {
            naked++;
            if (bad.length < 40) bad.push(f + ':L' + (i + 1) + ': ' + l.substring(0, 100));
        }
    }
}
console.log('Lines with naked LaTeX outside dollar signs:', naked);
bad.forEach(b => console.log('  ' + b));
