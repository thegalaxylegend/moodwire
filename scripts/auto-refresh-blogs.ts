/**
 * 🔄 Content Freshness Auto-Updater (Feature 1.7)
 * 
 * Scans all 155+ blog markdown files and:
 * 1. Updates stale year references (2024 → 2026, 2025 → 2026)
 * 2. Updates "Last Updated" dates to today
 * 3. Detects blogs with outdated content patterns
 * 4. Flags blogs that need full content regeneration
 * 5. Outputs a freshness report
 * 
 * Run: npx tsx scripts/auto-refresh-blogs.ts
 * Dry run: npx tsx scripts/auto-refresh-blogs.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');

// Calculate target year: After August, target next year
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const TARGET_YEAR = currentMonth >= 7 ? currentYear + 1 : currentYear;
const TODAY = now.toISOString().split('T')[0];
const TODAY_DISPLAY = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Years that are considered stale (anything before target year)
const STALE_YEARS = Array.from({ length: 5 }, (_, i) => String(TARGET_YEAR - i - 1));

interface FreshnessResult {
    file: string;
    slug: string;
    status: 'fresh' | 'updated' | 'needs_regen';
    changes: string[];
    yearUpdates: number;
    lastUpdatedAge: number; // days since last update
    wordCount: number;
}

function getLastUpdatedAge(content: string): number {
    // Check frontmatter date
    const dateMatch = content.match(/date:\s*["']?([\d-]+|[A-Za-z]+ \d+, \d{4})["']?/);
    if (dateMatch) {
        const dateStr = dateMatch[1];
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            }
        } catch { /* ignore */ }
    }
    return 999; // Unknown = very stale
}

function getWordCount(content: string): number {
    // Strip frontmatter
    const body = content.replace(/^---[\s\S]*?---\n*/m, '');
    return body.split(/\s+/).filter(w => w.length > 0).length;
}

function refreshBlog(filePath: string, isDryRun: boolean): FreshnessResult {
    const fileName = path.basename(filePath);
    const slug = fileName.replace('.md', '');
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const changes: string[] = [];
    let yearUpdates = 0;

    const lastUpdatedAge = getLastUpdatedAge(content);
    const wordCount = getWordCount(content);

    // === RULE 1: Update stale years in title ===
    const titleMatch = content.match(/title:\s*["'](.+?)["']/);
    if (titleMatch) {
        const oldTitle = titleMatch[1];
        let newTitle = oldTitle;
        for (const staleYear of STALE_YEARS) {
            if (newTitle.includes(staleYear)) {
                newTitle = newTitle.replace(new RegExp(staleYear, 'g'), String(TARGET_YEAR));
                yearUpdates++;
            }
        }
        if (newTitle !== oldTitle) {
            content = content.replace(
                `title: "${oldTitle}"`,
                `title: "${newTitle}"`
            ).replace(
                `title: '${oldTitle}'`,
                `title: '${newTitle}'`
            );
            changes.push(`Title: "${oldTitle}" → "${newTitle}"`);
        }
    }

    // === RULE 2: Update stale years in description ===
    const descMatch = content.match(/description:\s*["'](.+?)["']/);
    if (descMatch) {
        const oldDesc = descMatch[1];
        let newDesc = oldDesc;
        for (const staleYear of STALE_YEARS) {
            if (newDesc.includes(staleYear)) {
                newDesc = newDesc.replace(new RegExp(staleYear, 'g'), String(TARGET_YEAR));
                yearUpdates++;
            }
        }
        if (newDesc !== oldDesc) {
            content = content.replace(
                `description: "${oldDesc}"`,
                `description: "${newDesc}"`
            ).replace(
                `description: '${oldDesc}'`,
                `description: '${newDesc}'`
            );
            changes.push(`Description year updated`);
        }
    }

    // === RULE 3: Update stale years in keywords ===
    const kwMatch = content.match(/keywords:\s*["'](.+?)["']/);
    if (kwMatch) {
        const oldKw = kwMatch[1];
        let newKw = oldKw;
        for (const staleYear of STALE_YEARS) {
            if (newKw.includes(staleYear)) {
                newKw = newKw.replace(new RegExp(staleYear, 'g'), String(TARGET_YEAR));
                yearUpdates++;
            }
        }
        if (newKw !== oldKw) {
            content = content.replace(
                `keywords: "${oldKw}"`,
                `keywords: "${newKw}"`
            ).replace(
                `keywords: '${oldKw}'`,
                `keywords: '${newKw}'`
            );
            changes.push(`Keywords year updated`);
        }
    }

    // === RULE 4: Update "Last Updated" in body ===
    const lastUpdatedMatch = content.match(/\*Last Updated:\s*(.+?)\*/);
    if (lastUpdatedMatch && lastUpdatedAge > 30) {
        const oldDate = lastUpdatedMatch[1];
        content = content.replace(
            `*Last Updated: ${oldDate}*`,
            `*Last Updated: ${TODAY_DISPLAY}*`
        );
        changes.push(`Last Updated: "${oldDate}" → "${TODAY_DISPLAY}"`);
    }

    // === RULE 5: Update frontmatter date if > 60 days old ===
    if (lastUpdatedAge > 60) {
        const dateMatch = content.match(/date:\s*["'](.+?)["']/);
        if (dateMatch) {
            const oldDate = dateMatch[1];
            content = content.replace(
                `date: "${oldDate}"`,
                `date: "${TODAY}"`
            ).replace(
                `date: '${oldDate}'`,
                `date: '${TODAY}'`
            );
            changes.push(`Frontmatter date: "${oldDate}" → "${TODAY}"`);
        }
    }

    // === RULE 6: Update stale years in body text ===
    // Only update years that appear in exam-related contexts
    // NEXUS v2: Protect LaTeX blocks from year replacement
    const bodyStart = content.indexOf('---', content.indexOf('---') + 3);
    if (bodyStart > 0) {
        let body = content.substring(bodyStart + 3);
        const originalBody = body;
        
        // Step 1: Extract and protect LaTeX blocks with placeholders
        const latexPlaceholders: string[] = [];
        // Protect display math $$...$$ first (greedy but safe — these are multi-line blocks)
        body = body.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
            latexPlaceholders.push(match);
            return `%%LATEX_BLOCK_${latexPlaceholders.length - 1}%%`;
        });
        // Protect inline math $...$
        body = body.replace(/\$[^$\n]+?\$/g, (match) => {
            latexPlaceholders.push(match);
            return `%%LATEX_BLOCK_${latexPlaceholders.length - 1}%%`;
        });
        // Protect code blocks ```...```
        body = body.replace(/```[\s\S]*?```/g, (match) => {
            latexPlaceholders.push(match);
            return `%%LATEX_BLOCK_${latexPlaceholders.length - 1}%%`;
        });
        
        // Step 2: Do year replacement on the protected body
        for (const staleYear of STALE_YEARS) {
            // Replace year in exam-context strings
            body = body.replace(
                new RegExp(`((?:JEE|NEET|CBSE|Board|Exam|Session|NTA|GATE|Revision|Guide|Syllabus|Preparation)\\s+(?:Mains?\\s+)?)${staleYear}`, 'gi'),
                `$1${TARGET_YEAR}`
            );
            body = body.replace(
                new RegExp(`${staleYear}(\\s+(?:JEE|NEET|CBSE|Board|Exam|Session|NTA|GATE|Revision|Guide|Syllabus|Preparation))`, 'gi'),
                `${TARGET_YEAR}$1`
            );
        }

        // Step 3: Restore LaTeX blocks from placeholders
        for (let i = latexPlaceholders.length - 1; i >= 0; i--) {
            body = body.replace(`%%LATEX_BLOCK_${i}%%`, latexPlaceholders[i]);
        }

        if (body !== originalBody) {
            content = content.substring(0, bodyStart + 3) + body;
            yearUpdates++;
            changes.push(`Body text year references updated (LaTeX-protected)`);
        }
    }

    // === DETERMINE STATUS ===
    let status: 'fresh' | 'updated' | 'needs_regen' = changes.length > 0 ? 'updated' : 'fresh';

    // Flag for regeneration if content is very thin
    if (wordCount < 500) {
        status = 'needs_regen';
        changes.push(`⚠️ Very thin content (${wordCount} words) — needs full regeneration`);
    }

    // Flag if extremely old (>180 days) and short
    if (lastUpdatedAge > 180 && wordCount < 2000) {
        status = 'needs_regen';
        changes.push(`⚠️ Stale content (${lastUpdatedAge} days old, ${wordCount} words)`);
    }

    // === WRITE CHANGES ===
    if (changes.length > 0 && content !== originalContent && !isDryRun) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }

    return {
        file: fileName,
        slug,
        status,
        changes,
        yearUpdates,
        lastUpdatedAge,
        wordCount
    };
}

async function main() {
    console.log(`\n🔄 Content Freshness Auto-Updater v1.0`);
    console.log(`📅 Target Year: ${TARGET_YEAR}`);
    console.log(`📅 Today: ${TODAY_DISPLAY}`);
    console.log(`🔍 Stale years to update: ${STALE_YEARS.join(', ')}\n`);

    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) console.log('🧪 DRY RUN MODE — No files will be modified.\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Scanning ${files.length} blog files...\n`);

    const results: FreshnessResult[] = [];

    for (const file of files) {
        const result = refreshBlog(path.join(BLOG_DIR, file), isDryRun);
        results.push(result);
        
        if (result.changes.length > 0) {
            const icon = result.status === 'needs_regen' ? '🚨' : '✅';
            console.log(`${icon} ${result.file}`);
            result.changes.forEach(c => console.log(`   └─ ${c}`));
        }
    }

    // === SUMMARY ===
    const fresh = results.filter(r => r.status === 'fresh').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const needsRegen = results.filter(r => r.status === 'needs_regen');

    console.log('\n' + '═'.repeat(60));
    console.log('📊 FRESHNESS REPORT');
    console.log('═'.repeat(60));
    console.log(`  ✅ Fresh (no changes needed): ${fresh}`);
    console.log(`  🔄 Updated (year/date fixed):  ${updated}`);
    console.log(`  🚨 Needs Regeneration:          ${needsRegen.length}`);
    console.log(`  📊 Total blogs scanned:         ${results.length}`);
    
    const totalYearUpdates = results.reduce((acc, r) => acc + r.yearUpdates, 0);
    console.log(`  📅 Total year references fixed: ${totalYearUpdates}`);

    if (needsRegen.length > 0) {
        console.log('\n🚨 Blogs needing regeneration:');
        needsRegen.forEach(r => {
            console.log(`   - ${r.slug} (${r.wordCount} words, ${r.lastUpdatedAge} days old)`);
        });
    }

    // === SAVE REPORT ===
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, `freshness-${TODAY}.json`);
    const report = {
        date: TODAY,
        targetYear: TARGET_YEAR,
        summary: { fresh, updated, needsRegen: needsRegen.length, total: results.length },
        needsRegeneration: needsRegen.map(r => r.slug),
        details: results.filter(r => r.changes.length > 0)
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    // === OUTPUT REGEN QUEUE (for pipeline integration) ===
    if (needsRegen.length > 0) {
        const regenQueue = needsRegen.map(r => ({
            slug: r.slug,
            reason: r.changes.filter(c => c.startsWith('⚠️')).join('; '),
            wordCount: r.wordCount,
            ageInDays: r.lastUpdatedAge
        })).slice(0, 6); // Hard limit to refine exactly 6 old blogs per day
        const regenQueuePath = path.join(REPORTS_DIR, `regen-queue-${TODAY}.json`);
        fs.writeFileSync(regenQueuePath, JSON.stringify(regenQueue, null, 2));
        console.log(`📋 Regen queue saved: ${regenQueuePath}`);
    }

    console.log('\n✨ Freshness check complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
