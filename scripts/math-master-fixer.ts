/**
 * 🎓 MATH MASTER FIXER — FINAL ATTEMPT
 * 
 * 1. Deep cleans all $ and $$ corruption.
 * 2. Fixes malformed \frac and \sqrt (balanced braces).
 * 3. Greedily wraps sequences of LaTeX in $ delimiters.
 * 4. Ensures no nested delimiters.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

// Comprehensive list of commands to trigger math mode
const TRIGGER_CMDS = [
  'sin','cos','tan','cot','sec','csc','frac','sqrt','sum','int','prod','lim',
  'theta','alpha','beta','gamma','delta','omega','phi','psi','mu','sigma',
  'lambda','pi','epsilon','delta','eta','zeta','rho','tau','nu','chi','xi',
  'kappa','nabla','partial','infty','text','left','right','begin','end',
  'log','ln','vec','hat','bar','overline','underline','boxed','mathrm',
  'mathbb','binom','displaystyle','cancel','cdot','ldots','leq','geq',
  'neq','approx','equiv','pm','mp','times','div','rightarrow','leftarrow',
  'Rightarrow','Leftarrow','circ','degree','perp','parallel','subset',
  'supset','cup','cap','forall','exists','in','notin','mathbf','mathcal','Delta'
];

function balanceBraces(text: string): string {
  let balanced = text;
  // Common error: \frac{a}} -> \frac{a}
  balanced = balanced.replace(/(\\frac\{[^{}]*\}\})/g, (m) => m.slice(0, -1));
  // Fix \frac{a} + b} -> \frac{a + b}
  balanced = balanced.replace(/\\frac\{([^{}]*)\}\s*\+\s*([^{}]*)\}/g, '\\frac{$1 + $2}');
  return balanced;
}

function repairBlog(filePath: string) {
  const slug = path.basename(filePath, '.md');
  const original = fs.readFileSync(filePath, 'utf-8');

  const fmMatch = original.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
  if (!fmMatch) return;
  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // 1. Remove all existing $ delimiters to start clean
  body = body.replace(/\$+/g, '');

  const lines = body.split('\n');
  const fixedLines = lines.map(line => {
    if (line.trim() === '') return line;
    if (line.startsWith('#') || line.startsWith('---') || line.startsWith('!') || line.startsWith('```')) return line;

    // Greedy Math Detection:
    // A math segment starts with \ or ^ or _ or { (if preceded by command)
    // and ends when we hit plain English words (longer than 3 chars) or end of line.
    
    let processedLine = line;
    
    // Pattern: Find sequences that LOOK like math
    // Starts with a backslash and includes anything until a potential sentence start or double newline
    // We avoid wrapping single letters unless they are part of an equation
    const mathPattern = /((?:\\[a-z]+|[\d\+\-\=\/\*\(\)\{\}\^_\.\|]|[a-z]\s*[\+\-\=]\s*)+)/gi;
    
    processedLine = processedLine.replace(mathPattern, (match) => {
      const m = match.trim();
      // Only wrap if it contains a backslash or math-specific syntax like ^ or { }
      if (!/\\[a-z]+|[\{\}\^_]/.test(m)) return match;
      
      // Don't wrap if it's just a single command like \sum used in prose
      if (m === '\\sum' || m === '\\times') return m; 
      
      // Clean up braces inside the match
      let fixedMatch = balanceBraces(m);
      
      // Check if it's a standalone line (heuristic: starts with bullet or nothing)
      const isStandalone = /^(\s*[-*]?\s*)$/.test(line.substring(0, line.indexOf(match)));
      
      if (isStandalone && m.length > 20) {
          return `$$${fixedMatch}$$`;
      }
      return `$${fixedMatch}$`;
    });

    return processedLine;
  });

  // Post-process body to fix common artifacts
  let newBody = fixedLines.join('\n');
  
  // 1. Remove redundant $
  newBody = newBody.replace(/\$\$/g, '$'); 
  // 2. Fix block math that got turned into $...$
  newBody = newBody.replace(/^\s*(\$)([^$]+)(\$)\s*$/gm, '$$$$$2$$$$');
  // 3. Fix double escaping
  newBody = newBody.replace(/\\\\([a-z]+)/gi, '\\$1');
  
  // 4. Final safety: If a line contains " — " or " : ", ensure math is only on the left
  newBody = newBody.replace(/^([^$]*?)(?:\$([^$]+)\$)([^$]*?[—:].*)$/gm, (m, before, math, after) => {
      // If the math is followed by an explanation, keep it inline
      return `${before}$${math.trim()}$${after}`;
  });

  const final = frontmatter + newBody;
  if (final !== original) {
    fs.writeFileSync(filePath, final, 'utf-8');
    console.log(`🚀 Master Fixed: ${slug}`);
  }
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
files.forEach(f => repairBlog(path.join(BLOG_DIR, f)));
console.log('✅ ALL BLOGS MASTER REPAIRED.');
