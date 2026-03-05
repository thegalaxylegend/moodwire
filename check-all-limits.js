import https from 'node:https';

async function checkGroq() {
    const key = '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';
    const data = JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1
    });

    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let output = `Groq Status: ${res.statusCode}\n`;
            for (const [name, value] of Object.entries(res.headers)) {
                if (name.includes('ratelimit')) {
                    output += `${name}: ${value}\n`;
                }
            }
            resolve(output);
        });
        req.write(data);
        req.end();
    });
}

async function checkGemini() {
    const key = 'AIzaSyCLEwbAZ-oW9HFeFXTH30Q7p_v0BBS3aPU';
    return new Promise((resolve) => {
        https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    resolve(`Gemini Status: ${res.statusCode} Error: ${data}`);
                } else {
                    const models = JSON.parse(data).models.map(m => m.name.split('/').pop());
                    resolve(`Gemini Status: 200 (Active)\nAvailable Models: ${models.join(', ')}`);
                }
            });
        }).on('error', (e) => resolve(`Gemini Error: ${e.message}`));
    });
}

(async () => {
    console.log("--- Groq Status ---");
    console.log(await checkGroq());
    console.log("\n--- Google Gemini Status ---");
    console.log(await checkGemini());
})();
