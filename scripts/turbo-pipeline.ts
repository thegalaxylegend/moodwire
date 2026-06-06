// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS TURBO-PIPELINE v3.0 — MAXIMUM SPEED + QUALITY
//
// Architecture:
//   • 30+ parallel workers across 8 Cerebras + 6 Gemini + 8 Groq keys
//   • Slot-per-key × model matrix for true parallel API usage
//   • 2-mode: fast_tag (PYQs) + full_curation (stubs)
//   • Strict quality enforcement: Class 8-10 Board, Class 11-12 JEE/NEET
//   • All validation from batch-pipeline.ts (LaTeX, placeholders, duplicates)
//   • Target: 200-300 questions/min
//
// Usage:
//   npx tsx scripts/turbo-pipeline.ts [options]
//   Options:
//     --mode=fast_tag|full_curation  (default: fast_tag)
//     --limit=N                      (default: 99999)
//     --workers=N                    (default: 30)
//     --offset=N                     (default: 0)
//     --batch-size=N                 (default: 10 for fast_tag, 5 for full_curation)
//     --class=8|9|10|11|12           filter by class
//     --exam=JEEMains|NEET|Board     filter by exam
//     --dry-run                      don't write SQL
//     --ignore-processed             reprocess already-done hashes
//     --no-gemini                    skip Gemini (if network-blocked)
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import type { RawQuestion } from './bulk-scraper.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE  = path.join(__dirname, '..', 'scratch', 'raw_questions_cache.jsonl');
const DONE_FILE   = path.join(__dirname, '..', 'scratch', 'processed_hashes.json');
const SEED_FILE   = path.join(__dirname, 'seed.sql');
const REPORT_FILE = path.join(__dirname, '..', 'turbo_pipeline_report.md');
const LIMITS_FILE = path.join(__dirname, '..', 'scratch', 'daily_limits.json');

// ─── CLI Args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg  = (k: string, def = '') => argv.find(a => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? def;
const has  = (k: string) => argv.some(a => a === `--${k}` || a.startsWith(`--${k}=`));

const MODE           = (arg('mode', 'fast_tag')) as 'fast_tag' | 'full_curation';
const LIMIT          = Number(arg('limit', '99999'));
const WORKERS        = Number(arg('workers', '30'));
const OFFSET         = Number(arg('offset', '0'));
const FILTER_CLASS   = arg('class', '');
const FILTER_EXAM    = arg('exam', '');
const DRY_RUN        = has('dry-run');
const IGNORE_PROC    = has('ignore-processed') || has('force');
const NO_GEMINI      = has('no-gemini');
const DEFAULT_BS     = MODE === 'fast_tag' ? 10 : 5;
const BATCH_SIZE     = Number(arg('batch-size', String(DEFAULT_BS)));

// ─── ELO Band Reference (14 bands — embedded in every prompt) ─────────────────
const ELO_BAND_REF = `
ELO BAND TABLE — pick EXACT band_id (14 bands only):
| band_id            | elo_min | elo_max | target exam / class |
|--------------------|---------|---------|---------------------|
| CLASS_8_RECALL     |  700    |  900    | Class 8 Board: single fact, no calc |
| CLASS_9_BASIC      |  900    | 1100    | Class 9 Board: 1-step, direct formula |
| BOARD_EASY         | 1100    | 1400    | Class 10 Board easy/medium, 2-step |
| BOARD_HARD         | 1400    | 1700    | Class 10 Board hard, proof-based |
| NEET_EASY          | 1700    | 1900    | NEET easy: formula recall + substitution |
| JEE_MAINS_EASY     | 1800    | 2050    | JEE Mains easy: single concept, routine calc |
| NEET_MEDIUM        | 1900    | 2100    | NEET medium: 2-concept, tricky trap |
| JEE_MAINS_MEDIUM   | 2050    | 2250    | JEE Mains medium: 2 concepts, 3-step chain |
| NEET_HARD          | 2100    | 2350    | NEET hard: multi-concept, counter-intuitive |
| JEE_MAINS_HARD     | 2250    | 2500    | JEE Mains hard: multi-concept, strong traps |
| JEE_ADV_EASY       | 2400    | 2650    | JEE Adv easy: 2 chapters, clear method |
| JEE_ADV_MEDIUM     | 2600    | 2800    | JEE Adv medium: 3 chapters, non-obvious |
| JEE_ADV_HARD       | 2800    | 3000    | JEE Adv hard: 3-4 chapters, 5+ steps |
| JEE_ADV_EXPERT     | 3000    | 3200    | JEE Adv expert: first-principles derivation |

MANDATORY RULES:
- Class 8 → CLASS_8_RECALL ONLY (700-900)
- Class 9 → CLASS_9_BASIC ONLY (900-1100)
- Class 10 Board → BOARD_EASY or BOARD_HARD max
- Class 11/12 Board → BOARD_HARD max (1700)
- NEET → NEET_EASY / NEET_MEDIUM / NEET_HARD max (2350)
- JEE Mains → JEE_MAINS_EASY to JEE_MAINS_HARD
- JEE Advanced → JEE_ADV_EASY to JEE_ADV_EXPERT`;

// ─── Model Capability Map ─────────────────────────────────────────────────────
const MODEL_CAPS = {
  // CEREBRAS — ultrafast (800-1200 tokens/sec), true parallel
  // Health check: gpt-oss-120b OK (8/8 keys, ~765ms) | zai-glm-4.7 OK (8/8 keys, ~868ms)
  // qwen-3-235b DEAD (all blocked) | llama3.1-8b DEAD (all blocked)
  'cerebras:gpt-oss-120b': { ctx: 32768, maxOut: 4096, quality: 9,  provider: 'cerebras' as const },
  'cerebras:zai-glm-4.7':  { ctx: 32768, maxOut: 4096, quality: 8,  provider: 'cerebras' as const },
  // GEMINI — best quality, ~1840ms latency
  // Health check: gemini-2.5-flash OK (5/6 keys, K1 rate-limited)
  'gemini:gemini-2.5-flash':              { ctx: 100000, maxOut: 8192, quality: 10, provider: 'gemini' as const },
  // GROQ — fast, solid quality
  // Health check: llama-3.3-70b OK (K1-K7, ~846ms) | llama-3.1-8b OK (K1-K6+K8, ~766ms)
  // qwen3-32b DEAD (all keys fail/blocked)
  'groq:llama-3.3-70b-versatile': { ctx: 32768, maxOut: 4096, quality: 9,  provider: 'groq' as const },
  'groq:llama-3.1-8b-instant':    { ctx: 8192,  maxOut: 2048, quality: 6,  provider: 'groq' as const },
} as const;

type ModelKey = keyof typeof MODEL_CAPS;

// ─── Key Pools ────────────────────────────────────────────────────────────────
const ENV = process.env as Record<string, string | undefined>;

const CEREBRAS_KEYS = [
  ENV.CEREBRAS_API_KEY,   ENV.CEREBRAS_API_KEY_2, ENV.CEREBRAS_API_KEY_3, ENV.CEREBRAS_API_KEY_4,
  ENV.CEREBRAS_API_KEY_5, ENV.CEREBRAS_API_KEY_6, ENV.CEREBRAS_API_KEY_7, ENV.CEREBRAS_API_KEY_8,
].filter(Boolean) as string[];

const GEMINI_KEYS = [
  ENV.VITE_GEMINI_API_KEY,   ENV.VITE_GEMINI_API_KEY_2, ENV.VITE_GEMINI_API_KEY_3,
  ENV.VITE_GEMINI_API_KEY_4, ENV.VITE_GEMINI_API_KEY_5, ENV.VITE_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

const GROQ_KEYS = [
  ENV.VITE_GROQ_API_KEY,   ENV.VITE_GROQ_API_KEY_2, ENV.VITE_GROQ_API_KEY_3, ENV.VITE_GROQ_API_KEY_4,
  ENV.VITE_GROQ_API_KEY_5, ENV.VITE_GROQ_API_KEY_6, ENV.VITE_GROQ_API_KEY_7, ENV.VITE_GROQ_API_KEY_8,
].filter(Boolean) as string[];

// ─── Worker Slot Pool ─────────────────────────────────────────────────────────
// Each slot = (provider, model, key) → true independent parallel capacity
interface WorkerSlot {
  id: string;
  modelKey: ModelKey;
  providerKey: string;
  keyIndex: number;
  busy: boolean;
  exhausted: boolean;
  successCount: number;
  failCount: number;
  lastUsedMs: number;
  cooldownUntil: number;
}

function buildWorkerSlots(): WorkerSlot[] {
  const slots: WorkerSlot[] = [];
  const mk = (id: string, modelKey: ModelKey, providerKey: string, keyIndex: number): WorkerSlot =>
    ({ id, modelKey, providerKey, keyIndex, busy: false, exhausted: false,
       successCount: 0, failCount: 0, lastUsedMs: 0, cooldownUntil: 0 });

  // ── CEREBRAS ─────────────────────────────────────────────────────────────
  // Health check confirmed: gpt-oss-120b + zai-glm-4.7 → ALL 8 keys OK (~816ms avg)
  // qwen-3-235b → ALL keys BLOCKED (model dead)
  // llama3.1-8b → ALL keys BLOCKED (model dead)
  for (const model of ['cerebras:gpt-oss-120b', 'cerebras:zai-glm-4.7'] as ModelKey[]) {
    const tag = model.split(':')[1].slice(0, 10);
    for (let ki = 0; ki < CEREBRAS_KEYS.length; ki++)
      slots.push(mk(`CB-${tag}-K${ki+1}`, model, CEREBRAS_KEYS[ki], ki));
  }
  // NOTE: DO NOT add qwen-3-235b or llama3.1-8b — confirmed dead by health check

  // ── GEMINI ───────────────────────────────────────────────────────────────
  // Health check confirmed: gemini-2.5-flash → K2-K6 OK (~1840ms avg), K1 rate-limited
  if (!NO_GEMINI) {
    for (let ki = 0; ki < GEMINI_KEYS.length; ki++)
      slots.push(mk(`GM-flash-K${ki+1}`, 'gemini:gemini-2.5-flash', GEMINI_KEYS[ki], ki));
  }

  // ── GROQ ─────────────────────────────────────────────────────────────────
  // Health check confirmed:
  //   llama-3.3-70b: K1-K7 OK (~846ms avg), K8 BLOCKED
  //   qwen3-32b: K1-K6 HTTP FAIL, K7 BLOCKED, K8 BLOCKED — ALL DEAD, SKIP
  //   llama-3.1-8b: K1-K6+K8 OK (~766ms avg), K7 BLOCKED
  
  // Groq llama-3.3-70b: K1-K7 confirmed working
  for (let ki = 0; ki < Math.min(GROQ_KEYS.length, 7); ki++)
    slots.push(mk(`GQ-llama70b-K${ki+1}`, 'groq:llama-3.3-70b-versatile', GROQ_KEYS[ki], ki));
  
  // Groq llama-3.1-8b: K1-K6 + K8 confirmed working (skip K7=index 6)
  for (const ki of [0,1,2,3,4,5,7]) {
    if (ki >= GROQ_KEYS.length) continue;
    slots.push(mk(`GQ-llama8b-K${ki+1}`, 'groq:llama-3.1-8b-instant', GROQ_KEYS[ki], ki));
  }
  // NOTE: qwen3-32b is dead on all Groq keys — skip entirely

  return slots;
}

// ─── Daily Limits ─────────────────────────────────────────────────────────────
interface DailyLimits { date: string; cerebras: number; gemini: number; groq: number; }
const CEREBRAS_DAILY_MAX = 50000;
const GEMINI_DAILY_MAX   = 12000;
const GROQ_DAILY_MAX     = 20000;

function loadLimits(): DailyLimits {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const d: DailyLimits = JSON.parse(fs.readFileSync(LIMITS_FILE, 'utf-8'));
    if (d.date === today) return d;
  } catch {}
  return { date: today, cerebras: 0, gemini: 0, groq: 0 };
}
function saveLimits(l: DailyLimits) {
  fs.mkdirSync(path.dirname(LIMITS_FILE), { recursive: true });
  fs.writeFileSync(LIMITS_FILE, JSON.stringify(l), 'utf-8');
}

const limits = loadLimits();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep   = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const esc     = (s: any) => String(s ?? '').replace(/'/g, "''");
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
const makeHash = (text: string, opts: string[]) =>
  crypto.createHash('sha256').update((text + opts.join('')).toLowerCase().replace(/\s+/g, '')).digest('hex').slice(0, 32);

function extractJSON(raw: string): any {
  if (!raw) throw new Error('Empty response');
  try { return JSON.parse(raw); } catch {}
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) { try { return JSON.parse(match[1]); } catch {} }
  throw new Error(`Cannot parse JSON: ${raw.slice(0, 120)}`);
}

// ─── Provider Callers ─────────────────────────────────────────────────────────
async function callCerebras(key: string, model: string, prompt: string, maxOut: number): Promise<string> {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_completion_tokens: maxOut,
      response_format: { type: 'json_object' },
    }),
  });
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 401) throw new Error('AUTH_401');
  if (!res.ok) {
    const t = await res.text();
    if (t.includes('does not exist') || t.includes('deprecated') || t.includes('not found'))
      throw new Error('MODEL_DEAD');
    throw new Error(`HTTP_${res.status}`);
  }
  const d: any = await res.json();
  if (d?.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
  const content = d?.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');
  limits.cerebras++; saveLimits(limits);
  return content;
}

async function callGemini(key: string, model: string, prompt: string, maxOut: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(35000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxOut,
          temperature: 0.15,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 }
        },
      }),
    }
  );
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 400) throw new Error('BAD_REQUEST_400');
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const d: any = await res.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error(`EMPTY_GEMINI (finishReason=${d.candidates?.[0]?.finishReason})`);
  try {
    const parsed = extractJSON(text);
    limits.gemini++; saveLimits(limits);
    return JSON.stringify(parsed);
  } catch (e: any) {
    console.error('\n[Gemini Error Details]', {
      finishReason: d.candidates?.[0]?.finishReason,
      textLength: text.length,
      textPreview: text.slice(0, 500),
      fullResponse: JSON.stringify(d).slice(0, 1000)
    });
    throw e;
  }
}

async function callGroq(key: string, model: string, prompt: string, maxOut: number): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: maxOut,
      response_format: { type: 'json_object' },
    }),
  });
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 403) throw new Error('BLOCKED_403');
  if (!res.ok) {
    const t = await res.text();
    if (t.includes('blocked') || t.includes('decommissioned') || t.includes('not found'))
      throw new Error('MODEL_DEAD');
    throw new Error(`HTTP_${res.status}`);
  }
  const d: any = await res.json();
  if (d?.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
  const content = d?.choices?.[0]?.message?.content;
  if (!content) throw new Error('EMPTY_RESPONSE');
  limits.groq++; saveLimits(limits);
  return content;
}

async function callSlot(slot: WorkerSlot, prompt: string, maxOut: number): Promise<string> {
  const { provider } = MODEL_CAPS[slot.modelKey];
  const model = (slot.modelKey as string).split(':').slice(1).join(':');
  if (provider === 'cerebras') return callCerebras(slot.providerKey, model, prompt, maxOut);
  if (provider === 'gemini')   return callGemini(slot.providerKey, model, prompt, maxOut);
  if (provider === 'groq')     return callGroq(slot.providerKey, model, prompt, maxOut);
  throw new Error(`Unknown provider: ${provider}`);
}

// ─── ELO resolution ───────────────────────────────────────────────────────────
const BAND_RANGES: Record<string, [number, number]> = {
  CLASS_8_RECALL:[700,900], CLASS_9_BASIC:[900,1100], BOARD_EASY:[1100,1400], BOARD_HARD:[1400,1700],
  NEET_EASY:[1700,1900], JEE_MAINS_EASY:[1800,2050], NEET_MEDIUM:[1900,2100], JEE_MAINS_MEDIUM:[2050,2250],
  NEET_HARD:[2100,2350], JEE_MAINS_HARD:[2250,2500], JEE_ADV_EASY:[2400,2650], JEE_ADV_MEDIUM:[2600,2800],
  JEE_ADV_HARD:[2800,3000], JEE_ADV_EXPERT:[3000,3200],
};
const BAND_ALIASES: Record<string, string> = {
  BOARD_MEDIUM:'BOARD_HARD', BOARD_VERY_EASY:'BOARD_EASY', CLASS_10_EASY:'BOARD_EASY',
  CLASS_10_MEDIUM:'BOARD_HARD', CLASS_10_HARD:'BOARD_HARD', CLASS_10_BASIC:'BOARD_EASY',
  CLASS_9_EASY:'CLASS_9_BASIC', CLASS_9_MEDIUM:'CLASS_9_BASIC', CLASS_8_BASIC:'CLASS_8_RECALL',
  CLASS_8_EASY:'CLASS_8_RECALL', CLASS_11_BASIC:'JEE_MAINS_EASY', CLASS_11_EASY:'JEE_MAINS_EASY',
  CLASS_11_MEDIUM:'JEE_MAINS_MEDIUM', CLASS_12_EASY:'JEE_MAINS_EASY', CLASS_12_MEDIUM:'JEE_MAINS_MEDIUM',
  CLASS_12_HARD:'JEE_MAINS_HARD', NEET_BASIC:'NEET_EASY', JEE_EASY:'JEE_MAINS_EASY',
  JEE_MEDIUM:'JEE_MAINS_MEDIUM', JEE_HARD:'JEE_MAINS_HARD', JEE_ADVANCED_EASY:'JEE_ADV_EASY',
  JEE_ADVANCED_MEDIUM:'JEE_ADV_MEDIUM', JEE_ADVANCED_HARD:'JEE_ADV_HARD',
};

function resolveElo(band?: string, elo?: number, exam = 'JEEMains', cls = '12') {
  const resolved = band ? (BAND_ALIASES[band] || band) : undefined;
  if (resolved && BAND_RANGES[resolved]) {
    const [lo, hi] = BAND_RANGES[resolved];
    return { elo: (elo && elo >= lo && elo <= hi) ? elo : Math.round((lo+hi)/2), band: resolved };
  }
  if (elo && elo > 0 && elo < 4000) {
    const entry = Object.entries(BAND_RANGES).find(([,[lo,hi]]) => elo >= lo && elo <= hi);
    if (entry) return { elo, band: entry[0] };
  }
  const defaults: Record<string, string> = {
    JEEAdvanced:'JEE_ADV_MEDIUM', JEEMains:'JEE_MAINS_MEDIUM', NEET:'NEET_MEDIUM', Board:'BOARD_EASY'
  };
  const base = defaults[exam] || 'BOARD_EASY';
  const [lo, hi] = BAND_RANGES[base];
  return { elo: Math.round((lo+hi)/2), band: base };
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────
function buildFastTagPrompt(stubs: RawQuestion[], modelKey: ModelKey): string {
  const n = stubs.length;
  const isSmall = MODEL_CAPS[modelKey].ctx <= 8192;

  if (isSmall && n > 1) {
    // For small-ctx models: only 1 question
    const q = stubs[0];
    return `Classify this exam question. Return JSON: {"results":[1 object]}
Fields needed: primary_topic,primary_subtopic,primary_topic_id(slug),secondary_topic_ids[],concept_tags[3-6],cross_chapter(0/1),cross_subject(0/1),also_for[],subject,class,exam,difficulty_band,elo,step_count,key_formula,error_trap_type
${ELO_BAND_REF}
QUESTION: ${q.raw_text.slice(0, 400)}
OPTIONS: ${q.raw_options?.slice(0, 4).join(' | ').slice(0, 200) || 'N/A'}
HINT: ${q.subject || '?'} ${q.exam || '?'} Class${q.class || '?'}`;
  }

  return `You are ExamCompass Classifier. Classify ${n} exam questions below.
Return JSON: {"results":[${n} objects in EXACT same order as input]}

CRITICAL: DO NOT solve the math/science questions step-by-step. Do NOT perform any calculations. Just perform tag classification directly. Keep reasoning to an absolute minimum (under 50 words).

Each object MUST have ALL these fields:
- primary_topic: canonical chapter name (e.g. "Electrostatics", "Kinematics")
- primary_subtopic: specific concept tested
- primary_topic_id: slug (e.g. "phy_12_jm_electrostatics")
- secondary_topic_ids: [] or [slugs] if cross-chapter
- concept_tags: 3-8 fine-grained concept strings
- cross_chapter: 1 if spans 2+ chapters, else 0
- cross_subject: 1 if spans 2+ subjects, else 0
- also_for: [] or ["NEET","Board"] if applicable
- subject: "Physics"|"Chemistry"|"Mathematics"|"Biology"|"Science"|"Social"
- class: "8"|"9"|"10"|"11"|"12"
- exam: "JEEMains"|"JEEAdvanced"|"NEET"|"Board"
- difficulty_band: exact band_id from table
- elo: integer within band range
- step_count: 1-6
- key_formula: primary formula or ""
- error_trap_type: e.g. "physics.electrostatics.sign_flip"

CLASS-LEVEL ACCURACY IS CRITICAL:
- If question mentions "Class 8" or basic science (no algebra) → class="8", exam="Board", band=CLASS_8_RECALL
- If question mentions "Class 9" or 1-step formula → class="9", exam="Board", band=CLASS_9_BASIC  
- If question is Class 10 CBSE level → class="10", exam="Board", band=BOARD_EASY or BOARD_HARD
- If JEE Mains level (Class 11/12) → class="11" or "12", exam="JEEMains"
- If NEET level (Biology/Medical) → exam="NEET"

${ELO_BAND_REF}

QUESTIONS TO CLASSIFY (${n} items):
${stubs.map((q, i) => `[${i+1}] ${q.raw_text.slice(0, 300)}
   Options: ${q.raw_options?.slice(0, 4).join(' | ').slice(0, 200) || 'N/A'}
   Hint: ${[q.subject, q.exam, q.class ? `Class${q.class}` : ''].filter(Boolean).join(' ')}`).join('\n---\n')}`;
}

function buildCurationPrompt(stubs: RawQuestion[], modelKey: ModelKey): string {
  const n = stubs.length;
  const isSmall = MODEL_CAPS[modelKey].ctx <= 8192;

  if (isSmall && n > 1) {
    const q = stubs[0];
    return `Generate 1 complete exam question. Return JSON: {"results":[1 object]}
Fields: question_text,type(MCQ/Multi-correct/Integer),options(4-array or []),correct_answer,explanation,solution_steps[2-3],primary_topic,primary_subtopic,primary_topic_id,secondary_topic_ids[],concept_tags[],cross_chapter,cross_subject,also_for[],subject,class,exam,difficulty_band,elo,step_count,key_formula,error_trap_type
${ELO_BAND_REF}
STUB: ${q.raw_text}`;
  }

  return `You are ExamCompass Senior Curator. Generate COMPLETE verified exam questions from topic stubs.
Return JSON: {"results":[${n} objects in SAME ORDER as stubs]}

REQUIRED FIELDS per question:
- question_text: Complete, unambiguous question. Use $...$  inline LaTeX, $$...$$ for block. Must be curriculum-accurate.
- type: "MCQ"|"Multi-correct"|"Integer"
  • MCQ: 4 options, single correct (default for ALL exams)
  • Multi-correct: JEE Advanced ONLY, 1–4 correct options (~30% of JEE Adv Qs)
  • Integer: Numeric answer 0–99 — JEE Mains Section B ONLY (~20%)
- options: 4 strings for MCQ/Multi-correct; [] for Integer
  • Options MUST be numerically/conceptually DISTINCT (no 2 same)
  • Include 3 plausible wrong answers (common mistakes: sign errors, unit errors, wrong formula)
  • Keep each option under 60 characters
- correct_answer: exact verbatim option text (MCQ) | JSON array string (Multi-correct) | numeric string (Integer)
- explanation: ≤ 120 chars, concise summary of solution method
- solution_steps: exactly 2–4 short strings (each ≤ 80 chars)
- primary_topic: canonical chapter name
- primary_subtopic: specific concept tested
- primary_topic_id: slug like "phy_12_jm_em_induction"
- secondary_topic_ids: [] or [slugs] if cross-chapter
- concept_tags: 3-8 specific concept strings
- cross_chapter: 1 if uses 2+ chapters
- cross_subject: 0 usually
- also_for: [] or ["NEET"] or ["Board"]
- subject: "Physics"|"Chemistry"|"Mathematics"|"Biology"|"Science"|"Social"
- class: "8"|"9"|"10"|"11"|"12"
- exam: "JEEMains"|"JEEAdvanced"|"NEET"|"Board"
- difficulty_band: exact band_id from table
- elo: integer in band range
- step_count: 1-6
- key_formula: primary formula or ""
- error_trap_type: e.g. "physics.em.sign_flip"

QUALITY REQUIREMENTS:
- Class 8/9/10 questions MUST be curriculum-appropriate (NCERT level), no advanced topics
- JEE questions MUST require actual calculation or multi-step reasoning
- NEET questions MUST be Biology/Physics/Chemistry at NEET syllabus level
- Numerical values MUST be physically realistic
- NO placeholder text, NO "lorem ipsum", NO "TODO"

${ELO_BAND_REF}

STUBS (${n} questions):
${stubs.map((q, i) => `[${i+1}] ${q.raw_text}`).join('\n')}`;
}

// ─── Strict Quality Validation ────────────────────────────────────────────────
function validateRaw(raw: any, idx: number): string[] {
  const errors: string[] = [];
  const t: string = raw?.type || 'MCQ';

  // Question text checks
  const qText = String(raw?.question_text || '').trim();
  if (qText.length < 10) errors.push(`Q${idx}: question too short (${qText.length} chars)`);

  // Placeholder/garbage text detection
  const qLower = qText.toLowerCase();
  for (const bad of ['placeholder','lorem ipsum','todo','insert question','[question]','xxx','tbd']) {
    if (qLower.includes(bad)) { errors.push(`Q${idx}: garbage text "${bad}" in question`); break; }
  }

  // LaTeX parity check (unclosed $$)
  const qDoubleDollar = (raw?.question_text || '').match(/\$\$/g)?.length || 0;
  const eDoubleDollar = (raw?.explanation || '').match(/\$\$/g)?.length || 0;
  if ((qDoubleDollar + eDoubleDollar) % 2 !== 0)
    errors.push(`Q${idx}: unclosed LaTeX $$ block`);

  // MCQ-specific
  if (t === 'MCQ') {
    if (!Array.isArray(raw?.options) || raw.options.length < 4)
      errors.push(`Q${idx}: MCQ needs 4 options, got ${raw?.options?.length ?? 0}`);
    else {
      // Duplicate options
      const norm = raw.options.map((o: any) => String(o).toLowerCase().trim());
      if (new Set(norm).size < raw.options.length)
        errors.push(`Q${idx}: duplicate options detected`);

      // Placeholder options
      for (const opt of raw.options) {
        const o = String(opt).trim();
        if (/^[A-Da-d]$/.test(o) || o.toLowerCase().match(/^option [abcd]$/))
          errors.push(`Q${idx}: placeholder option "${o}"`);
      }

      // Correct answer must be in options
      const ca = String(raw?.correct_answer || '').trim().toLowerCase();
      const inOptions = raw.options.some((o: any) =>
        String(o).trim().toLowerCase() === ca ||
        String(o).trim().toLowerCase().replace(/[^a-z0-9]/g, '') === ca.replace(/[^a-z0-9]/g, '')
      );
      const isLetter = /^[A-Da-d]$/.test(String(raw?.correct_answer || '').trim());
      if (!inOptions && !isLetter)
        errors.push(`Q${idx}: MCQ correct_answer not in options`);
    }
  }

  // Multi-correct
  if (t === 'Multi-correct') {
    if (!Array.isArray(raw?.options) || raw.options.length < 4)
      errors.push(`Q${idx}: Multi-correct needs 4 options`);
    let corrects: string[] = [];
    const ca = raw?.correct_answer;
    if (Array.isArray(ca)) corrects = ca.map(String);
    else try { corrects = JSON.parse(String(ca || '[]')); } catch {}
    if (!corrects.length) errors.push(`Q${idx}: Multi-correct: no correct answers`);
  }

  // Integer
  if (t === 'Integer') {
    const val = String(raw?.correct_answer ?? '');
    if (!val && val !== '0') errors.push(`Q${idx}: Integer needs correct_answer`);
    else if (isNaN(parseFloat(val))) errors.push(`Q${idx}: Integer answer not numeric`);
  }

  // Explanation
  const expl = String(raw?.explanation || '').trim();
  if (expl.length < 5) errors.push(`Q${idx}: explanation too short`);

  // Field validation
  const validExams = ['JEEMains','JEEAdvanced','NEET','Board'];
  const validCls   = ['8','9','10','11','12'];
  const validSubj  = ['Physics','Chemistry','Mathematics','Biology','Science','Social'];
  if (raw?.exam && !validExams.includes(raw.exam)) errors.push(`Q${idx}: invalid exam "${raw.exam}"`);
  if (raw?.class && !validCls.includes(String(raw.class))) errors.push(`Q${idx}: invalid class "${raw.class}"`);
  if (raw?.subject && !validSubj.includes(raw.subject)) errors.push(`Q${idx}: invalid subject "${raw.subject}"`);

  return errors;
}

// ─── ProcessedQ type & builders ───────────────────────────────────────────────
interface ProcessedQ {
  id: string; exam: string; class: string; subject: string;
  primary_topic_id: string; primary_topic: string; primary_subtopic: string;
  secondary_topic_ids: string[]; concept_tags: string[]; cross_chapter: number;
  cross_subject: number; also_for: string[]; type: string; has_image: number;
  elo: number; band: string; step_count: number; negative_marking: number;
  question_text: string; options: string[]; correct_answer: string;
  explanation: string; solution_steps: string[]; key_formula: string;
  error_trap_type: string; source_exam: string; year: number | null;
  quality_tier: string; confidence: number;
}

function buildFromFastTag(raw: any, stub: RawQuestion): ProcessedQ | null {
  try {
    const exam    = raw?.exam || stub.exam || 'JEEMains';
    const cls     = String(raw?.class || stub.class?.replace('Class ', '') || '12');
    const subject = raw?.subject || stub.subject || 'Physics';
    const { elo, band } = resolveElo(raw?.difficulty_band, raw?.elo, exam, cls);

    const options: string[] = Array.isArray(stub.raw_options) ? stub.raw_options.slice(0, 4) : [];
    let correct = String(stub.raw_answer ?? '');

    // Resolve letter answers (A/B/C/D → option text)
    if (/^[A-Da-d]$/.test(correct.trim()) && options.length) {
      const idx = 'ABCDabcd'.indexOf(correct.trim()) % 4;
      correct = options[idx] || correct;
    }

    const topicId = raw?.primary_topic_id ||
      `${slugify(subject)}_${cls}_${slugify(exam)}_${slugify(raw?.primary_topic || 'general')}`;

    let negMark = -1.0;
    if (exam === 'JEEAdvanced') negMark = -2.0;
    if (exam === 'Board') negMark = 0.0;

    return {
      id: makeHash(stub.raw_text, options),
      exam, class: cls, subject,
      primary_topic_id: topicId,
      primary_topic: raw?.primary_topic || 'General',
      primary_subtopic: raw?.primary_subtopic || 'General',
      secondary_topic_ids: Array.isArray(raw?.secondary_topic_ids) ? raw.secondary_topic_ids : [],
      concept_tags: Array.isArray(raw?.concept_tags) ? raw.concept_tags : [],
      cross_chapter: raw?.cross_chapter === 1 ? 1 : 0,
      cross_subject: raw?.cross_subject === 1 ? 1 : 0,
      also_for: Array.isArray(raw?.also_for) ? raw.also_for : [],
      type: 'MCQ', has_image: 0, elo, band,
      step_count: Number(raw?.step_count) || 1,
      negative_marking: negMark,
      question_text: stub.raw_text,
      options, correct_answer: correct,
      explanation: 'Verified from official exam paper.',
      solution_steps: [],
      key_formula: raw?.key_formula || '',
      error_trap_type: raw?.error_trap_type || 'general.exam_trap',
      source_exam: stub.source_exam || 'AI-Generated',
      year: stub.year || null,
      quality_tier: stub.quality === 'verified' ? 'A' : 'C',
      confidence: stub.quality === 'verified' ? 0.95 : 0.87,
    };
  } catch { return null; }
}

function buildFromCuration(raw: any, stub: RawQuestion): ProcessedQ | null {
  try {
    const qText = String(raw?.question_text || '').trim();
    if (!qText || qText.length < 10) return null;
    if (!raw?.explanation || String(raw.explanation).trim().length < 5) return null;

    const t: string = ['MCQ','Multi-correct','Integer'].includes(raw?.type) ? raw.type : 'MCQ';
    const exam    = raw?.exam || stub.exam || 'JEEMains';
    const cls     = String(raw?.class || stub.class?.replace('Class ', '') || '12');
    const subject = raw?.subject || stub.subject || 'Physics';
    const { elo, band } = resolveElo(raw?.difficulty_band, raw?.elo, exam, cls);

    const options: string[] = t === 'Integer' ? [] :
      Array.isArray(raw?.options) ? raw.options.slice(0, 4) : ['—','—','—','—'];
    let correct = String(raw?.correct_answer ?? '');

    if (t === 'MCQ' && /^[A-Da-d]$/.test(correct.trim()) && options.length) {
      const idx = 'ABCDabcd'.indexOf(correct.trim()) % 4;
      correct = options[idx] || correct;
    }
    if (t === 'MCQ' && options.length && !options.map(o => o.trim().toLowerCase()).includes(correct.trim().toLowerCase())) {
      // fuzzy match
      const cleanCorrect = correct.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const found = options.find(o => o.replace(/[^a-z0-9]/gi, '').toLowerCase() === cleanCorrect);
      if (!found) return null; // reject if can't resolve
      correct = found;
    }
    if (t === 'Multi-correct' && Array.isArray(raw?.correct_answer))
      correct = JSON.stringify(raw.correct_answer.map(String));
    if (t === 'Integer' && isNaN(parseFloat(correct))) return null;

    let negMark = -1.0;
    if (exam === 'JEEAdvanced') negMark = -2.0;
    if (exam === 'JEEMains' && t === 'Integer') negMark = 0.0;
    if (exam === 'Board') negMark = 0.0;

    const topicId = raw?.primary_topic_id ||
      `${slugify(subject)}_${cls}_${slugify(exam)}_${slugify(raw?.primary_topic || 'general')}`;

    return {
      id: makeHash(qText, options),
      exam, class: cls, subject,
      primary_topic_id: topicId,
      primary_topic: raw?.primary_topic || 'General',
      primary_subtopic: raw?.primary_subtopic || 'General',
      secondary_topic_ids: Array.isArray(raw?.secondary_topic_ids) ? raw.secondary_topic_ids : [],
      concept_tags: Array.isArray(raw?.concept_tags) ? raw.concept_tags : [],
      cross_chapter: raw?.cross_chapter === 1 ? 1 : 0,
      cross_subject: raw?.cross_subject === 1 ? 1 : 0,
      also_for: Array.isArray(raw?.also_for) ? raw.also_for : [],
      type: t, has_image: 0, elo, band,
      step_count: Number(raw?.step_count) || (elo >= 2600 ? 4 : elo >= 2000 ? 2 : 1),
      negative_marking: negMark,
      question_text: qText, options, correct_answer: correct,
      explanation: raw.explanation,
      solution_steps: Array.isArray(raw?.solution_steps) ? raw.solution_steps : [],
      key_formula: raw?.key_formula || '',
      error_trap_type: raw?.error_trap_type || 'general.exam_trap',
      source_exam: stub.source_exam || 'AI-Generated',
      year: stub.year || null,
      quality_tier: 'C', confidence: 0.87,
    };
  } catch { return null; }
}

// ─── SQL Writer ───────────────────────────────────────────────────────────────
function writeSql(q: ProcessedQ): void {
  if (DRY_RUN) return;
  const sql = `INSERT OR IGNORE INTO questions (
  id,exam,class,subject,primary_topic_id,primary_topic,primary_subtopic,
  secondary_topic_ids,concept_tags,cross_chapter,cross_subject,also_for,
  type,has_image,difficulty_score,difficulty_band,step_count,negative_marking,
  question_text,options,correct_answer,explanation,solution_steps,key_formula,
  error_trap_type,source_exam,year,quality_tier,confidence,created_at,verified
) VALUES (
  '${esc(q.id)}','${esc(q.exam)}','${esc(q.class)}','${esc(q.subject)}',
  '${esc(q.primary_topic_id)}','${esc(q.primary_topic)}','${esc(q.primary_subtopic)}',
  '${esc(JSON.stringify(q.secondary_topic_ids))}','${esc(JSON.stringify(q.concept_tags))}',
  ${q.cross_chapter},${q.cross_subject},'${esc(JSON.stringify(q.also_for))}',
  '${esc(q.type)}',${q.has_image},${q.elo},'${esc(q.band)}',${q.step_count},${q.negative_marking},
  '${esc(q.question_text)}','${esc(JSON.stringify(q.options))}','${esc(q.correct_answer)}',
  '${esc(q.explanation)}','${esc(JSON.stringify(q.solution_steps))}','${esc(q.key_formula)}',
  '${esc(q.error_trap_type)}','${esc(q.source_exam)}',${q.year ?? 'NULL'},
  '${esc(q.quality_tier)}',${q.confidence},'${new Date().toISOString()}',0
);
`;
  fs.appendFileSync(SEED_FILE, sql, 'utf-8');
}

// ─── Smart Slot Picker ────────────────────────────────────────────────────────
function pickSlot(slots: WorkerSlot[], provider?: string): WorkerSlot | null {
  const now = Date.now();
  const available = slots.filter(s => !s.busy && !s.exhausted && s.cooldownUntil <= now);
  if (available.length === 0) return null;

  return available
    .filter(s => provider ? MODEL_CAPS[s.modelKey].provider === provider : true)
    .sort((a, b) => {
      // Prefer higher quality
      const qa = MODEL_CAPS[a.modelKey].quality;
      const qb = MODEL_CAPS[b.modelKey].quality;
      if (qa !== qb) return qb - qa;
      // Then least recently used
      return a.lastUsedMs - b.lastUsedMs;
    })[0] ?? (provider ? pickSlot(slots) : null); // fallback to any provider
}

// ─── Process a batch using a specific slot ────────────────────────────────────
async function processWithSlot(
  slot: WorkerSlot,
  stubs: RawQuestion[],
  mode: 'fast_tag' | 'full_curation'
): Promise<ProcessedQ[]> {
  const caps = MODEL_CAPS[slot.modelKey];
  const { provider } = caps;

  // Check daily limits
  if (provider === 'cerebras' && limits.cerebras >= CEREBRAS_DAILY_MAX) throw new Error('CEREBRAS_DAILY_MAX');
  if (provider === 'gemini'   && limits.gemini   >= GEMINI_DAILY_MAX)   throw new Error('GEMINI_DAILY_MAX');
  if (provider === 'groq'     && limits.groq      >= GROQ_DAILY_MAX)    throw new Error('GROQ_DAILY_MAX');

  // Small ctx models: process 1 stub at a time
  const batchSize = caps.ctx <= 8192 ? 1 : stubs.length;
  const maxOut    = Math.min(caps.maxOut, mode === 'fast_tag' ? 4000 : 5000);

  const results: ProcessedQ[] = [];

  for (let i = 0; i < stubs.length; i += batchSize) {
    const chunk  = stubs.slice(i, i + batchSize);
    const prompt = mode === 'fast_tag'
      ? buildFastTagPrompt(chunk, slot.modelKey)
      : buildCurationPrompt(chunk, slot.modelKey);

    const raw    = await callSlot(slot, prompt, maxOut);
    const parsed = extractJSON(raw);
    const items  = parsed?.results ?? (Array.isArray(parsed) ? parsed : [parsed]);

    for (let j = 0; j < items.length && j < chunk.length; j++) {
      const item = items[j];
      if (!item) continue;

      const q = mode === 'fast_tag'
        ? buildFromFastTag(item, chunk[j])
        : buildFromCuration(item, chunk[j]);

      if (!q) continue;

      // Strict validation on the final constructed object
      const errs = validateRaw(q, j + 1);
      if (errs.length > 0) {
        // Log but still try to keep if it's minor (e.g. band alias)
        const fatal = errs.filter(e => !e.includes('invalid exam') && !e.includes('invalid class') && !e.includes('invalid subject'));
        if (fatal.length > 0) {
          totalValidErr++;
          continue; // skip invalid
        }
      }

      results.push(q);
    }
  }

  return results;
}

// ─── Progress Display ─────────────────────────────────────────────────────────
let totalOk = 0, totalSkipped = 0, totalAttempted = 0, totalValidErr = 0;
let startMs = Date.now();
let activeWorkers = 0;

function printProgress(total: number) {
  const elapsed = (Date.now() - startMs) / 1000 / 60;
  const qpm     = elapsed > 0 ? totalOk / elapsed : 0;
  const pct     = total > 0 ? Math.min(100, totalAttempted / total * 100) : 0;
  const filled  = Math.round(pct / 5);
  const bar     = '█'.repeat(filled) + '░'.repeat(20 - filled);
  const eta     = qpm > 0 ? `${Math.round((total - totalAttempted) / qpm)}m` : '?';
  process.stdout.write(
    `\r  [${bar}] ${pct.toFixed(0).padStart(3)}% | ✅${totalOk} ❌${totalSkipped} ⚠️${totalValidErr} | ${qpm.toFixed(0)} q/min | W:${activeWorkers} | ETA:${eta}   `
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const slots = buildWorkerSlots();
  const totalSlots = slots.length;

  console.log('═'.repeat(72));
  console.log('🚀 EXAMCOMPASS TURBO-PIPELINE v3.0 — MAXIMUM SPEED + QUALITY');
  console.log('─'.repeat(72));
  console.log(`   Mode:      ${MODE} | DryRun: ${DRY_RUN} | Workers: ${WORKERS}`);
  console.log(`   Keys:      Cerebras:${CEREBRAS_KEYS.length} | Gemini:${GEMINI_KEYS.length} | Groq:${GROQ_KEYS.length}`);
  console.log(`   Slots:     ${totalSlots} parallel (${slots.filter(s => s.modelKey.includes('cerebras')).length} Cerebras, ${slots.filter(s => s.modelKey.includes('gemini')).length} Gemini, ${slots.filter(s => s.modelKey.includes('groq')).length} Groq)`);
  console.log(`   Daily:     Cerebras:${limits.cerebras}/${CEREBRAS_DAILY_MAX} | Gemini:${limits.gemini}/${GEMINI_DAILY_MAX} | Groq:${limits.groq}/${GROQ_DAILY_MAX}`);
  console.log('═'.repeat(72) + '\n');

  if (!fs.existsSync(CACHE_FILE)) {
    console.error(`❌ Cache not found: ${CACHE_FILE}`);
    console.log('   Run: npx tsx scripts/distribution-manager.ts --stubs=5000');
    process.exit(1);
  }

  // Load processed hashes (guard against corrupt file)
  let doneHashArray: string[] = [];
  if (fs.existsSync(DONE_FILE)) {
    try { doneHashArray = JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8')); }
    catch { console.warn('⚠️  processed_hashes.json is corrupt — starting fresh'); }
  }
  const doneHashes = new Set<string>(doneHashArray);

  // Load cache
  let allRaw: RawQuestion[] = fs.readFileSync(CACHE_FILE, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean)
    .slice(OFFSET);

  if (FILTER_CLASS) allRaw = allRaw.filter(q => (q.class || '').includes(FILTER_CLASS));
  if (FILTER_EXAM)  allRaw = allRaw.filter(q => q.exam === FILTER_EXAM);

  // Filter by mode
  const eligible = allRaw
    .filter(q => IGNORE_PROC ? true : !doneHashes.has(q.hash))
    .filter(q => MODE === 'fast_tag' ? q.quality === 'verified' : q.quality === 'raw')
    .slice(0, LIMIT);

  console.log(`📦 Cache: ${allRaw.length} | Eligible: ${eligible.length} | Target: ${Math.min(LIMIT, eligible.length)}`);
  if (eligible.length === 0) {
    console.log('\n✅ Nothing to process!');
    if (MODE === 'fast_tag')
      console.log('   No verified PYQs in cache. Run: npx tsx scripts/bulk-scraper.ts --source=jee-mains');
    else
      console.log('   No raw stubs in cache. Run: npx tsx scripts/distribution-manager.ts --stubs=5000');
    return;
  }

  if (!DRY_RUN) {
    if (!fs.existsSync(SEED_FILE))
      fs.writeFileSync(SEED_FILE, `-- ExamCompass Seed\n-- Turbo-Pipeline v3.0 ${new Date().toISOString()}\n\n`, 'utf-8');
  }

  // Build task queue (chunks of BATCH_SIZE stubs each)
  const queue: RawQuestion[][] = [];
  for (let i = 0; i < eligible.length; i += BATCH_SIZE)
    queue.push(eligible.slice(i, i + BATCH_SIZE));

  console.log(`\n🔄 Queue: ${queue.length} batches × ${BATCH_SIZE} stubs | ${Math.min(WORKERS, totalSlots)} active workers`);
  console.log('─'.repeat(72));

  startMs = Date.now();
  let queueIdx = 0;
  const requeuedBatches: RawQuestion[][] = []; // safe re-queue (avoids shared-state race condition)

  async function worker(wid: number): Promise<void> {
    while (queueIdx < queue.length || requeuedBatches.length > 0) {
      // Drain requeued batches first
      let batch: RawQuestion[] | undefined;
      if (requeuedBatches.length > 0) {
        batch = requeuedBatches.shift()!;
      } else {
        const myIdx = queueIdx++;
        if (myIdx >= queue.length) break;
        batch = queue[myIdx];
      }

      // Pick best available slot
      let slot = pickSlot(slots);
      if (!slot) {
        // All slots busy — wait briefly then retry
        await sleep(300);
        slot = pickSlot(slots);
        if (!slot) {
          // All truly exhausted — put this batch back at a safe index and wait
          // Use a local buffer instead of mutating shared queueIdx to avoid race conditions
          requeuedBatches.push(batch);
          await sleep(2000);
          continue;
        }
      }

      slot.busy = true;
      slot.lastUsedMs = Date.now();
      activeWorkers++;

      try {
        const results = await processWithSlot(slot, batch, MODE);

        if (!DRY_RUN) {
          for (const q of results) writeSql(q);
          for (const raw of batch) doneHashes.add(raw.hash);
          // Persist every 50 completions (but not on 0)
          if (totalOk > 0 && totalOk % 50 === 0)
            fs.writeFileSync(DONE_FILE, JSON.stringify([...doneHashes]), 'utf-8');
        }

        totalOk       += results.length;
        totalSkipped  += Math.max(0, batch.length - results.length);
        totalAttempted += batch.length;
        slot.successCount++;

      } catch (e: any) {
        const msg = e.message || '';

        if (msg === 'RATE_LIMIT_429') {
          // Cool down this slot for 60s, re-queue batch
          slot.cooldownUntil = Date.now() + 60000;
          queueIdx = myIdx; // re-queue
          process.stdout.write(`\n  ⚡ ${slot.id}: 429 rate-limit, cooling 60s\n`);

        } else if (msg === 'BLOCKED_403') {
          slot.exhausted = true;
          queueIdx = myIdx;
          process.stdout.write(`\n  🚫 ${slot.id}: 403 blocked (exhausted)\n`);

        } else if (msg === 'MODEL_DEAD') {
          slot.exhausted = true;
          queueIdx = myIdx;
          process.stdout.write(`\n  💀 ${slot.id}: model deprecated/dead\n`);

        } else if (msg.includes('CEREBRAS_DAILY_MAX') || msg.includes('GEMINI_DAILY_MAX') || msg.includes('GROQ_DAILY_MAX')) {
          slot.exhausted = true;
          process.stdout.write(`\n  📊 ${slot.id}: daily limit reached\n`);
          totalSkipped  += batch.length;
          totalAttempted += batch.length;

        } else if (msg === 'TRUNCATED' && batch.length > 1) {
          // Re-insert as smaller batches
          const half = Math.ceil(batch.length / 2);
          queue.splice(queueIdx, 0,
            batch.slice(0, half),
            batch.slice(half)
          );
          process.stdout.write(`\n  ✂️  ${slot.id}: truncated, splitting batch ${myIdx+1}\n`);

        } else {
          slot.failCount++;
          totalSkipped  += batch.length;
          totalAttempted += batch.length;
          process.stdout.write(`\n  ❌ ${slot.id}: error: ${msg}\n`);
          if (slot.failCount >= 5) {
            slot.exhausted = true;
            process.stdout.write(`\n  ⛔ ${slot.id}: too many failures (${slot.failCount})\n`);
          }
        }

      } finally {
        slot.busy = false;
        activeWorkers = Math.max(0, activeWorkers - 1);
        printProgress(eligible.length);
      }
    }
  }

  // Launch N workers
  const numWorkers = Math.min(WORKERS, queue.length, totalSlots);
  await Promise.all(Array.from({ length: numWorkers }, (_, i) => worker(i)));

  // Final done-hashes persist
  if (!DRY_RUN)
    fs.writeFileSync(DONE_FILE, JSON.stringify([...doneHashes]), 'utf-8');

  // ─── Report ────────────────────────────────────────────────────────────────
  const elapsed    = ((Date.now() - startMs) / 1000).toFixed(1);
  const rate       = totalOk / (Number(elapsed) / 60);
  const activeList = slots.filter(s => s.successCount > 0)
    .map(s => `${s.id}(${s.successCount})`);

  console.log('\n\n' + '═'.repeat(72));
  console.log(`✅ DONE! ${totalOk} questions | ${totalSkipped} skipped | ${totalValidErr} validation fails`);
  console.log(`   Speed: ${rate.toFixed(0)} q/min | Time: ${elapsed}s`);
  console.log(`   API → Cerebras:${limits.cerebras} | Gemini:${limits.gemini} | Groq:${limits.groq}`);
  console.log(`   Active slots: ${activeList.slice(0, 10).join(', ')}${activeList.length > 10 ? '...' : ''}`);
  console.log('═'.repeat(72));

  const report = `# Turbo Pipeline v3.0 Report
Generated: ${new Date().toLocaleString()}
Mode: ${MODE} | Workers: ${numWorkers} | DryRun: ${DRY_RUN}

| Metric | Value |
|--------|-------|
| ✅ Generated | **${totalOk}** |
| ❌ Skipped | ${totalSkipped} |
| ⚠️ Validation Fails | ${totalValidErr} |
| Speed | **${rate.toFixed(0)} q/min** |
| Time | ${elapsed}s |
| Cerebras calls | ${limits.cerebras} / ${CEREBRAS_DAILY_MAX} |
| Gemini calls | ${limits.gemini} / ${GEMINI_DAILY_MAX} |
| Groq calls | ${limits.groq} / ${GROQ_DAILY_MAX} |

## Active Slots (${activeList.length})
${activeList.map(s => `- ${s}`).join('\n')}
`;
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\n📄 Report: ${REPORT_FILE}`);
  if (!DRY_RUN) console.log(`💾 SQL: ${SEED_FILE}`);
}

main().catch(e => { console.error('\n💥 FATAL:', e.message); process.exit(1); });
