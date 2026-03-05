import https from 'node:https';

const key = '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';

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/models',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${key}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});

req.on('error', (e) => console.error(e));
req.end();
