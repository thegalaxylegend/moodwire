import { callGroq, GROQ_KEY_COUNT } from './groq';
import { callGemini, GEMINI_KEY_COUNT } from './gemini';
import { MODELS, WATERFALL_CHAINS } from './routingConfig';
import type { TaskTier, Provider } from './routingConfig';

interface UsageStats {
  requests: number;
  tokens: number;
  lastReset: number;
}

class ModelRouter {
  private static instance: ModelRouter;
  private keyIndices: Record<Provider, number> = { groq: 0, gemini: 0 };
  private deadKeys: Record<Provider, Set<number>> = { groq: new Set(), gemini: new Set() };
  private usage: Map<string, UsageStats> = new Map();
  private blacklistedModels: Set<string> = new Set();

  private constructor() {
    this.loadUsage();
  }

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  private loadUsage() {
    try {
      const saved = localStorage.getItem('ai_routing_usage');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.usage = new Map(Object.entries(parsed));
      }
    } catch (e) { /* Ignore */ }
  }

  private saveUsage() {
    try {
      const obj = Object.fromEntries(this.usage);
      localStorage.setItem('ai_routing_usage', JSON.stringify(obj));
    } catch (e) { /* Ignore */ }
  }

  private getUsageKey(modelId: string, keyIndex: number): string {
    return `${modelId}_key_${keyIndex}`;
  }

  private checkDailyLimit(modelId: string, keyIndex: number): boolean {
    const spec = MODELS[modelId];
    if (!spec) return true;

    const stats = this.usage.get(this.getUsageKey(modelId, keyIndex));
    if (!stats) return true;

    // Reset daily if it's a new day (rough check based on 24h)
    if (Date.now() - stats.lastReset > 24 * 60 * 60 * 1000) {
      stats.requests = 0;
      stats.lastReset = Date.now();
      return true;
    }

    // 85% safety threshold
    return stats.requests < (spec.rpd * 0.85);
  }

  private incrementUsage(modelId: string, keyIndex: number) {
    const key = this.getUsageKey(modelId, keyIndex);
    const stats = this.usage.get(key) || { requests: 0, tokens: 0, lastReset: Date.now() };
    stats.requests++;
    this.usage.set(key, stats);
    this.saveUsage(); 
  }

  private async executeCall(
    modelId: string,
    messages: { role: string; content: string }[],
    provider: Provider,
    keyIndex: number,
    options: any
  ): Promise<any> {
    if (provider === 'groq') {
      return await callGroq(messages, { ...options, model: modelId, keyIndex });
    } else {
      return await callGemini(messages, { ...options, model: modelId, keyIndex });
    }
  }

  public async route(
    messages: { role: string; content: string }[],
    tier: TaskTier = 'T3',
    options: any = {}
  ): Promise<any> {
    const chain = WATERFALL_CHAINS[tier];
    let lastError: any = null;

    for (const modelId of chain) {
      if (this.blacklistedModels.has(modelId)) continue;
      
      const spec = MODELS[modelId];
      if (!spec) continue;

      const provider = spec.provider;
      const keyCount = provider === 'groq' ? GROQ_KEY_COUNT : GEMINI_KEY_COUNT;

      for (let i = 0; i < keyCount; i++) {
        const keyIndex = (this.keyIndices[provider] + i) % keyCount;
        if (this.deadKeys[provider].has(keyIndex)) continue;

        try {
          if (!this.checkDailyLimit(modelId, keyIndex)) {
            continue;
          }

          const response = await this.executeCall(modelId, messages, provider, keyIndex, options);
          this.incrementUsage(modelId, keyIndex);
          return response;
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.code;
          
          if (status === 401 || status === 403) {
            this.deadKeys[provider].add(keyIndex);
          } else if (status === 404) {
            this.blacklistedModels.add(modelId);
          } else if (status === 429) {
            // Rate limit hit: rotate key immediately
            this.keyIndices[provider] = (keyIndex + 1) % keyCount;
          }
          
          console.warn(`[ModelRouter] ${modelId} on key ${keyIndex} failed: ${error.message?.slice(0, 100)}`);
          continue;
        }
      }
    }

    throw lastError || new Error(`All models in tier ${tier} failed.`);
  }
}

export const modelRouter = ModelRouter.getInstance();
