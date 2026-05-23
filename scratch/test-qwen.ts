import 'dotenv/config';

async function main() {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }

  const model = 'qwen-3-235b-a22b-instruct-2507';
  console.log(`Testing new model: ${model}...`);
  try {
    const start = Date.now();
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Respond with a simple JSON object containing a greeting field: {"greeting": "Hello from Qwen!"}' }],
        temperature: 0.1,
        max_completion_tokens: 100,
        response_format: { type: 'json_object' }
      })
    });
    const duration = Date.now() - start;
    console.log(`Status: ${res.status} (took ${duration}ms)`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Success! Response:`, JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Failed:`, await res.text());
    }
  } catch (e: any) {
    console.error(`💥 Error:`, e.message);
  }
}

main();
