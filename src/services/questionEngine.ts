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
    difficulty_score: number; // continuous rating (0-3000)
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

const ANCHOR_QUESTIONS_MIN_CONFIDENCE = 0.85;

const CONTROLLED_MISCONCEPTION_ONTOLOGY = {
    mechanics: ["force.pseudo_force_misuse", "energy.non_conservative_omission", "statics.torque_balance_error"],
    electronics: ["circuits.kvl_sign_error", "semiconductors.carrier_confusion"],
    math: ["calculus.chain_rule_omission", "algebra.sign_flip"],
    general: ["unit_conversion", "calculation_slip", "misreading_constraint"]
};

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
        questionText.length < 30 ||
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
    if (avgOptLen < 1) {
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

═══ MATH FORMATTING (CRITICAL — USE UNICODE, NOT LATEX) ═══
If you output "fixed_data", you MUST use plain text with Unicode characters for all math.
- Superscripts/Subscripts: x², a₀
- Greek letters: α, β, γ, Δ, Ω, etc.
- Math operators: ×, ÷, ±, √, ∞, ≈, ≤
- NEVER USE LaTeX syntax (e.g., $...$, \\frac, \\alpha).

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
                withTimeout(primaryPromise, 45000),
                withTimeout(secondaryPromise, 45000)
            ]);
            if (!res1 || !res2) return { verified: false };
            results = [extractJSON(res1 as string), extractJSON(res2 as string)];
        } else {
            const response = await withTimeout(primaryPromise, 45000);
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
                if (diff > 0.05) {
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
                if (diff > 0.05) {
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
            console.error(`[QuestionEngine] Verification timed out (45s).`);
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

    // Determine structural constraints based on continuous ability
    const abilityLevel = abilityScore || 1000;
    let conceptCount = 1;
    let trapStrategy = "Basic substitution error";
    let stepDepth = 2;

    if (abilityLevel > 1800) {
        conceptCount = 3;
        trapStrategy = "Conceptual misconception + multi-variable linked shift (distractor must look like a common sign error)";
        stepDepth = 5;
    } else if (abilityLevel > 1200) {
        conceptCount = 2;
        trapStrategy = "Standard calculation trap + unit conversion + inverse reasoning";
        stepDepth = 3;
    }

    const PHRASING_STYLES = [
        "Scenario-based (real-world application)",
        "Graphical reasoning (infer from data/graph description)",
        "Abstract logic (theoretical proof-like)",
        "Numerical stress (heavy but elegant arithmetic)",
        "Diagram-linked (requires visualizing a complex system)"
    ];
    const styleEntropy = PHRASING_STYLES[Math.floor(Math.random() * PHRASING_STYLES.length)];

    // Inject topic-specific formula sheet
    const formulaSheet = getFormulaSheet(topic, subject);

    const generationPrompt = `
You are a Senior Professor at a top technical institute (IIT/AIIMS).
Target Exam: ${exam}
Subject: ${subject}
Topic: ${topic}
Target Difficulty Rating: ${abilityLevel} (Continuous Scale 0-3000)

ANCHOR STRATIFICATION:
If this is a known benchmark question, tag it with:
"anchor_difficulty_tier": "LOW" | "MED" | "HIGH"
"anchor_style": "PYQ" | "ACADEMIC_STANDARD"

ONTOLOGY ENFORCEMENT:
You MUST categorize the error trap using this taxonomy if applicable:
${JSON.stringify(CONTROLLED_MISCONCEPTION_ONTOLOGY, null, 2)}
If no match, use "general.miscellaneous".

PEDAGOGICAL REQUIREMENTS:
- CONCEPT COUNT: Exactly ${conceptCount} linked conceptual steps.
- TRAP STRATEGY: ${trapStrategy}.
- STEP DEPTH: ${stepDepth} logical transitions to solve.
- PHRASING STYLE: ${styleEntropy}.
- READING COMPLEXITY: Maintain a readability score suitable for high school students (avoid jargon-heavy sentences).
- AVOID: Avoid unnecessarily long algebra. Focus on CONCEPTUAL depth.
- MATH: Use Unicode for math symbols. (e.g. α, β, Δ, ², √). NO LATEX.

MISSION: Generate a question that bridges the student's current knowledge to the next level.
${remediationFocus ? `SPECIAL FOCUS: The student previously struggled with ${remediationFocus}. Address this specific error type in the traps.` : ""}

REFERENCE FORMULAS:
${formulaSheet}

RETURN JSON:
{
  "exam": "${exam}",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty_score": ${abilityLevel},
  "type": "MCQ",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "...",
  "explanation": "...",
  "rich_explanation": {
    "steps": ["Step 1...", "Step 2..."],
    "why_others_wrong": {
        "Distractor 1": "Explain the specific misconception that leads here (e.g. forgot to square)",
        "Distractor 2": "Explain specific error",
        "Distractor 3": "Explain specific error"
    }
  },
  "error_trap_type": "HIERARCHICAL_LABEL (e.g. mechanics.force.pseudo_force_misuse | sign_error | unit_conversion)",
  "difficulty_score": ${abilityLevel},
  "concept_tags": ["visualization", "abstraction", "precision", "stamina"]
}
`;

    // Retry loop: up to 3 retries if validation rejects
    const MAX_GEN_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_GEN_RETRIES; attempt++) {
        try {
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(subject) || ['foundation', 'school exams'].includes(exam.toLowerCase());
            const persona = isJunior 
                ? `Senior Secondary School Teacher with expertise in NCERT and Olympiads. You specialize in making complex concepts simple for middle and high school students.`
                : `Senior ${subject} Professor with 20 years of JEE/NEET paper-setting experience. You specialize in high-level competitive exam questions.`;

            const response = await withTimeout(
                askAI(
                    `${persona} You MUST solve every problem completely before stating the answer. JSON ONLY.`,
                    generationPrompt + `\nSTUDENT GRADE: ${params.exam.includes('Class') ? params.exam : 'Class 10 (High School)'}`, 
                    'auto', [], {
                    jsonMode: false,
                    stream: false,
                    max_tokens: 2500,
                    tier: 'T2', // Complex Generator
                    temperature: 0.6,
                    skipMemory: true // Save API quota during generation
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

            const runConsensus = true;
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
                difficulty_score: abilityLevel,
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
    topic_id?: string,
    subject?: string,
    abilityScore?: number,
    remediationFocus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD'
): Promise<StoredQuestion | null> => {

    const resolvedTopicId = topic_id || resolveTopicId(topic);
    const targetRating = abilityScore || 1000;
    const cacheKey = `${userId}_${exam}_${resolvedTopicId}_${targetRating}`;

    // 1. Check Persistent Cache First (0 Cost)
    const cachedQuestions = getCache(cacheKey);
    if (cachedQuestions && cachedQuestions.length > 0) {
        console.log(`[QuestionEngine] ⚡ Persistent Cache Hit for ${topic}`);
        const randomIndex = Math.floor(Math.random() * cachedQuestions.length);
        return cachedQuestions[randomIndex];
    }

    // 1.5. Offline fallback
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineQ = await offlineSyncService.getOfflineQuestions(topic, 1);
        if (offlineQ && offlineQ.length > 0) return offlineQ[0];
        const anyOffline = await offlineSyncService.getOfflineQuestions(undefined, 1);
        if (anyOffline && anyOffline.length > 0) return anyOffline[0];
        throw new Error("No offline questions available.");
    }

    try {
        // 2. Try Firestore (Cloud DB)
        const dbQuery = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic_id', '==', resolvedTopicId),
            where('difficulty_score', '>=', targetRating - 100),
            where('difficulty_score', '<=', targetRating + 100),
            limit(10)
        );
        const snap = await getDocs(dbQuery);
        if (!snap.empty) {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoredQuestion));
            const selectedQuestion = all[Math.floor(Math.random() * all.length)];
            if (selectedQuestion.confidence >= 0.8 || !selectedQuestion.confidence) {
                console.log(`[QuestionEngine] ☁️ Firestore Hit for ${topic} (Rating: ${selectedQuestion.difficulty_score})`);
                updateDoc(doc(db, 'engine_questions', selectedQuestion.id!), { usage_count: increment(1) });
                setCache(cacheKey, [selectedQuestion]);
                return selectedQuestion;
            }
        }

        // 3. If not found, Generate Live (Cache Miss)
        console.log(`[QuestionEngine] 🧩 Firestore Miss for ${topic} (Rating: ${targetRating}). Generating...`);

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
            difficulty: 'Medium',
            abilityScore: targetRating,
            remediationFocus
        });

        // Optionally put the generated one into cache too (or let it be found on next DB hit)
        if (generated) setCache(cacheKey, [generated]);
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

    // Sequential processing per requirement group to prevent API thundering herd
    for (const group of needs) {
        const groupQuestions: StoredQuestion[] = [];
        const { subject, topic, count } = group;
        const resolvedTopicId = resolveTopicId(topic);

        // 1. Determine Distribution (70/20/10 Banding)
        const comfortCount = Math.floor(count * 0.7);
        const challengeCount = Math.floor(count * 0.2);
        const stretchCount = count - comfortCount - challengeCount;

        const abilityLevel = abilityScore || 1000;
        const targets = [
            { rating: abilityLevel - 150, count: comfortCount, label: 'Comfort' },
            { rating: abilityLevel, count: challengeCount, label: 'Challenge' },
            { rating: abilityLevel + 250, count: stretchCount, label: 'Stretch' }
        ];

        // 1.1 Mandatory Exploration Injection (15% "Chaos Factor")
        // Occasionally violates adaptation to probe student limits and break cognitive prisons.
        // EMOTIONAL CONDITIONING: Suppress chaos if abilityScore is critically low or if topic is "Mixed"
        const explorationChance = 0.15;
        const isFrustrated = abilityLevel < 600; // Heuristic: very low scores suggest frustration/remediation needs
        
        if (Math.random() < explorationChance && !isFrustrated) {
            console.log(`[QuestionEngine] 🎲 Exploration Injection triggered for topic: ${topic}`);
            targets.push({ rating: abilityLevel + 600, count: 1, label: 'Super-Stretch (Exploration)' });
            targets[0].count = Math.max(0, targets[0].count - 1);
        }

        for (const target of targets) {
            if (target.count <= 0) continue;

            // Try to fill from DB first
            try {
                const dbQuery = query(
                    collection(db, 'engine_questions'),
                    where('exam', '==', exam),
                    where('topic_id', '==', resolvedTopicId),
                    where('difficulty_score', '>=', target.rating - 150),
                    where('difficulty_score', '<=', target.rating + 150),
                    limit(target.count * 2)
                );
                const snap = await getDocs(dbQuery);
                if (!snap.empty) {
                    const dbQs = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoredQuestion));
                    const selected = dbQs.sort(() => Math.random() - 0.5).slice(0, target.count);
                    groupQuestions.push(...selected);
                    for (let i = 0; i < selected.length; i++) updateBatchProgress();
                }
            } catch (err) { console.warn("DB Batch error", err); }

            // Generate Delta for this band
            const bandCount = groupQuestions.filter(q => 
                Math.abs((q.difficulty_score || 0) - target.rating) <= 150
            ).length;
            const bandRemaining = target.count - bandCount;

            if (bandRemaining > 0) {
                for (let i = 0; i < bandRemaining; i++) {
                    const q = await generateInspiredQuestion({
                        exam,
                        subject: subject || 'General',
                        topic,
                        difficulty: 'Medium', // legacy label
                        abilityScore: target.rating,
                        remediationFocus: group.remediationFocus
                    });
                    if (q) groupQuestions.push(q);
                    updateBatchProgress();
                }
            }
        }
        allQuestions.push(...groupQuestions);
    }

    return allQuestions;
};

/**
 * Standard Mapping: Converts StoredQuestion (DB/AI) to UI-ready Question format.
 * Matches the logic used in the Test Center.
 */
export const mapStoredToUIQuestion = (raw: any[], startId: number = 1) => {
    return raw.map((q, idx) => {
        const optionsArray: string[] = Array.isArray(q.options)
            ? q.options
            : Object.values(q.options || {});
        
        let correctAnswerIndex = 0;
        if (typeof q.correct_answer === 'string') {
            if (q.correct_answer.length === 1 && /[A-D]/.test(q.correct_answer)) {
                correctAnswerIndex = q.correct_answer.charCodeAt(0) - 65;
            } else {
                const foundIndex = optionsArray.indexOf(q.correct_answer);
                if (foundIndex !== -1) correctAnswerIndex = foundIndex;
            }
        }

        return {
            id: startId + idx,
            text: q.question,
            options: optionsArray,
            correctAnswer: correctAnswerIndex,
            explanation: q.explanation || q.hidden_derivation || '',
            topic: q.topic,
            subject: q.subject,
            difficulty_score: q.difficulty_score || 1000
        };
    });
};

/**
 * Generates a standard batch of questions for a specific exam/class/subject combination.
 * Follows the "Quick Test" distribution rules from the Test Center.
 */
export const generateStandardBatch = async (
    targetExam: string,
    userClass: string,
    subject?: string,
    count: number = 5,
    abilityScore?: number
) => {
    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);
    const isNeet = targetExam.toUpperCase().includes('NEET');

    let needs: Array<{ subject: string; topic: string; count: number }> = [];

    if (subject && subject !== 'Mixed Topics') {
        // Topic specific or Subject specific
        needs = [{ subject, topic: subject, count }];
    } else if (isJunior) {
        needs = [{ subject: 'General', topic: 'Mathematics and Science', count }];
    } else if (isNeet) {
        // Balanced distribution
        needs = [
            { subject: 'Biology', topic: 'Biology', count: Math.ceil(count * 0.4) },
            { subject: 'Physics', topic: 'Physics', count: Math.floor(count * 0.3) },
            { subject: 'Chemistry', topic: 'Chemistry', count: Math.floor(count * 0.3) }
        ];
    } else {
        needs = [
            { subject: 'Mathematics', topic: 'Mathematics', count: Math.ceil(count * 0.4) },
            { subject: 'Physics', topic: 'Physics', count: Math.floor(count * 0.3) },
            { subject: 'Chemistry', topic: 'Chemistry', count: Math.floor(count * 0.3) }
        ];
    }

    // Adjust total count if needed
    const currentTotal = needs.reduce((s, n) => s + n.count, 0);
    if (currentTotal > count) needs[0].count -= (currentTotal - count);
    if (currentTotal < count) needs[0].count += (count - currentTotal);

    const questions = await getAdaptiveQuestionBatch(needs, targetExam, abilityScore);
    return mapStoredToUIQuestion(questions);
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
