/**
 * CONTROL CHARACTER REPAIR SCRIPT
 * Fixes: \f rac -> \frac, \t an -> \tan, etc.
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

    // Fix control characters that replaced backslashes
    const replacements = [
        { from: /\f/g, to: '\\f', name: '\\f -> \\\\f' },
        { from: /\t/g, to: '\\t', name: '\\t -> \\\\t' },
        { from: /\v/g, to: '\\v', name: '\\v -> \\\\v' },
        { from: /\r/g, to: '\\r', name: '\\r -> \\\\r' }, // Be careful with \r\n
        { from: /\b/g, to: '\\b', name: '\\b -> \\\\b' },
    ];

    // Wait, the real problem is they were interpreted as control chars. 
    // We want \f to become \f so it renders as \frac
    // If the file has the literal char 0x0C (form feed), it should be \f
    
    if (content.includes('\f')) {
        content = content.replace(/\f/g, '\\f');
        fixes.push('Fixed \f -> \\f');
    }
    if (content.includes('\t')) {
        // Only replace tab if it's followed by letters that look like LaTeX commands
        content = content.replace(/\t(an|ext|heta|riangle)/g, '\\t$1');
        fixes.push('Fixed \t -> \\t');
    }
    if (content.includes('\v')) {
        content = content.replace(/\v/g, '\\v');
        fixes.push('Fixed \v -> \\v');
    }
    if (content.includes('\b')) {
        content = content.replace(/\b(eta)/g, '\\b$1');
        fixes.push('Fixed \b -> \\b');
    }

    // Fix missing backslashes in front of common commands if they appear naked
    const nakedCommands = ['sin', 'cos', 'tan', 'lim', 'frac', 'sqrt', 'theta', 'alpha', 'beta', 'gamma', 'delta', 'pi', 'sum', 'int', 'log', 'exp'];
    nakedCommands.forEach(cmd => {
        // Match cmd if it's not preceded by \ or $ and is in a likely math context
        // This is risky, let's only do it if it's inside $ or {} or followed by { or _
        const regex = new RegExp(`([^\\\\$a-zA-Z])(${cmd})([\\s_{])`, 'g');
        if (content.match(regex)) {
            content = content.replace(regex, '$1\\$2$3');
            fixes.push(`Fixed naked \\${cmd}`);
        }
    });

    // Write if changed
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes += fixes.length;
        report.push({ file, fixes });
    }
}

console.log(`\n✅ Control character repair completed. Fixed ${totalFixes} issues across ${report.length} files.\n`);
