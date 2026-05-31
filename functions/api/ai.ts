// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS LOAD BALANCER v3.0 — Cloudflare Pages Function
// Model-First Rotation | Multi-Provider | 5-State Circuit Breaker
// All API keys read from Cloudflare env secrets — NEVER exposed to browser
// ═══════════════════════════════════════════════════════════════════

// Cloudflare KV type — available at runtime; declared here for local TS builds
declare interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  // Groq Keys (8 keys across multiple Gmail accounts)
  // Keys 1-6: full model access | Key 7 (Bkc): 70b only | Key 8 (MoodWire): 8b only
  GROQ_API_KEY: string; GROQ_API_KEY_2: string; GROQ_API_KEY_3: string;
  GROQ_API_KEY_4: string; GROQ_API_KEY_5: string; GROQ_API_KEY_6: string;
  GROQ_API_KEY_7: string; GROQ_API_KEY_8: string;
  // Gemini Keys (6 different Gmail accounts)
  GEMINI_API_KEY: string; GEMINI_API_KEY_2: string; GEMINI_API_KEY_3: string;
  GEMINI_API_KEY_4: string; GEMINI_API_KEY_5: string;
  GEMINI_API_KEY_6: string; GEMINI_API_KEY_7: string;
  // Cerebras Keys (8 keys across Gmail accounts)
  CEREBRAS_API_KEY: string; CEREBRAS_API_KEY_2: string; CEREBRAS_API_KEY_3: string;
  CEREBRAS_API_KEY_4: string; CEREBRAS_API_KEY_5: string; CEREBRAS_API_KEY_6: string;
  CEREBRAS_API_KEY_7: string; CEREBRAS_API_KEY_8: string;
  // HuggingFace Keys (3 keys across Gmail accounts)
  HF_API_TOKEN: string; HF_API_TOKEN_2: string; HF_API_TOKEN_3: string;
  // Together AI
  TOGETHER_API_KEY: string;
  // Cloudflare KV for global rate-limit state (bind in Pages settings as "LB_STATE")
  LB_STATE?: KVNamespace;
}

// ─── Model Registry ───────────────────────────────────────────────
const MODELS: Record<string, { provider: string; rpm: number; rpd: number; tier: string }> = {
  // GROQ — 8 keys (6 full + Bkc 70b-only + MoodWire 8b-only)
  'qwen/qwen3-32b': { provider: 'groq', rpm: 30, rpd: 1000, tier: 'T1' },
  'llama-3.3-70b-versatile': { provider: 'groq', rpm: 30, rpd: 1000, tier: 'T2' },
  'meta-llama/llama-4-scout-17b-16e-instruct': { provider: 'groq', rpm: 30, rpd: 5000, tier: 'T4' },
  'llama-3.1-8b-instant': { provider: 'groq', rpm: 30, rpd: 14400, tier: 'T5' },

  // GEMINI — 6 independent accounts × 15 RPM per model = 90 RPM each
  'gemma-4-31b-it': { provider: 'gemini', rpm: 15, rpd: 1500, tier: 'T1' },
  'gemini-2.5-pro': { provider: 'gemini', rpm: 2, rpd: 50, tier: 'T1' },
  'gemma-4-26b-a4b-it': { provider: 'gemini', rpm: 15, rpd: 1500, tier: 'T2' },
  'gemini-2.5-flash': { provider: 'gemini', rpm: 15, rpd: 1500, tier: 'T3' },
  'gemini-2.5-flash-lite': { provider: 'gemini', rpm: 30, rpd: 1500, tier: 'T4' },

  // CEREBRAS — 8 keys × 60/120 RPM = 480/960 RPM fleet
  'gpt-oss-120b': { provider: 'cerebras', rpm: 60, rpd: 28800, tier: 'T1' },
  'llama3.1-8b': { provider: 'cerebras', rpm: 120, rpd: 57600, tier: 'T4' },
};

// ─── Waterfall chains per tier ────────────────────────────────────
const WATERFALL: Record<string, string[]> = {
  T1: [
    'gemma-4-31b-it',
    'gemini-2.5-pro',
    'qwen/qwen3-32b',
    'gpt-oss-120b',
  ],
  T2: [
    'gemma-4-26b-a4b-it',
    'llama-3.3-70b-versatile',
    'gpt-oss-120b',
  ],
  T3: [
    'gemini-2.5-flash',
    'llama-3.3-70b-versatile',
  ],
  T4: [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'gemini-2.5-flash-lite',
    'llama3.1-8b',
  ],
  T5: [
    'llama-3.1-8b-instant',
    'llama3.1-8b',
  ],
};

// ─── Key pools per provider ───────────────────────────────────────
function getKeys(provider: string, env: Env): string[] {
  switch (provider) {
    case 'groq': return [env.GROQ_API_KEY, env.GROQ_API_KEY_2, env.GROQ_API_KEY_3, env.GROQ_API_KEY_4, env.GROQ_API_KEY_5, env.GROQ_API_KEY_6, env.GROQ_API_KEY_7, env.GROQ_API_KEY_8].filter(Boolean);
    case 'gemini': return [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5, env.GEMINI_API_KEY_6, env.GEMINI_API_KEY_7].filter(Boolean);
    case 'cerebras': return [env.CEREBRAS_API_KEY, env.CEREBRAS_API_KEY_2, env.CEREBRAS_API_KEY_3, env.CEREBRAS_API_KEY_4, env.CEREBRAS_API_KEY_5, env.CEREBRAS_API_KEY_6, env.CEREBRAS_API_KEY_7, env.CEREBRAS_API_KEY_8].filter(Boolean);
    case 'huggingface': return [env.HF_API_TOKEN, env.HF_API_TOKEN_2, env.HF_API_TOKEN_3].filter(Boolean);
    case 'together': return [env.TOGETHER_API_KEY].filter(Boolean);
    default: return [];
  }
}

// ─── KV-backed cooldown state ─────────────────────────────────────
// Key format: "cd::{modelId}::{keyIndex}" → timestamp when cooldown expires
async function isOnCooldown(kv: KVNamespace | undefined, modelId: string, keyIdx: number): Promise<boolean> {
  if (!kv) return false;
  const val = await kv.get(`cd::${modelId}::${keyIdx}`);
  if (!val) return false;
  return Date.now() < parseInt(val);
}

async function setCooldown(kv: KVNamespace | undefined, modelId: string, keyIdx: number, ms = 65_000) {
  if (!kv) return;
  await kv.put(`cd::${modelId}::${keyIdx}`, String(Date.now() + ms), { expirationTtl: Math.ceil(ms / 1000) + 10 });
}

async function markDead(kv: KVNamespace | undefined, modelId: string, keyIdx: number) {
  if (!kv) return;
  await kv.put(`dead::${modelId}::${keyIdx}`, '1', { expirationTtl: 86400 }); // dead for 24h
}

async function isDead(kv: KVNamespace | undefined, modelId: string, keyIdx: number): Promise<boolean> {
  if (!kv) return false;
  return !!(await kv.get(`dead::${modelId}::${keyIdx}`));
}

// ─── Circuit Breaker: count global cooldowns ──────────────────────
// Returns fraction of models currently on cooldown (0.0–1.0)
async function getSystemPressure(kv: KVNamespace | undefined): Promise<number> {
  if (!kv) return 0;
  const total = Object.keys(MODELS).length;
  let onCooldown = 0;
  const checks = Object.keys(MODELS).map(async (m) => {
    const spec = MODELS[m];
    let keyCount = 1;
    if (spec.provider === 'groq') keyCount = 8;
    else if (spec.provider === 'gemini') keyCount = 7;
    else if (spec.provider === 'cerebras') keyCount = 8;
    else if (spec.provider === 'huggingface') keyCount = 3;

    for (let i = 0; i < keyCount; i++) {
      if (await isOnCooldown(kv, m, i)) { onCooldown++; break; }
    }
  });
  await Promise.all(checks);
  return onCooldown / total;
}

// ─── Per-provider API call ─────────────────────────────────────────
async function callProvider(
  modelId: string,
  provider: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  options: any
): Promise<Response> {
  const stream = options?.stream ?? true;
  const temp = options?.temperature ?? 0.7;
  const maxTok = options?.max_tokens ?? 2048;
  const jsonMode = options?.jsonMode ?? false;

  // ── GROQ ──────────────────────────────────────────────────────────
  if (provider === 'groq') {
    const body: any = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: 'json_object' };
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // ── GEMINI ────────────────────────────────────────────────────────
  if (provider === 'gemini') {
    const sysMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.find(m => m.role === 'user')?.content || messages[messages.length - 1]?.content || '';
    const prompt = sysMsg ? `${sysMsg}\n\n${userMsg}` : userMsg;
    const endpoint = stream
      ? `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const gemBody: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: temp, maxOutputTokens: options?.maxOutputTokens ?? maxTok },
    };
    if (jsonMode && !stream) gemBody.generationConfig.responseMimeType = 'application/json';
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gemBody),
    });
  }

  // ── CEREBRAS (OpenAI-compatible) ──────────────────────────────────
  if (provider === 'cerebras') {
    const body: any = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: 'json_object' };
    return fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  // ── HUGGINGFACE ───────────────────────────────────────────────────
  if (provider === 'huggingface') {
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    return fetch(`https://api-inference.huggingface.co/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, messages, temperature: temp, max_tokens: maxTok, stream: false }),
    });
  }

  // ── TOGETHER AI (OpenAI-compatible) ──────────────────────────────
  if (provider === 'together') {
    const body: any = { model: modelId, messages, temperature: temp, max_tokens: maxTok, stream };
    if (jsonMode && !stream) body.response_format = { type: 'json_object' };
    return fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── CORS headers ─────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as any;
    const { messages, tier = 'T3', options = {} } = body;

    if (!messages || !Array.isArray(messages)) return err('messages array required', 400);

    const kv = env.LB_STATE;
    const chain = WATERFALL[tier] || WATERFALL['T3'];

    // ── Circuit Breaker: check global pressure ──────────────────────
    const pressure = await getSystemPressure(kv);
    // STRESSED (>60%): only serve T1/T2, cache-only for T3-T5
    if (pressure > 0.6 && (tier === 'T3' || tier === 'T4' || tier === 'T5')) {
      return err('CIRCUIT_BREAKER_STRESSED: system under load, use cached content', 503);
    }
    // CRITICAL (>80%): only T1 gets live generation
    if (pressure > 0.8 && tier !== 'T1') {
      return err('CIRCUIT_BREAKER_CRITICAL: only T1 served live', 503);
    }

    // ── Model-First Waterfall ───────────────────────────────────────
    let lastErr = 'All models exhausted';

    for (const modelId of chain) {
      const spec = MODELS[modelId];
      if (!spec) continue;

      const keys = getKeys(spec.provider, env);
      if (!keys.length) continue;

      // Pick best key (least recently used = not on cooldown)
      for (let ki = 0; ki < keys.length; ki++) {
        if (await isDead(kv, modelId, ki)) continue;
        if (await isOnCooldown(kv, modelId, ki)) continue;

        // Restrict specific Groq keys from being used on non-matching models
        if (spec.provider === 'groq') {
          if (ki === 6 && modelId !== 'llama-3.3-70b-versatile') continue;
          if (ki === 7 && modelId !== 'llama-3.1-8b-instant') continue;
        }

        try {
          const res = await callProvider(modelId, spec.provider, keys[ki], messages, options);

          // Handle rate limit errors from provider
          if (res.status === 429) {
            await setCooldown(kv, modelId, ki, 65_000);
            lastErr = `${modelId}[key${ki}] 429`;
            continue; // try next key
          }
          if (res.status === 401 || res.status === 403) {
            await markDead(kv, modelId, ki);
            lastErr = `${modelId}[key${ki}] ${res.status} dead`;
            continue;
          }
          if (res.status === 404) {
            // Model doesn't exist on this provider variant — skip whole model
            lastErr = `${modelId} 404`;
            break; // break key loop, continue model loop
          }
          if (!res.ok) {
            lastErr = `${modelId}[key${ki}] HTTP ${res.status}`;
            continue;
          }

          // ✅ Success — pass response through
          return new Response(res.body, {
            status: res.status,
            headers: {
              ...CORS,
              'Content-Type': res.headers.get('Content-Type') || 'application/json',
              'X-Model-Used': modelId,
              'X-Provider': spec.provider,
              'X-Key-Index': String(ki),
            },
          });

        } catch (callErr: any) {
          lastErr = callErr.message;
          continue;
        }
      }
    }

    // All models exhausted — return structured BLACKOUT error
    return err(`BLACKOUT:${lastErr}`, 429);

  } catch (e: any) {
    return err(e.message || 'Internal error', 500);
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
