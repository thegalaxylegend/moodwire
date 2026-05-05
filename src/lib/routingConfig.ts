
export type TaskTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
export type Provider = 'groq' | 'gemini';

export interface ModelSpec {
  id: string;
  provider: Provider;
  rpm: number;  // Per key
  rpd: number;  // Per key
  tpm: number;
  context: number;
  tier: TaskTier;
}

export const MODELS: Record<string, ModelSpec> = {
  // ═══════════════════════════════════════════════════════════════════
  // ALL MODELS VERIFIED WORKING ON FREE TIER (tested 2026-05-03)
  // ═══════════════════════════════════════════════════════════════════

  // --- GEMINI SERIES (Google AI Studio — Free Tier) ---
  // 6 API keys available, rotating across all tiers
  'gemini-2.5-flash': { id: 'gemini-2.5-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1' },
  'gemini-2.0-flash': { id: 'gemini-2.0-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1' },
  'gemini-2.0-flash-lite': { id: 'gemini-2.0-flash-lite', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T3' },

  // --- GEMMA 4 SERIES (Google AI Studio — Free Tier, SEPARATE per-model quotas) ---
  // These use the same Gemini API keys but have independent rate limits.
  // When gemini-2.0-flash hits 429, gemma-4-31b can still serve requests.
  'gemma-4-31b-it': { id: 'gemma-4-31b-it', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072, tier: 'T2' },
  'gemma-4-26b-a4b-it': { id: 'gemma-4-26b-a4b-it', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072, tier: 'T3' },

  // --- GROQ SERIES (Free Tier) ---
  // ONLY llama-3.1-8b-instant is available on your free Groq plan.
  // All other models (llama-3.3-70b, qwen3-32b, llama-4-scout, gemma2-9b) are 403 BLOCKED.
  'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 128000, tier: 'T4' },
};

export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  // T1: Highest quality — Groq first, then Gemini, with heavy models as final fallbacks
  'T1': ['llama-3.1-8b-instant', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemma-4-26b-a4b-it', 'gemma-4-31b-it', 'gemini-2.5-flash'],
  // T2: Standard generation — balanced chain
  'T2': ['llama-3.1-8b-instant', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemma-4-26b-a4b-it', 'gemma-4-31b-it', 'gemini-2.5-flash'],
  // T3: Medium tasks — lite/gemma first to conserve heavy quota
  'T3': ['llama-3.1-8b-instant', 'gemini-2.0-flash-lite', 'gemma-4-26b-a4b-it', 'gemini-2.0-flash', 'gemma-4-31b-it'],
  // T4: Light tasks — fast models first
  'T4': ['llama-3.1-8b-instant', 'gemini-2.0-flash-lite', 'gemma-4-26b-a4b-it'],
  // T5: Cheapest tasks
  'T5': ['llama-3.1-8b-instant', 'gemini-2.0-flash-lite', 'gemma-4-26b-a4b-it'],
};

export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  'groq': ['gemini'],
  'gemini': ['groq'],
};
