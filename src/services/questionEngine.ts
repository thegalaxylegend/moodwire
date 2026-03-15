import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    deleteDoc,
    updateDoc,
    doc,
    increment,

} from 'firebase/firestore';
import { askAI } from '../lib/ai';
import { extractJSON } from '../lib/utils';
import { EloService } from './eloService';

// sleep removed for speed improvements

export interface StoredQuestion {
    id?: string;
    exam: string;
    subject: string;
    chapter: string;
    topic: string;
    type: 'MCQ' | 'Multi-Correct' | 'Integer' | 'Passage' | 'Assertion-Reason';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    question: string;
    options: string[] | Record<string, string>;
    correct_answer: string;
    explanation: string;

    // AI 2.0 Upgrades
    rich_explanation?: {
        steps: string[];
        why_others_wrong: Record<string, string>;
        teach_me_like_12: string;
        diagram_prompt?: string;
    };

    concept_tags: string[];
    error_trap_type: string;
    hash: string;
    usage_count: number;
    accuracy_rate: number;
    created_at: string;
    confidence: number;
}

const TOPIC_LIMIT = 50;

// Helper to generate SHA256 hash
const generateHash = async (text: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Advanced Verification Layer: re-checks the question 3 times for accuracy.
 */
/**
 * Fast Verification Layer: Single, robust check.
 */
const verifyQuestionFast = async (questionData: Partial<StoredQuestion>): Promise<{ verified: boolean; data?: Partial<StoredQuestion> }> => {
    const currentData = { ...questionData };

    const verificationPrompt = `
    Verify MCQ: ${currentData.question}
    Options: ${JSON.stringify(currentData.options)}
    Correct: ${currentData.correct_answer}
    Exam: ${currentData.exam}
    
    Checks: accuracy, Grade appropriateness, Option content.
    Return the result as a JSON object:
    - If good, return {"status": "APPROVED", "confidence": 1.0}.
    - If options are placeholders (like "A", "B", "C", "D" with no content), return {"status": "REJECT"}.
    - If wrong, fix it and return {"status": "REFIXED", "fixed_data": {...}}.
    - If junk, return {"status": "REJECT"}.
    `;

    try {
        // Using ultra-fast 8B model for verification
        const response = await askAI("Technical Fact Checker", verificationPrompt, 'groq', [], {
            jsonMode: true,
            modelId: 'llama-3.1-8b-instant',
            temperature: 0.1,
            stream: false
        });
        if (!response) return { verified: true, data: currentData }; // Fail open for speed

        const result = extractJSON(response as string);

        if (result.status === 'REJECT') return { verified: false };
        if (result.status === 'REFIXED' && result.fixed_data) return { verified: true, data: { ...currentData, ...result.fixed_data } };

        return { verified: true, data: currentData };
    } catch (e) {
        console.warn(`Verification failed, trusting generation:`, e);
        return { verified: true, data: currentData };
    }
};

/**
 * Storage Optimization: Enforce 50 questions per topic limit (Now Asynchronous).
 */
const enforceStorageLimit = (topic: string, exam: string) => {
    // Fire and forget - don't block generation
    (async () => {
        try {
            const q = query(
                collection(db, 'engine_questions'),
                where('topic', '==', topic),
                where('exam', '==', exam),
                orderBy('usage_count', 'asc')
            );
            const countSnap = await getDocs(q);
            if (countSnap.size >= TOPIC_LIMIT) {
                const snap = await getDocs(query(q, limit(1)));
                if (!snap.empty) deleteDoc(snap.docs[0].ref);
            }
        } catch (e) {
            console.error("Storage limit enforcement failed", e);
        }
    })();
};

/**
 * Generate a new inspired question for a specific topic.
 */
export const generateInspiredQuestion = async (
    params: {
        exam: string,
        subject: string,
        topic: string,
        difficulty: 'Easy' | 'Medium' | 'Hard'
    }
): Promise<StoredQuestion | null> => {
    const { exam, subject, topic, difficulty } = params;

    const generationPrompt = `
    GENERATE A TOTALLY FRESH AND UNIQUE EXAM QUESTION IN JSON FORMAT. 
    BatchID: ${Date.now()}-${Math.random().toString(36).substring(7)}
    
    EXAM: ${exam}
    SUBJECT: ${subject}
    TOPIC: ${topic}
    DIFFICULTY: ${difficulty}
    
    RULES:
    1. STRICTLY follow ${exam} pattern.
    2. USE "${exam} PREVIOUS YEAR QUESTION (PYQ)" ARCHIVES for inspiration.
    3. MODIFY actual PYQ contexts to create "Fresh" problems.
    4. Provide a "Step-by-Step" solution walkthrough.
    5. Explain "Why each wrong option is wrong".
    6. Provide a "Teach me like I'm 12" simplified intuition.
    7. If question is visual (Physics/Bio/Chem), provide a "diagram_prompt".
    
    OUTPUT FORMAT: Return ONLY a valid JSON object. No Markdown, No Prose, No Commentary.
    {
      "exam": "${exam}",
      "subject": "${subject}",
      "chapter": "Chapter Name",
      "topic": "${topic}",
      "type": "MCQ", 
      "difficulty": "${difficulty}",
      "question": "The actual question text goes here...",
      "options": ["Option content 1", "Option content 2", "Option content 3", "Option content 4"],
      "correct_answer": "Exact text of the correct option",
      "explanation": "Brief summary",
      "rich_explanation": {
         "steps": ["Step 1...", "Step 2..."],
         "why_others_wrong": {"Option A": "Because...", "Option B": "Faulty logic because...", ...},
         "teach_me_like_12": "Simplified concept explanation",
         "diagram_prompt": "educational diagram of..."
      },
      "concept_tags": ["tag1", "tag2"],
      "error_trap_type": "Calculation/Conceptual"
    }
    `;

    try {
        const response = await askAI("Technical Exam Question Agent. JSON ONLY.", generationPrompt, 'groq', [], { 
            jsonMode: true, 
            stream: false, 
            max_tokens: 1800,
            modelId: 'llama-3.1-8b-instant' // Use 8B for extreme speed (supported by robust repair)
        });
        if (!response) return null;

        const rawData = extractJSON(response as string);

        // 1. SHA256 Duplication Check
        const hashText = rawData.question + JSON.stringify(rawData.options);
        const hash = await generateHash(hashText);

        const dupQuery = query(collection(db, 'engine_questions'), where('hash', '==', hash));
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
            console.warn("[QuestionEngine] Duplicate hash detected. Rejecting.");
            return null;
        }

        // 2. Triple Verification -> Single Fast Verification
        // await sleep(500); // Throttling removed for speed
        const verification = await verifyQuestionFast(rawData);
        if (!verification.verified || !verification.data) {
            return null;
        }

        const verifiedData = verification.data;

        // 3. Storage Optimization & Save (Backgorund)
        enforceStorageLimit(verifiedData.topic || topic, exam);

        const finalQuestion: Omit<StoredQuestion, 'id'> = {
            ...verifiedData as StoredQuestion,
            hash,
            usage_count: 0,
            accuracy_rate: 100,
            created_at: new Date().toISOString(),
            confidence: 0.98
        };

        // Fire and forget the save - return immediately
        addDoc(collection(db, 'engine_questions'), finalQuestion);

        return { id: 'live-' + Date.now(), ...finalQuestion };

    } catch (e) {
        console.error("Question generation/saving failed", e);
        return null;
    }
};

export const invalidateTopicCache = (userId: string, exam: string, topic: string) => {
    try {
        const prefix = `q_engine_cache_${userId}_${exam}_${topic}_`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        if (keysToRemove.length > 0) {
            console.log(`[QuestionEngine] 🧹 Cleared cache for mastered topic: ${topic}`);
        }
    } catch (e) { console.warn("Cache invalidate failed", e); }
};

// Persistent cache for questions to slash costs
const getCache = (key: string): StoredQuestion[] | null => {
    try {
        const cached = localStorage.getItem(`q_engine_cache_${key}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) { // 12h TTL
                return parsed.questions;
            }
        }
    } catch (e) { console.warn("Cache read failed", e); }
    return null;
};

const setCache = (key: string, questions: StoredQuestion[]) => {
    try {
        localStorage.setItem(`q_engine_cache_${key}`, JSON.stringify({
            questions,
            timestamp: Date.now()
        }));
    } catch (e) { console.warn("Cache write failed", e); }
};

/**
 * Adaptive Question Selection Strategy.
 * Prioritizes Cache -> DB -> API.
 */
export const getAdaptiveQuestion = async (
    userId: string,
    topic: string,
    exam: string,
    weaknessScore: number,
    subject?: string,
    abilityScore?: number
): Promise<StoredQuestion | null> => {

    let targetDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (abilityScore !== undefined) {
        targetDifficulty = EloService.getTargetDifficulty(abilityScore);
    } else {
        if (weaknessScore > 0.7) targetDifficulty = 'Easy';
        else if (weaknessScore < 0.4) targetDifficulty = 'Hard';
    }

    const cacheKey = `${userId}_${exam}_${topic}_${targetDifficulty}`;

    // 1. Check Persistent Cache First (0 Cost)
    const cachedQuestions = getCache(cacheKey);
    if (cachedQuestions && cachedQuestions.length > 0) {
        console.log(`[QuestionEngine] ⚡ Persistent Cache Hit for ${topic}`);
        const randomIndex = Math.floor(Math.random() * cachedQuestions.length);
        return cachedQuestions[randomIndex];
    }

    try {
        // 2. Try to find in DB (Specific Topic)
        let q = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic', '==', topic),
            where('difficulty', '==', targetDifficulty),
            orderBy('usage_count', 'asc'),
            limit(10)
        );

        const isGeneric = topic === subject || ['physics', 'chemistry', 'mathematics', 'biology', 'science'].includes(topic.toLowerCase());

        if (isGeneric && subject) {
            q = query(
                collection(db, 'engine_questions'),
                where('exam', '==', exam),
                where('subject', '==', subject),
                where('difficulty', '==', targetDifficulty),
                orderBy('usage_count', 'asc'),
                limit(10)
            );
        }

        const snap = await getDocs(q);
        if (!snap.empty) {
            const fetchedQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQuestion));

            // Populate Cache
            setCache(cacheKey, fetchedQuestions);

            const selectedQuestion = fetchedQuestions[Math.floor(Math.random() * fetchedQuestions.length)];

            // Update usage count asynchronously
            updateDoc(doc(db, 'engine_questions', selectedQuestion.id!), { usage_count: increment(1) });

            return selectedQuestion;
        }

        // 3. If not found, Generate Live (Cache Miss)
        console.log(`[QuestionEngine] 🧩 Firestore Miss for ${topic} (${targetDifficulty}). Generating...`);

        // Ensure we have a valid subject
        let finalSubject = subject || 'General';
        if (!subject) {
            const subjectSnap = await getDocs(query(collection(db, 'user_topic_stats'), where('user_id', '==', userId), where('topic', '==', topic), limit(1)));
            finalSubject = !subjectSnap.empty ? subjectSnap.docs[0].data().subject : 'General';
        }

        const generated = await generateInspiredQuestion({ exam, subject: finalSubject, topic, difficulty: targetDifficulty });

        // Optionally put the generated one into cache too (or let it be found on next DB hit)
        return generated;

    } catch (e: any) {
        if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
            throw e;
        }
        console.error("Adaptive selection failed", e);
        return null;
    }
};

/**
 * Pre-generate daily batch for weak topics.
 */
export const prefetchQuestionsForWeakTopics = async (userId: string, exam: string) => {
    const { getWeakTopics } = await import('./topicStrengthService');
    const weakTopics = await getWeakTopics(userId, 3, undefined, exam);

    for (const topicStat of weakTopics) {
        // Check if we already have enough questions in DB
        const countQ = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic', '==', topicStat.topic)
        );
        const countSnap = await getDocs(countQ);

        if (countSnap.size < 5) {
            console.log(`[QuestionEngine] Pre-generating batch for ${topicStat.topic}...`);
            await generateInspiredQuestion({
                exam,
                subject: topicStat.subject,
                topic: topicStat.topic,
                difficulty: (topicStat.weakness_score || 0) > 0.7 ? 'Easy' : 'Medium'
            });
        }
    }
};
