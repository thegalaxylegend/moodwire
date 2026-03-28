import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLUGS_FILE = path.join(__dirname, '../generated-slugs.txt');
const HOST = 'https://examcompass.pages.dev';

async function indexNewUrls() {
    console.log('🚀 Checking for new URLs to index via Google Indexing API...');

    if (!fs.existsSync(SLUGS_FILE)) {
        console.log('📭 No generated-slugs.txt found. Skipping.');
        return;
    }

    const slugs = fs.readFileSync(SLUGS_FILE, 'utf8')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    if (slugs.length === 0) {
        console.log('📭 No new slugs to index today.');
        return;
    }

    // Load credentials from environment variable
    const serviceAccountJson = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
        console.error('❌ GOOGLE_INDEXING_SERVICE_ACCOUNT is missing in environment variables.');
        process.exit(1);
    }

    let credentials;
    try {
        credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
        console.error('❌ Failed to parse GOOGLE_INDEXING_SERVICE_ACCOUNT JSON:', e.message);
        process.exit(1);
    }

    console.log(`📦 Found ${slugs.length} new URLs. Authenticating with Google...`);

    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/indexing'],
        undefined
    );

    const indexing = google.indexing('v3');

    for (const slug of slugs) {
        const url = `${HOST}/blog/${slug}`;
        console.log(`📡 Pinging Google for: ${url}...`);

        try {
            const res = await indexing.urlNotifications.publish({
                auth,
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED'
                }
            });
            console.log(`✅ Success for ${slug} (Status: ${res.status})`);
        } catch (err: any) {
            console.error(`❌ Indexing failed for ${slug}:`, err.response?.data?.error?.message || err.message);
        }
        
        // Anti-rate-limit sleep
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('🏁 Google Indexing API task complete.');
}

indexNewUrls();
