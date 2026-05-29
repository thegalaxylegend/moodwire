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
  console.log('🧪 Testing INSERT to discovered_videos...');
  try {
    const sql = `
      INSERT INTO discovered_videos (
        id, title, channel_name, thumbnail_url, duration, view_count,
        chapter_id, subtopic, subject, class, exam, score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        score = EXCLUDED.score,
        fetched_at = (unixepoch())
    `;
    const params = [
      'test_video_id_123',
      'Test Video Title',
      'Test Channel',
      'https://img.youtube.com/vi/test_video_id_123/mqdefault.jpg',
      '10:00',
      '1K views',
      'che_12_solid_state',
      'Test Subtopic',
      'Chemistry',
      'Class 12',
      'JEE',
      95
    ];
    
    await d1Query(sql, params);
    console.log('✅ INSERT/UPSERT successful!');

    // Retrieve it to verify
    const selectRes = await d1Query("SELECT * FROM discovered_videos WHERE id = ?", ['test_video_id_123']);
    console.log('Verification retrieve:', JSON.stringify(selectRes?.[0]?.results, null, 2));

    // Delete it to clean up
    await d1Query("DELETE FROM discovered_videos WHERE id = ?", ['test_video_id_123']);
    console.log('🧹 Cleaned up test video.');
  } catch (e: any) {
    console.error('❌ Insertion test failed:', e.message);
  }
}

main();
