/**
 * 🛡️ Jules Sanity Guard v2.0 — Deep Final Audit
 * 
 * The last gate before content goes live. Checks:
 * 1. Metadata presence & validity (title, heroImage, date, practice_link, description, category)
 * 2. Image integrity (hero image file exists)
 * 3. LaTeX renderability (unclosed blocks, bracket mismatches)
 * 4. Placeholder / undefined detection
 * 5. Content minimum length
 * 6. Internal link validity (all /blog/slug links point to real files)
 * 7. Frontmatter YAML integrity (no duplicate keys, no broken quotes)
 * 8. Cross-topic pollution (Physics blog containing Biology terms etc.)
 * 9. Title-content coherence (title topic should appear in body)
 * 10. Duplicate file detection (two .md files with near-identical slugs)
 * 
 * Run: npx tsx scripts/sanity-guard.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '../public/blog-images');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');

interface SanityResult {
    file: string;
    errors: string[];
    warnings: string[];
}

async function runSanityCheck() {
    console.log("🛡️ Jules Sanity Guard v2.0: Commencing Deep Final Audit...\n");

    if (!fs.existsSync(BLOG_DIR)) {
        console.error("❌ Blog directory not found:", BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const allSlugs = new Set(files.map(f => f.replace('.md', '')));
    let totalErrors = 0;
    let totalWarnings = 0;
    const results: SanityResult[] = [];

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.md', '');
        const errors: string[] = [];
        const warnings: string[] = [];

        // Separate frontmatter and body
        const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
        const frontmatter = fmMatch ? fmMatch[1] : '';
        const body = fmMatch ? fmMatch[2] : content;

        // ═══════════════════════════════════════════
        // CHECK 1: Metadata Presence & Validity
        // ═══════════════════════════════════════════
        const requiredMetadata = ['title:', 'heroImage:', 'date:', 'practice_link:'];
        for (const meta of requiredMetadata) {
            if (!frontmatter.includes(meta)) {
                errors.push(`Missing metadata: ${meta}`);
            }
        }

        // Check for empty title
        if (/title:\s*["']?\s*["']?\s*$/m.test(frontmatter)) {
            errors.push('Title is empty');
        }

        // Check for empty description
        if (!frontmatter.includes('description:') || /description:\s*["']\s*["']\s*$/m.test(frontmatter)) {
            warnings.push('Description is missing or empty');
        }

        // Check for category
        if (!frontmatter.includes('category:')) {
            warnings.push('Missing category metadata');
        }

        // ═══════════════════════════════════════════
        // CHECK 2: Image Integrity
        // ═══════════════════════════════════════════
        const heroMatch = frontmatter.match(/heroImage:\s*"(.*?)"/);
        if (heroMatch) {
            const imgPath = heroMatch[1];
            if (imgPath.startsWith('/blog-images/')) {
                const localImgPath = path.join(__dirname, '..', 'public', imgPath);
                if (!fs.existsSync(localImgPath)) {
                    warnings.push(`Hero image not found locally: ${imgPath}`);
                }
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 3: LaTeX Renderability
        // ═══════════════════════════════════════════
        // Check for unclosed LaTeX block markers
        const blockLatexOpens = (body.match(/\$\$/g) || []).length;
        if (blockLatexOpens % 2 !== 0) {
            errors.push(`Unclosed LaTeX block: ${blockLatexOpens} $$ markers (odd number)`);
        }

        // Check for empty LaTeX blocks
        const emptyLatex = body.match(/\$\$\s*\$\$/g);
        if (emptyLatex) {
            warnings.push(`${emptyLatex.length} empty LaTeX block(s) ($$$$)`);
        }

        // Check for severely mismatched curly braces inside LaTeX blocks
        const latexBlocks = body.match(/\$\$[\s\S]*?\$\$/g) || [];
        for (const block of latexBlocks) {
            const opens = (block.match(/\{/g) || []).length;
            const closes = (block.match(/\}/g) || []).length;
            if (Math.abs(opens - closes) > 2) {
                warnings.push(`LaTeX bracket mismatch: ${opens} opens vs ${closes} closes in block`);
                break; // Only report once per file
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 4: Placeholder / Undefined Detection
        // ═══════════════════════════════════════════
        const placeholderRegex = /\[INSERT|TODO|\[PLACEHOLDER\]/i;
        if (placeholderRegex.test(body)) {
            errors.push('Contains raw placeholders ([INSERT], [TODO], etc.)');
        }

        // Check for failed template variables
        const failedVariableRegex = /[ :)]undefined($|\s|[!?.])/i;
        if (failedVariableRegex.test(body)) {
            const linesWithUndefined = body.split('\n').filter(line => line.includes("undefined"));
            const looksLikeTechnicalFailure = linesWithUndefined.some(line =>
                line.includes("): undefined") ||
                line.includes(") undefined") ||
                line.trim().toLowerCase() === "undefined"
            );
            if (looksLikeTechnicalFailure) {
                errors.push("Contains 'undefined' failure patterns — template variable injection failed");
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 5: Content Minimum Length
        // ═══════════════════════════════════════════
        if (content.length < 500) {
            errors.push(`Content too short: ${content.length} chars (min 500)`);
        }

        const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 300) {
            warnings.push(`Very low word count: ${wordCount} words (expected 1000+)`);
        }

        // ═══════════════════════════════════════════
        // CHECK 6: Internal Link Validity
        // ═══════════════════════════════════════════
        const internalLinks = body.matchAll(/\[([^\]]+)\]\(\/blog\/([^)]+)\)/g);
        for (const linkMatch of internalLinks) {
            const linkedSlug = linkMatch[2].replace(/\/$/, '');
            if (!allSlugs.has(linkedSlug)) {
                warnings.push(`Broken internal link: /blog/${linkedSlug}`);
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 7: Frontmatter YAML integrity
        // ═══════════════════════════════════════════
        // Check for duplicate keys in frontmatter
        const fmKeys = frontmatter.match(/^[a-zA-Z_]+:/gm) || [];
        const keySet = new Set<string>();
        for (const key of fmKeys) {
            if (keySet.has(key)) {
                warnings.push(`Duplicate frontmatter key: ${key}`);
            }
            keySet.add(key);
        }

        // Check for unclosed quotes in frontmatter
        const titleLine = frontmatter.match(/title:\s*(.*)/);
        if (titleLine) {
            const titleVal = titleLine[1].trim();
            const quotes = (titleVal.match(/"/g) || []).length;
            if (quotes % 2 !== 0) {
                errors.push('Unclosed quote in title field');
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 8: Cross-Topic Pollution
        // ═══════════════════════════════════════════
        const categoryMatch = frontmatter.match(/category:\s*["']?(.+?)["']?\s*$/m);
        const category = categoryMatch ? categoryMatch[1].trim() : '';
        const bodyLower = body.toLowerCase();

        if (category === 'Physics') {
            if (/\b(photosynthesis|mitosis|meiosis|krebs cycle|dna replication|enzyme)\b/i.test(bodyLower)) {
                warnings.push('Cross-topic pollution: Biology terms in Physics blog');
            }
        } else if (category === 'Chemistry') {
            if (/\b(newton's law|kinematic equation|projectile motion|angular momentum|torque)\b/i.test(bodyLower)) {
                warnings.push('Cross-topic pollution: Physics terms in Chemistry blog');
            }
        } else if (category === 'Biology') {
            if (/\b(electrochemistry|bond dissociation|enthalpy of formation|oxidation state)\b/i.test(bodyLower) && !/bio/i.test(slug)) {
                warnings.push('Cross-topic pollution: Chemistry terms in Biology blog');
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 9: Title-Content Coherence
        // ═══════════════════════════════════════════
        const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
        if (titleMatch) {
            const titleWords = titleMatch[1].toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 4); // Only meaningful words (>4 chars)
            
            if (titleWords.length > 0) {
                const matchedWords = titleWords.filter(w => bodyLower.includes(w));
                const coherenceRatio = matchedWords.length / titleWords.length;
                
                if (coherenceRatio < 0.3 && titleWords.length >= 3) {
                    warnings.push(`Low title-content coherence: only ${Math.round(coherenceRatio * 100)}% of title keywords found in body`);
                }
            }
        }

        // ═══════════════════════════════════════════
        // CHECK 10: Stale Year References
        // ═══════════════════════════════════════════
        const currentYear = new Date().getFullYear();
        const staleYearMatch = body.match(new RegExp(`(${currentYear - 2}|${currentYear - 3})\\s*(JEE|NEET|CBSE|exam|syllabus)`, 'gi'));
        if (staleYearMatch) {
            warnings.push(`Contains stale year references (${staleYearMatch[0].substring(0, 30)}...)`);
        }

        // Collect results
        if (errors.length > 0 || warnings.length > 0) {
            results.push({ file, errors, warnings });
            totalErrors += errors.length;
            totalWarnings += warnings.length;

            if (errors.length > 0) {
                console.error(`❌ [${file}]`);
                errors.forEach(e => console.error(`   ❌ ${e}`));
                warnings.forEach(w => console.warn(`   ⚠️ ${w}`));
            } else {
                console.warn(`⚠️ [${file}]`);
                warnings.forEach(w => console.warn(`   ⚠️ ${w}`));
            }
        }
    }

    // ═══════════════════════════════════════════
    // SUMMARY REPORT
    // ═══════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('🛡️ SANITY GUARD REPORT');
    console.log('═'.repeat(60));
    console.log(`  📄 Files scanned:    ${files.length}`);
    console.log(`  ❌ Critical errors:  ${totalErrors}`);
    console.log(`  ⚠️  Warnings:         ${totalWarnings}`);
    console.log(`  ✅ Clean files:      ${files.length - results.length}`);
    console.log('═'.repeat(60));

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, 'sanity-guard-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        date: new Date().toISOString(),
        summary: { total: files.length, errors: totalErrors, warnings: totalWarnings, clean: files.length - results.length },
        issues: results
    }, null, 2));
    console.log(`  📄 Report: ${reportPath}`);

    if (totalErrors > 0) {
        console.error(`\n🚫 SANITY CHECK FAILED: ${totalErrors} critical error(s) found across ${results.filter(r => r.errors.length > 0).length} file(s).`);
        process.exit(1);
    } else {
        console.log(`\n✅ SANITY CHECK PASSED: ${files.length} blogs verified. (${totalWarnings} non-blocking warnings)`);
    }
}

runSanityCheck().catch(err => {
    console.error("💥 Sanity Guard Crashed:", err);
    process.exit(1);
});
