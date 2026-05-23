import 'dotenv/config';

async function main() {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return;

  const models = ['llama3.3-70b', 'llama-3.3-70b', 'llama-3.3-70b-specdec', 'llama-3.3-70b-instruct'];
  for (const model of models) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_completion_tokens: 10
        })
      });
      console.log(`${model} status:`, res.status);
      if (res.ok) {
        console.log(`✅ ${model} works!`);
      } else {
        console.log(`❌ ${model} failed:`, await res.text());
      }
    } catch (e: any) {
      console.error(`💥 ${model} error:`, e.message);
    }
  }
}

main();
