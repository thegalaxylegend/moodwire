import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function countWords(text: string): number {
    // Remove frontmatter
    const body = text.replace(/^---[\s\S]*?---\r?\n/, '');
    // Remove markdown symbols and extra whitespace
    const cleanText = body
        .replace(/[#*`\[\]()]/g, ' ')
        .replace(/\$\$.*?\$\$/gs, ' ') // Remove block math
        .replace(/\$.*?\$/g, ' ')    // Remove inline math
        .replace(/\s+/g, ' ')
        .trim();
    
    if (!cleanText) return 0;
    return cleanText.split(' ').length;
}

async function analyzeBlogs() {
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('Blog directory not found:', BLOG_DIR);
        return;
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const stats = [];

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const wordCount = countWords(content);
        
        let status = 'Good';
        if (wordCount < 300) status = 'CRITICAL (Thin)';
        else if (wordCount < 600) status = 'Short';

        stats.push({
            file,
            wordCount,
            status
        });
    }

    // Sort by word count ascending
    stats.sort((a, b) => a.wordCount - b.wordCount);

    console.log('\n📊 Blog Content Analysis Report');
    console.log('═'.repeat(60));
    console.log(`${'File'.padEnd(40)} | ${'Words'.padStart(8)} | ${'Status'}`);
    console.log('-'.repeat(60));

    stats.forEach(s => {
        const fileName = s.file.length > 37 ? s.file.substring(0, 37) + '...' : s.file.padEnd(40);
        console.log(`${fileName} | ${s.wordCount.toString().padStart(8)} | ${s.status}`);
    });

    const thinCount = stats.filter(s => s.status === 'CRITICAL (Thin)').length;
    const shortCount = stats.filter(s => s.status === 'Short').length;

    console.log('\n' + '═'.repeat(60));
    console.log(`📈 Summary:`);
    console.log(`  Total Blogs Scanned: ${stats.length}`);
    console.log(`  Critical (Thin < 300): ${thinCount}`);
    console.log(`  Short (300-600): ${shortCount}`);
    console.log(`  Good (600+): ${stats.length - thinCount - shortCount}`);
    console.log('═'.repeat(60));
}

analyzeBlogs();
