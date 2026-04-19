
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
  'gemini-2.5-pro': { id: 'gemini-2.5-pro', provider: 'gemini', rpm: 2, rpd: 50, tpm: 32000, context: 2000000, tier: 'T1' },
  'gemini-2.5-flash': { id: 'gemini-2.5-flash', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T3' },
  'gemini-2.5-flash-lite': { id: 'gemini-2.5-flash-lite', provider: 'gemini', rpm: 30, rpd: 1500, tpm: 1000000, context: 1000000, tier: 'T4' },
  'gemma-4-31b-it': { id: 'gemma-4-31b-it', provider: 'gemini', rpm: 15, rpd: 1500, tpm: 1000000, context: 256000, tier: 'T1' },

  // --- GROQ SERIES ---
  'llama-3.3-70b-versatile': { id: 'llama-3.3-70b-versatile', provider: 'groq', rpm: 30, rpd: 1000, tpm: 60000, context: 128000, tier: 'T2' },
  'llama-3.1-8b-instant': { id: 'llama-3.1-8b-instant', provider: 'groq', rpm: 30, rpd: 14400, tpm: 100000, context: 128000, tier: 'T5' },
  'qwen-qwq-32b': { id: 'qwen-qwq-32b', provider: 'groq', rpm: 30, rpd: 1000, tpm: 100000, context: 32000, tier: 'T1' },
  'llama-4-scout': { id: 'llama-4-scout', provider: 'groq', rpm: 30, rpd: 5000, tpm: 100000, context: 128000, tier: 'T4' },
};

export const WATERFALL_CHAINS: Record<TaskTier, string[]> = {
  'T1': ['qwen-qwq-32b', 'llama-3.3-70b-versatile', 'gemma-4-31b-it', 'gemini-2.5-pro'],
  'T2': ['llama-3.3-70b-versatile', 'gemini-2.5-flash', 'llama-3.1-8b-instant'],
  'T3': ['gemini-2.5-flash', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  'T4': ['gemini-2.5-flash-lite', 'llama-3.1-8b-instant'],
  'T5': ['llama-3.1-8b-instant', 'gemini-2.5-flash-lite'],
};

export const PROVIDER_FALLBACK: Record<Provider, Provider[]> = {
  'groq': ['gemini'],
  'gemini': ['groq'],
};
