import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogsDir = path.join(__dirname, '../src/content/blogs');

const fallbacks = {
    'Biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=1200&h=630',
    'Physics': 'https://images.unsplash.com/photo-1636466497217-39a814035f42?auto=format&fit=crop&q=80&w=1200&h=630',
    'Chemistry': 'https://images.unsplash.com/photo-1532187875605-18d8d2170e9f?auto=format&fit=crop&q=80&w=1200&h=630',
    'Maths': 'https://images.unsplash.com/photo-1509228468518-180dd48219d8?auto=format&fit=crop&q=80&w=1200&h=630',
    'Mathematics': 'https://images.unsplash.com/photo-1509228468518-180dd48219d8?auto=format&fit=crop&q=80&w=1200&h=630'
};

function repair() {
    console.log('🩹 Jules: Repairing broken image links in blogs...');
    
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    let count = 0;

    for (const file of files) {
        const filePath = path.join(blogsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find links that point to local files that might be missing or broken
        const imgRegex = /!\[.*?\]\(\/blog-images\/(.*?)\)/g;
        let match;
        let needsUpdate = false;

        while ((match = imgRegex.exec(content)) !== null) {
            const localPath = path.join(__dirname, '../public/blog-images', match[1]);
            
            // If the local image is missing or was the tiny 3KB garbage we just deleted
            if (!fs.existsSync(localPath)) {
                // Determine subject for fallback
                let fallback = fallbacks['Biology'];
                if (content.toLowerCase().includes('physics')) fallback = fallbacks['Physics'];
                if (content.toLowerCase().includes('chemistry')) fallback = fallbacks['Chemistry'];
                if (content.toLowerCase().includes('math')) fallback = fallbacks['Maths'];

                content = content.replace(match[0], `![Hero Image](${fallback})`);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Repaired: ${file}`);
            count++;
        }
    }

    console.log(`\n🩹 Done! Fixed ${count} blog posts.`);
}

repair();
