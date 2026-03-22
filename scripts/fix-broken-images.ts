/**
 * Fix Broken Images Script
 * Renames images in public/blog-images to match the new optimized slugs.
 * Also updates the frontmatter in the .md files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMG_DIR = path.join(__dirname, '../public/blog-images');

function getTopicKey(str: string) {
    return str.toLowerCase()
        .replace(/-class-\d+/g, '')
        .replace(/-revision-notes/g, '')
        .replace(/-jee-neet/g, '')
        .replace(/-neet/g, '')
        .replace(/-jee/g, '')
        .replace(/-cbse/g, '')
        .trim();
}

async function start() {
    const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const imgFiles = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp') || f.endsWith('.png'));

    console.log(`🖼️ Fixing images for ${blogFiles.length} blogs...`);

    for (const blogFile of blogFiles) {
        const slug = blogFile.replace('.md', '');
        const topicKey = getTopicKey(slug);
        const filePath = path.join(BLOG_DIR, blogFile);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find best matching image by topicKey
        const bestImg = imgFiles.find(img => getTopicKey(img.replace(/\.\w+$/, '')).startsWith(topicKey) || topicKey.startsWith(getTopicKey(img.replace(/\.\w+$/, ''))));

        if (bestImg) {
            const ext = path.extname(bestImg);
            const newImgName = `${slug}${ext}`;
            const oldImgPath = path.join(IMG_DIR, bestImg);
            const newImgPath = path.join(IMG_DIR, newImgName);

            if (fs.existsSync(oldImgPath)) {
                fs.copyFileSync(oldImgPath, newImgPath);
                console.log(`   ✅ Copied ${bestImg} -> ${newImgName}`);
            }

            // Update frontmatter
            const heroImageLine = `hero_image: "/blog-images/${newImgName}"`;
            content = content.replace(/hero_image: ".*?"/, heroImageLine);
            fs.writeFileSync(filePath, content);
        } else {
            console.warn(`   ⚠️ No image found for topic: ${topicKey}`);
            // Assign fallback
            content = content.replace(/hero_image: ".*?"/, `hero_image: "/blog-images/fallbacks/generic-study.webp"`);
            fs.writeFileSync(filePath, content);
        }
    }

    console.log('🎉 Image fix complete!');
}

start();
