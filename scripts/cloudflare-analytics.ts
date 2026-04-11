
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');
const REPORTS_DIR = path.join(__dirname, '../public/jules-reports');
const PROJECT_NAME = 'examcompass';

async function fetchCloudflareAnalytics() {
    console.log('\n☁️  Cloudflare Intelligence: Syncing Edge Analytics...');

    if (!CF_TOKEN || !CF_ACCOUNT_ID) {
        console.error('❌ Cloudflare credentials missing in .env');
        return;
    }

    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        // Fetch 30-day summary
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
        
        console.log(`📡 Requesting 30-day report for project: ${PROJECT_NAME}...`);
        
        const res = await client.get(`/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/analytics/summary`, {
            params: {
                since: thirtyDaysAgo
            }
        });

        if (res.data.success && res.data.result) {
            const data = res.data.result;
            
            // Check if analytics data actually exists in the response
            if (!data.requests || !data.bandwidth || !data.uniques) {
                console.warn('⚠️  Cloudflare returned project info but no analytics data.');
                console.log('💡 TIP: This usually means your API Token is missing "Account Analytics: Read" or "Pages: Read" permissions.');
                console.log('📦 Raw keys received:', Object.keys(data).join(', '));
                return;
            }

            const report = {
                last_updated: new Date().toISOString(),
                project: PROJECT_NAME,
                summary: {
                    total_requests: data.requests?.sum || 0,
                    total_bandwidth_bytes: data.bandwidth?.sum || 0,
                    unique_visitors: data.uniques?.sum || 0,
                    period_days: 30
                },
                raw_data: data
            };

            if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
            fs.writeFileSync(path.join(REPORTS_DIR, 'cloudflare-stats.json'), JSON.stringify(report, null, 2));
            
            console.log('✅ Cloudflare Intelligence synced successfully!');
            console.log(`📊 30-Day Visitors: ${(data.uniques?.sum || 0).toLocaleString()}`);
            console.log(`📡 Total Requests:  ${(data.requests?.sum || 0).toLocaleString()}`);
        } else {
            console.error('❌ Cloudflare API Error:', res.data.errors);
        }

    } catch (err: any) {
        if (err.response?.status === 401 || err.response?.data?.errors?.[0]?.code === 10000) {
            console.warn('⚠️ Cloudflare Auth Error: Token likely lacks "Account Analytics: Read" or "Pages: Read" permissions.');
        } else {
            console.error('❌ Cloudflare Fetch Failed:', err.response?.data || err.message);
        }
    }
}

fetchCloudflareAnalytics();
