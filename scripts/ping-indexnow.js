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
    const host = process.env.INDEXNOW_HOST || HOST;
    const key = process.env.INDEXNOW_KEY || KEY;
    const keyLocation = process.env.INDEXNOW_KEY_LOCATION || `https://${host}/${key}.txt`;

    console.log(`🚀 Starting IndexNow Submission${DRY_RUN ? ' (DRY RUN)' : ''}...`);
    console.log(`🌐 Target Host: ${host}`);

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ SEO Manifest not found. Skipping IndexNow submission.');
        return; // Don't exit with 1, just skip if manifest isn't there yet
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        const urls = Object.keys(manifest).map(url => {
            let path = url;
            if (path !== '/' && !path.endsWith('/')) {
                path += '/';
            }
            return `https://${host}${path}`;
        });

        if (urls.length === 0) {
            console.warn('⚠️ No URLs found in manifest.');
            return;
        }

        console.log(`📦 Found ${urls.length} URLs. Batching for submission...`);

        const BATCH_SIZE = 5000;
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batch = urls.slice(i, i + BATCH_SIZE);
            const data = {
                host: host,
                key: key,
                keyLocation: keyLocation,
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

        // Google and other modern engines now rely on robots.txt and manual GSC submission.
        console.log('✅ IndexNow notified successfully. Google will crawl via sitemap.xml in robots.txt.');

    } catch (error) {
        console.error('❌ IndexNow Error:', error.message);
        process.exit(1);
    }
}

pingIndexNow();
