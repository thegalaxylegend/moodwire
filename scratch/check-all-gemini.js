import 'dotenv/config';

const keys = [
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.VITE_GEMINI_API_KEY_6
].filter(Boolean);

async function checkModelForKey(key, keyIndex, model) {
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });
        const data = await response.json();
        if (response.ok) {
            return { ok: true, status: response.status };
        } else {
            return { ok: false, status: response.status, message: data.error?.message || response.statusText };
        }
    } catch (e) {
        return { ok: false, status: 0, message: e.message };
    }
}

async function runAudit() {
    console.log(`Auditing ${keys.length} Gemini keys...`);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const keyLabel = `Key #${i + 1} (${key.slice(0, 10)}...)`;
        
        const flashRes = await checkModelForKey(key, i, 'gemini-2.5-flash');
        const proRes = await checkModelForKey(key, i, 'gemini-2.5-pro');
        
        console.log(`${keyLabel}:`);
        console.log(`  gemini-2.5-flash: ${flashRes.ok ? '✅ WORKING' : `❌ FAILED (${flashRes.status}) - ${flashRes.message.slice(0, 80)}`}`);
        console.log(`  gemini-2.5-pro:   ${proRes.ok ? '✅ WORKING' : `❌ FAILED (${proRes.status}) - ${proRes.message.slice(0, 80)}`}`);
    }
}

runAudit();
