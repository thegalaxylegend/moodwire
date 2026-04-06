
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

const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY_6 || process.env.GROQ_API_KEY });

async function runAutopsy() {
    console.log("🕵️ Auditor: Commencing Log Autopsy...");

    if (!fs.existsSync(RUN_LOG)) {
        console.warn("⚠️ No run.log found. Creating empty report.");
        fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify({ flaws: ["No run logs available for audit."], insights: [] }, null, 2));
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

    try {
        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const report = JSON.parse(result.choices[0]?.message?.content || "{}");
        fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify(report, null, 2));
        console.log("✅ Auditor: Autopsy report generated at jules-reports/autopsy-report.json");
    } catch (err) {
        console.error("❌ Auditor: Autopsy failed:", err);
        fs.writeFileSync(AUTOPSY_REPORT, JSON.stringify({ flaws: ["Audit process failed internally."], insights: [] }, null, 2));
    }
}

runAutopsy();
