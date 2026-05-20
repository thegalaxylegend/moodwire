import 'dotenv/config';

async function testCerebrasTokens() {
    const key = process.env.CEREBRAS_API_KEY;
    if (!key) return;

    try {
        console.log("Testing Cerebras with max_tokens: 4096...");
        const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-oss-120b',
                messages: [{ role: 'user', content: 'Count from 1 to 500. Write out every single number as a word.' }],
                max_tokens: 4096
            })
        });
        console.log("Cerebras status:", res.status, res.statusText);
        const data = await res.json();
        console.log("Received choices length:", data.choices?.length);
        console.log("Usage stats:", JSON.stringify(data.usage, null, 2));
        console.log("Finish reason:", data.choices?.[0]?.finish_reason);
        console.log("Output preview:", data.choices?.[0]?.message?.content?.substring(0, 200) + "...");
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

testCerebrasTokens();
