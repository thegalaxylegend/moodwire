import OpenAI from "openai";

let _openai: OpenAI | null = null;

export const getOpenAIClient = () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) return null;
    
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }
    return _openai;
};

export async function callOpenAI(
    messages: { role: string; content: string }[],
    options: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean } = {}
) {
    const { 
        model = "gpt-4o-mini", 
        temperature = 0.7, 
        max_tokens = 2048, 
        stream = true 
    } = options;

    const client = getOpenAIClient();
    if (!client) {
        throw new Error("OpenAI API Key not found. Please set VITE_OPENAI_API_KEY.");
    }

    return await client.chat.completions.create({
        model,
        messages: messages as any,
        temperature,
        max_tokens,
        stream,
    });
}
