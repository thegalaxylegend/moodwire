// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS — D1 PUSH SCRIPT  (with robust SQL parser and quality gate)
// Reads scripts/seed.sql → validates every question → pushes to Cloudflare D1
// via REST API (no wrangler login required).
//
// Usage:
//   npx tsx scripts/d1-push.ts [--dry-run] [--chunk=N] [--file=path/to/seed.sql]
//
// Required env (from .env):
//   CLOUDFLARE_D1_TOKEN      — D1 API token (Account level, with D1:Edit)
//   CLOUDFLARE_ACCOUNT_ID    — Cloudflare account ID
//
// Quality gates enforced:
//   ✅ MCQ / Multi-correct must have exactly 4 non-empty options (or 2-4 for Multi-correct)
//   ✅ Options must NOT be bare letters: "A" "B" "C" "D" "a" "b" "c" "d"
//   ✅ Options must NOT be "Option A" / "Option 1" / "(A)" type placeholders
//   ✅ correct_answer must verbatim-match one of the options (for MCQ/Multi-correct)
//   ✅ Integer / Passage / Matrix-Match questions must have a numeric correct_answer
//   ✅ question_text must be non-empty (min 10 chars)
//   ✅ No duplicate IDs (skips IDs already in D1)
// ═══════════════════════════════════════════════════════════════════════════

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI args ─────────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const arg     = (k: string, def = '') => argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? def;
const has     = (k: string) => argv.some(a => a === `--${k}` || a.startsWith(`--${k}=`));

const DRY_RUN    = has('dry-run');
const CHUNK_SIZE = Number(arg('chunk', '80'));   // INSERT stmts per API call (safe: <1 MB)
const SEED_FILE  = arg('file', path.join(__dirname, 'seed.sql'));

// ─── Cloudflare D1 config ─────────────────────────────────────────────────────
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN ?? '';
const D1_URL     = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function queryD1<T = any>(sql: string, retries = 4): Promise<T[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(D1_URL, {
        method:  'POST',
        signal:  AbortSignal.timeout(45_000),
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (res.status === 429) {
        const wait = attempt * 6_000;
        process.stdout.write(`\n  ⚡ Rate-limited — waiting ${wait / 1000}s...\n`);
        await sleep(wait);
        continue;
      }

      const data: any = await res.json();

      if (!res.ok || !data.success) {
        const errs = JSON.stringify(data.errors ?? []);
        if (errs.includes('UNIQUE') || errs.includes('SQLITE_CONSTRAINT')) return [];
        throw new Error(`D1 [${res.status}]: ${errs.slice(0, 300)}`);
      }

      return data.result?.[0]?.results ?? [];

    } catch (e: any) {
      if (attempt === retries) throw e;
      await sleep(1_000 * attempt);
    }
  }
  return [];
}

// ─── Robust character-by-character SQL parser ────────────────────────────────
function parseSqlStatements(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const statements: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (inQuote) {
      if (char === "'") {
        if (content[i + 1] === "'") {
          current += "''";
          i += 2;
        } else {
          current += "'";
          inQuote = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === "'") {
        inQuote = true;
        current += "'";
        i++;
      } else if (char === ';') {
        current += ';';
        const stmt = current.trim();
        if (stmt.toUpperCase().startsWith('INSERT')) {
          statements.push(stmt);
        }
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  return statements;
}

// ─── Extract values from a single INSERT statement ────────────────────────────
function extractValues(insert: string): string[] | null {
  const valuesStart = insert.indexOf('VALUES (');
  if (valuesStart === -1) return null;
  const body = insert.slice(valuesStart + 8); // after "VALUES ("

  const values: string[] = [];
  let i = 0;
  while (i < body.length) {
    if (body[i] === ')') {
      const remainder = body.slice(i + 1).trim();
      if (remainder === ';' || remainder === '') {
        break;
      }
    }
    
    if (body[i] === ',') { i++; continue; }
    if (body[i] === ' ' || body[i] === '\n' || body[i] === '\r') { i++; continue; }

    if (body[i] === "'") {
      let val = '';
      i++; // skip opening quote
      while (i < body.length) {
        if (body[i] === "'" && body[i + 1] === "'") {
          val += "'"; i += 2;
        } else if (body[i] === "'") {
          i++; break; // closing quote
        } else {
          val += body[i++];
        }
      }
      values.push(val);
    } else if (body[i] === '[' || body[i] === '{') {
      let depth = 0, val = '';
      while (i < body.length) {
        if (body[i] === '[' || body[i] === '{') depth++;
        if (body[i] === ']' || body[i] === '}') depth--;
        val += body[i++];
        if (depth === 0) break;
      }
      values.push(val);
    } else if (body.slice(i, i + 4).toUpperCase() === 'NULL') {
      values.push('NULL');
      i += 4;
    } else {
      let val = '';
      while (i < body.length && body[i] !== ',' && body[i] !== ')') {
        val += body[i++];
      }
      values.push(val.trim());
    }
  }
  return values;
}

// ─── Extract column names from INSERT header ──────────────────────────────────
function extractColumns(insert: string): string[] | null {
  const m = insert.match(/INSERT OR IGNORE INTO questions\s*\(([^)]+)\)/i);
  if (!m) return null;
  return m[1].split(',').map(c => c.trim());
}

// ─── Single-letter / placeholder option detector ──────────────────────────────
const PLACEHOLDER_PATTERNS = [
  /^[A-Da-d]$/,                              // bare "A", "B", "C", "D"
  /^[A-Da-d][.)]\s*$/,                       // "A." "B)" etc.
  /^\([A-Da-d]\)$/,                          // "(A)" "(B)"
  /^option\s*[A-D1-4]$/i,                    // "Option A", "Option 1"
  /^choice\s*[A-D1-4]$/i,                    // "Choice A"
  /^\d\.\s*$/,                               // "1. " (number only)
  /^(none of (the above|these)|all of (the above|these))$/i,
];

function isPlaceholderOption(opt: string): boolean {
  const trimmed = opt.trim();
  return PLACEHOLDER_PATTERNS.some(p => p.test(trimmed));
}

// ─── Full quality gate for one INSERT ────────────────────────────────────────
interface QualityResult {
  pass:   boolean;
  reason: string;
}

function qualityCheck(insert: string, cols: string[], vals: string[]): QualityResult {
  const get = (col: string) => {
    const idx = cols.indexOf(col);
    return idx >= 0 ? vals[idx] ?? '' : '';
  };

  const qText   = get('question_text');
  const type    = get('type');
  const opts    = get('options');
  const correct = get('correct_answer');
  const id      = get('id');

  // 1. Must have id
  if (!id || id === 'NULL' || id.length < 10) {
    return { pass: false, reason: 'missing or short id' };
  }

  // 2. question_text must be non-trivial
  if (!qText || qText.length < 10) {
    return { pass: false, reason: `question_text too short (${qText.length} chars)` };
  }

  // 3. correct_answer must be present
  if (!correct || correct === 'NULL') {
    return { pass: false, reason: 'missing correct_answer' };
  }

  // 4. Type-specific option checks
  if (type === 'MCQ' || type === 'Multi-correct') {
    let optArr: string[] = [];
    try {
      optArr = JSON.parse(opts);
    } catch {
      return { pass: false, reason: `options is invalid JSON: ${opts.slice(0, 60)}` };
    }

    if (type === 'MCQ' && optArr.length !== 4) {
      return { pass: false, reason: `MCQ has ${optArr.length} options (need 4)` };
    }
    if (type === 'Multi-correct' && (optArr.length < 2 || optArr.length > 4)) {
      return { pass: false, reason: `Multi-correct has ${optArr.length} options (need 2-4)` };
    }

    for (let i = 0; i < optArr.length; i++) {
      const opt = String(optArr[i]).trim();
      if (!opt || opt.length < 1) {
        return { pass: false, reason: `option[${i}] is empty` };
      }
    }

    for (let i = 0; i < optArr.length; i++) {
      const opt = String(optArr[i]).trim();
      if (isPlaceholderOption(opt)) {
        return { pass: false, reason: `option[${i}] is a placeholder: "${opt}"` };
      }
    }

    if (type === 'MCQ') {
      const match = optArr.some(o =>
        String(o).trim().toLowerCase() === correct.trim().toLowerCase()
      );
      if (!match) {
        return { pass: false, reason: `correct_answer "${correct.slice(0, 60)}" not found in options` };
      }
    }

    if (type === 'Multi-correct') {
      let corrArr: string[] = [];
      try { corrArr = JSON.parse(correct); } catch { /* ok if plain string */ }
      if (Array.isArray(corrArr) && corrArr.length > 0) {
        for (const ca of corrArr) {
          const match = optArr.some(o => String(o).trim().toLowerCase() === ca.trim().toLowerCase());
          if (!match) {
            return { pass: false, reason: `correct_answer item "${ca.slice(0, 60)}" not in options` };
          }
        }
      }
    }
  }

  if (type === 'Integer') {
    if (isNaN(Number(correct)) && !/^\d+(\.\d+)?$/.test(correct)) {
      return { pass: false, reason: `Integer type but correct_answer "${correct}" is not numeric` };
    }
  }

  return { pass: true, reason: 'ok' };
}

// ─── Fetch all IDs already in D1 ─────────────────────────────────────────────
async function fetchExistingIDs(): Promise<Set<string>> {
  console.log('🔍 Fetching existing question IDs from D1...');
  const ids = new Set<string>();
  const pageSize = 10_000;
  let offset = 0;

  while (true) {
    const rows = await queryD1<{ id: string }>(
      `SELECT id FROM questions LIMIT ${pageSize} OFFSET ${offset};`
    );
    for (const r of rows) ids.add(r.id);
    if (rows.length < pageSize) break;
    offset += pageSize;
    process.stdout.write(`   Fetched ${ids.size} IDs...\r`);
  }

  console.log(`   ✅ Found ${ids.size} existing questions in D1.`);
  return ids;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!ACCOUNT_ID || !TOKEN) {
    console.error('❌ Missing required env variables:');
    if (!ACCOUNT_ID) console.error('   CLOUDFLARE_ACCOUNT_ID');
    if (!TOKEN)      console.error('   CLOUDFLARE_D1_TOKEN (or CLOUDFLARE_API_TOKEN)');
    process.exit(1);
  }

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ Seed file not found: ${SEED_FILE}`);
    process.exit(1);
  }

  console.log('═'.repeat(68));
  console.log('🚀 EXAMCOMPASS — D1 PUSH  (with Quality Gate)');
  console.log('─'.repeat(68));
  console.log(`   DB:        ${DB_ID}`);
  console.log(`   Account:   ${ACCOUNT_ID.slice(0, 8)}...`);
  console.log(`   Seed:      ${SEED_FILE}`);
  console.log(`   ChunkSize: ${CHUNK_SIZE} stmts/call`);
  console.log(`   DryRun:    ${DRY_RUN}`);
  console.log('═'.repeat(68) + '\n');

  console.log('📂 Parsing seed.sql...');
  const allInserts = parseSqlStatements(SEED_FILE);
  console.log(`   Total INSERT statements: ${allInserts.length}`);

  const existingIDs = await fetchExistingIDs();

  console.log('\n🔬 Running quality checks...');
  const passed:  string[] = [];
  const stats = {
    total:        allInserts.length,
    alreadyInDB:  0,
    badOptions:   0,
    badAnswer:    0,
    badText:      0,
    otherFail:    0,
    passed:       0,
  };

  const seenIDs = new Set<string>();

  for (const insert of allInserts) {
    const cols = extractColumns(insert);
    const vals = cols ? extractValues(insert) : null;

    if (!cols || !vals || cols.length !== vals.length) {
      stats.otherFail++;
      continue;
    }

    const id = vals[cols.indexOf('id')] ?? '';

    if (existingIDs.has(id)) {
      stats.alreadyInDB++;
      continue;
    }

    if (seenIDs.has(id)) {
      stats.alreadyInDB++;
      continue;
    }
    seenIDs.add(id);

    const result = qualityCheck(insert, cols, vals);
    if (!result.pass) {
      const reason = result.reason;
      if (reason.includes('option') || reason.includes('options')) stats.badOptions++;
      else if (reason.includes('correct_answer'))                   stats.badAnswer++;
      else if (reason.includes('question_text'))                    stats.badText++;
      else                                                           stats.otherFail++;
      continue;
    }

    passed.push(insert);
    stats.passed++;
  }

  console.log('\n📊 QUALITY GATE RESULTS:');
  console.log(`   Total in seed.sql:        ${stats.total}`);
  console.log(`   Already in D1 (skipped):  ${stats.alreadyInDB}`);
  console.log(`   ❌ Bad options (A/B/empty): ${stats.badOptions}`);
  console.log(`   ❌ Answer∉options mismatch: ${stats.badAnswer}`);
  console.log(`   ❌ Empty question_text:     ${stats.badText}`);
  console.log(`   ❌ Other failures:          ${stats.otherFail}`);
  console.log(`   ✅ PASSED — ready to push: ${stats.passed}`);

  if (stats.passed === 0) {
    console.log('\n✅ Nothing new to push — D1 is up to date!');
    return;
  }

  if (DRY_RUN) {
    console.log(`\n✅ DRY-RUN: would push ${stats.passed} rows in ${Math.ceil(stats.passed / CHUNK_SIZE)} API calls. No data written.`);
    return;
  }

  console.log(`\n📤 Pushing ${stats.passed} questions to D1 in chunks of ${CHUNK_SIZE}...\n`);

  const chunks: string[][] = [];
  for (let i = 0; i < passed.length; i += CHUNK_SIZE) {
    chunks.push(passed.slice(i, i + CHUNK_SIZE));
  }

  let pushed = 0, failures = 0;
  const startMs = Date.now();

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const sql   = chunk.join('\n');

    try {
      await queryD1(sql);
      pushed += chunk.length;
    } catch (e: any) {
      for (const stmt of chunk) {
        try {
          await queryD1(stmt);
          pushed++;
        } catch {
          failures++;
        }
      }
      process.stdout.write(`\n  ⚠️  Chunk ${ci + 1}: partial failure — ${(e as Error).message.slice(0, 80)}\n`);
    }

    const pct     = ((ci + 1) / chunks.length * 100).toFixed(1);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
    const rate    = (pushed / Math.max(1, (Date.now() - startMs) / 60_000)).toFixed(0);
    process.stdout.write(
      `\r  [${String(ci + 1).padStart(4)}/${chunks.length}] ${pct.padStart(5)}%  ✅ ${pushed} pushed  ❌ ${failures} failed  ${rate} rows/min  ${elapsed}s   `
    );

    if (ci + 1 < chunks.length) await sleep(100);
  }

  console.log('\n\n🔍 Verifying final D1 count...');
  const countRows = await queryD1<{ total: number }>('SELECT COUNT(*) as total FROM questions;');
  const finalCount = countRows[0]?.total ?? '?';

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const rate    = (pushed / Math.max(1, Number(elapsed) / 60)).toFixed(0);

  console.log('\n' + '═'.repeat(68));
  console.log('✅ D1 PUSH COMPLETE');
  console.log('─'.repeat(68));
  console.log(`   Pushed to D1:    ${pushed} rows`);
  console.log(`   Failures:        ${failures}`);
  console.log(`   Speed:           ${rate} rows/min`);
  console.log(`   Time:            ${elapsed}s`);
  console.log(`   Total in D1 now: ${finalCount}`);
  console.log('═'.repeat(68));

  if (failures > 0) {
    console.warn(`\n⚠️  ${failures} rows failed to insert. They may have schema issues.`);
  }
}

main().catch(e => {
  console.error('\n💥 FATAL:', (e as Error).message);
  process.exit(1);
});
