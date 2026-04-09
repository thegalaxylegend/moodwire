import 'dotenv/config';

async function testGeminiDetailed(key: string, name: string) {
    if (!key) {
        console.log(`⚪ Gemini [${name}]: Not configured`);
        return;
    }
    
    // Models to try in order of likelihood
    const models = [
        "gemini-1.5-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Ping" }] }],
                    generationConfig: { maxOutputTokens: 5 }
                })
            });
            
            const data: any = await response.json();
            if (response.ok) {
                console.log(`✅ Gemini [${name}]: Model ${model} is WORKING.`);
                return; // Stop after first working model
            } else {
                const reason = data.error?.message || response.statusText;
                const status = response.status;
                if (status === 429) {
                     console.log(`⚠️ Gemini [${name}]: Model ${model} HIT RATE LIMIT (429). Key is likely valid.`);
                     return;
                }
                if (status === 400 && reason.includes("API key not valid")) {
                     console.log(`❌ Gemini [${name}]: INVALID API KEY.`);
                     return;
                }
                // If it's 404, we continue to try other models
                if (status !== 404) {
                    console.log(`❌ Gemini [${name}]: Model ${model} failed (${status}) - ${reason}`);
                }
            }
        } catch (err: any) {
            console.log(`❌ Gemini [${name}]: Network Error on ${model} - ${err.message}`);
        }
    }
    console.log(`❌ Gemini [${name}]: No models worked (All returned 404 or errors).`);
}

async function runGeminiAudit() {
    console.log("⚡ Advanced Gemini Feature Audit\n");

    const keys = [
        process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_BACKUP_KEY,
        process.env.VITE_GEMINI_API_KEY_2,
        process.env.VITE_GEMINI_API_KEY_3,
        process.env.VITE_GEMINI_API_KEY_4,
        process.env.VITE_GEMINI_API_KEY_5,
        process.env.VITE_GEMINI_API_KEY_6
    ].filter(Boolean) as string[];

    for (let i = 0; i < keys.length; i++) {
        await testGeminiDetailed(keys[i], `Key ${i + 1}`);
    }

    console.log("\n✨ Audit Complete.");
}

runGeminiAudit();
