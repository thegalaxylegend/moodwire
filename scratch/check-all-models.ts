import 'dotenv/config';

// ─── Extract keys from process.env ──────────────────────────────────────────
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

// ─── Helper for sleeping to prevent rate limit spikes during diagnostics ──────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Discover & Test Cerebras ────────────────────────────────────────────────
async function getCerebrasModels(key: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.data || []).map((m: any) => m.id);
  } catch {
    return [];
  }
}

async function testCerebrasModel(key: string, model: string): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_completion_tokens: 5
      })
    });
    if (res.ok) {
      return { ok: true, msg: 'ACTIVE' };
    }
    const text = await res.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}
    const errMsg = parsed.error?.message || text.slice(0, 80);
    return { ok: false, msg: `Status ${res.status}: ${errMsg}` };
  } catch (e: any) {
    return { ok: false, msg: `Error: ${e.message}` };
  }
}

// ─── Discover & Test Gemini ──────────────────────────────────────────────────
async function getGeminiModels(key: string): Promise<string[]> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.models || []).map((m: any) => m.name.replace('models/', ''));
  } catch {
    return [];
  }
}

async function testGeminiModel(key: string, model: string): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say OK' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      }
    );
    if (res.ok) {
      return { ok: true, msg: 'ACTIVE' };
    }
    const text = await res.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}
    const errMsg = parsed.error?.message || text.slice(0, 80);
    return { ok: false, msg: `Status ${res.status}: ${errMsg}` };
  } catch (e: any) {
    return { ok: false, msg: `Error: ${e.message}` };
  }
}

// ─── Discover & Test Groq ────────────────────────────────────────────────────
async function getGroqModels(key: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.data || []).map((m: any) => m.id);
  } catch {
    return [];
  }
}

async function testGroqModel(key: string, model: string): Promise<{ ok: boolean; msg: string }> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5
      })
    });
    if (res.ok) {
      return { ok: true, msg: 'ACTIVE' };
    }
    const text = await res.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}
    const errMsg = parsed.error?.message || text.slice(0, 80);
    return { ok: false, msg: `Status ${res.status}: ${errMsg}` };
  } catch (e: any) {
    return { ok: false, msg: `Error: ${e.message}` };
  }
}

// ─── Main Runner ─────────────────────────────────────────────────────────────
async function run() {
  console.log("==================================================");
  console.log("    EXAMCOMPASS ADVANCED MODEL DISCOVERY & TEST");
  console.log("==================================================");
  
  // ----------------------------------------------------
  // 1. CEREBRAS DIAGNOSTICS
  // ----------------------------------------------------
  console.log("\n📡 [CEREBRAS] Checking model endpoints...");
  let cerebrasModelList: string[] = [];
  for (const key of cerebrasKeys) {
    cerebrasModelList = await getCerebrasModels(key);
    if (cerebrasModelList.length > 0) break;
  }
  
  if (cerebrasModelList.length === 0) {
    console.log("⚠️ Could not retrieve Cerebras model list automatically, using candidates: ['llama3.1-8b', 'llama3.1-70b']");
    cerebrasModelList = ['llama3.1-8b', 'llama3.1-70b'];
  } else {
    console.log(`🤖 Available Cerebras Models: [${cerebrasModelList.join(', ')}]`);
  }

  console.log("\n🧪 Testing Cerebras keys across available models:");
  for (let kIdx = 0; kIdx < cerebrasKeys.length; kIdx++) {
    const key = cerebrasKeys[kIdx];
    const keyLabel = `Key ${kIdx + 1} (${key.substring(0, 8)}...)`;
    console.log(`\n🔑 Cerebras ${keyLabel}:`);
    for (const model of cerebrasModelList) {
      await sleep(100);
      const res = await testCerebrasModel(key, model);
      if (res.ok) {
        console.log(`   ✅ ${model.padEnd(40)} -> ${res.msg}`);
      } else {
        console.log(`   ❌ ${model.padEnd(40)} -> FAILED (${res.msg})`);
      }
    }
  }

  // ----------------------------------------------------
  // 2. GEMINI DIAGNOSTICS
  // ----------------------------------------------------
  console.log("\n📡 [GEMINI] Checking model endpoints...");
  let geminiModelList: string[] = [];
  for (const key of geminiKeys) {
    geminiModelList = await getGeminiModels(key);
    if (geminiModelList.length > 0) break;
  }

  if (geminiModelList.length === 0) {
    console.log("⚠️ Could not retrieve Gemini model list automatically, using candidates: ['gemini-2.0-flash', 'gemini-1.5-flash']");
    geminiModelList = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  } else {
    // filter down to stable/flash models we actually care about to avoid testing 100 experiment models
    geminiModelList = geminiModelList.filter(m => 
      m.includes('flash') || m.includes('pro') || m.includes('gemini-2.0')
    ).slice(0, 5);
    console.log(`🤖 Available Gemini Models (selected): [${geminiModelList.join(', ')}]`);
  }

  console.log("\n🧪 Testing Gemini keys across selected models:");
  for (let kIdx = 0; kIdx < geminiKeys.length; kIdx++) {
    const key = geminiKeys[kIdx];
    const keyLabel = `Key ${kIdx + 1} (${key.substring(0, 8)}...)`;
    console.log(`\n🔑 Gemini ${keyLabel}:`);
    for (const model of geminiModelList) {
      await sleep(100);
      const res = await testGeminiModel(key, model);
      if (res.ok) {
        console.log(`   ✅ ${model.padEnd(40)} -> ${res.msg}`);
      } else {
        console.log(`   ❌ ${model.padEnd(40)} -> FAILED (${res.msg})`);
      }
    }
  }

  // ----------------------------------------------------
  // 3. GROQ DIAGNOSTICS
  // ----------------------------------------------------
  console.log("\n📡 [GROQ] Checking model endpoints...");
  let groqModelList: string[] = [];
  for (const key of groqKeys) {
    groqModelList = await getGroqModels(key);
    if (groqModelList.length > 0) break;
  }

  if (groqModelList.length === 0) {
    console.log("⚠️ Could not retrieve Groq model list automatically, using candidates: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it']");
    groqModelList = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it'];
  } else {
    // filter to relevant models
    groqModelList = groqModelList.filter(m => 
      m.includes('llama') || m.includes('gemma') || m.includes('mixtral') || m.includes('qwen')
    ).slice(0, 6);
    console.log(`🤖 Available Groq Models (selected): [${groqModelList.join(', ')}]`);
  }

  console.log("\n🧪 Testing Groq keys across selected models:");
  for (let kIdx = 0; kIdx < groqKeys.length; kIdx++) {
    const key = groqKeys[kIdx];
    const keyLabel = `Key ${kIdx + 1} (${key.substring(0, 8)}...)`;
    console.log(`\n🔑 Groq ${keyLabel}:`);
    for (const model of groqModelList) {
      await sleep(100);
      const res = await testGroqModel(key, model);
      if (res.ok) {
        console.log(`   ✅ ${model.padEnd(40)} -> ${res.msg}`);
      } else {
        console.log(`   ❌ ${model.padEnd(40)} -> FAILED (${res.msg})`);
      }
    }
  }

  console.log("\n==================================================");
  console.log("             DIAGNOSTICS COMPLETED!");
  console.log("==================================================");
}

run().catch(console.error);
