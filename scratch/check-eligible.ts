import fs from 'fs';

const CACHE_FILE = 'scratch/raw_questions_cache.jsonl';
const DONE_FILE = 'scratch/processed_hashes.json';

const doneHashes = new Set<string>(
  fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8')) : []
);

const allRaw = fs.readFileSync(CACHE_FILE, 'utf-8')
  .split('\n').filter(Boolean)
  .map(l => JSON.parse(l));

const eligibleCuration = allRaw
  .filter(q => !doneHashes.has(q.hash))
  .filter(q => q.quality === 'raw');

const eligibleTagging = allRaw
  .filter(q => !doneHashes.has(q.hash))
  .filter(q => q.quality === 'verified');

console.log(`Total cache stubs: ${allRaw.length}`);
console.log(`Processed hashes: ${doneHashes.size}`);
console.log(`Eligible Curation (raw): ${eligibleCuration.length}`);
console.log(`Eligible Tagging (verified): ${eligibleTagging.length}`);

if (eligibleCuration.length > 0) {
  console.log(`First 3 eligible curation stubs:`, eligibleCuration.slice(0, 3));
}
