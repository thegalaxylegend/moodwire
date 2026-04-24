/**
 * FINAL POLISH — The absolute last touch for the reported screenshots.
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');

const TARGET_FILES = [
    'application-of-integrals-class-12-notes.md',
    'integrals-class-12-notes.md'
];

function polish(content: string): string {
    let newContent = content;

    // 1. Fix surface area formula in AOI
    // Change \{1 + \left to \sqrt{1 + \left
    newContent = newContent.replace(/\\\{1\s*\+\s*\\left/g, '\\sqrt{1 + \\left');
    
    // 2. Fix the \_{a}^{b} pattern one more time globally in these files
    newContent = newContent.replace(/\\_\{/g, '\\int_{');

    // 3. Fix Question 1 with stray $
    newContent = newContent.replace(/Question 1:\s*\$Find/g, 'Question 1: Find');
    newContent = newContent.replace(/PYQ 1:\s*\$Evaluate/g, 'PYQ 1: Evaluate');

    // 4. Fix by = artifacts
    newContent = newContent.replace(/curves by =/g, 'curves y =');
    newContent = newContent.replace(/curve by =/g, 'curve y =');
    newContent = newContent.replace(/curve  =/g, 'curve y =');

    // 5. Ensure dx is preceded by a space and lowercase
    newContent = newContent.replace(/\s+DX/g, ' dx');

    // 6. Fix nested dollars again
    newContent = newContent.replace(/\$([^\$]+)\$([^\$]+)\$([^\$]+)\$/g, '$$$1$2$3$$');

    return newContent;
}

for (const file of TARGET_FILES) {
    const filePath = path.join(BLOGS_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = polish(content);
    if (newContent !== content) {
        console.log(`Polished: ${file}`);
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}
