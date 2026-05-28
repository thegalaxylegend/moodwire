import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

async function main() {
    console.log('🛠&nbsp;Starting Practice Link Body Fixer...');
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.md', '');

        // Match [**Practice Mock Test**](...) or similar
        const mockTestRegex = /\[\*\*Practice Mock Test\*\*\]\((.*?)\)/g;
        if (mockTestRegex.test(content)) {
            content = content.replace(mockTestRegex, `[**Practice Mock Test**](/practice/${slug})`);
            fs.writeFileSync(filePath, content, 'utf-8');
            fixedCount++;
        }
    }

    console.log(`✅ Body link fix complete: Updated ${fixedCount} blog files.`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
