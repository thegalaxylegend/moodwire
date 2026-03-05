import https from 'node:https';

async function checkKey(key) {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => resolve({ code: res.statusCode, body: data }));
        });
        req.on('error', (e) => resolve({ code: 0, body: e.message }));
        req.write(payload);
        req.end();
    });
}

(async () => {
    const key1 = 'AIzaSyCPsev1wqW5JwONIOcQNfwVvld3B1EKX1c'; // "Old" key
    const key2 = 'AIzaSyCLEwbAZ-oW9HFeFXTH30Q7p_v0BBS3aPU'; // "New" key (from first msg)

    console.log("--- Testing Old Key ---");
    console.log(await checkKey(key1));

    console.log("\n--- Testing New Key ---");
    console.log(await checkKey(key2));
})();
