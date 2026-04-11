
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

async function explore() {
    console.log(`🌌 Starting Cloudflare Analytics Deep Probe...`);
    const endpoints = [
        `/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/analytics/summary`,
        `/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/analytics/report`,
        `/accounts/${CF_ACCOUNT_ID}/analytics_groups/pages_v2/summary?filter=project_name==${PROJECT_NAME}`,
        `/accounts/${CF_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`
    ];

    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
    });

    for (const url of endpoints) {
        console.log(`\n📡 Testing: ${url}`);
        try {
            const res = await client.get(url);
            if (res.data.success) {
                const keys = Object.keys(res.data.result || {});
                console.log(`✅ Success! Keys received: ${keys.join(', ').slice(0, 100)}`);
                if (keys.includes('requests')) {
                    console.log('🎯 FOUND DATA at this endpoint!');
                }
            } else {
                console.log(`❌ API Error: ${JSON.stringify(res.data.errors)}`);
            }
        } catch (err: any) {
            console.log(`❌ Fail: ${err.message}`);
        }
    }
}

explore();
