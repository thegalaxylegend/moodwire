/**
 * SECOND PASS — catches everything the first pass missed
 * 1. Naked MCQ answers: A) \frac{...} → A) $\frac{...}$
 * 2. Naked bullet math: -   \sin^2... → - $\sin^2...$
 * 3. Unclosed $ before comma-space: $\sin \theta, → $\sin \theta$,
 * 4. Unclosed $ at end-of-line
 * 5. MCQ answer lines with bare LaTeX
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

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty, headings, code, images, tables, frontmatter markers
        if (!trimmed || trimmed === '---' || trimmed === '-' ||
            trimmed.startsWith('#') || trimmed.startsWith('```') ||
            trimmed.startsWith('|') || trimmed.startsWith('!') ||
            trimmed.startsWith('[') || trimmed.startsWith('*This') ||
            trimmed.startsWith('Continue') || trimmed.startsWith('Put') ||
            trimmed.startsWith('📖') || trimmed.startsWith('- 📖') ||
            trimmed.startsWith('1.') || trimmed.startsWith('2.') ||
            trimmed.startsWith('*🔓') || trimmed.startsWith('*Content')) continue;

        // === FIX 1: MCQ answer lines — bare LaTeX on answer lines ===
        // Pattern: A) \frac{...}  or  B) \cos \theta
        const mcqMatch = line.match(/^(\s*)(A|B|C|D)\)\s+(\\[a-zA-Z].*)$/);
        if (mcqMatch && !mcqMatch[3].includes('$')) {
            lines[i] = `${mcqMatch[1]}${mcqMatch[2]}) $${mcqMatch[3].trim()}$`;
            continue;
        }

        // === FIX 2: Naked bullet math lines ===
        // Pattern: -   \command...  (spaces between - and \)
        const nakedBullet = line.match(/^(\s*-\s+)(\\[a-zA-Z].*)$/);
        if (nakedBullet && !nakedBullet[2].includes('$')) {
            const mathPart = nakedBullet[2].trim();
            // Check if it has " — " separator
            const dashIdx = mathPart.indexOf(' — ');
            if (dashIdx > 0) {
                lines[i] = `${nakedBullet[1]}$${mathPart.substring(0, dashIdx).trim()}$ — ${mathPart.substring(dashIdx + 3).trim()}`;
            } else {
                lines[i] = `${nakedBullet[1]}$${mathPart}$`;
            }
            continue;
        }

        // === FIX 3: Bullet math like "- Q = \sigma..." (starts with letter variable) ===
        const nakedVarBullet = line.match(/^(\s*-\s+)([A-Z][\w]*\s*=\s*\\[a-zA-Z].*)$/);
        if (nakedVarBullet && !nakedVarBullet[2].includes('$')) {
            const mathPart = nakedVarBullet[2].trim();
            const dashIdx = mathPart.indexOf(' — ');
            if (dashIdx > 0) {
                lines[i] = `${nakedVarBullet[1]}$${mathPart.substring(0, dashIdx).trim()}$ — ${mathPart.substring(dashIdx + 3).trim()}`;
            } else {
                lines[i] = `${nakedVarBullet[1]}$${mathPart}$`;
            }
            continue;
        }

        // === FIX 4: **Bold label:** naked math ===
        // Pattern: "- **Name:** \equation..." 
        const boldLabelNaked = line.match(/^(\s*-\s+\*\*[^*]+:\*\*\s+)(\\[a-zA-Z].*)$/);
        if (boldLabelNaked && !boldLabelNaked[2].includes('$')) {
            const mathPart = boldLabelNaked[2].trim();
            const dashIdx = mathPart.indexOf(' — ');
            if (dashIdx > 0) {
                lines[i] = `${boldLabelNaked[1]}$${mathPart.substring(0, dashIdx).trim()}$ — ${mathPart.substring(dashIdx + 3).trim()}`;
            } else {
                lines[i] = `${boldLabelNaked[1]}$${mathPart}$`;
            }
            continue;
        }

        // === FIX 5: **Bold label:** VAR = \equation ===
        const boldLabelVar = line.match(/^(\s*-\s+\*\*[^*]+:\*\*\s+)([A-Za-z_]+\s*=\s*\\[a-zA-Z].*)$/);
        if (boldLabelVar && !boldLabelVar[2].includes('$')) {
            const mathPart = boldLabelVar[2].trim();
            const dashIdx = mathPart.indexOf(' — ');
            if (dashIdx > 0) {
                lines[i] = `${boldLabelVar[1]}$${mathPart.substring(0, dashIdx).trim()}$ — ${mathPart.substring(dashIdx + 3).trim()}`;
            } else {
                lines[i] = `${boldLabelVar[1]}$${mathPart}$`;
            }
            continue;
        }
    }
    content = lines.join('\n');

    // === FIX 6: Close unclosed $ before comma-then-space patterns ===
    // $\sin \theta, $\cos \theta, and $\tan \theta
    // → $\sin \theta$, $\cos \theta$, and $\tan \theta$
    // Pattern: $CMD ARG, (where comma is followed by space or $)
    for (let pass = 0; pass < 10; pass++) {
        const before = content;
        // Close $ before ", " when content is math
        content = content.replace(
            /\$([^$\n]*?\\[a-zA-Z]+[^$\n]*?),\s+(?=\$|and\b|or\b|[a-z])/g,
            (match, math) => `$${math.trimEnd()}$, `
        );
        if (content === before) break;
    }

    // === FIX 7: Close unclosed $ at end of line ===
    // $\sin \theta\n → $\sin \theta$\n
    // Only if the line has an odd number of $ and ends with math-like content
    const lines2 = content.split('\n');
    for (let i = 0; i < lines2.length; i++) {
        const line = lines2[i];
        const dollarCount = (line.match(/\$/g) || []).length;
        if (dollarCount % 2 !== 0) {
            // Check if line ends with math-like content (backslash command, brace, number, variable)
            const endsWithMath = /[a-zA-Z0-9\}\)\\][\s\r]*$/.test(line);
            // Check it's not a heading or frontmatter
            const isSafe = !line.trim().startsWith('#') && !line.trim().startsWith('---') &&
                           !line.includes('heroImage') && !line.includes('title:') &&
                           !line.includes('description:') && !line.includes('category:') &&
                           !line.includes('date:') && !line.includes('practice_link:') &&
                           !line.includes('manualReview:');
            if (endsWithMath && isSafe) {
                // Add closing $ at end (before any trailing whitespace/CR)
                lines2[i] = line.replace(/(\s*\r?)$/, '$$$1');
            }
        }
    }
    content = lines2.join('\n');

    // === FIX 8: Fix remaining "ex " as variable x ===
    content = content.replace(/\bex = (\d)/g, '$x = $1');
    content = content.replace(/\bex,/g, '$x$,');

    // === FIX 9: Clean up double $$ artifacts ===
    content = content.replace(/\$\$([^$])/g, '$$$1');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}

console.log(`\n🔧 Second pass repaired ${totalFixes} files.`);
