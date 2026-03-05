import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const imgDir = path.join(process.cwd(), 'public', 'blog-images');
const images = fs.readdirSync(imgDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

async function run() {
    for (const img of images) {
        const fullPath = path.join(imgDir, img);
        const outPath = path.join(imgDir, 'optimized_' + img);

        await sharp(fullPath)
            .resize({ width: 800 }) // Downscale to width 800
            .jpeg({ quality: 80 }) // Convert to jpeg for better compression
            .toFile(outPath);

        // Replace original
        fs.unlinkSync(fullPath);
        fs.renameSync(outPath, fullPath.replace('.png', '.jpg'));

        console.log(`Optimized ${img}`);
    }
}

run().catch(console.error);
