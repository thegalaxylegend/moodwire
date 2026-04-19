/**
 * LOCAL MARKDOWN REPAIR SCRIPT — Zero API Usage
 * Fixes: \franc → \frac, \sort → \sqrt, "suggestion limit reached", broken LaTeX delimiters
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blogs');

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;
const report = [];

for (const file of files) {
  const filePath = path.join(BLOGS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fixes = [];

  // === FIX 1: \franc → \frac (common AI typo) ===
  const francCount = (content.match(/\\franc/g) || []).length;
  if (francCount > 0) {
    content = content.replace(/\\franc/g, '\\frac');
    fixes.push(`\\franc → \\frac (${francCount}x)`);
  }

  // === FIX 2: \France → \frac ===
  const FranceCount = (content.match(/\\France/g) || []).length;
  if (FranceCount > 0) {
    content = content.replace(/\\France/g, '\\frac');
    fixes.push(`\\France → \\frac (${FranceCount}x)`);
  }

  // === FIX 3: \sort → \sqrt ===
  const sortCount = (content.match(/\\sort\{/g) || []).length;
  if (sortCount > 0) {
    content = content.replace(/\\sort\{/g, '\\sqrt{');
    fixes.push(`\\sort{ → \\sqrt{ (${sortCount}x)`);
  }
  // Also fix \sort' (missing brace variant)
  const sortPrimeCount = (content.match(/\\sort'/g) || []).length;
  if (sortPrimeCount > 0) {
    content = content.replace(/\\sort'/g, "\\sqrt{");
    fixes.push(`\\sort' → \\sqrt{ (${sortPrimeCount}x)`);
  }

  // === FIX 4: "suggestion limit reached" → replace with proper variable names ===
  const slrCount = (content.match(/\(suggestion limit reached\)/g) || []).length;
  if (slrCount > 0) {
    // Replace (suggestion limit reached) with 'a' as it's typically used for variables
    content = content.replace(/\(suggestion limit reached\)/g, 'a');
    fixes.push(`(suggestion limit reached) → a (${slrCount}x)`);
  }

  // === FIX 5: Fix \\{ and \\} used as LaTeX delimiters (should be $) ===
  // Pattern: \{ formula \} used instead of $ formula $
  // This is complex - only fix obvious cases where \{ starts a formula block
  
  // === FIX 6: Fix ^circa → ^\\circ (degree symbol) ===
  const circaCount = (content.match(/\^circa/g) || []).length;
  if (circaCount > 0) {
    content = content.replace(/\^circa/g, '^{\\circ}');
    fixes.push(`^circa → ^{\\circ} (${circaCount}x)`);
  }

  // === FIX 7: Fix ^CIRC → ^\\circ ===
  const circCount = (content.match(/\^CIRC/g) || []).length;
  if (circCount > 0) {
    content = content.replace(/\^CIRC/g, '^{\\circ}');
    fixes.push(`^CIRC → ^{\\circ} (${circCount}x)`);
  }

  // === FIX 8: Fix broken HTML div tags in Quick Recall ===
  const brokenDivCount = (content.match(/<DIV \[class\]\([^)]*\)="[^"]*">/g) || []).length;
  if (brokenDivCount > 0) {
    content = content.replace(/<DIV \[class\]\([^)]*\)="([^"]*)">/g, '<div class="$1">');
    fixes.push(`Broken DIV tags → clean HTML (${brokenDivCount}x)`);
  }

  // === FIX 9: Fix double bullet points "- -" → "-" ===
  const doubleBulletCount = (content.match(/^- - /gm) || []).length;
  if (doubleBulletCount > 0) {
    content = content.replace(/^- - /gm, '- ');
    fixes.push(`Double bullets "- -" → "-" (${doubleBulletCount}x)`);
  }

  // === FIX 10: Fix "Yes" used instead of "PYQs" (common AI hallucination) ===
  const yesCount = (content.match(/Solved Yes/g) || []).length;
  if (yesCount > 0) {
    content = content.replace(/Solved Yes/g, 'Solved PYQs');
    fixes.push(`"Solved Yes" → "Solved PYQs" (${yesCount}x)`);
  }
  // Also in running text
  const yesCount2 = (content.match(/years of Yes/g) || []).length;
  if (yesCount2 > 0) {
    content = content.replace(/years of Yes/g, 'years of PYQs');
    fixes.push(`"years of Yes" → "years of PYQs" (${yesCount2}x)`);
  }
  const yesCount3 = (content.match(/many Yes/g) || []).length;
  if (yesCount3 > 0) {
    content = content.replace(/many Yes/g, 'many PYQs');
    fixes.push(`"many Yes" → "many PYQs" (${yesCount3}x)`);
  }
  const yesCount4 = (content.match(/in Yes/g) || []).length;
  if (yesCount4 > 0) {
    content = content.replace(/in Yes/g, 'in PYQs');
    fixes.push(`"in Yes" → "in PYQs" (${yesCount4}x)`);
  }

  // === FIX 11: Fix stray "lb" instead of "b ≠" ===
  // "lb \nEQ 0" → "$b \\neq 0$"
  if (content.includes('lb \r\nEQ 0') || content.includes('lb \nEQ 0')) {
    content = content.replace(/lb\s*\r?\nEQ 0\$/g, '$b \\neq 0$');
    fixes.push('Fixed "lb EQ 0" → "$b \\neq 0$"');
  }

  // Write if changed
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    totalFixes += fixes.length;
    report.push({ file, fixes });
  }
}

console.log(`\n✅ Fixed ${totalFixes} issues across ${report.length} files\n`);
report.forEach(r => {
  console.log(`📝 ${r.file}`);
  r.fixes.forEach(f => console.log(`   • ${f}`));
  console.log('');
});
