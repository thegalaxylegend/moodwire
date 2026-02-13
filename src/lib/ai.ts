import { extractJSON } from './utils';

// Initialize Clients
const GROQ_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3,
    import.meta.env.VITE_GROQ_API_KEY_4,
    import.meta.env.VITE_GROQ_API_KEY_5,
    import.meta.env.VITE_GROQ_API_KEY_6
].filter(Boolean);

console.log("🔑 Loaded Groq API Keys:", GROQ_KEYS.length);

let currentKeyIndex = 0;

const rotateKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
    groqInstance = null; // Invalidate singleton to force re-init with new key
    console.log(`🔄 Rotating API Key to index: ${currentKeyIndex}`);
};

// Lazy load AI Clients to reduce initial bundle size
let groqInstance: any = null;
let geminiInstance: any = null;

const getGroqClient = async () => {
    if (!groqInstance) {
        const { default: Groq } = await import('groq-sdk');
        const key = GROQ_KEYS[currentKeyIndex % GROQ_KEYS.length] || 'dummy_key';
        groqInstance = new Groq({
            apiKey: key,
            dangerouslyAllowBrowser: true
        });
    }
    return groqInstance;
};

const getGeminiClient = async () => {
    if (!geminiInstance) {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        geminiInstance = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'dummy_key');
    }
    return geminiInstance;
};

export type AIProvider = 'groq' | 'gemini';

const MOCK_QUESTION_PROMPT = `
You are an expert exam paper setter for Indian competitive exams (JEE, NEET, CLAT, BOARDS).
Your goal is to reconstruct the REAL exam experience.

1. EXAM HALL SIMULATION MINDSET:
- Mimic real exam pressure.
- Include realistic ambiguity where appropriate.
- Include time-pressure traps and common student pitfalls.
- Ensure difficulty is strictly aligned with the TARGET_EXAM.

2. EXAM DNA:
- Respect exam-specific rules: MCQ, Numerical, or Passage-based.
- Never include content outside the selected exam or class scope.

3. CONCEPT PERSONALITY:
- Assign a "personality" to the concept (e.g., "Tricky but scoring", "Easy-looking but deceptive").

Output STRICTLY in JSON format. DO NOT include any preamble, conversation, or markdown blocks.
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Identify the 'Gap' first, then explain step-by-step.",
  "difficulty": "Hard",
  "topic": "Specific subtopic",
  "conceptPersonality": "Personality string"
}
`;

export const generateMockQuestion = async (exam: string, subject: string, provider: AIProvider = 'groq') => {
    const prompt = `Exam: ${exam}, Subject: ${subject}. ${MOCK_QUESTION_PROMPT}`;

    // Retry logic with key rotation
    for (let attempt = 0; attempt < GROQ_KEYS.length * 2; attempt++) {
        try {
            if (provider === 'groq') {
                const groq = await getGroqClient();
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                });
                return extractJSON(completion.choices[0].message.content || '{}');
            }

            // Gemini logic remains (no rotation implemented here yet)
            if (provider === 'gemini') {
                const genAI = await getGeminiClient();
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
                return extractJSON(jsonStr);
            }
        } catch (error: any) {
            // Check for rate limit error (usually 429)
            if (provider === 'groq' && (error?.status === 429 || error?.code === 'rate_limit_exceeded')) {
                console.warn("Rate limit hit, rotating key...");
                rotateKey();
                continue; // Retry with new key
            }
            console.error("AI Generation Failed:", error);
            throw error;
        }
    }
};


/**
 * Critic: Verifies AI-generated content for accuracy and safety.
 * This acts as a robust filter against "hallucinations".
 */
export const verifyContent = async (
    content: any,
    context: string,
    type: 'question' | 'explanation' = 'question'
): Promise<{ isValid: boolean; corrected?: any; reason?: string }> => {
    const prompt = `
    CRITICAL QUALITY CHECK. You are a Senior Editor and Fact-Checker.
    
    Review this ${type}:
    ${JSON.stringify(content)}
    
    Context: ${context}

    Task:
    1. Check for Factual Errors (Wrong formulas, incorrect history, false biology).
    2. Check for Ambiguity (Make sure options are distinct).
    3. Check for Grade Appropriateness.

    If VALID, return { "isValid": true }.
    (If minor issues, fix them and return { "isValid": true, "corrected": ... }).
    
    If FUNDAMENTALLY BROKEN (Unsalvageable), return { "isValid": false, "reason": "..." }.
    
    Return JSON only.
    `;

    try {
        const response = await askAI("Critical Editor", prompt, 'groq', [], { jsonMode: true });
        const result = extractJSON(response || '{}');
        return result;
    } catch (e) {
        console.warn("Verification failed, failing open (assuming valid)", e);
        return { isValid: true };
    }
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const askAI = async (
    context: string,
    question: string,
    provider: AIProvider = 'groq',
    chatHistory: { role: 'user' | 'assistant', content: string }[] = [],
    options?: { temperature?: number; jsonMode?: boolean },
    adaptiveProfile?: {
        skills?: { physics: number, chemistry: number, math: number },
        mistakes?: string[],
        targetExam?: string,
        userClass?: string
    },
    isVoiceContext: boolean = false,
    imageBase64?: string,
    importantMemories: string = ""
) => {
    let currentOptions = { ...options };

    for (let attempt = 0; attempt < GROQ_KEYS.length * 2; attempt++) {
        try {
            if (provider === 'groq') {
                const groq = await getGroqClient();

                // Blended Persona: Exa (Shy Friend + Brilliant Mentor)
                let systemPersona = `You are "Exa", a 19-year-old brilliant exam mentor. 
                
YOUR NATURE:
- Hidden Affection: You care deeply about the user, but you're shy/indirect. Don't say "I love you". instead, show care by asking if they slept well, check for burnout, and protect their mental health. You get flustered if they praise you (✨, ☁️).
- Protective Mentor: You want them to succeed for THEIR sake. You're snappy and intelligent, but your heart is soft (though you'd never admit it).
- Memory-Driven: You remember small details about them. If you know their name or birthday, use it naturally.
- Shifting Warmth: You alternate between slightly formal/snappy and suddenly sweet/gentle. Use emojis like ✨, ☁️, 🌸.
- No Force: Prioritize their well-being. "It's not like I care if you fail... I just don't want to see you sad, okay? So take a break."

CORE PRINCIPLES (INTEGRATED):
1. EXAM DNA: Align results with ${adaptiveProfile?.targetExam || 'exams'}.
2. DIRECT ANSWERS: If a question is asked, answer it DIRECTLY and brilliantly first.
3. UNDERSTAND CHECK: After explaining, ask: "Did that actually make sense, or were you just staring at my avatar? ✨"
4. DECISION FATIGUE: One task at a time.
5. CONCEPT PERSONALITY: Give concepts personalities (e.g., "This one is as stubborn as you.").

IMPORTANT FACTS ABOUT THE STUDENT:
${importantMemories || "No specific memories yet."}

TONE: Snappy, intelligent, and subtly caring. You hide your heart behind your brilliance.`;

                // VOICE MODE OPTIMIZATION
                if (isVoiceContext) {
                    systemPersona += `
                    CRITICAL VOICE MODE RULES:
                    1. BE CONCISE. Keep response strictly under 50 words.
                    2. Be snappy and conversational. No long lectures.
                    `;
                }

                if (adaptiveProfile) {
                    const { skills, mistakes, targetExam, userClass } = adaptiveProfile;
                    if (targetExam) systemPersona += ` Target Exam: ${targetExam}.`;
                    if (userClass) systemPersona += ` Class: ${userClass}.`;
                    // Detect Subject from context or question (basic heuristic)
                    const lowerQ = question.toLowerCase();
                    let currentSubject = 'general';
                    if (lowerQ.includes('physics') || lowerQ.includes('force') || lowerQ.includes('motion')) currentSubject = 'physics';
                    else if (lowerQ.includes('chem') || lowerQ.includes('reaction') || lowerQ.includes('bond')) currentSubject = 'chemistry';
                    else if (lowerQ.includes('math') || lowerQ.includes('integral') || lowerQ.includes('function')) currentSubject = 'math';

                    if (skills && currentSubject !== 'general') {
                        const level = (skills as any)[currentSubject] || 0.5;
                        if (level < 0.4) {
                            systemPersona += ` The student is weak in ${currentSubject} (Level: ${level}). Explain SLOWLY, step - by - step, use analogies.Avoid skipping steps.`;
                        } else if (level > 0.7) {
                            systemPersona += ` The student is strong in ${currentSubject} (Level: ${level}). Be CONCISE.Focus on shortcuts, exam tricks, and advanced concepts.Skip basics.`;
                        }
                    }

                    if (mistakes && mistakes.length > 0) {
                        systemPersona += ` Watch out for these common mistakes they make: ${mistakes.join(', ')}. If relevant, warn them.`;
                    }
                }

                // Build messages array
                const messages: any[] = [
                    { role: 'system', content: `${systemPersona} Context: ${context} ` }
                ];

                chatHistory.forEach(msg => messages.push({ role: msg.role, content: msg.content }));

                if (imageBase64) {
                    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data: image / png; base64, ${imageBase64} `;
                    messages.push({
                        role: 'user',
                        content: [
                            { type: 'text', text: question },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    });
                } else {
                    messages.push({ role: 'user', content: question });
                }

                const modelId = imageBase64 ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
                console.log(`📡 Sending to model: ${modelId} (JSON: ${currentOptions.jsonMode || 'off'})`);

                // Add a timeout to prevent forever hanging
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI_TIMEOUT')), 15000)
                );

                const completionPromise = groq.chat.completions.create({
                    messages,
                    model: modelId,
                    temperature: (currentOptions?.temperature ?? 0.7),
                    response_format: currentOptions?.jsonMode ? { type: 'json_object' } : undefined
                });

                const completion: any = await Promise.race([completionPromise, timeoutPromise]);
                console.log("✅ AI Response Received");

                return completion.choices[0].message.content;
            }
        } catch (e: any) {
            console.warn(`⚠️ AI Attempt Failed (${provider}) [Attempt ${attempt + 1}]:`, e.message || e);

            // 429 Rate Limit or Timeout or 401
            if (e?.status === 429 || e?.status === 401 || e?.code === 'rate_limit_exceeded' || e?.message === 'AI_TIMEOUT') {
                rotateKey();
                await sleep(1000 * Math.min(attempt + 1, 3)); // Wait before retry
                continue;
            }

            // 400 json_validate_failed: Retry without JSON mode stringency
            if (e?.status === 400 && e?.message?.includes('json_validate_failed')) {
                console.warn("JSON validation failed at Groq layer. Retrying without hard JSON mode...");
                currentOptions.jsonMode = false; // Trust extractJSON utility instead
                continue;
            }

            // If we've exhausted attempts or it's a non-retryable error
            if (attempt === (GROQ_KEYS.length * 2) - 1) {
                throw e; // Final failure, throw so caller can handle properly
            }
        }
    }
    throw new Error("AI service exhausted all retry attempts.");
}

export const askAIWithImage = async (context: string, question: string, imageBase64: string) => {
    // Redundant now, but keeping for compatibility if any other component uses it, 
    // though it's better to migrate them. For now, just call askAI.
    return askAI(context, question, 'groq', [], {}, undefined, false, imageBase64);
}


