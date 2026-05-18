import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
const tempEnvPath = path.join(__dirname, '../.env.wrangler_hide');

// ─── Simple .env parser ───
const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#]+?)=([^#\s]+)/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
    }
});

const PROJECT_NAME = 'examcompass';

async function uploadSecretsViaWrangler() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 EXAMCOMPASS WRANGLER SECRETS AUTOMATION (OAUTH FIX)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📦 Project Name: ${PROJECT_NAME}`);
    console.log('⏳ Hiding .env temporarily to force Wrangler to use your active CLI OAuth login...\n');

    // Map local .env keys to Cloudflare Worker expected env var names
    const secretMappings = {
        GROQ_API_KEY: env.VITE_GROQ_API_KEY,
        GROQ_API_KEY_2: env.VITE_GROQ_API_KEY_2,
        GROQ_API_KEY_3: env.VITE_GROQ_API_KEY_3,
        GROQ_API_KEY_4: env.VITE_GROQ_API_KEY_4,
        GROQ_API_KEY_5: env.VITE_GROQ_API_KEY_5,
        GROQ_API_KEY_6: env.VITE_GROQ_API_KEY_6,
        GROQ_API_KEY_7: env.VITE_GROQ_API_KEY_7,
        GROQ_API_KEY_8: env.VITE_GROQ_API_KEY_8,

        GEMINI_API_KEY: env.VITE_GEMINI_API_KEY,
        GEMINI_API_KEY_2: env.VITE_GEMINI_API_KEY_2,
        GEMINI_API_KEY_3: env.VITE_GEMINI_API_KEY_3,
        GEMINI_API_KEY_4: env.VITE_GEMINI_API_KEY_4,
        GEMINI_API_KEY_5: env.VITE_GEMINI_API_KEY_5,
        GEMINI_API_KEY_6: env.VITE_GEMINI_API_KEY_6,

        CEREBRAS_API_KEY: env.CEREBRAS_API_KEY,
        CEREBRAS_API_KEY_2: env.CEREBRAS_API_KEY_2,
        CEREBRAS_API_KEY_3: env.CEREBRAS_API_KEY_3,
        CEREBRAS_API_KEY_4: env.CEREBRAS_API_KEY_4,
        CEREBRAS_API_KEY_5: env.CEREBRAS_API_KEY_5,
        CEREBRAS_API_KEY_6: env.CEREBRAS_API_KEY_6,
        CEREBRAS_API_KEY_7: env.CEREBRAS_API_KEY_7,
        CEREBRAS_API_KEY_8: env.CEREBRAS_API_KEY_8,

        HF_API_TOKEN: env.HF_API_TOKEN,
        HF_API_TOKEN_2: env.HF_API_TOKEN_2,
        HF_API_TOKEN_3: env.HF_API_TOKEN_3,

        TOGETHER_API_KEY: env.TOGETHER_API_KEY || env.VITE_TOGETHER_API_KEY || 'tg_backup_placeholder_key',
    };

    let successCount = 0;
    let failCount = 0;

    // Temporarily rename .env so Wrangler doesn't auto-load the restricted CLOUDFLARE_API_TOKEN
    try {
        if (fs.existsSync(envPath)) {
            fs.renameSync(envPath, tempEnvPath);
        }

        // Prepare clean environment for execSync (keep Account ID, strip API Token)
        const cleanEnv = { ...process.env };
        delete cleanEnv.CLOUDFLARE_API_TOKEN;
        cleanEnv.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;

        for (const [key, value] of Object.entries(secretMappings)) {
            if (!value) {
                console.log(`⚠️  Skipping ${key}: No value found`);
                continue;
            }

            process.stdout.write(`Uploading ${key}... `);
            try {
                execSync(`npx wrangler pages secret put ${key} --project-name ${PROJECT_NAME}`, {
                    input: value,
                    env: cleanEnv,
                    stdio: ['pipe', 'ignore', 'pipe']
                });
                console.log('✅ OK');
                successCount++;
            } catch (error) {
                const errStr = error.stderr?.toString().trim() || error.message;
                console.log(`❌ FAILED (${errStr})`);
                failCount++;
                // If OAuth login is missing, stop the loop early to avoid 26 spam errors
                if (errStr.includes('10000') || errStr.includes('logged in')) {
                    console.log('\n🛑 Stopping uploader: Wrangler is not authenticated with your Cloudflare account.');
                    break;
                }
            }
        }
    } finally {
        // ALWAYS restore .env file even if errors occur
        if (fs.existsSync(tempEnvPath)) {
            fs.renameSync(tempEnvPath, envPath);
        }
    }

    console.log('\n==================================================');
    console.log(`🎉 UPLOAD SUMMARY: ${successCount} Successful | ${failCount} Failed`);
    console.log('==================================================');
    if (failCount === 0 && successCount > 0) {
        console.log('\n🚀 NEXT STEP: Trigger a deployment to apply them to the live worker!');
        console.log('Run: npm run build && npx wrangler pages deploy dist');
    } else if (failCount > 0) {
        console.log('\n💡 CRITICAL FIX: You need to log into Wrangler CLI first!');
        console.log('Run this command in your terminal, log in via your browser, then re-run the uploader:');
        console.log('👉 npx wrangler login');
    }
}

uploadSecretsViaWrangler();
