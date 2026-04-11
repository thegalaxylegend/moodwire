
import 'dotenv/config';
import fs from 'fs';

async function discoverModels() {
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.VITE_GROQ_API_KEY;

    console.log('🔍 Discovering available models...\n');

    // 1. Gemini
    if (geminiKey) {
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
            const data: any = await resp.json();
            fs.writeFileSync('scripts/gemini-models.json', JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${data.models?.length || 0} Gemini models to scripts/gemini-models.json`);
        } catch (e) {
            console.error('❌ Gemini Discovery failed');
        }
    }

    // 2. Groq
    if (groqKey) {
        try {
            const resp = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${groqKey}` }
            });
            const data: any = await resp.json();
            fs.writeFileSync('scripts/groq-models.json', JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${data.data?.length || 0} Groq models to scripts/groq-models.json`);
        } catch (e) {
            console.error('❌ Groq Discovery failed');
        }
    }
}

discoverModels();
