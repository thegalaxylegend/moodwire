import { callGroq, GROQ_KEY_COUNT } from './groq';
import { callGemini, GEMINI_KEY_COUNT } from './gemini';
import { MODELS, WATERFALL_CHAINS } from './routingConfig';
import type { TaskTier, Provider } from './routingConfig';

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
  private deadKeys: Record<Provider, Set<number>> = { groq: new Set(), gemini: new Set() };

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
  // Instead of just round-robin, pick the key with the MOST available RPM headroom
  private findBestKey(modelId: string, provider: Provider): number | null {
    const keyCount = provider === 'groq' ? GROQ_KEY_COUNT : GEMINI_KEY_COUNT;
    let bestKey = -1;
    let bestAvailable = -1;

    for (let i = 0; i < keyCount; i++) {
      if (this.deadKeys[provider].has(i)) continue;
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
    if (provider === 'groq') {
      return await callGroq(messages, { ...options, model: modelId, keyIndex });
    } else {
      return await callGemini(messages, { ...options, model: modelId, keyIndex });
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
          const response = await this.executeCall(modelId, messages, provider, bestKey, options);
          return response;
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.code;

          if (status === 401 || status === 403) {
            this.deadKeys[provider].add(bestKey);
            console.warn(`[LoadBalancer] 🚫 Key ${bestKey} permanently dead (${status})`);
          } else if (status === 404) {
            this.blacklistedModels.add(modelId);
            console.warn(`[LoadBalancer] 🚫 Model ${modelId} blacklisted (${status})`);
          } else if (status === 429) {
            this.setCooldown(modelId, bestKey);
          }

          console.warn(`[LoadBalancer] ${modelId} key:${bestKey} failed: ${error.message?.slice(0, 100)}`);
          
          // Skip retrying other keys for this model if it's a bad request (prompt/format rejected) or model not found
          if (status === 400 || status === 404) continue;

          // Try remaining keys for this model before moving to next model
          const keyCount = provider === 'groq' ? GROQ_KEY_COUNT : GEMINI_KEY_COUNT;
          for (let i = 0; i < keyCount; i++) {
            if (i === bestKey) continue;
            if (this.deadKeys[provider].has(i)) continue;
            if (this.isOnCooldown(modelId, i)) continue;
            if (!this.checkDailyLimit(modelId, i)) continue;
            if (this.getAvailableRPM(modelId, i) <= 0) continue;

            try {
              this.recordRequest(modelId, i);
              const response = await this.executeCall(modelId, messages, provider, i, options);
              return response;
            } catch (retryError: any) {
              const retryStatus = retryError?.status || retryError?.code;
              if (retryStatus === 429) this.setCooldown(modelId, i);
              if (retryStatus === 401 || retryStatus === 403) this.deadKeys[provider].add(i);
              console.warn(`[LoadBalancer] ${modelId} key:${i} retry failed: ${retryError.message?.slice(0, 80)}`);
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
      const keyCount = spec.provider === 'groq' ? GROQ_KEY_COUNT : GEMINI_KEY_COUNT;
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
