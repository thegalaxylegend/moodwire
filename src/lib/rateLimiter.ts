/**
 * 🛡️ Sliding Window Rate Limiter Engine
 * Persists sliding windows in localStorage so limits cannot be bypassed by page reloads.
 */

export interface LimitConfig {
    maxMinute: number;
    maxHour: number;
}

export const RATE_LIMITS: Record<string, LimitConfig> = {
    ai: { maxMinute: 25, maxHour: 120 },          // High-capacity AI limit
    db_write: { maxMinute: 40, maxHour: 180 },     // Database write limits (accommodates sync and PYQ progress)
    external_api: { maxMinute: 50, maxHour: 250 }, // Wikipedia, NASA, Wolfram, Exa API
    global_fetch: { maxMinute: 100, maxHour: 500 }  // Robust network shield
};

const STORAGE_PREFIX = 'rate_limit_';

interface RateLimitState {
    timestamps: number[];
}

const getLimitState = (key: string): RateLimitState => {
    if (typeof window === 'undefined') return { timestamps: [] };
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return { timestamps: [] };
    try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.timestamps)) return parsed;
    } catch {
        /* Ignore parse errors */
    }
    return { timestamps: [] };
};

const saveLimitState = (key: string, state: RateLimitState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
};

export const RateLimiter = {
    /**
     * Checks if a request is allowed under sliding window limits.
     * Retains timestamps within the last 1 hour.
     */
    checkLimit: (type: 'ai' | 'db_write' | 'external_api' | 'global_fetch'): {
        allowed: boolean;
        remaining: number;
        resetTimeMs: number;
        limitReached: 'minute' | 'hour' | null;
    } => {
        const config = RATE_LIMITS[type];
        if (!config) {
            return { allowed: true, remaining: 999, resetTimeMs: 0, limitReached: null };
        }

        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;

        const state = getLimitState(type);
        
        // Clean up timestamps older than 1 hour
        const validTimestamps = state.timestamps.filter(ts => ts > oneHourAgo);
        if (validTimestamps.length !== state.timestamps.length) {
            saveLimitState(type, { timestamps: validTimestamps });
        }

        // Count calls in the last 1 minute
        const minuteCalls = validTimestamps.filter(ts => ts > oneMinuteAgo);
        const hourCalls = validTimestamps;

        // 1. Check Minute Limit
        if (minuteCalls.length >= config.maxMinute) {
            const oldestInMinute = minuteCalls[0];
            const resetTimeMs = oldestInMinute + 60 * 1000;
            return {
                allowed: false,
                remaining: 0,
                resetTimeMs,
                limitReached: 'minute'
            };
        }

        // 2. Check Hour Limit
        if (hourCalls.length >= config.maxHour) {
            const oldestInHour = hourCalls[0];
            const resetTimeMs = oldestInHour + 60 * 60 * 1000;
            return {
                allowed: false,
                remaining: 0,
                resetTimeMs,
                limitReached: 'hour'
            };
        }

        // Calculate remaining tokens
        const minuteRemaining = config.maxMinute - minuteCalls.length;
        const hourRemaining = config.maxHour - hourCalls.length;

        return {
            allowed: true,
            remaining: Math.min(minuteRemaining, hourRemaining),
            resetTimeMs: 0,
            limitReached: null
        };
    },

    /**
     * Consumes a token for a request. Returns true if allowed, false if blocked.
     */
    consume: (type: 'ai' | 'db_write' | 'external_api' | 'global_fetch'): boolean => {
        const check = RateLimiter.checkLimit(type);
        if (!check.allowed) return false;

        const state = getLimitState(type);
        const now = Date.now();
        state.timestamps.push(now);
        saveLimitState(type, state);
        return true;
    },

    /**
     * Utility to completely reset rate limit buckets (useful for administrative override).
     */
    reset: (type: 'ai' | 'db_write' | 'external_api' | 'global_fetch') => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_PREFIX + type);
    },

    /**
     * Enforces database write rate limiting and triggers the SpamShield UI if exceeded.
     */
    enforceDbWrite: () => {
        const check = RateLimiter.checkLimit('db_write');
        if (!check.allowed) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('spam_shield_trigger', {
                    detail: { reason: 'db_write', resetTimeMs: check.resetTimeMs }
                }));
            }
            throw new Error("DATABASE_LOCK_ENGAGED: Too many database write requests. Slow down.");
        }
        RateLimiter.consume('db_write');
    }
};
