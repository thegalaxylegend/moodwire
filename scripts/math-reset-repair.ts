/**
 * 🛠️ MATH RESET & REPAIR — THE NUCLEAR OPTION
 * 
 * 1. Strips all corrupted $ and $$ delimiters.
 * 2. Re-identifies math blocks and wraps them intelligently.
 * 3. Preserves dates and metadata.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const MATH_KEYWORDS = [
  '\\\\sin','\\\\cos','\\\\tan','\\\\cot','\\\\sec','\\\\csc','\\\\frac','\\\\sqrt',
  '\\\\sum','\\\\int','\\\\prod','\\\\lim','\\\\theta','\\\\alpha','\\\\beta','\\\\gamma',
  '\\\\delta','\\\\omega','\\\\phi','\\\\psi','\\\\mu','\\\\sigma','\\\\lambda','\\\\pi',
  '\\\\epsilon','\\\\delta','\\\\eta','\\\\zeta','\\\\rho','\\\\tau','\\\\nu','\\\\chi',
  '\\\\xi','\\\\kappa','\\\\nabla','\\\\partial','\\\\infty','\\\\text','\\\\left','\\\\right',
  '\\\\begin','\\\\end','\\\\log','\\\\ln','\\\\vec','\\\\hat','\\\\bar','\\\\overline',
  '\\\\underline','\\\\boxed','\\\\mathrm','\\\\mathbb','\\\\binom','\\\\displaystyle',
  '\\\\cancel','\\\\cdot','\\\\ldots','\\\\leq','\\\\geq','\\\\neq','\\\\approx',
  '\\\\equiv','\\\\pm','\\\\mp','\\\\times','\\\\div','\\\\rightarrow','\\\\leftarrow',
  '\\\\Rightarrow','\\\\Leftarrow','\\\\circ','\\\\degree','\\\\perp','\\\\parallel',
  '\\\\subset','\\\\supset','\\\\cup','\\\\cap','\\\\forall','\\\\exists','\\\\in',
  '\\\\notin','\\\\mathbf','\\\\mathcal','\\\\Delta'
];

const MATH_REGEX = new RegExp(`(${MATH_KEYWORDS.join('|')})`, 'i');

function repairBlog(filePath: string) {
  const slug = path.basename(filePath, '.md');
  const original = fs.readFileSync(filePath, 'utf-8');

  const fmMatch = original.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
  if (!fmMatch) return;
  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // 1. STRIP ALL DOLLARS
  body = body.replace(/\$+/g, '');

  // 2. PROCESS LINE BY LINE
  const lines = body.split('\n');
  const newLines = lines.map(line => {
    if (line.trim() === '') return line;
    if (line.startsWith('#')) return line; // Headlines
    if (line.startsWith('---')) return line; // HRs
    if (line.startsWith('![')) return line; // Images
    if (line.startsWith('```')) return line; // Code

    // Check if line contains LaTeX
    if (MATH_REGEX.test(line)) {
      // Heuristic: Is it a standalone formula line?
      // (Starts with a command or symbol after bullet/indent)
      const isStandalone = /^(\s*[-*]?\s*)(\\[a-z]+|{)/i.test(line);
      
      if (isStandalone) {
        // Find where the math ends and the explanation (if any) begins
        // e.g. "\sin^2{\theta} + \cos^2{\theta} = 1 — relates sine and cosine"
        const parts = line.match(/^(\s*[-*]?\s*)([\s\S]+?)(\s*[-—]\s*[\s\S]+|\s*$)/);
        if (parts) {
          const [_, indent, math, rest] = parts;
          // Wrap only the math part
          return `${indent}$$${math.trim()}$$$${rest}`;
        }
        return `$$${line.trim()}$$`;
      } else {
        // Inline math — wrap sequences of math tokens
        // This is tricky. Let's find things starting with \ and ending with } or symbol
        return line.replace(/(\\[a-z]+(?:\{[^{}]*\}|[\s\S])*?(?:(?=\s+[a-z]{3,})|$))/gi, (m) => {
          if (m.length < 3) return m;
          return `$${m.trim()}$`;
        });
      }
    }
    return line;
  });

  const finalContent = frontmatter + newLines.join('\n');
  
  // Final polish: fix double dollars and orphaned symbols
  let polished = finalContent
    .replace(/\$\$\$\$/g, '$$')
    .replace(/\$\$\s+\$\$/g, '$$')
    .replace(/\\neq\s+/g, '\\neq ')
    .replace(/\\sum\s+of/g, 'sum of')
    .replace(/\\times/g, '×');

  if (polished !== original) {
    fs.writeFileSync(filePath, polished, 'utf-8');
    console.log(`✅ Repaired: ${slug}`);
  }
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
files.forEach(f => repairBlog(path.join(BLOG_DIR, f)));
console.log('🏁 Nuclear Repair Finished.');
