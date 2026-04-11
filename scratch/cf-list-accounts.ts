
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');

async function listAccounts() {
    console.log(`🔍 Listing accounts accessible to token...`);
    
    try {
        const res = await axios.get('https://api.cloudflare.com/client/v4/accounts', {
            headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
        });

        if (res.data.success) {
            console.log('✅ Found accounts:');
            res.data.result.forEach((acc: any) => {
                console.log(`- ${acc.name} (ID: ${acc.id})`);
            });
        }
    } catch (err: any) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

listAccounts();
