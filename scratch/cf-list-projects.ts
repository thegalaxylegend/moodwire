
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');

async function listProjects() {
    console.log(`🔍 Listing all Pages projects for Account: ${CF_ACCOUNT_ID}`);
    
    try {
        const res = await axios.get(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects`, {
            headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
        });

        if (res.data.success) {
            console.log('✅ Found projects:');
            res.data.result.forEach((p: any) => {
                console.log(`- ${p.name} (Subdomain: ${p.subdomain})`);
            });
        }
    } catch (err: any) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

listProjects();
