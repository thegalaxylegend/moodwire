import 'dotenv/config';

const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN!;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DB_ID      = '63abfee4-2340-47bd-a9ad-ebc4a9c50580';

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

async function main() {
  console.log('🔗 Testing remote D1 connection...');
  try {
    const result = await d1Query('SELECT COUNT(*) as count FROM questions');
    const count = result?.[0]?.results?.[0]?.count ?? 0;
    console.log(`✅ Success! Remote D1 has: ${count} questions`);
    
    // Group by exam and class to see breakdown
    console.log('\n📊 Remote Breakdown by Exam and Class:');
    const breakdown = await d1Query('SELECT exam, class, COUNT(*) as count FROM questions GROUP BY exam, class');
    console.table(breakdown?.[0]?.results || []);
  } catch (e: any) {
    console.error('❌ Error checking remote D1:', e.message);
  }
}

main();
