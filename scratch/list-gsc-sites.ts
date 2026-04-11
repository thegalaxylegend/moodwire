
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KEY_FILE = path.join(__dirname, '../service-account.json');

async function main() {
    console.log('🔍 Listing GSC Properties...');
    
    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ service-account.json not found');
        return;
    }

    const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
    const auth = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    try {
        const response = await searchconsole.sites.list();
        const sites = response.data.siteEntry || [];
        
        if (sites.length === 0) {
            console.log('📭 No sites found for this service account.');
        } else {
            console.log('✅ Found the following properties:');
            sites.forEach((site: any) => {
                console.log(` - ${site.siteUrl} (${site.permissionLevel})`);
            });
        }
    } catch (err: any) {
        console.error('❌ Error listing sites:', err.message);
    }
}

main();
