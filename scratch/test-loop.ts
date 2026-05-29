import { generateInspiredQuestion } from '../src/services/questionEngine';
import { askAI } from '../src/lib/ai';
import { extractJSON } from '../src/lib/utils';
import { checkDerivationConsistency, checkStepConsistency } from '../src/lib/consistencyCheck';
import { validateUnits } from '../src/lib/unitValidator';
import { checkConceptualQuestion, isNumericalQuestion } from '../src/lib/factValidator';
import { runDomainSpecificValidation } from '../src/lib/domainValidators';
import dotenv from 'dotenv';
dotenv.config();

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function testSingle(topic: string, subject: string) {
    console.log(`\n========================================`);
    console.log(`DEBUG TOPIC: ${topic}`);
    console.log(`========================================`);

    // Let's copy the generation prompt setup from questionEngine
    const abilityLevel = 1000;
    const exam = "JEE-Mains";
    
    // We'll call askAI directly to see what the models output, and run all validations with verbose printing!
    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(subject) || ['foundation', 'school exams'].includes(exam.toLowerCase());
    const persona = isJunior 
        ? `Senior Secondary School Teacher with expertise in NCERT and Olympiads. You specialize in making complex concepts simple for middle and high school students.`
        : `Senior ${subject} Professor with 20 years of JEE/NEET paper-setting experience. You specialize in high-level competitive exam questions.`;

    const formulaSheet = ""; // empty for debug simplicity
    const generationPrompt = `You are an expert JEE/NEET question generator operating in strict JSON-only mode.
ABSOLUTE OUTPUT RULE: Your entire response MUST be a single valid JSON object. No markdown. No code blocks.
EXAM:       ${exam}
SUBJECT:    ${subject}
TOPIC:      ${topic}
DIFFICULTY: ${abilityLevel} out of 3000
MATH FORMATTING — USE UNICODE ONLY (e.g. x², α, ×, √, 10⁻³). NEVER USE LaTeX.

OUTPUT FORMAT:
{
  "exam": "${exam}",
  "subject": "${subject}",
  "topic": "${topic}",
  "type": "MCQ",
  "difficulty_score": ${abilityLevel},
  "difficulty_band": "BAND 5 — Two-Step Chain",
  "hidden_derivation": "Your complete working with actual numbers.",
  "question": "Full question text.",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ],
  "correct_answer": "Must match one of the options exactly",
  "explanation": "Why correct",
  "error_trap_type": "general.calculation_slip",
  "subtopic": "${topic}",
  "concept_tags": ["${topic}"],
  "numerical_formula": "KE = ½mv²",
  "given_values": { "m": "2 kg" },
  "final_numerical_value": 0.0,
  "final_unit": "J"
}`;

    try {
        const response = await askAI(
            `${persona} Return a single JSON object containing all required keys. JSON ONLY.`,
            generationPrompt,
            'auto', [], {
            jsonMode: true,
            stream: false,
            max_tokens: 2000,
            tier: 'T2',
            temperature: 0.7,
            skipMemory: true
        });

        console.log("Raw Response length:", response?.length);
        let rawData;
        try {
            rawData = extractJSON(response as string);
        } catch (e: any) {
            console.error("JSON Extraction failed:", e.message);
            return;
        }

        console.log("Generated Question:", rawData.question);
        console.log("Options:", rawData.options);
        console.log("Correct Answer:", rawData.correct_answer);

        // Run checks step by step
        const optionsArr = Array.isArray(rawData.options) ? rawData.options : Object.values(rawData.options || {});
        
        // Option length check
        const avgOptLen = optionsArr.reduce((s: number, o: any) => s + (typeof o === 'string' ? o.length : 0), 0) / Math.max(optionsArr.length, 1);
        console.log(`- Average option length: ${avgOptLen} (Required: >= 1)`);
        if (avgOptLen < 1) {
            console.log("❌ Failed avg option length check");
        }

        // Duplication option check
        const normalizedOpts = optionsArr.map((o: any) => (typeof o === 'string' ? o : '').toLowerCase().trim());
        const hasDupOptions = new Set(normalizedOpts).size < optionsArr.length;
        console.log(`- Has duplicate options: ${hasDupOptions}`);

        // Option matching check
        let trimmedAns = String(rawData.correct_answer).trim();
        let exactMatch = optionsArr.includes(trimmedAns);
        console.log(`- Correct answer exact match: ${exactMatch}`);
        if (!exactMatch) {
            const partialIdx = optionsArr.findIndex((opt: any) =>
                String(opt).includes(trimmedAns) || trimmedAns.includes(String(opt))
            );
            console.log(`  Partial match index: ${partialIdx}`);
        }

        // Consistency check
        const derivationText = rawData.hidden_derivation || rawData.explanation || '';
        const consistency = checkDerivationConsistency(derivationText, rawData.correct_answer || '');
        console.log(`- Consistency Check: consistent=${consistency.consistent}, reason=${consistency.reason}, derived=${consistency.derivedValue}, answered=${consistency.answeredValue}`);

        // Unit check
        const unitCheck = validateUnits(rawData.topic || topic, rawData.correct_answer || '', rawData.question || '');
        console.log(`- Unit Check: valid=${unitCheck.valid}, reason=${unitCheck.reason}`);

        // Fact check
        const isNumerical = isNumericalQuestion(rawData.question || '', rawData.subject || subject, optionsArr);
        console.log(`- Is Numerical: ${isNumerical}`);
        if (!isNumerical) {
            const factCheck = checkConceptualQuestion(rawData.subject || subject, rawData.topic || topic, rawData.question || '', rawData.correct_answer || '', optionsArr);
            console.log(`  Fact Check: valid=${factCheck.valid}, reason=${factCheck.reason}`);
        }

        // Domain check
        const domainCheck = runDomainSpecificValidation(rawData.topic || topic, rawData.question || '', optionsArr, derivationText);
        console.log(`- Domain Check: valid=${domainCheck.valid}, reason=${domainCheck.reason}`);

    } catch (err: any) {
        console.error("Error generating/verifying:", err.message);
    }
}

async function main() {
    await testSingle('Hydrogen', 'Chemistry');
    await testSingle('Statistics', 'Mathematics');
}
main();
