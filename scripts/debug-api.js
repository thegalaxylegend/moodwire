import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#]+?)=([^#\s]+)/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

async function runDiagnostics() {
    console.log("Testing Gemini models...");
    const geminiKey = env.VITE_GEMINI_API_KEY;
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    
    for (const m of models) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
            })
        });
        const text = await res.text();
        console.log(`Model ${m}: Status ${res.status}`);
        if (!res.ok) console.log(text);
    }

    console.log("\nTesting HF models...");
    const hfKey = env.HF_API_TOKEN;
    const hfModels = ['Qwen/Qwen2.5-7B-Instruct', 'meta-llama/Llama-3.2-3B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'];
    
    for (const m of hfModels) {
        const res = await fetch(`https://api-inference.huggingface.co/models/${m}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: m, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 })
        });
        const text = await res.text();
        console.log(`Model ${m}: Status ${res.status}`);
        if (!res.ok) console.log(text);
    }
}
runDiagnostics();
