import 'dotenv/config';

async function testFetch() {
    const key = process.env.VITE_GEMINI_API_KEY!;
    console.log("Using Key #1:", key.substring(0, 8) + "...");
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
    const start = Date.now();
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log("Status:", res.status);
        const data = await res.text();
        console.log("Response text length:", data.length);
        console.log("Response body:", data.substring(0, 300));
    } catch (e: any) {
        console.log("Failed in", Date.now() - start, "ms:", e.message);
    }
}

testFetch();
