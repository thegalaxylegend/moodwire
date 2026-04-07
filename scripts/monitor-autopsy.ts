
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

// Multi-key rotation (matches other scripts)
const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY_6,
    process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
    groq = new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
    console.log(`🔄 Rotating to Groq Key #${currentKeyIndex + 1}...`);
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

    // Retry with key rotation (up to 3 attempts)
    const MAX_ATTEMPTS = Math.min(3, GROQ_KEYS.length);
    
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
            
            fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify(report, null, 2));
            console.log(`✅ Auditor: Autopsy report generated (Health: ${report.overall_health})`);
            return;
        } catch (err: any) {
            const isRateLimit = err.message?.includes('429') || err.message?.includes('rate_limit') || err.message?.includes('503');
            
            if (isRateLimit && attempt < MAX_ATTEMPTS) {
                console.warn(`⚠️ Rate limited on key #${currentKeyIndex + 1}. Rotating...`);
                rotateKey();
                await sleep(2000 * attempt);
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
