
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

async function fetchGraphQLAnalytics() {
    console.log(`📡 Querying Cloudflare GraphQL for: ${PROJECT_NAME}...`);
    
    // Cloudflare GraphQL uses a different endpoint
    const url = 'https://api.cloudflare.com/client/v4/graphql';
    
    const query = `
    query GetPagesAnalytics($accountId: String!, $projectName: String!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          pagesProject(projectName: $projectName) {
            analytics_30d: domains(filter: { datetime_geq: "2026-03-12T00:00:00Z" }) {
               sum {
                 requests
                 bytes
                 pageViews
               }
               uniques {
                 uniques
               }
            }
          }
        }
      }
    }
    `;

    try {
        const res = await axios.post(url, {
            query,
            variables: {
                accountId: CF_ACCOUNT_ID,
                projectName: PROJECT_NAME
            }
        }, {
            headers: {
                'Authorization': `Bearer ${CF_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.data.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(res.data.errors, null, 2));
            return;
        }

        const project = res.data.data.viewer.accounts[0].pagesProject;
        console.log('✅ Success! Data:', JSON.stringify(project, null, 2));
    } catch (err: any) {
        console.error('❌ Request failed:', err.response?.data || err.message);
    }
}

fetchGraphQLAnalytics();
