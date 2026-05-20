import 'dotenv/config';

async function testFetchCause() {
    const key = process.env.VITE_GEMINI_API_KEY_5!;
    const prompt = "Generate a JSON with a single key 'hello' and value 'world'.";
    const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    };
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${key}`;
    console.log("Sending fetch to:", url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Success:", JSON.stringify(data));
    } catch (e: any) {
        console.log("Error message:", e.message);
        console.log("Error cause:", e.cause);
        if (e.cause) {
            console.log("Error cause name:", e.cause.name);
            console.log("Error cause message:", e.cause.message);
            console.log("Error cause stack:", e.cause.stack);
        }
    }
}

testFetchCause();
