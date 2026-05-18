// Script to fetch the real, exact list of currently active Groq models directly from the API
const key = "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"; // Prince key (active)

async function getRealModels() {
    console.log('📡 Fetching active models directly from Groq API...');
    try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (res.ok && data.data) {
            console.log('\n=========================================');
            console.log('🔥 ACTUAL ACTIVE GROQ MODELS RIGHT NOW:');
            console.log('=========================================');
            data.data.forEach(m => {
                console.log(`  - ${m.id} (Created by: ${m.owned_by})`);
            });
            console.log('=========================================\n');
        } else {
            console.error('❌ Error response from Groq:', data);
        }
    } catch (e) {
        console.error('❌ Request failed:', e.message);
    }
}

getRealModels();
