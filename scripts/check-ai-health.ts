
import 'dotenv/config';
import { askAI } from '../src/lib/ai';

async function checkHealth() {
    console.log("🔍 Checking AI Health...");
    try {
        const response = await askAI("Test", "Say hello", 'auto', [], { noCache: true });
        console.log("✅ AI Response:", response);
    } catch (err: any) {
        console.error("❌ AI Health Check Failed:", err.message);
        if (err.stack) console.error(err.stack);
    }
}

checkHealth();
