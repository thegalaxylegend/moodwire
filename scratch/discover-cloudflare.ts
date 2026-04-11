
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');

async function discover() {
    console.log('🔍 Cloudflare Discovery Phase...');
    
    if (!CF_TOKEN || !CF_ACCOUNT_ID) {
        console.error('❌ Missing Cloudflare credentials in .env');
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
        // 1. List Pages Projects
        console.log('\n📁 Listing Pages Projects...');
        const pagesRes = await client.get(`/accounts/${CF_ACCOUNT_ID}/pages/projects`);
        const projects = pagesRes.data.result || [];
        projects.forEach((p: any) => {
            console.log(` - Project: ${p.name} (Subdomain: ${p.subdomain})`);
        });

        // 2. List Zones
        console.log('\n🌐 Listing Zones...');
        const zonesRes = await client.get('/zones');
        const zones = zonesRes.data.result || [];
        zones.forEach((z: any) => {
            console.log(` - Zone: ${z.name} (ID: ${z.id})`);
        });

    } catch (err: any) {
        console.error('❌ Discovery failed:', err.response?.data || err.message);
    }
}

discover();
