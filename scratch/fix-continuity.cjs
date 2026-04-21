const fs = require('fs');

const filePath = 'src/content/blogs/continuity-and-differentiability-class-12-notes.md';
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(/eq 2\$/g, '\\neq 2$');

c = c.replace(/^\\lim_{x \\to 2} f\(x\) = \\lim_{x \\to 2} \(x \+ 2\)$/gm, '$$$$ \\lim_{x \\to 2} f(x) = \\lim_{x \\to 2} (x + 2) $$$$');

c = c.replace(/^f'\([0x]\) = \\lim_\{h \\to 0\} \$\\frac\{([^}]+)\}\{h\} = \\lim_\{h \\to 0\} \$\$\\frac\{([^}]+)\}\{h\}\$$/gm, 
              (m, p1, p2) => `$$$$ f'(x) = \\lim_{h \\to 0} \\frac{${p1}}{h} = \\lim_{h \\to 0} \\frac{${p2}}{h} $$$$`.replace(/\(x\)/g, m.includes("f'(0)") ? "(0)" : "(x)"));

c = c.replace(/^\\sin\(x \+ h\) = \\sin\(x\)\\cos\(h\) \+ \\cos\(x\)\\sin\(h\)$/gm, '$$$$ \\sin(x + h) = \\sin(x)\\cos(h) + \\cos(x)\\sin(h) $$$$');

c = c.replace(/^f'\(x\) = \\lim_\{h \\to 0\} \$\\frac\{\\sin\(x\)\\cos\(h\) \+ \\cos\(x\)\\sin\(h\) - \\sin\(x\)\}\{h\}\$$/gm, 
              '$$$$ f\'(x) = \\lim_{h \\to 0} \\frac{\\sin(x)\\cos(h) + \\cos(x)\\sin(h) - \\sin(x)}{h} $$$$');

c = c.replace(/^= \\lim_\{h \\to 0\} \$\\frac\{\\sin\(x\)\(\\cos\(h\) - 1\) \+ \\cos\(x\)\\sin\(h\)\}\{h\}\$$/gm, 
              '$$$$ = \\lim_{h \\to 0} \\frac{\\sin(x)(\\cos(h) - 1) + \\cos(x)\\sin(h)}{h} $$$$');

c = c.replace(/^f'\(x\) = \\lim_\{h \\to 0\} \$\\frac\{\\cos\(x\)\\sin\(h\)\}\{h\} = \\cos\(x\) \\cdot \\lim_\{h \\to 0\} \$\$\\frac\{\\sin\(h\)\}\{h\}\$ = \\cos\(x\) \\cdot 1 = \\cos\(x\)$/gm, 
              '$$$$ f\'(x) = \\lim_{h \\to 0} \\frac{\\cos(x)\\sin(h)}{h} = \\cos(x) \\cdot \\lim_{h \\to 0} \\frac{\\sin(h)}{h} = \\cos(x) \\cdot 1 = \\cos(x) $$$$');

c = c.replace(/- \*\*Sum Rule:\*\* \$\\frac\{d\}\{dx\}\$ \(f\(x\) \+ g\(x\)\) = f'\(x\) \+ g'\(x\)/g, 
              '- **Sum Rule:** $\\frac{d}{dx} (f(x) + g(x)) = f\'(x) + g\'(x)$');

c = c.replace(/- \*\*Difference Rule:\*\* \$\\frac\{d\}\{dx\}\$ \(f\(x\) - g\(x\)\) = f'\(x\) - g'\(x\)/g, 
              '- **Difference Rule:** $\\frac{d}{dx} (f(x) - g(x)) = f\'(x) - g\'(x)$');

c = c.replace(/- \*\*Product Rule:\*\* \$\\frac\{d\}\{dx\}\$ \(f\(x\) \\cdot g\(x\)\) = f'\(x\) \\cdot g\(x\) \+ f\(x\) \\cdot g'\(x\)/g, 
              '- **Product Rule:** $\\frac{d}{dx} (f(x) \\cdot g(x)) = f\'(x) \\cdot g(x) + f(x) \\cdot g\'(x)$');

c = c.replace(/- \*\*Quotient Rule:\*\* \$\\frac\{d\}\{dx\} \\left\(\$\$\\frac\{f\(x\)\}\{g\(x\)\}\$\\right\) = \$\\frac\{f'\(x\) \\cdot g\(x\) - f\(x\) \\cdot g'\(x\)\}\{\(g\(x\)\)\^2\}\$/g, 
              '- **Quotient Rule:** $\\frac{d}{dx} \\left(\\frac{f(x)}{g(x)}\\right) = \\frac{f\'(x) \\cdot g(x) - f(x) \\cdot g\'(x)}{(g(x))^2}$');

c = c.replace(/- \*\*General Form:\*\* \$\\frac\{d\}\{dx\}\$ f\(g\(x\)\) = f'\(g\(x\)\) \\cdot g'\(x\)/g, 
              '- **General Form:** $\\frac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x)$');

c = c.replace(/^\$\\frac\{d\}\{dx\}\$ f\(g\(x\)\) = f'\(g\(x\)\) \\cdot g'\(x\) = 2x \\cdot 2x = 4x\^2$/gm, 
              '$$$$ \\frac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x) = 2x \\cdot 2x = 4x^2 $$$$');

c = c.replace(/\\lim_\{x \\to 2\} f\(x\) = \\lim_\{x \\to 2\} \(x \+ 2\) = 2 \+ 2 = 4/g, 
              '$$$$ \\lim_{x \\to 2} f(x) = \\lim_{x \\to 2} (x + 2) = 2 + 2 = 4 $$$$');

fs.writeFileSync(filePath, c, 'utf8');
console.log('Fixed continuity-and-differentiability-class-12-notes.md');
