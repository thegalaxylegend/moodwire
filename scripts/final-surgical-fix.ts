/**
 * FINAL SURGICAL FIX — Targets specific issues identified in user screenshots
 * 1. \INT -> \int
 * 2. DX -> dx
 * 3. \_{a}^{b} -> \int_{a}^{b}
 * 4. Fix nested dollars like $\frac{...}$
 * 5. Fix stray dollars at start of lines like Question 1: $Find the area...
 * 6. Fix prose inside math like \delta Q is the amount of heat transferred
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');

function repairLine(line: string): string {
    let newLine = line;

    // 1. Fix capital \INT and DX
    newLine = newLine.replace(/\\INT/g, '\\int');
    newLine = newLine.replace(/\sDX(?!\w)/g, ' dx');

    // 2. Fix \_{a}^{b} -> \int_{a}^{b}
    newLine = newLine.replace(/\\_\{/g, '\\int_{');

    // 3. Fix missing \sqrt in specific AOI formulas
    if (newLine.includes('\\left(\\frac{dy}{dx}\\right)^2') && !newLine.includes('\\sqrt')) {
        newLine = newLine.replace(/\{1 \+ \\left/g, '\\sqrt{1 + \\left');
    }

    // 4. Fix Question lines with stray $
    // Question 1: $Find the area... -> Question 1: Find the area...
    newLine = newLine.replace(/Question \d+:\s*\$(Find the area|What is|Evaluate)/i, (m, p1) => m.replace('$', ''));

    // 5. Fix nested dollars: $\frac{...}$ -> \frac{...} (if already inside a math block)
    // This is tricky. Let's look for $...$...$...$ patterns
    // e.g., T(2) = 100 + (20 - 100)e^{-2 $\times$ $\frac{1}{2}$ $\ln 2}
    if (newLine.includes('e^{-2') || newLine.includes('T(2)')) {
        newLine = newLine.replace(/\$([^\$]+)\$/g, '$1'); // Strip all $ in these lines
        // Then re-wrap the whole equation if it starts with T(2)
        if (newLine.includes('T(2) =')) {
            newLine = newLine.replace(/(T\(2\) = .*)/, '$$$1$$');
        }
    }

    // 6. Fix "prose inside math"
    // e.g., $\delta Q is the amount of heat transferred$, -> $\delta Q$ is the amount of heat transferred,
    newLine = newLine.replace(/\$(\\delta [a-zA-Z]) ([a-zA-Z\s]+)\$/g, '$$$1$$ $2');

    // 7. Fix common typos like 'ex^2' -> 'x^2' in integrals
    newLine = newLine.replace(/ex\^2/g, 'x^2');

    // 8. Final attempt to wrap anything with \int or \frac or \sin that isn't wrapped
    // BUT only if it's on a line that looks like a formula (starts with - or number)
    if (newLine.trim().startsWith('-') || /^\s*\d+\./.test(newLine.trim())) {
        const containsLatex = /\\(int|frac|sqrt|sin|cos|tan|sec|ln|log|pi|delta|sigma|theta|lambda|mu|alpha|beta|gamma|implies|left|right)/i.test(newLine);
        const alreadyWrapped = newLine.includes('$');
        if (containsLatex && !alreadyWrapped) {
            // Find where the math starts (usually after the first space or dash)
            newLine = newLine.replace(/([- ]+)(.*\\.*)/, '$1$$$2$$');
        }
    }
    
    // Clean up double $$ if we accidentally created them
    newLine = newLine.replace(/\$\$\$/g, '$$');

    return newLine;
}

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const lines = content.split('\n');
    let modified = false;
    
    const newLines = lines.map(line => {
        const repaired = repairLine(line);
        if (repaired !== line) modified = true;
        return repaired;
    });
    
    if (modified) {
        console.log(`Surgically repaired: ${file}`);
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    }
}

console.log('✅ Final surgical repair complete.');
