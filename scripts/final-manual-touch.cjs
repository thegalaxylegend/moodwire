const fs = require('fs');
const path = require('path');

const d = 'src/content/blogs';

// 1. AOI Fix
const p1 = path.join(d, 'application-of-integrals-class-12-notes.md');
let c1 = fs.readFileSync(p1, 'utf8').split('\n');
c1 = c1.map(l => {
    if (l.includes('Question 1:') && l.includes('$')) return l.replace('$', '');
    if (l.includes('x^2 = 2x') && !l.startsWith('  - ')) return '  - ' + l;
    if (l.includes('Then, evaluate the definite integral:') && !l.includes('$')) return l.replace('integral:', 'integral: $') + '$';
    if (l.includes('Evaluate the definite integral: 2$')) return l.replace('2$', '$2');
    return l;
});
fs.writeFileSync(p1, c1.join('\n'));

// 2. Physics Fix
const p2 = path.join(d, 'physics-heat-light-class-11-revision-notes-jee-neet.md');
let c2 = fs.readFileSync(p2, 'utf8').split('\n');
c2 = c2.map(l => {
    // Fix Mistake 3
    if (l.includes('🔧 **The fix') && l.includes('Use $c = ')) {
        return l.replace('Use $c = $\\frac', 'Use $c = \\frac');
    }
    // Fix Mistake 4
    if (l.includes('🔴 **What students write:** $1')) {
        return l.replace('$1 \\, $\\text', '$1 \\, \\text');
    }
    // Fix Final Answer
    if (l.includes('Final Answer:') && l.includes('**T(2)')) {
        return '**Final Answer:** $T(2) = 100 + (20 - 100)e^{-2 \\times \\frac{1}{2} \\ln 2} = 100 - 80 \\times \\frac{1}{2} = 60$';
    }
    return l;
});
fs.writeFileSync(p2, c2.join('\n'));

// 3. Integrals MCQ Options Fix
const p3 = path.join(d, 'integrals-class-12-notes.md');
let c3 = fs.readFileSync(p3, 'utf8').split('\n');
c3 = c3.map(l => {
    if (/^[A-D]\)\s+\\/.test(l)) return l.replace(/^([A-D]\)\s+)(.*)/, '$1$$$2$$');
    if (/^[A-D]\)\s+\$/.test(l) && !l.endsWith('$')) return l.trim() + '$';
    return l;
});
fs.writeFileSync(p3, c3.join('\n'));

console.log('Final manual touch complete.');
