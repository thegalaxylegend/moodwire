import fs from 'fs';
import path from 'path';

const BLOGS_DIR = path.resolve(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));

let totalFixes = 0;

for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Unescape dollars
    content = content.replace(/\\\$/g, '$');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixes++;
    }
}
console.log(`Unescaped $ in ${totalFixes} files`);
