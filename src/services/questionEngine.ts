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
    increment,
    getCountFromServer
} from 'firebase/firestore';
import { askAI } from '../lib/ai';
import { extractJSON } from '../lib/utils';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

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
const verifyQuestionTriply = async (questionData: Partial<StoredQuestion>): Promise<{ verified: boolean; data?: Partial<StoredQuestion> }> => {
    let currentData = { ...questionData };

    for (let i = 1; i <= 3; i++) {
        const verificationPrompt = `
        VERIFY EXAM QUESTION (ROUND ${i}/3)
        
        Question: ${currentData.question}
        Options: ${JSON.stringify(currentData.options)}
        Current Correct Answer: ${currentData.correct_answer}
        Exam context: ${currentData.exam}
        
        CRITICAL: 
        1. Check scientific/mathematical correctness.
        2. Verify if the correct option is actually correct.
        3. Check for calculation errors.
        4. If wrong, provide the FIXED version in JSON.
        5. If doubtful or confidence < 95%, reply with {"status": "REJECT"}.
        
        OUTPUT FORMAT (JSON ONLY - STRICTLY NO MARKDOWN, NO PREAMBLE):
        {
          "status": "APPROVED" | "REFIXED" | "REJECT",
          "fixed_data": { ...same structure as input if REFIXED... },
          "confidence": 0.98
        }
        `;

        try {
            const response = await askAI("You are a strict senior exam reviewer.", verificationPrompt, 'groq', [], { jsonMode: false });
            if (!response) return { verified: false };

            const result = extractJSON(response);

            if (result.status === 'REJECT' || (result.confidence || 0) < 0.95) {
                console.warn(`[QuestionEngine] Question rejected in round ${i}`);
                return { verified: false };
            }

            if (result.status === 'REFIXED' && result.fixed_data) {
                currentData = { ...currentData, ...result.fixed_data };
            }

            // Mandatory breath between rounds to avoid 429
            await sleep(2000);
        } catch (e) {
            console.error(`Verification round ${i} failed`, e);
            return { verified: false };
        }
    }

    return { verified: true, data: currentData };
};

/**
 * Storage Optimization: Enforce 50 questions per topic limit.
 */
const enforceStorageLimit = async (topic: string, exam: string) => {
    try {
        const q = query(
            collection(db, 'engine_questions'),
            where('topic', '==', topic),
            where('exam', '==', exam),
            orderBy('usage_count', 'asc')
        );

        const countSnap = await getCountFromServer(q);
        if (countSnap.data().count >= TOPIC_LIMIT) {
            // Delete the lowest usage question
            const snap = await getDocs(query(q, limit(1)));
            if (!snap.empty) {
                await deleteDoc(snap.docs[0].ref);
                console.log(`[QuestionEngine] Storage limit reached for ${topic}. Deleted lowest usage question.`);
            }
        }
    } catch (e) {
        console.error("Storage limit enforcement failed", e);
    }
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
    GENERATE ORIGINAL EXAM QUESTION.
    
    EXAM: ${exam}
    SUBJECT: ${subject}
    TOPIC: ${topic} (If generic, pick a specific Chapter/Unit)
    DIFFICULTY: ${difficulty}
    
    RULES:
    1. STRICTLY follow ${exam} pattern (JEE Adv = Multi-correct/Integer/Passage, JEE Main = MCQ, NEET = NCERT-line based, etc.)
    2. ORIGINAL content only. Inspired by PYQs but NOT copied.
    3. Include conceptual traps.
    
    OUTPUT FORMAT (JSON ONLY - STRICTLY NO PREAMBLE, NO MARKDOWN):
    {
      "exam": "${exam}",
      "subject": "${subject}",
      "chapter": "Specific Chapter Name",
      "topic": "Specific Topic Name (e.g. Rotational Motion, not just Physics)",
      "type": "MCQ", 
      "difficulty": "${difficulty}",
      "question": "...",
      "options": ["A", "B", "C", "D"] or {"A": "...", ...},
      "correct_answer": "...",
      "explanation": "Short max 80 words",
      "concept_tags": ["tag1", "tag2"],
      "error_trap_type": "Calculation/Conceptual/Ambiguity"
    }
    `;

    try {
        const response = await askAI("You are a technical question generator.", generationPrompt, 'groq', [], { jsonMode: false });
        if (!response) return null;

        const rawData = extractJSON(response);

        // 1. SHA256 Duplication Check
        const hashText = rawData.question + JSON.stringify(rawData.options);
        const hash = await generateHash(hashText);

        const dupQuery = query(collection(db, 'engine_questions'), where('hash', '==', hash));
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
            console.warn("[QuestionEngine] Duplicate hash detected. Rejecting.");
            return null;
        }

        // 2. Triple Verification
        await sleep(500); // Throttling to avoid 429
        const verification = await verifyQuestionTriply(rawData);
        if (!verification.verified || !verification.data) {
            return null;
        }

        const verifiedData = verification.data;

        // 3. Storage Optimization & Save
        // We enforce limit on the SPECIFIC topic returned by AI (e.g. "Rotational Motion")
        await enforceStorageLimit(verifiedData.topic || topic, exam);

        const finalQuestion: Omit<StoredQuestion, 'id'> = {
            ...verifiedData as StoredQuestion,
            hash,
            usage_count: 0,
            accuracy_rate: 100,
            created_at: new Date().toISOString(),
            confidence: 0.98 // Fixed based on verification success
        };

        const docRef = await addDoc(collection(db, 'engine_questions'), finalQuestion);
        return { id: docRef.id, ...finalQuestion };

    } catch (e) {
        console.error("Question generation/saving failed", e);
        return null;
    }
};

/**
 * Adaptive Question Selection Strategy.
 * Prioritizes DB over API.
 */
export const getAdaptiveQuestion = async (
    userId: string,
    topic: string,
    exam: string,
    weaknessScore: number,
    subject?: string // Optional subject context
): Promise<StoredQuestion | null> => {

    // Determine target difficulty based on weakness_score
    let targetDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (weaknessScore > 0.7) targetDifficulty = 'Easy';
    else if (weaknessScore < 0.4) targetDifficulty = 'Hard';

    try {
        // 1. Try to find in DB (Specific Topic)
        let q = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic', '==', topic),
            where('difficulty', '==', targetDifficulty),
            orderBy('usage_count', 'asc'),
            limit(10)
        );

        // 1b. Fallback: If topic seems generic (e.g. "Physics"), check 'subject' instead
        // This handles Full Mocks where we ask for "Physics" but stored questions are "Kinematics"
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
            // Pick a random one from top 10 (load balancing)
            const randomIndex = Math.floor(Math.random() * snap.docs.length);
            const selectedDoc = snap.docs[randomIndex];

            // Update usage count asynchronously
            updateDoc(selectedDoc.ref, { usage_count: increment(1) });

            return { id: selectedDoc.id, ...selectedDoc.data() } as StoredQuestion;
        }

        // 2. If not found, Generate Live (Cache Miss)
        console.log(`[QuestionEngine] Cache miss for ${topic} (${targetDifficulty}). Generating...`);

        // Ensure we have a valid subject
        let finalSubject = subject || 'General';
        if (!subject) {
            const subjectSnap = await getDocs(query(collection(db, 'user_topic_stats'), where('user_id', '==', userId), where('topic', '==', topic), limit(1)));
            finalSubject = !subjectSnap.empty ? subjectSnap.docs[0].data().subject : 'General';
        }

        return await generateInspiredQuestion({ exam, subject: finalSubject, topic, difficulty: targetDifficulty });

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
        const countSnap = await getCountFromServer(countQ);

        if (countSnap.data().count < 5) {
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
