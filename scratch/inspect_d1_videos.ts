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
  console.log('🔗 Connecting to remote D1 to inspect video counts...');
  try {
    const countResult = await d1Query("SELECT is_available, COUNT(*) as count FROM discovered_videos GROUP BY is_available");
    console.log('Breakdown by is_available:');
    console.table(countResult?.[0]?.results || []);

    const allResult = await d1Query("SELECT * FROM discovered_videos");
    console.log(`Total rows retrieved directly: ${allResult?.[0]?.results?.length}`);
    console.log('All videos in DB:', allResult?.[0]?.results?.map((v: any) => ({
      id: v.id,
      title: v.title,
      chapter_id: v.chapter_id,
      is_available: v.is_available
    })));
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  }
}

main();
