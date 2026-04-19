/**
 * LINK VALIDATOR SCRIPT
 * Checks if internal /blog/ links in markdown files exist in the blogs.ts registry
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blogs');
const BLOGS_TS = path.resolve(__dirname, '..', 'src', 'data', 'blogs.ts');

const blogsTsContent = fs.readFileSync(BLOGS_TS, 'utf-8');
const validSlugs = new Set();
const slugRegex = /"id":\s*"([^"]+)"/g;
let match;
while ((match = slugRegex.exec(blogsTsContent)) !== null) {
    validSlugs.add(match[1]);
}

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

const brokenLinks = [];

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Find all /blog/ links
    const linkRegex = /\/blog\/([a-zA-Z0-9_-]+)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
        const slug = linkMatch[1];
        if (!validSlugs.has(slug)) {
            brokenLinks.push({ file, slug });
        }
    }
}

if (brokenLinks.length > 0) {
    console.log(`\n❌ Found ${brokenLinks.length} broken links:\n`);
    brokenLinks.forEach(b => console.log(`📝 ${b.file} -> /blog/${b.slug}`));
} else {
    console.log(`\n✅ All internal blog links are valid!\n`);
}
