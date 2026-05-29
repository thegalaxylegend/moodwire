import 'dotenv/config';

const TOKEN      = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN!;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '') || process.env.CLOUDFLARE_ACCOUNT_ID!;

if (!TOKEN || !ACCOUNT_ID) {
  console.error('❌ Missing CLOUDFLARE_D1_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env');
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database`;

async function main() {
  console.log('🔗 Fetching D1 databases list from Cloudflare...');
  try {
    const res = await fetch(API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    const data: any = await res.json();
    if (!res.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || JSON.stringify(data);
      throw new Error(`Cloudflare API error: ${errMsg}`);
    }
    console.log('\n📊 Databases found:');
    console.log(JSON.stringify(data.result, null, 2));
  } catch (e: any) {
    console.error('❌ Error listing D1 databases:', e.message);
  }
}

main();
