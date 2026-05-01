
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
  'gemini-1.5-flash': { id: 'gemini-1.5-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T1' },
  'gemini-1.5-flash-8b': { id: 'gemini-1.5-flash-8b', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T3' },
  'gemini-2.0-flash-lite-preview-02-05': { id: 'gemini-2.0-flash-lite-preview-02-05', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T4' },

  // --- GROQ SERIES ---
  // NOTE: qwen-qwq-32b REMOVED — decommissioned by Groq, causing 400 errors (2026-04-26)
  'llama-3.3-70b-versatile': { id: 'llama-3.3-70b-versatile', provider: 'groq', rpm: 30, rpd: 1000, tpm: 60000, context: 128000, tier: 'T2' },
  'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 128000, tier: 'T5' },
  'gemma2-9b-it': { id: 'gemma2-9b-it', provider: 'groq', rpm: 30, rpd: 5000, tpm: 100000, context: 8192, tier: 'T4' },
};

export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  // T1: Hardest tasks — lead with Gemini 2.0 Flash as requested, Groq 70B as primary backup
  'T1': ['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'gemini-1.5-flash'],
  'T2': ['gemini-2.0-flash', 'llama-3.3-70b-versatile', 'gemini-1.5-flash', 'llama-3.1-8b-instant'],
  'T3': ['gemini-2.0-flash', 'gemini-1.5-flash-8b', 'llama-3.3-70b-versatile', 'gemma2-9b-it'],
  'T4': ['gemini-1.5-flash-8b', 'gemma2-9b-it', 'llama-3.1-8b-instant', 'gemini-2.0-flash-lite-preview-02-05'],
  'T5': ['llama-3.1-8b-instant', 'gemma2-9b-it', 'gemini-1.5-flash-8b'],
};

export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  'groq': ['gemini'],
  'gemini': ['groq'],
};
