/**
 * FINAL INTEGRITY REPAIR SCRIPT
 * Fixes: Repetitive TOC, Broken HTML attrs, Plain text math, Spacing
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

    // 1. Fix repetitive Table of Contents
    // If "3 Solved PYQs (Continued)" appears multiple times in TOC
    const tocSection = content.match(/## 📋 Table of Contents[\s\S]*?##/);
    if (tocSection) {
        let toc = tocSection[0];
        const lines = toc.split('\n');
        const seen = new Set();
        const uniqueLines = lines.filter(line => {
            const clean = line.trim().toLowerCase();
            if (!clean.startsWith('-') && !clean.startsWith('*')) return true;
            if (seen.has(clean)) return false;
            seen.add(clean);
            return true;
        });
        const newToc = uniqueLines.join('\n');
        if (newToc !== toc) {
            content = content.replace(toc, newToc + '\n\n##');
            fixes.push('Deduplicated Table of Contents');
        }
    }

    // 2. Fix broken HTML attributes: <div [class](/path)="value"> -> <div class="value">
    const brokenHtmlRegex = /<([a-z0-9]+)\s+\[class\]\([^)]*\)="([^"]*)">/gi;
    if (content.match(brokenHtmlRegex)) {
        content = content.replace(brokenHtmlRegex, '<$1 class="$2">');
        fixes.push('Fixed broken HTML attributes');
    }

    // 3. Fix plain text LaTeX formulas
    // Identify lines that contain LaTeX commands but no $ or $$
    const lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // If line contains \frac, \lim, \sum, \sin etc and NO $
        if ((line.includes('\\frac') || line.includes('\\lim') || line.includes('\\sin') || line.includes('\\sqrt')) && !line.includes('$')) {
            // Check if it's already in a block or code block
            if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim() === '') continue;
            lines[i] = `\n$$ ${line.trim()} $$\n`;
            changed = true;
        }
    }
    if (changed) {
        content = lines.join('\n');
        fixes.push('Wrapped plain text LaTeX in $$');
    }

    // 4. Fix mixed delimiters like "formula $ = formula $"
    const mixedDelimRegex = /([^$])\s+=\s+([^$]*)\$/g;
    // This is risky, let's target specific cases like line 96 in continuity notes
    if (content.includes('$ =')) {
        content = content.replace(/\$ =/g, ' =');
        fixes.push('Cleaned up mixed math delimiters');
    }

    // 5. Fix excessive newlines (3 or more)
    if (content.match(/\n{4,}/)) {
        content = content.replace(/\n{4,}/g, '\n\n\n');
        fixes.push('Removed excessive newlines');
    }

    // 6. Fix "Solved Yes" hallucination again (just in case)
    content = content.replace(/Solved Yes/g, 'Solved PYQs');

    // 7. Fix the "lb EQ 0" case specifically for Class 8 Algebraic Expressions
    if (content.includes('lb \r\nEQ 0') || content.includes('lb \nEQ 0')) {
        content = content.replace(/lb\s*\r?\nEQ 0\$/g, '$b \\neq 0$');
        fixes.push('Fixed "lb EQ 0" typo');
    }

    // 8. Fix nested $ inside $$ (often happens during previous regexes)
    content = content.replace(/\$\$\s*\$([\s\S]*?)\$\s*\$\$/g, '$$$$ $1 $$$$');

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Final integrity repair completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
report.forEach(r => {
    console.log(`📝 ${r.file}`);
    r.fixes.forEach(f => console.log(`   • ${f}`));
});
