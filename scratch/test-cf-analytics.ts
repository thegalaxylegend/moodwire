
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');
const PROJECT_NAME = 'examcompass';

async function testAnalytics() {
    console.log(`📡 Fetching analytics for Pages Project: ${PROJECT_NAME}...`);
    
    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        const res = await client.get(`/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/analytics/summary?since=2026-03-12T00:00:00Z`);
        console.log('✅ Success! Data sample:', JSON.stringify(res.data.result, null, 2).substring(0, 500));
    } catch (err: any) {
        console.error('❌ Analytics fetch failed:', err.response?.data || err.message);
    }
}

testAnalytics();
