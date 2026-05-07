
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
  maxOutput: number;  // Max output tokens
}

export const MODELS: Record<string, ModelSpec> = {
  // ═══════════════════════════════════════════════════════════════════
  // MODEL POOL — Updated 2026-05-07
  // STRATEGY: Groq = PRIMARY (fastest inference), Gemini = BACKUP
  // ═══════════════════════════════════════════════════════════════════

  // --- GROQ PRIMARY FLEET (Free Tier — ~30 RPM, ~1000 RPD per model) ---
  // These are blazing fast (<500ms) and should be tried FIRST.
  'llama-3.3-70b-versatile':                { id: 'llama-3.3-70b-versatile',                provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 131072, tier: 'T1', maxOutput: 8192 },
  'qwen/qwen3-32b':                         { id: 'qwen/qwen3-32b',                         provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 131072, tier: 'T2', maxOutput: 8192 },
  'meta-llama/llama-4-scout-17b-16e-instruct': { id: 'meta-llama/llama-4-scout-17b-16e-instruct', provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 131072, tier: 'T2', maxOutput: 8192 },
  'moonshotai/kimi-k2-instruct':             { id: 'moonshotai/kimi-k2-instruct',             provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 131072, tier: 'T2', maxOutput: 8192 },
  'llama-3.1-8b-instant':                    { id: 'llama-3.1-8b-instant',                    provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 131072, tier: 'T4', maxOutput: 8192 },

  // --- GEMMA SERIES (Gemini API — SEPARATE quotas from Gemini flash models) ---
  // These are the Gemini-side workhorses with independent rate limits.
  'gemma-4-26b-a4b-it':                      { id: 'gemma-4-26b-a4b-it', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072, tier: 'T3', maxOutput: 8192 },
  'gemma-4-31b-it':                          { id: 'gemma-4-31b-it',     provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 131072, tier: 'T2', maxOutput: 8192 },

  // --- GEMINI SERIES (Google AI Studio — Free Tier, LAST RESORT) ---
  'gemini-2.5-flash':      { id: 'gemini-2.5-flash',      provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1', maxOutput: 8192 },
  'gemini-2.0-flash':      { id: 'gemini-2.0-flash',      provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1', maxOutput: 8192 },
  'gemini-2.0-flash-lite': { id: 'gemini-2.0-flash-lite', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T3', maxOutput: 8192 },
};

export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  // ═══════════════════════════════════════════════════════════════════
  // STRATEGY: Groq fleet FIRST (fast, multiple models = more quota)
  //           → Gemma fallback (independent Gemini quotas)
  //           → Gemini flash last resort
  // ═══════════════════════════════════════════════════════════════════

  // T1: Highest quality — big Groq models → Gemma → Gemini premium
  'T1': [
    'llama-3.3-70b-versatile', 'qwen/qwen3-32b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'gemma-4-31b-it', 'gemma-4-26b-a4b-it',
    'gemini-2.5-flash', 'gemini-2.0-flash'
  ],
  // T2: Standard generation — spread across Groq fleet → Gemma → Gemini
  'T2': [
    'qwen/qwen3-32b', 'llama-3.3-70b-versatile', 'meta-llama/llama-4-scout-17b-16e-instruct',
    'gemma-4-26b-a4b-it', 'gemma-4-31b-it',
    'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'
  ],
  // T3: Medium tasks — lightweight Groq → Gemma → Gemini lite
  'T3': [
    'meta-llama/llama-4-scout-17b-16e-instruct', 'qwen/qwen3-32b',
    'llama-3.3-70b-versatile',
    'gemma-4-26b-a4b-it', 'gemma-4-31b-it',
    'gemini-2.0-flash-lite', 'gemini-2.5-flash'
  ],
  // T4: Light tasks — fast Groq → Gemma
  'T4': [
    'llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct',
    'qwen/qwen3-32b', 'gemma-4-26b-a4b-it',
    'gemini-2.0-flash-lite', 'gemini-2.5-flash'
  ],
  // T5: Cheapest tasks
  'T5': [
    'llama-3.1-8b-instant', 'meta-llama/llama-4-scout-17b-16e-instruct',
    'gemma-4-26b-a4b-it', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'
  ],
};

export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  'groq': ['gemini'],
  'gemini': ['groq'],
};
