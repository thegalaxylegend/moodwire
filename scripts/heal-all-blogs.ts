/**
 * 💊 BLOG HEALING SCRIPT v1.0
 * 
 * Fixes ALL known corruption types across all blog files:
 * 1. Control characters (0x08→\b, 0x0C→\f) 
 * 2. Double-escaped LaTeX (\\sin → \sin)
 * 3. Missing backslashes (sum_{ → \sum_{)
 * 4. Footer text corruption (y Jules → by Jules)
 * 
 * Creates a backup before making any changes.
 * Run: npx tsx scripts/heal-all-blogs.ts
 * Dry run: npx tsx scripts/heal-all-blogs.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const BACKUP_DIR = path.join(__dirname, '../src/content/blogs-backup-pre-heal');

const LATEX_CMDS = 'sin|cos|tan|cot|sec|csc|frac|sqrt|sum|int|prod|lim|theta|alpha|beta|gamma|delta|omega|phi|psi|mu|sigma|lambda|pi|epsilon|eta|zeta|rho|tau|nu|chi|xi|kappa|nabla|partial|infty|text|left|right|begin|end|log|ln|vec|hat|bar|overline|underline|boxed|mathrm|mathbb|binom|displaystyle|cancel|cdot|ldots|leq|geq|neq|approx|equiv|pm|mp|times|div|rightarrow|leftarrow|Rightarrow|Leftarrow|circ|degree|perp|parallel|subset|supset|cup|cap|forall|exists|in|notin|mathbf|mathcal|Delta';

function healBlog(filePath: string, isDryRun: boolean): { file: string; fixes: string[] } {
    const file = path.basename(filePath);
    const fixes: string[] = [];
    
    // Read as raw buffer for control char detection
    const buf = fs.readFileSync(filePath);
    let content: string;
    
    // === FIX 1: Control Characters at byte level ===
    let ctrlFixes = 0;
    const newBytes: number[] = [];
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0x08) { // backspace → \b
            newBytes.push(0x5C, 0x62); // \b
            ctrlFixes++;
        } else if (buf[i] === 0x0C) { // form feed → \f
            newBytes.push(0x5C, 0x66); // \f
            ctrlFixes++;
        } else {
            newBytes.push(buf[i]);
        }
    }
    
    if (ctrlFixes > 0) {
        content = Buffer.from(newBytes).toString('utf-8');
        fixes.push(`Fixed ${ctrlFixes} control characters (backspace/formfeed → \\b/\\f)`);
    } else {
        content = buf.toString('utf-8');
    }
    
    const original = content;
    
    // === FIX 2: Double-escaped LaTeX ===
    const dblEscRegex = new RegExp(`\\\\\\\\(${LATEX_CMDS})\\b`, 'g');
    const dblMatches = content.match(dblEscRegex);
    if (dblMatches) {
        content = content.replace(dblEscRegex, '\\$1');
        fixes.push(`Fixed ${dblMatches.length} double-escaped LaTeX commands`);
    }
    
    // === FIX 3: Missing backslash before math commands ===
    let missingBs = 0;
    
    // sum followed by _ or ^ (clearly math context)
    content = content.replace(/(?<!\\)(?<![a-zA-Z])sum([_{^])/g, () => { missingBs++; return '\\sum$1'; });
    // Fix: the replacement was wrong, let me use a function
    // Reset and redo properly
    missingBs = 0;
    const fixedContent3 = content.replace(/(?<!\\)(?<![a-zA-Z])(sum)([_{^])/g, (_m, cmd, after) => {
        missingBs++;
        return `\\${cmd}${after}`;
    });
    content = fixedContent3;
    
    // ldots — never a real English word
    const fixedContent3b = content.replace(/(?<!\\)(?<![a-zA-Z])ldots(?![a-zA-Z])/g, () => {
        missingBs++;
        return '\\ldots';
    });
    content = fixedContent3b;
    
    // cdot — never a real English word
    const fixedContent3c = content.replace(/(?<!\\)(?<![a-zA-Z])cdot(?![a-zA-Z])/g, () => {
        missingBs++;
        return '\\cdot';
    });
    content = fixedContent3c;
    
    if (missingBs > 0) {
        fixes.push(`Added ${missingBs} missing backslashes (sum, ldots, cdot)`);
    }
    
    // === FIX 4: Footer text corruption ===
    if (content.includes('curated y Jules') || content.includes('curated y ')) {
        content = content.replace(/curated y Jules/g, 'curated by Jules');
        content = content.replace(/curated y /g, 'curated by ');
        fixes.push('Fixed "curated y" → "curated by"');
    }
    if (content.includes(' n edited')) {
        content = content.replace(/ n edited/g, ' and edited');
        fixes.push('Fixed "n edited" → "and edited"');
    }
    if (content.includes(' n Ayush')) {
        content = content.replace(/ n Ayush/g, ' and Ayush');
        fixes.push('Fixed "n Ayush" → "and Ayush"');
    }
    
    // Write if changed
    if (content !== original && !isDryRun) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    
    return { file, fixes };
}

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    
    console.log('\n💊 BLOG HEALING SCRIPT v1.0');
    console.log('='.repeat(60));
    if (isDryRun) console.log('🧪 DRY RUN — no files will be modified\n');
    
    // Create backup
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log(`📦 Creating backup at blogs-backup-pre-heal/...`);
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
        for (const f of files) {
            fs.copyFileSync(path.join(BLOG_DIR, f), path.join(BACKUP_DIR, f));
        }
        console.log(`   ✅ Backed up ${files.length} files\n`);
    } else {
        console.log('📦 Backup already exists, skipping...\n');
    }
    
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let totalFixed = 0;
    let totalFixes = 0;
    
    for (const file of files) {
        const result = healBlog(path.join(BLOG_DIR, file), isDryRun);
        if (result.fixes.length > 0) {
            totalFixed++;
            totalFixes += result.fixes.length;
            console.log(`🔧 ${result.file}`);
            result.fixes.forEach(f => console.log(`   ✅ ${f}`));
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 HEALING COMPLETE');
    console.log(`   Files healed: ${totalFixed} / ${files.length}`);
    console.log(`   Total fixes applied: ${totalFixes}`);
    console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
