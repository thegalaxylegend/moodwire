import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function cleanupSurgical(filePath: string, dryRun: boolean = true) {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // 1. Parse Frontmatter
    const fmMatch = rawContent.match(/^---([\s\S]*?)---/);
    if (!fmMatch) return;
    
    const frontmatter = fmMatch[1];
    let body = rawContent.slice(fmMatch[0].length).trimStart();
    
    const heroImageMatch = frontmatter.match(/heroImage:\s*["']?([^"'\n]+)["']?/);
    const heroImage = heroImageMatch ? heroImageMatch[1].trim() : '';
    
    if (!heroImage) return;

    // 2. Look for leading image in the body
    const leadingImageRegex = /^(!\[.*?\]\((.*?)\)\s*\n*)/;
    const bodyImageMatch = body.match(leadingImageRegex);
    
    if (bodyImageMatch) {
        const fullTag = bodyImageMatch[1];
        const imageUrl = bodyImageMatch[2].trim();
        
        // Safety Checks
        const isExactMatch = imageUrl === heroImage;
        const isSlugMatch = imageUrl.includes(fileName.replace('.md', ''));
        const isPlaceholder = imageUrl.includes('unsplash.com') || imageUrl.includes('placeholder');
        
        if (isExactMatch || isSlugMatch || isPlaceholder) {
            console.log(`[FIX] Removing redundant image from ${fileName}: ${imageUrl}`);
            
            if (!dryRun) {
                const newBody = body.slice(fullTag.length).trimStart();
                const newContent = `---${frontmatter}---` + '\n\n' + newBody;
                fs.writeFileSync(filePath, newContent);
            }
            return true;
        }
    }
    
    // 3. Look for duplicate "Related Topics" or "Table of Contents" at the very end
    const relatedTopicsCount = (body.match(/## 📚 Related Topics/g) || []).length;
    if (relatedTopicsCount > 1) {
        console.log(`[CLEAN] Double "Related Topics" found in ${fileName}. Fixing...`);
        if (!dryRun) {
            const blocks = body.split('## 📚 Related Topics');
            const newBody = blocks[0] + '## 📚 Related Topics' + blocks[blocks.length - 1];
            const newContent = `---${frontmatter}---` + '\n\n' + newBody.trim();
            fs.writeFileSync(filePath, newContent);
        }
    }

    return false;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

console.log(`🚀 Starting Surgical Cleanup (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
let fixedCount = 0;

for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file);
    try {
        if (cleanupSurgical(fullPath, dryRun)) {
            fixedCount++;
        }
    } catch (e) {
        console.error(`❌ Error processing ${file}: ${e.message}`);
    }
}

console.log(`\n✅ Done. Total blogs fixed: ${fixedCount}`);
