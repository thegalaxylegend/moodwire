/**
 * Targeted fix for the 8 orphaned blogs that still have multi-line JSON squashing.
 * The bulk repair script's FIX 6 only caught compact JSON, not multi-line format.
 * 
 * This script finds blocks like:
 * {
 *   "heading": "...",
 *   "body": "..."
 * }
 * 
 * And extracts the body content into clean markdown.
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const DRY_RUN = process.argv.includes('--dry-run');

const slugs = [
    'comparing-quantities-class-8-notes',
    'cubes-and-cube-roots-class-8-notes',
    'databases-dbms-class-12-notes',
    'linear-equations-in-one-variable-class-8-notes',
    'number-systems-class-9-notes',
    'physics-mechanics-class-11-revision-notes-jee-neet',
    'rational-numbers-class-8-notes',
    'theory-of-computation-class-12-notes'
];

function extractJsonSquashBlocks(content) {
    let body = content;
    let fixCount = 0;
    
    // Strategy: Find lines that start with { and contain "heading":
    // Then trace forward to find the matching closing }.
    // Extract "body" content and replace the whole block with clean markdown.
    
    // Pattern: Match the opening of JSON squash blocks
    // These appear as:
    //   {
    //    "heading": "...",
    //    "body": "
    //   ... content ...
    
    let searchFrom = 0;
    while (searchFrom < body.length) {
        // Find next line starting with {
        const openMatch = body.substring(searchFrom).match(/\n\s*\{\s*\r?\n\s*"heading"\s*:\s*"([^"]*?)"\s*,\s*\r?\n\s*"body"\s*:\s*"/);
        if (!openMatch) break;
        
        const blockStart = searchFrom + openMatch.index;
        const heading = openMatch[1];
        
        // Find the body content end: look for the closing pattern
        // The body content ends with something like:  "\n} or "} 
        // But the body itself may contain quotes, so we need to be careful.
        // Strategy: find the brace at depth 0 that closes this block
        const contentStart = blockStart + openMatch[0].length;
        
        // Walk forward from braceStart to find the matching }
        const braceStart = blockStart + body.substring(blockStart).indexOf('{');
        let depth = 0;
        let blockEnd = -1;
        for (let i = braceStart; i < body.length; i++) {
            if (body[i] === '{') depth++;
            if (body[i] === '}') {
                depth--;
                if (depth === 0) {
                    blockEnd = i + 1;
                    break;
                }
            }
        }
        
        if (blockEnd === -1) {
            // Can't find closing brace, skip
            searchFrom = contentStart;
            continue;
        }
        
        // Extract the full block
        const fullBlock = body.substring(blockStart, blockEnd);
        
        // Extract body content from the JSON
        // Everything between "body": " and the last "} before closing
        const bodyContentMatch = fullBlock.match(/"body"\s*:\s*"([\s\S]*)/);
        if (bodyContentMatch) {
            let bodyContent = bodyContentMatch[1];
            
            // Remove trailing JSON closure: find the last " followed by optional whitespace and }
            // The body content ends where the JSON value ends
            // Look for the last occurrence of "\n} or "}
            const lastQuoteBrace = bodyContent.lastIndexOf('"');
            if (lastQuoteBrace >= 0) {
                bodyContent = bodyContent.substring(0, lastQuoteBrace);
            }
            
            // Unescape JSON strings
            bodyContent = bodyContent
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
                .replace(/\\t/g, '\t');
            
            // Clean up
            bodyContent = bodyContent.trim();
            
            // Build replacement: just the extracted body content
            // The heading is usually already present as an ## H2 before the block
            const replacement = '\n\n' + bodyContent + '\n\n';
            
            body = body.substring(0, blockStart) + replacement + body.substring(blockEnd);
            fixCount++;
            
            // Continue search from where we just inserted
            searchFrom = blockStart + replacement.length;
        } else {
            searchFrom = blockEnd;
        }
    }
    
    // Clean up triple newlines
    body = body.replace(/\n{3,}/g, '\n\n');
    
    return { body, fixCount };
}

console.log('\n🔧 TARGETED JSON-SQUASH EXTRACTION');
console.log('Fixing 8 orphaned blog files...\n');

let totalFixed = 0;

for (const slug of slugs) {
    const filePath = path.join(BLOG_DIR, slug + '.md');
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ ${slug}: File not found`);
        continue;
    }
    
    const original = fs.readFileSync(filePath, 'utf-8');
    const { body, fixCount } = extractJsonSquashBlocks(original);
    
    if (fixCount > 0) {
        if (!DRY_RUN) {
            fs.writeFileSync(filePath, body, 'utf-8');
        }
        console.log(`✅ ${slug}: Extracted ${fixCount} JSON-squash blocks`);
        totalFixed += fixCount;
    } else {
        console.log(`⚠️ ${slug}: No JSON blocks found (may need manual check)`);
    }
}

console.log(`\n📊 Total blocks extracted: ${totalFixed}`);
if (DRY_RUN) console.log('🧪 DRY RUN — re-run without --dry-run to apply');

// Verify: re-check shield
console.log('\n🔍 Post-fix shield verification:');
const shieldRegex = /^\s*\{\s*"heading"\s*:\s*"[^"]*"\s*,\s*"body"\s*:/m;
for (const slug of slugs) {
    const filePath = path.join(BLOG_DIR, slug + '.md');
    const content = DRY_RUN ? fs.readFileSync(filePath, 'utf-8') : fs.readFileSync(filePath, 'utf-8');
    const blocked = content.includes('[object Object]') || shieldRegex.test(content);
    console.log(`  ${slug}: ${blocked ? '❌ STILL BLOCKED' : '✅ CLEAR'}`);
}
