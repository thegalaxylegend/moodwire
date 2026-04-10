
import Groq from "groq-sdk";

let _groqClients: (Groq | null)[] = [];
const deadKeyIndices = new Set<number>();

const getEnvKeys = () => {
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    return [
        env.VITE_GROQ_API_KEY || env.GROQ_API_KEY,
        env.VITE_GROQ_API_KEY_2,
        env.VITE_GROQ_API_KEY_3,
        env.VITE_GROQ_API_KEY_4,
        env.VITE_GROQ_API_KEY_5,
        env.VITE_GROQ_API_KEY_6,
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
    options: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean; jsonMode?: boolean; signal?: AbortSignal; keyIndex?: number } = {}
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
        throw error; // Let ModelRouter handle the retry/rotation
    }
}
