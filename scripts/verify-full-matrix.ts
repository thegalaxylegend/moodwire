
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { MODELS, ModelSpec } from '../src/lib/routingConfig';

async function verifyFullMatrix() {
    console.log('🛡️  Starting Deep Matrix API Verification...\n');

    const groqKeys = [
        process.env.VITE_GROQ_API_KEY,
        process.env.VITE_GROQ_API_KEY_2,
        process.env.VITE_GROQ_API_KEY_3,
        process.env.VITE_GROQ_API_KEY_4,
        process.env.VITE_GROQ_API_KEY_5,
        process.env.VITE_GROQ_API_KEY_6,
    ].filter(Boolean) as string[];

    const geminiKeys = [
        process.env.VITE_GEMINI_API_KEY,
        process.env.VITE_GEMINI_API_KEY_2,
        process.env.VITE_GEMINI_API_KEY_3,
        process.env.VITE_GEMINI_API_KEY_4,
        process.env.VITE_GEMINI_API_KEY_5,
        process.env.VITE_GEMINI_API_KEY_6,
    ].filter(Boolean) as string[];

    const allModels = Object.values(MODELS);
    const groqModels = allModels.filter(m => m.provider === 'groq');
    const geminiModels = allModels.filter(m => m.provider === 'gemini');

    console.log(`📊 Matrix: (${groqKeys.length} Groq Keys × ${groqModels.length} Models) + (${geminiKeys.length} Gemini Keys × ${geminiModels.length} Models)`);
    console.log(`🚀 Total scheduled tests: ${groqKeys.length * groqModels.length + geminiKeys.length * geminiModels.length}\n`);

    const stats = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // --- TEST GROQ MATRIX ---
    console.log('--- 🟠 GROQ MATRIX TEST ---');
    for (const model of groqModels) {
        console.log(`\nModel: ${model.id}`);
        for (let i = 0; i < groqKeys.length; i++) {
            const key = groqKeys[i];
            const keyLabel = `Key #${i + 1} (${key.substring(0, 10)}...)`;
            stats.total++;

            try {
                const groq = new Groq({ apiKey: key });
                const start = Date.now();
                const completion = await groq.chat.completions.create({
                    model: model.id,
                    messages: [{ role: 'user', content: 'hi' }],
                    max_tokens: 5
                });
                const latency = Date.now() - start;
                console.log(`  ✅ ${keyLabel}: WORKING (${latency}ms)`);
                stats.passed++;
            } catch (err: any) {
                console.log(`  ❌ ${keyLabel}: FAILED - ${err.message.split('\n')[0]}`);
                stats.failed++;
            }
        }
    }

    // --- TEST GEMINI MATRIX ---
    console.log('\n--- 🔵 GEMINI MATRIX TEST ---');
    for (const modelSpec of geminiModels) {
        console.log(`\nModel: ${modelSpec.id}`);
        for (let i = 0; i < geminiKeys.length; i++) {
            const key = geminiKeys[i];
            const keyLabel = `Key #${i + 1} (${key.substring(0, 10)}...)`;
            stats.total++;

            try {
                const genAI = new GoogleGenerativeAI(key);
                const model = genAI.getGenerativeModel({ model: modelSpec.id });
                const start = Date.now();
                const result = await model.generateContent('hi');
                const text = result.response.text();
                const latency = Date.now() - start;
                if (text) {
                    console.log(`  ✅ ${keyLabel}: WORKING (${latency}ms)`);
                    stats.passed++;
                } else {
                    throw new Error('Empty response');
                }
            } catch (err: any) {
                console.log(`  ❌ ${keyLabel}: FAILED - ${err.message.split('\n')[0]}`);
                stats.failed++;
            }
        }
    }

    console.log('\n' + '='.repeat(40));
    console.log('📊 FINAL MATRIX REPORT');
    console.log(`  TOTAL TESTS: ${stats.total}`);
    console.log(`  PASSED:      ${stats.passed}`);
    console.log(`  FAILED:      ${stats.failed}`);
    console.log(`  SUCCESS RATE: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(40));

    if (stats.failed > 0) {
        console.log('\n⚠️ Some keys or models failed. Check the logs above for details.');
    } else {
        console.log('\n✨ All systems nominal. The fleet is ready for battle.');
    }
}

verifyFullMatrix().catch(console.error);
