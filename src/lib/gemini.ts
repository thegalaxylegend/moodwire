/**
 * gemini.ts
 * Gemini API client with key rotation and STREAMING support.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _geminiClients: (GoogleGenerativeAI | null)[] = [];
const deadGeminiKeyIndices = new Set<number>(); // Permanently dead keys

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
    stream?: boolean;
}

export async function callGemini(
    messages: { role: string; content: string }[],
    options: GeminiCallOptions = {}
): Promise<any> {
    const {
        model = 'gemini-2.0-flash',
        temperature = 0.1,
        maxOutputTokens = 8192, // High limit for dense content
        jsonMode = false,
        stream = false
    } = options;

    const clients = getGeminiClients();
    if (clients.length === 0) {
        throw new Error("No Gemini API Keys found.");
    }

    if (Date.now() < geminiRateLimitedUntil) {
        throw new Error(`Gemini rate limited.`);
    }

    let lastError: any = null;

    for (let i = 0; i < clients.length; i++) {
        const index = (currentGeminiKeyIndex + i) % clients.length;
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

            const systemMsg = messages.find(m => m.role === 'system')?.content || '';
            const userMsg = messages.find(m => m.role === 'user')?.content || messages[messages.length - 1]?.content || '';
            const fullPrompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

            if (stream) {
                // STREAMING SUPPORT
                const result = await genModel.generateContentStream(fullPrompt);
                // Return a helper for for-await-of that mimics the Groq/OpenAI structure
                return (async function* () {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            yield { choices: [{ delta: { content: text } }] };
                        }
                    }
                })();
            } else {
                // SYNC SUPPORT
                const result = await genModel.generateContent(fullPrompt);
                const response = result.response;
                currentGeminiKeyIndex = (index + 1) % clients.length;
                return response.text();
            }
        } catch (error: any) {
            lastError = error;
            if (error?.status === 401 || error?.status === 403 || error?.message?.includes('API_KEY_INVALID')) {
                deadGeminiKeyIndices.add(index);
                continue;
            }
            if (error?.status === 429 || error?.message?.includes('rate limit') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                currentGeminiKeyIndex = (index + 1) % clients.length;
                continue;
            }
            continue;
        }
    }

    throw lastError || new Error("All Gemini API keys failed.");
}
