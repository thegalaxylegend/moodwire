import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
const questionDbPath = path.join(__dirname, '../public/question-db.json');

console.log('🔍 Verifying Manifest vs QuestionDB Integrity...');

if (!fs.existsSync(manifestPath) || !fs.existsSync(questionDbPath)) {
    console.error('❌ Files missing.');
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const questionDb = JSON.parse(fs.readFileSync(questionDbPath, 'utf8'));

const manifestKeys = Object.keys(manifest);
const qDbKeys = Object.keys(questionDb);

console.log(`Manifest Size: ${manifestKeys.length}`);
console.log(`QuestionDB Size: ${qDbKeys.length}`);

let mismatches = 0;
let qUrls = 0;

manifestKeys.forEach(url => {
    if (url.includes('/q/')) {
        qUrls++;
        if (!questionDb[url]) {
            console.error(`❌ Mismatch: ${url} IS in Manifest but NOT in QuestionDB.`);
            // Check for case-insensitive match
            const looseMatch = qDbKeys.find(k => k.toLowerCase() === url.toLowerCase());
            if (looseMatch) {
                console.error(`   -> Found loose match: ${looseMatch}`);
            } else {
                console.error(`   -> No match found in QuestionDB.`);
            }
            mismatches++;
        }
    }
});

console.log(`Total Question URLs in Manifest: ${qUrls}`);
console.log(`Mismatches: ${mismatches}`);

if (mismatches === 0) {
    console.log('✅ Integrity Check Passed! All question URLs have data.');
} else {
    console.log('❌ Integrity Check Failed.');
    process.exit(1);
}
