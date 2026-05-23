import 'dotenv/config';

async function main() {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }

  try {
    const res = await fetch('https://api.cerebras.ai/v1/models', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Success! Models:`, JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Failed:`, await res.text());
    }
  } catch (e: any) {
    console.error(`💥 Error:`, e.message);
  }
}

main();
