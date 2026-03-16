import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');

async function downloadHeroImage(topic, slug, subject) {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return;

    console.log(`🎨 Jules: Repairing artwork for "${topic}"...`);
    const artPromptUser = `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, 8k, no text.`;
    
    try {
        const encodedPrompt = encodeURIComponent(artPromptUser);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&nologo=true`;

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Pollinations failed");

        const bufferBuffer = await response.arrayBuffer();
        const { default: sharp } = await import('sharp');
        await sharp(Buffer.from(bufferBuffer))
            .resize(1200, 630, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(webpPath);

        console.log(`✅ Image saved: ${slug}.webp`);
    } catch (err) {
        console.warn(`⚠️ Failed to generate image for ${slug}`);
    }
}

async function repair() {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
    
    const blogs = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    for (const file of blogs) {
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
        const slug = file.replace('.md', '');
        
        const titleMatch = content.match(/title:\s*["'](.*?)["']/);
        const topic = titleMatch ? titleMatch[1] : slug;
        
        const catMatch = content.match(/category:\s*["'](.*?)["']/);
        const subject = catMatch ? catMatch[1] : 'Science';

        const imageMatch = content.match(/\!\[.*?\]\(\/blog-images\/(.*?\.webp)\)/);
        if (imageMatch) {
            const imageName = imageMatch[1];
            const imagePath = path.join(IMAGE_DIR, imageName);
            if (!fs.existsSync(imagePath)) {
                await downloadHeroImage(topic, slug, subject);
            }
        }
    }
}

repair().catch(console.error);
