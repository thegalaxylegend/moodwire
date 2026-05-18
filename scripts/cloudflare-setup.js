import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.replace(/['"]/g, '');
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '');

async function setupCloudflareKV() {
    console.log('☁️  ExamCompass Infrastructure Setup: Cloudflare KV');
    console.log('--------------------------------------------------');
    
    if (!CF_TOKEN || !CF_ACCOUNT_ID) {
        console.error('❌ Error: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID missing in .env!');
        return;
    }

    console.log(`🔑 Account ID: ${CF_ACCOUNT_ID}`);
    console.log(`🔐 Token (first 8 chars): ${CF_TOKEN.slice(0, 8)}...`);
    console.log('\n📡 Creating KV Namespace "examcompass-lb-state"...');

    try {
        const res = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces`,
            { title: 'examcompass-lb-state' },
            {
                headers: {
                    'Authorization': `Bearer ${CF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (res.data.success) {
            console.log('\n==================================================');
            console.log('✅ SUCCESS! Cloudflare KV Namespace Created!');
            console.log(`📌 Namespace ID: ${res.data.result.id}`);
            console.log('==================================================');
            console.log('\n👉 NEXT STEP:');
            console.log('Go to Cloudflare Pages Dashboard -> Settings -> Functions');
            console.log('Add a KV namespace binding:');
            console.log(`   - Variable Name: LB_STATE`);
            console.log(`   - KV Namespace: select "examcompass-lb-state" [${res.data.result.id}]`);
        } else {
            console.error('❌ Cloudflare API returned failure:', res.data.errors);
        }
    } catch (err) {
        const errorData = err.response?.data;
        if (errorData) {
            console.error('\n❌ Cloudflare API Error:', JSON.stringify(errorData.errors, null, 2));
            if (errorData.errors?.[0]?.code === 10000) {
                console.log('\n💡 Tip: Code 10000 (Authentication error) usually means:');
                console.log('  1. The API Token in your .env is invalid or has expired.');
                console.log('  2. The API Token lacks the "Workers KV Storage: Edit" permission.');
                console.log('\n🛠️ Alternative (Manual Setup in 1 Minute):');
                console.log('  1. Go to Cloudflare Dashboard -> Workers & Pages -> KV');
                console.log('  2. Click "Create a namespace", name it: examcompass-lb-state');
                console.log('  3. Go to Workers & Pages -> examcompass -> Settings -> Functions');
                console.log('  4. Add a KV Binding: Variable="LB_STATE", KV="examcompass-lb-state"');
            }
        } else {
            console.error('❌ Request failed:', err.message);
        }
    }
}

setupCloudflareKV();
