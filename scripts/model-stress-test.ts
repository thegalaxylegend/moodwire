
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import 'dotenv/config';
import fs from 'fs';

const TEST_PROMPT = "Write a 300-word explanation of Quantum Entanglement for a Class 11 student. Include 5 key points.";

interface AuditResult {
    modelId: string;
    provider: string;
    status: 'WORKING' | 'FAILED';
    latencyMs: number;
    tokens: number;
    tps: number;
    error?: string;
}

async function runAudit() {
    const date = new Date().toISOString().split('T')[0];
    console.log(`🚀 Starting Comprehensive Model Audit (Date: ${date})\n`);

    const geminiKey = process.env.VITE_GEMINI_API_KEY!;
    const groqKey = process.env.VITE_GROQ_API_KEY!;

    const targets = [
        // Gemini & Gemma
        { id: 'models/gemini-2.5-pro', provider: 'gemini' },
        { id: 'models/gemini-2.5-flash', provider: 'gemini' },
        { id: 'models/gemini-2.5-flash-lite', provider: 'gemini' },
        { id: 'models/gemma-4-31b-it', provider: 'gemini' },
        { id: 'models/gemma-4-26b-a4b-it', provider: 'gemini' },
        { id: 'models/gemini-3.1-pro-preview', provider: 'gemini' },
        
        // Groq / Llama
        { id: 'llama-3.3-70b-versatile', provider: 'groq' },
        { id: 'llama-3.1-8b-instant', provider: 'groq' },
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq' },
        { id: 'qwen/qwen3-32b', provider: 'groq' }
    ];

    const results: AuditResult[] = [];

    for (const target of targets) {
        process.stdout.write(`🧪 Testing ${target.id}... `);
        try {
            const start = Date.now();
            let text = "";
            let tokenCount = 0;

            if (target.provider === 'gemini') {
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: target.id });
                const result = await model.generateContent(TEST_PROMPT);
                text = result.response.text();
            } else {
                const groq = new Groq({ apiKey: groqKey });
                const completion = await groq.chat.completions.create({
                    model: target.id,
                    messages: [{ role: 'user', content: TEST_PROMPT }],
                });
                text = completion.choices[0].message.content || "";
            }

            const duration = Date.now() - start;
            // Rough estimation: 1 word approx 1.3 tokens
            tokenCount = text.split(/\s+/).length * 1.3;
            const tps = (tokenCount / (duration / 1000)).toFixed(1);

            results.push({
                modelId: target.id,
                provider: target.provider,
                status: 'WORKING',
                latencyMs: duration,
                tokens: Math.round(tokenCount),
                tps: parseFloat(tps)
            });
            console.log(`✅ ${tps} TPS`);
        } catch (err: any) {
            results.push({
                modelId: target.id,
                provider: target.provider,
                status: 'FAILED',
                latencyMs: 0,
                tokens: 0,
                tps: 0,
                error: err.message.slice(0, 100)
            });
            console.log(`❌ FAILED`);
        }
    }

    console.log('\n🏁 Audit Finished. Generating Report...');
    return results;
}

runAudit().then(results => {
    fs.writeFileSync('scripts/audit-raw-results.json', JSON.stringify(results, null, 2));
    console.log('✅ Raw results saved to scripts/audit-raw-results.json');
}).catch(console.error);
