import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_PATH = path.resolve(__dirname, '../dist/seo-manifest.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const keys = Object.keys(manifest);

console.log('Total keys:', keys.length);
console.log('Sample keys (first 10):');
console.log(keys.slice(0, 10));

console.log('\nSample keys (last 10):');
console.log(keys.slice(-10));
