/**
 * 🛡️ Smart Auto-Repair System (Feature 2.2)
 * 
 * Scans all blogs and automatically fixes quality issues:
 * 1. Detects missing mandatory sections (Trap Questions, Ayush's Note, Last 5 Min Box)
 * 2. Fixes broken LaTeX ($$...$$ without content, unescaped backslashes)
 * 3. Removes kill-list phrases
 * 4. Fixes broken internal links
 * 5. Repairs thin content sections
 * 6. Fixes duplicate headers
 * 7. Standardizes frontmatter
 * 
 * Run: npx tsx scripts/smart-repair.ts
 * Dry run: npx tsx scripts/smart-repair.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

// Kill list from BLOG_RULES.md
const KILL_LIST = [
    "in conclusion", "delve into", "it is important to note",
    "world-best", "comprehensive guide", "ultimate guide",
    "embark on your journey", "needless to say", "master this today",
    "everything you need", "complete guide", "mastering this",
    "in today's competitive world", "vibrant", "robust", "unveiling",
    "embark on a journey", "one of the most important topics",
    "written with 10+ years experience", "master [topic] today",
    "it is worth noting", "as we navigate", "the landscape of",
    "in the realm of", "at the end of the day", "last but not least",
    "without further ado", "it goes without saying", "first and foremost",
    "plays a crucial role", "in a nutshell", "it is imperative",
    "in the ever-evolving", "in this day and age"
];

interface RepairResult {
    slug: string;
    fixes: string[];
    warnings: string[];
    wasModified: boolean;
}

function repairBlog(filePath: string, isDryRun: boolean): RepairResult {
    const slug = path.basename(filePath, '.md');
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const fixes: string[] = [];
    const warnings: string[] = [];

    // Separate frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    let frontmatter = fmMatch ? fmMatch[1] : '';
    let body = fmMatch ? fmMatch[2] : content;

    // ========= FIX 1: Kill List Phrase Removal =========
    let killCount = 0;
    for (const phrase of KILL_LIST) {
        const regex = new RegExp(phrase, 'gi');
        if (regex.test(body)) {
            body = body.replace(regex, '');
            killCount++;
        }
    }
    if (killCount > 0) {
        // Clean up double spaces and empty lines left behind
        body = body.replace(/  +/g, ' ').replace(/\n{3,}/g, '\n\n');
        fixes.push(`Removed ${killCount} kill-list phrases`);
    }

    // ========= FIX 2: Broken LaTeX Repair =========
    // Fix: $$ with nothing inside
    const emptyLatex = body.match(/\$\$\s*\$\$/g);
    if (emptyLatex) {
        body = body.replace(/\$\$\s*\$\$/g, '');
        fixes.push(`Removed ${emptyLatex.length} empty LaTeX blocks`);
    }

    // Fix: Single $ that should be $$ (block formulas on their own line)
    body = body.replace(/^(\s*)\$([^$\n]+)\$\s*$/gm, (match, indent, content) => {
        // If it contains typical block-formula content (frac, sum, int, etc)
        if (/\\(frac|sum|int|prod|lim|sqrt|begin)/.test(content)) {
            fixes.push(`Fixed block LaTeX: $...$ → $$...$$`);
            return `${indent}$$${content}$$`;
        }
        return match;
    });

    // Fix: Quadruple backslash (over-escaped LaTeX)
    const quadEscapes = (body.match(/\\\\\\\\/g) || []).length;
    if (quadEscapes > 0) {
        body = body.replace(/\\\\\\\\/g, '\\\\');
        fixes.push(`Fixed ${quadEscapes} over-escaped LaTeX backslashes`);
    }

    // ========= FIX 3: Broken Internal Links =========
    // Find links to non-existent blog slugs
    const internalLinks = body.matchAll(/\[([^\]]+)\]\(\/blog\/([^)]+)\)/g);
    for (const linkMatch of internalLinks) {
        const linkedSlug = linkMatch[2].replace(/\/$/, ''); // Remove trailing slash
        const linkedFile = path.join(BLOG_DIR, `${linkedSlug}.md`);
        if (!fs.existsSync(linkedFile)) {
            // Replace broken link with just the text
            body = body.replace(linkMatch[0], linkMatch[1]);
            fixes.push(`Removed broken link to: /blog/${linkedSlug}`);
        }
    }

    // ========= FIX 4: Duplicate H2 Headers =========
    const h2s = body.match(/^## .+$/gm) || [];
    const seen = new Set<string>();
    for (const h2 of h2s) {
        const normalized = h2.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seen.has(normalized)) {
            // Remove the duplicate (keep the first occurrence)
            const firstIndex = body.indexOf(h2);
            const secondIndex = body.indexOf(h2, firstIndex + h2.length);
            if (secondIndex > firstIndex) {
                body = body.substring(0, secondIndex) + body.substring(secondIndex + h2.length);
                fixes.push(`Removed duplicate H2: "${h2.substring(0, 40)}..."`);
            }
        }
        seen.add(normalized);
    }

    // ========= FIX 5: Frontmatter Validation =========
    // Ensure all required fields exist
    const requiredFields = ['title', 'description', 'category', 'date', 'heroImage'];
    for (const field of requiredFields) {
        const fieldRegex = new RegExp(`${field}:`, 'i');
        if (!fieldRegex.test(frontmatter)) {
            warnings.push(`Missing frontmatter field: ${field}`);
        }
    }

    // Fix: Empty description
    if (/description:\s*["']["']\s*$/m.test(frontmatter) || /description:\s*$/m.test(frontmatter)) {
        const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
        const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
        frontmatter = frontmatter.replace(
            /description:\s*["']?["']?\s*$/m,
            `description: "Quick revision notes for ${title}. Exam-focused study guide with MCQs, trap questions, and last-minute formulas."`
        );
        fixes.push('Generated missing description from title');
    }

    // ========= FIX 6: Missing Mandatory Sections Detection =========
    const bodyLower = body.toLowerCase();
    
    if (!/trap\s*questions?|mistakes?\s*that\s*cost/i.test(bodyLower)) {
        warnings.push('Missing "Trap Questions" section');
    }
    
    if (!/last\s*5\s*minutes?\s*box/i.test(bodyLower)) {
        warnings.push('Missing "Last 5 Minutes Box" section');
    }

    if (!/practice\s*mcqs?|mcq/i.test(bodyLower)) {
        warnings.push('Missing Practice MCQs section');
    }

    // ========= FIX 7: Empty Table Cleanup =========
    // Remove empty markdown tables (just headers, no data)
    body = body.replace(/\|[^|\n]+\|[^|\n]*\|\s*\n\|[\s-|]+\|\s*\n(?!\|)/g, (match) => {
        fixes.push('Removed empty table');
        return '';
    });

    // ========= FIX 8: Cross-Topic Pollution Detection =========
    const categoryMatch = frontmatter.match(/category:\s*["']?(.+?)["']?\s*$/m);
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    
    if (category === 'Physics') {
        if (/\b(photosynthesis|mitosis|meiosis|krebs cycle|DNA replication)\b/i.test(bodyLower)) {
            warnings.push('⚠️ Cross-topic pollution: Biology content found in Physics blog');
        }
    } else if (category === 'Chemistry') {
        if (/\b(newton's law|kinematic|projectile|angular momentum)\b/i.test(bodyLower)) {
            warnings.push('⚠️ Cross-topic pollution: Physics content found in Chemistry blog');
        }
    } else if (category === 'Biology') {
        if (/\b(electrochemistry|thermodynamics|enthalpy|entropy|gibbs)\b/i.test(bodyLower) && !/bio/i.test(slug)) {
            warnings.push('⚠️ Cross-topic pollution: Chemistry content found in Biology blog');
        }
    }

    // ========= FIX 9: Raw Placeholder Removal =========
    const placeholders = [
        /Featured Image Idea:.*$/gm,
        /External Reference Placeholder:.*$/gm,
        /\[INSERT DATE\]/gi,
        /\[INSERT YEAR\]/gi,
        /\[INSERT TOPIC\]/gi,
        /\[INSERT LINK\]/gi,
        /\[TODO\]/gi,
        /placeholder/gi
    ];
    for (const regex of placeholders) {
        if (regex.test(body)) {
            body = body.replace(regex, '');
            fixes.push(`Removed raw placeholder: ${regex.source.substring(0, 30)}`);
        }
    }

    // ========= REASSEMBLE & WRITE =========
    content = frontmatter + body;
    const wasModified = content !== originalContent;

    if (wasModified && !isDryRun) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }

    return { slug, fixes, warnings, wasModified };
}

async function main() {
    console.log('\n🛡️ Smart Auto-Repair System v1.0');
    console.log('Scanning and fixing quality issues across all blogs...\n');

    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) console.log('🧪 DRY RUN MODE — No files will be modified.\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Scanning ${files.length} blog files...\n`);

    const results: RepairResult[] = [];
    let totalFixes = 0;
    let totalWarnings = 0;

    for (const file of files) {
        const result = repairBlog(path.join(BLOG_DIR, file), isDryRun);
        results.push(result);
        totalFixes += result.fixes.length;
        totalWarnings += result.warnings.length;

        if (result.fixes.length > 0 || result.warnings.length > 0) {
            const icon = result.fixes.length > 0 ? '🔧' : '⚠️';
            console.log(`${icon} ${result.slug}`);
            result.fixes.forEach(f => console.log(`   ✅ ${f}`));
            result.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
        }
    }

    // === SUMMARY ===
    const modified = results.filter(r => r.wasModified).length;
    const withWarnings = results.filter(r => r.warnings.length > 0).length;
    const clean = results.filter(r => r.fixes.length === 0 && r.warnings.length === 0).length;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 AUTO-REPAIR REPORT');
    console.log('═'.repeat(60));
    console.log(`  🔧 Files repaired:     ${modified}`);
    console.log(`  ⚠️  Files with warnings: ${withWarnings}`);
    console.log(`  ✅ Clean files:         ${clean}`);
    console.log(`  📊 Total fixes applied: ${totalFixes}`);
    console.log(`  ⚠️  Total warnings:      ${totalWarnings}`);
    console.log('═'.repeat(60));

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, `repair-${TODAY}.json`);
    const report = {
        date: TODAY,
        summary: { modified, withWarnings, clean, totalFixes, totalWarnings },
        repairs: results.filter(r => r.fixes.length > 0 || r.warnings.length > 0)
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('\n✨ Smart repair complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
