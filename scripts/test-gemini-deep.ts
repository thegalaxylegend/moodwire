
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiDeep() {
    const key = process.env.VITE_GEMINI_API_KEY;
    console.log('Testing Key:', key ? key.slice(0, 10) + '...' : 'NULL');
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'hi' }] }]
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error('Fetch Error:', err.message);
    }
}

testGeminiDeep();
