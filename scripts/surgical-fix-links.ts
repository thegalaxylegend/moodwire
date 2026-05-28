import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function fixNestedLinks(content: string): { newContent: string; fixesCount: number } {
    // Regex matching [word](/blog/slug) nested inside relative urls like (/practice/... or (/class-...
    const regex = /(\(\/(?:practice|class-\d+|blog)\/[^)]*?)\[([A-Za-z0-9\s-]+)\]\(\/blog\/[a-z0-9-]+\)([^)]*?\))/i;
    let newContent = content;
    let fixesCount = 0;

    while (regex.test(newContent)) {
        newContent = newContent.replace(regex, '$1$2$3');
        fixesCount++;
    }

    return { newContent, fixesCount };
}

function fixMathExpressions(content: string): { newContent: string; mathFixesCount: number } {
    let newContent = content;
    let mathFixesCount = 0;

    // Specifically target binomial theorem formula pseudo-links
    // e.g. [5(4)/2!](2)² -> $[5(4)/2!](2)^2$
    // e.g. [5(4)(3)/3!](2)³ -> $[5(4)(3)/3!](2)^3$
    // e.g. [5(4)(3)(2)/4!](2)⁴ -> $[5(4)(3)(2)/4!](2)^4$
    
    const mathReplacements = [
        {
            target: '[5(4)/2!](2)²',
            replacement: '$[5(4)/2!](2)^2$'
        },
        {
            target: '[5(4)(3)/3!](2)³',
            replacement: '$[5(4)(3)/3!](2)^3$'
        },
        {
            target: '[5(4)(3)(2)/4!](2)⁴',
            replacement: '$[5(4)(3)(2)/4!](2)^4$'
        }
    ];

    for (const r of mathReplacements) {
        if (newContent.includes(r.target)) {
            newContent = newContent.replaceAll(r.target, r.replacement);
            mathFixesCount++;
        }
    }

    return { newContent, mathFixesCount };
}

async function main() {
    console.log('🚀 Starting Surgical Link Repair Script...');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Found ${files.length} markdown blog files.`);

    let totalNestedFixes = 0;
    let totalMathFixes = 0;
    let modifiedFilesCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const originalContent = fs.readFileSync(filePath, 'utf-8');

        const { newContent: contentAfterNested, fixesCount } = fixNestedLinks(originalContent);
        const { newContent: finalContent, mathFixesCount } = fixMathExpressions(contentAfterNested);

        if (fixesCount > 0 || mathFixesCount > 0) {
            fs.writeFileSync(filePath, finalContent, 'utf-8');
            console.log(`✅ Fixed: ${file} (Nested links: ${fixesCount}, Math: ${mathFixesCount})`);
            totalNestedFixes += fixesCount;
            totalMathFixes += mathFixesCount;
            modifiedFilesCount++;
        }
    }

    console.log('\n=======================================');
    console.log('📊 SURGICAL LINK REPAIR COMPLETE');
    console.log('=======================================');
    console.log(`📁 Modified Files:      ${modifiedFilesCount}`);
    console.log(`🔗 Nested Link Fixes:    ${totalNestedFixes}`);
    console.log(`🧮 Math Formula Fixes:   ${totalMathFixes}`);
    console.log('=======================================\n');
}

main().catch(err => {
    console.error('❌ Error during surgical repair:', err);
});
