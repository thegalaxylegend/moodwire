// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS RELATIONAL D1 DATABASE SEED & curation PIPELINE
// Runs offline to generate, audit, solve, and format premium questions
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_FILE_PATH = path.join(__dirname, 'seed.sql');

// ─── Unified Key Rotator Class ───
class KeyRotator {
  private keys: string[];
  private currentIndex: number = 0;
  private name: string;

  constructor(name: string, keys: string[]) {
    this.name = name;
    this.keys = keys.filter(Boolean);
    if (this.keys.length === 0) {
      console.warn(`⚠️ Warning: No keys configured for rotator: ${name}`);
    }
  }

  getNextKey(): string {
    if (this.keys.length === 0) return '';
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  get length(): number {
    return this.keys.length;
  }
}

// Instantiate Rotators
const groqRotator = new KeyRotator('Groq Fleet', [
  process.env.VITE_GROQ_API_KEY!,
  process.env.VITE_GROQ_API_KEY_2!,
  process.env.VITE_GROQ_API_KEY_3!,
  process.env.VITE_GROQ_API_KEY_4!,
  process.env.VITE_GROQ_API_KEY_5!,
  process.env.VITE_GROQ_API_KEY_6!,
  process.env.VITE_GROQ_API_KEY_7!,
  process.env.VITE_GROQ_API_KEY_8!,
]);

const cerebrasRotator = new KeyRotator('Cerebras Fleet', [
  process.env.CEREBRAS_API_KEY!,
  process.env.CEREBRAS_API_KEY_2!,
  process.env.CEREBRAS_API_KEY_3!,
  process.env.CEREBRAS_API_KEY_4!,
  process.env.CEREBRAS_API_KEY_5!,
  process.env.CEREBRAS_API_KEY_6!,
  process.env.CEREBRAS_API_KEY_7!,
  process.env.CEREBRAS_API_KEY_8!,
]);

const geminiRotator = new KeyRotator('Gemini Fleet', [
  process.env.VITE_GEMINI_API_KEY_5!, // Using working keys first
  process.env.VITE_GEMINI_API_KEY_6!,
  process.env.VITE_GEMINI_API_KEY!,
  process.env.VITE_GEMINI_API_KEY_2!,
  process.env.VITE_GEMINI_API_KEY_3!,
  process.env.VITE_GEMINI_API_KEY_4!,
]);

// ─── API Request Helpers with Cooldowns & Rotations ───

async function callGroqAPI(messages: any[], model: string, jsonMode = false): Promise<string> {
  let attempts = 0;
  const maxAttempts = Math.max(groqRotator.length * 2, 4);

  while (attempts < maxAttempts) {
    const key = groqRotator.getNextKey();
    if (!key) throw new Error("No Groq API Keys configured.");

    try {
      const body: any = {
        model,
        messages,
        temperature: 0.2,
        max_tokens: 3500
      };
      if (jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.status === 429) {
        console.warn(`[Groq 429] Rate limit hit. Rotating key...`);
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json() as any;
      return data.choices[0].message.content;
    } catch (e: any) {
      console.warn(`[Groq Error] ${e.message}. Retrying with rotated key...`);
      attempts++;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error("Groq API call failed after multiple key rotations.");
}

async function callCerebrasAPI(messages: any[], model: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = Math.max(cerebrasRotator.length * 2, 4);

  while (attempts < maxAttempts) {
    const key = cerebrasRotator.getNextKey();
    if (!key) throw new Error("No Cerebras API Keys configured.");

    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 3500
        })
      });

      if (res.status === 429) {
        console.warn(`[Cerebras 429] Rate limit hit. Rotating key...`);
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Cerebras HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json() as any;
      return data.choices[0].message.content;
    } catch (e: any) {
      console.warn(`[Cerebras Error] ${e.message}. Retrying with rotated key...`);
      attempts++;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error("Cerebras API call failed after multiple key rotations.");
}

// ─── SQL Escaping ───
function escapeSql(str: string | undefined | null): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// ─── Deduplication Helper ───
function getQuestionHash(text: string, options: string[]): string {
  const normalized = (text + options.join('')).toLowerCase().replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Helper to escape single backslashes in JSON strings for LaTeX commands
function escapeLatexInJson(jsonStr: string): string {
  let result = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '\\') {
      const nextChar = jsonStr[i + 1];
      // If the backslash is escaping a double quote or another backslash, leave it as is
      if (nextChar === '"' || nextChar === '\\') {
        result += '\\' + nextChar;
        i++; // skip next char
      } else {
        // Otherwise, double escape the backslash to preserve it in parsed string
        result += '\\\\';
      }
    } else {
      result += char;
    }
  }
  return result;
}

// Normalizes strings for robust academic question option comparisons
function normalizeStringForComparison(str: string): string {
  if (!str) return '';
  let s = str.trim().toLowerCase();
  
  // Strip common option prefixes from the front (e.g. "1. $1260$" -> "$1260$")
  s = s.replace(/^(option\s+[a-d]\s*[:\-\)]?|[1-4]\s*[:\.\-\)]|[a-d]\s*[:\.\-\)])\s*/i, '');
  
  // Remove wrapping dollar signs, parentheses, quotes, backticks
  s = s.replace(/[\`\'\"\$\(\)]/g, '');
  
  // Normalize whitespace (tabs, newlines, multiple spaces) to a single space
  s = s.replace(/\s+/g, ' ');
  
  // Strip backslashes completely to avoid differences in escape syntax
  s = s.replace(/\\/g, '');
  
  // Strip commas, semicolons, and trailing spaces/periods to avoid punctuation mismatches
  s = s.replace(/[,;\.]/g, '');
  
  return s.trim();
}

// ─── Syllabus Selection ───
const ALLOWED_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'Social Science', 'English'];

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  rich_explanation?: any;
  concept_tags: string[];
  error_trap_type: string;
  numerical_formula?: string;
  given_values?: any;
  final_numerical_value?: number;
  final_unit?: string;
  source_exam?: string;
}

// Main processing loop
async function runSeeding() {
  console.log("🚀 STARTING ZERO-COST ADAPTIVE QUESTION SEEDING PIPELINE 🚀");
  console.log("------------------------------------------------------------");

  const isTestMode = process.argv.includes('--test');
  let topicsProcessed = 0;

  // Read existing hashes from seed.sql to prevent duplicate generations
  const existingHashes = new Set<string>();
  if (fs.existsSync(SEED_FILE_PATH)) {
    const content = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
    const matches = content.match(/INSERT OR IGNORE INTO questions\s*\(\s*id/gi);
    console.log(`ℹ️ Found existing seed.sql with some questions seeded.`);
    // Simple hash extraction from INSERT statements if needed:
    const hashRegex = /VALUES\s*\(\s*'([a-f0-9]{64})'/gi;
    let match;
    while ((match = hashRegex.exec(content)) !== null) {
      existingHashes.add(match[1]);
    }
    console.log(`📊 Loaded ${existingHashes.size} unique question hashes from local seed.sql.`);
  } else {
    // Write SQL File header
    fs.writeFileSync(SEED_FILE_PATH, `-- Exam Compass Seeding Data\n-- Generated on ${new Date().toISOString()}\n\n`, 'utf-8');
  }

  // Iterate over SYLLABUS_DB
  for (const [subject, topics] of Object.entries(SYLLABUS_DB) as [string, SyllabusTopic[]][]) {
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      console.log(`⏩ Skipping subject: ${subject}`);
      continue;
    }

    console.log(`\n📚 PROCESSING SUBJECT: ${subject}`);
    console.log("============================================================");

    for (const topicData of topics) {
      if (isTestMode && topicsProcessed >= 1) {
        console.log("🧪 Test mode active: stopping after processing 1 topic.");
        return;
      }

      const { id: topicId, topic: topicName, class: className, examPattern } = topicData;

      // Determine Canonical Exam
      let canonicalExam = 'Foundation';
      if (['Class 11', 'Class 12'].includes(className)) {
        if (subject === 'Biology') canonicalExam = 'NEET';
        else if (subject === 'Mathematics') canonicalExam = 'JEE';
        else canonicalExam = 'JEE'; // Physics & Chemistry will generate for JEE and clone for NEET below
      }

      console.log(`\n📌 Topic: [${className}] ${topicName} (Exam: ${canonicalExam})`);

      // Define Difficulty Bands to seed
      const bands = [
        { level: 'Easy', score: 600, band: 'BAND 1 — Recall & Direct Application' },
        { level: 'Medium', score: 1200, band: 'BAND 3 — Two-Step Logical Chain' },
        { level: 'Hard', score: 2000, band: 'BAND 5 — Multi-Concept Synthesis & Advanced Derivation' }
      ];

      for (const bandInfo of bands) {
        console.log(`   ⚡ Generating ${bandInfo.level} question (ELO: ${bandInfo.score})...`);

        // Check if we already have this question type in database file
        // To be safe, let's see if we have an entry matching this exact topic_id + ELO score in seed.sql
        if (fs.existsSync(SEED_FILE_PATH)) {
          const sqlContent = fs.readFileSync(SEED_FILE_PATH, 'utf-8');
          if (sqlContent.includes(`'${topicId}'`) && sqlContent.includes(` ${bandInfo.score},`) && sqlContent.includes(`'${canonicalExam}'`)) {
            console.log(`   ⏭️ Question already exists for ${topicId} at ELO ${bandInfo.score}. Skipping...`);
            continue;
          }
        }

        let questionData: GeneratedQuestion | null = null;
        let success = false;
        let retryCount = 0;

        while (!success && retryCount < 3) {
          try {
            // Step 1: Candidate Generation Prompt
            const systemPrompt = `You are a world-class curator for Indian Competitive Exams (JEE, NEET, Foundation).
Your goal is to produce extremely premium, pedagogically-correct questions for a smart ELO rating system.

Generate one high-fidelity question for:
- Subject: ${subject}
- Class: ${className}
- Topic: ${topicName}
- Target ELO Difficulty: ${bandInfo.level} (Score: ${bandInfo.score})
- Expected Pattern: ${examPattern}
- Exam Category: ${canonicalExam === 'JEE' ? 'JEE Main / Advanced' : canonicalExam}

CRITICAL RULES FOR QUALITY:
1. LaTeX Formatting: All math symbols, equations, matrices, coordinates, or units MUST be wrapped in beautiful LaTeX. Use standard single dollars '$ ... $' for inline math and double dollars '$$ ... $$' for block math.
2. Gorgeous Options: Every multiple-choice question must have 4 distinct, elegant, and challenging options. Options must NEVER be simple placeholders, letters (A, B, C, D), or "None of the above".
3. Accuracy: The correct_answer field MUST match one of the options verbatim, character-for-character.
4. Rich Explanations: The explanation must be a beautiful, comprehensive step-by-step LaTeX derivation showing exactly how to solve the question, including common trap highlights.
5. Error Trap: Classify the trap type under error_trap_type using standard Dot Notation (e.g., 'math.algebra.sign_flip', 'physics.mechanics.unit_mismatch', 'chemistry.stoichiometry.mole_ratio').
6. JSON Strictness: Return ONLY a raw JSON object matching the requested schema. Do not enclose it in any chat conversational preamble.

Return exactly this JSON schema structure:
{
  "question_text": "...",
  "options": ["...", "...", "...", "..."],
  "correct_answer": "...",
  "explanation": "...",
  "rich_explanation": {
    "steps": [{"step": 1, "text": "..."}],
    "misconceptions": [{"wrong_answer": "...", "reason": "..."}]
  },
  "concept_tags": ["...", "..."],
  "error_trap_type": "...",
  "numerical_formula": "...",
  "given_values": {"...": "..."},
  "final_numerical_value": 0.0,
  "final_unit": "..."
}`;

            const genPrompt = `Generate a highly professional, challenging ${bandInfo.level} difficulty question with 4 options on "${topicName}" matching ELO ${bandInfo.score}. Make sure the question represents standard NCERT exemplar / competitive exam caliber.`;

            // Call Cerebras (fast & high limit) or Groq Llama 3.3 70b
            let rawGen = '';
            if (groqRotator.length > 0) {
              rawGen = await callGroqAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: genPrompt }
              ], 'llama-3.3-70b-versatile', true);
            } else {
              rawGen = await callCerebrasAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: genPrompt }
              ], 'llama3.1-8b');
            }

            // Clean json response
            const jsonStart = rawGen.indexOf('{');
            const jsonEnd = rawGen.lastIndexOf('}') + 1;
            if (jsonStart === -1 || jsonEnd === -1) {
              throw new Error("Failed to find valid JSON in LLM generation.");
            }
            const cleanJsonStr = escapeLatexInJson(rawGen.substring(jsonStart, jsonEnd));
            questionData = JSON.parse(cleanJsonStr) as GeneratedQuestion;

            // ─── Validation Layer ───
            if (!questionData.question_text || !questionData.options || questionData.options.length !== 4) {
              throw new Error("Invalid question text or options array length.");
            }

            // Normalization check for correct answer matching options
            let matchedOption = questionData.options.find(
              opt => normalizeStringForComparison(opt) === normalizeStringForComparison(questionData.correct_answer)
            );
            if (!matchedOption) {
              throw new Error(`correct_answer "${questionData.correct_answer}" does not match any of the options: ${JSON.stringify(questionData.options)}`);
            }
            // Set the correct answer to the exact matching option string to ensure verbatim match
            questionData.correct_answer = matchedOption;

            // Step 2: Expert Solver Double Check (Independent solve)
            // We use Groq's llama-3.3-70b-versatile for high intelligence validation
            const solverSystem = `You are an expert academic evaluator for JEE/NEET exams.
Your task is to independently solve the multiple-choice question provided to you.
You are ONLY given the question text and the options list. You must think step-by-step to compute the correct option.
Do not guess. Give a meticulous derivation.

Return your final answer in exactly this JSON format:
{
  "selected_option": "...",
  "derivation": "..."
}
Make sure selected_option matches one of the options verbatim, character-for-character.`;

            const solverUser = `Question: ${questionData.question_text}\nOptions:\n1. ${questionData.options[0]}\n2. ${questionData.options[1]}\n3. ${questionData.options[2]}\n4. ${questionData.options[3]}`;

            const rawSolve = await callGroqAPI([
              { role: 'system', content: solverSystem },
              { role: 'user', content: solverUser }
            ], 'llama-3.3-70b-versatile', true);

            const solveStart = rawSolve.indexOf('{');
            const solveEnd = rawSolve.lastIndexOf('}') + 1;
            if (solveStart === -1 || solveEnd === -1) {
              throw new Error("Failed to find valid JSON in solver response.");
            }
            const cleanSolveStr = escapeLatexInJson(rawSolve.substring(solveStart, solveEnd));
            const solveData = JSON.parse(cleanSolveStr) as any;

            const normCandidate = normalizeStringForComparison(questionData.correct_answer);
            const normSolver = normalizeStringForComparison(solveData.selected_option);

            if (normCandidate !== normSolver) {
              console.warn(`      ❌ Solve mismatch! Candidate: "${questionData.correct_answer}" (norm: "${normCandidate}") | Solver: "${solveData.selected_option}" (norm: "${normSolver}"). Rejecting question.`);
              retryCount++;
              continue;
            }

            // Question has passed all validations!
            success = true;
            console.log(`      ✅ Verified! Question successfully validated and independently solved.`);

          } catch (e: any) {
            console.warn(`      ⚠️ Verification failed: ${e.message}. Retrying candidate generation (Attempt ${retryCount + 1}/3)...`);
            retryCount++;
          }
        }

        if (success && questionData) {
          // Compute Hash & Save
          const questionHash = getQuestionHash(questionData.question_text, questionData.options);

          // Write primary entry
          writeQuestionInsert(
            questionHash,
            canonicalExam,
            className,
            subject,
            topicId,
            topicName,
            bandInfo.score,
            bandInfo.band,
            questionData
          );

          // If subject is Physics or Chemistry and class is 11-12, clone for NEET as well
          if (canonicalExam === 'JEE' && ['Physics', 'Chemistry'].includes(subject)) {
            const neetHash = getQuestionHash(questionData.question_text + ' - NEET', questionData.options);
            writeQuestionInsert(
              neetHash,
              'NEET',
              className,
              subject,
              topicId,
              topicName,
              bandInfo.score,
              bandInfo.band,
              questionData
            );
            console.log(`      🧬 Cloned Physics/Chemistry question successfully to NEET.`);
          }

          // Delay to stay within friendly rate limits
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.error(`      🔴 Critical: Failed to generate a verified question for "${topicName}" [${bandInfo.level}] after 3 retries.`);
        }
      }
      topicsProcessed++;
    }
  }

  console.log("\n🎉 PIPELINE RUN COMPLETED SUCCESSFULLY! seed.sql is updated and ready.");
}

// ─── SQL writer ───
function writeQuestionInsert(
  id: string,
  exam: string,
  classVal: string,
  subject: string,
  topicId: string,
  topic: string,
  elo: number,
  band: string,
  q: GeneratedQuestion
) {
  const optionsStr = JSON.stringify(q.options);
  const richExplStr = JSON.stringify(q.rich_explanation || null);
  const tagsStr = JSON.stringify(q.concept_tags || []);
  const givenValsStr = JSON.stringify(q.given_values || {});

  const insertSql = `INSERT OR IGNORE INTO questions (
    id, exam, class, subject, topic_id, topic, subtopic, type, difficulty_score, difficulty_band,
    question_text, options, correct_answer, explanation, rich_explanation, concept_tags,
    error_trap_type, numerical_formula, given_values, final_numerical_value, final_unit,
    source_exam, confidence, created_at
  ) VALUES (
    '${escapeSql(id)}',
    '${escapeSql(exam)}',
    '${escapeSql(classVal)}',
    '${escapeSql(subject)}',
    '${escapeSql(topicId)}',
    '${escapeSql(topic)}',
    '${escapeSql(q.rich_explanation?.steps?.[0]?.text?.substring(0, 100) || topic)}',
    'MCQ',
    ${elo},
    '${escapeSql(band)}',
    '${escapeSql(q.question_text)}',
    '${escapeSql(optionsStr)}',
    '${escapeSql(q.correct_answer)}',
    '${escapeSql(q.explanation)}',
    '${escapeSql(richExplStr)}',
    '${escapeSql(tagsStr)}',
    '${escapeSql(q.error_trap_type)}',
    '${escapeSql(q.numerical_formula || '')}',
    '${escapeSql(givenValsStr)}',
    ${q.final_numerical_value ?? 'NULL'},
    '${escapeSql(q.final_unit || '')}',
    '${escapeSql(q.source_exam || 'Curated')}',
    0.95,
    '${new Date().toISOString()}'
  );\n\n`;

  fs.appendFileSync(SEED_FILE_PATH, insertSql, 'utf-8');
}

runSeeding().catch(err => {
  console.error("💥 Pipeline Crashed:", err);
  process.exit(1);
});
