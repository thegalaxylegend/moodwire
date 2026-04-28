
import { GoogleGenerativeAI } from '@google/generative-ai';

let _geminiClients: (GoogleGenerativeAI | null)[] = [];

const getEnvKeys = () => {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    return [
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY,
        env.VITE_GEMINI_API_KEY_2,
        env.VITE_GEMINI_API_KEY_3,
        env.VITE_GEMINI_API_KEY_4,
        env.VITE_GEMINI_API_KEY_5,
        env.VITE_GEMINI_API_KEY_6,
        env.VITE_GEMINI_API_KEY_7,
    ].filter(Boolean) as string[];
};

export const GEMINI_KEY_COUNT = getEnvKeys().length;

export const getGeminiClient = (index: number): GoogleGenerativeAI | null => {
    if (_geminiClients.length === 0) {
        const keys = getEnvKeys();
        _geminiClients = keys.map(key => new GoogleGenerativeAI(key));
    }
    return _geminiClients[index] || null;
};

export interface GeminiCallOptions {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    jsonMode?: boolean;
    stream?: boolean;
    keyIndex?: number;
}

export async function callGemini(
    messages: { role: string; content: string }[],
    options: GeminiCallOptions = {}
): Promise<any> {
    const {
        model = 'gemini-2.5-flash',
        temperature = 0.1,
        maxOutputTokens = 8192,
        jsonMode = false,
        stream = false,
        keyIndex = 0
    } = options;

    const genAI = getGeminiClient(keyIndex);
    if (!genAI) throw new Error(`Gemini Client #${keyIndex} not found.`);

    const genModel = genAI.getGenerativeModel({
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
    
    // --- CLOUDFLARE WORKER ROUTING (PRODUCTION) ---
    // Use the zero-cost Cloudflare backend to hide secrets and manage rotation.
    if (import.meta.env.PROD && !import.meta.env.VITE_DEV_AI) {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, tier: 'T4', options: { ...options, provider: 'gemini' } })
        });
        if (!response.ok) throw new Error(`Cloudflare Proxy Error: ${response.statusText}`);
        
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
                                const parsed = JSON.parse(line.trim().slice(6));
                                if (parsed?.candidates?.[0]?.content?.parts?.[0]?.text) {
                                    yield { choices: [{ delta: { content: parsed.candidates[0].content.parts[0].text } }] };
                                }
                            } catch (e) {}
                        }
                    }
                }
            })();
        }
        return await response.json();
    }

    if (stream) {
        const result = await genModel.generateContentStream(fullPrompt);
        return (async function* () {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield { choices: [{ delta: { content: text } }] };
                }
            }
        })();
    } else {
        const result = await genModel.generateContent(fullPrompt);
        return result.response.text();
    }
}
