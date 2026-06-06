// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS — D1 PUSH SCRIPT
// Reads scripts/seed.sql and pushes all INSERT statements to Cloudflare D1
// via REST API in batches (no wrangler login required).
//
// Usage:
//   npx tsx scripts/d1-push.ts [--dry-run] [--chunk=N] [--file=path/to/seed.sql]
//
// Required env:
//   CLOUDFLARE_D1_TOKEN      — D1 API token (Account level, with D1:Edit)
//   CLOUDFLARE_ACCOUNT_ID    — Cloudflare account ID
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI args ─────────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const arg     = (k: string, def = '') => argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? def;
const has     = (k: string) => argv.some(a => a === `--${k}` || a.startsWith(`--${k}=`));

const DRY_RUN    = has('dry-run');
const CHUNK_SIZE = Number(arg('chunk', '50'));  // INSERT stmts per API call (safe limit: ~1MB per request)
const SEED_FILE  = arg('file', path.join(__dirname, 'seed.sql'));

// ─── Cloudflare D1 config ─────────────────────────────────────────────────────
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580'; // from wrangler.toml
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || '';

const D1_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function queryD1(sql: string, retries = 3): Promise<{ success: boolean; errors?: any[] }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(D1_URL, {
        method:  'POST',
        signal:  AbortSignal.timeout(30000),
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (res.status === 429) {
        const wait = attempt * 5000;
        process.stdout.write(`\n  ⚡ D1 rate-limited (429) — waiting ${wait/1000}s...\n`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        // If it's a "table not found" or schema error on first push, that's fatal
        if (text.includes('no such table') || text.includes('no such column')) {
          throw new Error(`Schema error: ${text.slice(0, 300)}`);
        }
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const data: any = await res.json();
      if (!data.success) {
        const errs = JSON.stringify(data.errors || []).slice(0, 300);
        // UNIQUE constraint failures are fine — INSERT OR IGNORE handles them
        if (errs.includes('UNIQUE constraint') || errs.includes('SQLITE_CONSTRAINT')) {
          return { success: true };
        }
        throw new Error(`D1 error: ${errs}`);
      }
      return { success: true };

    } catch (e: any) {
      if (attempt === retries) throw e;
      await sleep(1000 * attempt);
    }
  }
  return { success: false };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Validate env
  if (!ACCOUNT_ID || !TOKEN) {
    console.error('❌ Missing required env variables:');
    if (!ACCOUNT_ID) console.error('   CLOUDFLARE_ACCOUNT_ID');
    if (!TOKEN)      console.error('   CLOUDFLARE_D1_TOKEN');
    process.exit(1);
  }

  // Validate file
  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ Seed file not found: ${SEED_FILE}`);
    console.log('   Run: npx tsx scripts/turbo-pipeline.ts first to generate seed.sql');
    process.exit(1);
  }

  const rawContent = fs.readFileSync(SEED_FILE, 'utf-8');
  const inserts    = rawContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.toUpperCase().startsWith('INSERT'));

  if (inserts.length === 0) {
    console.log('⚠️  No INSERT statements found in seed file — nothing to push.');
    process.exit(0);
  }

  console.log('═'.repeat(68));
  console.log('🚀 EXAMCOMPASS — D1 PUSH');
  console.log('─'.repeat(68));
  console.log(`   DB:        ${DB_ID}`);
  console.log(`   Account:   ${ACCOUNT_ID.slice(0, 8)}...`);
  console.log(`   Seed:      ${SEED_FILE}`);
  console.log(`   INSERTs:   ${inserts.length}`);
  console.log(`   ChunkSize: ${CHUNK_SIZE} stmts/call`);
  console.log(`   DryRun:    ${DRY_RUN}`);
  console.log('═'.repeat(68) + '\n');

  if (DRY_RUN) {
    console.log(`✅ DRY-RUN: would push ${inserts.length} statements in ${Math.ceil(inserts.length / CHUNK_SIZE)} API calls`);
    return;
  }

  let pushed   = 0;
  let skipped  = 0;
  let failures = 0;
  const startMs = Date.now();

  // Build chunks
  const chunks: string[][] = [];
  for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
    chunks.push(inserts.slice(i, i + CHUNK_SIZE));
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const sql   = chunk.join('\n');

    try {
      await queryD1(sql);
      pushed += chunk.length;
    } catch (e: any) {
      // Chunk failed — try row-by-row to save what we can
      let chunkPushed = 0;
      for (const stmt of chunk) {
        try {
          await queryD1(stmt);
          chunkPushed++;
          pushed++;
        } catch {
          skipped++;
          failures++;
        }
      }
      if (chunkPushed < chunk.length) {
        process.stdout.write(`\n  ⚠️  Chunk ${ci+1}: ${chunkPushed}/${chunk.length} ok (error: ${(e as Error).message.slice(0, 80)})\n`);
      }
    }

    // Progress
    const pct     = ((ci + 1) / chunks.length * 100).toFixed(1);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
    const rate    = pushed / Math.max(1, (Date.now() - startMs) / 60000);
    process.stdout.write(
      `\r  [${(ci+1).toString().padStart(4)}/${chunks.length}] ${pct.padStart(5)}% | ✅${pushed} ⛔${failures} | ${rate.toFixed(0)} rows/min | ${elapsed}s   `
    );

    // Brief pause between chunks to avoid hammering the API
    if (ci + 1 < chunks.length) {
      await sleep(75);
    }
  }

  // Final report
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const rate    = (pushed / Math.max(1, Number(elapsed) / 60)).toFixed(0);
  console.log('\n\n' + '═'.repeat(68));
  console.log(`✅ D1 Push Complete!`);
  console.log(`   Pushed:   ${pushed} rows`);
  console.log(`   Skipped:  ${skipped} rows (duplicates / errors)`);
  console.log(`   Failures: ${failures}`);
  console.log(`   Speed:    ${rate} rows/min`);
  console.log(`   Time:     ${elapsed}s`);
  console.log('═'.repeat(68));

  if (failures > 0 && pushed === 0) {
    console.error('\n❌ All inserts failed. Check your D1 token and schema.');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('\n💥 FATAL:', (e as Error).message);
  process.exit(1);
});
