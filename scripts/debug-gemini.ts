
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function debugGemini() {
    const key = process.env.VITE_GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(key);
    // Try the specific failing model
    try {
        const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-pro' });
        const result = await model.generateContent("hi");
        console.log("Success:", result.response.text());
    } catch (err: any) {
        console.log("Full Error Message:", err.message);
        console.log("Error Details:", JSON.stringify(err, null, 2));
    }
}

debugGemini();
