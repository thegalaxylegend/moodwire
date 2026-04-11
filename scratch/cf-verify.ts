
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');

async function verifyToken() {
    console.log(`🔐 Verifying Cloudflare Token...`);
    
    try {
        const res = await axios.get('https://api.cloudflare.com/client/v4/user/tokens/verify', {
            headers: {
                'Authorization': `Bearer ${CF_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Token Status:', JSON.stringify(res.data, null, 2));
    } catch (err: any) {
        console.error('❌ Verification Failed:', err.response?.data || err.message);
    }
}

verifyToken();
