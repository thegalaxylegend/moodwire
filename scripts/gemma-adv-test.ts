import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- KEY ROTATION & TIMEOUT ---
const keys = [
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.VITE_GEMINI_API_KEY_6
].filter(k => k && k.startsWith('AIza')).map(k => k!.trim());

let currentKeyIndex = 0;
const OUTPUT_FILE = path.join(__dirname, '../jules-reports/gemma-adv-audit.json');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getNextKey() {
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
}

// --- ROBUST PARSER ---
function extractJson(text: string) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

async function callModel(prompt: string, modelName: string, isJson: boolean = true) {
    const maxRetries = keys.length;
    let attempt = 0;

    while (attempt < maxRetries) {
        const apiKey = getNextKey();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s Timeout

        console.log(`📡 [Key ${currentKeyIndex}] Calling ${modelName}... (Attempt ${attempt + 1}/${maxRetries})`);

        try {
            const payload: any = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 2500, temperature: 0.7 }
            };
            if (isJson) payload.generationConfig.responseMimeType = "application/json";

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 429) {
                console.log(`⚠️  [Key ${currentKeyIndex}] Rate limited (429). Skipping...`);
                attempt++;
                continue;
            }

            if (!response.ok) {
                console.log(`❌ [Key ${currentKeyIndex}] Error ${response.status}. Skipping...`);
                attempt++;
                continue;
            }

            const data: any = await response.json();
            const textPart = data.candidates?.[0]?.content?.parts?.find((p: any) => !p.thought);
            const text = textPart?.text || null;
            
            if (text) return text;
            attempt++;
        } catch (err: any) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.log(`⏰ [Key ${currentKeyIndex}] Request timed out (120s). Skipping to next key...`);
            } else {
                console.log(`❌ [Key ${currentKeyIndex}] Fetch Error: ${err.message}`);
            }
            attempt++;
        }
    }
    return null;
}

async function generateAndAudit() {
    const startTime = Date.now();
    console.log(`🚀 MISSION RESTARTED: Gemma 4 Extreme Audit (Keys Found: ${keys.length})`);
    
    const approved: any[] = [];
    const rejected: any[] = [];
    let cycle = 1;

    while (approved.length < 20) {
        const batchStartTime = Date.now();
        const subjects = ["Physics", "Chemistry", "Mathematics"];
        const subject = subjects[approved.length % subjects.length];
        
        console.log(`\n👨‍🔬 Cycle ${cycle}: ${subject} (${approved.length}/20)`);

        const genPrompt = `
        JEE Advanced Expert. Generate 1 high-difficulty IIT-level question for ${subject}.
        Must be a 'Multiple Correct' or 'Numerical' type.
        Escape LaTeX (\\\\frac). Output raw JSON: { topic, question, options, correctOptions, explanation }
        `;

        // Switch to Google's flagship reasoning model because Gemma 4 is experiencing API infrastructure timeouts
        const draftText = await callModel(genPrompt, "gemini-2.5-pro", true);
        
        if (!draftText) {
            console.log("⏳ Total exhaustion of all 6 keys. Sleeping 30s to cool down...");
            await sleep(30000);
            continue;
        }

        const q = extractJson(draftText);
        if (!q) {
            console.log("❌ JSON Parsing Error. Retrying cycle...");
            continue;
        }

        console.log(`🖋️  Auditing Logic: ${q.topic.slice(0, 30)}...`);
        const auditPrompt = `Check accuracy of this question: ${JSON.stringify(q)}
        Return {"status": "APPROVED"} or {"status": "REJECTED", "reason": "why"}.`;

        const auditResultText = await callModel(auditPrompt, "gemini-2.0-flash", true);
        const auditResult = extractJson(auditResultText || "{}");

        if (auditResult?.status === "APPROVED") {
            const timeTaken = ((Date.now() - batchStartTime) / 1000).toFixed(1);
            console.log(`✅ SUCCESS (Time: ${timeTaken}s) | Total: ${approved.length + 1}/20`);
            approved.push({ ...q, subject });
        } else {
            console.log(`❌ REJECTED: ${auditResult?.reason || "Check Failed"}`);
            rejected.push({ question: q, subject, reason: auditResult?.reason });
        }

        cycle++;
        await sleep(500); 
    }

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    const finalReport = {
        meta: { duration_min: totalTime, approved: approved.length, rejected: rejected.length },
        approved,
        rejected
    };

    if (!fs.existsSync(path.dirname(OUTPUT_FILE))) fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalReport, null, 2));

    console.log(`\n🎉 BINGO! 20 JEE Advanced questions saved in ${totalTime} minutes.`);
}

generateAndAudit().catch(err => console.error("❌ Fatal Error:", err));
