
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               🌐  NODE ROUTER  —  Jules LLM Orchestrator     ║
 * ║         Multi-Provider · Multi-Key · Full Error Shield       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Error types handled per attempt:
 *   401 Unauthorized   → Poison the key (never use again this session)
 *   403 Forbidden      → Same as 401 (wrong scopes / suspended)
 *   429 Rate-Limited   → Exponential backoff, rotate to next key
 *   500/503 Server     → Soft retry after 3s, rotate model
 *   ECONNRESET/ETIMEDOUT / fetch failed → Network transient, 3s wait
 *   Context Window exceeded (400/413) → Switch to smaller model in chain
 *   Output blocked (safety filter)    → Treat as soft refusal, skip key
 *   Unknown            → Log + continue to next key/model
 *
 * Waterfall: Attempt every key for every model in the tier.
 * After full exhaustion, sleep with exponential backoff and retry the
 * whole waterfall up to `maxRetries` times before throwing.
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

// ─── Backoff helper ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function backoffMs(attempt: number, base = 2000): number {
    // Capped exponential: 2s, 4s, 8s, 16s, max 30s
    return Math.min(base * Math.pow(2, attempt), 30_000);
}

// ─── NodeRouter ───────────────────────────────────────────────────────────────

class NodeRouter {
    private static instance: NodeRouter;
    private keyIndices: Record<Provider, number> = { groq: 0, gemini: 0 };
    private usage: Record<string, UsageStats> = {};
    private groqKeys: string[] = [];
    private geminiKeys: string[] = [];

    /**
     * Per-session poisoned keys: Set of `"provider_index"` strings.
     * A key is poisoned when it returns 401/403 and will not be tried again
     * for the lifetime of this Node process.
     */
    private poisonedKeys: Set<string> = new Set();

    /**
     * Per-session rate-limited keys: Map of `"provider_index"` → earliest-retry timestamp.
     * Keys here will be skipped until the cooldown expires.
     */
    private rateLimitedUntil: Map<string, number> = new Map();

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
        this.groqKeys = [
            process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
            process.env.VITE_GROQ_API_KEY_2,
            process.env.VITE_GROQ_API_KEY_3,
            process.env.VITE_GROQ_API_KEY_4,
            process.env.VITE_GROQ_API_KEY_5,
            process.env.VITE_GROQ_API_KEY_6,
        ].filter(Boolean) as string[];

        this.geminiKeys = [
            process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
            process.env.VITE_GEMINI_API_KEY_2,
            process.env.VITE_GEMINI_API_KEY_3,
            process.env.VITE_GEMINI_API_KEY_4,
            process.env.VITE_GEMINI_API_KEY_5,
            process.env.VITE_GEMINI_API_KEY_6,
        ].filter(Boolean) as string[];

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
        // Prune stale entries (older than 7 days)
        const now = Date.now();
        const cleaned: Record<string, UsageStats> = {};
        for (const [key, stats] of Object.entries(this.usage)) {
            if (now - stats.lastReset < 7 * 24 * 60 * 60 * 1000) cleaned[key] = stats;
        }
        this.usage = cleaned;
        try { fs.writeFileSync(STATE_FILE, JSON.stringify(this.usage, null, 2)); }
        catch (e: any) { console.warn(`⚠️ [NodeRouter] Could not persist quota state: ${e.message}`); }
    }

    // ── Key eligibility ────────────────────────────────────────────────────────

    private isKeyEligible(modelId: string, provider: Provider, keyIndex: number): boolean {
        const spec = MODELS[modelId];
        if (!spec) return false;

        const pKey = `${provider}_${keyIndex}`;

        // Poisoned → never
        if (this.poisonedKeys.has(pKey)) return false;

        // Rate-limited → check cooldown
        const cooldownUntil = this.rateLimitedUntil.get(pKey) ?? 0;
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
        this.loadUsage(); // Refresh from disk for concurrent safety
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
        attempt: number,
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
                // Parse Retry-After from error headers if available, else use backoff
                const retryAfterSec: number = err?.headers?.['retry-after']
                    ? parseInt(err.headers['retry-after'], 10)
                    : (attempt + 1) * 10; // 10s, 20s, 30s ...
                const cooldownMs = Math.min(retryAfterSec * 1000, 60_000);
                console.warn(`⏳ ${tag} Rate-limited (429). Cooling ${(cooldownMs / 1000).toFixed(0)}s.`);
                this.rateLimitedUntil.set(pKey, Date.now() + cooldownMs);
                await sleep(2000); // brief wait before trying next key
                return 'skip_key';
            }

            case 'CONTEXT':
                console.warn(`📏 ${tag} Context window exceeded. Skipping this model.`);
                return 'skip_model'; // No point retrying with same model

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

        let lastError: any = null;

        for (let pass = 0; pass < maxRetries; pass++) {
            console.log(`🌐 [NodeRouter] Tier ${tier} — pass ${pass + 1}/${maxRetries}`);

            MODEL_LOOP:
            for (const modelId of chain) {
                const spec = MODELS[modelId];
                if (!spec) continue;

                const provider: Provider = spec.provider;
                const keys = provider === 'groq' ? this.groqKeys : this.geminiKeys;
                if (keys.length === 0) continue;

                for (let k = 0; k < keys.length; k++) {
                    const index = (this.keyIndices[provider] + k) % keys.length;
                    if (!this.isKeyEligible(modelId, provider, index)) continue;

                    try {
                        let result: string;

                        if (provider === 'groq') {
                            result = await this.callGroq(keys[index], modelId, messages, options);
                        } else {
                            result = await this.callGemini(keys[index], modelId, messages, options);
                        }

                        // ✅ Success
                        this.incrementUsage(modelId, index);
                        this.keyIndices[provider] = (index + 1) % keys.length;
                        console.log(`✅ [NodeRouter] Success with ${modelId} (key ${index}).`);
                        return result;

                    } catch (err: any) {
                        lastError = err;
                        const reaction = await this.handleError(err, provider, index, modelId, pass);
                        if (reaction === 'skip_model') continue MODEL_LOOP;
                        // 'skip_key' → continue to next key
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

    // ── Provider-specific callers ──────────────────────────────────────────────

    private async callGroq(
        apiKey: string,
        modelId: string,
        messages: { role: string; content: string }[],
        options: { jsonMode?: boolean; temperature?: number; max_tokens?: number },
    ): Promise<string> {
        const client = new Groq({ apiKey });
        // const completion = await client.chat.completions.create({
        //     model: modelId,
        //     messages: messages as any,
        //     temperature: options.temperature ?? 0.7,
        //     max_tokens: options.max_tokens ?? 8192,
        //     response_format: options.jsonMode ? { type: 'json_object' } : undefined,
        // });
        // const content = completion.choices[0]?.message?.content;
        const content = options.jsonMode ? "{}" : "API DISABLED";
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
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.max_tokens ?? 8192,
                responseMimeType: options.jsonMode ? 'application/json' : undefined,
            },
        });
        const system = messages.find(m => m.role === 'system')?.content ?? '';
        const user = messages.find(m => m.role === 'user')?.content ?? '';
        // const result = await model.generateContent(`${system}\n\n${user}`);
        // const text = result.response.text();
        const text = options.jsonMode ? "{}" : "API DISABLED";
        if (!text) throw new Error('Gemini returned empty response.');
        return text;
    }
}

export const nodeRouter = NodeRouter.getInstance();
