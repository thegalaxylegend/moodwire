import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.join(__dirname, '../public/seo-manifest.json');
const KEY_PATH = path.join(__dirname, '../public/3154aa701b2948b49c70693382a1ad76.txt');
const HOST = 'examcompass.pages.dev';
const KEY = '3154aa701b2948b49c70693382a1ad76';
const KEY_LOCATION = `https://${HOST}/3154aa701b2948b49c70693382a1ad76.txt`;

const DRY_RUN = process.argv.includes('--dry-run');

async function pingIndexNow() {
    console.log(`🚀 Starting IndexNow Submission${DRY_RUN ? ' (DRY RUN)' : ''}...`);

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ SEO Manifest not found. Run seo:regen first.');
        process.exit(1);
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const urls = Object.keys(manifest).map(url => `https://${HOST}${url}`);

        if (urls.length === 0) {
            console.warn('⚠️ No URLs found in manifest.');
            return;
        }

        console.log(`📦 Found ${urls.length} URLs. Batching for submission...`);

        // IndexNow permits up to 10,000 URLs per post. 
        // We'll batch in 5,000 to be safe and responsive.
        const BATCH_SIZE = 5000;
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batch = urls.slice(i, i + BATCH_SIZE);
            const data = {
                host: HOST,
                key: KEY,
                keyLocation: KEY_LOCATION,
                urlList: batch
            };

            console.log(`📡 Pinging IndexNow with batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)...`);

            if (DRY_RUN) {
                console.log('🧪 Dry run: Skipping actual POST request.');
                continue;
            }

            const response = await fetch('https://www.bing.com/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} submitted successfully (Status: ${response.status})`);
            } else {
                const text = await response.text();
                console.error(`❌ Batch submission failed (Status: ${response.status}): ${text}`);
            }
        }

        console.log('🏁 IndexNow synchronization complete.');

    } catch (error) {
        console.error('❌ IndexNow Error:', error.message);
        process.exit(1);
    }
}

pingIndexNow();
