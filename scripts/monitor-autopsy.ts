
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const RUN_LOG = path.join(__dirname, '../run.log');
const AUTOPSY_REPORT = path.join(REPORTS_DIR, 'autopsy-report.json');

// Multi-key rotation — healthy keys FIRST, invalid Key 6 LAST
const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY,    // Key 1 (healthy)
    process.env.VITE_GROQ_API_KEY_2,   // Key 2 (healthy)
    process.env.VITE_GROQ_API_KEY_3,   // Key 3 (healthy)
    process.env.VITE_GROQ_API_KEY_4,   // Key 4 (healthy)
    process.env.VITE_GROQ_API_KEY_5,   // Key 5 (healthy)
    process.env.GROQ_API_KEY,          // Alias for Key 1
    process.env.VITE_GROQ_API_KEY_6,   // Key 6 (known invalid — last resort)
].filter(Boolean) as string[];

// Deduplicate keys in case aliases point to the same value
const uniqueKeys = [...new Set(GROQ_KEYS)];

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: uniqueKeys[0] });

function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % uniqueKeys.length;
    groq = new Groq({ apiKey: uniqueKeys[currentKeyIndex] });
    console.log(`🔄 Rotating to Groq Key #${currentKeyIndex + 1}/${uniqueKeys.length}...`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runAutopsy() {
    console.log("🕵️ Auditor: Commencing Log Autopsy...");

    if (!fs.existsSync(RUN_LOG)) {
        console.warn("⚠️ No run.log found. Creating empty report.");
        fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify({ flaws: ["No run logs available for audit."], insights: [], overall_health: "Warning" }, null, 2));
        return;
    }

    const logContent = fs.readFileSync(RUN_LOG, 'utf-8').slice(-10000); // Last 10k chars for context

    const prompt = `You are a Senior Systems Auditor. Analyze the following GitHub Action run logs for an AI Blog Pipeline.
Find:
1.  **Critical Logic Flaws**: (e.g. JSON parse failures, rotating keys too often, thin content alerts).
2.  **Unpredicted Errors**: (e.g. "Unexpected token", API 404s, model mismatches).
3.  **Positive Insights**: (e.g. high quality scores, successful rescues).

### RUN LOG SUMMARY (SAMPLED):
\`\`\`
${logContent}
\`\`\`

### REQUIRED OUTPUT:
Return ONLY a valid JSON object:
{
  "flaws": ["Bullet point of a flaw"],
  "unpredicted": ["Bullet point of an unpredicted error"],
  "insights": ["Bullet point of a system insight"],
  "overall_health": "Healthy | Warning | Critical"
}

Be professional and concise.`;

    // Retry with key rotation — try ALL unique keys before giving up
    const MAX_ATTEMPTS = uniqueKeys.length;
    
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`🔍 Attempt ${attempt}/${MAX_ATTEMPTS} (Key #${currentKeyIndex + 1})...`);
            const result = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const report = JSON.parse(result.choices[0]?.message?.content || "{}");
            
            // Ensure required fields exist
            report.flaws = report.flaws || [];
            report.unpredicted = report.unpredicted || [];
            report.insights = report.insights || [];
            report.overall_health = report.overall_health || "Unknown";
            report.audited_at = new Date().toISOString();
            report.log_length = logContent.length;
            report.key_used = currentKeyIndex + 1;
            
            fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify(report, null, 2));
            console.log(`✅ Auditor: Autopsy report generated (Health: ${report.overall_health})`);
            return;
        } catch (err: any) {
            const isRetryable = err.message?.includes('429') || err.message?.includes('rate_limit') || 
                                err.message?.includes('503') || err.message?.includes('401') || 
                                err.message?.includes('Invalid API Key');
            
            if (isRetryable && attempt < MAX_ATTEMPTS) {
                const reason = err.message?.includes('401') || err.message?.includes('Invalid API Key') 
                    ? 'Invalid API Key' : 'Rate limited';
                console.warn(`⚠️ ${reason} on key #${currentKeyIndex + 1}. Rotating...`);
                rotateKey();
                await sleep(1500 * attempt);
                continue;
            }
            
            console.error(`❌ Auditor: Autopsy failed on attempt ${attempt}:`, err.message || err);
        }
    }
    
    // All attempts failed — write a diagnostic fallback report
    console.error("❌ Auditor: All API attempts exhausted. Writing fallback report.");
    fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify({
        flaws: ["Audit API calls failed across all keys — check rate limits and key validity."],
        unpredicted: [],
        insights: ["The audit system itself needs attention — API exhaustion during post-mortem."],
        overall_health: "Warning",
        audited_at: new Date().toISOString(),
        fallback: true
    }, null, 2));
}

runAutopsy();
