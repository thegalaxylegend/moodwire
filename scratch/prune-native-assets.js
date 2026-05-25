import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../android/app/src/main/assets/public');

if (fs.existsSync(assetsDir)) {
    const items = fs.readdirSync(assetsDir);
    const keep = ['assets', 'images', 'models', 'blog-images', 'index.html', 'favicon.ico', 'robots.txt', 'manifest.webmanifest'];
    
    for (const item of items) {
        if (!keep.includes(item)) {
            const itemPath = path.join(assetsDir, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                console.log(`Pruning directory: ${item}`);
                fs.rmSync(itemPath, { recursive: true, force: true });
            } else {
                console.log(`Pruning file: ${item}`);
                fs.unlinkSync(itemPath);
            }
        }
    }
    console.log('✅ Native assets pruning complete.');
} else {
    console.error('❌ Native assets directory not found.');
}
