import { askAI } from '../src/lib/ai';
import { checkDerivationConsistency } from '../src/lib/consistencyCheck';
import { validateUnits } from '../src/lib/unitValidator';
import { checkConceptualQuestion } from '../src/lib/factValidator';
import { runDomainSpecificValidation } from '../src/lib/domainValidators';
import { extractJSON } from '../src/lib/utils';
import dotenv from 'dotenv';
dotenv.config();

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function run() {
    const topic = 'Chemical Kinetics';
    console.log(`Starting debug generation for topic: ${topic}`);

    const styleEntropy = "Scenario-based (real-world application)";
    const abilityLevel = 1000;
    const exam = "JEE-Mains";
    const subject = "Chemistry";

    const prompt = `You are an expert JES/NEET question generator operating in strict JSON-only mode.
Generate one question for ${topic} at difficulty ${abilityLevel}.
Follow this exact JSON structure:
{
  "exam": "${exam}",
  "subject": "${subject}",
  "topic": "${topic}",
  "type": "MCQ",
  "difficulty_score": ${abilityLevel},
  "hidden_derivation": "Your complete working with actual numbers.",
  "question": "Full question text.",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ],
  "correct_answer": "Must match one of the options exactly",
  "explanation": "Why correct"
}`;

    try {
        console.log("Calling askAI...");
        const response = await askAI(
            "JSON ONLY.",
            prompt,
            'auto', [], {
            jsonMode: true,
            stream: false,
            max_tokens: 1500,
            tier: 'T2',
            temperature: 0.7
        });

        console.log("Raw LLM Response:\n", response);
        const rawData = extractJSON(response as string);
        console.log("Extracted JSON:\n", JSON.stringify(rawData, null, 2));

        // Let's run the checks manually and print their details!
        const derivationText = rawData.hidden_derivation || rawData.explanation || '';
        console.log("Running checkDerivationConsistency...");
        const consistency = checkDerivationConsistency(derivationText, rawData.correct_answer || '');
        console.log("Consistency result:", consistency);

        console.log("Running validateUnits...");
        const unitCheck = validateUnits(rawData.topic || topic, rawData.correct_answer || '', rawData.question || '');
        console.log("Unit check result:", unitCheck);

        console.log("Running checkConceptualQuestion...");
        const factCheck = checkConceptualQuestion(subject, rawData.topic || topic, rawData.question || '', rawData.correct_answer || '', rawData.options || []);
        console.log("Fact check result:", factCheck);

        console.log("Running runDomainSpecificValidation...");
        const domainCheck = runDomainSpecificValidation(
            rawData.topic || topic,
            rawData.question || '',
            rawData.options || [],
            derivationText
        );
        console.log("Domain check result:", domainCheck);

    } catch (e: any) {
        console.error("Error during run:", e.stack || e);
    }
}

run();
