import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TAXONOMY } from './curriculum-taxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_FILE = path.join(__dirname, '..', 'scratch', 'taxonomy.json');

const dir = path.dirname(OUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUT_FILE, JSON.stringify(TAXONOMY, null, 2), 'utf-8');
console.log(`✅ Taxonomy exported to ${OUT_FILE}`);
