
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               🌐  NODE ROUTER v2  —  Jules LLM Orchestrator  ║
 * ║         Multi-Provider · Multi-Key · Smart Rate-Limit Skip   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * v2 CHANGES (2026-05-07) — Fixes for 2hr+ pipeline runs:
 *   1. SMART MODEL SKIP: If all keys for a model are rate-limited,
 *      skip the ENTIRE model instantly (no more trying 6 dead keys).
 *   2. SESSION CONTEXT BLACKLIST: If a model fails with CONTEXT once,
 *      it's blacklisted for the entire session (no more repeated failures).
 *   3. ESCALATING COOLDOWNS: Repeated 429s on the same key = longer cooldowns.
 *   4. ZERO-SLEEP ROTATION: Rate-limit hits rotate instantly (no 500ms sleep).
 *   5. GROQ-FIRST STRATEGY: Groq fleet tried first (4 models × 6 keys = 24 slots)
 *      before touching any Gemini quota.
 *
 * Error types handled per attempt:
 *   401 Unauthorized   → Poison the key (never use again this session)
 *   403 Forbidden      → Same as 401 (wrong scopes / suspended)
 *   429 Rate-Limited   → Mark key+model with escalating cooldown, rotate instantly
 *   500/503 Server     → Soft retry after 3s, rotate model
 *   ECONNRESET/ETIMEDOUT / fetch failed → Network transient, 3s wait
 *   Context Window exceeded (400/413) → Blacklist model for session
 *   Output blocked (safety filter)    → Treat as soft refusal, skip key
 *   Unknown            → Log + continue to next key/model
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

import { MODELS, WATERFALL_CHAINS, TaskTier, Provider } from '../../src/lib/routingConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'quota-state.json');

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageStats {
    requests: number;
    lastReset: number;
}

type ErrorCategory =
    | 'POISON'        // 401 / 403 — dead key
    | 'RATE_LIMIT'    // 429
    | 'CONTEXT'       // 400 context window / 413 payload too large
    | 'SERVER'        // 500 / 502 / 503 / 504
    | 'NETWORK'       // ECONNRESET / ETIMEDOUT / fetch failed
    | 'SAFETY'        // Gemini safety / Groq policy block
    | 'UNKNOWN';

// ─── Error classifier ─────────────────────────────────────────────────────────

function classifyError(err: any): ErrorCategory {
    const status: number = err?.status ?? err?.response?.status ?? err?.statusCode ?? 0;
    const msg: string = (err?.message ?? '').toLowerCase();

    if (status === 401 || status === 403 || msg.includes('invalid api key') || msg.includes('unauthorized')) return 'POISON';
    if (status === 429 || msg.includes('rate limit') || msg.includes('quota exceeded') || msg.includes('resource exhausted')) return 'RATE_LIMIT';
    if (status === 400 && (msg.includes('context') || msg.includes('token') || msg.includes('length'))) return 'CONTEXT';
    if (status === 413 || msg.includes('payload too large') || msg.includes('too many tokens')) return 'CONTEXT';
    if ([500, 502, 503, 504].includes(status) || msg.includes('internal server')) return 'SERVER';
    if (msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('fetch failed') || msg.includes('network') || msg.includes('socket')) return 'NETWORK';
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('finish_reason: safety') || msg.includes('recitation')) return 'SAFETY';
    return 'UNKNOWN';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function backoffMs(attempt: number, base = 2000): number {
    // Capped exponential: 2s, 4s, 8s, 16s, max 30s
    return Math.min(base * Math.pow(2, attempt), 30_000);
}

// ─── NodeRouter v2 ────────────────────────────────────────────────────────────

class NodeRouter {
    private static instance: NodeRouter;
    private keyIndices: Record<Provider, number> = { groq: 0, gemini: 0 };
    private usage: Record<string, UsageStats> = {};
    private groqKeys: string[] = [];
    private geminiKeys: string[] = [];

    /**
     * Per-session poisoned keys: Set of `"provider_index"` strings.
     * A key is poisoned when it returns 401/403 and will not be tried again.
     */
    private poisonedKeys: Set<string> = new Set();

    /**
     * Per-session rate-limited keys: Map of `"modelId_provider_index"` → earliest-retry timestamp.
     * Keys here will be skipped until the cooldown expires.
     */
    private rateLimitedUntil: Map<string, number> = new Map();

    /**
     * Escalating cooldown tracker: Map of `"modelId_provider_index"` → consecutive 429 count.
     * More consecutive 429s = longer cooldowns (60s → 120s → 300s → 600s).
     */
    private rateLimitHitCount: Map<string, number> = new Map();

    /**
     * Session-level model blacklist: Models that consistently fail (e.g., context window)
     * are blacklisted and never tried again this session.
     */
    private blacklistedModels: Set<string> = new Set();

    /** Track the last model+key that succeeded to prefer it for quick repeat calls */
    private lastSuccessful: { modelId: string; keyIndex: number; provider: Provider } | null = null;

    /** Stats for logging */
    private stats = { totalCalls: 0, groqSuccesses: 0, geminiSuccesses: 0, skippedRateLimited: 0, skippedBlacklisted: 0 };

    private constructor() {
        this.loadKeys();
        this.loadUsage();
    }

    public static getInstance(): NodeRouter {
        if (!NodeRouter.instance) NodeRouter.instance = new NodeRouter();
        return NodeRouter.instance;
    }

    // ── Key loading ────────────────────────────────────────────────────────────

    private loadKeys() {
        const extractKeys = (baseNames: string[]) => {
            const foundKeys = new Set<string>();
            for (const base of baseNames) {
                if (process.env[base]) foundKeys.add(process.env[base]!);
                for (let i = 2; i <= 10; i++) {
                    const key = process.env[`${base}_${i}`];
                    if (key) foundKeys.add(key);
                }
            }
            return Array.from(foundKeys).filter(k => k.trim() !== '');
        };

        this.groqKeys = extractKeys(['VITE_GROQ_API_KEY', 'GROQ_API_KEY', 'GROQ_API_KEYS']);
        this.geminiKeys = extractKeys(['VITE_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GEMINI_API_KEYS']);

        const total = this.groqKeys.length + this.geminiKeys.length;
        if (total === 0) {
            console.error('❌ [NodeRouter] CRITICAL: No API keys loaded. Check your .env file.');
            throw new Error('No API keys configured for NodeRouter.');
        }
        console.log(`🔑 [NodeRouter] Loaded ${this.groqKeys.length} Groq + ${this.geminiKeys.length} Gemini keys.`);
    }

    // ── Quota persistence ──────────────────────────────────────────────────────

    private loadUsage() {
        if (fs.existsSync(STATE_FILE)) {
            try { this.usage = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
            catch { this.usage = {}; }
        }
    }

    private saveUsage() {
        const now = Date.now();
        const cleaned: Record<string, UsageStats> = {};
        for (const [key, stats] of Object.entries(this.usage)) {
            if (now - stats.lastReset < 7 * 24 * 60 * 60 * 1000) cleaned[key] = stats;
        }
        this.usage = cleaned;
        try { fs.writeFileSync(STATE_FILE, JSON.stringify(this.usage, null, 2)); }
        catch (e: any) { console.warn(`⚠️ [NodeRouter] Could not persist quota state: ${e.message}`); }
    }

    // ── Smart model-level rate-limit check ─────────────────────────────────────

    /**
     * Check if ALL keys for a given model are rate-limited.
     * If so, skip the entire model instantly instead of trying each key.
     */
    private isModelFullyRateLimited(modelId: string, provider: Provider): boolean {
        const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
        if (keys.length === 0) return true;

        const now = Date.now();
        let blockedCount = 0;
        for (let i = 0; i < keys.length; i++) {
            const pKey = `${provider}_${i}`;
            const rateLimitKey = `${modelId}_${pKey}`;
            if (this.poisonedKeys.has(pKey)) { blockedCount++; continue; }
            const cooldownUntil = this.rateLimitedUntil.get(rateLimitKey) ?? 0;
            if (now < cooldownUntil) { blockedCount++; continue; }
        }
        return blockedCount >= keys.length;
    }

    // ── Key eligibility ────────────────────────────────────────────────────────

    private isKeyEligible(modelId: string, provider: Provider, keyIndex: number): boolean {
        const spec = MODELS[modelId];
        if (!spec) return false;

        const pKey = `${provider}_${keyIndex}`;

        // Poisoned → never
        if (this.poisonedKeys.has(pKey)) return false;

        // Rate-limited → check cooldown (per-MODEL-per-key)
        const rateLimitKey = `${modelId}_${pKey}`;
        const cooldownUntil = this.rateLimitedUntil.get(rateLimitKey) ?? 0;
        if (Date.now() < cooldownUntil) return false;

        // Daily quota
        const usageKey = `${modelId}_${keyIndex}`;
        const stats = this.usage[usageKey];
        if (!stats) return true;
        if (Date.now() - stats.lastReset > 24 * 60 * 60 * 1000) {
            stats.requests = 0;
            stats.lastReset = Date.now();
            return true;
        }
        return stats.requests < spec.rpd * 0.95;
    }

    private incrementUsage(modelId: string, keyIndex: number) {
        const usageKey = `${modelId}_${keyIndex}`;
        this.loadUsage();
        if (!this.usage[usageKey]) this.usage[usageKey] = { requests: 0, lastReset: Date.now() };
        this.usage[usageKey].requests++;
        this.saveUsage();
    }

    // ── Per-error reaction ─────────────────────────────────────────────────────

    private async handleError(
        err: any,
        provider: Provider,
        keyIndex: number,
        modelId: string,
        _attempt: number,
    ): Promise<'skip_key' | 'skip_model' | 'retry_after_sleep'> {
        const cat = classifyError(err);
        const pKey = `${provider}_${keyIndex}`;
        const tag = `[NodeRouter][${modelId}][key ${keyIndex}]`;

        switch (cat) {
            case 'POISON':
                console.error(`🚫 ${tag} POISONED KEY (${err.status ?? '401/403'}). Blacklisting for session.`);
                this.poisonedKeys.add(pKey);
                return 'skip_key';

            case 'RATE_LIMIT': {
                // Escalating cooldowns: more consecutive 429s = longer cooldown
                const rateLimitKey = `${modelId}_${pKey}`;
                const hitCount = (this.rateLimitHitCount.get(rateLimitKey) ?? 0) + 1;
                this.rateLimitHitCount.set(rateLimitKey, hitCount);

                // Cooldown schedule: 60s → 120s → 300s → 600s (capped)
                const cooldownTiers = [60, 120, 300, 600];
                const cooldownSec = cooldownTiers[Math.min(hitCount - 1, cooldownTiers.length - 1)];

                const retryAfterSec: number = err?.headers?.['retry-after']
                    ? parseInt(err.headers['retry-after'], 10)
                    : cooldownSec;
                const cooldownMs = Math.min(retryAfterSec * 1000, 600_000);

                console.warn(`⏳ ${tag} Rate-limited (429). Cooling ${(cooldownMs / 1000).toFixed(0)}s. (hit #${hitCount})`);
                this.rateLimitedUntil.set(rateLimitKey, Date.now() + cooldownMs);
                this.stats.skippedRateLimited++;
                // NO SLEEP — rotate instantly to next key/model
                return 'skip_key';
            }

            case 'CONTEXT':
                console.warn(`📏 ${tag} Context window exceeded. Blacklisting model for session.`);
                this.blacklistedModels.add(modelId);
                this.stats.skippedBlacklisted++;
                return 'skip_model';

            case 'SERVER':
                console.warn(`🔥 ${tag} Server error (${err.status ?? 500}). Waiting 3s.`);
                await sleep(3000);
                return 'skip_key';

            case 'NETWORK':
                console.warn(`📡 ${tag} Network error (${err.message?.slice(0, 60)}). Waiting 3s.`);
                await sleep(3000);
                return 'skip_key';

            case 'SAFETY':
                console.warn(`🛡️ ${tag} Safety/policy block. Skipping key.`);
                return 'skip_key';

            default:
                console.warn(`⚠️ ${tag} Unknown error: ${String(err.message).slice(0, 100)}`);
                await sleep(1000);
                return 'skip_key';
        }
    }

    // ── Core route method ──────────────────────────────────────────────────────

    /**
     * Route an LLM request through the waterfall chain for a given tier.
     *
     * @param messages  Chat messages (system + user).
     * @param tier      TaskTier from routingConfig — controls which models to try.
     * @param options   { jsonMode, temperature, max_tokens }
     * @param maxRetries  How many full waterfall passes before giving up (default 3).
     * @returns The raw text response from the first successful model/key, or throws.
     */
    public async route(
        messages: { role: string; content: string }[],
        tier: TaskTier = 'T3',
        options: {
            jsonMode?: boolean;
            temperature?: number;
            max_tokens?: number;
        } = {},
        maxRetries = 3,
    ): Promise<string> {
        const chain = WATERFALL_CHAINS[tier];
        if (!chain || chain.length === 0) throw new Error(`No models defined for tier ${tier}`);

        this.stats.totalCalls++;
        let lastError: any = null;

        for (let pass = 0; pass < maxRetries; pass++) {
            console.log(`🌐 [NodeRouter] Tier ${tier} — pass ${pass + 1}/${maxRetries}`);

            MODEL_LOOP:
            for (const modelId of chain) {
                const spec = MODELS[modelId];
                if (!spec) continue;

                // ── SESSION BLACKLIST CHECK ──────────────────────────────
                // If this model failed with CONTEXT once, never try it again.
                if (this.blacklistedModels.has(modelId)) {
                    continue; // Silent skip — already logged when blacklisted
                }

                const provider: Provider = spec.provider;
                const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
                if (keys.length === 0) continue;

                // ── SMART MODEL SKIP ────────────────────────────────────
                // If ALL keys for this model are rate-limited, skip the ENTIRE model
                // instantly. This is the #1 performance fix: avoids trying 6 dead keys.
                if (this.isModelFullyRateLimited(modelId, provider)) {
                    continue; // Silent skip — no log spam
                }

                for (let k = 0; k < keys.length; k++) {
                    const index = (this.keyIndices[provider] + k) % keys.length;
                    if (!this.isKeyEligible(modelId, provider, index)) continue;

                    // Immediately increment index so concurrent calls use the next key
                    this.keyIndices[provider] = (index + 1) % keys.length;

                    try {
                        let result: string;

                        if (provider === 'groq') {
                            result = await this.callGroq(keys[index], modelId, messages, options);
                        } else {
                            result = await this.callGemini(keys[index], modelId, messages, options);
                        }

                        // ✅ Success — update bookkeeping
                        this.incrementUsage(modelId, index);

                        // Reset rate-limit hit count for this key+model (it recovered)
                        const rateLimitKey = `${modelId}_${provider}_${index}`;
                        this.rateLimitHitCount.delete(rateLimitKey);

                        // Track last successful for stats
                        this.lastSuccessful = { modelId, keyIndex: index, provider };
                        if (provider === 'groq') this.stats.groqSuccesses++;
                        else this.stats.geminiSuccesses++;

                        console.log(`✅ [NodeRouter] Success with ${modelId} (key ${index}).`);
                        return result;

                    } catch (err: any) {
                        lastError = err;
                        const reaction = await this.handleError(err, provider, index, modelId, pass);
                        if (reaction === 'skip_model') continue MODEL_LOOP;
                        // 'skip_key' → continue to next key (no sleep, instant rotation)
                    }
                }
            }

            // Full waterfall exhausted — sleep before retry
            if (pass < maxRetries - 1) {
                const wait = backoffMs(pass);
                console.warn(`⏳ [NodeRouter] All models exhausted on pass ${pass + 1}. Sleeping ${(wait / 1000).toFixed(0)}s before retry.`);
                await sleep(wait);
            }
        }

        const msg = lastError?.message ?? 'All models and keys failed.';
        console.error(`🚨 [NodeRouter] CRITICAL: Tier ${tier} failed after ${maxRetries} passes. Last: ${msg}`);
        throw lastError ?? new Error(`NodeRouter: tier ${tier} fully exhausted.`);
    }

    // ── Stats reporter ─────────────────────────────────────────────────────────

    public getStats() {
        return {
            ...this.stats,
            blacklistedModels: Array.from(this.blacklistedModels),
            poisonedKeys: Array.from(this.poisonedKeys),
            activeCooldowns: Array.from(this.rateLimitedUntil.entries())
                .filter(([, until]) => Date.now() < until)
                .map(([key, until]) => ({ key, remainingSec: Math.round((until - Date.now()) / 1000) })),
        };
    }

    // ── Provider-specific callers ──────────────────────────────────────────────

    private async callGroq(
        apiKey: string,
        modelId: string,
        messages: { role: string; content: string }[],
        options: { jsonMode?: boolean; temperature?: number; max_tokens?: number },
    ): Promise<string> {
        const client = new Groq({ apiKey });
        const spec = MODELS[modelId];
        const maxTokens = options.max_tokens ?? Math.min(8192, spec?.maxOutput ?? 8192);
        const completion = await client.chat.completions.create({
            model: modelId,
            messages: messages as any,
            temperature: options.temperature ?? 0.7,
            max_tokens: maxTokens,
            response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('Groq returned empty content.');
        return content;
    }

    private async callGemini(
        apiKey: string,
        modelId: string,
        messages: { role: string; content: string }[],
        options: { jsonMode?: boolean; temperature?: number; max_tokens?: number },
    ): Promise<string> {
        const genAI = new GoogleGenerativeAI(apiKey);
        const spec = MODELS[modelId];
        const maxTokens = options.max_tokens ?? Math.min(8192, spec?.maxOutput ?? 8192);
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: maxTokens,
                responseMimeType: options.jsonMode ? 'application/json' : undefined,
            },
        });
        const system = messages.find(m => m.role === 'system')?.content ?? '';
        const user = messages.find(m => m.role === 'user')?.content ?? '';
        const result = await model.generateContent(`${system}\n\n${user}`);
        const text = result.response.text();
        if (!text) throw new Error('Gemini returned empty response.');
        return text;
    }
}

export const nodeRouter = NodeRouter.getInstance();
