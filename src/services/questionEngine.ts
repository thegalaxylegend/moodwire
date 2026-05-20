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
import { SYLLABUS_DB } from '../lib/constants';
import { checkDerivationConsistency, checkStepConsistency, checkOptionCollision } from '../lib/consistencyCheck';
import { validateUnits } from '../lib/unitValidator';
import { checkConceptualQuestion, isNumericalQuestion } from '../lib/factValidator';
import { runDomainSpecificValidation } from '../lib/domainValidators';

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
    subtopic?: string;
    difficulty_band?: string;
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
    created_at: string;
    confidence: number;
}



// Helper to generate SHA256 hash
const generateHash = async (text: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

let _generatingCount = 0;

const markGeneratingStart = () => {
    _generatingCount++;
    if (typeof window !== 'undefined') (window as any).__examCompassGenerating = true;
};

const markGeneratingEnd = () => {
    _generatingCount = Math.max(0, _generatingCount - 1);
    if (_generatingCount === 0 && typeof window !== 'undefined') {
        (window as any).__examCompassGenerating = false;
    }
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
                /^[A-D][.:)\s]*$/i.test(trimmed) ||
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
    // Key change: answer is shown in STEP 2, AFTER the sol
    const verificationPrompt = `
### STRICT INDEPENDENT ACCURACY AUDITOR

You are verifying a ${currentData.exam || 'JEE/NEET'} MCQ. 
You MUST independently solve the problem BEFORE looking at the stated answer.

═══ STEP 0: VARIABLE INVENTORY & SOLVABILITY ═══
QUESTION: "${currentData.question}"
OPTIONS: ${JSON.stringify(currentData.options)}

1. Extract all numerical values, parameters, and constraints.
2. Ensure no required parameter or assumption is missing. If missing -> REJECT.
3. Verify the system of equations is exactly solvable and dimensionally consistent.

═══ STEP 1: SOLVE INDEPENDENTLY ═══
Write your complete mathematical derivation step-by-step in "my_solution".
Calculate the final numerical answer.

═══ STEP 2: COMPARE & VERIFY ═══
STATED ANSWER: "${currentData.correct_answer}"
STATED FORMULA: "${currentData.numerical_formula || 'None'}"

RULES FOR REJECTION:
- Your independent answer differs from stated answer by >1%.
- Stated formula is incorrect for the context.
- Stated answer is NOT verbatim in the options list.
- Question contains placeholder text (e.g. "Option A").
- Options are identical or do not reflect real student misconceptions.

═══ MATH FORMATTING (UNICODE ONLY) ═══
Use Unicode for all math (e.g. x², α, ×, √). NEVER USE LaTeX (e.g. $...$, \\frac).

═══ OUTPUT FORMAT (RAW JSON ONLY, NO MARKDOWN BLOCKS) ═══
{
  "status": "APPROVED | REJECT",
  "my_solution": "Complete step-by-step work",
  "my_answer": "Your derived answer",
  "my_answer_numerical": 0.0,
  "stated_answer_numerical": 0.0,
  "answers_match": true,
  "logic": "Detailed explanation for decision"
}
`;

    try {
        const primaryPromise = askAI("Senior Physics, Chemistry & Mathematics Professor. Strict accuracy auditor. JSON ONLY.", verificationPrompt, 'gemini', [], {
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

        // ── NEW: Numerical answer comparison (strict 1% anti-anchoring invariant layer) ──
        let verifierMatches = true;
        if (result.my_answer_numerical !== undefined && result.stated_answer_numerical !== undefined) {
            const myNum = Number(result.my_answer_numerical);
            const statedNum = Number(result.stated_answer_numerical);
            if (!isNaN(myNum) && !isNaN(statedNum) && (Math.abs(myNum) > 0.001 || Math.abs(statedNum) > 0.001)) {
                const ref = Math.max(Math.abs(myNum), Math.abs(statedNum));
                const diff = Math.abs(myNum - statedNum) / ref;
                if (diff > 0.01) { // Tightened from 0.05 to 0.01 (1% strict invariant)
                    verifierMatches = false;
                    if (result.status === 'APPROVED') {
                        console.warn(`[QuestionEngine] Override: Verifier said APPROVED but answers differ by ${(diff * 100).toFixed(1)}% (verifier: ${myNum}, stated: ${statedNum}). REJECTING.`);
                        return { verified: false };
                    }
                }
            }
        }
        
        // ── CONSENSUS Numerical Check (strict 1%) ──
        if (runConsensus && consensusResult && result.my_answer_numerical !== undefined && consensusResult.my_answer_numerical !== undefined) {
            const num1 = Number(result.my_answer_numerical);
            const num2 = Number(consensusResult.my_answer_numerical);
            if (!isNaN(num1) && !isNaN(num2) && (Math.abs(num1) > 0.001 || Math.abs(num2) > 0.001)) {
                const ref = Math.max(Math.abs(num1), Math.abs(num2));
                const diff = Math.abs(num1 - num2) / ref;
                if (diff > 0.01) { // Tightened from 0.05 to 0.01
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

        // Eliminate Option-First Thinking: No REFIXED handling

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
                orderBy('usage_count', 'asc'),
                limit(60)
            );
            const countSnap = await getDocs(q);
            if (countSnap.size >= 50) {
                const toDelete = countSnap.size - 49;
                for (let i = 0; i < toDelete; i++) {
                    if (countSnap.docs[i]) {
                        await deleteDoc(countSnap.docs[i].ref);
                    }
                }
            }
        } catch (e) {
            console.error("Storage limit enforcement failed", e);
        }
    })();
};

const getDifficultyBand = (score: number) => {
    if (score < 200) return `BAND 1 — Score 0 to 200 — "First Contact"
Cognitive demand : Pure recall.
Question form    : "What is...", "Which of the following..."
Numbers          : Trivial or none.`;
    if (score < 400) return `BAND 2 — Score 200 to 400 — "Direct Substitution"
Cognitive demand : Single formula, plug in numbers, read the answer.
Numbers          : Clean integers or simple decimals. No unit conversion required.`;
    if (score < 600) return `BAND 3 — Score 400 to 600 — "One Twist"
Cognitive demand : Single formula but student must rearrange it to isolate the unknown.
Numbers          : May include one simple fraction or square root.`;
    if (score < 800) return `BAND 4 — Score 600 to 800 — "Unit Awareness"
Cognitive demand : Single formula with a mandatory unit conversion before substitution.
Numbers          : Include one conversion (km/h to m/s, g to kg, etc).`;
    if (score < 1000) return `BAND 5 — Score 800 to 1000 — "Two-Step Chain"
Cognitive demand : Two formulas applied in sequence. Output of step 1 is input to step 2.`;
    if (score < 1200) return `BAND 6 — Score 1000 to 1200 — "Conditional Reasoning"
Cognitive demand : Student must apply a condition or constraint before choosing which formula to use.`;
    if (score < 1500) return `BAND 7 — Score 1200 to 1500 — "Inverse and Indirect"
Cognitive demand : Student cannot directly compute the answer. Must work backwards or use an indirect relationship.`;
    if (score < 1800) return `BAND 8 — Score 1500 to 1800 — "Multi-Concept Bridge"
Cognitive demand : Two distinct concepts from the same subject must be linked.`;
    if (score < 2100) return `BAND 9 — Score 1800 to 2100 — "Misconception Trap"
Cognitive demand : The question is designed so that the most intuitive approach gives a wrong answer. Student must override instinct.`;
    if (score < 2400) return `BAND 10 — Score 2100 to 2400 — "Three-Concept Synthesis"
Cognitive demand : Three distinct concepts must be synthesized in a specific order.`;
    if (score < 2700) return `BAND 11 — Score 2400 to 2700 — "Non-Obvious Application"
Cognitive demand : Requires applying a formula to a context where students do not expect it.`;
    return `BAND 12 — Score 2700 to 3000 — "Expert Synthesis"
Cognitive demand : Olympiad or advanced JEE Advanced level. Requires deriving an intermediate result not given in standard formulae.`;
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
    const { exam, subject, topic, topic_id, difficulty, abilityScore = 1000, remediationFocus } = params;
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
    const abilityLevel = Math.max(0, abilityScore ?? 1000);
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

    const generationPrompt = `You are an expert JEE/NEET question generator operating in strict JSON-only mode.

ABSOLUTE OUTPUT RULE: Your entire response MUST be a single valid JSON object. No markdown. No code blocks. No backticks. No preamble. No explanation. If your response starts with anything other than '{', it is wrong.

═══════════════════════════════════════════════════════
TASK: Generate one high-quality MCQ question
═══════════════════════════════════════════════════════

EXAM:       ${exam}
SUBJECT:    ${subject}
TOPIC:      ${topic}
DIFFICULTY: ${abilityLevel} out of 3000
STYLE:      ${styleEntropy}
CONSTRAINTS:
- Concept count: must bridge ${conceptCount} distinct concepts.
- Step depth: must require a chain of ${stepDepth} derivation/calculation steps.
- Trap strategy: target ${trapStrategy}.
${remediationFocus ? `SPECIAL FOCUS: The student previously struggled with ${remediationFocus}. Address this specific error type in the traps.` : ""}

═══════════════════════════════════════════════════════
DIFFICULTY TARGET (STRICT)
═══════════════════════════════════════════════════════

${getDifficultyBand(abilityLevel)}

═══════════════════════════════════════════════════════
STEP 1 — DERIVE FIRST (mandatory internal reasoning)
═══════════════════════════════════════════════════════

Before writing the question, work through it yourself:
1. Identify the exact concept being tested at difficulty ${abilityLevel}.
2. Choose specific numerical values (not variables like "let x =").
3. Solve completely using the correct formula sequence for your band.
4. Confirm dimensional consistency of your answer.
5. Design wrong options: each must represent the exact mistake described in your band's "Distractors" field.
6. Verify: correct_answer appears verbatim in options. If not, fix before outputting.

All of this goes into "hidden_derivation". It must contain actual numbers, not descriptions.

═══════════════════════════════════════════════════════
STEP 2 — SELF-CHECK BEFORE OUTPUT
═══════════════════════════════════════════════════════

[ ] correct_answer matches one option exactly, character for character
[ ] exactly ONE option satisfies all mathematical and physical constraints
[ ] options array has exactly 4 elements
[ ] no two options are identical
[ ] every option is a complete meaningful phrase (not a letter, not a single word)
[ ] average option length is at least 8 characters
[ ] question text is longer than 50 characters
[ ] hidden_derivation contains actual arithmetic with numbers
[ ] no option contains the words "Option A", "Option B", "Placeholder", "Answer"
[ ] question is fully self-contained (no missing variables, no implied parameters, no diagram required)
[ ] every variable or parameter required for calculation (e.g. mass, length, angle, rate, constant) is explicitly stated with a numerical value in the question text
[ ] difficulty fingerprint matches the band described above for ${abilityLevel}

If any check fails, regenerate entirely before outputting.

═══════════════════════════════════════════════════════
MATH FORMATTING — USE UNICODE ONLY
═══════════════════════════════════════════════════════

CORRECT  →  WRONG
F = mv²/r   →  $F = \\frac{mv^2}{r}$
α = 0.5     →  \\alpha = 0.5
10⁻³        →  10^{-3}
H₂O         →  H_2O
√2          →  \\sqrt{2}
μ₀          →  \\mu_0
ε₀          →  \\epsilon_0
θ           →  \\theta
Δv          →  \\Delta v
×           →  \\times or *

═══════════════════════════════════════════════════════
REFERENCE FORMULAS FOR THIS TOPIC:
═══════════════════════════════════════════════════════

${formulaSheet}

═══════════════════════════════════════════════════════
MISCONCEPTION TAXONOMY — pick the single closest label:
═══════════════════════════════════════════════════════

mechanics.force.pseudo_force_misuse
mechanics.force.direction_error
mechanics.energy.non_conservative_omission
mechanics.energy.work_sign_error
mechanics.statics.torque_balance_error
mechanics.kinematics.relative_motion_ignored
mechanics.kinematics.vector_scalar_confusion
mechanics.momentum.frame_not_identified
electronics.circuits.kvl_sign_error
electronics.circuits.series_parallel_confusion
electronics.semiconductors.carrier_confusion
math.calculus.chain_rule_omission
math.calculus.limits_misapplied
math.algebra.sign_flip
math.algebra.wrong_root_selected
math.geometry.angle_convention_error
chemistry.equilibrium.le_chatelier_direction_error
chemistry.stoichiometry.mole_ratio_error
chemistry.bonding.hybridization_confusion
general.unit_conversion
general.calculation_slip
general.misreading_constraint
general.over_generalizing_special_case
general.miscellaneous

═══════════════════════════════════════════════════════
OUTPUT FORMAT — output this exact structure:
═══════════════════════════════════════════════════════

{
  "exam": "${exam}",
  "subject": "${subject}",
  "topic": "${topic}",
  "type": "MCQ",
  "difficulty_score": ${abilityLevel},
  "difficulty_band": "State which band name applies, e.g. BAND 5 — Two-Step Chain",
  "hidden_derivation": "Your complete working with actual numbers. Must show every arithmetic step. Example: Given m = 2 kg, v = 6 m/s. KE = ½ × 2 × 36 = 36 J. Distractor 1 logic: forgot ½ → 2 × 36 = 72 J. Distractor 2 logic: used v not v² → ½ × 2 × 6 = 6 J. Distractor 3 logic: used wrong formula PE = mgh with h = v → 2 × 10 × 6 = 120 J.",
  "question": "Full question text. Must be completely self-contained. All required data must be stated here.",
  "options": [
    "Complete first option with value and unit where applicable",
    "Complete second option with value and unit where applicable",
    "Complete third option with value and unit where applicable",
    "Complete fourth option with value and unit where applicable"
  ],
  "correct_answer": "Must match one of the four options above exactly, character for character",
  "explanation": "Why the correct answer is right. State the formula, the substitution, and the result.",
  "rich_explanation": {
    "steps": [
      "Step 1: Identify the relevant formula for this band.",
      "Step 2: List all given quantities with units.",
      "Step 3: Apply any required conversions or conditions.",
      "Step 4: Substitute and compute.",
      "Step 5: State final answer with unit."
    ],
    "why_others_wrong": {
      "Paste first wrong option verbatim": "Name the exact cognitive error. Reference the band distractor description.",
      "Paste second wrong option verbatim": "Name the exact cognitive error.",
      "Paste third wrong option verbatim": "Name the exact cognitive error."
    }
  },
  "error_trap_type": "One label from the misconception taxonomy above",
  "subtopic": "Specific subtopic name (e.g. Pseudo Force or Coulomb's Law)",
  "concept_tags": ["tag1", "tag2", "tag3"],
  "numerical_formula": "Primary formula in Unicode. Example: KE = ½mv²",
  "given_values": {
    "quantity_name": "value with unit",
    "quantity_name": "value with unit"
  },
  "final_numerical_value": 0.0,
  "final_unit": "unit string"
}

═══════════════════════════════════════════════════════
HARD PROHIBITIONS
═══════════════════════════════════════════════════════

NEVER start output with \`\`\`
NEVER write "Here is" or "Sure" or any sentence before the JSON
NEVER use options that are single letters: "A", "B", "C", "D"
NEVER use options that say "Option A", "Option B", "Placeholder"
NEVER use LaTeX anywhere
NEVER leave hidden_derivation as a description — it must contain arithmetic
NEVER generate a question requiring a diagram
NEVER generate a question where the correct answer is not in the options array
NEVER blend two bands — pick one and follow it precisely
NEVER output incomplete JSON

When uncertain about the correct answer, choose a different concept where you are certain.
A simple correct question beats a complex wrong one every time.

BEGIN OUTPUT NOW:`;

    // Retry loop: up to 2 batch retries (3 parallel generations per batch)
    const MAX_GEN_RETRIES = 2;
    // Signal that active generation is in progress (blocks pre-warmer)
    markGeneratingStart();
    try {
    for (let attempt = 0; attempt <= MAX_GEN_RETRIES; attempt++) {
        if (attempt > 0) {
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.log(`[QuestionEngine] Retrying parallel generation in ${backoffMs}ms (Attempt ${attempt + 1}/${MAX_GEN_RETRIES + 1})...`);
            await new Promise(r => setTimeout(r, backoffMs));
        }

        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(subject) || ['foundation', 'school exams'].includes(exam.toLowerCase());
        const persona = isJunior 
            ? `Senior Secondary School Teacher with expertise in NCERT and Olympiads. You specialize in making complex concepts simple for middle and high school students.`
            : `Senior ${subject} Professor with 20 years of JEE/NEET paper-setting experience. You specialize in high-level competitive exam questions.`;

        const generationTier = abilityLevel >= 1500 ? 'T1' : 'T2';
        
        // --- TIER 1/2: PARALLEL GENERATION ---
        const parallelCount = 3;
        const candidatePromises = Array.from({ length: parallelCount }).map(() =>
            withTimeout(
                askAI(
                    `${persona} Return a single JSON object containing all required keys. The step-by-step mathematical derivation must be written inside the "hidden_derivation" key. JSON ONLY.`,
                    generationPrompt + `\nSTUDENT GRADE: ${params.exam.includes('Class') ? params.exam : 'Class 10 (High School)'}`, 
                    'auto', [], {
                    jsonMode: true,
                    stream: false,
                    max_tokens: 2500,
                    tier: generationTier,
                    temperature: 0.6 + (Math.random() * 0.2), // Slight variation
                    skipMemory: true // Save API quota
                }),
                45000 // 45s timeout
            ).catch(() => null)
        );

        const responses = await Promise.all(candidatePromises);
        const validResponses = responses.filter(r => r !== null) as string[];
        let selectedRawData = null;
        let consistencyPassed = false;
        let unitCheckPassed = false;

        // --- TIER 3: FAST DETERMINISTIC FILTERS ---
        for (const response of validResponses) {
            let rawData;
            try {
                rawData = extractJSON(response);
            } catch (e) {
                console.warn(`[QuestionEngine] Failed to extract JSON.`);
                continue;
            }

            // Ensure required fields have defaults
            if (!rawData.type) rawData.type = 'MCQ';
            if (!rawData.explanation) rawData.explanation = rawData.hidden_derivation || 'Solution available.';
            if (!rawData.concept_tags) rawData.concept_tags = [topic];
            if (!rawData.error_trap_type) rawData.error_trap_type = 'calculation';
            if (!rawData.subtopic) rawData.subtopic = topic;

            if (rawData.options && typeof rawData.options === 'object' && !Array.isArray(rawData.options)) {
                rawData.options = Object.values(rawData.options);
            }

            // Code-level correct_answer validation: must exist in options
            if (Array.isArray(rawData.options) && typeof rawData.correct_answer === 'string') {
                const trimmedAns = rawData.correct_answer.trim().toUpperCase();
                if (/^[A-D]$/.test(trimmedAns)) {
                    const idx = trimmedAns.charCodeAt(0) - 65;
                    if (rawData.options[idx]) rawData.correct_answer = rawData.options[idx];
                }

                rawData.options = rawData.options.map((opt: any) => 
                    typeof opt === 'string' ? opt.replace(/^[A-D][.:)\s]+/i, '').trim() : opt
                );
                rawData.correct_answer = rawData.correct_answer.replace(/^[A-D][.:)\s]+/i, '').trim();

                const exactMatch = rawData.options.includes(rawData.correct_answer);
                if (!exactMatch) {
                    const partialIdx = rawData.options.findIndex((opt: string) =>
                        opt.includes(rawData.correct_answer) || rawData.correct_answer.includes(opt)
                    );
                    if (partialIdx !== -1) {
                        rawData.correct_answer = rawData.options[partialIdx];
                    } else {
                        console.warn(`[QuestionEngine] Fast fail: correct_answer not in options. Options: ${JSON.stringify(rawData.options)}, Ans: ${rawData.correct_answer}`);
                        continue; // Fast fail: answer not in options
                    }
                }
            }

            // Layer 2: Global Sanity Pass (Deterministic)
            const derivationText = rawData.hidden_derivation || rawData.explanation ||
                (rawData.step_by_step_solution || []).join(' ') || '';
            const consistency = checkDerivationConsistency(derivationText, rawData.correct_answer || '');
            if (!consistency.consistent) {
                console.warn(`[QuestionEngine] Consistency FAIL: ${consistency.reason}`);
                continue;
            }
            consistencyPassed = true;

            // Layer 2b: Step-solution vs final_numerical_value consistency
            if (rawData.step_by_step_solution && rawData.final_numerical_value !== undefined) {
                const stepCheck = checkStepConsistency(rawData.step_by_step_solution, rawData.final_numerical_value);
                if (!stepCheck.consistent) {
                    console.warn(`[QuestionEngine] Step consistency FAIL: ${stepCheck.reason}`);
                    continue;
                }
            }

            // Layer 3: Unit Validation (Deterministic)
            const unitCheck = validateUnits(rawData.topic || topic, rawData.correct_answer || '', rawData.question || '');
            if (!unitCheck.valid) {
                console.warn(`[QuestionEngine] Unit check FAIL: ${unitCheck.reason}`);
                continue;
            }
            unitCheckPassed = true;

            // Layer 4: Conceptual/Fact Validation (Deterministic)
            const isNumerical = isNumericalQuestion(rawData.question || '', rawData.subject || subject, Array.isArray(rawData.options) ? rawData.options : Object.values(rawData.options || {}));
            if (!isNumerical) {
                const factCheck = checkConceptualQuestion(rawData.subject || subject, rawData.topic || topic, rawData.question || '', rawData.correct_answer || '', rawData.options || []);
                if (!factCheck.valid) {
                    console.warn(`[QuestionEngine] Fact check FAIL: ${factCheck.reason}`);
                    continue;
                }
            }

            // Layer 5: Domain-Specific Physics/Math Constraints (Deterministic)
            const domainCheck = runDomainSpecificValidation(
                rawData.topic || topic, 
                rawData.question || '', 
                Array.isArray(rawData.options) ? rawData.options : Object.values(rawData.options || {}), 
                derivationText
            );
            if (!domainCheck.valid) {
                console.warn(`[QuestionEngine] Domain validation FAIL: ${domainCheck.reason}`);
                continue;
            }

            selectedRawData = rawData;
            break; // Found our passing candidate!
        }

        if (!selectedRawData) {
            console.warn(`[QuestionEngine] All parallel candidates failed deterministic checks. Retrying batch...`);
            continue;
        }

        const rawData = selectedRawData;
        const hashText = rawData.question + JSON.stringify(rawData.options);
        const hash = await generateHash(hashText);

        const dupQuery = query(collection(db, 'engine_questions'), where('hash', '==', hash));
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
            console.warn("[QuestionEngine] Duplicate hash detected. Retrying...");
            continue;
        }

        let verifiedData = rawData;
        let confidenceScore = 0.80; // High base score because it passed deterministic checks
        let verifierMatches = true;
        let verifierAnswer = "";

        // --- TIER 4: SEMANTIC LLM VERIFICATION ---
        // Difficulty-Adaptive Verification: 
        // If it's <1200 difficulty, numerical, and already passed deterministic tests, SKIP the semantic LLM.
        // We only use the Semantic LLM for conceptual/advanced questions to prevent the "Verifier Agreement Illusion".
        const isNumericalGen = isNumericalQuestion(rawData.question || '', rawData.subject || subject, Array.isArray(rawData.options) ? rawData.options : Object.values(rawData.options || {}));
        const needsSemanticLLM = abilityLevel >= 1200 || !isNumericalGen;

        if (needsSemanticLLM) {
            const runConsensus = abilityLevel >= 1500;
            const verification = await verifyQuestionFast(rawData, runConsensus);
            
            if (!verification.verified || !verification.data) {
                console.warn(`[QuestionEngine] Semantic Verifier rejected. Retrying batch...`);
                continue;
            }

            verifiedData = verification.data;
            if (verification.verifierMatches) confidenceScore += 0.10;
            if (!verification.isRefixed) confidenceScore += 0.05;
            
            verifierMatches = verification.verifierMatches ?? true;
            verifierAnswer = verification.verifierAnswer || '';
        } else {
            // Skipped LLM -> Give deterministic fast-pass bonus
            confidenceScore += 0.15;
        }

        // Store verification details
        verifiedData.verification_details = {
            verifier_answer: verifierAnswer,
            verifier_matches: verifierMatches,
            consistency_check_passed: consistencyPassed,
            unit_check_passed: unitCheckPassed
        };

        // Storage Optimization
        enforceStorageLimit(verifiedData.topic || topic, exam);

        const finalQuestion: Omit<StoredQuestion, 'id'> = {
            ...verifiedData as StoredQuestion,
            difficulty_score: abilityLevel,
            hash,
            usage_count: 0,
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

        console.log(`[QuestionEngine] [SanityPass] ✅ Invariant derived_answer == marked_option verified (confidence: ${finalQuestion.confidence.toFixed(2)}) for "${topic}"`);
        return { id: 'live-' + Date.now(), ...finalQuestion };
    } // end for loop

    console.error(`[QuestionEngine] All ${MAX_GEN_RETRIES + 1} generation attempts failed for ${topic}.`);
    return null;

    } catch (globalError) {
        console.error(`[QuestionEngine] Fatal error during question generation:`, globalError);
        return null;
    } finally {
        // Always clear the generating flag so pre-warmer can resume
        markGeneratingEnd();
    }
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

    // 2. Fetch from serverless Cloudflare D1 API endpoint
    try {
        console.log(`[QuestionEngine] 📡 Fetching adaptive question from D1 Edge API for topic: "${topic}" (Rating: ${targetRating})`);
        const res = await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                needs: [{ topic, count: 1, topic_id: resolvedTopicId }],
                exam,
                abilityScore: targetRating
            })
        });

        if (!res.ok) {
            throw new Error(`Edge API returned HTTP status ${res.status}`);
        }

        const questions = await res.json() as StoredQuestion[];
        if (questions && questions.length > 0) {
            const selectedQuestion = questions[0];
            setCache(cacheKey, [selectedQuestion]);
            return selectedQuestion;
        }
    } catch (apiErr) {
        console.warn("[QuestionEngine] Edge API call failed, attempting Firestore / local offline fallback:", apiErr);
    }

    // 3. Last Resort Fallback: Try local Offline Sync Service DB or Firestore
    try {
        const offlineQ = await offlineSyncService.getOfflineQuestions(topic, 1);
        if (offlineQ && offlineQ.length > 0) return offlineQ[0];
    } catch (offlineErr) {
        console.warn("[QuestionEngine] Offline db fallback also failed:", offlineErr);
    }

    // Try Firestore as secondary backup
    let snap: any = null;
    try {
        const dbQuery = query(
            collection(db, 'engine_questions'),
            where('exam', '==', exam),
            where('topic_id', '==', resolvedTopicId),
            where('difficulty_score', '>=', targetRating - 150),
            where('difficulty_score', '<=', targetRating + 150),
            limit(10)
        );
        snap = await getDocs(dbQuery);
        if (snap && !snap.empty) {
            const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StoredQuestion));
            const selectedQuestion = all[Math.floor(Math.random() * all.length)];
            setCache(cacheKey, [selectedQuestion]);
            return selectedQuestion;
        }
    } catch (dbErr) {
        console.warn("[QuestionEngine] Firestore emergency backup lookup failed:", dbErr);
    }

    return null;
};
export const generateAndVerifyBatch = async (
    params: {
        exam: string,
        subject: string,
        topic: string,
        abilityScore: number,
        count: number
    }
): Promise<StoredQuestion[]> => {
    const formulaSheet = getFormulaSheet(params.topic, params.subject);
    
    const genPrompt = `You are an expert JEE/NEET question generator operating in strict JSON-only mode.

ABSOLUTE OUTPUT RULE: Your entire response MUST be a single valid JSON object containing a "questions" key whose value is an array of exactly ${params.count} question objects. No markdown. No code blocks. No backticks. No preamble. No explanation. If your response starts with anything other than '{', it is wrong.

═══════════════════════════════════════════════════════
TASK: Generate ${params.count} high-quality MCQ questions
═══════════════════════════════════════════════════════

EXAM:       ${params.exam}
SUBJECT:    ${params.subject}
TOPIC:      ${params.topic}
DIFFICULTY: ${params.abilityScore} out of 3000

═══════════════════════════════════════════════════════
DIFFICULTY LADDER — READ THIS FIRST
═══════════════════════════════════════════════════════

Each band has a distinct cognitive fingerprint. Do not blend bands.
Identify which band ${params.abilityScore} falls into and follow ONLY that band's rules.

──────────────────────────────────────────────────────
BAND 1 — Score 0 to 200 — "First Contact"
──────────────────────────────────────────────────────
Cognitive demand : Pure recall. Student just needs to remember a definition or a single fact.
Question form    : "What is...", "Which of the following is the unit of...", "Define..."
Formula use      : None required. Answer comes directly from memory.
Numbers          : Avoid numbers entirely or use only trivial whole numbers (1, 2, 10).
Distractors      : Three plausible-sounding but clearly wrong facts. No calculation traps.
Time to solve    : Under 20 seconds.
Example concept  : "The SI unit of force is Newton." or "Ohm's law states V = IR."

──────────────────────────────────────────────────────
BAND 2 — Score 200 to 400 — "Direct Substitution"
──────────────────────────────────────────────────────
Cognitive demand : Single formula, plug in numbers, read the answer.
Question form    : Give all values explicitly. Student substitutes and simplifies once.
Formula use      : One formula, no rearrangement needed.
Numbers          : Clean integers or simple decimals. No unit conversion required.
Distractors      : Arithmetic slips (forgot to square, used wrong constant) and one conceptual wrong.
Time to solve    : 30 to 45 seconds.
Example concept  : "Given F = 10 N, m = 2 kg. Find acceleration using F = ma."

──────────────────────────────────────────────────────
BAND 3 — Score 400 to 600 — "One Twist"
──────────────────────────────────────────────────────
Cognitive demand : Single formula but student must rearrange it to isolate the unknown.
Question form    : Give all values except the one being asked. Requires algebraic manipulation.
Formula use      : One formula, rearranged once.
Numbers          : May include one simple fraction or square root. Still clean.
Distractors      : Forgetting to rearrange (using formula in wrong direction), sign error, one unit slip.
Time to solve    : 45 to 60 seconds.
Example concept  : "Given KE = 50 J, m = 4 kg. Find velocity using KE = ½mv²."

──────────────────────────────────────────────────────
BAND 4 — Score 600 to 800 — "Unit Awareness"
──────────────────────────────────────────────────────
Cognitive demand : Single formula with a mandatory unit conversion before substitution.
Question form    : Give values in mixed or non-SI units. Student must convert first, then solve.
Formula use      : One formula. The trap is the unit, not the formula.
Numbers          : Include one conversion (km/h to m/s, g to kg, cm to m, minutes to seconds).
Distractors      : Answer without converting, answer with wrong conversion factor, conceptual wrong.
Time to solve    : 60 to 90 seconds.
Example concept  : "A car travels at 72 km/h. Find its KE given mass = 500 kg." (must convert to 20 m/s first)

──────────────────────────────────────────────────────
BAND 5 — Score 800 to 1000 — "Two-Step Chain"
──────────────────────────────────────────────────────
Cognitive demand : Two formulas applied in sequence. Output of step 1 is input to step 2.
Question form    : Scenario with enough data to solve a two-step problem.
Formula use      : Two distinct formulas from the same topic.
Numbers          : Moderate. May require one unit conversion within the chain.
Distractors      : Stopping after step 1 (most common trap), skipping a step, using wrong formula for step 2.
Time to solve    : 90 to 120 seconds.
Example concept  : "Find the time period of a pendulum of length L, then find frequency." (two steps: T = 2π√(L/g), then f = 1/T)

──────────────────────────────────────────────────────
BAND 6 — Score 1000 to 1200 — "Conditional Reasoning"
──────────────────────────────────────────────────────
Cognitive demand : Student must apply a condition or constraint before choosing which formula to use.
Question form    : Problem where the setup determines the applicable law (e.g., elastic vs inelastic, series vs parallel).
Formula use      : Student selects one of two possible formulas based on a condition stated in the question.
Numbers          : Moderate arithmetic. One distractor exploits the wrong branch of the condition.
Distractors      : Wrong formula chosen (e.g., used elastic collision formula for inelastic), calculation slip, sign error.
Time to solve    : 2 minutes.
Example concept  : "A perfectly inelastic collision — find final velocity." (student must recognize inelastic means they merge, not bounce)

──────────────────────────────────────────────────────
BAND 7 — Score 1200 to 1500 — "Inverse and Indirect"
──────────────────────────────────────────────────────
Cognitive demand : Student cannot directly compute the answer. Must work backwards or use an indirect relationship.
Question form    : Give the result, ask for an input. Or give a ratio/comparison, ask for the individual value.
Formula use      : One or two formulas, applied in reverse or comparatively.
Numbers          : Requires clean but non-trivial algebra. May involve simultaneous equations.
Distractors      : Direct (non-inverse) application of the formula, algebra error, sign flip.
Time to solve    : 2 to 2.5 minutes.
Example concept  : "The time period of a satellite doubles. By what factor does the orbital radius change?" (uses T² ∝ r³, requires ratio reasoning)

──────────────────────────────────────────────────────
BAND 8 — Score 1500 to 1800 — "Multi-Concept Bridge"
──────────────────────────────────────────────────────
Cognitive demand : Two distinct concepts from the same subject must be linked. Neither alone gives the answer.
Question form    : Scenario requiring the student to connect two ideas they normally treat separately.
Formula use      : Two formulas from different sub-topics, connected by a shared variable.
Numbers          : Moderate to complex. One calculation is elegant if done correctly but messy if approached wrongly.
Distractors      : Using only one concept and ignoring the other, linking concepts in the wrong order, forgetting a constraint.
Time to solve    : 2.5 to 3 minutes.
Example concept  : "A charged particle enters a magnetic field. Find the radius of circular motion." (links Lorentz force = centripetal force)

──────────────────────────────────────────────────────
BAND 9 — Score 1800 to 2100 — "Misconception Trap"
──────────────────────────────────────────────────────
Cognitive demand : The question is designed so that the most intuitive approach gives a wrong answer. Student must override instinct.
Question form    : Setup that looks like a simpler problem but contains a hidden subtlety.
Formula use      : Standard formula, but a constraint invalidates the naive application.
Numbers          : Chosen specifically so the wrong approach gives a "nice" answer (to make the trap convincing).
Distractors      : The intuitive wrong answer is the most attractive option. Three of four options should seem plausible.
Time to solve    : 3 minutes.
Example concept  : "A block on an accelerating truck — find friction force." (students apply F=ma to the wrong reference frame)

──────────────────────────────────────────────────────
BAND 10 — Score 2100 to 2400 — "Three-Concept Synthesis"
──────────────────────────────────────────────────────
Cognitive demand : Three distinct concepts must be synthesized in a specific order. Missing any one gives a wrong answer.
Question form    : Rich scenario with multiple physical or mathematical processes happening simultaneously or sequentially.
Formula use      : Three formulas. The challenge is identifying the correct sequence and shared variables.
Numbers          : Complex but resolves to a clean answer if approached correctly. Messy if approached incorrectly.
Distractors      : Each wrong option corresponds to stopping at a different stage (after 1 concept, after 2 concepts, or using wrong sequence).
Time to solve    : 3 to 4 minutes.
Example concept  : "A projectile is launched from a moving platform. Find range in ground frame." (links relative motion + projectile motion + range formula)

──────────────────────────────────────────────────────
BAND 11 — Score 2400 to 2700 — "Non-Obvious Application"
──────────────────────────────────────────────────────
Cognitive demand : Requires applying a formula to a context where students do not expect it. Pattern recognition at expert level.
Question form    : Familiar formula, unfamiliar context. The insight is recognizing which law applies.
Formula use      : A standard formula applied analogically or in an unexpected domain.
Numbers          : Elegant. The computation itself is not hard — the insight is hard.
Distractors      : Three answers corresponding to three common but incorrect laws that seem more relevant.
Time to solve    : 3 to 4 minutes with the insight. Unsolvable without it.
Example concept  : "Find the equivalent resistance of an infinite resistor ladder." (requires recognizing self-similarity and solving a quadratic)

──────────────────────────────────────────────────────
BAND 12 — Score 2700 to 3000 — "Expert Synthesis"
──────────────────────────────────────────────────────
Cognitive demand : Olympiad or advanced JEE Advanced level. Requires deriving an intermediate result not given in standard formulae.
Question form    : Problem where standard formulae are insufficient. Student must derive a sub-result first.
Formula use      : Derivation from first principles or combination of four or more relationships.
Numbers          : Carefully chosen to reward insight (answer is often a pure number, ratio, or simple expression).
Distractors      : Near-miss answers that result from stopping one derivation step early, or from a subtle sign convention error.
Time to solve    : 4 to 5 minutes for an expert. Unapproachable without deep understanding.
Example concept  : "Two identical springs connected at a junction with a mass — find normal mode frequencies." (requires setting up equations of motion and solving eigenvalue problem)

═══════════════════════════════════════════════════════
STEP 1 — DERIVE FIRST (mandatory internal reasoning)
═══════════════════════════════════════════════════════

Before writing the questions, work through each yourself:
1. Identify the exact concept being tested at difficulty ${params.abilityScore}.
2. Choose specific numerical values (not variables like "let x =").
3. Solve completely using the correct formula sequence for your band.
4. Confirm dimensional consistency of your answer.
5. Design wrong options: each must represent the exact mistake described in your band's "Distractors" field.
6. Verify: correct_answer appears verbatim in options. If not, fix before outputting.

All of this goes into "hidden_derivation". It must contain actual numbers, not descriptions.

═══════════════════════════════════════════════════════
STEP 2 — SELF-CHECK BEFORE OUTPUT
═══════════════════════════════════════════════════════

[ ] correct_answer matches one option exactly, character for character
[ ] options array has exactly 4 elements
[ ] no two options are identical
[ ] every option is a complete meaningful phrase (not a letter, not a single word)
[ ] average option length is at least 8 characters
[ ] question text is longer than 50 characters
[ ] hidden_derivation contains actual arithmetic with numbers
[ ] no option contains the words "Option A", "Option B", "Placeholder", "Answer"
[ ] question is fully self-contained (no missing data, no diagram required)
[ ] difficulty fingerprint matches the band described above for ${params.abilityScore}

If any check fails, regenerate entirely before outputting.

═══════════════════════════════════════════════════════
MATH FORMATTING — USE UNICODE ONLY
═══════════════════════════════════════════════════════

CORRECT  →  WRONG
F = mv²/r   →  $F = \\frac{mv^2}{r}$
α = 0.5     →  \\alpha = 0.5
10⁻³        →  10^{-3}
H₂O         →  H_2O
√2          →  \\sqrt{2}
μ₀          →  \\mu_0
ε₀          →  \\epsilon_0
θ           . →  \\theta
Δv          →  \\Delta v
×           →  \\times or *

═══════════════════════════════════════════════════════
REFERENCE FORMULAS FOR THIS TOPIC:
═══════════════════════════════════════════════════════

${formulaSheet}

═══════════════════════════════════════════════════════
MISCONCEPTION TAXONOMY — pick the single closest label:
═══════════════════════════════════════════════════════

mechanics.force.pseudo_force_misuse
mechanics.force.direction_error
mechanics.energy.non_conservative_omission
mechanics.energy.work_sign_error
mechanics.statics.torque_balance_error
mechanics.kinematics.relative_motion_ignored
mechanics.kinematics.vector_scalar_confusion
mechanics.momentum.frame_not_identified
electronics.circuits.kvl_sign_error
electronics.circuits.series_parallel_confusion
electronics.semiconductors.carrier_confusion
math.calculus.chain_rule_omission
math.calculus.limits_misapplied
math.algebra.sign_flip
math.algebra.wrong_root_selected
math.geometry.angle_convention_error
chemistry.equilibrium.le_chatelier_direction_error
chemistry.stoichiometry.mole_ratio_error
chemistry.bonding.hybridization_confusion
general.unit_conversion
general.calculation_slip
general.misreading_constraint
general.over_generalizing_special_case
general.miscellaneous

═══════════════════════════════════════════════════════
OUTPUT FORMAT — output this exact structure:
═══════════════════════════════════════════════════════

{
  "questions": [
    {
      "exam": "${params.exam}",
      "subject": "${params.subject}",
      "topic": "${params.topic}",
      "type": "MCQ",
      "difficulty_score": ${params.abilityScore},
      "difficulty_band": "State which band name applies, e.g. BAND 5 — Two-Step Chain",
      "draft_givens": [ "List every physical/mathematical quantity given" ],
      "draft_unknowns": [ "List exactly what must be calculated" ],
      "draft_constraints": [ "List domain-specific invariants (e.g. cycle closure, charge conservation, positive energy)" ],
      "draft_core_equations": [ "Primary formulas needed" ],
      "draft_solution_steps": [ "Step-by-step arithmetic to reach the answer" ],
      "draft_unit_check": "Verify dimensional consistency",
      "draft_uniqueness_check": "Verify no other interpretation or unstated assumption exists",
      "hidden_derivation": "Your complete working with actual numbers. Must show every arithmetic step. Example: Given m = 2 kg, v = 6 m/s. KE = ½ × 2 × 36 = 36 J.",
      "question": "Full question text. Must be completely self-contained based on the draft.",
      "options": [
        "Complete first option with value and unit where applicable",
        "Complete second option with value and unit where applicable",
        "Complete third option with value and unit where applicable",
        "Complete fourth option with value and unit where applicable"
      ],
      "correct_answer": "Must match one of the four options above exactly, character for character",
      "explanation": "Why the correct answer is right. State the formula, the substitution, and the result.",
      "rich_explanation": {
        "steps": [
          "Step 1: Identify the relevant formula for this band.",
          "Step 2: List all given quantities with units.",
          "Step 3: Apply any required conversions or conditions.",
          "Step 4: Substitute and compute.",
          "Step 5: State final answer with unit."
        ],
        "why_others_wrong": {
          "Paste first wrong option verbatim": "Name the exact cognitive error.",
          "Paste second wrong option verbatim": "Name the exact cognitive error.",
          "Paste third wrong option verbatim": "Name the exact cognitive error."
        }
      },
      "error_trap_type": "One label from the misconception taxonomy above",
      "subtopic": "Specific subtopic name (e.g. Pseudo Force or Coulomb's Law)",
      "concept_tags": ["tag1", "tag2", "tag3"],
      "numerical_formula": "Primary formula in Unicode. Example: KE = ½mv²",
      "given_values": {
        "quantity_name": "value with unit"
      },
      "final_numerical_value": 0.0,
      "final_unit": "unit string"
    }
  ]
}

═══════════════════════════════════════════════════════
HARD PROHIBITIONS
═══════════════════════════════════════════════════════

NEVER start output with \`\`\`
NEVER write "Here is" or "Sure" or any sentence before the JSON
NEVER use options that are single letters: "A", "B", "C", "D"
NEVER use options that say "Option A", "Option B", "Placeholder"
NEVER use LaTeX anywhere
NEVER leave hidden_derivation as a description — it must contain arithmetic
NEVER generate a question requiring a diagram
NEVER generate a question where the correct answer is not in the options array
NEVER blend two bands — pick one and follow it precisely
NEVER output incomplete JSON

When uncertain about the correct answer, choose a different concept where you are certain.
A simple correct question beats a complex wrong one every time.

BEGIN OUTPUT NOW:`;

    markGeneratingStart();
    const finalQuestions: StoredQuestion[] = [];
    try {
        const genResponse = await askAI(
            "Senior Professor. Output strict JSON object with a 'questions' array.",
            genPrompt,
            'groq', [], {
                jsonMode: true, stream: false, max_tokens: 6000, tier: 'T2', temperature: 0.7, skipMemory: true
            }
        );
        let rawArray: any[] = [];
        try {
            const extracted = extractJSON(genResponse as string);
            if (extracted && extracted.questions && Array.isArray(extracted.questions)) {
                rawArray = extracted.questions;
            } else if (Array.isArray(extracted)) {
                rawArray = extracted;
            } else if (extracted) {
                rawArray = [extracted];
            }
        } catch (e) {
            console.warn("[QuestionEngine] Batch generation extraction failed");
            return [];
        }

        const validGenerations = rawArray.slice(0, params.count).filter(q => q && q.question && q.options && q.correct_answer);
        if (validGenerations.length === 0) return [];

        const hashes = await Promise.all(validGenerations.map(q => generateHash(q.question + JSON.stringify(q.options))));
        const existingSnap = await getDocs(query(
            collection(db, 'engine_questions'),
            where('hash', 'in', hashes)
        ));
        const existingHashes = new Set(existingSnap.docs.map(d => d.data().hash));
        const uniqueGenerations = validGenerations
            .map((q, i) => ({ ...q, hash: hashes[i] }))
            .filter(q => {
                if (existingHashes.has(q.hash)) {
                    console.warn("[QuestionEngine] Batch dedup: skipping duplicate question before verification.");
                    return false;
                }
                const collisionCheck = checkOptionCollision(q.options);
                if (!collisionCheck.valid) {
                    console.warn(`[QuestionEngine] Local validation failed: ${collisionCheck.reason}`);
                    return false;
                }
                return true;
            });
        if (uniqueGenerations.length === 0) return [];

        // 2. Verify all in one go (Gemini)
        const verPrompt = `
You are an elite Adversarial Verifier and Ambiguity Detector for JEE Advanced / NEET questions.
YOUR GOAL IS TO BREAK THESE QUESTIONS and find reasons to REJECT them.
You must perform 4 strict layers of verification on these ${uniqueGenerations.length} questions:

LAYER 1: Symbolic Recompute (Calculate the answer completely independently from scratch)
LAYER 2: Constraint Consistency (Check for impossible states, unclosed thermo cycles, missing magnitudes, or skipped chemistry workups)
LAYER 3: Ambiguity Attack (Are there hidden assumptions? Is it under-specified? E.g. vectors missing magnitudes)
LAYER 4: Option Collision (Are multiple options technically correct or numerically overlapping?)

${uniqueGenerations.map((q, i) => `
--- QUESTION ${i + 1} ---
QUESTION: ${q.question}
OPTIONS: ${JSON.stringify(q.options)}
STATED ANSWER: ${q.correct_answer}
`).join('\n')}

For EACH question, if it fails ANY of the 4 layers, you MUST set status to "REJECT".

RETURN RAW JSON ONLY IN THIS EXACT OBJECT FORMAT:
{
  "verifications": [
    {
      "index": 1,
      "status": "APPROVED | REJECT",
      "ambiguity_check": "Analyze if the question is perfectly specified or if it's missing constraints (like magnitudes, workup steps, etc).",
      "constraint_check": "Verify physical/chemical possibility (e.g. cycle closure).",
      "my_solution": "Your independent step-by-step derivation",
      "my_answer": "Your answer",
      "my_answer_numerical": 0.0,
      "stated_answer_numerical": 0.0,
      "logic": "Final verdict on why you APPROVED or REJECTED"
    }
  ]
}

CRITICAL: DO NOT INCLUDE ANY MARKDOWN CODE BLOCKS.
CRITICAL: OUTPUT A VALID JSON OBJECT.
`;
        const verResponse = await askAI(
            "Accuracy Auditor. Strict JSON object with a 'verifications' array.",
            verPrompt,
            'gemini', [], {
                jsonMode: true, stream: false, max_tokens: 4000, tier: 'T1', temperature: 0.0, skipMemory: true
            }
        );

        let verArray: any[] = [];
        try {
            const extracted = extractJSON(verResponse as string);
            if (extracted && extracted.verifications && Array.isArray(extracted.verifications)) {
                verArray = extracted.verifications;
            } else if (Array.isArray(extracted)) {
                verArray = extracted;
            } else if (extracted) {
                verArray = [extracted];
            }
        } catch (e) {
            console.warn("[QuestionEngine] Batch verification extraction failed");
            return [];
        }

        // 3. Match and process
        for (let i = 0; i < uniqueGenerations.length; i++) {
            const q = uniqueGenerations[i];
            const v = verArray.find(va => va.index === i + 1) || verArray[i];
            
            if (v && v.status === 'APPROVED') {
                if (v.my_answer_numerical !== undefined && v.stated_answer_numerical !== undefined) {
                    const myNum = Number(v.my_answer_numerical);
                    const statedNum = Number(v.stated_answer_numerical);
                    if (!isNaN(myNum) && !isNaN(statedNum) && (Math.abs(myNum) > 0.001 || Math.abs(statedNum) > 0.001)) {
                        const ref = Math.max(Math.abs(myNum), Math.abs(statedNum));
                        const diff = Math.abs(myNum - statedNum) / ref;
                        if (diff > 0.01) {
                            console.warn(`[QuestionEngine] Batch Override: Verifier said APPROVED but answers differ by ${(diff * 100).toFixed(1)}% (verifier: ${myNum}, stated: ${statedNum}). REJECTING.`);
                            continue;
                        }
                    }
                }

                if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
                    q.options = Object.values(q.options);
                }
                if (Array.isArray(q.options)) {
                    q.options = q.options.map((opt: any) => typeof opt === 'string' ? opt.replace(/^[A-D][.:)\s]+/i, '').trim() : opt);
                }
                q.correct_answer = q.correct_answer.replace(/^[A-D][.:)\s]+/i, '').trim();

                const unitCheck = validateUnits(q.topic || params.topic, q.correct_answer, q.question);
                if (!unitCheck.valid) continue;

                const isNumerical = isNumericalQuestion(q.question, q.subject || params.subject, q.options);
                if (!isNumerical) {
                    const factCheck = checkConceptualQuestion(q.subject || params.subject, q.topic || params.topic, q.question, q.correct_answer, q.options);
                    if (!factCheck.valid) continue;
                }

                const finalQuestion: StoredQuestion = {
                    ...q,
                    id: 'live-' + Date.now() + '-' + i,
                    difficulty_score: params.abilityScore,
                    hash: q.hash,
                    usage_count: 0,
                    confidence: 0.8,
                    created_at: new Date().toISOString()
                };

                if (db) addDoc(collection(db, 'engine_questions'), finalQuestion).catch(() => {});
                finalQuestions.push(finalQuestion);
            }
        }
        
        return finalQuestions;
    } catch (e) {
        console.error("[QuestionEngine] Batch LLM error", e);
        return [];
    } finally {
        markGeneratingEnd();
    }
};

/**
 * Adaptive Batch Retrieval Logic.
 * Optimized for full Mock Exams and Quick Tests.
 * Pulls from: Cache -> Offline -> Global DB -> AI (Final Delta)
 */
export const getAdaptiveQuestionBatch = async (
    needs: Array<{ subject: string; topic: string; count: number; difficulty?: 'Easy' | 'Medium' | 'Hard'; remediationFocus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD'; topicSelector?: () => string }>,
    exam: string,
    abilityScore?: number,
    onProgress?: (progress: number) => void
): Promise<StoredQuestion[]> => {
    const allQuestions: StoredQuestion[] = [];
    const totalCount = needs.reduce((sum, n) => sum + n.count, 0);
    let completedCount = 0;

    const updateBatchProgress = (progress: number) => {
        if (onProgress) {
            onProgress(Math.min(progress, 100));
        }
    };

    const targetRating = abilityScore || 1000;
    const finalNeeds = needs.map(n => {
        const topic = n.topicSelector ? n.topicSelector() : n.topic;
        return {
            topic,
            count: n.count,
            topic_id: resolveTopicId(topic)
        };
    });

    updateBatchProgress(10);

    // 1. Fetch entire batch in one network call to Cloudflare D1 Edge API
    try {
        console.log(`[QuestionEngine] 📡 Fetching D1 Edge API batch of ${totalCount} questions`);
        const res = await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                needs: finalNeeds,
                exam,
                abilityScore: targetRating
            })
        });

        updateBatchProgress(50);

        if (!res.ok) {
            throw new Error(`Edge API returned HTTP status ${res.status}`);
        }

        const questions = await res.json() as StoredQuestion[];
        updateBatchProgress(90);

        if (questions && questions.length > 0) {
            allQuestions.push(...questions);
            updateBatchProgress(100);
            return allQuestions;
        }
    } catch (apiErr) {
        console.warn("[QuestionEngine] Edge API batch fetch failed, falling back to local offline DB / Firestore:", apiErr);
    }

    // 2. Fallback: Local offline sync database or Firestore
    updateBatchProgress(60);
    try {
        const offlineQs: StoredQuestion[] = [];
        for (const need of finalNeeds) {
            const qs = await offlineSyncService.getOfflineQuestions(need.topic, need.count);
            offlineQs.push(...qs);
        }
        if (offlineQs.length >= totalCount) {
            updateBatchProgress(100);
            return offlineQs;
        }
        allQuestions.push(...offlineQs);
    } catch (offlineErr) {
        console.warn("[QuestionEngine] Offline batch fallback failed:", offlineErr);
    }

    // Secondary backup: Query Firestore sequentially per topic
    const remainingCount = totalCount - allQuestions.length;
    if (remainingCount > 0) {
        const seenIds = new Set(allQuestions.map(q => q.id).filter(Boolean) as string[]);
        
        for (const need of finalNeeds) {
            const topicQs: StoredQuestion[] = [];
            try {
                const dbQuery = query(
                    collection(db, 'engine_questions'),
                    where('exam', '==', exam),
                    where('topic_id', '==', need.topic_id),
                    where('difficulty_score', '>=', targetRating - 200),
                    where('difficulty_score', '<=', targetRating + 200),
                    limit(need.count * 2)
                );
                const snap = await getDocs(dbQuery);
                if (snap && !snap.empty) {
                    const docs = snap.docs
                        .map(d => ({ id: d.id, ...d.data() } as StoredQuestion))
                        .filter(q => q.id && !seenIds.has(q.id));
                    const selected = docs.sort(() => Math.random() - 0.5).slice(0, need.count);
                    topicQs.push(...selected);
                }
            } catch (dbErr) {
                console.warn(`[QuestionEngine] Firestore backup failed for topic ${need.topic}:`, dbErr);
            }
            allQuestions.push(...topicQs);
        }
    }

    updateBatchProgress(100);
    return allQuestions.slice(0, totalCount);
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
        
        let correctAnswerIndex = -1;
        if (typeof q.correct_answer === 'string') {
            if (q.correct_answer.length === 1 && /[A-D]/.test(q.correct_answer)) {
                correctAnswerIndex = q.correct_answer.charCodeAt(0) - 65;
            } else {
                const foundIndex = optionsArray.indexOf(q.correct_answer);
                if (foundIndex !== -1) correctAnswerIndex = foundIndex;
            }
        }

        if (!q.subtopic || q.subtopic === q.topic) {
            console.warn(`[QuestionEngine] Question ${q.id || idx} missing granular subtopic; falling back to broad topic "${q.topic}"`);
        }

        return {
            id: startId + idx,
            text: q.question,
            options: optionsArray,
            correctAnswer: correctAnswerIndex,
            explanation: q.explanation || q.hidden_derivation || '',
            topic: q.topic,
            subject: q.subject,
            difficulty_score: q.difficulty_score || 1000,
            concept_tags: q.concept_tags || [],
            error_trap_type: q.error_trap_type || 'calculation',
            subtopic: q.subtopic || q.topic
        };
    });
};

/**
 * Generates a standard batch of questions for a specific exam/class/subject combination.
 * Follows the "Quick Test" distribution rules from the Test Center.
 */
const getRandomTopicForSubject = (subj: string): string => {
    const topicsList = SYLLABUS_DB[subj];
    if (Array.isArray(topicsList) && topicsList.length > 0) {
        const entry = topicsList[Math.floor(Math.random() * topicsList.length)];
        const topicName = typeof entry === 'string' ? entry : entry?.topic;
        if (!topicName) {
            console.error(`[QuestionEngine] SYLLABUS_DB["${subj}"] has malformed entries. Check constants.ts.`);
            return subj;
        }
        return topicName;
    }
    console.error(`[QuestionEngine] SYLLABUS_DB missing or invalid for subject: "${subj}".`);
    return subj;
};

export const generateStandardBatch = async (
    targetExam: string,
    userClass: string,
    subject?: string,
    count: number = 5,
    abilityScore?: number
) => {
    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);
    const isNeet = targetExam.toUpperCase().includes('NEET');

    let needs: Array<{ subject: string; topic: string; count: number; topicSelector?: () => string }> = [];

    if (subject && subject !== 'Mixed Topics') {
        needs = [{ subject, topic: getRandomTopicForSubject(subject), count, topicSelector: () => getRandomTopicForSubject(subject) }];
    } else if (isJunior) {
        needs = [{ subject: 'Science', topic: getRandomTopicForSubject('Science'), count, topicSelector: () => getRandomTopicForSubject('Science') }];
    } else if (isNeet) {
        needs = [
            { subject: 'Biology', topic: getRandomTopicForSubject('Biology'), count: Math.ceil(count * 0.4), topicSelector: () => getRandomTopicForSubject('Biology') },
            { subject: 'Physics', topic: getRandomTopicForSubject('Physics'), count: Math.floor(count * 0.3), topicSelector: () => getRandomTopicForSubject('Physics') },
            { subject: 'Chemistry', topic: getRandomTopicForSubject('Chemistry'), count: Math.floor(count * 0.3), topicSelector: () => getRandomTopicForSubject('Chemistry') }
        ];
    } else {
        needs = [
            { subject: 'Mathematics', topic: getRandomTopicForSubject('Mathematics'), count: Math.ceil(count * 0.4), topicSelector: () => getRandomTopicForSubject('Mathematics') },
            { subject: 'Physics', topic: getRandomTopicForSubject('Physics'), count: Math.floor(count * 0.3), topicSelector: () => getRandomTopicForSubject('Physics') },
            { subject: 'Chemistry', topic: getRandomTopicForSubject('Chemistry'), count: Math.floor(count * 0.3), topicSelector: () => getRandomTopicForSubject('Chemistry') }
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
            where('topic', '==', topicStat.topic),
            limit(5)
        );
        const countSnap = await getDocs(countQ);

        if (countSnap.size < 5) {
            console.log(`[QuestionEngine] Pre-generating batch for ${topicStat.topic}...`);
            await generateInspiredQuestion({
                exam,
                subject: topicStat.subject,
                topic: topicStat.topic,
                difficulty: (topicStat.weakness_score || 0) > 0.7 ? 'Easy' : 'Medium',
                abilityScore: (topicStat.weakness_score || 0) > 0.7 ? 500 : 1000
            });
        }
    }
};
