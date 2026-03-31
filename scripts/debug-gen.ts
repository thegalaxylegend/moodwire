
import { generateInspiredQuestion } from '../src/services/questionEngine';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function debugGeneration() {
    console.log("🛠️ Debugging 70B Generator Output...");
    const topic = 'Chemical Kinetics';
    console.log(`Topic: ${topic}`);
    
    const result = await generateInspiredQuestion({
        exam: 'JEE-Mains',
        subject: 'Chemistry',
        topic: topic,
        difficulty: 'Medium',
        // @ts-ignore
        noCache: true 
    });

    if (result) {
        console.log("✅ SUCCESS:");
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log("❌ FAILED (Check console logs for REJECT reasons).");
    }
}

debugGeneration();
