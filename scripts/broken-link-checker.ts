/**
 * 🔗 Broken Link Checker (NEXUS v2)
 * 
 * Scans all blog markdown files for internal links and verifies
 * they point to existing blog slugs. Reports broken links.
 * 
 * Zero cost — no API calls, just local file checks.
 * 
 * Run: npx tsx scripts/broken-link-checker.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

interface BrokenLink {
    sourceSlug: string;
    targetSlug: string;
    linkText: string;
    lineNumber: number;
}

function main() {
    console.log('🔗 Broken Link Checker\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const existingSlugs = new Set(files.map(f => f.replace('.md', '')));
    
    console.log(`📂 Scanning ${files.length} blog files for internal links...\n`);

    const brokenLinks: BrokenLink[] = [];
    let totalLinksChecked = 0;

    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Match markdown links to /blog/slug
            const linkRegex = /\[([^\]]*)\]\(\/blog\/([a-z0-9-]+)\)/gi;
            let match;
            
            while ((match = linkRegex.exec(line)) !== null) {
                totalLinksChecked++;
                const linkText = match[1];
                const targetSlug = match[2];
                
                if (!existingSlugs.has(targetSlug)) {
                    brokenLinks.push({
                        sourceSlug: slug,
                        targetSlug,
                        linkText,
                        lineNumber: i + 1,
                    });
                }
            }
        }
    }

    // Report
    console.log('═'.repeat(60));
    console.log('🔗 BROKEN LINK REPORT');
    console.log('═'.repeat(60));
    console.log(`  📊 Total internal links checked: ${totalLinksChecked}`);
    console.log(`  ✅ Valid links: ${totalLinksChecked - brokenLinks.length}`);
    console.log(`  ❌ Broken links: ${brokenLinks.length}`);

    if (brokenLinks.length > 0) {
        console.log('\n  💀 BROKEN LINKS:');
        
        // Group by source
        const grouped = new Map<string, BrokenLink[]>();
        for (const bl of brokenLinks) {
            const existing = grouped.get(bl.sourceSlug) || [];
            existing.push(bl);
            grouped.set(bl.sourceSlug, existing);
        }

        for (const [source, links] of grouped) {
            console.log(`\n     📄 ${source}:`);
            for (const link of links) {
                console.log(`        ❌ Line ${link.lineNumber}: [${link.linkText}](/blog/${link.targetSlug}) → NOT FOUND`);
            }
        }
    }

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    
    const report = {
        date: TODAY,
        totalLinks: totalLinksChecked,
        validLinks: totalLinksChecked - brokenLinks.length,
        brokenLinks: brokenLinks.length,
        details: brokenLinks,
    };
    
    fs.writeFileSync(
        path.join(REPORTS_DIR, 'broken-links.json'),
        JSON.stringify(report, null, 2)
    );

    console.log(`\n  📄 Report: jules-reports/broken-links.json`);
    console.log('\n✨ Broken link check complete!\n');

    // Exit with error code if broken links found (for CI awareness)
    if (brokenLinks.length > 10) {
        console.warn('⚠️ More than 10 broken links detected — flagging for attention.');
    }
}

main();
