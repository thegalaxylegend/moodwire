import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // 1. Fix evaluated escape sequences (The LLM or a JSON parser evaluated \f, \t, \r, \n)
    // \frac -> \f + rac
    content = content.replace(/\x0Crac/g, '\\frac');
    // \theta -> \t + heta
    content = content.replace(/\x09heta/g, '\\theta');
    // \tau -> \t + au
    content = content.replace(/\x09au/g, '\\tau');
    // \rho -> \r + ho (this might have caused newlines, but let's check for \r)
    content = content.replace(/\rho/g, '\\rho'); // \r is carriage return
    // \nu -> \n + u
    content = content.replace(/\nu/g, '\\nu'); // \n is newline
    
    // Fix other literal evaluation bugs just in case
    content = content.replace(/\\INT/gi, '\\int');
    content = content.replace(/ D X/g, ' dx');
    content = content.replace(/ DX/g, ' dx');

    // 2. Fix the split dollar signs in standard patterns
    
    // Pattern A: "- **Name:** EQUATION — Description"
    const formulaPattern1 = /^(\s*-\s*\*\*[^*]+\*\*\s*:?\s*)(.+?)(\s*—\s*.+)$/gm;
    content = content.replace(formulaPattern1, (match, prefix, equation, suffix) => {
        let cleanEq = equation.replace(/\$/g, '').trim();
        // remove trailing unmatched braces if any (common LLM hallucination)
        if (cleanEq.endsWith('}') && !cleanEq.includes('{')) {
            cleanEq = cleanEq.slice(0, -1);
        }
        return `${prefix}$${cleanEq}$${suffix}`;
    });

    // Pattern B: "- EQUATION — Description"
    const formulaPattern2 = /^(\s*-\s*)([^\*]+?)(\s*—\s*.+)$/gm;
    content = content.replace(formulaPattern2, (match, prefix, equation, suffix) => {
        const cleanEq = equation.replace(/\$/g, '').trim();
        return `${prefix}$${cleanEq}$${suffix}`;
    });

    // Pattern C: "→ EQUATION"
    const arrowPattern = /(→\s*)(.+?)$/gm;
    content = content.replace(arrowPattern, (match, prefix, equation) => {
        // if it already has $, let's clean and re-wrap
        const cleanEq = equation.replace(/\$/g, '').trim();
        return `${prefix}$${cleanEq}$`;
    });

    // Pattern D: "**Final Answer:** EQUATION"
    const finalAnswerPattern = /(\*\*Final Answer:\*\*\s*)(.+?)$/gm;
    content = content.replace(finalAnswerPattern, (match, prefix, equation) => {
        const cleanEq = equation.replace(/\$/g, '').trim();
        return `${prefix}$${cleanEq}$`;
    });

    // Pattern E: MCQ Answers "A) EQUATION"
    const mcqPattern = /^(\s*(?:A|B|C|D)\)\s*)(.+?)$/gm;
    content = content.replace(mcqPattern, (match, prefix, equation) => {
        const cleanEq = equation.replace(/\$/g, '').trim();
        return `${prefix}$${cleanEq}$`;
    });

    // 3. Clean up any $$
    content = content.replace(/\$\$/g, '$');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\nFixed ${totalFixes} files with absolute precision.`);
