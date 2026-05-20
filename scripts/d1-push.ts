/**
 * ExamCompass D1 Pusher — uses Cloudflare REST API directly
 * Splits seed.sql into individual statements and pushes in batches of 10
 * Handles multi-line INSERT statements correctly
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use D1-specific token (separate from deployment token)
const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN!;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';
const SEED_FILE  = path.join(__dirname, 'seed.sql');
const BATCH_SIZE = 10; // statements per API call

if (!TOKEN || !ACCOUNT_ID) {
  console.error('❌ Missing CLOUDFLARE_D1_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env');
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;

async function d1Query(sql: string): Promise<any> {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  const data: any = await res.json();
  if (!res.ok || !data.success) {
    const errMsg = data.errors?.[0]?.message || JSON.stringify(data);
    throw new Error(`D1 API error: ${errMsg}`);
  }
  return data.result;
}

function parseSQLStatements(content: string): string[] {
  const separator = 'INSERT OR IGNORE INTO questions (';
  const parts = content.split(separator);
  const statements: string[] = [];
  
  for (let i = 1; i < parts.length; i++) {
    const stmt = separator + parts[i].trim();
    if (stmt.endsWith(');')) {
      statements.push(stmt);
    } else {
      const lastIndex = stmt.lastIndexOf(');');
      if (lastIndex !== -1) {
        statements.push(stmt.substring(0, lastIndex + 2));
      }
    }
  }
  return statements;
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 ExamCompass D1 Pusher');
  console.log(`   DB: ${DB_ID}`);
  console.log(`   File: ${SEED_FILE}`);
  console.log('═'.repeat(60));

  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ seed.sql not found at ${SEED_FILE}`);
    process.exit(1);
  }

  // Test connection first
  console.log('\n🔗 Testing D1 connection...');
  try {
    const result = await d1Query('SELECT COUNT(*) as count FROM questions');
    const existing = result?.[0]?.results?.[0]?.count ?? 0;
    console.log(`✅ Connected! Existing questions in DB: ${existing}`);
  } catch (e: any) {
    // Table might not exist yet — that's OK
    if (e.message.includes('no such table')) {
      console.log('⚠️  questions table not found. Run schema first:');
      console.log('   $env:CLOUDFLARE_API_TOKEN="..." ; npx wrangler d1 execute examcompass-questions --file=scripts/d1-schema.sql --remote');
      process.exit(1);
    }
    console.error('❌ Connection failed:', e.message);
    process.exit(1);
  }

  // Parse SQL
  console.log('\n📖 Parsing seed.sql...');
  const content = fs.readFileSync(SEED_FILE, 'utf-8');
  const statements = parseSQLStatements(content);
  console.log(`📦 Found ${statements.length} INSERT statements`);

  if (statements.length === 0) {
    console.log('✅ Nothing to insert!');
    return;
  }

  // Push in batches
  let pushed = 0;
  let skipped = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);
    
    // Execute each statement individually (D1 API handles one SQL at a time)
    for (const stmt of batch) {
      try {
        await d1Query(stmt);
        pushed++;
      } catch (e: any) {
        if (e.message.includes('UNIQUE constraint') || e.message.includes('already exists')) {
          skipped++;
        } else {
          errors++;
          if (errors <= 5) console.error(`  ❌ Error: ${e.message.slice(0, 100)}`);
        }
      }
    }

    // Progress
    const done = Math.min(i + BATCH_SIZE, statements.length);
    const pct = (done / statements.length * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = pushed / elapsed * 60;
    const eta = rate > 0 ? Math.round((statements.length - done) / rate * 60) : '?';
    process.stdout.write(
      `\r  [${pct}%] ${done}/${statements.length} | ✅ ${pushed} pushed | ⏭ ${skipped} skipped | ❌ ${errors} errors | ${rate.toFixed(0)}/min | ETA: ${eta}s   `
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`✅ DONE in ${elapsed}s`);
  console.log(`   Pushed:  ${pushed}`);
  console.log(`   Skipped: ${skipped} (duplicates)`);
  console.log(`   Errors:  ${errors}`);

  // Verify
  try {
    const result = await d1Query('SELECT COUNT(*) as count FROM questions');
    const total = result?.[0]?.results?.[0]?.count ?? '?';
    console.log(`   DB now has: ${total} questions`);
  } catch {}
  console.log('═'.repeat(60));
}

main().catch(e => {
  console.error('\n❌ Fatal:', e.message);
  process.exit(1);
});
