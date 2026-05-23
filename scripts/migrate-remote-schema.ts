import 'dotenv/config';

const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN!;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';

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

async function main() {
  console.log("Running remote schema migration via direct REST API...");
  
  const alterQueries = [
    "ALTER TABLE questions ADD COLUMN cognitive_level TEXT CHECK(cognitive_level IN ('Recall', 'Application', 'Multi-step', 'Proof-heavy', 'Olympiad-style')) DEFAULT 'Recall';",
    "ALTER TABLE questions ADD COLUMN last_repaired_at TEXT DEFAULT NULL;",
    "ALTER TABLE questions ADD COLUMN repair_version TEXT DEFAULT NULL;",
    "ALTER TABLE questions ADD COLUMN repair_notes TEXT DEFAULT NULL;"
  ];
  
  for (const sql of alterQueries) {
    try {
      console.log(`\nExecuting: ${sql}`);
      await d1Query(sql);
      console.log("✅ Column added successfully!");
    } catch (e: any) {
      if (e.message.includes("duplicate column name") || e.message.includes("already exists") || e.message.includes("duplicate")) {
        console.log("⚠️ Column already exists or table has it, skipping.");
      } else {
        console.error(`❌ Alter failed: ${e.message}`);
      }
    }
  }
  console.log("\nRemote schema migration completed!");
}

main().catch(console.error);
