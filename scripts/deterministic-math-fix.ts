/**
 * DETERMINISTIC MATH FIXER - TARGETED
 * Fixes specifically the lines shown in the user's latest screenshots.
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

    // 1. Remove doubled $ or broken $ nesting
    // e.g. $c = $\frac{...}$ -> $c = \frac{...}$
    newLine = newLine.replace(/\$([^\$]+)\$\s*(\\[a-z]+)/g, '$$$1 $2');
    newLine = newLine.replace(/(\\[a-z]+[^\$]+)\$\s*\$([^\$]+)\$/g, '$1 $2$$');

    // 2. Wrap naked MCQ options
    // A) \frac{1}{2} -> A) $\frac{1}{2}$
    if (/^[A-D]\)\s*\\/.test(newLine)) {
        newLine = newLine.replace(/([A-D]\)\s*)(.*)/, '$1$$$2$$');
    }

    // 3. Fix unclosed $ at the end of lines with LaTeX
    const commands = ['\\frac', '\\int', '\\delta', '\\Delta', '\\times', '\\sin', '\\cos', '\\tan', '\\sqrt', '\\pi', '\\mu', '\\sigma', '\\infty', '\\to', '\\implies', '\\text', '\\left', '\\right'];
    const hasLatex = commands.some(cmd => newLine.includes(cmd));
    const dollarCount = (newLine.match(/\$/g) || []).length;
    
    if (hasLatex && dollarCount % 2 !== 0) {
        if (newLine.trim().endsWith('$')) {
            // Missing opening $ - usually after a colon or at start of math part
            if (newLine.includes(': ')) {
                newLine = newLine.replace(': ', ': $');
            } else if (newLine.startsWith('- ')) {
                newLine = newLine.replace('- ', '- $');
            } else {
                newLine = '$' + newLine;
            }
        } else {
            // Missing closing $
            newLine = newLine.trim() + '$';
        }
    }

    // 4. Fix Question $Find -> Question Find
    newLine = newLine.replace(/Question\s+\d+:\s*\$Find/g, (m) => m.replace('$', ''));
    newLine = newLine.replace(/Question\s+\d+:\s*\$What/g, (m) => m.replace('$', ''));

    // 5. Fix "Final Answer" with naked LaTeX
    if (newLine.includes('Final Answer') && hasLatex && !newLine.includes('$')) {
        newLine = newLine.replace(/(Final Answer.*:)(.*)/, '$1 $$$2$$');
    }

    // 6. Clean up $ $ or similar
    newLine = newLine.replace(/\$\s*\$/g, ' ');
    newLine = newLine.replace(/\$+/g, '$'); // No double dollars for inline
    
    // Final check for odd dollars - if still odd, just strip all and wrap the whole line if it has LaTeX
    const finalCount = (newLine.match(/\$/g) || []).length;
    if (hasLatex && finalCount % 2 !== 0) {
        newLine = newLine.replace(/\$/g, '');
        // Find the math start
        const firstBackslash = newLine.indexOf('\\');
        if (firstBackslash !== -1) {
            newLine = newLine.substring(0, firstBackslash) + '$' + newLine.substring(firstBackslash).trim() + '$';
        }
    }

    return newLine;
}

for (const file of TARGET_FILES) {
    const filePath = path.join(BLOGS_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = lines.map(line => repairLine(line));
    
    console.log(`Repaired: ${file}`);
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}
