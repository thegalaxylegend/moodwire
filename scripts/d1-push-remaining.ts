// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS — D1 REMAINING PUSH (via wrangler --file, handles encoding issues)
// Pushes the remaining questions that failed via REST API due to encoding/token errors
// Uses wrangler CLI which handles SQL natively without token parsing issues
//
// Usage: npx tsx scripts/d1-push-remaining.ts
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE  = path.join(__dirname, 'seed.sql');
const CHUNKS_DIR = path.join(__dirname, 'chunks');
const DB_NAME    = 'examcompass-questions';
const CHUNK_SIZE = 200; // statements per wrangler call

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Robust character-by-character SQL parser ────────────────────────────────
function parseSqlStatements(filePath: string): string[] {
  console.log('📂 Parsing seed.sql...');
  const content = fs.readFileSync(filePath, 'utf-8');
  const statements: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    if (inQuote) {
      if (char === "'" && content[i + 1] === "'") { current += "''"; i += 2; }
      else if (char === "'") { current += "'"; inQuote = false; i++; }
      else { current += char; i++; }
    } else {
      if (char === "'") { inQuote = true; current += "'"; i++; }
      else if (char === ';') {
        current += ';';
        const stmt = current.trim();
        if (stmt.toUpperCase().startsWith('INSERT')) statements.push(stmt);
        current = '';
        i++;
      } else { current += char; i++; }
    }
  }
  console.log(`   Parsed ${statements.length} statements`);
  return statements;
}

// ─── Fetch existing IDs from D1 via REST API ─────────────────────────────────
async function fetchExistingIDs(): Promise<Set<string>> {
  const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
  const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN ?? '';
  const D1_URL     = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;

  console.log('🔍 Fetching existing IDs from D1...');
  const ids = new Set<string>();
  let offset = 0;
  const pageSize = 10_000;

  while (true) {
    const res = await fetch(D1_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: `SELECT id FROM questions LIMIT ${pageSize} OFFSET ${offset};` }),
    });
    const data: any = await res.json();
    const rows: { id: string }[] = data.result?.[0]?.results ?? [];
    for (const r of rows) ids.add(r.id);
    process.stdout.write(`   Fetched ${ids.size} IDs...\r`);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  console.log(`   ✅ Found ${ids.size} existing questions in D1.`);
  return ids;
}

function extractID(insert: string): string {
  const m = insert.match(/VALUES\s*\(\s*'([a-f0-9]{32,64})'/i);
  return m ? m[1] : '';
}

// ─── Wrangler env ─────────────────────────────────────────────────────────────
function wranglerEnv() {
  return {
    ...process.env,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_D1_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  };
}

// ─── Run wrangler for a chunk file ────────────────────────────────────────────
function runChunk(chunkPath: string): { ok: boolean; error?: string } {
  try {
    const out = execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --file="${chunkPath}"`,
      { cwd: path.join(__dirname, '..'), encoding: 'utf-8', stdio: ['pipe','pipe','pipe'], env: wranglerEnv() }
    );
    if (out.includes('[ERROR]')) return { ok: false, error: out.slice(0, 200) };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: (e.stderr ?? e.message ?? '').slice(0, 200) };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(68));
  console.log('🚀 D1 REMAINING PUSH (via wrangler --file)');
  console.log('═'.repeat(68) + '\n');

  const allInserts = parseSqlStatements(SEED_FILE);
  const existingIDs = await fetchExistingIDs();

  const seenIDs = new Set<string>();
  const pending: string[] = [];

  for (const insert of allInserts) {
    const id = extractID(insert);
    if (!id || existingIDs.has(id) || seenIDs.has(id)) continue;
    seenIDs.add(id);
    pending.push(insert);
  }

  console.log(`\n📋 Pending (not yet in D1): ${pending.length}`);

  if (pending.length === 0) {
    console.log('✅ All questions already in D1!');
    return;
  }

  // Write chunks
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  const chunks: string[] = [];
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const slice = pending.slice(i, i + CHUNK_SIZE);
    const chunkPath = path.join(CHUNKS_DIR, `remaining_${String(chunks.length).padStart(4,'0')}.sql`);
    fs.writeFileSync(chunkPath, slice.join('\n'), 'utf-8');
    chunks.push(chunkPath);
  }
  console.log(`✂️  Split into ${chunks.length} chunks of ${CHUNK_SIZE}`);
  console.log(`\n📤 Uploading via wrangler...\n`);

  let pushed = 0, failed = 0;
  const start = Date.now();

  for (let i = 0; i < chunks.length; i++) {
    const result = runChunk(chunks[i]);
    if (result.ok) {
      pushed += CHUNK_SIZE;
      process.stdout.write(`\r  [${i+1}/${chunks.length}] ✅ ~${pushed} pushed  ❌ ${failed} failed  ${((Date.now()-start)/1000).toFixed(0)}s   `);
    } else {
      failed++;
      process.stdout.write(`\n  ⚠️ Chunk ${i+1} failed: ${result.error?.slice(0, 100)}\n`);
    }
    if (i + 1 < chunks.length) await sleep(800);
  }

  // Clean up chunk files
  fs.rmSync(CHUNKS_DIR, { recursive: true, force: true });

  // Final count via REST
  const DB_ID = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
  const TOKEN = process.env.CLOUDFLARE_D1_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN ?? '';
  const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;
  const verifyRes = await fetch(D1_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'SELECT COUNT(*) as total FROM questions;' }),
  });
  const verifyData: any = await verifyRes.json();
  const finalCount = verifyData.result?.[0]?.results?.[0]?.total ?? '?';

  console.log('\n\n' + '═'.repeat(68));
  console.log('✅ DONE');
  console.log(`   Chunks succeeded: ${chunks.length - failed}/${chunks.length}`);
  console.log(`   Total in D1 now:  ${finalCount}`);
  console.log('═'.repeat(68));
}

main().catch(e => { console.error('💥 FATAL:', e.message); process.exit(1); });
