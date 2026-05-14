import crypto from 'crypto';
import 'dotenv/config';
import { generateInspiredQuestion } from '../src/services/questionEngine';
import fs from 'fs';
import path from 'path';

// --- MOCK BROWSER & GLOBALS ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null, removeItem: () => null, length: 0, key: () => null };
}

if (typeof global.navigator === 'undefined') {
    (global as any).navigator = { onLine: true };
}

// Mocking crypto for SHA-256 (needed by generateHash)
if (typeof global.crypto === 'undefined') {
    (global as any).crypto = {
        subtle: {
            digest: async (algorithm: string, data: Uint8Array) => {
                return crypto.createHash('sha256').update(data).digest();
            }
        }
    };
}

const TOPICS = [
    { subject: 'Physics', topic: 'Rotational Dynamics', exam: 'JEE-Advanced' },
    { subject: 'Physics', topic: 'Electromagnetic Induction', exam: 'JEE-Advanced' },
    { subject: 'Mathematics', topic: 'Definite Integration', exam: 'JEE-Advanced' },
    { subject: 'Mathematics', topic: 'Probability (Bayes Theorem)', exam: 'JEE-Advanced' },
    { subject: 'Chemistry', topic: 'Thermodynamics', exam: 'JEE-Advanced' },
    { subject: 'Chemistry', topic: 'Organic Synthesis (Mechanisms)', exam: 'JEE-Advanced' },
    { subject: 'Physics', topic: 'Quantum Mechanics (Photoelectric Effect)', exam: 'JEE-Advanced' },
    { subject: 'Mathematics', topic: 'Complex Numbers', exam: 'JEE-Advanced' },
    { subject: 'Chemistry', topic: 'Coordination Compounds', exam: 'JEE-Advanced' },
    { subject: 'Physics', topic: 'Fluid Mechanics (Viscosity)', exam: 'JEE-Advanced' }
];

async function generateHighEloQuestions() {
    console.log("🚀 Starting Generation of 10 VERY HIGH ELO (JEE-Advanced Hard) Questions...");
    console.log("System Calibration: Ability Score = 10/10, Tier = T2 (Complex Generator)\n");

    const generatedQuestions: any[] = [];

    for (let i = 0; i < TOPICS.length; i++) {
        const { subject, topic, exam } = TOPICS[i];
        console.log(`[${i+1}/10] Generating for ${topic} (${subject}) - ${exam} Hard...`);
        
        try {
            const result = await generateInspiredQuestion({
                exam: exam,
                subject: subject,
                topic: topic,
                difficulty: 'Hard',
                abilityScore: 10,
                // @ts-ignore
                noCache: true 
            });

            if (result) {
                console.log(`✅ SUCCESS: ${topic}`);
                generatedQuestions.push(result);
            } else {
                console.log(`❌ FAILED: ${topic} (Likely rejected by Verifier for lack of toughness or error).`);
            }
        } catch (err) {
            console.error(`💥 CRASH: ${topic}`, err);
        }

        // Delay to avoid rate limits (Governor logic from engine)
        if (i < TOPICS.length - 1) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    console.log("\n--- GENERATION SUMMARY ---");
    console.log(`Total Requested: 10`);
    console.log(`Total Successful: ${generatedQuestions.length}`);
    
    if (generatedQuestions.length > 0) {
        const outputPath = path.join(process.cwd(), 'high-elo-test-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(generatedQuestions, null, 2));
        console.log(`\n📄 Results saved to: ${outputPath}`);
    }
}

generateHighEloQuestions();
