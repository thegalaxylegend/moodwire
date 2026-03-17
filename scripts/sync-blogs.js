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

        // Extract metadata using regex
        const titleMatch = content.match(/title:\s*["'](.*?)["']/);
        const descMatch = content.match(/description:\s*["'](.*?)["']/);
        const catMatch = content.match(/category:\s*["'](.*?)["']/) || content.match(/# .* Notes for (.*)/);
        const dateMatch = content.match(/Last Updated:\s*(.*)/) || content.match(/date:\s*["'](.*?)["']/);
        const imageMatch = content.match(/\!\[.*?\]\((.*?)\)/);

        blogs.push({
            id: slug,
            title: titleMatch ? titleMatch[1] : slug.replace(/-/g, ' '),
            description: descMatch ? descMatch[1] : '',
            category: catMatch ? catMatch[1].trim() : (slug.includes('biology') ? 'Biology' : 'General'),
            date: dateMatch ? dateMatch[1].split('|')[0].trim().replace(/\*/g, '') : 'March 16, 2026',
            readTime: '15 min read',
            image: imageMatch ? imageMatch[1] : '/blog-images/default.webp'
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
