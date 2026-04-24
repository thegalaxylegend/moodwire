const fs = require('fs');
const path = require('path');

const d = 'src/content/blogs';

// 1. Physics Fix
const p1 = path.join(d, 'physics-heat-light-class-11-revision-notes-jee-neet.md');
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(/^- --/m, '---');
c1 = c1.replace(/^- --/m, '---');
// Fix the broken final answer line if it's messy
c1 = c1.replace(/\*\*Final Answer:\*\* .*/, '**Final Answer:** $T(2) = 100 + (20 - 100)e^{-2 \\times \\frac{1}{2} \\ln 2} = 100 - 80 \\times \\frac{1}{2} = 60$');
fs.writeFileSync(p1, c1);

// 2. AOI Fix
const p2 = path.join(d, 'application-of-integrals-class-12-notes.md');
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace(/^- --/m, '---');
c2 = c2.replace(/^- --/m, '---');
// Fix specific broken formula lines
c2 = c2.replace(/- The area under a curve y = f\(x\)\$.*/, '- The area under a curve y = f(x) between x = a and x = b is given by $\\int_{a}^{b} f(x) dx$');
c2 = c2.replace(/- The area of the region bounded by the curves y = f\(x\)\$.*/, '- The area of the region bounded by the curves y = f(x), y = g(x), x = a, and x = b is given by $\\int_{a}^{b} |f(x) - g(x)| dx$');
c2 = c2.replace(/- Then, evaluate the definite integral: \\int_\{0\}^\{2\}.*/, '- Then, evaluate the definite integral: $\\int_{0}^{2} (2x - x^2) dx = \\left[x^2 - \\frac{x^3}{3}\\right]_0^2 = \\frac{4}{3}$');
fs.writeFileSync(p2, c2);

// 3. Integrals Fix
const p3 = path.join(d, 'integrals-class-12-notes.md');
let c3 = fs.readFileSync(p3, 'utf8');
c3 = c3.replace(/^- --/m, '---');
c3 = c3.replace(/^- --/m, '---');
fs.writeFileSync(p3, c3);

console.log('Surgically restored 3 files.');
