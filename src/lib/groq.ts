
import Groq from "groq-sdk";

let _groqClients: (Groq | null)[] = [];

const getEnvKeys = () => {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    return [
        env.VITE_GROQ_API_KEY || env.GROQ_API_KEY,
        env.VITE_GROQ_API_KEY_2,
        env.VITE_GROQ_API_KEY_3,
        env.VITE_GROQ_API_KEY_4,
        env.VITE_GROQ_API_KEY_5,
        env.VITE_GROQ_API_KEY_6,
        env.VITE_GROQ_API_KEY_7,
        env.VITE_GROQ_API_KEY_8,
    ].filter(Boolean) as string[];
};

export const GROQ_KEY_COUNT = getEnvKeys().length;

export const getGroqClient = (index: number): Groq | null => {
    if (_groqClients.length === 0) {
        const keys = getEnvKeys();
        _groqClients = keys.map(key => new Groq({
            apiKey: key,
            dangerouslyAllowBrowser: true
        }));
    }
    return _groqClients[index] || null;
};

export async function callGroq(
    messages: { role: string; content: string }[],
    options: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean; jsonMode?: boolean; signal?: AbortSignal; keyIndex?: number; tier?: string } = {}
) {
    const { 
        model = "llama-3.3-70b-versatile", 
        temperature = 0.7, 
        max_tokens = 2048, 
        stream = true,
        jsonMode = false,
        signal,
        keyIndex = 0
    } = options;

    const client = getGroqClient(keyIndex);
    if (!client) throw new Error(`Groq Client #${keyIndex} not found.`);

    try {
        // --- CLOUDFLARE WORKER ROUTING (PRODUCTION) ---
        // If we are in production and running on Cloudflare, we proxy through the Worker
        // to keep API keys secure and use the zero-cost backend.
        if (typeof import.meta !== 'undefined' && import.meta.env?.PROD && !import.meta.env?.VITE_DEV_AI) {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, tier: options.tier || 'T3', options: { ...options, provider: 'groq' } })
            });
            if (!response.ok) {
                let errText = response.statusText;
                try {
                    const errObj = await response.json();
                    errText = errObj.error?.message || JSON.stringify(errObj);
                } catch (e) {
                    try { errText = await response.text(); } catch(e) {}
                }
                const proxyError: any = new Error(`Cloudflare Proxy Error: ${errText}`);
                proxyError.status = response.status;
                throw proxyError;
            }
            
            if (stream) {
                if (!response.body) throw new Error("No response body for stream");
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                return (async function* () {
                    let buffer = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";
                        for (const line of lines) {
                            if (line.trim().startsWith("data: ") && !line.includes("[DONE]")) {
                                try {
                                    yield JSON.parse(line.trim().slice(6));
                                } catch (e) {}
                            }
                        }
                    }
                })();
            }
            return await response.json();
        }

        const completion = await client.chat.completions.create({
            model: model,
            messages: messages as any,
            temperature,
            max_tokens,
            stream,
            ...(jsonMode && !stream ? { response_format: { type: 'json_object' } } : {}),
        }, { signal });
        return completion;
    } catch (error: any) {
        console.warn("[callGroq] Error occurred, propagating to router:", error);
        throw error; // Let ModelRouter handle the retry/rotation
    }
}
