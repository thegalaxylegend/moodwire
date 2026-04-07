import { callGroq } from './groq';
import { callOpenAI, getOpenAIClient } from './openai';
import { callGemini } from './gemini';
import { buildSystemPrompt } from './systemPrompt';
import type { UserProfile, TestResult } from './systemPrompt';
import { getImportantMemories, extractAndSaveMemory } from './memoryExtractor';

export type AIProvider = 'groq' | 'openai' | 'gemini';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getCacheKey = (question: string, context: string, history: any[]) => {
    return `ai_cache_${btoa(unescape(encodeURIComponent(question + context + JSON.stringify(history)))).slice(0, 32)}`;
};

export const askAI = async (
    context: string,
    question: string,
    provider: AIProvider = 'groq',
    chatHistory: { role: 'user' | 'assistant', content: string }[] = [],
    options: any = {},
    adaptiveProfile?: UserProfile,
    _isVoiceContext: boolean = false,
    imageBase64?: string,
    manualMemories?: string,
    testResults: TestResult[] = [],
    _onSearch?: (searching: boolean) => void
) => {
    // 1. Web Search Orchestration (DISABLED TO REDUCE LOAD)
    const webContext = "";
    /* 
    if (needsWebSearch(question)) {
        if (onSearch) onSearch(true);
        const results = await searchWeb(question);
        if (onSearch) onSearch(false);
        if (results) {
            webContext = formatSearchResults(results);
        }
    }
    */

    // 2. Build System Persona
    const memories = manualMemories || getImportantMemories();
    let systemPersona = buildSystemPrompt({
        userProfile: adaptiveProfile || { id: 'guest', name: 'Student' },
        memories,
        testResults,
        webContext
    });

    // Voice Context Optimization
    if (_isVoiceContext) {
        systemPersona += `\n\nVOICE MODE ACTIVE:
1. Be concise but thorough if the user asks for a solution or explanation.
2. Use natural, conversational language. Avoid long bullet points if possible.
3. Pronounce LaTeX or formulas in plain English if they appear.
4. Focus on the direct answer to the user's question, but provide the necessary steps for understanding.`;
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

    // Handle Vision
    if (imageBase64) {
        fullMessages.push({
            role: "user",
            content: [
                { type: "text", text: question || "Solve this problem." } as any,
                { type: "image_url", image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` } } as any
            ]
        } as any);
    } else if (question) {
        fullMessages.push({ role: "user", content: question });
    }

    // 3. Execution with Fallback Chain: Groq → Gemini → OpenAI
    try {
        const modelId = options.modelId || (imageBase64 ? "llama-3.2-11b-vision-preview" : undefined);
        const isStream = options.stream !== false;
        
        // 4. Cache Check (Non-streaming only)
        const isInternalPrompt = 
            question.length > 200 ||
            options.jsonMode === true ||
            question.includes('GENERATE') ||
            question.includes('OUTPUT FORMAT') ||
            question.includes('JSON ONLY');

        if (!isStream && !imageBase64 && !options.noCache && !isInternalPrompt) {
            const cacheKey = getCacheKey(question, context, chatHistory);
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { response, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    console.log("[AI] Returning cached response for:", question.slice(0, 50) + "...");
                    if (question.length > 30) {
                        extractAndSaveMemory(question);
                    }
                    return response;
                }
            }
        }
        
        let response: any;
        if (provider === 'groq') {
            try {
                response = await callGroq(fullMessages as any, { 
                    ...options, 
                    model: modelId,
                    stream: isStream
                });
            } catch (groqError: any) {
                console.warn("[AI] Groq failed, trying Gemini fallback...", groqError?.message?.slice(0, 80));
                // Fallback 1: Gemini
                try {
                    response = await callGemini(fullMessages as any, {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.max_tokens ?? 8192,
                        jsonMode: options.jsonMode ?? false,
                        stream: options.stream ?? false,
                    });
                } catch (geminiError: any) {
                    console.warn("[AI] Gemini fallback failed, trying OpenAI...", geminiError?.message?.slice(0, 80));
                    // Fallback 2: OpenAI (only if key exists)
                    if (getOpenAIClient()) {
                        response = await callOpenAI(fullMessages as any, { ...options, stream: isStream });
                    } else {
                        // No OpenAI key — rethrow the original Groq error
                        throw groqError;
                    }
                }
            }
        } else if (provider === 'gemini') {
            try {
                response = await callGemini(fullMessages as any, {
                    temperature: options.temperature ?? 0.1,
                    maxOutputTokens: options.max_tokens ?? 8192,
                    jsonMode: options.jsonMode ?? false,
                    stream: options.stream ?? false,
                    model: options.modelId || 'gemini-1.5-flash'
                });
            } catch (geminiError: any) {
                console.warn("[AI] Gemini failed, falling back to Groq...", geminiError?.message?.slice(0, 80));
                try {
                    response = await callGroq(fullMessages as any, {
                        ...options,
                        model: modelId,
                        stream: isStream
                    });
                } catch (groqError: any) {
                    // Last resort: OpenAI
                    if (getOpenAIClient()) {
                        response = await callOpenAI(fullMessages as any, { ...options, stream: isStream });
                    } else {
                        throw geminiError;
                    }
                }
            }
        } else if (provider === 'openai') {
            response = await callOpenAI(fullMessages as any, { ...options, stream: isStream });
        }

        // 5. Extract content for non-streaming responses (ChatCompletion objects)
        if (!isStream && response && typeof response !== 'string') {
            // Non-streaming Groq/OpenAI returns { choices: [{ message: { content: "..." } }] }
            const extractedContent = response?.choices?.[0]?.message?.content;
            if (extractedContent) {
                response = extractedContent;
            }
        }

        // 6. Save to Cache
        if (!isStream && !imageBase64 && response && typeof response === 'string' && !options.noCache && !isInternalPrompt) {
            const cacheKey = getCacheKey(question, context, chatHistory);
            localStorage.setItem(cacheKey, JSON.stringify({
                response,
                timestamp: Date.now()
            }));
        }

        return response;
    } catch (error) {
        console.error("All AI providers failed:", error);
        throw error;
    }
    return "I'm sorry, I'm having trouble processing that right now.";
};
