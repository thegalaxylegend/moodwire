#!/usr/bin/env tsx
// ═══════════════════════════════════════════════════════════════
// EXAMCOMPASS D1 UPLOADER
// Splits seed.sql into chunks and uploads to Cloudflare D1
// Free tier: ~10MB per D1 execute call, ~5GB total storage
// Usage: npx tsx scripts/d1-upload.ts [--dry-run] [--chunk-size=500]
// ═══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE  = path.join(__dirname, 'seed.sql');
const SCHEMA_FILE = path.join(__dirname, 'd1-schema.sql');
const CHUNK_DIR  = path.join(__dirname, '..', 'scratch', 'd1-chunks');
const DONE_FILE  = path.join(__dirname, '..', 'scratch', 'd1-upload-progress.json');

// CLI
const argv = process.argv.slice(2);
const DRY_RUN    = argv.includes('--dry-run');
const CHUNK_SIZE = Number(argv.find(a => a.startsWith('--chunk-size='))?.split('=')[1] || '500');
const REMOTE     = !argv.includes('--local'); // default: push to remote D1

const DB_NAME = process.env.D1_DATABASE_NAME || 'examcompass-questions';

console.log('═'.repeat(60));
console.log('📤 ExamCompass D1 Uploader');
console.log(`   DB: ${DB_NAME} | Chunk: ${CHUNK_SIZE} inserts | ${REMOTE ? 'REMOTE' : 'LOCAL'}`);
if (DRY_RUN) console.log('   ⚠️  DRY RUN — no wrangler calls');
console.log('═'.repeat(60));

// Check wrangler
try {
  execSync('npx wrangler --version', { stdio: 'pipe' });
} catch {
  console.error('❌ wrangler not found. Run: npm install -g wrangler');
  process.exit(1);
}

// Read seed.sql
if (!fs.existsSync(SEED_FILE)) {
  console.error(`❌ seed.sql not found at ${SEED_FILE}`);
  console.log('   Run: npx tsx scripts/batch-pipeline.ts --mode=full_curation');
  process.exit(1);
}

const seedContent = fs.readFileSync(SEED_FILE, 'utf-8');

// Extract INSERT statements
const insertLines = seedContent
  .split(/;\s*\n/)
  .filter(s => s.trim().startsWith('INSERT OR IGNORE INTO questions'));

console.log(`\n📦 Found ${insertLines.length} INSERT statements in seed.sql`);

// Load progress
let uploadedIndices: Set<number> = new Set();
if (fs.existsSync(DONE_FILE)) {
  const prog = JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8'));
  uploadedIndices = new Set(prog.uploaded || []);
  console.log(`   Already uploaded: ${uploadedIndices.size} chunks`);
}

// Create chunk directory
fs.mkdirSync(CHUNK_DIR, { recursive: true });

// Split into chunks
const chunks: string[][] = [];
for (let i = 0; i < insertLines.length; i += CHUNK_SIZE) {
  chunks.push(insertLines.slice(i, i + CHUNK_SIZE));
}

console.log(`   Splitting into ${chunks.length} chunks of ~${CHUNK_SIZE} inserts each\n`);

// Initialize schema on first run
const schemaUploaded = uploadedIndices.has(-1);
if (!schemaUploaded && fs.existsSync(SCHEMA_FILE)) {
  console.log('📋 Uploading schema first...');
  if (!DRY_RUN) {
    const schemaResult = spawnSync('npx', [
      'wrangler', 'd1', 'execute', DB_NAME,
      '--file', SCHEMA_FILE,
      ...(REMOTE ? ['--remote'] : ['--local']),
    ], { encoding: 'utf-8', stdio: 'inherit' });

    if (schemaResult.status !== 0) {
      console.error('❌ Schema upload failed. Check wrangler auth and database name.');
      process.exit(1);
    }
    uploadedIndices.add(-1);
    fs.writeFileSync(DONE_FILE, JSON.stringify({ uploaded: [...uploadedIndices] }));
    console.log('✅ Schema uploaded\n');
  } else {
    console.log('   [DRY] Would upload schema\n');
  }
}

// Upload each chunk
let uploaded = 0, skipped = 0, failed = 0;
for (let i = 0; i < chunks.length; i++) {
  if (uploadedIndices.has(i)) {
    skipped++;
    continue;
  }

  const chunkFile = path.join(CHUNK_DIR, `chunk_${String(i).padStart(4, '0')}.sql`);
  const chunkSql  = chunks[i].map(s => s + ';').join('\n') + '\n';
  fs.writeFileSync(chunkFile, chunkSql, 'utf-8');

  const pct = ((i + 1) / chunks.length * 100).toFixed(0);
  process.stdout.write(`\r  [${'█'.repeat(Math.round(Number(pct)/5))}${'░'.repeat(20-Math.round(Number(pct)/5))}] ${pct}% Chunk ${i+1}/${chunks.length}`);

  if (!DRY_RUN) {
    const result = spawnSync('npx', [
      'wrangler', 'd1', 'execute', DB_NAME,
      '--file', chunkFile,
      ...(REMOTE ? ['--remote'] : ['--local']),
    ], { encoding: 'utf-8', stdio: 'pipe' });

    if (result.status === 0) {
      uploadedIndices.add(i);
      fs.writeFileSync(DONE_FILE, JSON.stringify({ uploaded: [...uploadedIndices] }));
      uploaded++;
    } else {
      failed++;
      console.error(`\n  ❌ Chunk ${i} failed: ${(result.stderr || '').slice(0, 200)}`);
      // Continue — don't stop on single chunk failure
    }
  } else {
    uploaded++;
  }

  // Small delay to avoid rate limits
  await new Promise(r => setTimeout(r, 200));
}

console.log('\n');
console.log('═'.repeat(60));
console.log(`✅ Upload complete!`);
console.log(`   Uploaded: ${uploaded} chunks (${uploaded * CHUNK_SIZE} questions approx)`);
console.log(`   Skipped:  ${skipped} (already done)`);
console.log(`   Failed:   ${failed}`);
console.log('');
console.log('Next steps:');
console.log('  1. Verify: npx wrangler d1 execute examcompass-questions --remote --command "SELECT COUNT(*) FROM questions"');
console.log('  2. Query:  npx wrangler d1 execute examcompass-questions --remote --command "SELECT exam, class, COUNT(*) FROM questions GROUP BY exam, class"');
console.log('═'.repeat(60));
