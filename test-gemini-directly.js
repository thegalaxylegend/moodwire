import https from 'node:https';

const key = 'AIzaSyCPsev1wqW5JwONIOcQNfwVvld3B1EKX1c';
const payload = JSON.stringify({
    contents: [{ parts: [{ text: "hi" }] }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => console.log('Response:', data));
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
