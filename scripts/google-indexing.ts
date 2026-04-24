import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import 'dotenv/config';

import { JWT } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'https://examcompass.pages.dev';
const MANIFEST_FILE = path.join(__dirname, '../public/seo-manifest.json');
const HISTORY_FILE = path.join(__dirname, '../public/jules-reports/indexing-history.json');
const MAX_DAILY_INDEXING = 200;

async function indexNewUrls() {
    console.log('🚀 Checking for new URLs to index via Google Indexing API...');

    // 1. Load SEO Manifest (Contains all 10,000+ URLs)
    let manifest: any = {};
    if (fs.existsSync(MANIFEST_FILE)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    } else {
        console.error('❌ seo-manifest.json not found! Run npm run seo:regen first.');
        process.exit(1);
    }

    const allPaths = Object.keys(manifest);
    console.log(`📦 Found ${allPaths.length} total URLs in manifest.`);

    // 2. Load History (To avoid wasting daily quota on already indexed URLs)
    let history: any[] = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {
            console.warn('⚠️ Could not parse indexing-history.json. Starting fresh.');
        }
    }

    // Keep track of URLs we have successfully indexed
    const indexedUrls = new Set(
        history
            .filter(item => item.status === 'Success')
            .map(item => item.url)
    );

    // 3. Find un-indexed URLs and prioritize them
    const unindexedPaths = allPaths.filter(p => !indexedUrls.has(`${HOST}${p}`));
    
    // Sort logic: Blogs first, then Topics, then Questions, then core pages
    unindexedPaths.sort((a, b) => {
        const scoreA = a.startsWith('/blog/') ? 4 : a.startsWith('/topic/') ? 3 : a.startsWith('/q/') ? 2 : 1;
        const scoreB = b.startsWith('/blog/') ? 4 : b.startsWith('/topic/') ? 3 : b.startsWith('/q/') ? 2 : 1;
        return scoreB - scoreA;
    });

    const targetPaths = unindexedPaths.slice(0, MAX_DAILY_INDEXING);

    if (targetPaths.length === 0) {
        console.log('📭 No new un-indexed URLs to push today. The site is fully indexed!');
        return;
    }

    console.log(`🎯 Selected ${targetPaths.length} high-priority URLs for today's quota.`);

    // 4. Authenticate with Google
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

    const auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing({ version: 'v3', auth });
    const results: any[] = [];
    let indexingCount = 0;

    // 5. Push to Google Indexing API
    for (const targetPath of targetPaths) {
        const url = `${HOST}${targetPath}`;

        console.log(`[${indexingCount + 1}/${targetPaths.length}] 📡 Pinging API for: ${url}`);

        try {
            const res = await indexing.urlNotifications.publish({
                auth,
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED' // Triggers Googlebot to crawl and index
                }
            });
            console.log(`  ✅ Success (Status: ${res.status})`);
            results.push({ path: targetPath, url, status: 'Success', timestamp: new Date().toISOString() });
            indexingCount++;
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            
            if (errorMsg.includes('Quota exceeded')) {
                console.log(`⚠️ Daily quota officially exceeded during push. Stopping here.`);
                break;
            }
            
            console.error(`  ❌ Indexing failed:`, errorMsg);
            results.push({ path: targetPath, url, status: 'Failed', error: errorMsg, timestamp: new Date().toISOString() });
        }
        
        // Small delay to prevent rate-limiting spikes
        await new Promise(r => setTimeout(r, 1000));
    }

    // 6. Save history so we don't duplicate work tomorrow
    const finalHistory = [...results, ...history];
    // Keep a robust log, maybe up to 100,000 entries so we don't forget old successes
    // But trim if it gets absurdly massive. 20,000 is safe.
    if (finalHistory.length > 20000) {
        finalHistory.length = 20000; 
    }
    
    // Ensure jules-reports directory exists
    const reportsDir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(finalHistory, null, 2));
    
    console.log(`\n📄 Indexing history updated: ${HISTORY_FILE}`);
    console.log(`🏁 Google Indexing API task complete. Successfully pushed ${indexingCount} URLs today.`);
}

indexNewUrls();
