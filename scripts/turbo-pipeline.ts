// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS TURBO-PIPELINE v1.0 — MAXIMUM SPEED + ACCURACY
// Architecture: Parallel worker pool, smart model routing, full key rotation
//   across 8 Cerebras + 6 Gemini + 8 Groq keys simultaneously
//
// Usage: npx tsx scripts/turbo-pipeline.ts [--limit=2000] [--workers=20]
// ═══════════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import type { RawQuestion } from './bulk-scraper.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', 'scratch', 'raw_questions_cache.jsonl');
const DONE_FILE  = path.join(__dirname, '..', 'scratch', 'processed_hashes.json');
const SEED_FILE  = path.join(__dirname, 'seed.sql');
const REPORT_FILE = path.join(__dirname, '..', 'turbo_pipeline_report.md');
const LIMITS_FILE = path.join(__dirname, '..', 'scratch', 'daily_limits.json');

// ─── CLI Args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg  = (k: string, def = '') => argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? def;
const has  = (k: string) => argv.some(a => a === `--${k}` || a.startsWith(`--${k}=`));

const LIMIT      = Number(arg('limit',   '99999'));
const WORKERS    = Number(arg('workers', '24'));     // parallel workers
const DRY_RUN    = has('dry-run');
const OFFSET     = Number(arg('offset',  '0'));
const FILTER_CLASS = arg('class', '');
const FILTER_EXAM  = arg('exam',  '');

// ─── Model Capability Map ─────────────────────────────────────────────────────
// Defines context window, max output, and quality score per provider+model
// This lets us route large prompts to high-context models automatically
const MODEL_CAPS = {
  // CEREBRAS — ultrafast inference (1000+ tokens/sec), OpenAI-compat
  'cerebras:qwen-3-235b-a22b-instruct-2507': { ctx: 32768, maxOut: 4096,  quality: 10, provider: 'cerebras' },
  'cerebras:gpt-oss-120b':                  { ctx: 32768, maxOut: 4096,  quality: 9,  provider: 'cerebras' },
  'cerebras:zai-glm-4.7':                   { ctx: 32768, maxOut: 4096,  quality: 8,  provider: 'cerebras' },
  'cerebras:llama3.1-8b':                   { ctx: 8192,  maxOut: 2048,  quality: 5,  provider: 'cerebras' },

  // GEMINI — best quality, moderate speed
  'gemini:gemini-2.5-flash':                { ctx: 100000, maxOut: 8192, quality: 10, provider: 'gemini' },

  // GROQ — fast inference, solid quality
  'groq:llama-3.3-70b-versatile':           { ctx: 32768,  maxOut: 4096, quality: 9,  provider: 'groq' },
  'groq:qwen/qwen3-32b':                    { ctx: 32768,  maxOut: 4096, quality: 8,  provider: 'groq' },
  'groq:llama-3.1-8b-instant':              { ctx: 8192,   maxOut: 2048, quality: 5,  provider: 'groq' },
} as const;

type ModelKey = keyof typeof MODEL_CAPS;

// ─── Key Pool ─────────────────────────────────────────────────────────────────
const ENV = process.env as Record<string, string | undefined>;

const CEREBRAS_KEYS = [
  ENV.CEREBRAS_API_KEY,    ENV.CEREBRAS_API_KEY_2, ENV.CEREBRAS_API_KEY_3, ENV.CEREBRAS_API_KEY_4,
  ENV.CEREBRAS_API_KEY_5,  ENV.CEREBRAS_API_KEY_6, ENV.CEREBRAS_API_KEY_7, ENV.CEREBRAS_API_KEY_8,
].filter(Boolean) as string[];

const GEMINI_KEYS = [
  ENV.VITE_GEMINI_API_KEY,   ENV.VITE_GEMINI_API_KEY_2, ENV.VITE_GEMINI_API_KEY_3,
  ENV.VITE_GEMINI_API_KEY_4, ENV.VITE_GEMINI_API_KEY_5, ENV.VITE_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

const GROQ_KEYS = [
  ENV.VITE_GROQ_API_KEY,   ENV.VITE_GROQ_API_KEY_2, ENV.VITE_GROQ_API_KEY_3, ENV.VITE_GROQ_API_KEY_4,
  ENV.VITE_GROQ_API_KEY_5, ENV.VITE_GROQ_API_KEY_6, ENV.VITE_GROQ_API_KEY_7, ENV.VITE_GROQ_API_KEY_8,
].filter(Boolean) as string[];

// Key blocked combinations (from health check — update when keys change)
// Run: npx tsx scripts/check-keys.ts  to refresh this map
const GROQ_KEY7_BLOCKED = new Set(['qwen/qwen3-32b', 'llama-3.1-8b-instant']);  // K7: only llama-3.3-70b works
const GROQ_KEY8_BLOCKED = new Set(['qwen/qwen3-32b', 'llama-3.3-70b-versatile']); // K8: only llama-3.1-8b works
const CB_QWEN_BLOCKED   = new Set([0,1,2,3,4,5,6]); // qwen-3-235b: only CB-K8 (index 7) works

// ─── Worker Slot Pool ─────────────────────────────────────────────────────────
// Each worker slot = one (model, key) combination → max parallel throughput
interface WorkerSlot {
  id: string;
  modelKey: ModelKey;
  providerKey: string;   // actual API key
  keyIndex: number;
  busy: boolean;
  exhausted: boolean;
  successCount: number;
  failCount: number;
  lastUsedMs: number;
}

function buildWorkerSlots(): WorkerSlot[] {
  const slots: WorkerSlot[] = [];

  // Cerebras Primary: gpt-oss-120b + zai-glm-4.7 — ALL 8 keys confirmed working
  const cerebrasModels: ModelKey[] = [
    'cerebras:gpt-oss-120b',    // all 8 keys OK, 1160ms avg
    'cerebras:zai-glm-4.7',    // all 8 keys OK, 1017ms avg
  ];
  for (const model of cerebrasModels) {
    for (let ki = 0; ki < CEREBRAS_KEYS.length; ki++) {
      slots.push({
        id: `CB-${model.split(':')[1].slice(0,8)}-K${ki+1}`,
        modelKey: model, providerKey: CEREBRAS_KEYS[ki], keyIndex: ki,
        busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
      });
    }
  }

  // Cerebras qwen-3-235b: ONLY CB-K8 (index 7) works — add as single slot
  if (CEREBRAS_KEYS.length >= 8) {
    slots.push({
      id: 'CB-qwen235-K8',
      modelKey: 'cerebras:qwen-3-235b-a22b-instruct-2507',
      providerKey: CEREBRAS_KEYS[7], keyIndex: 7,
      busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
    });
  }

  // Gemini: gemini-2.5-flash — ALL 6 keys confirmed working
  for (let ki = 0; ki < GEMINI_KEYS.length; ki++) {
    slots.push({
      id: `GM-flash-K${ki+1}`,
      modelKey: 'gemini:gemini-2.5-flash', providerKey: GEMINI_KEYS[ki], keyIndex: ki,
      busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
    });
  }

  // Groq llama-3.3-70b: K1-K7 confirmed (K8 blocked)
  for (let ki = 0; ki < Math.min(GROQ_KEYS.length, 7); ki++) {
    slots.push({
      id: `GQ-llama70b-K${ki+1}`,
      modelKey: 'groq:llama-3.3-70b-versatile', providerKey: GROQ_KEYS[ki], keyIndex: ki,
      busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
    });
  }

  // Groq llama-3.1-8b-instant: K1-K6 + K8 confirmed (K7 blocked)
  const groqFastKeys = [0,1,2,3,4,5,7]; // 0-indexed; skip index 6 (K7)
  for (const ki of groqFastKeys) {
    if (ki >= GROQ_KEYS.length) continue;
    slots.push({
      id: `GQ-llama8b-K${ki+1}`,
      modelKey: 'groq:llama-3.1-8b-instant', providerKey: GROQ_KEYS[ki], keyIndex: ki,
      busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
    });
  }

  // Fallback: Cerebras llama3.1-8b — all 8 keys work, used when everything else busy/exhausted
  for (let ki = 0; ki < CEREBRAS_KEYS.length; ki++) {
    slots.push({
      id: `CB-llama8b-K${ki+1}`,
      modelKey: 'cerebras:llama3.1-8b', providerKey: CEREBRAS_KEYS[ki], keyIndex: ki,
      busy: false, exhausted: false, successCount: 0, failCount: 0, lastUsedMs: 0,
    });
  }

  return slots;
}

// ─── Daily Limits ─────────────────────────────────────────────────────────────
interface DailyLimits { date: string; cerebras: number; gemini: number; groq: number; }
const CEREBRAS_DAILY_MAX = 50000;
const GEMINI_DAILY_MAX   = 10000;
const GROQ_DAILY_MAX     = 15000;

function loadLimits(): DailyLimits {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const d: DailyLimits = JSON.parse(fs.readFileSync(LIMITS_FILE, 'utf-8'));
    if (d.date === today) return d;
  } catch {}
  return { date: today, cerebras: 0, gemini: 0, groq: 0 };
}
function saveLimits(l: DailyLimits) {
  fs.writeFileSync(LIMITS_FILE, JSON.stringify(l), 'utf-8');
}

const limits = loadLimits();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep    = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc      = (s: any) => String(s ?? '').replace(/'/g, "''");
const slugify  = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
const makeHash = (text: string, opts: string[]) =>
  crypto.createHash('sha256').update((text + opts.join('')).toLowerCase().replace(/\s+/g, '')).digest('hex').slice(0, 32);

function extractJSON(raw: string): any {
  if (!raw) throw new Error('Empty response');
  try { return JSON.parse(raw); } catch {}
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) { try { return JSON.parse(match[1]); } catch {} }
  throw new Error(`Cannot parse JSON: ${raw.slice(0, 100)}`);
}

// ─── Provider Callers ─────────────────────────────────────────────────────────
async function callCerebras(key: string, model: string, prompt: string, maxOut: number): Promise<string> {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }],
      temperature: 0.15, max_completion_tokens: maxOut, response_format: { type: 'json_object' } }),
  });
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 401) throw new Error('AUTH_401');
  if (!res.ok) {
    const t = await res.text();
    if (t.includes('does not exist') || t.includes('deprecated')) throw new Error('MODEL_DEAD');
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
      method: 'POST', signal: AbortSignal.timeout(35000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxOut, temperature: 0.15, responseMimeType: 'application/json' },
      }),
    }
  );
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 400) throw new Error('BAD_REQUEST_400');
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const d: any = await res.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error(`EMPTY (finishReason=${d.candidates?.[0]?.finishReason})`);
  const parsed = extractJSON(text);
  limits.gemini++; saveLimits(limits);
  return JSON.stringify(parsed);
}

async function callGroq(key: string, model: string, prompt: string, maxOut: number): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }],
      temperature: 0.15, max_tokens: maxOut, response_format: { type: 'json_object' } }),
  });
  if (res.status === 429) throw new Error('RATE_LIMIT_429');
  if (res.status === 403) throw new Error('BLOCKED_403');
  if (!res.ok) {
    const t = await res.text();
    if (t.includes('blocked') || t.includes('decommissioned')) throw new Error('MODEL_DEAD');
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
  const model = (slot.modelKey as string).split(':')[1];
  if (provider === 'cerebras') return callCerebras(slot.providerKey, model, prompt, maxOut);
  if (provider === 'gemini')   return callGemini(slot.providerKey, model, prompt, maxOut);
  if (provider === 'groq')     return callGroq(slot.providerKey, model, prompt, maxOut);
  throw new Error(`Unknown provider: ${provider}`);
}

// ─── ELO Band Reference ───────────────────────────────────────────────────────
const ELO_BAND_REF = `
ELO BAND TABLE (mandatory — pick EXACT band_id):
| band_id            | elo_min | elo_max | exam target |
|--------------------|---------|---------|-------------|
| CLASS_8_RECALL     |  700    |  900    | Class 8 Board |
| CLASS_9_BASIC      |  900    | 1100    | Class 9 Board |
| BOARD_EASY         | 1100    | 1400    | Class 10 easy |
| BOARD_HARD         | 1400    | 1700    | Class 10 hard |
| NEET_EASY          | 1700    | 1900    | NEET easy |
| JEE_MAINS_EASY     | 1800    | 2050    | JEE Mains easy |
| NEET_MEDIUM        | 1900    | 2100    | NEET medium |
| JEE_MAINS_MEDIUM   | 2050    | 2250    | JEE Mains medium |
| NEET_HARD          | 2100    | 2350    | NEET hard |
| JEE_MAINS_HARD     | 2250    | 2500    | JEE Mains hard |
| JEE_ADV_EASY       | 2400    | 2650    | JEE Advanced easy |
| JEE_ADV_MEDIUM     | 2600    | 2800    | JEE Advanced medium |
| JEE_ADV_HARD       | 2800    | 3000    | JEE Advanced hard |
| JEE_ADV_EXPERT     | 3000    | 3200    | JEE Advanced expert |
RULES: Board max=BOARD_HARD | NEET max=NEET_HARD | Class 8=CLASS_8_RECALL only | Class 9=CLASS_9_BASIC only`;

const BAND_RANGES: Record<string, [number, number]> = {
  CLASS_8_RECALL:[700,900], CLASS_9_BASIC:[900,1100], BOARD_EASY:[1100,1400], BOARD_HARD:[1400,1700],
  NEET_EASY:[1700,1900], JEE_MAINS_EASY:[1800,2050], NEET_MEDIUM:[1900,2100], JEE_MAINS_MEDIUM:[2050,2250],
  NEET_HARD:[2100,2350], JEE_MAINS_HARD:[2250,2500], JEE_ADV_EASY:[2400,2650], JEE_ADV_MEDIUM:[2600,2800],
  JEE_ADV_HARD:[2800,3000], JEE_ADV_EXPERT:[3000,3200],
};
const BAND_ALIASES: Record<string, string> = {
  BOARD_MEDIUM:'BOARD_HARD', CLASS_10_EASY:'BOARD_EASY', CLASS_10_HARD:'BOARD_HARD',
  NEET_BASIC:'NEET_EASY', JEE_EASY:'JEE_MAINS_EASY', JEE_MEDIUM:'JEE_MAINS_MEDIUM',
  JEE_HARD:'JEE_MAINS_HARD', JEE_ADVANCED_EASY:'JEE_ADV_EASY',
  JEE_ADVANCED_MEDIUM:'JEE_ADV_MEDIUM', JEE_ADVANCED_HARD:'JEE_ADV_HARD',
  CLASS_11_EASY:'JEE_MAINS_EASY', CLASS_12_EASY:'JEE_MAINS_EASY',
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
  const defaults: Record<string, string> = { JEEAdvanced:'JEE_ADV_MEDIUM', JEEMains:'JEE_MAINS_MEDIUM', NEET:'NEET_MEDIUM', Board:'BOARD_EASY' };
  const base = defaults[exam] || 'BOARD_EASY';
  const [lo, hi] = BAND_RANGES[base];
  return { elo: Math.round((lo+hi)/2), band: base };
}

// ─── Build Prompt (token-efficient, context-aware) ────────────────────────────
function buildPrompt(stubs: RawQuestion[], slotModelKey: ModelKey): string {
  const n = stubs.length;
  // Compact prompt for small-context models (llama3.1-8b)
  const isSmallCtx = MODEL_CAPS[slotModelKey].ctx <= 8192;
  
  if (isSmallCtx) {
    // Minimal format for 8K context models — only 1 stub at a time
    const stub = stubs[0];
    return `Generate 1 exam question. Return JSON: {"results":[1 object]}
Fields: question_text,type(MCQ/Multi-correct/Integer),options(4-item array or [] for Integer),correct_answer,explanation,solution_steps(2-3 steps),primary_topic,primary_subtopic,primary_topic_id(slug),secondary_topic_ids[],concept_tags[],cross_chapter(0/1),cross_subject(0/1),also_for[],subject,class,exam,difficulty_band,elo,step_count,key_formula,error_trap_type
${ELO_BAND_REF}
STUB: ${stub.raw_text}`;
  }
  
  return `You are ExamCompass Senior Curator. Generate COMPLETE verified exam questions.
Return JSON: {"results":[${n} objects — SAME ORDER as stubs]}

REQUIRED FIELDS per object:
- question_text: Full question. Use $...$ inline LaTeX, $$...$$ block. Be concise.
- type: "MCQ" | "Multi-correct" | "Integer"
  • MCQ: 4 options, single correct (default for all exams)
  • Multi-correct: JEE Advanced ONLY, 1–4 correct answers (~30% of JEE Adv)
  • Integer: Numeric answer 0–99, no options array (JEE Mains Section B ~20%)
- options: 4 strings for MCQ/Multi-correct; [] for Integer. Options MUST be numerically distinct.
- correct_answer: exact verbatim option text for MCQ | JSON array string for Multi-correct | numeric string for Integer
- explanation: ≤ 120 chars, concise
- solution_steps: exactly 2–3 very short strings
- primary_topic, primary_subtopic, primary_topic_id (slug like "phy_12_jm_em_induction")
- secondary_topic_ids: [] or slugs for cross-chapter
- concept_tags: 3–6 strings
- cross_chapter: 1 if spans 2+ chapters else 0
- cross_subject: 0 (usually)
- also_for: [] or ["NEET"] or ["Board"]
- subject: Physics|Chemistry|Mathematics|Biology|Science|Social
- class: "8"|"9"|"10"|"11"|"12"
- exam: JEEMains|JEEAdvanced|NEET|Board
- difficulty_band: exact band_id from table
- elo: integer in band range
- step_count: 1–6
- key_formula: main formula or ""
- error_trap_type: e.g. "physics.em.sign_flip"

${ELO_BAND_REF}

BREVITY: Keep options/steps/explanation SHORT to avoid truncation.

STUBS TO GENERATE (${n} questions):
${stubs.map((q, i) => `[${i+1}] ${q.raw_text}`).join('\n')}`;
}

// ─── Validate & Build ProcessedQ ─────────────────────────────────────────────
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

function buildQ(raw: any, stub: RawQuestion): ProcessedQ | null {
  try {
    const t = ['MCQ','Multi-correct','Integer'].includes(raw?.type) ? raw.type : 'MCQ';
    const exam = raw?.exam || stub.exam || 'JEEMains';
    const cls  = String(raw?.class || stub.class?.replace('Class ','') || '12');
    const subj = raw?.subject || stub.subject || 'Physics';
    const { elo, band } = resolveElo(raw?.difficulty_band, raw?.elo, exam, cls);

    const options: string[] = t === 'Integer' ? [] : (Array.isArray(raw?.options) ? raw.options.slice(0,4) : ['—','—','—','—']);
    let correct = String(raw?.correct_answer ?? '');

    // MCQ: resolve letter answers (A/B/C/D → option text)
    if (t === 'MCQ' && /^[A-Da-d]$/.test(correct.trim()) && options.length) {
      const idx = 'ABCDabcd'.indexOf(correct.trim()) % 4;
      correct = options[idx] || correct;
    }
    // MCQ: validate correct is in options
    if (t === 'MCQ' && options.length && !options.includes(correct)) {
      const clean = correct.replace(/[^a-z0-9]/g,'').toLowerCase();
      const found = options.find(o => o.replace(/[^a-z0-9]/g,'').toLowerCase() === clean);
      if (!found) return null; // invalid — skip
      correct = found;
    }
    // Multi-correct: ensure JSON array
    if (t === 'Multi-correct') {
      if (Array.isArray(raw?.correct_answer)) correct = JSON.stringify(raw.correct_answer.map(String));
      else { try { JSON.parse(correct); } catch { correct = JSON.stringify([correct]); } }
    }
    // Integer: must be numeric
    if (t === 'Integer' && isNaN(parseFloat(correct))) return null;

    if (!raw?.question_text || String(raw.question_text).trim().length < 10) return null;
    if (!raw?.explanation || String(raw.explanation).trim().length < 5) return null;

    let negMark = -1.0;
    if (exam === 'JEEAdvanced') negMark = -2.0;
    if (exam === 'JEEMains' && t === 'Integer') negMark = 0.0;
    if (exam === 'Board') negMark = 0.0;

    const topicId = raw?.primary_topic_id || `${slugify(subj)}_${cls}_${slugify(raw?.primary_topic || 'general')}`;

    return {
      id: makeHash(raw.question_text, options),
      exam, class: cls, subject: subj,
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
      question_text: raw.question_text,
      options, correct_answer: correct,
      explanation: raw.explanation,
      solution_steps: Array.isArray(raw?.solution_steps) ? raw.solution_steps : [],
      key_formula: raw?.key_formula || '',
      error_trap_type: raw?.error_trap_type || 'general.exam_trap',
      source_exam: 'AI-Generated', year: null,
      quality_tier: 'C', confidence: 0.87,
    };
  } catch {
    return null;
  }
}

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
  '${esc(q.error_trap_type)}','AI-Generated',NULL,'C',0.87,
  '${new Date().toISOString()}',0
);
`;
  fs.appendFileSync(SEED_FILE, sql, 'utf-8');
}

// ─── Worker Task ──────────────────────────────────────────────────────────────
// Processes a batch of stubs using a specific slot, returns # generated
async function processWithSlot(slot: WorkerSlot, stubs: RawQuestion[]): Promise<ProcessedQ[]> {
  const caps = MODEL_CAPS[slot.modelKey];
  const provider = caps.provider;
  
  // Check daily limits
  if (provider === 'cerebras' && limits.cerebras >= CEREBRAS_DAILY_MAX) throw new Error('CEREBRAS_DAILY_MAX');
  if (provider === 'gemini'   && limits.gemini   >= GEMINI_DAILY_MAX)   throw new Error('GEMINI_DAILY_MAX');
  if (provider === 'groq'     && limits.groq      >= GROQ_DAILY_MAX)    throw new Error('GROQ_DAILY_MAX');

  // Small context models: 1 stub at a time
  const batchSize = caps.ctx <= 8192 ? 1 : stubs.length;
  const maxOut    = Math.min(caps.maxOut, 5000);

  const results: ProcessedQ[] = [];

  for (let i = 0; i < stubs.length; i += batchSize) {
    const chunk = stubs.slice(i, i + batchSize);
    const prompt = buildPrompt(chunk, slot.modelKey);
    
    const raw    = await callSlot(slot, prompt, maxOut);
    const parsed = extractJSON(raw);
    const items  = parsed?.results ?? (Array.isArray(parsed) ? parsed : [parsed]);

    for (let j = 0; j < items.length && j < chunk.length; j++) {
      const q = buildQ(items[j], chunk[j]);
      if (q) results.push(q);
    }
  }
  return results;
}

// ─── Smart Slot Picker ────────────────────────────────────────────────────────
// Returns the best available (non-busy, non-exhausted) slot sorted by quality
function pickSlot(slots: WorkerSlot[]): WorkerSlot | null {
  const available = slots
    .filter(s => !s.busy && !s.exhausted)
    .sort((a, b) => {
      // Prefer higher quality models
      const qa = MODEL_CAPS[a.modelKey].quality;
      const qb = MODEL_CAPS[b.modelKey].quality;
      if (qa !== qb) return qb - qa;
      // Then least recently used
      return a.lastUsedMs - b.lastUsedMs;
    });
  return available[0] ?? null;
}

// ─── Progress Display ─────────────────────────────────────────────────────────
let totalOk = 0, totalSkipped = 0, totalAttempted = 0;
let startMs = Date.now();
let activeSlots = 0;

function printProgress(total: number) {
  const elapsed = (Date.now() - startMs) / 1000 / 60;
  const qpm = elapsed > 0 ? totalOk / elapsed : 0;
  const pct = total > 0 ? Math.min(100, totalAttempted / total * 100) : 0;
  const filled = Math.round(pct / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  const remaining = Math.max(0, total - totalAttempted);
  const eta = qpm > 0 ? `${Math.round(remaining / qpm)}m` : '?';
  process.stdout.write(
    `\r  [${bar}] ${pct.toFixed(0).padStart(3)}% | ✅${totalOk} ❌${totalSkipped} | ${qpm.toFixed(0)} q/min | Workers:${activeSlots} | ETA:${eta}   `
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const slots = buildWorkerSlots();

  console.log('═'.repeat(72));
  console.log('🚀 EXAMCOMPASS TURBO-PIPELINE v2.0 — MAXIMUM SPEED + ACCURACY');
  console.log('─'.repeat(72));
  console.log(`   Cerebras: ${CEREBRAS_KEYS.length} keys (gpt-oss-120b+zai-glm-4.7: all 8, qwen-235b: K8 only)`);
  console.log(`   Gemini:   ${GEMINI_KEYS.length} keys (gemini-2.5-flash: all 6)`);
  console.log(`   Groq:     ${GROQ_KEYS.length} keys (llama-70b: K1-K7, llama-8b: K1-K6+K8)`);
  console.log(`   Workers:  ${WORKERS} parallel | Limit: ${LIMIT}`);
  console.log(`   Daily:    Cerebras:${limits.cerebras} | Gemini:${limits.gemini} | Groq:${limits.groq}`);
  console.log('═'.repeat(72) + '\n');

  if (!fs.existsSync(CACHE_FILE)) {
    console.error(`❌ No cache file found: ${CACHE_FILE}`);
    console.log('   Run: npx tsx scripts/distribution-manager.ts --stubs=5000');
    process.exit(1);
  }

  // Load stubs
  const doneHashes: Set<string> = new Set(
    fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8')) : []
  );

  let allRaw: RawQuestion[] = fs.readFileSync(CACHE_FILE, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean)
    .slice(OFFSET);

  if (FILTER_CLASS) allRaw = allRaw.filter(q => (q.class || '').includes(FILTER_CLASS));
  if (FILTER_EXAM)  allRaw = allRaw.filter(q => q.exam === FILTER_EXAM);

  const eligible = allRaw.filter(q => !doneHashes.has(q.hash) && q.quality === 'raw').slice(0, LIMIT);

  console.log(`📦 Cache: ${allRaw.length} | Eligible: ${eligible.length} | Target: ${Math.min(LIMIT, eligible.length)}\n`);

  if (eligible.length === 0) {
    console.log('✅ Nothing to process!');
    console.log('   Run: npx tsx scripts/distribution-manager.ts --stubs=5000');
    return;
  }

  if (!DRY_RUN && !fs.existsSync(SEED_FILE)) {
    fs.writeFileSync(SEED_FILE, `-- ExamCompass Seed\n-- Turbo-Pipeline v1.0 ${new Date().toISOString()}\n\n`, 'utf-8');
  }

  startMs = Date.now();

  // ─── Parallel Task Queue ────────────────────────────────────────────────────
  // Items of 5 stubs each, processed by a pool of WORKERS parallel workers
  const STUB_BATCH = 5;
  const queue: RawQuestion[][] = [];
  for (let i = 0; i < eligible.length; i += STUB_BATCH)
    queue.push(eligible.slice(i, i + STUB_BATCH));

  let queueIdx = 0;

  async function worker(workerId: number): Promise<void> {
    while (queueIdx < queue.length) {
      const myIdx = queueIdx++;
      const batch = queue[myIdx];
      if (!batch) break;

      // Find best available slot
      let slot = pickSlot(slots);
      if (!slot) {
        // All slots exhausted or busy — wait briefly then retry
        await sleep(500);
        slot = pickSlot(slots);
        if (!slot) {
          totalSkipped += batch.length;
          totalAttempted += batch.length;
          continue;
        }
      }

      slot.busy = true;
      slot.lastUsedMs = Date.now();
      activeSlots++;

      try {
        const results = await processWithSlot(slot, batch);
        
        if (!DRY_RUN) {
          for (const q of results) writeSql(q);
          for (const raw of batch) doneHashes.add(raw.hash);
          fs.writeFileSync(DONE_FILE, JSON.stringify([...doneHashes]), 'utf-8');
        }

        totalOk += results.length;
        totalSkipped += batch.length - results.length;
        totalAttempted += batch.length;
        slot.successCount++;

      } catch (e: any) {
        const msg = e.message || '';
        
        if (msg === 'RATE_LIMIT_429' || msg === 'BLOCKED_403') {
          // Mark this slot as exhausted for the session
          slot.exhausted = true;
          process.stdout.write(`\n  ⚡ ${slot.id} exhausted (429/403)\n`);
          // Retry the batch by pushing back to queue
          queueIdx = myIdx; // re-queue this batch
        } else if (msg === 'MODEL_DEAD') {
          slot.exhausted = true;
          process.stdout.write(`\n  💀 ${slot.id} model dead\n`);
          queueIdx = myIdx;
        } else if (msg.includes('TRUNCATED') && batch.length > 1) {
          // Split in half and retry
          queue.splice(queueIdx, 0,
            batch.slice(0, Math.ceil(batch.length/2)),
            batch.slice(Math.ceil(batch.length/2))
          );
        } else {
          slot.failCount++;
          totalSkipped += batch.length;
          totalAttempted += batch.length;
          // Tolerate occasional failures but exhaust slot if too many
          if (slot.failCount >= 5) {
            slot.exhausted = true;
            process.stdout.write(`\n  ⛔ ${slot.id} too many failures\n`);
          }
        }
      } finally {
        slot.busy = false;
        activeSlots = Math.max(0, activeSlots - 1);
        printProgress(eligible.length);
      }
    }
  }

  // Launch WORKERS parallel workers
  await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, (_, i) => worker(i)));

  // ─── Final Summary ──────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const rate    = totalOk / (Number(elapsed) / 60);
  const activeSlotList = slots.filter(s => s.successCount > 0).map(s => `${s.id}(${s.successCount})`);

  console.log('\n\n' + '═'.repeat(72));
  console.log(`✅ DONE! ${totalOk} questions generated | ${totalSkipped} skipped`);
  console.log(`   Rate: ${rate.toFixed(0)} questions/min | Time: ${elapsed}s`);
  console.log(`   API calls → Cerebras:${limits.cerebras} | Gemini:${limits.gemini} | Groq:${limits.groq}`);
  console.log(`   Active slots: ${activeSlotList.join(', ')}`);
  console.log('═'.repeat(72));

  const report = `# Turbo Pipeline Report
Generated: ${new Date().toLocaleString()}
Workers: ${WORKERS} | Limit: ${LIMIT}

| Metric | Value |
|--------|-------|
| ✅ Generated | **${totalOk}** |
| ❌ Skipped | ${totalSkipped} |
| Speed | **${rate.toFixed(0)} q/min** |
| Time | ${elapsed}s |
| Cerebras calls | ${limits.cerebras} / ${CEREBRAS_DAILY_MAX} |
| Gemini calls | ${limits.gemini} / ${GEMINI_DAILY_MAX} |
| Groq calls | ${limits.groq} / ${GROQ_DAILY_MAX} |

## Active Slots
${activeSlotList.map(s => `- ${s}`).join('\n')}
`;
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
}

main().catch(e => { console.error('\n💥 FATAL:', e.message); process.exit(1); });
