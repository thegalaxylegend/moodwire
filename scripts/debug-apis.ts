
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testGroqKeys() {
    console.log('\n--- Testing Groq Keys ---');
    const keys = [
        process.env.VITE_GROQ_API_KEY,
        process.env.VITE_GROQ_API_KEY_2,
        process.env.VITE_GROQ_API_KEY_3,
        process.env.VITE_GROQ_API_KEY_4,
        process.env.VITE_GROQ_API_KEY_5,
        process.env.VITE_GROQ_API_KEY_6,
    ].filter(Boolean) as string[];

    for (let i = 0; i < keys.length; i++) {
        const groq = new Groq({ apiKey: keys[i] });
        try {
            const start = Date.now();
            await groq.chat.completions.create({
                messages: [{ role: 'user', content: 'hi' }],
                model: 'llama-3.3-70b-versatile',
                max_tokens: 5,
            });
            console.log(`✅ Groq Key #${i + 1}: Working (${Date.now() - start}ms)`);
        } catch (err: any) {
            console.log(`❌ Groq Key #${i + 1}: Failed - ${err.message?.slice(0, 100)}`);
        }
    }
}

async function testGeminiKeys() {
    console.log('\n--- Testing Gemini 2.5 Series ---');
    const keys = [
        process.env.VITE_GEMINI_API_KEY,
        process.env.VITE_GEMINI_API_KEY_2,
        process.env.VITE_GEMINI_API_KEY_3,
        process.env.VITE_GEMINI_API_KEY_4,
        process.env.VITE_GEMINI_API_KEY_5,
        process.env.VITE_GEMINI_API_KEY_6,
    ].filter(Boolean) as string[];

    const models = [
        { id: 'gemini-2.5-pro', name: 'Pro' },
        { id: 'gemini-2.5-flash', name: 'Flash' },
        { id: 'gemini-2.5-flash-lite', name: 'Flash-Lite' }
    ];

    for (let i = 0; i < keys.length; i++) {
        console.log(`\n🔑 Key #${i + 1}:`);
        const genAI = new GoogleGenerativeAI(keys[i]);
        
        for (const modelInfo of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelInfo.id });
                const start = Date.now();
                await model.generateContent('ping');
                console.log(`   ✅ ${modelInfo.name}: Working (${Date.now() - start}ms)`);
            } catch (err: any) {
                console.log(`   ❌ ${modelInfo.name}: Failed - ${err.message?.slice(0, 100)}`);
            }
        }
    }
}

async function testOtherApis() {
    console.log('\n--- Testing Other APIs ---');
    
    // HF
    if (process.env.HF_API_TOKEN) {
        try {
            const res = await fetch('https://api-inference.huggingface.co/models/gpt2', {
                method: 'POST',
                headers: { Authorization: `Bearer ${process.env.HF_API_TOKEN}` },
                body: JSON.stringify({ inputs: 'hi' })
            });
            if (res.ok) console.log('✅ Hugging Face: Working');
            else console.log(`❌ Hugging Face: Failed (${res.status})`);
        } catch (err: any) {
            console.log(`❌ Hugging Face: Failed - ${err.message}`);
        }
    }

    // Cloudflare
    if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) {
        try {
            const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN.replace(/"/g, '')}` },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] })
            });
            if (res.ok) console.log('✅ Cloudflare AI: Working');
            else console.log(`❌ Cloudflare AI: Failed (${res.status})`);
        } catch (err: any) {
            console.log(`❌ Cloudflare AI: Failed - ${err.message}`);
        }
    }
}

async function runAll() {
    await testGroqKeys();
    await testGeminiKeys();
    await testOtherApis();
}

runAll();
