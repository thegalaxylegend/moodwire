import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = path.join(__dirname, '../service-account.json');
const SITE_URL = 'https://examcompass.pages.dev/';

async function inspectUrls() {
    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ service-account.json not found in root.');
        process.exit(1);
    }

    let key;
    try {
        key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    } catch (parseErr) {
        console.error(`❌ Failed to parse service-account.json: ${parseErr.message}`);
        process.exit(1);
    }
    
    const auth = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const urlsToTest = [
        'https://examcompass.pages.dev/',
        'https://examcompass.pages.dev/jee-mains',
        'https://examcompass.pages.dev/jee-mains/physics/kinematics'
    ];

    console.log('🔍 Running Phase 5 GSC Diagnostics (URL Inspection API)...\n');

    for (const testUrl of urlsToTest) {
        console.log(`📡 Inspecting: ${testUrl}`);
        try {
            const res = await searchconsole.urlInspection.index.inspect({
                requestBody: {
                    inspectionUrl: testUrl,
                    siteUrl: SITE_URL,
                    languageCode: 'en-US'
                }
            });
            const result = res.data.inspectionResult;
            console.log(`   - Coverage State: ${result.indexStatusResult.coverageState}`);
            console.log(`   - Index Status: ${result.indexStatusResult.verdict}`);
            console.log(`   - Last Crawled: ${result.indexStatusResult.lastCrawlTime || 'Never'}`);
            console.log(`   - Page Fetch State: ${result.indexStatusResult.pageFetchState}`);
        } catch (error) {
            console.error(`   ❌ Failed to inspect ${testUrl}:`, error.message);
        }
        console.log('');
    }
}

inspectUrls();
