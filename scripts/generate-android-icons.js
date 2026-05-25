import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const logoPath = path.join(process.cwd(), 'icons', 'icon-512.webp');
const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

const densities = [
    { name: 'mdpi', size: 48, fgSize: 32 },
    { name: 'hdpi', size: 72, fgSize: 48 },
    { name: 'xhdpi', size: 96, fgSize: 64 },
    { name: 'xxhdpi', size: 144, fgSize: 96 },
    { name: 'xxxhdpi', size: 192, fgSize: 128 }
];

async function generate() {
    console.log('Starting Android icon generation...');
    
    for (const d of densities) {
        const mipmapFolder = path.join(resDir, `mipmap-${d.name}`);
        if (!fs.existsSync(mipmapFolder)) {
            fs.mkdirSync(mipmapFolder, { recursive: true });
        }

        // 1. Generate ic_launcher_foreground.png (Full size, system XML will handle standard inset)
        const fgBufferFull = await sharp(logoPath)
            .resize(d.size, d.size)
            .toBuffer();

        await sharp({
            create: {
                width: d.size,
                height: d.size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{ input: fgBufferFull, gravity: 'center' }])
        .png()
        .toFile(path.join(mipmapFolder, 'ic_launcher_foreground.png'));

        // Standard icon logo size (85% of canvas size to look full-size and clear)
        const standardFgSize = Math.round(d.size * 0.85);
        const fgBufferStandard = await sharp(logoPath)
            .resize(standardFgSize, standardFgSize)
            .toBuffer();

        // 2. Generate ic_launcher.png (standard icon: logo over deep dark theme background #0a0a0f)
        const bgBuffer = await sharp({
            create: {
                width: d.size,
                height: d.size,
                channels: 4,
                background: { r: 10, g: 10, b: 15, alpha: 1 } // App theme background #0a0a0f
            }
        })
        .png()
        .toBuffer();

        await sharp(bgBuffer)
            .composite([{ input: fgBufferStandard, gravity: 'center' }])
            .png()
            .toFile(path.join(mipmapFolder, 'ic_launcher.png'));

        // 3. Generate ic_launcher_round.png (round icon)
        const mask = Buffer.from(
            `<svg><circle cx="${d.size / 2}" cy="${d.size / 2}" r="${d.size / 2}" fill="black"/></svg>`
        );
        
        const roundBg = await sharp({
            create: {
                width: d.size,
                height: d.size,
                channels: 4,
                background: { r: 10, g: 10, b: 15, alpha: 1 }
            }
        })
        .composite([{ input: fgBufferStandard, gravity: 'center' }])
        .png()
        .toBuffer();

        await sharp(roundBg)
            .composite([{ input: mask, blend: 'dest-in' }])
            .png()
            .toFile(path.join(mipmapFolder, 'ic_launcher_round.png'));

        console.log(`Generated icons for mipmap-${d.name}`);
    }
    console.log('Android icon generation complete!');
}

generate().catch(console.error);
