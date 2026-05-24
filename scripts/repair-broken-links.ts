/**
 * 🛠️ Internal Link Repair Bot (NEXUS v2.1)
 * 
 * Aggressively repairs broken internal links caused by inconsistent slugification
 * (e.g., "-n-" instead of "-and-"). Uses fuzzy matching to restore integrity.
 * 
 * Run: npx tsx scripts/repair-broken-links.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fuzzyMatchSlug } from './utils/slug-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

async function main() {
    console.log('🤖 Starting Internal Link Repair Bot...\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const existingSlugs = new Set(files.map(f => f.replace('.md', '')));
    
    console.log(`📂 Scanning ${files.length} blogs for broken links...`);

    let totalRepairs = 0;
    let filesModified = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        let fileChanges = 0;

        // Pattern: [text](/blog/mangled-slug)
        const linkRegex = /\[([^\]]*)\]\(\/blog\/([a-z0-9-]+)\)/gi;
        
        const newContent = content.replace(linkRegex, (match, text, targetSlug) => {
            if (existingSlugs.has(targetSlug)) return match; // Already correct

            const repairedSlug = fuzzyMatchSlug(targetSlug, existingSlugs);
            if (repairedSlug && repairedSlug !== targetSlug) {
                console.log(`  🔧 Repair: ${file} | [${text}](${targetSlug}) -> /blog/${repairedSlug}`);
                fileChanges++;
                totalRepairs++;
                return `[${text}](/blog/${repairedSlug})`;
            }

            return match; // Could not repair
        });

        if (fileChanges > 0) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
            filesModified++;
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 REPAIR SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  🔧 Total links repaired:   ${totalRepairs}`);
    console.log(`  📄 Files modified:         ${filesModified}`);
    console.log(`  📊 Total blogs scanned:    ${files.length}`);
    console.log('═'.repeat(60));

    if (totalRepairs > 0) {
        console.log('\n✨ Link integrity restored! Now running sync to update registry...');
    } else {
        console.log('\n✅ No repairable broken links found.');
    }
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
