/**
 * PRECISION REPAIR — Targets remaining issues from user screenshots
 * 1. Balance $ delimiters on formula lines
 * 2. Fix \ { -> \frac{
 * 3. Fix \sqrt{1 + (dy/dx)^2}
 * 4. Fix Question $Find... -> Question Find...
 * 5. Fix Final Answer lines
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');

const TARGET_FILES = [
    'physics-heat-light-class-11-revision-notes-jee-neet.md',
    'application-of-integrals-class-12-notes.md',
    'integrals-class-12-notes.md'
];

function repairLine(line: string): string {
    let newLine = line;

    // 1. Restore \frac where it became \ 
    // e.g. \ {1}{x^2} -> \frac{1}{x^2}
    newLine = newLine.replace(/\\\s+\$\{/g, '\\frac{'); // Handle weird \ ${
    newLine = newLine.replace(/\\\s+\{/g, '\\frac{');   // Handle \ {
    
    // 2. Fix \sqrt missing in surface area formula
    if (newLine.includes('\\left(\\frac{dy}{dx}\\right)^2') && !newLine.includes('\\sqrt')) {
        newLine = newLine.replace(/\{1\s*\+\s*\\left/, '\\sqrt{1 + \\left');
        // If we added \sqrt, we need to make sure the closing brace is there
        // This is complex, but usually it's at the end of the math block
    }

    // 3. Fix "Question 1: $Find" -> "Question 1: Find"
    newLine = newLine.replace(/(Question\s+\d+:\s*)\$([A-Z])/g, '$1$2');

    // 4. Fix "by =" and "by is given by" artifacts
    // e.g. "curve by = f(x)" -> "curve y = f(x)"
    newLine = newLine.replace(/curve\s+by\s*=/g, 'curve y =');
    newLine = newLine.replace(/curves\s+by\s*=/g, 'curves y =');
    newLine = newLine.replace(/([^\s]+)\s*by\s*is\s*given\s*by/g, '$1 is given by');

    // 5. Balance dollars on formula lines
    // If a line starts with - and contains LaTeX but has odd number of $, fix it.
    if (newLine.trim().startsWith('-') || newLine.includes('\\int') || newLine.includes('\\frac')) {
        // Strip nested $ first: e.g. $\frac{...}$ inside another block
        // We do this by replacing all $ except at the very start and end of the math part
        
        // Find the first and last LaTeX-like parts
        const firstLatex = newLine.search(/\\[a-zA-Z]/);
        if (firstLatex !== -1) {
            let mathPart = newLine.substring(firstLatex);
            mathPart = mathPart.replace(/\$/g, ''); // Strip all $ from math part
            newLine = newLine.substring(0, firstLatex) + '$' + mathPart.trim() + '$';
        }
    }

    // 6. Fix specific Physics Question 3 Final Answer
    if (newLine.includes('T(2) = 100')) {
        newLine = '**Final Answer:** $T(2) = 100 + (20 - 100)e^{-2 \\times \\frac{1}{2} \\ln 2} = 100 - 80 \\times \\frac{1}{2} = 60$';
    }
    
    // 7. Fix DX -> dx (lowercase)
    newLine = newLine.replace(/\sDX(?!\w)/g, ' dx');

    // Clean up
    newLine = newLine.replace(/\$\$/g, '$'); // Unify to single $ for inline
    newLine = newLine.replace(/\$+/g, '$');
    
    // If it's a list item, make sure space after -
    if (newLine.startsWith('-') && !newLine.startsWith('- ')) {
        newLine = newLine.replace(/^-/, '- ');
    }

    return newLine;
}

for (const file of TARGET_FILES) {
    const filePath = path.join(BLOGS_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const newLines = lines.map(line => repairLine(line));
    
    console.log(`Precision repaired: ${file}`);
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

console.log('✅ Precision repair complete.');
