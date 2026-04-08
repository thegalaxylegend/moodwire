import Groq from "groq-sdk";

let _groqClients: (Groq | null)[] = [];
const deadKeyIndices = new Set<number>(); // Permanently dead keys (401)

export const getGroqClients = () => {
    if (_groqClients.length > 0) return _groqClients;

    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    const keys = [
        env.VITE_GROQ_API_KEY || env.GROQ_API_KEY,
        env.VITE_GROQ_API_KEY_2,
        env.VITE_GROQ_API_KEY_3,
        env.VITE_GROQ_API_KEY_4,
        env.VITE_GROQ_API_KEY_5,
        env.VITE_GROQ_API_KEY_6,
    ].filter(Boolean);

    _groqClients = keys.map(key => new Groq({
        apiKey: key,
        dangerouslyAllowBrowser: true
    }));

    return _groqClients;
};

let currentKeyIndex = 0;
let rateLimitedUntil = 0; // Timestamp when we can retry after 429

export async function callGroq(
    messages: { role: string; content: string }[],
    options: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean; jsonMode?: boolean; signal?: AbortSignal } = {}
) {
    const { 
        model = "llama-3.3-70b-versatile", 
        temperature = 0.7, 
        max_tokens = 2048, 
        stream = true,
        jsonMode = false,
        signal
    } = options;

    const clients = getGroqClients();
    if (clients.length === 0) {
        throw new Error("No Groq API Keys found. Please set VITE_GROQ_API_KEY.");
    }

    // Check if ALL keys are dead
    const aliveCount = clients.filter((_, i) => !deadKeyIndices.has(i)).length;
    if (aliveCount === 0) {
        throw new Error("All Groq API keys are permanently invalid (401). Please update your .env file.");
    }

    // If all keys were rate-limited, reject immediately until cooldown expires
    if (Date.now() < rateLimitedUntil) {
        throw new Error(`Groq rate limited. Try again in ${Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s.`);
    }

    // Try clients starting from currentKeyIndex, skipping dead keys
    let lastError: any = null;
    let allRateLimited = true;
    for (let i = 0; i < clients.length; i++) {
        const index = (currentKeyIndex + i) % clients.length;

        // Skip permanently dead keys
        if (deadKeyIndices.has(index)) continue;

        const client = clients[index];
        if (!client) continue;

        try {
            const completion = await client.chat.completions.create({
                model: model,
                messages: messages as any,
                temperature,
                max_tokens,
                stream,
                ...(jsonMode && !stream ? { response_format: { type: 'json_object' } } : {}),
            }, { signal });
            // Success! Update index for next time to balance load
            currentKeyIndex = (index + 1) % clients.length;
            allRateLimited = false;
            return completion;
        } catch (error: any) {
            lastError = error;
            if (error?.status === 401) {
                // Permanently kill this key — never try it again
                deadKeyIndices.add(index);
                console.error(`[Groq] Key ${index + 1} permanently removed (401 Invalid). ${clients.length - deadKeyIndices.size} keys remaining.`);
                allRateLimited = false;
                continue;
            }
            if (error?.status === 429 || error?.message?.includes('rate limit')) {
                currentKeyIndex = (index + 1) % clients.length;
                continue;
            }
            // Other errors (400 json_validate_failed, 500, etc.)
            console.warn(`[Groq] Key ${index + 1} failed (${error?.status || 'unknown'}):`, error.message?.slice(0, 120));
            allRateLimited = false;
            continue;
        }
    }

    // If every alive key hit 429, set a 60s cooldown to stop retry storms
    if (allRateLimited) {
        rateLimitedUntil = Date.now() + 60_000;
    }

    throw lastError || new Error("All Groq API keys failed.");
}
