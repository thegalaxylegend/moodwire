import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function check() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`🔍 Checking ${files.length} blogs for broken images...`);

    let brokenCount = 0;
    for (const file of files) {
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
        const heroMatch = content.match(/hero_image:\s*["'](.*?)["']/);
        
        if (heroMatch) {
            const imgPath = heroMatch[1];
            const fullPath = path.join(PUBLIC_DIR, imgPath);
            
            if (!fs.existsSync(fullPath)) {
                console.log(`❌ Broken image in ${file}: ${imgPath}`);
                brokenCount++;
            }
        }
    }
    console.log(`\nFound ${brokenCount} broken images.`);
}

check();
