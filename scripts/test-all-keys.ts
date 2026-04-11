
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import 'dotenv/config';

async function testKeys() {
    console.log('🧪 Starting Global API Key Health Check...\n');

    const groqKeys = [
        process.env.VITE_GROQ_API_KEY,
        process.env.VITE_GROQ_API_KEY_2,
        process.env.VITE_GROQ_API_KEY_3,
        process.env.VITE_GROQ_API_KEY_4,
        process.env.VITE_GROQ_API_KEY_5,
        process.env.VITE_GROQ_API_KEY_6,
    ].filter(Boolean);

    const geminiKeys = [
        process.env.VITE_GEMINI_API_KEY,
        process.env.VITE_GEMINI_API_KEY_2,
        process.env.VITE_GEMINI_API_KEY_3,
        process.env.VITE_GEMINI_API_KEY_4,
        process.env.VITE_GEMINI_API_KEY_5,
        process.env.VITE_GEMINI_API_KEY_6,
    ].filter(Boolean);

    console.log(`📊 Found ${groqKeys.length} Groq keys and ${geminiKeys.length} Gemini keys.\n`);

    console.log('--- 🟠 TESTING GROQ KEYS ---');
    for (let i = 0; i < groqKeys.length; i++) {
        const key = groqKeys[i]!;
        const client = new Groq({ apiKey: key });
        try {
            const start = Date.now();
            await client.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 5
            });
            console.log(`✅ Groq Key #${i + 1} (${key.substring(0, 8)}...): WORKING (${Date.now() - start}ms)`);
        } catch (err: any) {
            console.log(`❌ Groq Key #${i + 1} (${key.substring(0, 8)}...): FAILED - ${err.message}`);
        }
    }

    console.log('\n--- 🔵 TESTING GEMINI KEYS ---');
    // Try to find a working model name first
    let geminiModel = 'gemini-1.5-flash';
    try {
        const testKey = geminiKeys[0];
        if (testKey) {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
            const data: any = await resp.json();
            const models = data.models || [];
            // Find a model that supports generateContent
            const found = models.find((m: any) => 
                m.supportedGenerationMethods?.includes('generateContent') && 
                (m.name.includes('flash') || m.name.includes('pro'))
            );
            if (found) {
                geminiModel = found.name.split('/').pop()!;
                console.log(`🎯 Using model "${geminiModel}" for Gemini tests.\n`);
            }
        }
    } catch (e) {
        console.log('⚠️ Could not auto-detect Gemini model, sticking with defaults.');
    }

    for (let i = 0; i < geminiKeys.length; i++) {
        const key = geminiKeys[i]!;
        const genAI = new GoogleGenerativeAI(key);
        try {
            const start = Date.now();
            const model = genAI.getGenerativeModel({ model: geminiModel });
            await model.generateContent('hi');
            console.log(`✅ Gemini Key #${i + 1} (${key.substring(0, 8)}...): WORKING (${Date.now() - start}ms)`);
        } catch (err: any) {
            console.log(`❌ Gemini Key #${i + 1} (${key.substring(0, 8)}...): FAILED - ${err.message}`);
        }
    }

    console.log('\n🏁 Health Check Complete.');
}

testKeys().catch(err => console.error('💥 Crash:', err));
