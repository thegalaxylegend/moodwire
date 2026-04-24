import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix Math Typos (God JSON hallucinations)
    content = content.replace(/\\franc/g, '\\frac');
    content = content.replace(/\\sort/g, '\\sqrt');
    
    // Fix weird Basic/Acid constants
    content = content.replace(/OK\$_b/g, 'K_b');
    content = content.replace(/OK\$_a/g, 'K_a');
    content = content.replace(/APK\$_b/g, 'pK_b');
    content = content.replace(/APK\$_a/g, 'pK_a');
    content = content.replace(/pOK_b/g, 'pK_b');
    content = content.replace(/pOK_a/g, 'pK_a');
    content = content.replace(/OK\$_\$by/g, 'pK_b');
    content = content.replace(/OK_b/g, 'K_b');
    content = content.replace(/K_\$by/g, 'K_b');
    content = content.replace(/K_\$a/g, 'K_a');
    
    // Fix weird double dollars inside math
    content = content.replace(/\\cos\$\$\\theta/g, '\\cos\\theta');
    content = content.replace(/\\sin\$\$\\theta/g, '\\sin\\theta');
    content = content.replace(/\\tan\$\$\\theta/g, '\\tan\\theta');

    // Fix OCR typos in math text
    content = content.replace(/curves by =/g, 'curves y =');
    content = content.replace(/curve by =/g, 'curve y =');
    content = content.replace(/ex =/g, 'x =');
    content = content.replace(/ey =/g, 'y =');
    content = content.replace(/ez =/g, 'z =');
    
    // Fix powers
    content = content.replace(/\^\\wedge /g, '^');
    content = content.replace(/\^\\wedge/g, '^');
    content = content.replace(/\\wedge O/g, '^*');
    content = content.replace(/\\wedge B/g, '^*');
    content = content.replace(/\\wedge C/g, '^*');
    content = content.replace(/\\wedge D/g, '^*');
    
    // Fix set braces escaped with dollar by God JSON
    content = content.replace(/\\\$\\\{/g, '\\{');
    content = content.replace(/\\\$\\\}/g, '\\}');
    content = content.replace(/\\\$\{/g, '\\{');
    content = content.replace(/\\\$\}/g, '\\}');

    // Fix other random math typos
    content = content.replace(/\\proto/g, '\\propto');
    
    // Fix weird fractions like \frac12 -> \frac{1}{2} only if they are naked numbers
    content = content.replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}');
    // Fix \frac1\sqrt2
    content = content.replace(/\\frac(\d)\\sqrt(\d)/g, '\\frac{$1}{\\sqrt{$2}}');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
        console.log(`Fixed hallucinations in ${file}`);
    }
}

console.log(`\nFixed ${totalFixes} files.`);
