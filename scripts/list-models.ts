
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
    const key = process.env.VITE_GEMINI_API_KEY;
    if (!key) return console.error('No API key found');
    
    console.log(`🔍 Listing models for key: ${key.substring(0, 8)}...`);
    
    // The standard SDK doesn't have a simple listModels, 
    // but we can use the REST API via fetch
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        console.log('Available Models:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

listModels();
