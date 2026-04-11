
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

async function fetchFinalGQL() {
    console.log(`📡 Querying Universal Cloudflare Analytics...`);
    
    // This query uses the account node to find Pages Project traffic
    const query = `
    query GetPagesMetrics($accountId: String!, $projectName: String!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          pagesProjectRequestsAdaptiveGroups(
            limit: 1
            filter: { projectName: $projectName, datetime_geq: "2026-04-01T00:00:00Z" }
          ) {
            sum {
              requests
              bytes
            }
          }
        }
      }
    }
    `;

    try {
        const res = await axios.post('https://api.cloudflare.com/client/v4/graphql', {
            query,
            variables: { accountId: CF_ACCOUNT_ID, projectName: PROJECT_NAME }
        }, {
            headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
        });

        if (res.data.errors) {
            console.warn('❌ GQL Errors:', JSON.stringify(res.data.errors, null, 2));
            return null;
        }

        return res.data.data.viewer.accounts[0];
    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        return null;
    }
}

fetchFinalGQL().then(data => {
    if (data) console.log('✅ Final Result:', JSON.stringify(data, null, 2));
});
