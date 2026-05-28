import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

console.log('DIST DIR PATH:', DIST_DIR);
console.log('Exists:', fs.existsSync(DIST_DIR));

const files = fs.readdirSync(DIST_DIR);
console.log('Direct contents of dist:');
for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    const stat = fs.statSync(filePath);
    console.log(`- ${file} (${stat.isDirectory() ? 'DIR' : 'FILE'})`);
}
