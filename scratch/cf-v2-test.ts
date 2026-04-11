
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

async function fetchAlternativeAnalytics() {
    console.log(`📡 Querying Cloudflare Analytics Groups for: ${PROJECT_NAME}...`);
    
    const client = axios.create({
        baseURL: 'https://api.cloudflare.com/client/v4',
        headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const until = new Date().toISOString();

        // This is the new V2 analytics endpoint
        const res = await client.get(`/accounts/${CF_ACCOUNT_ID}/analytics_groups/pages_v2/summary`, {
            params: {
                since,
                until,
                limit: 10
            }
        });

        if (res.data.success) {
            console.log('✅ Success!');
            const results = res.data.result;
            const projectData = results.find((r: any) => r.dimensions.project_name === PROJECT_NAME);
            
            if (projectData) {
                console.log('📊 Result for examcompass:', JSON.stringify(projectData, null, 2));
            } else {
                console.log('⚠️ Project not found in account-wide summary.');
                console.log('📋 Available projects:', results.map((r: any) => r.dimensions.project_name));
            }
        }
    } catch (err: any) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

fetchAlternativeAnalytics();
