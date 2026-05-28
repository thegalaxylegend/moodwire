import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.resolve(__dirname, '../dist/about/index.html');

if (!fs.existsSync(FILE_PATH)) {
    console.error('File not found!');
    process.exit(1);
}

const content = fs.readFileSync(FILE_PATH, 'utf8');
const metaTags = content.match(/<meta\s+[^>]+>/gi) || [];

console.log('--- ALL META TAGS ---');
metaTags.forEach((meta, idx) => {
    console.log(`${idx}: ${meta}`);
});

console.log('\n--- TESTING PARSING ---');
let ogTitle = null, ogDesc = null;
for (const meta of metaTags) {
    if (/\bproperty=["']og:title["']/i.test(meta)) {
        const match = meta.match(/\bcontent=["']([^"']*)["']/i);
        console.log('Found og:title tag:', meta);
        console.log('Match:', match);
        if (match) ogTitle = match[1];
    }
    if (/\bproperty=["']og:description["']/i.test(meta)) {
        const match = meta.match(/\bcontent=["']([^"']*)["']/i);
        console.log('Found og:description tag:', meta);
        console.log('Match:', match);
        if (match) ogDesc = match[1];
    }
}
console.log('Final ogTitle:', ogTitle);
console.log('Final ogDesc:', ogDesc);
