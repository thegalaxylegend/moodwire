import 'dotenv/config';

const cerebrasKeys = [
  process.env.CEREBRAS_API_KEY, process.env.CEREBRAS_API_KEY_2,
  process.env.CEREBRAS_API_KEY_3, process.env.CEREBRAS_API_KEY_4,
  process.env.CEREBRAS_API_KEY_5, process.env.CEREBRAS_API_KEY_6,
  process.env.CEREBRAS_API_KEY_7, process.env.CEREBRAS_API_KEY_8,
].filter(Boolean) as string[];

async function testCerebras(key: string, idx: number, model: string, maxTokens: number) {
  const label = `Key ${idx + 1}`;
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say hello.' }],
        max_completion_tokens: maxTokens,
      }),
    });
    if (res.ok) {
      process.stdout.write(`✅ `);
    } else {
      const text = await res.text();
      if (text.includes("token_quota_exceeded")) {
        process.stdout.write(`❌ `);
      } else {
        process.stdout.write(`⚠️(${res.status}) `);
      }
    }
  } catch (e: any) {
    process.stdout.write(`💥 `);
  }
}

async function run() {
  console.log("=== CEREBRAS ALL MODELS & ALL KEYS MATRIX ===");
  const models = ['gpt-oss-120b', 'qwen-3-235b-a22b-instruct-2507', 'zai-glm-4.7', 'llama3.1-8b'];
  
  for (const model of models) {
    console.log(`\nModel: ${model}`);
    for (let i = 0; i < cerebrasKeys.length; i++) {
      await testCerebras(cerebrasKeys[i], i, model, 8000);
    }
    console.log();
  }
}

run();
