import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const logoPath = path.join(process.cwd(), 'icons', 'icon-512.webp');
const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

// Standard Android icon specifications for each density
const densities = [
    {
        name: 'mdpi',
        legacySize: 48,
        adaptiveSize: 108,
        adaptiveFgSize: 108
    },
    {
        name: 'hdpi',
        legacySize: 72,
        adaptiveSize: 162,
        adaptiveFgSize: 162
    },
    {
        name: 'xhdpi',
        legacySize: 96,
        adaptiveSize: 216,
        adaptiveFgSize: 216
    },
    {
        name: 'xxhdpi',
        legacySize: 144,
        adaptiveSize: 324,
        adaptiveFgSize: 324
    },
    {
        name: 'xxxhdpi',
        legacySize: 192,
        adaptiveSize: 432,
        adaptiveFgSize: 432
    }
];

async function generate() {
    console.log('Starting Android icon generation...');

    for (const d of densities) {
        const mipmapFolder = path.join(resDir, `mipmap-${d.name}`);
        if (!fs.existsSync(mipmapFolder)) {
            fs.mkdirSync(mipmapFolder, { recursive: true });
        }

        // --- 1. Adaptive Icon Foreground (ic_launcher_foreground.png) ---
        // Size: 108dp canvas, with the logo sized to 72dp (66.6% safe zone) and centered.
        // The background of the foreground layer must be transparent.
        const fgLogoBuffer = await sharp(logoPath)
            .resize(d.adaptiveFgSize, d.adaptiveFgSize)
            .toBuffer();

        await sharp({
            create: {
                width: d.adaptiveSize,
                height: d.adaptiveSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{ input: fgLogoBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(mipmapFolder, 'ic_launcher_foreground.png'));

        // --- 2. Legacy Launcher Icon (ic_launcher.png) ---
        // Size: legacySize, with the logo sized to 75% of the canvas and centered.
        // It has a solid background (#0a0a0f).
        const legacyLogoSize = Math.round(d.legacySize * 0.75);
        const legacyLogoBuffer = await sharp(logoPath)
            .resize(legacyLogoSize, legacyLogoSize)
            .toBuffer();

        await sharp({
            create: {
                width: d.legacySize,
                height: d.legacySize,
                channels: 4,
                background: { r: 10, g: 10, b: 15, alpha: 1 } // Solid background #0a0a0f
            }
        })
        .composite([{ input: legacyLogoBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(mipmapFolder, 'ic_launcher.png'));

        // --- 3. Legacy Round Launcher Icon (ic_launcher_round.png) ---
        // Size: legacySize, with logo sized to 75% of the canvas, masked into a circle.
        const mask = Buffer.from(
            `<svg><circle cx="${d.legacySize / 2}" cy="${d.legacySize / 2}" r="${d.legacySize / 2}" fill="black"/></svg>`
        );

        const roundBgBuffer = await sharp({
            create: {
                width: d.legacySize,
                height: d.legacySize,
                channels: 4,
                background: { r: 10, g: 10, b: 15, alpha: 1 }
            }
        })
        .composite([{ input: legacyLogoBuffer, gravity: 'center' }])
        .png()
        .toBuffer();

        await sharp(roundBgBuffer)
            .composite([{ input: mask, blend: 'dest-in' }])
            .png()
            .toFile(path.join(mipmapFolder, 'ic_launcher_round.png'));

        console.log(`Generated icons for mipmap-${d.name}`);
    }

    console.log('Android icon generation complete!');
}

generate().catch(console.error);
