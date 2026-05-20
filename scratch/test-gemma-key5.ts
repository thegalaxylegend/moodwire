import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function debugGemini() {
    const key = process.env.VITE_GEMINI_API_KEY_5!;
    console.log("Using Key #5:", key.substring(0, 8) + "...");
    const genAI = new GoogleGenerativeAI(key);
    try {
        const start = Date.now();
        console.log("Sending query to models/gemma-4-31b-it...");
        const model = genAI.getGenerativeModel({ model: 'models/gemma-4-31b-it' });
        const result = await model.generateContent("hi");
        console.log("Success in", Date.now() - start, "ms:", result.response.text());
    } catch (err: any) {
        console.log("Failed:", err.message);
    }
}

debugGemini();
