
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
  // --- GEMINI SERIES (Google AI Studio) ---
  // Note: Pro models now require paid tier as of April 2026. Using Flash/Gemma for free tier stability.
  'gemini-2.0-flash': { id: 'gemini-2.0-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1' },
  'gemini-3-flash': { id: 'gemini-3-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1' },
  'gemini-3-flash-lite': { id: 'gemini-3-flash-lite', provider: 'gemini', rpm: 30, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T3' },
  'gemini-2.5-flash': { id: 'gemini-2.5-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T4' },
  'gemma-4-31b-it': { id: 'gemma-4-31b-it', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 256000, tier: 'T1' },

  // --- GROQ SERIES ---
  // NOTE: qwen-qwq-32b REMOVED — decommissioned by Groq, causing 400 errors (2026-04-26)
  'llama-3.3-70b-versatile': { id: 'llama-3.3-70b-versatile', provider: 'groq', rpm: 30, rpd: 1000, tpm: 60000, context: 128000, tier: 'T2' },
  'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 128000, tier: 'T5' },
  'llama-4-scout': { id: 'llama-4-scout', provider: 'groq', rpm: 30, rpd: 5000, tpm: 100000, context: 128000, tier: 'T4' },
};

export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  // T1: Hardest tasks — lead with Gemini 2.0 Flash as requested, Groq 70B as primary backup
  'T1': ['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'gemma-4-31b-it', 'gemini-3-flash'],
  'T2': ['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'gemini-3-flash', 'llama-3.1-8b-instant'],
  'T3': ['gemini-2.0-flash', 'gemini-3-flash-lite', 'llama-3.3-70b-versatile', 'llama-4-scout'],
  'T4': ['gemini-3-flash-lite', 'llama-4-scout', 'llama-3.1-8b-instant', 'gemini-2.0-flash'],
  'T5': ['llama-3.1-8b-instant', 'llama-4-scout', 'gemini-3-flash-lite'],
};

export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  'groq': ['gemini'],
  'gemini': ['groq'],
};
