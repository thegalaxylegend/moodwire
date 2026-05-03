
import { callOpenAI, getOpenAIClient } from './openai';
import { buildSystemPrompt } from './systemPrompt';
import type { UserProfile, TestResult } from './systemPrompt';
import { getImportantMemories, extractAndSaveMemory } from './memoryExtractor';
import { modelRouter } from './modelRouter';
import type { TaskTier } from './routingConfig';

export type AIProvider = 'groq' | 'openai' | 'gemini' | 'auto';

/**
 * 🧠 Refined Academic Complexity Detection.
 * Maps input text to Task Tiers T1-T5.
 */
function detectTier(text: string, hasImage: boolean, context: string = ''): TaskTier {
    if (hasImage) return 'T4'; // Vision usually requires reasoning
    
    const lowText = (text + ' ' + context).toLowerCase();
    
    // T5: Expert / Advanced STEM
    const expertKeywords = [
        'derive', 'proof', 'advanced', 'jee advanced', 'organic mechanism', 
        'schrodinger', 'calculus', 'integration by parts', 'maxwell'
    ];
    if (expertKeywords.some(k => lowText.includes(k))) return 'T1';

    // T4: Complex / High-school STEM
    const complexKeywords = [
        'calculate', 'solve', 'physics', 'chemistry', 'mathematics',
        '\\frac', '\\sqrt', '\\sum', '\\int', '$', 'formula', 'stoichiometry'
    ];
    const numCount = (text.match(/\d/g) || []).length;
    if (complexKeywords.some(k => lowText.includes(k)) || numCount > 15) return 'T2';

    // T1: Trivial (Check for intent)
    if (text.length < 30 && !lowText.includes('?')) {
        const trivialKeywords = ['hi', 'hello', 'thanks', 'bye', 'ok', 'cool'];
        if (trivialKeywords.some(k => lowText.includes(k))) return 'T5';
    }

    // T2: Simple (Factual)
    if (text.length < 100 && !complexKeywords.some(k => lowText.includes(k))) return 'T4';

    // Default: T3 (Moderate Academic)
    return 'T3';
}

function formatAIError(error: any): string {
    const msg = error?.message || error?.data?.error?.message || String(error);
    const lowMsg = msg.toLowerCase();

    if (lowMsg.includes('rate limit') || lowMsg.includes('429') || lowMsg.includes('quota')) {
        return "DAILY_LIMIT_REACHED: Your daily AI quota has been exhausted. Please try again tomorrow.";
    }
    return msg;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const getCacheKey = (question: string, context: string, history: any[]) => {
    return `ai_cache_${btoa(unescape(encodeURIComponent(question + context + JSON.stringify(history)))).slice(0, 32)}`;
};

export const askAI = async (
    context: string,
    question: string,
    provider: AIProvider = 'auto',
    chatHistory: { role: 'user' | 'assistant', content: string }[] = [],
    options: any = {},
    adaptiveProfile?: UserProfile,
    isVoiceContext: boolean = false,
    imageBase64?: string,
    manualMemories?: string,
    testResults: TestResult[] = [],
    _onSearch?: (searching: boolean) => void,
    extraOptions: any = {}
) => {
    // Merge extraOptions into options if applicable
    if (extraOptions?.language) {
        options.language = extraOptions.language;
    }
    // 1. Build Persona
    const memories = manualMemories || getImportantMemories();
    let systemPersona = buildSystemPrompt({
        userProfile: adaptiveProfile || { id: 'guest', name: 'Student' },
        memories,
        testResults,
        webContext: "",
        language: options.language || 'en'
    });

    if (isVoiceContext) {
        systemPersona += `\nVOICE MODE: Be concise. Avoid long lists. Speak math symbols and Greek letters clearly in plain English.`;
    }

    const fullMessages = [
        { 
            role: "system" as const, 
            content: options.jsonMode 
                ? (context.toLowerCase().includes('json') ? context : `${context} (Output must be valid JSON)`)
                : `${systemPersona}\nContext: ${context}` 
        },
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    ];

    if (imageBase64) {
        fullMessages.push({
            role: "user",
            content: [
                { type: "text", text: question || "Identify this image." } as any,
                { type: "image_url", image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` } } as any
            ]
        } as any);
    } else if (question) {
        fullMessages.push({ role: "user", content: question });
    }

    const isStream = options.stream !== false;
    const cacheKey = getCacheKey(question, context, chatHistory);

    // 2. Cache Check
    if (!isStream && !imageBase64 && !options.noCache && question.length < 200) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { response, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) return response;
        }
    }

    // 3. Routing Layer
    try {
        let response: any;
        
        if (provider === 'openai') {
            response = await callOpenAI(fullMessages as any, { ...options, stream: isStream });
        } else {
            // "auto", "groq", or "gemini" all go through the specialized ModelRouter waterfall
            const tier = options.tier || detectTier(question, !!imageBase64, context);
            console.log(`[AI Orchestrator] Routing task to ${tier} Waterfall...`);
            
            response = await modelRouter.route(fullMessages as any, tier, options);
        }

        // 4. Formatting & Cache Save
        if (!isStream && response && typeof response !== 'string') {
            response = response?.choices?.[0]?.message?.content || response;
        }

        if (!isStream && response && typeof response === 'string' && !options.noCache) {
            localStorage.setItem(cacheKey, JSON.stringify({ response, timestamp: Date.now() }));
            if (question.length > 50) extractAndSaveMemory(question);
        }

        return response;

    } catch (error: any) {
        const formatted = formatAIError(error);
        
        // Final fallback: OpenAI
        if (getOpenAIClient() && !isStream) {
            try {
                return await callOpenAI(fullMessages as any, { ...options, stream: false });
            } catch { /* Silence */ }
        }
        
        throw new Error(formatted);
    }
};
