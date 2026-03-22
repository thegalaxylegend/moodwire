import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogsDir = path.join(__dirname, '../src/content/blogs');
const outputFilePath = path.join(__dirname, '../src/data/blogs.ts');

function slugify(text) {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

async function sync() {
    console.log('🔄 Jules: Syncing Blog Registry...');
    
    if (!fs.existsSync(blogsDir)) {
        console.error('❌ Blog directory not found');
        return;
    }

    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const blogs = [];

    for (const file of files) {
        const filePath = path.join(blogsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const slug = file.replace('.md', '');

        // Extract metadata using robust regex
        const titleMatch = content.match(/^title:\s*["'](.*?)["']/m);
        const descMatch = content.match(/^description:\s*["'](.*?)["']/m);
        const catMatch = content.match(/^category:\s*["'](.*?)["']/m);
        const dateMatch = content.match(/^date:\s*["'](.*?)["']/m);
        const heroMatch = content.match(/^hero_image:\s*["'](.*?)["']/m);
        const inlineImgMatch = content.match(/\!\[.*?\]\((.*?)\)/);

        blogs.push({
            id: slug,
            title: titleMatch ? titleMatch[1] : slug.replace(/-/g, ' '),
            description: descMatch ? descMatch[1] : 'Deep revision guide for class ' + (slug.match(/class-(\d+)/)?.[1] || '11') + ' students.',
            category: catMatch ? catMatch[1] : 'General',
            date: dateMatch ? dateMatch[1] : '2026-03-22',
            readTime: '15 min read',
            image: heroMatch ? heroMatch[1] : (inlineImgMatch ? inlineImgMatch[1] : '/blog-images/fallbacks/generic-study.webp')
        });
    }

    // Sort by date (newest first)
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate the TypeScript file content
    const tsContent = `
export interface Blog {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
}

export const blogs: Blog[] = ${JSON.stringify(blogs, null, 4)};

export const CATEGORIES = Array.from(new Set(blogs.map(b => b.category))).sort();
`;

    fs.writeFileSync(outputFilePath, tsContent);
    console.log(`✅ Success: Registry updated with ${blogs.length} blogs.`);
}

sync();
