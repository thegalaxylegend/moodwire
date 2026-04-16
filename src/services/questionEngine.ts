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
import { extractJSON, resolveTopicId } from '../lib/utils';
import { EloService } from './eloService';
import { offlineSyncService } from './offlineSyncService';
import { getFormulaSheet } from '../lib/formulaSheets';
import { checkDerivationConsistency, checkStepConsistency } from '../lib/consistencyCheck';
import { validateUnits } from '../lib/unitValidator';
import { checkConceptualQuestion, isNumericalQuestion } from '../lib/factValidator';

// Timeout wrapper for API calls
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('API_TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
};

export interface StoredQuestion {
    id?: string;
    exam: string;
    subject: string;
    chapter: string;
    topic: string;
    topic_id: string; // Deterministic ID for remediation targeting
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
    technical_data_sheet?: Record<string, any>;
    numerical_formula?: string;
    hidden_derivation?: string;

    // v3.0: Structured validation fields
    step_by_step_solution?: string[];
    final_numerical_value?: number;
    final_unit?: string;
    formula_used?: string;
    given_values?: Record<string, string>;
    verification_details?: {
        verifier_answer: string;
        verifier_matches: boolean;
        consistency_check_passed: boolean;
        unit_check_passed: boolean;
    };

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
 * Enhanced Verification Layer: Anti-anchored independent verification.
 * v3.0: Verifier sees answer AFTER solving, not before.
 */
const verifyQuestionFast = async (questionData: Partial<StoredQuestion>, runConsensus: boolean = false): Promise<{ verified: boolean; data?: Partial<StoredQuestion>; isRefixed?: boolean; verifierAnswer?: string; verifierMatches?: boolean }> => {
    const currentData = { ...questionData };

    // ── HEURISTIC SAFETY CHECK: Enhanced placeholder/garbage detection ──
    const questionText = currentData.question || "";
    const optionsArr = Array.isArray(currentData.options) ? currentData.options : Object.values(currentData.options || {});

    const questionLower = questionText.toLowerCase();
    const isPlaceholder =
        questionText.length < 80 ||
        questionLower.includes("placeholder") ||
        questionLower.includes("lorem ipsum") ||
        questionLower.includes("best describes the concept") ||
        questionLower.includes("best describes the core concept") ||
        questionLower.includes("practice question:") ||
        questionLower.includes("fundamental principle of") ||
        questionLower.includes("template question") ||
        questionLower.includes("sample question") ||
        optionsArr.some(opt => {
            const trimmed = typeof opt === 'string' ? opt.trim() : '';
            return trimmed === "Option A" || trimmed === "Placeholder" ||
                /^[A-D]$/i.test(trimmed) ||
                /^[A-D][.:)\s]/i.test(trimmed) ||
                /^a fundamental principle/i.test(trimmed);
        });

    if (isPlaceholder) {
        console.warn(`[QuestionEngine] Heuristic rejection: Quality too low.`);
        return { verified: false };
    }

    // Check for duplicate options
    const normalizedOpts = optionsArr.map(o => (typeof o === 'string' ? o : '').toLowerCase().trim());
    if (new Set(normalizedOpts).size < optionsArr.length) {
        console.warn(`[QuestionEngine] Heuristic rejection: Duplicate options detected.`);
        return { verified: false };
    }

    // Avg option length check: BACK TO 93% SYSTEM (STRICT)
    const avgOptLen = optionsArr.reduce((s, o) => s + (typeof o === 'string' ? o.length : 0), 0) / Math.max(optionsArr.length, 1);
    if (avgOptLen < 15) {
        console.warn(`[QuestionEngine] Heuristic rejection: Options too short (avg ${avgOptLen.toFixed(0)} chars). MUST be descriptive.`);
        return { verified: false };
    }

    // ── ANTI-ANCHORED VERIFICATION PROMPT ──
    // Key change: answer is shown in STEP 2, AFTER the solve instruction
    const verificationPrompt = `
### INDEPENDENT ACCURACY AUDITOR — MATH-ONLY MODE

You are verifying a ${currentData.exam || 'JEE/NEET'} MCQ. You MUST solve this problem from scratch.

═══ STEP 0: SANITY CHECK ═══
QUESTION: "${currentData.question}"
OPTIONS: ${JSON.stringify(currentData.options)}

Check: Are ALL necessary variables/data provided in the question to solve it?
Check: Is the question physically/chemically/mathematically meaningful?
If NO → return {"status": "REJECT", "logic": "reason"}

═══ STEP 1: SOLVE INDEPENDENTLY ═══
⚠️ DO NOT look at the stated answer yet. Solve the problem completely:
1. Identify the relevant formula
2. List the given quantities with units
3. Substitute values and calculate step by step
4. State YOUR answer with units

Write your complete solution in "my_solution".

═══ STEP 2: COMPARE ═══
Now read the stated answer and compare:
STATED ANSWER: "${currentData.correct_answer}"
STATED FORMULA: "${currentData.numerical_formula || 'None'}"

Compare YOUR answer (from Step 1) to the STATED answer.

═══ DECISION RULES (STRICT ACCURACY) ═══
⚠️ IMPORTANT: You are a senior examiner. Any deviation in physics/math logic is a REJECT.
REJECT for:
1. Your independent answer differs from stated answer by >1% (Precision is key)
2. Stated formula is used incorrectly or is factually wrong
3. Question contains placeholder language ("Best describes...", "Option A")
4. Stated answer is NOT present in the options list or lacks units
5. Nuclear/Chemical reactions violate conservation laws

═══ DECISION ═══
- APPROVED: Your Step 1 numerical answer matches the stated answer (within 5%)
- REFIXED: Math is correct but stated answer had a minor error. Fix it in "fixed_data"
- REJECT: The stated answer is MATHEMATICALLY WRONG

OUTPUT (JSON ONLY):
{
  "status": "APPROVED | REJECT | REFIXED",
  "my_solution": "Complete step-by-step work from Step 1",
  "my_answer": "Your independently derived answer",
  "my_answer_numerical": 0.0,
  "stated_answer_numerical": 0.0,
  "answers_match": true,
  "logic": "Detailed comparison explanation",
  "fixed_data": { "correct_answer": "...", "options": ["..."] }
}
`;

    try {
        const primaryPromise = askAI("Senior Physics, Chemistry & Mathematics Professor. Strict accuracy auditor. JSON ONLY.", verificationPrompt, 'auto', [], {
            jsonMode: true,
            tier: 'T1', // Expert Verifier
            temperature: 0.0,
            stream: false,
            max_tokens: 2000
        });

        let results: any[] = [];
        if (runConsensus) {
            const secondaryPromise = askAI("Senior Physics, Chemistry & Mathematics Professor. Strict accuracy auditor. JSON ONLY.", verificationPrompt, 'groq', [], {
                jsonMode: true,
                tier: 'T2', 
                temperature: 0.1,
                stream: false,
                max_tokens: 2000
            });
            const [res1, res2] = await Promise.all([
                withTimeout(primaryPromise, 30000),
                withTimeout(secondaryPromise, 30000)
            ]);
            if (!res1 || !res2) return { verified: false };
            results = [extractJSON(res1 as string), extractJSON(res2 as string)];
        } else {
            const response = await withTimeout(primaryPromise, 30000);
            if (!response) return { verified: false };
            results = [extractJSON(response as string)];
        }

        const result = results[0];
        const consensusResult = results[1];

        // ── REJECT handling ──
        if (result.status === 'REJECT' || (consensusResult && consensusResult.status === 'REJECT')) {
            console.warn(`[QuestionEngine] Verifier REJECTED: ${result.logic || 'No reason'} ${consensusResult ? '(or consensus rejected)' : ''}`);
            return { verified: false };
        }

        // ── NEW: Numerical answer comparison (anti-anchoring layer) ──
        let verifierMatches = true;
        if (result.my_answer_numerical !== undefined && result.stated_answer_numerical !== undefined) {
            const myNum = Number(result.my_answer_numerical);
            const statedNum = Number(result.stated_answer_numerical);
            if (!isNaN(myNum) && !isNaN(statedNum) && (Math.abs(myNum) > 0.001 || Math.abs(statedNum) > 0.001)) {
                const ref = Math.max(Math.abs(myNum), Math.abs(statedNum));
                const diff = Math.abs(myNum - statedNum) / ref;
                if (diff > 0.01) {
                    verifierMatches = false;
                    if (result.status === 'APPROVED') {
                        console.warn(`[QuestionEngine] Override: Verifier said APPROVED but answers differ by ${(diff * 100).toFixed(1)}% (verifier: ${myNum}, stated: ${statedNum}). REJECTING.`);
                        return { verified: false };
                    }
                }
            }
        }
        
        // ── CONSENSUS Numerical Check ──
        if (runConsensus && consensusResult && result.my_answer_numerical !== undefined && consensusResult.my_answer_numerical !== undefined) {
            const num1 = Number(result.my_answer_numerical);
            const num2 = Number(consensusResult.my_answer_numerical);
            if (!isNaN(num1) && !isNaN(num2) && (Math.abs(num1) > 0.001 || Math.abs(num2) > 0.001)) {
                const ref = Math.max(Math.abs(num1), Math.abs(num2));
                const diff = Math.abs(num1 - num2) / ref;
                if (diff > 0.01) {
                    console.warn(`[QuestionEngine] Override: Consensus failed! Dual models disagreed on answer (${num1} vs ${num2}). REJECTING.`);
                    return { verified: false };
                }
            }
        }

        // Also check the boolean field if provided
        if (result.answers_match === false && result.status === 'APPROVED') {
            console.warn(`[QuestionEngine] Override: Verifier said APPROVED but answers_match=false. REJECTING.`);
            return { verified: false };
        }

        // ── REFIXED handling ──
        if (result.status === 'REFIXED' && result.fixed_data) {
            const fixedOpts = result.fixed_data.options || currentData.options;
            const fixedAns = result.fixed_data.correct_answer;
            if (fixedAns && Array.isArray(fixedOpts) && !fixedOpts.includes(fixedAns)) {
                console.warn(`[QuestionEngine] REFIXED answer not in options. Rejecting.`);
                return { verified: false };
            }
            return {
                verified: true,
                data: { ...currentData, ...result.fixed_data },
                isRefixed: true,
                verifierAnswer: result.my_answer,
                verifierMatches
            };
        }

        return {
            verified: true,
            data: currentData,
            isRefixed: false,
            verifierAnswer: result.my_answer,
            verifierMatches
        };
    } catch (e: any) {
        if (e.message === 'API_TIMEOUT') {
            console.error(`[QuestionEngine] Verification timed out (30s).`);
        } else {
            console.error(`Verification failed, rejecting for safety:`, e);
        }
        return { verified: false };
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
        topic_id?: string, // New deterministic ID
        difficulty: 'Easy' | 'Medium' | 'Hard',
        abilityScore?: number,
        remediationFocus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD'
    }
): Promise<StoredQuestion | null> => {
    const { exam, subject, topic, topic_id, difficulty, abilityScore = 5, remediationFocus } = params;
    const resolvedTopicId = topic_id || resolveTopicId(topic);

    // Pre-Generation DB Check — only trust high-confidence questions from post-audit era
    try {
        const potentialQuery = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic_id', '==', resolvedTopicId),
            where('difficulty', '==', difficulty),
            limit(5)
        );
        const snapshot = await getDocs(potentialQuery);
        if (!snapshot.empty) {
            // Only return cached questions that have confidence >= 0.70 AND pass fact validation
            const validDocs = snapshot.docs.filter(d => {
                const data = d.data();
                if (!(data.confidence >= 0.70 && data.question && data.correct_answer)) return false;

                // Run fact validator on cached content to catch legacy placeholders
                const factCheck = checkConceptualQuestion(
                    data.subject || subject,
                    data.topic || topic,
                    data.question || '',
                    data.correct_answer || '',
                    data.options || []
                );
                if (!factCheck.valid) {
                    console.warn(`[QuestionEngine] Cache rejected (${factCheck.reason}): "${(data.question || '').slice(0, 50)}..."`);
                    return false;
                }
                return true;
            });
            if (validDocs.length > 0) {
                const randomDoc = validDocs[Math.floor(Math.random() * validDocs.length)];
                console.log(`[QuestionEngine] ⚡ Returning verified DB content for "${topic}".`);
                const existing = randomDoc.data() as StoredQuestion;
                return { id: randomDoc.id, ...existing };
            }
        }
    } catch (e) {
        console.warn("[QuestionEngine] Pre-check failed, proceeding to generation...");
    }

    // Inject topic-specific formula sheet
    const formulaSheet = getFormulaSheet(topic, subject);

    const generationPrompt = `
### PRECISION EXAM QUESTION GENERATOR v3.0
Generate ONE ${exam} MCQ. MATHEMATICAL ACCURACY IS MANDATORY.

TOPIC: ${topic}
SUBJECT: ${subject}
DIFFICULTY: ${difficulty} (Student Ability: ${abilityScore}/10)
${remediationFocus ? `REMEDIATION FOCUS: ${remediationFocus} (Generate a question that specifically targets and tests for this type of student error pattern.)` : ''}

═══ REFERENCE FORMULAS FOR THIS TOPIC ═══
${formulaSheet}

═══ MANDATORY GENERATION PROTOCOL ═══

STEP 1 — CHOOSE A FORMULA from the reference list above. Do NOT invent formulas.
STEP 2 — PICK NUMERICAL VALUES: Use simple integers or common fractions (0.5, 0.25, 0.1).
STEP 3 — SOLVE COMPLETELY in "step_by_step_solution". Show EVERY substitution step.
         Your final step must clearly state the numerical answer.
STEP 4 — SET "final_numerical_value" to the NUMBER from your last solution step.
STEP 5 — CONSTRUCT THE MCQ with 4 options.
         Distractors should represent common errors (wrong formula, arithmetic errors, unit errors).
         "correct_answer" MUST be an EXACT copy of one of the 4 option strings.

⚠️ CRITICAL: "final_numerical_value" MUST MATCH the result from your step_by_step_solution.
If they don't match, YOUR OUTPUT IS INVALID and will be rejected.

═══ OPTION QUALITY RULES (WILL BE AUTO-CHECKED) ═══
- Each option MUST be a complete descriptive phrase of at least 15 characters.
- GOOD options: "The velocity is 20 m/s", "The energy equals 3.4 eV", "The frequency is 5 Hz"
- BAD options (WILL BE REJECTED): "20 m/s", "3.4 eV", "5 Hz", "A", "B"
- The question text MUST be at least 80 characters long with specific context and numerical values.
- NEVER use "Practice Question:", generic templates, or placeholder language.

═══ JSON SAFETY RULES (CRITICAL) ═══
- All string values MUST use straight double quotes, no curly quotes
- Do NOT use fractions like 1/3, 8/3 in string values — use decimals: 0.333, 2.667
- Do NOT use special Unicode characters like √, π in JSON string values — write sqrt(), pi
- Escape any backslashes in LaTeX: use \\frac not \frac
- final_numerical_value MUST be a decimal number, NOT a fraction or expression

═══ OUTPUT FORMAT (JSON ONLY) ═══
{
  "exam": "${exam}",
  "subject": "${subject}",
  "chapter": "Chapter name",
  "topic": "${topic}",
  "type": "MCQ",
  "difficulty": "${difficulty}",
  "formula_used": "The exact formula from the reference list",
  "given_values": {"mass": "10 kg", "velocity": "5 m/s"},
  "step_by_step_solution": [
    "Step 1: Using formula F = ma",
    "Step 2: Substituting: F = 10 * 5 = 50 N",
    "Step 3: Therefore F = 50 N"
  ],
  "final_numerical_value": 50,
  "final_unit": "N",
  "question": "A 10 kg object is accelerated at 5 m/s squared along a frictionless surface. What is the net force acting on the object?",
  "options": ["The net force is 50 N", "The net force is 25 N", "The net force is 100 N", "The net force is 15 N"],
  "correct_answer": "The net force is 50 N",
  "numerical_formula": "10 * 5 = 50",
  "explanation": "Clear 2-3 sentence explanation",
  "concept_tags": ["tag1", "tag2"],
  "error_trap_type": "e.g. unit conversion, sign error",
  "hidden_derivation": "Full derivation scratchpad"
}
`;

    // Retry loop: up to 3 retries if validation rejects
    const MAX_GEN_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_GEN_RETRIES; attempt++) {
        try {
            const response = await withTimeout(
                askAI(
                    `You are a Senior ${subject} Professor with 20 years of JEE/NEET paper-setting experience. You MUST solve every problem completely before stating the answer. Use ONLY standard NCERT-aligned formulas. JSON ONLY.`,
                    generationPrompt, 'auto', [], {
                    jsonMode: true,
                    stream: false,
                    max_tokens: 2500,
                    tier: 'T2', // Complex Generator
                    temperature: 0.6
                }),
                45000 // 45s timeout for generation
            );
            if (!response) continue;

            const rawData = extractJSON(response as string);

            // Ensure required fields have defaults
            if (!rawData.type) rawData.type = 'MCQ';
            if (!rawData.explanation) rawData.explanation = rawData.hidden_derivation || 'Solution available.';
            if (!rawData.concept_tags) rawData.concept_tags = [topic];
            if (!rawData.error_trap_type) rawData.error_trap_type = 'calculation';

            // Code-level correct_answer validation: must exist in options
            if (Array.isArray(rawData.options) && rawData.correct_answer) {
                const exactMatch = rawData.options.includes(rawData.correct_answer);
                if (!exactMatch) {
                    // Try to find a partial match and fix it
                    const partialIdx = rawData.options.findIndex((opt: string) =>
                        opt.includes(rawData.correct_answer) || rawData.correct_answer.includes(opt)
                    );
                    if (partialIdx !== -1) {
                        rawData.correct_answer = rawData.options[partialIdx];
                    } else {
                        console.warn(`[QuestionEngine] correct_answer not in options. Attempt ${attempt + 1}. Retrying...`);
                        continue;
                    }
                }
            }

            // SHA256 Duplication Check
            const hashText = rawData.question + JSON.stringify(rawData.options);
            const hash = await generateHash(hashText);

            const dupQuery = query(collection(db, 'engine_questions'), where('hash', '==', hash));
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
                console.warn("[QuestionEngine] Duplicate hash detected. Retrying...");
                continue;
            }

            const runConsensus = difficulty === 'Hard' || difficulty === 'Medium';
            // ── LAYER 1: LLM Verification ──
            const verification = await verifyQuestionFast(rawData, runConsensus);
            if (!verification.verified || !verification.data) {
                console.warn(`[QuestionEngine] Verifier rejected. Attempt ${attempt + 1}/${MAX_GEN_RETRIES + 1}.`);
                continue;
            }

            const verifiedData = verification.data;
            let confidenceScore = 0.50; // Base score
            if (verification.verified) confidenceScore += 0.15;

            // ── LAYER 2: Derivation-Answer Consistency Check ──
            const derivationText = verifiedData.hidden_derivation || verifiedData.explanation ||
                (verifiedData.step_by_step_solution || []).join(' ') || '';
            const consistency = checkDerivationConsistency(derivationText, verifiedData.correct_answer || '');

            if (!consistency.consistent) {
                if (consistency.correctedAnswer) {
                    // Verify corrected answer exists in options before accepting the fix
                    const optsList = Array.isArray(verifiedData.options) ? verifiedData.options : Object.values(verifiedData.options || {});
                    if (optsList.includes(consistency.correctedAnswer)) {
                        console.warn(`[QuestionEngine] Consistency fix: ${consistency.reason}`);
                        verifiedData.correct_answer = consistency.correctedAnswer;
                        verification.isRefixed = true;
                        confidenceScore += 0.05; // Partial credit for auto-fixed
                    } else {
                        console.warn(`[QuestionEngine] Consistency fix rejected: corrected answer not in options. Retrying.`);
                        continue;
                    }
                } else {
                    console.warn(`[QuestionEngine] Consistency FAIL (unfixable): ${consistency.reason}. Retrying.`);
                    continue;
                }
            } else {
                confidenceScore += 0.15; // Full credit for consistent
            }

            // ── LAYER 2b: Step-solution vs final_numerical_value consistency ──
            if (verifiedData.step_by_step_solution && verifiedData.final_numerical_value !== undefined) {
                const stepCheck = checkStepConsistency(
                    verifiedData.step_by_step_solution,
                    verifiedData.final_numerical_value
                );
                if (!stepCheck.consistent) {
                    console.warn(`[QuestionEngine] Step consistency FAIL: ${stepCheck.reason}. Retrying.`);
                    continue;
                }
            }

            // ── LAYER 3: Unit Validation ──
            const unitCheck = validateUnits(
                verifiedData.topic || topic,
                verifiedData.correct_answer || '',
                verifiedData.question || ''
            );
            if (!unitCheck.valid) {
                console.warn(`[QuestionEngine] Unit validation FAIL: ${unitCheck.reason}. Retrying.`);
                continue;
            }
            if (unitCheck.valid) confidenceScore += 0.05;

            // ── LAYER 4: Conceptual/Fact Validation ──
            const isNumerical = isNumericalQuestion(
                verifiedData.question || '',
                verifiedData.subject || subject,
                Array.isArray(verifiedData.options) ? verifiedData.options : Object.values(verifiedData.options || {})
            );
            if (!isNumerical) {
                const factCheck = checkConceptualQuestion(
                    verifiedData.subject || subject,
                    verifiedData.topic || topic,
                    verifiedData.question || '',
                    verifiedData.correct_answer || '',
                    verifiedData.options || []
                );
                if (!factCheck.valid) {
                    console.warn(`[QuestionEngine] Fact/concept validation FAIL: ${factCheck.reason}. Retrying.`);
                    continue;
                }
            }

            // ── LAYER 5: Verifier answer match bonus ──
            if (verification.verifierMatches) confidenceScore += 0.10;
            if (!verification.isRefixed) confidenceScore += 0.05;

            // Store verification details
            verifiedData.verification_details = {
                verifier_answer: verification.verifierAnswer || '',
                verifier_matches: verification.verifierMatches ?? true,
                consistency_check_passed: consistency.consistent,
                unit_check_passed: unitCheck.valid
            };

            // Storage Optimization & Save
            enforceStorageLimit(verifiedData.topic || topic, exam);

            const finalQuestion: Omit<StoredQuestion, 'id'> = {
                ...verifiedData as StoredQuestion,
                hash,
                usage_count: 0,
                accuracy_rate: 0, // Will be updated from real student data
                created_at: new Date().toISOString(),
                confidence: Math.min(confidenceScore, 0.95) // Capped — only human review gets 1.0
            };

            // Save to DB (Background)
            if (db) {
                try {
                    addDoc(collection(db, 'engine_questions'), finalQuestion).catch(e => {
                        // Silently catch permission errors in audit/node mode
                        if (!e.message.includes('PERMISSION_DENIED')) {
                            console.error("[QuestionEngine] Background DB save failed:", e.message);
                        }
                    });
                } catch (err) {
                    // Ignore initialization errors in Node environment
                }
            }

            console.log(`[QuestionEngine] ✅ Generated & verified (confidence: ${finalQuestion.confidence.toFixed(2)}) for "${topic}"`);
            return { id: 'live-' + Date.now(), ...finalQuestion };

        } catch (e) {
            console.error(`Question generation attempt ${attempt + 1} failed`, e);
        }
    }

    console.error(`[QuestionEngine] All ${MAX_GEN_RETRIES + 1} generation attempts failed for ${topic}.`);
    return null;
};

export const invalidateTopicCache = (userId: string, exam: string, topic: string) => {
    try {
        if (typeof localStorage === 'undefined') return;
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
        if (typeof localStorage === 'undefined') return null;
        const cached = localStorage.getItem(`q_engine_cache_${key}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) { // 4h TTL (reduced from 12h for safety)
                return parsed.questions;
            }
        }
    } catch (e) { console.warn("Cache read failed", e); }
    return null;
};

const setCache = (key: string, questions: StoredQuestion[]) => {
    try {
        if (typeof localStorage === 'undefined') return;
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
    weaknessScore: number = 0,
    topic_id?: string,
    subject?: string,
    abilityScore?: number,
    remediationFocus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD'
): Promise<StoredQuestion | null> => {

    const resolvedTopicId = topic_id || resolveTopicId(topic);

    let targetDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (abilityScore !== undefined) {
        targetDifficulty = EloService.getTargetDifficulty(abilityScore);
    } else {
        if (weaknessScore > 0.7) targetDifficulty = 'Easy';
        else if (weaknessScore < 0.4) targetDifficulty = 'Hard';
    }

    const cacheKey = `${userId}_${exam}_${resolvedTopicId}_${targetDifficulty}`;

    // 1. Check Persistent Cache First (0 Cost)
    const cachedQuestions = getCache(cacheKey);
    if (cachedQuestions && cachedQuestions.length > 0) {
        console.log(`[QuestionEngine] ⚡ Persistent Cache Hit for ${topic}`);
        const randomIndex = Math.floor(Math.random() * cachedQuestions.length);
        return cachedQuestions[randomIndex];
    }

    // 1.5. Offline fallback
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log(`[QuestionEngine] 📶 Offline Mode Detected. Using IndexedDB Cache.`);
        const offlineQ = await offlineSyncService.getOfflineQuestions(topic, 1);
        if (offlineQ && offlineQ.length > 0) {
            return offlineQ[0];
        }
        // If not found in offline DB for this topic, try ANY topic just to keep game going?
        const anyOffline = await offlineSyncService.getOfflineQuestions(undefined, 1);
        if (anyOffline && anyOffline.length > 0) return anyOffline[0];
        throw new Error("No offline questions available.");
    }

    try {
        // 2. Try to find in DB (Specific Topic)
        let q = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic_id', '==', resolvedTopicId),
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
            // Filter for post-audit quality: only serve questions with confidence >= 0.70
            const allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredQuestion));
            const fetchedQuestions = allDocs.filter(q =>
                (q.confidence === undefined || q.confidence >= 0.70) && q.question && q.correct_answer
            );

            if (fetchedQuestions.length > 0) {
                // Populate Cache
                setCache(cacheKey, fetchedQuestions);

                const selectedQuestion = fetchedQuestions[Math.floor(Math.random() * fetchedQuestions.length)];

                // Update usage count asynchronously
                updateDoc(doc(db, 'engine_questions', selectedQuestion.id!), { usage_count: increment(1) });

                return selectedQuestion;
            }
        }

        // 3. If not found, Generate Live (Cache Miss)
        console.log(`[QuestionEngine] 🧩 Firestore Miss for ${topic} (${targetDifficulty}). Generating...`);

        // Ensure we have a valid subject
        let finalSubject = subject || 'General';
        if (!subject) {
            const subjectSnap = await getDocs(query(collection(db, 'user_topic_stats'), where('user_id', '==', userId), where('topic', '==', topic), limit(1)));
            finalSubject = !subjectSnap.empty ? subjectSnap.docs[0].data().subject : 'General';
        }

        const generated = await generateInspiredQuestion({
            exam,
            subject: finalSubject,
            topic,
            difficulty: targetDifficulty,
            abilityScore,
            remediationFocus
        });

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
 * Adaptive Batch Retrieval Logic.
 * Optimized for full Mock Exams and Quick Tests.
 * Pulls from: Cache -> Offline -> Global DB -> AI (Final Delta)
 */
export const getAdaptiveQuestionBatch = async (
    userId: string,
    needs: Array<{ subject: string; topic: string; count: number; difficulty?: 'Easy' | 'Medium' | 'Hard'; remediationFocus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' }>,
    exam: string,
    abilityScore?: number,
    onProgress?: (progress: number) => void
): Promise<StoredQuestion[]> => {
    const allQuestions: StoredQuestion[] = [];
    const totalCount = needs.reduce((sum, n) => sum + n.count, 0);
    let completedCount = 0;

    const updateBatchProgress = () => {
        completedCount++;
        if (onProgress) {
            onProgress(Math.min(Math.round((completedCount / totalCount) * 100), 100));
        }
    };

    // Parallel processing per requirement group
    const results = await Promise.all(needs.map(async (group) => {
        const groupQuestions: StoredQuestion[] = [];
        const { subject, topic, count, difficulty } = group;
        const resolvedTopicId = resolveTopicId(topic);

        // 1. Try to fill from Global DB first (Fastest/Cheapest)
        try {
            const dbQuery = query(
                collection(db, 'engine_questions'),
                where('exam', '==', exam),
                where('topic_id', '==', resolvedTopicId),
                where('difficulty', '==', difficulty || 'Medium'),
                where('confidence', '>=', 0.80), // High quality only for batch
                limit(count * 2)
            );
            const snap = await getDocs(dbQuery);
            if (!snap.empty) {
                const dbQs = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoredQuestion));
                // Shuffle and pick
                for (let i = dbQs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [dbQs[i], dbQs[j]] = [dbQs[j], dbQs[i]];
                }
                const selected = dbQs.slice(0, count);
                groupQuestions.push(...selected);
                
                // Update usage counts in background
                selected.forEach(q => {
                    updateDoc(doc(db, 'engine_questions', q.id!), { usage_count: increment(1) }).catch(() => {});
                });

                // Update progress for every question found in DB
                for (let i = 0; i < selected.length; i++) updateBatchProgress();
                
                console.log(`[QuestionEngine] ⚡ Batch DB Hit: Found ${selected.length}/${count} for ${topic}`);
            }
        } catch (err) {
            console.warn(`[QuestionEngine] Batch DB check failed for ${topic}:`, err);
        }

        // 2. Generate Delta if count not met
        const remaining = count - groupQuestions.length;
        if (remaining > 0) {
            console.log(`[QuestionEngine] 🧩 Batch Delta: Generating ${remaining} for ${topic}`);
            
            // Generate delta sequentially or in small chunks to avoid overwhelm
            for (let i = 0; i < remaining; i++) {
                const q = await getAdaptiveQuestion(
                    userId,
                    topic,
                    exam,
                    0.5, // Default weakness for batch
                    topic_id || undefined,
                    subject,
                    abilityScore,
                    group.remediationFocus
                );
                if (q) groupQuestions.push(q);
                updateBatchProgress();
            }
        }

        return groupQuestions;
    }));

    results.forEach(res => allQuestions.push(...res));
    return allQuestions;
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
