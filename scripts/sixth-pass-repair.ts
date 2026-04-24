/**
 * SIXTH PASS — Fix double-wrapped O() notation and remaining edge cases
 */
import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const orig = content;

    // Fix 1: Double-wrapped O() — "$O(n $\log n)$" → "$O(n \log n)$"
    // Pattern: $O( ... $\CMD ...) $ — the inner $ breaks it
    content = content.replace(/\$O\(([^$]*?)\$\\(log|ln)\s*([^)$]*?)\)\$/g, 
        (m, before, cmd, after) => `$O(${before}\\${cmd} ${after})$`);

    // Fix 2: "$O($\log n)$" → "$O(\log n)$"
    content = content.replace(/\$O\(\$\\(log|ln)\s*([^)]*?)\)\$/g, 
        (m, cmd, rest) => `$O(\\${cmd} ${rest})$`);

    // Fix 3: Remaining O() without $ at all: "O(n \log n)" → "$O(n \log n)$"  
    content = content.replace(/(?<!\$)O\(([^)]*\\(?:log|ln)[^)]*)\)(?!\$)/g, 
        (m, inner) => `$O(${inner})$`);

    // Fix 4: O(n^2), O(1) etc without $ 
    content = content.replace(/(?<!\$)O\(([^)]*[\^_][^)]*)\)(?!\$)/g, 
        (m, inner) => `$O(${inner})$`);

    // Fix 5: "Mph" → "pH", "Ipoh" → "pOH" (chemistry hallucinations)
    content = content.replace(/\bMph\b/g, 'pH');
    content = content.replace(/\bIpoh\b/g, 'pOH');
    content = content.replace(/\bmph\b/g, 'pH');
    content = content.replace(/\bPOH\b/g, 'pOH');

    // Fix 6: "\fracas" → "\frac" (hallucination with extra letters)
    content = content.replace(/\\fracas/g, '\\frac');

    // Fix 7: "a $\times b = $b \times a$.$" → "$a \times b = b \times a$"
    // General: fix split dollar expressions with \times
    content = content.replace(/([a-z])\s*\$\\times\s+([a-z])\s*=\s*\$([a-z])\s*\\times\s+([a-z])\$\.\$/g,
        '$$$1 \\times $2 = $3 \\times $4$.');

    // Fix 8: Lines with "- VAR = -\log..." that still have stray dollars
    content = content.replace(/- (pH|pOH)\s*=\s*-\\log\[([^\]]*)\]\$/g, 
        '- $\\text{$1} = -\\log[$2]$');
    content = content.replace(/- (pH|pOH)\s*=\s*-\\log_\{10\}\[([^\]]*)\]\$\s*—\s*([^$]*)\$/g,
        '- $\\text{$1} = -\\log_{10}[$2]$ — $3');

    // Fix 9: Clean up any remaining $$ (double dollar inline)
    // Only fix inline $$, not block math (block is on its own line)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Replace $$ with $ only in the middle of lines (not standalone block math)
        if (line.trim() !== '$$' && !line.trim().startsWith('$$') && !line.trim().endsWith('$$')) {
            // Fix "$$ " or " $$" patterns that aren't block math
            lines[i] = line.replace(/\$\$(?=[^$])/g, '$').replace(/(?<=[^$])\$\$/g, '$');
        }
    }
    content = lines.join('\n');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\n🔧 Sixth pass repaired ${totalFixes} files.`);
