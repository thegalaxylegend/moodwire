import 'dotenv/config';

const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN!;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '') || process.env.CLOUDFLARE_ACCOUNT_ID!;
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';

if (!TOKEN || !ACCOUNT_ID) {
  console.error('❌ Missing CLOUDFLARE_D1_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env');
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data: any = await res.json();
  if (!res.ok || !data.success) {
    const errMsg = data.errors?.[0]?.message || JSON.stringify(data);
    throw new Error(`D1 API error: ${errMsg}`);
  }
  return data.result;
}

async function main() {
  console.log('🔗 Connecting to remote D1 to inspect curated_playlists...');
  try {
    // 1. Inspect table info/schema
    const infoResult = await d1Query("PRAGMA table_info(curated_playlists)");
    const columns = infoResult?.[0]?.results || [];
    console.log('\n📊 Schema for "curated_playlists":');
    console.table(columns);

    // 2. Count rows
    const countResult = await d1Query("SELECT COUNT(*) as count FROM curated_playlists");
    const count = countResult?.[0]?.results?.[0]?.count ?? 0;
    console.log(`\n📈 Total rows in "curated_playlists": ${count}`);

    // 3. Fetch sample rows
    if (count > 0) {
      console.log('\n🎥 Sample curated playlists (top 5):');
      const samplesResult = await d1Query("SELECT * FROM curated_playlists LIMIT 5");
      console.log(JSON.stringify(samplesResult?.[0]?.results, null, 2));
    }
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  }
}

main();
