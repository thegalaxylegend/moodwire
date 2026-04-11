
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');

async function testAIUsage() {
    console.log(`📡 Fetching Workers AI Usage for Account: ${CF_ACCOUNT_ID}...`);
    
    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        // Trying AI usage or account-level summary
        const res = await client.get(`/accounts/${CF_ACCOUNT_ID}/ai/models`);
        console.log('✅ Success! Found accessible AI models. Token has AI access.');
        
        // Try usage stats
        const usageRes = await client.get(`/accounts/${CF_ACCOUNT_ID}/ai/usage?since=2026-03-31T00:00:00Z`);
        console.log('📈 Usage statistics retrieved!');
        console.log(JSON.stringify(usageRes.data.result, null, 2));
    } catch (err: any) {
        console.error('❌ Cloudflare AI Analytics fetch failed:', err.response?.data || err.message);
    }
}

testAIUsage();
