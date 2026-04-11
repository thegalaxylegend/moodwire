
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/"/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/"/g, '');

async function introspectAccount() {
    console.log(`🔍 Introspecting Account GraphQL schema...`);
    
    const url = 'https://api.cloudflare.com/client/v4/graphql';
    
    const query = `
    query {
      __type(name: "Account") {
        fields {
          name
        }
      }
    }
    `;

    try {
        const res = await axios.post(url, { query }, {
            headers: {
                'Authorization': `Bearer ${CF_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.data.errors) {
            console.error('❌ Errors:', res.data.errors);
            return;
        }

        const fields = res.data.data.__type.fields.map((f: any) => f.name);
        console.log('✅ Available Account Fields:', fields.filter((n: string) => n.toLowerCase().includes('page')).join(', '));
    } catch (err: any) {
        console.error('❌ Failed:', err.response?.data || err.message);
    }
}

introspectAccount();
