import https from 'node:https';

const key = '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';

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    }
};

const payload = JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: 'hi' }],
    max_tokens: 1
});

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:');
    for (const [name, value] of Object.entries(res.headers)) {
        if (name.startsWith('x-ratelimit')) {
            console.log(`${name}: ${value}`);
        }
    }
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.log('Response Body:', data);
        }
    });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
