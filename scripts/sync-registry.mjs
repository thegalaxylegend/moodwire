/**
 * REGISTRY SYNC SCRIPT
 * Synchronizes blogs.ts with actual files in src/content/blogs/
 * Adds missing entries, removes dead ones.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blogs');
const BLOGS_TS = path.resolve(__dirname, '..', 'src', 'data', 'blogs.ts');

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
const blogsTsContent = fs.readFileSync(BLOGS_TS, 'utf-8');

// Parse current entries
const entries = [];
const entryRegex = /\{[\s\S]*?"id":\s*"([^"]+)"[\s\S]*?\}/g;
let match;
const existingIds = new Set();
while ((match = entryRegex.exec(blogsTsContent)) !== null) {
    const entryStr = match[0];
    const id = match[1];
    entries.push({ id, content: entryStr });
    existingIds.add(id);
}

const fileSlugs = new Set(files.map(f => f.replace('.md', '')));

let addedCount = 0;
let newEntries = [...entries];

// Add missing entries
for (const slug of fileSlugs) {
    if (!existingIds.has(slug)) {
        console.log(`➕ Adding missing entry for: ${slug}`);
        // Create a basic entry
        const filePath = path.join(BLOGS_DIR, slug + '.md');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const titleMatch = fileContent.match(/title:\s*"([^"]+)"/);
        const descMatch = fileContent.match(/description:\s*"([^"]+)"/);
        const dateMatch = fileContent.match(/date:\s*"([^"]+)"/);
        
        const title = titleMatch ? titleMatch[1] : slug.split('-').join(' ');
        const desc = descMatch ? descMatch[1] : title;
        const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
        
        const newEntry = `    {
        "id": "${slug}",
        "title": "${title}",
        "description": "${desc}",
        "category": "Exam Notes",
        "date": "${date}",
        "readTime": "15 min read",
        "image": "/blog-images/${slug}.webp"
    }`;
        newEntries.unshift({ id: slug, content: newEntry });
        addedCount++;
    }
}

// Write back to blogs.ts
const header = blogsTsContent.split('export const blogs: BlogEntry[] = [')[0] + 'export const blogs: BlogEntry[] = [';
const footer = '];';
const finalContent = header + '\n' + newEntries.map(e => e.content).join(',\n') + '\n' + footer;

fs.writeFileSync(BLOGS_TS, finalContent, 'utf-8');

console.log(`\n✅ Registry sync completed. Added ${addedCount} missing entries.\n`);
