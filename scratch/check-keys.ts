import 'dotenv/config';

const cerebrasKeys = [
  process.env.CEREBRAS_API_KEY, process.env.CEREBRAS_API_KEY_2,
  process.env.CEREBRAS_API_KEY_3, process.env.CEREBRAS_API_KEY_4,
  process.env.CEREBRAS_API_KEY_5, process.env.CEREBRAS_API_KEY_6,
  process.env.CEREBRAS_API_KEY_7, process.env.CEREBRAS_API_KEY_8,
].filter(Boolean) as string[];

const geminiKeys = [
  process.env.VITE_GEMINI_API_KEY, process.env.VITE_GEMINI_API_KEY_2,
  process.env.VITE_GEMINI_API_KEY_3, process.env.VITE_GEMINI_API_KEY_4,
  process.env.VITE_GEMINI_API_KEY_5, process.env.VITE_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

const groqKeys = [
  process.env.VITE_GROQ_API_KEY, process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3, process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5, process.env.VITE_GROQ_API_KEY_6,
  process.env.VITE_GROQ_API_KEY_7, process.env.VITE_GROQ_API_KEY_8,
].filter(Boolean) as string[];

async function testCerebras(key: string, idx: number) {
  const label = `Cerebras Key ${idx + 1} (${key.substring(0, 8)}...)`;
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_completion_tokens: 10,
      }),
    });
    if (res.ok) {
      console.log(`✅ ${label}: Working!`);
    } else {
      const text = await res.text();
      console.log(`❌ ${label}: Status ${res.status} - ${text.substring(0, 100)}`);
    }
  } catch (e: any) {
    console.log(`💥 ${label}: Error - ${e.message}`);
  }
}

async function testGemini(key: string, idx: number) {
  const label = `Gemini Key ${idx + 1} (${key.substring(0, 8)}...)`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );
    if (res.ok) {
      console.log(`✅ ${label}: Working!`);
    } else {
      const text = await res.text();
      console.log(`❌ ${label}: Status ${res.status} - ${text.substring(0, 100)}`);
    }
  } catch (e: any) {
    console.log(`💥 ${label}: Error - ${e.message}`);
  }
}

async function testGroq(key: string, idx: number) {
  const label = `Groq Key ${idx + 1} (${key.substring(0, 8)}...)`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      signal: ctrl.signal,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    });
    clearTimeout(timer);
    if (res.ok) {
      console.log(`✅ ${label}: Working!`);
    } else {
      const text = await res.text();
      console.log(`❌ ${label}: Status ${res.status} - ${text.substring(0, 100)}`);
    }
  } catch (e: any) {
    console.log(`💥 ${label}: Error - ${e.message}`);
  }
}

async function run() {
  console.log("=== DIAGNOSTIC API KEY CHECK ===");
  console.log(`Cerebras keys configured: ${cerebrasKeys.length}`);
  console.log(`Gemini keys configured: ${geminiKeys.length}`);
  console.log(`Groq keys configured: ${groqKeys.length}\n`);

  console.log("--- Testing Cerebras ---");
  for (let i = 0; i < cerebrasKeys.length; i++) {
    await testCerebras(cerebrasKeys[i], i);
  }

  console.log("\n--- Testing Gemini ---");
  for (let i = 0; i < geminiKeys.length; i++) {
    await testGemini(geminiKeys[i], i);
  }

  console.log("\n--- Testing Groq ---");
  for (let i = 0; i < groqKeys.length; i++) {
    await testGroq(groqKeys[i], i);
  }
}

run();
