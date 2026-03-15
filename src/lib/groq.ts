import Groq from "groq-sdk";

let _groqClients: (Groq | null)[] = [];

export const getGroqClients = () => {
    if (_groqClients.length > 0) return _groqClients;

    const keys = [
        import.meta.env.VITE_GROQ_API_KEY,
        import.meta.env.VITE_GROQ_API_KEY_2,
        import.meta.env.VITE_GROQ_API_KEY_3,
        import.meta.env.VITE_GROQ_API_KEY_4,
        import.meta.env.VITE_GROQ_API_KEY_5,
        import.meta.env.VITE_GROQ_API_KEY_6,
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
    options: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean; jsonMode?: boolean } = {}
) {
    const { 
        model = "llama-3.3-70b-versatile", 
        temperature = 0.7, 
        max_tokens = 2048, 
        stream = true,
        jsonMode = false
    } = options;

    const clients = getGroqClients();
    if (clients.length === 0) {
        throw new Error("No Groq API Keys found. Please set VITE_GROQ_API_KEY.");
    }

    // If all keys were rate-limited, reject immediately until cooldown expires
    if (Date.now() < rateLimitedUntil) {
        throw new Error(`Groq rate limited. Try again in ${Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s.`);
    }

    // Try clients starting from currentKeyIndex
    let lastError: any = null;
    let allRateLimited = true;
    for (let i = 0; i < clients.length; i++) {
        const index = (currentKeyIndex + i) % clients.length;
        const client = clients[index];
        if (!client) continue;

        try {
            const completion = await client.chat.completions.create({
                model: (model === "llama-3.3-70b-versatile" && stream) ? "llama-3.1-8b-instant" : model,
                messages: messages as any,
                temperature,
                max_tokens,
                stream,
                ...(jsonMode && !stream ? { response_format: { type: 'json_object' } } : {})
            });
            // Success! Update index for next time to balance load
            currentKeyIndex = (index + 1) % clients.length;
            allRateLimited = false;
            return completion;
        } catch (error: any) {
            console.warn(`[Groq] Key ${index + 1} (${clients.length} total) failed:`, error.message, error.status);
            lastError = error;
            if (error?.status === 429 || error?.message?.includes('rate limit')) {
                currentKeyIndex = (index + 1) % clients.length;
                continue;
            }
            if (error?.status === 401) {
                console.error(`[Groq] Key ${index + 1} is INVALID (401). Please check VITE_GROQ_API_KEY_${index + 1 > 1 ? index + 1 : ''}`);
            }
            // Non-429 error means not all are rate-limited
            allRateLimited = false;
            continue;
        }
    }

    // If every key hit 429, set a 60s cooldown to stop retry storms
    if (allRateLimited) {
        rateLimitedUntil = Date.now() + 60_000;
    }

    throw lastError || new Error("All Groq API keys failed.");
}
