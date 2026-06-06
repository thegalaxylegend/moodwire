import { callGroq, GROQ_KEY_COUNT } from './groq';
import { callGemini, GEMINI_KEY_COUNT } from './gemini';
import { MODELS, WATERFALL_CHAINS } from './routingConfig';
import type { TaskTier, Provider } from './routingConfig';

type ErrorClass =
  | 'RATE_LIMIT'
  | 'AUTH'
  | 'MODEL_MISSING'
  | 'PAYLOAD_TOO_LARGE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'PROVIDER_OVERLOAD'
  | 'TRANSIENT'
  | 'KEY_MODEL_BLOCKED';

function classifyError(status: number | undefined, message: string): ErrorClass {
    const msg = message.toLowerCase();
    // Immediate AUTH for missing dev keys — do NOT retry, skip provider entirely
    if (msg.includes('no dev key for provider') || msg.includes('no dev key')) return 'AUTH';
    if (status === 429) return 'RATE_LIMIT';
    if (status === 401 || status === 403) {
        if (msg.includes('blocked at the project level') || msg.includes('model_permission_blocked_project') || msg.includes('permission')) return 'KEY_MODEL_BLOCKED';
        if (msg.includes('request too large')) return 'PAYLOAD_TOO_LARGE';
        return 'AUTH';
    }
    if (status === 404 || msg.includes('not found') || msg.includes('does not exist')) return 'MODEL_MISSING';
    if (status === 413 || msg.includes('request too large') || msg.includes('context length')) return 'PAYLOAD_TOO_LARGE';
    if (status === 500 || status === 502 || status === 503 || status === 504) return 'PROVIDER_OVERLOAD';
    if (msg.includes('timeout') || msg.includes('aborted')) return 'TIMEOUT';
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('error fetching')) return 'NETWORK';
    return 'TRANSIENT';
}

const withTimeout = <T>(promise: Promise<T>, ms: number, errMsg = 'Timeout'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(errMsg);
        (err as any).status = 408; // HTTP 408 Request Timeout
        reject(err);
      }, ms);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    })
  ]);
};

// ─── Dev-mode key availability check ─────────────────────────────────────────
// In production all providers go through the Cloudflare Worker (no local keys needed).
// In dev mode, providers without VITE_ env keys are skipped immediately.
const _devKeyCache: Record<string, boolean> = {};
function providerHasDevKey(provider: Provider): boolean {
  const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD && !import.meta.env?.VITE_DEV_AI;
  if (isProd) return true; // Worker handles all keys in production

  if (_devKeyCache[provider] !== undefined) return _devKeyCache[provider];

  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env
             : (typeof process !== 'undefined' ? process.env : {});

  let hasKey = false;
  if (provider === 'cerebras') {
    hasKey = !!(env.CEREBRAS_API_KEY || env.VITE_CEREBRAS_API_KEY ||
                env.CEREBRAS_API_KEY_2 || env.VITE_CEREBRAS_API_KEY_2);
  } else if (provider === 'together') {
    hasKey = !!(env.TOGETHER_API_KEY || env.VITE_TOGETHER_API_KEY);
  } else if (provider === 'huggingface') {
    hasKey = !!(env.HF_API_TOKEN || env.VITE_HF_API_TOKEN ||
                env.HF_API_TOKEN_2 || env.VITE_HF_API_TOKEN_2);
  } else {
    hasKey = true; // groq & gemini have their own multi-key getters
  }
  _devKeyCache[provider] = hasKey;
  return hasKey;
}

// ═══════════════════════════════════════════════════════════════════
// RPM-AWARE LOAD BALANCER v2.0
// - Sliding-window RPM tracking per (model, key)
// - Automatic cooldown on 429 errors
// - Global concurrency semaphore to prevent thundering herd
// - Least-loaded key selection (not just round-robin)
// ═══════════════════════════════════════════════════════════════════

interface KeyState {
  recentTimestamps: number[];  // Sliding window of request timestamps
  cooldownUntil: number;       // Timestamp when cooldown expires (0 = not cooling)
  dailyRequests: number;
  dailyResetAt: number;
}

const RPM_SAFETY_MARGIN = 0.70;  // Use only 70% of stated RPM limit
const COOLDOWN_DURATION = 65_000; // 65 seconds cooldown after a 429
const MAX_CONCURRENT = 3;         // Max in-flight API calls globally

class ModelRouter {
  private static instance: ModelRouter;
  private keyStates: Map<string, KeyState> = new Map();
  private blacklistedModels: Set<string> = new Set();
  private blockedKeysForModel: Set<string> = new Set();
  private deadKeys: Record<Provider, Set<number>> = {
    groq: new Set(), gemini: new Set(),
    cerebras: new Set(),
    huggingface: new Set(), together: new Set(),
  };

  // Global concurrency semaphore
  private inFlight = 0;
  private waitQueue: Array<() => void> = [];

  private constructor() {
    this.loadState();
  }

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  // ─── State Persistence ────────────────────────────────────────
  private loadState() {
    try {
      const saved = localStorage.getItem('lb_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [key, val] of Object.entries(parsed)) {
          this.keyStates.set(key, val as KeyState);
        }
      }
    } catch { /* Ignore */ }
  }

  private saveState() {
    try {
      const obj = Object.fromEntries(this.keyStates);
      localStorage.setItem('lb_state_v2', JSON.stringify(obj));
    } catch { /* Ignore */ }
  }

  // ─── Key State Management ─────────────────────────────────────
  private getStateKey(modelId: string, keyIndex: number): string {
    return `${modelId}::${keyIndex}`;
  }

  private getKeyState(modelId: string, keyIndex: number): KeyState {
    const key = this.getStateKey(modelId, keyIndex);
    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, {
        recentTimestamps: [],
        cooldownUntil: 0,
        dailyRequests: 0,
        dailyResetAt: Date.now() + 24 * 60 * 60 * 1000,
      });
    }
    return this.keyStates.get(key)!;
  }

  // ─── RPM Check (Sliding Window) ───────────────────────────────
  private getAvailableRPM(modelId: string, keyIndex: number): number {
    const spec = MODELS[modelId];
    if (!spec) return 0;

    const state = this.getKeyState(modelId, keyIndex);
    const now = Date.now();

    // Prune timestamps older than 60 seconds
    state.recentTimestamps = state.recentTimestamps.filter(t => now - t < 60_000);

    const maxRpm = Math.floor(spec.rpm * RPM_SAFETY_MARGIN);
    return maxRpm - state.recentTimestamps.length;
  }

  private isOnCooldown(modelId: string, keyIndex: number): boolean {
    const state = this.getKeyState(modelId, keyIndex);
    return Date.now() < state.cooldownUntil;
  }

  private checkDailyLimit(modelId: string, keyIndex: number): boolean {
    const spec = MODELS[modelId];
    if (!spec) return false;

    const state = this.getKeyState(modelId, keyIndex);
    const now = Date.now();

    // Reset daily counter
    if (now > state.dailyResetAt) {
      state.dailyRequests = 0;
      state.dailyResetAt = now + 24 * 60 * 60 * 1000;
    }

    return state.dailyRequests < Math.floor(spec.rpd * 0.85);
  }

  private recordRequest(modelId: string, keyIndex: number) {
    const state = this.getKeyState(modelId, keyIndex);
    state.recentTimestamps.push(Date.now());
    state.dailyRequests++;
    this.saveState();
  }

  private setCooldown(modelId: string, keyIndex: number) {
    const state = this.getKeyState(modelId, keyIndex);
    state.cooldownUntil = Date.now() + COOLDOWN_DURATION;
    console.warn(`[LoadBalancer] 🧊 Key ${keyIndex} for ${modelId} on cooldown for ${COOLDOWN_DURATION / 1000}s`);
    this.saveState();
  }

  // ─── Concurrency Semaphore ────────────────────────────────────
  private async acquireSlot(): Promise<void> {
    if (this.inFlight < MAX_CONCURRENT) {
      this.inFlight++;
      return;
    }
    // Wait for a slot to open
    return new Promise<void>(resolve => {
      this.waitQueue.push(() => {
        this.inFlight++;
        resolve();
      });
    });
  }

  private releaseSlot() {
    this.inFlight--;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    }
  }

  // ─── Smart Key Selection ──────────────────────────────────────
  private isKeyAllowedForModel(modelId: string, provider: Provider, keyIndex: number): boolean {
    const stateKey = this.getStateKey(modelId, keyIndex);
    if (this.blockedKeysForModel.has(stateKey)) {
      return false;
    }
    if (provider === 'groq') {
      // BKC Key (Key 7, index 6) only supports llama-3.3-70b-versatile
      if (keyIndex === 6 && modelId !== 'llama-3.3-70b-versatile') {
        return false;
      }
      // MoodWire Key (Key 8, index 7) only supports llama-3.1-8b-instant
      if (keyIndex === 7 && modelId !== 'llama-3.1-8b-instant') {
        return false;
      }
    }
    if (provider === 'gemini') {
      const isProOrGemma4 = modelId === 'gemini-2.5-pro' || modelId === 'gemma-4-31b-it';
      if (isProOrGemma4 && keyIndex < 4) {
        // Skips keys 1-4 (indices 0, 1, 2, 3) for gemini-2.5-pro and gemma-4-31b-it due to low quota/RPM limits on free tier
        return false;
      }
    }
    return true;
  }

  // Instead of just round-robin, pick the key with the MOST available RPM headroom
  private findBestKey(modelId: string, provider: Provider): number | null {
    // Fast-path: skip provider entirely if no dev keys configured
    if (!providerHasDevKey(provider)) {
      return null;
    }

    // groq/gemini/cerebras/huggingface have multiple keys; together has 1
    const keyCount = provider === 'groq' ? GROQ_KEY_COUNT
                   : provider === 'gemini' ? GEMINI_KEY_COUNT
                   : provider === 'cerebras' ? 8   // 8 Cerebras keys across Gmail accounts
                   : provider === 'huggingface' ? 3 // 3 HuggingFace keys across Gmail accounts
                   : 1; // together — single key
    let bestKey = -1;
    let bestAvailable = -1;

    for (let i = 0; i < keyCount; i++) {
      if (!this.isKeyAllowedForModel(modelId, provider, i)) continue;
      if (this.deadKeys[provider]?.has(i)) continue;
      if (this.isOnCooldown(modelId, i)) continue;
      if (!this.checkDailyLimit(modelId, i)) continue;

      const available = this.getAvailableRPM(modelId, i);
      if (available > bestAvailable) {
        bestAvailable = available;
        bestKey = i;
      }
    }

    return bestKey >= 0 && bestAvailable > 0 ? bestKey : null;
  }

  // ─── Execute Call ─────────────────────────────────────────────
  private async executeCall(
    modelId: string,
    messages: { role: string; content: string }[],
    provider: Provider,
    keyIndex: number,
    options: any
  ): Promise<any> {
    // In production: ALL providers go through the Cloudflare Worker
    // The Worker reads secrets from env and handles all provider-specific logic
    if (typeof import.meta !== 'undefined' && import.meta.env?.PROD && !import.meta.env?.VITE_DEV_AI) {
      // Already proxied by groq.ts / gemini.ts for groq/gemini.
      // For new providers, call the worker directly.
      if (provider !== 'groq' && provider !== 'gemini') {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, tier: options?.tier || 'T3', options: { ...options, provider, model: modelId } })
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText);
          const proxyError: any = new Error(`Worker Error: ${errText}`);
          proxyError.status = response.status;
          throw proxyError;
        }
        // Non-streaming: parse JSON response
        if (!options?.stream) return await response.json();
        // Streaming: return async generator
        if (!response.body) throw new Error('No response body for stream');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        return (async function* () {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim().startsWith('data: ') && !line.includes('[DONE]')) {
                try { yield JSON.parse(line.trim().slice(6)); } catch (e) { /* skip malformed */ }
              }
            }
          }
        })();
      }
    }

    // groq/gemini use their own client libs (which also proxy in prod)
    if (provider === 'groq') {
      return await callGroq(messages, { stream: false, ...options, model: modelId, keyIndex });
    }
    if (provider === 'gemini') {
      return await callGemini(messages, { ...options, model: modelId, keyIndex });
    }

    // DEV mode fallback for new providers — direct fetch with VITE_ keys
    const getEnvVal = (k: string) => {
      if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[k] || import.meta.env[`VITE_${k}`];
      if (typeof process !== 'undefined' && process.env) return process.env[k] || process.env[`VITE_${k}`];
      return undefined;
    };
    const devKeys: Record<string, string | undefined> = {
      cerebras:    getEnvVal(keyIndex === 0 ? 'CEREBRAS_API_KEY' : `CEREBRAS_API_KEY_${keyIndex + 1}`),
      huggingface: getEnvVal(keyIndex === 0 ? 'HF_API_TOKEN' : `HF_API_TOKEN_${keyIndex + 1}`),
      together:    getEnvVal('TOGETHER_API_KEY'),
    };
    const devKey = devKeys[provider];
    if (!devKey) throw new Error(`No dev key for provider: ${provider}`);

    let actualModel = modelId;
    if (provider === 'cerebras') {
      if (modelId === 'llama3.3-70b' || modelId === 'llama-3.3-70b') {
        actualModel = 'gpt-oss-120b';
      } else if (modelId === 'llama3.1-8b' || modelId === 'llama-3.1-8b') {
        actualModel = 'zai-glm-4.7';
      }
    }

    const endpoints: Record<string, string> = {
      cerebras:    'https://api.cerebras.ai/v1/chat/completions',
      huggingface: `https://api-inference.huggingface.co/models/${actualModel}/v1/chat/completions`,
      together:    'https://api.together.xyz/v1/chat/completions',
    };
    let maxTokens = options?.max_tokens ?? 2048;
    if (provider === 'cerebras' && actualModel === 'gpt-oss-120b') {
      maxTokens = Math.max(maxTokens, 8192);
    }
    const body: any = {
      model: actualModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      stream: false
    };
    if (provider === 'cerebras') {
      body.max_completion_tokens = maxTokens;
    } else {
      body.max_tokens = maxTokens;
    }
    if (options?.jsonMode && provider !== 'huggingface') {
        body.response_format = { type: 'json_object' };
    }

    const res = await fetch(endpoints[provider], {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${devKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e: any = new Error(`${provider} error: ${res.statusText}`);
      e.status = res.status;
      throw e;
    }
    return await res.json();
  }

  private async executeCallWithRetry(
    modelId: string,
    messages: { role: string; content: string }[],
    provider: Provider,
    keyIndex: number,
    options: any
  ): Promise<any> {
    let attempts = 0;
    const maxRetries = 2;
    while (true) {
      try {
        return await this.executeCall(modelId, messages, provider, keyIndex, options);
      } catch (error: any) {
        const status = error?.status || error?.code;
        const msg = error?.message || '';
        const errorClass = classifyError(status, msg);

        if (
          (errorClass === 'RATE_LIMIT' || errorClass === 'PROVIDER_OVERLOAD' || errorClass === 'TRANSIENT') &&
          attempts < maxRetries
        ) {
          attempts++;
          const delay = attempts * 1500 + Math.random() * 500;
          console.warn(`[LoadBalancer] Transient error (${errorClass}) on key ${keyIndex} for ${modelId}. Retrying in ${delay.toFixed(0)}ms (Attempt ${attempts}/${maxRetries}). Error: ${msg.slice(0, 150)}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }

  // ─── Main Routing Method ──────────────────────────────────────
  public async route(
    messages: { role: string; content: string }[],
    tier: TaskTier = 'T3',
    options: any = {}
  ): Promise<any> {
    const chain = WATERFALL_CHAINS[tier];
    let lastError: any = null;

    // Acquire a concurrency slot (blocks if MAX_CONCURRENT reached)
    await this.acquireSlot();

    try {
      for (const modelId of chain) {
        if (this.blacklistedModels.has(modelId)) continue;

        const spec = MODELS[modelId];
        if (!spec) continue;

        const provider = spec.provider;

        // Find the best available key for this model
        const bestKey = this.findBestKey(modelId, provider);
        if (bestKey === null) {
          // All keys for this model are exhausted or on cooldown — skip to next model
          continue;
        }

        try {
          this.recordRequest(modelId, bestKey);
          const response = await withTimeout(
            this.executeCallWithRetry(modelId, messages, provider, bestKey, options),
            35000,
            `[LoadBalancer] API call to ${modelId} timed out after 35s`
          );
          return response;
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.code;
          const msg = error?.message || '';
          
          const errorClass = classifyError(status, msg);

          if (errorClass === 'AUTH') {
            this.deadKeys[provider].add(bestKey);
            console.warn(`[LoadBalancer] 🚫 Key ${bestKey} permanently dead (${status})`);
          } else if (errorClass === 'KEY_MODEL_BLOCKED') {
            const stateKey = this.getStateKey(modelId, bestKey);
            this.blockedKeysForModel.add(stateKey);
            console.warn(`[LoadBalancer] 🛡️ Key ${bestKey} is blocked for model ${modelId}. Added to blocklist.`);
          } else if (errorClass === 'MODEL_MISSING') {
            this.setCooldown(modelId, bestKey);
            console.warn(`[LoadBalancer] ⚠️ Model ${modelId} not found. Cooldown applied instead of global blacklist.`);
            continue; // Skip trying other keys for this model
          } else if (errorClass === 'RATE_LIMIT' || errorClass === 'PROVIDER_OVERLOAD' || errorClass === 'NETWORK' || errorClass === 'TIMEOUT') {
            this.setCooldown(modelId, bestKey);
          } else if (errorClass === 'PAYLOAD_TOO_LARGE') {
            console.warn(`[LoadBalancer] 🧨 Payload too large for ${modelId}. Skipping model.`);
            continue; // Skip trying other keys for this model, payload is the issue
          }

          console.warn(`[LoadBalancer] ${modelId} key:${bestKey} failed (${errorClass}): ${msg.slice(0, 250)}`);
          
          // Skip retrying other keys for this model if it's a bad request (prompt/format rejected)
          if (status === 400) continue;

          // Try remaining keys for this model before moving to next model
          const keyCount = provider === 'groq' ? GROQ_KEY_COUNT
                         : provider === 'gemini' ? GEMINI_KEY_COUNT
                         : provider === 'cerebras' ? 8
                         : provider === 'huggingface' ? 3
                         : 1; // together — single key
          for (let i = 0; i < keyCount; i++) {
            if (i === bestKey) continue;
            if (!this.isKeyAllowedForModel(modelId, provider, i)) continue;
            if (this.deadKeys[provider].has(i)) continue;
            if (this.isOnCooldown(modelId, i)) continue;
            if (!this.checkDailyLimit(modelId, i)) continue;
            if (this.getAvailableRPM(modelId, i) <= 0) continue;

            try {
              this.recordRequest(modelId, i);
              const response = await withTimeout(
                this.executeCallWithRetry(modelId, messages, provider, i, options),
                35000,
                `[LoadBalancer] API call retry to ${modelId} timed out after 35s`
              );
              return response;
            } catch (retryError: any) {
              const retryStatus = retryError?.status || retryError?.code;
              const retryMsg = retryError?.message || '';
              const retryErrorClass = classifyError(retryStatus, retryMsg);
              
              if (retryErrorClass === 'KEY_MODEL_BLOCKED') {
                const stateKey = this.getStateKey(modelId, i);
                this.blockedKeysForModel.add(stateKey);
                console.warn(`[LoadBalancer] 🛡️ Key ${i} is blocked for model ${modelId} on retry.`);
              }
              if (retryErrorClass === 'RATE_LIMIT' || retryErrorClass === 'NETWORK' || retryErrorClass === 'TIMEOUT') this.setCooldown(modelId, i);
              if (retryErrorClass === 'AUTH') this.deadKeys[provider].add(i);
              console.warn(`[LoadBalancer] ${modelId} key:${i} retry failed (${retryErrorClass}): ${retryMsg.slice(0, 250)}`);
              continue;
            }
          }
          // All keys for this model exhausted, continue to next model in waterfall
          continue;
        }
      }

      throw lastError || new Error(`[LoadBalancer] All models in tier ${tier} exhausted.`);
    } finally {
      // ALWAYS release the concurrency slot
      this.releaseSlot();
    }
  }

  // ─── Diagnostics ──────────────────────────────────────────────
  public getStatus(): Record<string, { available: number; cooldown: boolean; daily: number }> {
    const status: Record<string, any> = {};
    for (const [modelId, spec] of Object.entries(MODELS)) {
      const keyCount = spec.provider === 'groq' ? GROQ_KEY_COUNT
                     : spec.provider === 'gemini' ? GEMINI_KEY_COUNT
                     : spec.provider === 'cerebras' ? 8
                     : spec.provider === 'huggingface' ? 3
                     : 1;
      for (let i = 0; i < keyCount; i++) {
        const key = `${modelId}::key${i}`;
        status[key] = {
          available: this.getAvailableRPM(modelId, i),
          cooldown: this.isOnCooldown(modelId, i),
          daily: this.getKeyState(modelId, i).dailyRequests,
        };
      }
    }
    return status;
  }
}

export const modelRouter = ModelRouter.getInstance();
