import { askAI } from '../src/lib/ai';
import dotenv from 'dotenv';
dotenv.config();

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function run() {
    try {
        console.log("Calling askAI...");
        const res = await askAI("Test context", "What is 1+1?", 'auto', [], {
            jsonMode: false,
            stream: false,
            max_tokens: 100,
            tier: 'T2',
            temperature: 0.7
        });
        console.log("Response:", res);
    } catch (e: any) {
        console.error("askAI threw an error:", e.stack || e);
    }
}
run();
