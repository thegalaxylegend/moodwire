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

    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md') && f !== 'undefined.md');
    const blogs = [];

    for (const file of files) {
        const filePath = path.join(blogsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const slug = file.replace('.md', '');

        // REGISTRY SHIELD: Block blogs with technical artifacts
        // NOTE: The regex must be PRECISE — it must match actual JSON squashing
        // like {"heading":"...","body":"..."} inside the body content, not just anywhere.
        const bodyContent = content.split('---').pop() || '';
        const isCorrupted = content.includes('[object Object]') || 
                           /^\s*\{\s*"heading"\s*:\s*"[^"]*"\s*,\s*"body"\s*:/m.test(bodyContent);
        
        if (isCorrupted) {
            console.error(`❌ Shield: Ignoring corrupted blog "${slug}" (artifacts detected)`);
            continue;
        }

        // Extract metadata using robust regex
        // Handles both quoted ("...") and unquoted values
        const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
        const descMatch = content.match(/^description:\s*["']?(.*?)["']?$/m);
        const catMatch = content.match(/^category:\s*["']?(.*?)["']?$/m);
        const dateMatch = content.match(/^date:\s*["']?(.*?)["']?$/m);
        const heroMatch = content.match(/^heroImage:\s*["']?(.*?)["']?$/m) || content.match(/^hero_image:\s*["']?(.*?)["']?$/m);
        const inlineImgMatch = content.match(/\!\[.*?\]\((.*?)\)/);

        const stats = fs.statSync(filePath);
        
        // Final fallback logic
        const title = titleMatch?.[1]?.trim() || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const description = descMatch?.[1]?.trim() || 'Deep revision guide for class ' + (slug.match(/class-(\d+)/)?.[1] || '11') + ' students.';
        const category = catMatch?.[1]?.trim() || 'General';
        const date = dateMatch?.[1]?.trim() || stats.mtime.toISOString().split('T')[0];
        const image = heroMatch?.[1]?.trim() || (inlineImgMatch ? inlineImgMatch[1] : '/blog-images/fallbacks/generic-study.webp');

        blogs.push({
            id: slug,
            title,
            description,
            category,
            date,
            readTime: '15 min read',
            image,
            mtime: stats.mtimeMs // Add mtime for sorting
        });
    }

    // Sort by date (newest first) and then by mtime (newest first)
    blogs.sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.mtime - a.mtime; // Tie-breaker: most recently modified file
    });

    // Generate the TypeScript file content
    // Strip mtime before writing
    const cleanBlogs = blogs.map(({ mtime, ...rest }) => rest);

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

export const blogs: Blog[] = ${JSON.stringify(cleanBlogs, null, 4)};

export const CATEGORIES = Array.from(new Set(blogs.map(b => b.category))).sort();
`;

    fs.writeFileSync(outputFilePath, tsContent);
    console.log(`✅ Success: Registry updated with ${blogs.length} blogs.`);
}

sync();
