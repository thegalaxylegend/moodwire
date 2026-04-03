/**
 * 📊 Google Search Console (GSC) API Intelligence (Feature 3.1)
 * 
 * Automatically pulls:
 * 1. Keywords (queries) with highest impressions
 * 2. Clicks & CTR for every blog URL
 * 3. Average position per topic
 * 4. Flags "low CTR" opportunities (high impressions but <2% CTR)
 * 
 * Run: npx tsx scripts/google-search-console.ts
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = path.join(__dirname, '../service-account.json');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const PUBLIC_REPORTS_DIR = path.join(__dirname, '../public/jules-reports');
const OUTPUT_FILE = path.join(REPORTS_DIR, 'search-intelligence.json');
const PUBLIC_OUTPUT_FILE = path.join(PUBLIC_REPORTS_DIR, 'search-intelligence.json');
const SITE_URL = 'https://examcompass.pages.dev';

async function main() {
    console.log('\n📊 Google Search Console Intelligence v1.0');
    console.log('Connecting to GSC API...\n');

    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ service-account.json not found in root.');
        process.exit(1);
    }

    const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    const auth = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    try {
        // Step 1: Pull search analytics for last 30 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        console.log(`📡 Fetching data from ${startDate} to ${endDate}...`);

        const response = await searchconsole.searchanalytics.query({
            siteUrl: SITE_URL,
            requestBody: {
                startDate,
                endDate,
                dimensions: ['page', 'query'],
                rowLimit: 5000,
            },
        });

        const rows = response.data.rows || [];
        console.log(`✅ Received ${rows.length} rows of data.\n`);

        if (rows.length === 0) {
            console.log('📊 No search data found. Property may be new or no keywords ranked.');
            return;
        }

        // Step 2: Analyze data
        const analyzedPages: Record<string, {
            impressions: number;
            clicks: number;
            ctr: number;
            position: number;
            topQueries: Array<{ query: string; impressions: number; clicks: number; ctr: number; position: number }>;
            isOpportunity: boolean;
        }> = {};

        rows.forEach((row: any) => {
            const [url, query] = row.keys;
            const impressions = row.impressions || 0;
            const clicks = row.clicks || 0;
            const ctr = (row.ctr || 0) * 100; // API returns decimal, convert to percentage
            const position = row.position || 0;

            if (!analyzedPages[url]) {
                analyzedPages[url] = { impressions: 0, clicks: 0, ctr: 0, position: 0, topQueries: [], isOpportunity: false };
            }

            analyzedPages[url].impressions += impressions;
            analyzedPages[url].clicks += clicks;
            analyzedPages[url].topQueries.push({ 
                query, 
                impressions, 
                clicks, 
                ctr: Math.round(ctr * 100) / 100,
                position: Math.round(position * 10) / 10
            });
        });

        // Step 3: Compute final averages and flag opportunities
        const opportunities: any[] = [];
        Object.entries(analyzedPages).forEach(([url, data]) => {
            data.ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
            data.ctr = Math.round(data.ctr * 100) / 100;
            
            // Average position for the page is the average of its queries (weighted by impressions would be better but this is fine for now)
            data.position = Math.round((data.topQueries.reduce((acc, q) => acc + q.position, 0) / data.topQueries.length) * 10) / 10;
            
            // Flag as opportunity if Impressions > 50 and CTR < 2.5%
            if (data.impressions > 50 && data.ctr < 2.5) {
                data.isOpportunity = true;
                opportunities.push({ url, impressions: data.impressions, ctr: data.ctr, topQuery: data.topQueries[0]?.query });
            }
            
            // Sort queries by impressions
            data.topQueries.sort((a, b) => b.impressions - a.impressions);
        });

        // Step 4: Summary Output and Global Top Keywords
        const queryMap: Record<string, { impressions: number; clicks: number }> = {};
        rows.forEach((row: any) => {
            const query = row.keys[1];
            if (!query) return;
            if (!queryMap[query]) queryMap[query] = { impressions: 0, clicks: 0 };
            queryMap[query].impressions += row.impressions || 0;
            queryMap[query].clicks += row.clicks || 0;
        });

        const globalTopKeywords = Object.entries(queryMap)
            .map(([query, stats]) => ({ query, ...stats }))
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 10);

        const top5 = opportunities.sort((a, b) => b.impressions - a.impressions).slice(0, 5);
        
        console.log('═'.repeat(60));
        console.log('🚀 SEARCH OPPORTUNITIES (High Impressions, Low CTR)');
        console.log('═'.repeat(60));
        top5.forEach(o => {
            console.log(`🔗 ${o.url.replace(SITE_URL, '')}`);
            console.log(`   👁️  ${o.impressions} Impr. | 📉 ${o.ctr}% CTR | 🔑 Top Query: "${o.topQuery}"`);
        });

        // Step 5: Save
        if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
        if (!fs.existsSync(PUBLIC_REPORTS_DIR)) fs.mkdirSync(PUBLIC_REPORTS_DIR, { recursive: true });

        const reportData = {
            generatedAt: new Date().toISOString(),
            dateRange: { startDate, endDate },
            totalRows: rows.length,
            opportunities: opportunities.length,
            globalTopKeywords,
            pages: analyzedPages
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(reportData, null, 2));
        fs.writeFileSync(PUBLIC_OUTPUT_FILE, JSON.stringify(reportData, null, 2));

        console.log(`\n📄 Intelligence saved: jules-reports/search-intelligence.json`);
        console.log(`📄 Public sync: public/jules-reports/search-intelligence.json`);
        console.log('✨ GSC Intelligence complete!\n');

    } catch (error: any) {
        if (error.message.includes('403') || error.message.includes('permission')) {
            console.error('❌ Permission Error: Please add the service account email as a user with "Full" or "Owner" permissions in Search Console.');
            console.error(`   Email: ${key.client_email}`);
        } else if (error.message.includes('404')) {
            console.error(`❌ Property not found: Ensure the URL "${SITE_URL}" is exactly as shown in GSC (with/without slash, http/https).`);
        } else {
            console.error('❌ GSC API Error:', error.message);
        }
        process.exit(1);
    }
}

main();
