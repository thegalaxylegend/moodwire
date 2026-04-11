
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function verify() {
    console.log(`🔑 Verifying Token: ${CF_TOKEN?.substring(0, 10)}...`);
    
    try {
        const res = await axios.get('https://api.cloudflare.com/client/v4/user/tokens/verify', {
            headers: {
                'Authorization': `Bearer ${CF_TOKEN?.replace(/"/g, '')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Token is VALID:', res.data.result);
    } catch (err: any) {
        console.error('❌ Token verification FAILED:', err.response?.data || err.message);
    }
}

verify();
