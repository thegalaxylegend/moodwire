/**
 * 🔧 Local Blog Repair v2 — ULTRA MATH HARDENED (ZERO API CALLS)
 * 
 * Catches even the smallest raw math rendering errors.
 * NEVER changes blog dates.
 * 
 * Run: npx tsx scripts/local-repair-v2.ts
 * Dry run: npx tsx scripts/local-repair-v2.ts --dry-run
 * Single: npx tsx scripts/local-repair-v2.ts --file=trigonometric
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const isDryRun = process.argv.includes('--dry-run');
const singleFileArg = process.argv.find(a => a.startsWith('--file='));
const singleFile = singleFileArg ? singleFileArg.split('=')[1] : null;

interface RepairStats { slug: string; fixes: string[]; }

// ══════════════════════════════════════════════════
// ALL KNOWN LATEX COMMANDS (for detection)
// ══════════════════════════════════════════════════
const LATEX_CMDS = [
  'frac','sqrt','sum','int','prod','lim','Delta','alpha','beta','gamma',
  'theta','phi','psi','omega','mu','sigma','lambda','pi','epsilon','delta',
  'eta','zeta','rho','tau','nu','chi','xi','kappa','nabla','partial','infty',
  'text','left','right','begin','end','log','ln','sin','cos','tan','sec',
  'csc','cot','vec','hat','bar','overline','underline','boxed','mathrm',
  'mathbb','binom','displaystyle','cancel','cdot','ldots','leq','geq',
  'neq','approx','equiv','pm','mp','times','div','rightarrow','leftarrow',
  'Rightarrow','Leftarrow','circ','degree','perp','parallel','subset',
  'supset','cup','cap','forall','exists','in','notin','mathbf','mathcal'
];

const LATEX_CMD_SET = new Set(LATEX_CMDS);

function preClean(body: string): { body: string, count: number } {
  let count = 0;
  let newBody = body;

  // Pattern 1: $ immediately following \ (e.g. \sin$ or \frac$)
  const p1 = newBody.match(/\\[a-zA-Z]+\$/g);
  if (p1) {
    count += p1.length;
    newBody = newBody.replace(/(\\[a-zA-Z]+)\$/g, '$1');
  }

  // Pattern 2: $ inside brace groups like \left( ... $ ... \right)
  // This is hard to regex perfectly, but we can catch common ones
  const p2 = newBody.match(/\\left\(\s*\$/g);
  if (p2) {
    count += p2.length;
    newBody = newBody.replace(/\\left\(\s*\$/g, '\\left(');
  }
  const p3 = newBody.match(/\$\s*\\right\)/g);
  if (p3) {
    count += p3.length;
    newBody = newBody.replace(/\$\s*\\right\)/g, '\\right)');
  }

  // Pattern 4: Redundant $$ inside what should be $
  const p4 = newBody.match(/\$\$\$/g);
  if (p4) {
    count += p4.length;
    newBody = newBody.replace(/\$\$\$/g, '$$');
  }

  // Pattern 5: \neq $$ (common split error)
  const p5 = newBody.match(/\\neq\s*\$\$/g);
  if (p5) {
    count += p5.length;
    newBody = newBody.replace(/\\neq\s*\$\$/g, '\\neq ');
  }

  return { body: newBody, count };
}

function repairBlog(filePath: string): RepairStats {
  const slug = path.basename(filePath, '.md');
  const original = fs.readFileSync(filePath, 'utf-8');
  const fixes: string[] = [];

  // Separate frontmatter and body — PRESERVE frontmatter exactly (including date)
  const fmMatch = original.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
  const frontmatter = fmMatch ? fmMatch[1] : '';
  let body = fmMatch ? fmMatch[2] : original;

  // PRE-CLEAN previous corruption
  const cleaned = preClean(body);
  if (cleaned.count > 0) {
    body = cleaned.body;
    fixes.push(`Cleaned ${cleaned.count} corruption artifacts from previous repair`);
  }

  // ═══════════════════════════════════════════
  // FIX 1: [object Object] removal
  // ═══════════════════════════════════════════
  if (body.includes('[object Object]')) {
    const c = (body.match(/\[object Object\]/g) || []).length;
    body = body.replace(/\[object Object\]/g, '');
    fixes.push(`Removed ${c} [object Object]`);
  }

  // ═══════════════════════════════════════════
  // FIX 2: Double/triple escaped backslashes \\\\frac → \\frac
  // ═══════════════════════════════════════════
  {
    let c = 0;
    body = body.replace(/\\\\\\\\([a-zA-Z])/g, (_m, cmd) => { c++; return '\\\\' + cmd; });
    body = body.replace(/\\\\\\([a-zA-Z])/g, (_m, cmd) => { c++; return '\\' + cmd; });
    // Fix \\\\cdot specifically
    body = body.replace(/\\\\cdot/g, () => { c++; return '\\cdot'; });
    if (c > 0) fixes.push(`Fixed ${c} over-escaped backslashes`);
  }

  // ═══════════════════════════════════════════
  // FIX 3: \neq split across lines → rejoin
  // ═══════════════════════════════════════════
  {
    let c = 0;
    // Safer: only rejoin if it's clearly a split \neq
    body = body.replace(/\\\s*\r?\n\s*eq\b/g, () => { c++; return '\\neq'; });
    body = body.replace(/\$\s*\r?\n\s*eq\b/g, () => { c++; return ' \\neq'; });
    if (c > 0) fixes.push(`Rejoined ${c} split \\neq across lines`);
  }

  // ═══════════════════════════════════════════
  // FIX 4: Split dollar fractions
  // Pattern: $\frac{text$}{$text$} → $\frac{text}{text}$
  // ═══════════════════════════════════════════
  {
    let c = 0;
    // Fix: $\frac{...$ + }{$...$ or }{$...$}
    body = body.replace(/\$\\frac\{([^$]*?)\$\}\{\$([^$]*?)\$\}/g, (_m, num, den) => {
      c++; return `$\\frac{${num}}{${den}}$`;
    });
    // Fix: $\frac{...$ + }{...} (partial split)
    body = body.replace(/\$\\frac\{([^$]*?)\$\}\{([^$}]*?)\}/g, (_m, num, den) => {
      c++; return `$\\frac{${num}}{${den}}$`;
    });
    if (c > 0) fixes.push(`Fixed ${c} split dollar fractions`);
  }

  // ═══════════════════════════════════════════
  // FIX 5: Unclosed \frac/\sqrt braces before $
  // Pattern: $\frac{V_p}{\sqrt{2}$ → $\frac{V_p}{\sqrt{2}}$
  // ═══════════════════════════════════════════
  {
    let c = 0;
    // Count braces inside each $...$ block and fix
    body = body.replace(/\$([^$]+)\$/g, (match, inner) => {
      if (!inner.includes('\\')) return match; // skip non-math
      const opens = (inner.match(/\{/g) || []).length;
      const closes = (inner.match(/\}/g) || []).length;
      if (opens > closes) {
        c++;
        return '$' + inner + '}'.repeat(opens - closes) + '$';
      }
      return match;
    });
    if (c > 0) fixes.push(`Closed ${c} unclosed brace groups in inline math`);
  }

  // ═══════════════════════════════════════════
  // FIX 6: Naked LaTeX commands (not inside $...$)
  // ═══════════════════════════════════════════
  {
    let c = 0;
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^\s*\$\$/.test(line)) continue;
      if (/^\s*\|/.test(line)) continue; 
      if (/^\s*```/.test(line)) continue;

      // Detect naked commands like \frac{...}{...} or \sin{...}
      // This is a complex task. We use a regex to find the START of a command
      // and then count braces to find the END.
      const nakedCmdRegex = /\\(frac|sqrt|text|vec|hat|bar|boxed|mathrm|mathbb|binom|sin|cos|tan|log|ln|lim)(\{|\[|\s|$)/g;
      let match;
      const offset = 0;
      
      while ((match = nakedCmdRegex.exec(line)) !== null) {
        const startIdx = match.index;
        // Check if this startIdx is ALREADY inside $...$
        const before = line.substring(0, startIdx);
        const dollarCount = (before.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) continue; // Already inside math

        // Find end of this expression
        let endIdx = startIdx + match[0].length;
        let braceCount = (match[0].match(/\{/g) || []).length - (match[0].match(/\}/g) || []).length;
        
        // If it was \frac{...}{...}, we need to find BOTH blocks
        while (endIdx < line.length && (braceCount > 0 || line[endIdx] === '{')) {
          if (line[endIdx] === '{') braceCount++;
          if (line[endIdx] === '}') braceCount--;
          endIdx++;
        }

        // Wrap the found chunk
        const originalChunk = line.substring(startIdx, endIdx);
        if (originalChunk.includes('$')) continue; // Don't wrap if it contains $

        const wrapped = `$${originalChunk.trim()}$`;
        line = line.substring(0, startIdx) + wrapped + line.substring(endIdx);
        
        // Adjust regex index
        nakedCmdRegex.lastIndex = startIdx + wrapped.length;
        c++;
      }
      lines[i] = line;
    }
    body = lines.join('\n');
    if (c > 0) fixes.push(`Wrapped ${c} naked LaTeX commands safely`);
  }

  // ═══════════════════════════════════════════
  // FIX 7: Bare math symbols without backslash
  // Pattern: "cos(omega t + phi)" → "$\cos(\omega t + \phi)$"
  // Only in lines that look like formulas
  // ═══════════════════════════════════════════
  {
    let c = 0;
    const mathTokens: Record<string, string> = {
      'theta': '\\theta', 'alpha': '\\alpha', 'beta': '\\beta', 
      'gamma': '\\gamma', 'delta': '\\delta', 'omega': '\\omega',
      'phi': '\\phi', 'psi': '\\psi', 'epsilon': '\\epsilon',
      'sigma': '\\sigma', 'lambda': '\\lambda', 'mu': '\\mu',
      'rho': '\\rho', 'tau': '\\tau', 'pi': '\\pi',
      'infty': '\\infty', 'nabla': '\\nabla',
    };
    // Only fix inside $...$ blocks where these appear bare
    body = body.replace(/\$([^$]+)\$/g, (match, inner: string) => {
      let fixed = inner;
      for (const [bare, escaped] of Object.entries(mathTokens)) {
        // Match bare token not preceded by \ and not part of longer word
        const re = new RegExp(`(?<!\\\\)\\b${bare}\\b`, 'g');
        if (re.test(fixed)) {
          fixed = fixed.replace(re, escaped);
          c++;
        }
      }
      if (fixed !== inner) return '$' + fixed + '$';
      return match;
    });
    if (c > 0) fixes.push(`Added backslash to ${c} bare Greek/math symbols`);
  }

  // ═══════════════════════════════════════════
  // FIX 8: Case-mangled LaTeX commands
  // ═══════════════════════════════════════════
  {
    let c = 0;
    body = body.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
      const lower = cmd.toLowerCase();
      if (LATEX_CMD_SET.has(lower) && cmd !== lower) {
        c++;
        return '\\' + lower;
      }
      return match;
    });
    if (c > 0) fixes.push(`Fixed ${c} case-mangled LaTeX commands`);
  }

  // ═══════════════════════════════════════════
  // FIX 9: ^circ → ^{\\circ}
  // ═══════════════════════════════════════════
  {
    const before = body;
    body = body.replace(/\^circ(?!\})/gi, '^{\\circ}');
    body = body.replace(/\^\\circ(?!\})/g, '^{\\circ}');
    if (body !== before) fixes.push('Fixed ^circ formatting');
  }

  // ═══════════════════════════════════════════
  // FIX 10: MCQ options with raw LaTeX (no $ wrapping)
  // Pattern: **A)**   \frac{...}{...}
  // ═══════════════════════════════════════════
  {
    let c = 0;
    body = body.replace(
      /^(\*\*[A-D]\)\*\*\s+)(\\(?:frac|sqrt|text|sin|cos|tan)\{[\s\S]*?)$/gm,
      (_m, prefix, formula) => {
        if (formula.trim().startsWith('$')) return _m;
        c++;
        return `${prefix}$${formula.trim()}$`;
      }
    );
    if (c > 0) fixes.push(`Wrapped ${c} raw LaTeX MCQ options`);
  }

  // ═══════════════════════════════════════════
  // FIX 11: Standalone LaTeX lines without $$ wrapping
  // ═══════════════════════════════════════════
  {
    let c = 0;
    body = body.replace(
      /^(\s*)(\\(?:sin|cos|tan|frac|sqrt|sum|int|lim|text|left|begin|Delta|alpha|theta)[\s\S]*?)$/gm,
      (match, indent, formula) => {
        if (formula.trim().startsWith('$') || formula.trim().includes('$')) return match;
        // Check it's actually a formula line (has math chars)
        if (/[{}^_=+]/.test(formula) || /\\[a-z]+\{/.test(formula)) {
          c++;
          return `${indent}$$${formula.trim()}$$`;
        }
        return match;
      }
    );
    if (c > 0) fixes.push(`Wrapped ${c} standalone LaTeX lines in $$`);
  }

  // ═══════════════════════════════════════════
  // FIX 12: Formulas after colon/bold without $ wrapping
  // Pattern: "- **Rate:** \frac{dN}{dt}" → "- **Rate:** $\frac{dN}{dt}$"
  // ═══════════════════════════════════════════
  {
    let c = 0;
    body = body.replace(
      /^(\s*-?\s*\*{0,2}[^*\n]*?\*{0,2}:?\s*)(\\(?:frac|sqrt|sum|int|prod|lim|Delta|alpha|beta|gamma|theta|phi|psi|omega|mu|sigma|lambda|sin|cos|tan|vec|text|left|begin)\{[\s\S]*?)$/gm,
      (match, prefix, formula) => {
        if (prefix.trim().endsWith('$') || formula.trim().startsWith('$')) return match;
        c++;
        return `${prefix}$${formula.trim()}$`;
      }
    );
    if (c > 0) fixes.push(`Wrapped ${c} post-colon raw LaTeX formulas`);
  }

  // ═══════════════════════════════════════════
  // FIX 13: Empty LaTeX blocks
  // ═══════════════════════════════════════════
  {
    const e1 = (body.match(/\$\$\s*\$\$/g) || []).length;
    body = body.replace(/\$\$\s*\$\$/g, '');
    const e2 = (body.match(/\$\s+\$/g) || []).length;
    body = body.replace(/\$\s+\$/g, '');
    if (e1 + e2 > 0) fixes.push(`Removed ${e1 + e2} empty LaTeX blocks`);
  }

  // ═══════════════════════════════════════════
  // FIX 14: \\sum used as English word "sum"
  // In prose context, \sum renders as Σ which is wrong
  // ═══════════════════════════════════════════
  {
    let c = 0;
    // Only fix \sum that's clearly in prose (not inside $...$)
    const lines2 = body.split('\n');
    for (let i = 0; i < lines2.length; i++) {
      const line = lines2[i];
      // Split by $...$ to only process non-math parts
      const segs = line.split(/(\$[^$]*\$)/);
      for (let s = 0; s < segs.length; s++) {
        if (s % 2 === 1) continue;
        // Replace \sum in prose with "sum"
        if (/\\sum\b/.test(segs[s]) && !/[{}_^]/.test(segs[s])) {
          segs[s] = segs[s].replace(/\\sum\b/g, 'sum');
          c++;
        }
      }
      lines2[i] = segs.join('');
    }
    body = lines2.join('\n');
    if (c > 0) fixes.push(`Fixed ${c} \\sum used as English word "sum"`);
  }

  // ═══════════════════════════════════════════
  // FIX 15: \\times in prose → × (multiplication sign)
  // ═══════════════════════════════════════════
  {
    let c = 0;
    const lines3 = body.split('\n');
    for (let i = 0; i < lines3.length; i++) {
      const segs = lines3[i].split(/(\$[^$]*\$)/);
      for (let s = 0; s < segs.length; s++) {
        if (s % 2 === 1) continue;
        if (/\\times\b/.test(segs[s])) {
          segs[s] = segs[s].replace(/\\times\b/g, '×');
          c++;
        }
      }
      lines3[i] = segs.join('');
    }
    body = lines3.join('\n');
    if (c > 0) fixes.push(`Fixed ${c} \\times in prose → ×`);
  }

  // ═══════════════════════════════════════════
  // FIX 16: "Solved Yes" → "Solved PYQs"
  // ═══════════════════════════════════════════
  if (/Solved Yes/i.test(body)) {
    body = body.replace(/Solved Yes/gi, 'Solved PYQs');
    fixes.push('Fixed "Solved Yes" → "Solved PYQs"');
  }

  // ═══════════════════════════════════════════
  // FIX 17: Duplicate Related Topics / Jules footers
  // ═══════════════════════════════════════════
  {
    const rtPattern = /## (?:📚 )?Related Topics[\s\S]*?(?=\n## |\n---\n\n### |$)/g;
    const rtMatches = [...body.matchAll(rtPattern)];
    if (rtMatches.length > 1) {
      for (let i = 0; i < rtMatches.length - 1; i++) {
        body = body.replace(rtMatches[i][0], '');
      }
      fixes.push(`Removed ${rtMatches.length - 1} duplicate Related Topics`);
    }
  }
  {
    const fpat = /\n---\s*\n\*This post was curated.*?\*\s*/g;
    const fmatches = [...body.matchAll(fpat)];
    if (fmatches.length > 1) {
      let kept = false;
      body = body.replace(fpat, (m) => { if (!kept) { kept = true; return m; } return ''; });
      fixes.push(`Removed ${fmatches.length - 1} duplicate footers`);
    }
  }

  // ═══════════════════════════════════════════
  // FIX 18: Trailing orphan $ or } at end of file
  // ═══════════════════════════════════════════
  {
    const trimmed = body.trimEnd();
    if (trimmed.endsWith('}}}}}') || trimmed.endsWith('}}}}') || trimmed.endsWith('}}}')) {
      body = body.replace(/\}{3,}\s*$/, '');
      fixes.push('Removed trailing orphan braces');
    }
    // Trailing lone $
    if (/\*\.\*\$$/.test(trimmed) || /Ayush\.\*\$$/.test(trimmed)) {
      body = body.replace(/\$\s*$/, '');
      fixes.push('Removed trailing orphan $');
    }
  }

  // ═══════════════════════════════════════════
  // FIX 19: Duplicate H1 headers
  // ═══════════════════════════════════════════
  {
    const h1s = body.match(/^# .+$/gm) || [];
    if (h1s.length > 1) {
      let first = false;
      body = body.replace(/^# .+$/gm, (m) => { if (!first) { first = true; return m; } return ''; });
      fixes.push(`Removed ${h1s.length - 1} duplicate H1s`);
    }
  }

  // ═══════════════════════════════════════════
  // FIX 20: Empty bullet points & excessive newlines
  // ═══════════════════════════════════════════
  {
    const eb = (body.match(/^\s*-\s*$/gm) || []).length;
    if (eb > 0) {
      body = body.replace(/^\s*-\s*$/gm, '');
      fixes.push(`Removed ${eb} empty bullets`);
    }
    body = body.replace(/\n{3,}/g, '\n\n');
  }

  // ═══════════════════════════════════════════
  // WRITE — only if changed, NEVER touch frontmatter/date
  // ═══════════════════════════════════════════
  const finalContent = frontmatter + body;
  if (finalContent !== original && !isDryRun) {
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, finalContent, 'utf-8');
    fs.renameSync(tmp, filePath);
  }

  return { slug, fixes };
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(60));
  console.log('🔧 LOCAL REPAIR v2 — ULTRA MATH HARDENED (Zero API)');
  console.log('═'.repeat(60));
  if (isDryRun) console.log('🧪 DRY RUN — no files modified.\n');

  if (!fs.existsSync(BLOG_DIR)) { console.error('❌ Blog dir not found'); process.exit(1); }

  let files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  if (singleFile) {
    files = files.filter(f => f.includes(singleFile));
    console.log(`🎯 Targeting ${files.length} file(s) matching "${singleFile}"\n`);
  } else {
    console.log(`📂 Scanning all ${files.length} blogs...\n`);
  }

  let totalFixed = 0, totalFixes = 0;
  const allResults: RepairStats[] = [];

  for (const file of files) {
    const result = repairBlog(path.join(BLOG_DIR, file));
    allResults.push(result);
    if (result.fixes.length > 0) {
      totalFixed++;
      totalFixes += result.fixes.length;
      console.log(`🔧 ${result.slug}`);
      result.fixes.forEach(f => console.log(`   ✅ ${f}`));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 REPAIR v2 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  📄 Scanned:    ${files.length}`);
  console.log(`  🔧 Repaired:   ${totalFixed}`);
  console.log(`  ✅ Fixes:      ${totalFixes}`);
  console.log(`  ✨ Clean:      ${files.length - totalFixed}`);
  console.log(`  📅 Dates:      UNTOUCHED`);
  console.log(`  💰 API calls:  0`);
  console.log('═'.repeat(60));

  const reportDir = path.join(__dirname, '../jules-reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `local-repair-v2-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'live',
    summary: { scanned: files.length, repaired: totalFixed, totalFixes, datesChanged: 0 },
    repairs: allResults.filter(r => r.fixes.length > 0)
  }, null, 2));
  console.log(`\n📄 Report: ${reportPath}`);
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });
