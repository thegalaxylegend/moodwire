/**
 * gemini.ts
 * Gemini API client with key rotation for cross-model verification.
 * Follows the same rotation pattern as groq.ts for consistency.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _geminiClients: (GoogleGenerativeAI | null)[] = [];
const deadGeminiKeyIndices = new Set<number>(); // Permanently dead keys (401/403)

export const getGeminiClients = () => {
    if (_geminiClients.length > 0) return _geminiClients;

    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    const keys = [
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY,
        env.VITE_GEMINI_API_KEY_2,
        env.VITE_GEMINI_API_KEY_3,
        env.VITE_GEMINI_API_KEY_4,
        env.VITE_GEMINI_API_KEY_5,
        env.VITE_GEMINI_API_KEY_6,
        env.VITE_GEMINI_API_KEY_7,
    ].filter(Boolean) as string[];

    _geminiClients = keys.map(key => new GoogleGenerativeAI(key));

    return _geminiClients;
};

let currentGeminiKeyIndex = 0;
let geminiRateLimitedUntil = 0;

export interface GeminiCallOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    jsonMode?: boolean;
}

/**
 * Call Gemini with automatic key rotation on 429 errors.
 * Dead keys (401/403) are permanently removed from rotation.
 */
export async function callGemini(
    messages: { role: string; content: string }[],
    options: GeminiCallOptions = {}
): Promise<string> {
    const {
        model = 'gemini-2.0-flash',
        temperature = 0.1,
        maxOutputTokens = 2048,
        jsonMode = false
    } = options;

    const clients = getGeminiClients();
    if (clients.length === 0) {
        throw new Error("No Gemini API Keys found. Please set VITE_GEMINI_API_KEY.");
    }

    // Check if ALL keys are dead
    const aliveCount = clients.filter((_, i) => !deadGeminiKeyIndices.has(i)).length;
    if (aliveCount === 0) {
        throw new Error("All Gemini API keys are permanently invalid. Please update your .env file.");
    }

    // Global cooldown check
    if (Date.now() < geminiRateLimitedUntil) {
        throw new Error(`Gemini rate limited. Try again in ${Math.ceil((geminiRateLimitedUntil - Date.now()) / 1000)}s.`);
    }

    let lastError: any = null;
    let allRateLimited = true;

    for (let i = 0; i < clients.length; i++) {
        const index = (currentGeminiKeyIndex + i) % clients.length;

        // Skip permanently dead keys
        if (deadGeminiKeyIndices.has(index)) continue;

        const client = clients[index];
        if (!client) continue;

        try {
            const genModel = client.getGenerativeModel({
                model,
                generationConfig: {
                    temperature,
                    maxOutputTokens,
                    ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
                },
            });

            // Build the prompt from messages
            const systemMsg = messages.find(m => m.role === 'system')?.content || '';
            const userMsg = messages.find(m => m.role === 'user')?.content || messages[messages.length - 1]?.content || '';

            const fullPrompt = systemMsg 
                ? `${systemMsg}\n\n${userMsg}`
                : userMsg;

            const result = await genModel.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();

            // Success — rotate key for load balancing
            currentGeminiKeyIndex = (index + 1) % clients.length;
            allRateLimited = false;

            return text;
        } catch (error: any) {
            lastError = error;

            // Check for invalid key (permanently dead)
            if (error?.status === 401 || error?.status === 403 || 
                error?.message?.includes('API_KEY_INVALID')) {
                deadGeminiKeyIndices.add(index);
                console.error(`[Gemini] Key ${index + 1} permanently removed (${error?.status || 'invalid'}). ${clients.length - deadGeminiKeyIndices.size} keys remaining.`);
                allRateLimited = false;
                continue;
            }

            // Check for rate limit (429) or quota exceeded
            if (error?.status === 429 || 
                error?.message?.includes('rate limit') || 
                error?.message?.includes('quota') ||
                error?.message?.includes('RESOURCE_EXHAUSTED')) {
                currentGeminiKeyIndex = (index + 1) % clients.length;
                continue;
            }

            // Other errors
            console.warn(`[Gemini] Key ${index + 1} failed:`, error.message?.slice(0, 120));
            allRateLimited = false;
            continue;
        }
    }

    // If every key hit rate limits, set 60s cooldown
    if (allRateLimited) {
        geminiRateLimitedUntil = Date.now() + 30_000;
    }

    throw lastError || new Error("All Gemini API keys failed.");
}
