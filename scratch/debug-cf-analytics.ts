
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

async function debugAnalytics() {
    console.log(`🔍 Debugging Cloudflare Analytics for: ${PROJECT_NAME}`);
    
    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        const res = await client.get(`/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/analytics/summary`);
        console.log('📦 Raw Response Keys:', Object.keys(res.data));
        console.log('📦 Result Keys:', res.data.result ? Object.keys(res.data.result) : 'null');
        console.log('📦 Full Result Data:', JSON.stringify(res.data.result, null, 2));
    } catch (err: any) {
        console.error('❌ Request failed:', err.response?.data || err.message);
    }
}

debugAnalytics();
