
export type TaskTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
export type Provider = 'groq' | 'gemini' | 'cerebras' | 'huggingface' | 'together';

export interface ModelSpec {
  id: string;
  provider: Provider;
  rpm: number;   // Per key (or total for single-key providers)
  rpd: number;
  tpm: number;
  context: number;
  tier: TaskTier;
  maxOutput: number;
}

export const MODELS: Record<string, ModelSpec> = {
  // ═══════════════════════════════════════════════════════════
  // GROQ FLEET — 8 keys across multiple Gmail accounts
  // Keys 1-6: full access to all models (30 RPM each)
  // Key 7 (Bkc): only llama-3.3-70b-versatile
  // Key 8 (MoodWire): only llama-3.1-8b-instant
  // ═══════════════════════════════════════════════════════════
  'llama-3.3-70b-versatile':
    { id: 'llama-3.3-70b-versatile',                provider: 'groq', rpm: 30, rpd: 1000,  tpm: 100000, context: 131072, tier: 'T1', maxOutput: 8192 },
  'qwen/qwen3-32b':
    { id: 'qwen/qwen3-32b',                         provider: 'groq', rpm: 30, rpd: 1000,  tpm: 100000, context: 131072, tier: 'T2', maxOutput: 8192 },
  'meta-llama/llama-4-scout-17b-16e-instruct':
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 131072, tier: 'T2', maxOutput: 8192 },
  'llama-3.1-8b-instant':
    { id: 'llama-3.1-8b-instant',                    provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 131072, tier: 'T4', maxOutput: 8192 },

  // ═══════════════════════════════════════════════════════════
  // GEMINI FLEET — 6 different Gmail accounts = independent RPM
  // GEMINI — 6 independent accounts × 15 RPM per model = 90 RPM each
  'gemini-2.5-flash':
    { id: 'gemini-2.5-flash',      provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1', maxOutput: 8192 },
  'gemma-4-31b-it':
    { id: 'gemma-4-31b-it',        provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072,  tier: 'T2', maxOutput: 8192 },
  'gemma-4-26b-a4b-it':
    { id: 'gemma-4-26b-a4b-it',    provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072,  tier: 'T3', maxOutput: 8192 },

  // ═══════════════════════════════════════════════════════════
  // CEREBRAS FLEET — 8 keys across Gmail accounts
  // Ultra-fast hardware inference, 60 RPM (70b) / 120 RPM (8b) per key
  // ═══════════════════════════════════════════════════════════
  'gpt-oss-120b':
    { id: 'gpt-oss-120b', provider: 'cerebras', rpm: 60,  rpd: 28800, tpm: 60000, context: 128000, tier: 'T1', maxOutput: 8192 },
  'zai-glm-4.7':
    { id: 'zai-glm-4.7',  provider: 'cerebras', rpm: 120, rpd: 57600, tpm: 60000, context: 128000, tier: 'T4', maxOutput: 8192 },

  // ═══════════════════════════════════════════════════════════
  // HUGGINGFACE FLEET — 3 keys across Gmail accounts
  // ═══════════════════════════════════════════════════════════
  'Qwen/Qwen2.5-7B-Instruct':
    { id: 'Qwen/Qwen2.5-7B-Instruct', provider: 'huggingface', rpm: 30, rpd: 5000, tpm: 32768, context: 32768, tier: 'T2', maxOutput: 4096 },

  // ═══════════════════════════════════════════════════════════
  // TOGETHER AI — Broad model support
  // ═══════════════════════════════════════════════════════════
  'meta-llama/Llama-3.3-70B-Instruct-Turbo':
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', provider: 'together', rpm: 60, rpd: 10000, tpm: 32768, context: 131072, tier: 'T2', maxOutput: 4096 },
};

// ═══════════════════════════════════════════════════════════════
// WATERFALL CHAINS — Priority: Cerebras → Groq → Gemini
// Cerebras: ultra-fast hardware inference (60-120 RPM × 8 keys)
// Groq:     fast cloud inference (30 RPM × 8 keys)
// Gemini:   large context fallback (15 RPM × 6 keys)
// ALL requests go through Cloudflare Worker in production
// ═══════════════════════════════════════════════════════════════
export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  // T1: JEE Advanced / Expert accuracy required
  T1: [
    'gpt-oss-120b',                        // Cerebras 480 RPM (8 keys × 60) — FIRST
    'llama-3.3-70b-versatile',             // Groq 210 RPM (7 keys × 30)
    'qwen/qwen3-32b',                      // Groq
    'gemini-2.5-flash',                    // Gemini 90 RPM (6 keys × 15) — LAST
    'gemma-4-31b-it',
  ],

  // T2: JEE Main / NEET question generation
  T2: [
    'gpt-oss-120b',                        // Cerebras — FIRST
    'qwen/qwen3-32b',                      // Groq
    'meta-llama/llama-4-scout-17b-16e-instruct', // Groq
    'Qwen/Qwen2.5-7B-Instruct',           // HuggingFace (3 keys)
    'meta-llama/Llama-3.3-70B-Instruct-Turbo', // Together AI
    'gemma-4-31b-it',                      // Gemini
    'gemini-2.5-flash',                    // Gemini — LAST
  ],

  // T3: Student chatbot / doubt solving — Cerebras → Groq → Gemini
  T3: [
    'gpt-oss-120b',                        // Cerebras 480 RPM — FIRST (sub-second latency)
    'meta-llama/llama-4-scout-17b-16e-instruct', // Groq
    'qwen/qwen3-32b',                      // Groq
    'gemini-2.5-flash',                    // Gemini — LAST
  ],

  // T4: Light tasks (formatting, memory extraction)
  T4: [
    'zai-glm-4.7',           // Cerebras 960 RPM (8 keys × 120) — FIRST
    'llama-3.1-8b-instant',  // Groq 210 RPM (7 keys × 30)
    'gemma-4-26b-a4b-it',   // Gemini
    'gemini-2.5-flash',      // Gemini — LAST
  ],

  // T5: Cheapest tasks (JSON parsing, unit checks)
  T5: [
    'zai-glm-4.7',           // Cerebras — FIRST
    'llama-3.1-8b-instant',  // Groq
    'gemma-4-26b-a4b-it',   // Gemini
    'gemini-2.5-flash',      // Gemini — LAST
  ],
};


export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  groq:        ['cerebras', 'gemini', 'together', 'huggingface'],
  gemini:      ['groq', 'cerebras', 'together'],
  cerebras:    ['groq', 'gemini'],
  huggingface: ['groq', 'gemini'],
  together:    ['groq', 'gemini'],
};

