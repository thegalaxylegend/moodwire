import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const EXCLUDE = ['node_modules', '.git', 'dist', '.next', 'rehabilitate-blogs.js'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.xml', '.txt', '.yml'];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!EXCLUDE.includes(file)) results = results.concat(walk(fullPath));
        } else {
            if (EXTENSIONS.includes(path.extname(file))) results.push(fullPath);
        }
    });
    return results;
}

const files = walk(rootDir);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('examcompass.pages.dev')) {
        console.log(`🔗 Updating URL in: ${path.relative(rootDir, file)}`);
        content = content.replace(/examcompass\.web\.app/g, 'examcompass.pages.dev');
        fs.writeFileSync(file, content);
        count++;
    }
});

console.log(`\n✅ Done! Updated ${count} files to the new Cloudflare domain.`);
