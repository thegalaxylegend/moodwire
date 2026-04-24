import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // 1. Fix obvious hallucinations
    content = content.replace(/\\franc/g, '\\frac');
    content = content.replace(/\\sort/g, '\\sqrt');
    content = content.replace(/\\INT/g, '\\int');
    content = content.replace(/ D\s*X/g, ' dx'); // e.g. DX, D X
    
    // 2. Fix constants
    content = content.replace(/OK\$_b/g, 'K_b');
    content = content.replace(/OK\$_a/g, 'K_a');
    content = content.replace(/APK\$_b/g, 'pK_b');
    content = content.replace(/APK\$_a/g, 'pK_a');
    content = content.replace(/pOK_b/g, 'pK_b');
    content = content.replace(/pOK_a/g, 'pK_a');
    content = content.replace(/OK_b/g, 'K_b');
    content = content.replace(/OK_a/g, 'K_a');

    // 3. Fix double dollar signs mid-math
    content = content.replace(/\\cos\$\$\\theta/g, '\\cos\\theta');
    content = content.replace(/\\sin\$\$\\theta/g, '\\sin\\theta');
    content = content.replace(/\\tan\$\$\\theta/g, '\\tan\\theta');

    // 4. Fix split fractions like \frac12
    content = content.replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}');
    content = content.replace(/\\frac(\d)\\sqrt(\d)/g, '\\frac{$1}{\\sqrt{$2}}');

    // 5. Fix \text{$...$} double wrapping
    // This looks like \text{$opposite side$} which causes syntax errors in KaTeX
    content = content.replace(/\\text\{\$([^$]+)\$\}/g, '\\text{$1}');

    // 6. Fix `\wedge` errors
    // some blogs have \wedge O for ^*
    content = content.replace(/\\wedge O/g, '^*');
    content = content.replace(/\\wedge B/g, '^*');

    // 7. Fix answers missing dollar signs
    // e.g. A) \frac{1}{\sqrt{2}} -> A) $\frac{1}{\sqrt{2}}$
    // It should match A), B), C), D) followed by anything with a backslash
    const answerRegex = /^(A|B|C|D\))\s+([^\s$].*\\[^\s].*)$/gm;
    content = content.replace(answerRegex, (match, letter, math) => {
        if (!math.includes('$')) {
            return `${letter} $${math.trim()}$`;
        }
        return match;
    });

    // 8. Fix bullet point formulas missing dollar signs
    // e.g. - P = \frac{1}{3} ...
    const formulaRegex = /^-\s+([A-Za-z_]+\s*=\s*\\[a-z]+.*)$/gm;
    content = content.replace(formulaRegex, (match, math) => {
        if (!math.includes('$')) {
            return `- $${math.trim()}$`;
        }
        return match;
    });

    // Fix specific known physics missing dollar signs
    const formulaRegex2 = /^-\s+\*\*[A-Za-z\s]+Formula:\*\*\s*([^\n$]*\\[a-z]+[^\n$]*)$/gm;
    content = content.replace(formulaRegex2, (match, math) => {
        // Only wrap the math part before the " — " dash if there is one
        const parts = math.split(' — ');
        if (parts.length === 2 && !parts[0].includes('$')) {
            return match.replace(parts[0], `$${parts[0].trim()}$ `);
        } else if (!math.includes('$')) {
            return match.replace(math, `$${math.trim()}$`);
        }
        return match;
    });
    
    const formulaRegex3 = /^-\s+\*\*[A-Za-z\s]+Law:\*\*\s*([^\n$]*\\[a-z]+[^\n$]*)$/gm;
    content = content.replace(formulaRegex3, (match, math) => {
        const parts = math.split(' — ');
        if (parts.length === 2 && !parts[0].includes('$')) {
            return match.replace(parts[0], `$${parts[0].trim()}$ `);
        } else if (!math.includes('$')) {
            return match.replace(math, `$${math.trim()}$`);
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
        console.log(`Fixed hallucinations in ${file}`);
    }
}

console.log(`\nFixed ${totalFixes} files.`);
