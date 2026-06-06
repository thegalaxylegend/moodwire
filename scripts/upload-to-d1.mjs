// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS → Cloudflare D1 BULK UPLOAD SCRIPT
// Splits seed.sql into safe chunks and uploads via wrangler CLI
// Usage: node scripts/upload-to-d1.mjs
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_FILE   = path.join(__dirname, 'seed.sql');
const CHUNKS_DIR  = path.join(__dirname, 'seed_chunks');
const DB_NAME     = 'examcompass-questions';
const ROWS_PER_CHUNK = 500;   // ~500 INSERT statements per chunk ≈ <5 MB each

// ─── Shared env for all wrangler calls ───
function wranglerEnv() {
  return {
    ...process.env,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  };
}

// ─── Read IDs already in D1 so we can skip them ───
async function getExistingIDs() {
  console.log('🔍 Fetching existing IDs from D1 (may take a moment)...');
  const ids = new Set();
  let offset = 0;
  const pageSize = 10000;

  while (true) {
    const cmd = buildWranglerCmd(
      `SELECT id FROM questions LIMIT ${pageSize} OFFSET ${offset};`
    );
    let result;
    try {
      result = execSync(cmd, { cwd: path.join(__dirname, '..'), encoding: 'utf-8', stdio: ['pipe','pipe','pipe'], env: wranglerEnv() });
    } catch (e) {
      console.error('❌ Failed to query D1:', e.message);
      process.exit(1);
    }

    // Parse the JSON array of results from wrangler output
    const jsonMatch = result.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) break;
    let parsed;
    try { parsed = JSON.parse(jsonMatch[0]); } catch { break; }
    const rows = parsed[0]?.results ?? [];
    if (rows.length === 0) break;

    for (const row of rows) ids.add(row.id);
    console.log(`   ✅ Fetched ${ids.size} IDs so far...`);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  console.log(`📊 Total existing IDs in D1: ${ids.size}`);
  return ids;
}

// ─── Parse seed.sql into individual INSERT statements ───
function parseInserts(filePath) {
  console.log(`\n📂 Reading ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  // Each INSERT starts at "INSERT OR IGNORE INTO questions"
  const parts = content.split(/(?=INSERT OR IGNORE INTO questions\s*\()/);
  const inserts = parts.filter(p => p.trim().startsWith('INSERT OR IGNORE INTO questions'));
  console.log(`📝 Found ${inserts.length} INSERT statements in seed.sql`);
  return inserts;
}

// ─── Extract ID from an INSERT statement ───
function extractID(insert) {
  const m = insert.match(/VALUES\s*\(\s*'([a-f0-9]{64})'/i);
  return m ? m[1] : null;
}

// ─── Validate an INSERT: options must not be empty for MCQ, correct_answer must be present ───
function validateInsert(insert) {
  // Skip obviously broken ones with empty question_text
  if (!insert.includes("question_text")) return { ok: false, reason: 'no question_text column' };
  
  // Check for MCQ type with empty options
  const isMCQ = /'MCQ'/i.test(insert);
  const hasEmptyOptions = /'MCQ'[\s\S]*?'(\[\])'/.test(insert);
  if (isMCQ && hasEmptyOptions) {
    // Simple check: if type is MCQ but options is '[]', skip it
    const optionsMatch = insert.match(/,\s*'(\[\])'\s*,/);
    if (optionsMatch) {
      // count where options is in column order
      // More precise: find the 'options' column value
      const typeMatch = insert.match(/'(MCQ|Multi-correct|Integer|Passage|Matrix-Match)'/);
      const typeVal = typeMatch ? typeMatch[1] : '';
      if (typeVal === 'MCQ') {
        // For MCQ, options must be non-empty JSON array
        // Find options value: it comes after type, passage_id, has_image, difficulty_score, difficulty_band, step_count, negative_marking, question_text
        // We look for an '[]' that appears to be the options field for MCQ
        // Heuristic: if there's only one JSON array that is '[]' in an MCQ, it's bad
      }
    }
  }
  return { ok: true };
}

// ─── Build wrangler CLI command ───
function buildWranglerCmd(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  return `npx wrangler d1 execute ${DB_NAME} --remote --command="${escaped}"`;
}

// ─── Write chunk file ───
function writeChunk(inserts, chunkIndex) {
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  const chunkPath = path.join(CHUNKS_DIR, `chunk_${String(chunkIndex).padStart(4, '0')}.sql`);
  fs.writeFileSync(chunkPath, inserts.join('\n'), 'utf-8');
  return chunkPath;
}

// ─── Execute a chunk file via wrangler ───
function executeChunk(chunkPath) {
  const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --file="${chunkPath}"`;
  try {
    const output = execSync(cmd, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: wranglerEnv()
    });
    if (output.includes('ERROR') || output.includes('[ERROR]')) {
      return { ok: false, error: output };
    }
    // Extract rows_written count from output
    const writtenMatch = output.match(/"rows_written":\s*(\d+)/);
    const written = writtenMatch ? parseInt(writtenMatch[1]) : 0;
    return { ok: true, written };
  } catch (e) {
    return { ok: false, error: e.message + '\n' + (e.stdout || '') + '\n' + (e.stderr || '') };
  }
}

// ─── Main ───
async function main() {
  console.log('🚀 EXAMCOMPASS D1 BULK UPLOAD PIPELINE');
  console.log('=========================================');

  // Step 1: Get existing IDs from D1
  const existingIDs = await getExistingIDs();

  // Step 2: Parse seed.sql
  const allInserts = parseInserts(SEED_FILE);

  // Step 3: Filter out already-inserted rows
  const pendingInserts = [];
  let skipped = 0;
  let badOptions = 0;

  for (const insert of allInserts) {
    const id = extractID(insert);
    if (!id) {
      console.warn('⚠️  Could not extract ID from insert, skipping.');
      continue;
    }
    if (existingIDs.has(id)) {
      skipped++;
      continue;
    }
    // Quality check: MCQ must have 4 options, not []
    const typeMatch = insert.match(/, '(MCQ|Multi-correct|Integer|Passage|Matrix-Match)',/);
    const typeVal = typeMatch ? typeMatch[1] : '';
    if (typeVal === 'MCQ') {
      // Find options value in INSERT — it's a JSON string like '["opt1","opt2","opt3","opt4"]'
      // Options column comes after question_text in the column list
      // Simple heuristic: look for ', '[]', ' which would mean empty options for MCQ
      // More reliable: look for the options value pattern
      const optionsMatch = insert.match(/question_text[^)]*\)\s*VALUES\s*\([^)]*,'([^']*)',\s*'([^']*)'/);
      // Actually let's use a different approach - find empty JSON array in options position
      // Check if this MCQ has at least 4 items in options
      const jsonArrayMatches = [...insert.matchAll(/'(\[.*?\])'/gs)];
      let optionsValue = null;
      // The options array is the first JSON array after question_text value
      // Simpler: just check if '[]' appears where options should be for MCQ
      const simpleEmptyOptions = /'MCQ', NULL, 0, \d+, '[^']+', \d+, -?\d+\.?\d*, '[^']*', '\[\]'/.test(insert);
      if (simpleEmptyOptions) {
        badOptions++;
        continue; // Skip MCQ with empty options
      }
    }
    pendingInserts.push(insert);
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total in seed.sql:   ${allInserts.length}`);
  console.log(`   Already in D1:       ${skipped}`);
  console.log(`   Bad MCQ (no opts):   ${badOptions}`);
  console.log(`   Pending upload:      ${pendingInserts.length}`);

  if (pendingInserts.length === 0) {
    console.log('\n✅ Nothing to upload! D1 is already up to date.');
    return;
  }

  // Step 4: Split into chunks
  const totalChunks = Math.ceil(pendingInserts.length / ROWS_PER_CHUNK);
  console.log(`\n✂️  Splitting into ${totalChunks} chunks of ${ROWS_PER_CHUNK} rows each...`);

  // Clean chunks dir
  if (fs.existsSync(CHUNKS_DIR)) {
    fs.rmSync(CHUNKS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });

  const chunkPaths = [];
  for (let i = 0; i < totalChunks; i++) {
    const slice = pendingInserts.slice(i * ROWS_PER_CHUNK, (i + 1) * ROWS_PER_CHUNK);
    const chunkPath = writeChunk(slice, i);
    chunkPaths.push(chunkPath);
  }
  console.log(`✅ Created ${chunkPaths.length} chunk files in ${CHUNKS_DIR}`);

  // Step 5: Upload chunks
  console.log(`\n📤 Starting upload to D1 (database: ${DB_NAME})...\n`);
  let totalUploaded = 0;
  let failedChunks = [];

  for (let i = 0; i < chunkPaths.length; i++) {
    const chunkPath = chunkPaths[i];
    const chunkName = path.basename(chunkPath);
    process.stdout.write(`   [${i + 1}/${chunkPaths.length}] Uploading ${chunkName}...`);
    
    const result = executeChunk(chunkPath);
    if (result.ok) {
      totalUploaded += result.written;
      console.log(` ✅ +${result.written} rows written`);
    } else {
      console.log(` ❌ FAILED`);
      console.error(`      Error: ${result.error?.substring(0, 300)}`);
      failedChunks.push({ chunkPath, error: result.error });
    }

    // Small delay between chunks to be friendly
    if (i < chunkPaths.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Step 6: Final report
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📊 UPLOAD COMPLETE — FINAL REPORT');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`   Total rows uploaded:   ${totalUploaded}`);
  console.log(`   Chunks succeeded:      ${chunkPaths.length - failedChunks.length} / ${chunkPaths.length}`);
  console.log(`   Failed chunks:         ${failedChunks.length}`);

  if (failedChunks.length > 0) {
    console.log('\n⚠️  FAILED CHUNKS (can be re-run manually):');
    for (const { chunkPath } of failedChunks) {
      console.log(`   npx wrangler d1 execute ${DB_NAME} --remote --file="${chunkPath}"`);
    }
  }

  // Verify final count
  console.log('\n🔍 Verifying final D1 count...');
  try {
    const verifyCmd = buildWranglerCmd('SELECT COUNT(*) as total FROM questions;');
    const verifyOutput = execSync(verifyCmd, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      env: wranglerEnv()
    });
    const countMatch = verifyOutput.match(/"total":\s*(\d+)/);
    if (countMatch) {
      console.log(`\n🎉 D1 now has ${countMatch[1]} questions total!`);
    }
  } catch (e) {
    console.warn('Could not verify final count:', e.message);
  }

  // Cleanup chunks
  console.log('\n🧹 Cleaning up chunk files...');
  fs.rmSync(CHUNKS_DIR, { recursive: true, force: true });
  console.log('✅ Done!');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
