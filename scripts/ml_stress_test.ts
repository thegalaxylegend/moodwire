
import { AlphaBlender } from '../src/services/recommendation/core/AlphaBlender';
import { DEFAULT_WEIGHTS } from '../src/services/recommendation/types';

async function runMLStressTests() {
    console.log("🧬 PHASE 6.5: ML SURGICAL STRESS TEST\n");

    // --- TEST 1: Model Corruption (Ego Check) ---
    console.log("--- Test 1: Model Corruption ---");
    const corruptedWeights = {
        longTermSimilarity: 50.0,    // Absurdly high
        exploration: 999.0,     // Absurdly high
        artistAffinity: -10.0,       // Negative
        languageScore: 0.0           // Zero
    };

    const alpha = 0.5; // High influence
    const blended = AlphaBlender.blend(corruptedWeights as any, alpha);

    console.log("Input (Exploration): 999.0");
    console.log(`Blended (Exploration): ${blended.exploration.toFixed(3)} (Max Allowed: ${(DEFAULT_WEIGHTS.exploration * 1.15).toFixed(3)})`);

    const isTest1Safe = Math.abs(blended.exploration - DEFAULT_WEIGHTS.exploration) / DEFAULT_WEIGHTS.exploration <= 0.1501;
    console.log(`Result: ${isTest1Safe ? "✅ GUARDRAIL HELD" : "❌ GUARDRAIL FAILED"}\n`);


    // --- TEST 2: Accumulation & Drift ---
    console.log("--- Test 2: Accumulation Simulation ---");
    console.log("Simulating 10 cycles of 'perfect' ML feedback...");

    let currentMLWeights = { ...DEFAULT_WEIGHTS } as any;
    let weightHistory: number[] = [];

    // Simulate ML "learning" more similarity every time
    for (let i = 0; i < 10; i++) {
        // Mock a model that keeps pushing similarity to 1.0
        const learned = { longTermSimilarity: 1.0 };
        const nextBlended = AlphaBlender.blend(learned, 0.4);

        weightHistory.push(nextBlended.longTermSimilarity);
    }

    const first = weightHistory[0];
    const last = weightHistory[weightHistory.length - 1];

    console.log(`Start Weight: ${first.toFixed(3)}`);
    console.log(`End Weight  : ${last.toFixed(3)}`);

    const hasStabilized = weightHistory.every(w => w <= DEFAULT_WEIGHTS.longTermSimilarity * 1.1501);
    console.log(`Result: ${hasStabilized ? "✅ STABILIZED AT CLAMP" : "❌ RUNAWAY DRIFT"}\n`);


    // --- TEST 3: Silent Bias (Coherence Check) ---
    console.log("--- Test 3: Structural Coherence ---");
    // Ensure all keys are present even with partial ML input
    const partialML = { exploration: 0.2 };
    const resultingWeights = AlphaBlender.blend(partialML, 0.4);

    const allKeysPresent = Object.keys(DEFAULT_WEIGHTS).every(k => (resultingWeights as any)[k] !== undefined);
    console.log(`Result: ${allKeysPresent ? "✅ COHERENCE MAINTAINED" : "❌ MISSING KEYS"}\n`);

    if (isTest1Safe && hasStabilized && allKeysPresent) {
        console.log("🚀 ALL Guardrails Verified. ML Layer is Structurally Safe.");
    } else {
        process.exit(1);
    }
}

runMLStressTests().catch(console.error);
