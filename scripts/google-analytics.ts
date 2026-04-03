/**
 * 📈 Google Analytics 4 (GA4) API Dashboard Data (Feature 3.2)
 * 
 * Fetches:
 * 1. 30-Day Growth: Active Users, Sessions, Pageviews
 * 2. Top Performing Pages: Views per URL
 * 3. Daily Traffic: For chart visualization
 * 
 * Run: npx tsx scripts/google-analytics.ts
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = path.join(__dirname, '../service-account.json');
const REPORTS_DIR = path.join(__dirname, '../public/jules-reports');
const OUTPUT_FILE = path.join(REPORTS_DIR, 'ga4-stats.json');

// Property ID extracted from user screenshot
const PROPERTY_ID = '518462579';

async function main() {
    console.log('\n📈 Google Analytics 4 Intelligence v1.0');
    console.log('Connecting to GA4 Data API...\n');

    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ service-account.json not found in root.');
        process.exit(1);
    }

    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    const auth = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    try {
        console.log(`📡 Fetching 30-day aggregate stats for Property: ${PROPERTY_ID}...`);

        // 1. Fetch Totals & Daily Growth
        const growthResponse = await analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'screenPageViews' },
                    { name: 'engagementRate' }
                ],
                orderBys: [{ dimension: { dimensionName: 'date' } }]
            }
        }) as any;

        // 2. Fetch Top Pages
        const pagesResponse = await analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }],
                limit: '50',
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
            }
        }) as any;

        // 3. Fetch Device Breakdown (New)
        const deviceResponse = await analyticsData.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'activeUsers' }]
            }
        }) as any;

        const dailyData = growthResponse.data.rows?.map((row: any) => ({
            date: row.dimensionValues?.[0]?.value,
            users: parseInt(row.metricValues?.[0]?.value || '0'),
            sessions: parseInt(row.metricValues?.[1]?.value || '0'),
            pageviews: parseInt(row.metricValues?.[2]?.value || '0')
        })) || [];

        const totals = {
            activeUsers: dailyData.reduce((acc: number, curr: any) => acc + curr.users, 0),
            sessions: dailyData.reduce((acc: number, curr: any) => acc + curr.sessions, 0),
            pageviews: dailyData.reduce((acc: number, curr: any) => acc + curr.pageviews, 0),
            engagementRate: growthResponse.data.totals?.[0]?.metricValues?.[3]?.value || '0',
            avgEngagementTime: growthResponse.data.totals?.[0]?.metricValues?.[4]?.value || '0'
        };

        const topPages = pagesResponse.data.rows?.map((row: any) => ({
            path: row.dimensionValues?.[0]?.value,
            views: parseInt(row.metricValues?.[0]?.value || '0')
        })) || [];

        const devices = deviceResponse.data.rows?.map((row: any) => ({
            category: row.dimensionValues?.[0]?.value,
            users: parseInt(row.metricValues?.[0]?.value || '0')
        })) || [];

        const finalReport = {
            lastUpdated: new Date().toISOString(),
            propertyId: PROPERTY_ID,
            totals,
            devices,
            dailyGrowth: dailyData,
            topPages: topPages.slice(0, 10) // Top 10 for dashboard
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalReport, null, 2));
        console.log(`✅ GA4 Report generated: ${OUTPUT_FILE}`);
        console.log(`📊 Active Users: ${totals.activeUsers} | Pageviews: ${totals.pageviews}\n`);

    } catch (error: any) {
        console.error('❌ Failed to fetch GA4 data:', error.message);
        if (error.code === 403) {
            console.error('💡 TIP: Ensure your service account email is added as a "Viewer" in GA4 Property Access Management.');
        }
    }
}

main();
