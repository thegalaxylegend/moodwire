import 'dotenv/config';

async function testGemini2(key: string, name: string) {
    if (!key) return;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Ping" }] }],
                generationConfig: { maxOutputTokens: 5 }
            })
        });
        const data: any = await response.json();
        console.log(`📡 Gemini [${name}]: Status ${response.status} - ${data.error?.message || response.statusText}`);
    } catch (err: any) {
        console.log(`❌ Gemini [${name}]: Error - ${err.message}`);
    }
}

async function run() {
    const keys = [process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_BACKUP_KEY];
    console.log("Testing Key 1 with gemini-2.0-flash...");
    await testGemini2(keys[0] as string, "Key 1");
}
run();
