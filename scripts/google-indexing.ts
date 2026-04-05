import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import 'dotenv/config';

import { JWT } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLUGS_FILE = path.join(__dirname, '../generated-slugs.txt');
const HOST = 'https://examcompass.pages.dev';
const MANIFEST_FILE = path.join(__dirname, '../public/seo-manifest.json');
const MAX_DAILY_INDEXING = 200;

async function indexNewUrls() {
    console.log('🚀 Checking for new URLs to index via Google Indexing API...');

    if (!fs.existsSync(SLUGS_FILE)) {
        console.log('📭 No generated-slugs.txt found. Skipping.');
        return;
    }

    // Remove null bytes caused if powershell generated the UTF-16LE text file
    const raw = fs.readFileSync(SLUGS_FILE, 'utf8').replace(/\0/g, '').replace(/^\uFEFF/, '');
    
    const slugs = raw
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    if (slugs.length === 0) {
        console.log('📭 No new slugs to index today.');
        return;
    }

    // Load credentials from environment variable or local file
    const KEY_FILE = path.join(__dirname, '../service-account.json');
    let credentials;
    
    if (process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT) {
        try {
            credentials = JSON.parse(process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT);
        } catch (e: any) {
            console.error('❌ Failed to parse GOOGLE_INDEXING_SERVICE_ACCOUNT JSON:', e.message);
            process.exit(1);
        }
    } else if (fs.existsSync(KEY_FILE)) {
        console.log('📂 Using service-account.json for authentication...');
        credentials = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
    } else {
        console.error('❌ GOOGLE_INDEXING_SERVICE_ACCOUNT is missing in environment variables and service-account.json not found.');
        process.exit(1);
    }

    console.log(`📦 Found ${slugs.length} new URLs. Authenticating with Google...`);

    const auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });

    // Load SEO Manifest to check types
    let manifest: any = {};
    if (fs.existsSync(MANIFEST_FILE)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    }

    const results: any[] = [];
    let indexingCount = 0;
    let sitemapPingSent = false;

    for (const slug of slugs) {
        const url = `${HOST}/blog/${slug}`;
        // Directly push blog URLs to the Indexing API instead of basic sitemap pings

        if (indexingCount >= MAX_DAILY_INDEXING) {
            console.log(`⚠️ Daily Indexing API quota reached (${MAX_DAILY_INDEXING}). Skipping ${slug}.`);
            results.push({ slug, url, status: 'Quota-Exceeded', timestamp: new Date().toISOString() });
            continue;
        }

        console.log(`📡 Pinging Google Indexing API for: ${url}...`);

        try {
            const res = await indexing.urlNotifications.publish({
                auth,
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED'
                }
            });
            console.log(`✅ Success for ${slug} (Status: ${res.status})`);
            indexingCount++;
            results.push({ slug, url, status: 'Success', timestamp: new Date().toISOString() });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            console.error(`❌ Indexing failed for ${slug}:`, errorMsg);
            results.push({ slug, url, status: 'Failed', error: errorMsg, timestamp: new Date().toISOString() });
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }

    // Save history to jules-reports
    const HISTORY_FILE = path.join(__dirname, '../public/jules-reports/indexing-history.json');
    let history: any[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {}
    }
    
    // Add new results and keep last 50
    const finalHistory = [...results, ...history].slice(0, 50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(finalHistory, null, 2));
    
    console.log(`\n📄 Indexing history updated: ${HISTORY_FILE}`);
    console.log('🏁 Google Indexing API task complete.');
}

indexNewUrls();
