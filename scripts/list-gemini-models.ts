
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.VITE_GEMINI_API_KEY;
    console.log('Listing Models with Key:', key ? key.slice(0, 10) + '...' : 'NULL');
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
        const response = await fetch(url);
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error('Fetch Error:', err.message);
    }
}

listModels();
