// ═══════════════════════════════════════════════════════════════════════
// EXAMCOMPASS BATCH PIPELINE v4.0 — PRODUCTION GRADE
// New: Integer-type, Multi-correct, 14-band ELO anchors, v2 schema
// Fixes: ELO drift, missing cross-chapter tagging, strict validation
// ═══════════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import type { RawQuestion } from './bulk-scraper.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, '..', 'scratch', 'raw_questions_cache.jsonl');
const DONE_FILE  = path.join(__dirname, '..', 'scratch', 'processed_hashes.json');
const LIMITS_FILE= path.join(__dirname, '..', 'scratch', 'daily_limits.json');
const SEED_FILE  = path.join(__dirname, 'seed.sql');
const REPORT_FILE= path.join(__dirname, '..', 'batch_pipeline_report.md');

// ─── CLI Args ─────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg  = (k: string, def = '') => argv.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? def;
const has  = (k: string) => argv.some(a => a === `--${k}` || a.startsWith(`--${k}=`));

const MODE        = (arg('mode', 'fast_tag')) as 'fast_tag' | 'full_curation';
const RAW_BS      = Number(arg('batch-size', '20'));
const BATCH_SIZE  = RAW_BS;
const LIMIT       = Number(arg('limit', '99999'));
const OFFSET      = Number(arg('offset', '0'));
const FILTER_CLASS= arg('class', '');
const FILTER_EXAM = arg('exam', '');
const DRY_RUN     = has('dry-run');
const NO_GEMINI   = has('no-gemini'); // skip Gemini when it's network-blocked
const CONCURRENCY = Number(arg('workers', MODE === 'fast_tag' ? '6' : '2')); // 2 for full_curation avoids key collision

// ─── 14-BAND ELO REFERENCE (embedded in EVERY AI prompt) ──────────────────
// CRITICAL: AI must pick band first, then elo within band.
// This prevents ELO drift between subjects/classes.
const ELO_BAND_REFERENCE = `
ELO BAND REFERENCE TABLE (14 fixed bands — you MUST use these):
| band_id           | elo_min | elo_max | description |
|-------------------|---------|---------|-------------|
| CLASS_8_RECALL    |  700    |  900    | Single fact recall, no calculation, Class 8 Board |
| CLASS_9_BASIC     |  900    | 1100    | 1-step application, F=ma with given values, Class 9 |
| BOARD_EASY        | 1100    | 1400    | Class 10 easy/medium, 2-step, direct formula |
| BOARD_HARD        | 1400    | 1700    | Class 10 hard, proof-based, Punnett squares |
| NEET_EASY         | 1700    | 1900    | Single concept NEET, formula recall + substitution |
| JEE_MAINS_EASY    | 1800    | 2050    | Single concept, must recall formula, routine calc |
| NEET_MEDIUM       | 1900    | 2100    | NEET 2-concept, tricky single concept, mechanism Qs |
| JEE_MAINS_MEDIUM  | 2050    | 2250    | 2 concepts, 3-step reasoning, formula chain |
| NEET_HARD         | 2100    | 2350    | Multi-concept NEET, counter-intuitive, strong traps |
| JEE_MAINS_HARD    | 2250    | 2500    | Multi-concept, 3-4 steps, strong traps |
| JEE_ADV_EASY      | 2400    | 2650    | 2 chapters combined, clear method, novel framing |
| JEE_ADV_MEDIUM    | 2600    | 2800    | 3 chapters, non-obvious approach, requires insight |
| JEE_ADV_HARD      | 2800    | 3000    | 3-4 chapters, 5+ steps, strong misdirection |
| JEE_ADV_EXPERT    | 3000    | 3200    | First-principles derivation, never-seen-before type |

MANDATORY RULES — violation = wrong question:
- Pick the band that matches the EXAM, not class alone
- Class 12 Board exam: BOARD_HARD max (1700)
- Class 12 JEE Mains: JEE_MAINS_EASY to JEE_MAINS_HARD
- Class 11/12 JEE Advanced: JEE_ADV_EASY to JEE_ADV_EXPERT
- NEET questions NEVER exceed NEET_HARD (2350)
- Board questions NEVER exceed BOARD_HARD (1700)
- Class 8 questions: CLASS_8_RECALL ONLY (700-900)
- Class 9 questions: CLASS_9_BASIC ONLY (900-1100)
`;

// ─── Key Rotator ──────────────────────────────────────────────────────────
class KeyRotator {
  private keys: string[];
  private idx = 0;
  constructor(envKeys: (string|undefined)[]) {
    this.keys = envKeys.filter(Boolean) as string[];
  }
  next(): string {
    if (!this.keys.length) throw new Error('No API keys configured');
    const k = this.keys[this.idx];
    this.idx = (this.idx + 1) % this.keys.length;
    return k;
  }
  get count() { return this.keys.length; }
}

const cerebrasKeys = new KeyRotator([
  process.env.CEREBRAS_API_KEY,   process.env.CEREBRAS_API_KEY_2,
  process.env.CEREBRAS_API_KEY_3, process.env.CEREBRAS_API_KEY_4,
  process.env.CEREBRAS_API_KEY_5, process.env.CEREBRAS_API_KEY_6,
  process.env.CEREBRAS_API_KEY_7, process.env.CEREBRAS_API_KEY_8,
]);
const geminiKeys = new KeyRotator([
  process.env.VITE_GEMINI_API_KEY,   process.env.VITE_GEMINI_API_KEY_2,
  process.env.VITE_GEMINI_API_KEY_3, process.env.VITE_GEMINI_API_KEY_4,
  process.env.VITE_GEMINI_API_KEY_5, process.env.VITE_GEMINI_API_KEY_6,
]);
const groqKeys = new KeyRotator([
  process.env.VITE_GROQ_API_KEY,   process.env.VITE_GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3, process.env.VITE_GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5, process.env.VITE_GROQ_API_KEY_6,
  process.env.VITE_GROQ_API_KEY_7, process.env.VITE_GROQ_API_KEY_8,
]);

// ─── Daily Limit Tracker ──────────────────────────────────────────────────
interface DailyLimits { date: string; cerebras: number; groq: number; gemini: number; }
function loadLimits(): DailyLimits {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const d: DailyLimits = JSON.parse(fs.readFileSync(LIMITS_FILE, 'utf-8'));
    if (d.date === today) return d;
  } catch {}
  return { date: today, cerebras: 0, groq: 0, gemini: 0 };
}
function saveLimits(l: DailyLimits): void {
  fs.mkdirSync(path.dirname(LIMITS_FILE), { recursive: true });
  fs.writeFileSync(LIMITS_FILE, JSON.stringify(l), 'utf-8');
}

const limits = loadLimits();
const CEREBRAS_DAILY_MAX = 12000;
const GROQ_DAILY_MAX     = 5000;
const GEMINI_DAILY_MAX   = 8000;

// ─── Backoff & Sleep ──────────────────────────────────────────────────────
const sleep   = (ms: number) => new Promise(r => setTimeout(r, ms));
const backoff = (n: number)  => sleep(Math.min(Math.pow(2, n) * 300 + Math.random() * 200, 5000)); // faster backoff for speed

// ─── JSON Extractor (handles markdown fences + partial JSON) ─────────────
function extractJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') throw new Error('Empty AI response');
  try { return JSON.parse(raw); } catch {}
  const stripped = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) { try { return JSON.parse(match[1]); } catch {} }
  throw new Error(`Cannot parse JSON: ${raw.slice(0, 120)}`);
}

// ─── Cerebras API ─────────────────────────────────────────────────────────
// Smart model list — ordered by quality. Deprecated models auto-removed at runtime.
const CEREBRAS_MODELS = {
  quality: ['gpt-oss-120b', 'llama3.1-8b'],     // best quality first
  fast:    ['llama3.1-8b'],                       // speed-only
};
const deprecatedModels = new Set<string>(); // auto-populated when MODEL_NOT_FOUND

async function callCerebras(prompt: string, maxTokens: number, model = 'llama3.1-8b'): Promise<string> {
  if (limits.cerebras >= CEREBRAS_DAILY_MAX) throw new Error('Cerebras daily limit reached');
  if (deprecatedModels.has(model)) throw new Error(`MODEL_NOT_FOUND: ${model}`);
  const attempts = Math.max(3, Math.ceil(cerebrasKeys.count / 2));
  for (let attempt = 0; attempt < attempts; attempt++) {
    const key = cerebrasKeys.next();
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.15,
          max_completion_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
      });
      if (res.status === 429) { await backoff(attempt); continue; }
      if (res.status === 401) { await backoff(attempt); continue; }
      if (!res.ok) {
        const err = await res.text();
        if (err.includes('does not exist') || err.includes('not found') || err.includes('deprecated')) {
          deprecatedModels.add(model); // remember so we skip instantly next time
          throw new Error(`MODEL_NOT_FOUND: ${model}`);
        }
        throw new Error(`Cerebras ${res.status}: ${err.slice(0, 120)}`);
      }
      const data: any = await res.json();
      if (data?.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
      if (!data?.choices?.[0]?.message?.content) throw new Error('Empty Cerebras content');
      limits.cerebras++;
      saveLimits(limits);
      return data.choices[0].message.content;
    } catch (e: any) {
      if (e.message === 'TRUNCATED' || e.message?.startsWith('MODEL_NOT_FOUND')) throw e;
      if (attempt >= attempts - 1) throw e;
      await backoff(attempt);
    }
  }
  throw new Error('Cerebras: all keys exhausted');
}

// ─── Gemini API ───────────────────────────────────────────────────────────
async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  if (limits.gemini >= GEMINI_DAILY_MAX) throw new Error('Gemini daily limit reached');
  const attempts = Math.max(3, Math.ceil(geminiKeys.count / 2));
  for (let attempt = 0; attempt < attempts; attempt++) {
    const key = geminiKeys.next();
    if (!key) throw new Error('Gemini: no keys configured');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000); // 20s timeout
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.15,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      clearTimeout(timer);
      if (res.status === 429) { await backoff(attempt); continue; }
      if (res.status === 400) throw new Error(`Gemini 400: bad request (prompt too long?)`);
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        const reason = data.candidates?.[0]?.finishReason;
        throw new Error(`Empty Gemini response (finishReason=${reason})`);
      }
      const parsed = extractJSON(text);
      limits.gemini++;
      saveLimits(limits);
      return JSON.stringify(parsed);
    } catch (e: any) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('Gemini: request timed out');
      if (attempt >= attempts - 1) throw e;
      await backoff(attempt);
    }
  }
  throw new Error('Gemini: all keys exhausted');
}

// ─── Groq API ────────────────────────────────────────────────────────────
async function callGroq(prompt: string, maxTokens: number): Promise<string> {
  if (limits.groq >= GROQ_DAILY_MAX) throw new Error('Groq daily limit reached');
  // Only confirmed working models — no deprecated mixtral, no blocked models
  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it'];
  for (const model of models) {
    const attempts = Math.max(2, Math.ceil(groqKeys.count / 3));
    for (let attempt = 0; attempt < attempts; attempt++) {
      const key = groqKeys.next();
      // 8s timeout — if Groq is network-blocked, fail fast instead of hanging
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          signal: ctrl.signal,
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.15,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' },
          }),
        });
        clearTimeout(timer);
        if (res.status === 429) { await backoff(attempt); continue; }
        if (!res.ok) {
          const err = await res.text();
          if (err.includes('blocked') || err.includes('not found') || err.includes('decommissioned')) break;
          throw new Error(`Groq ${res.status}: ${err.slice(0, 120)}`);
        }
        const data: any = await res.json();
        if (data?.choices?.[0]?.finish_reason === 'length') throw new Error('TRUNCATED');
        if (!data?.choices?.[0]?.message?.content) throw new Error('Empty Groq response');
        limits.groq++;
        saveLimits(limits);
        return data.choices[0].message.content;
      } catch (e: any) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error('Groq: network timeout (blocked locally)');
        if (e.message === 'TRUNCATED') throw e;
        await backoff(attempt);
      }
    }
  }
  throw new Error('Groq: all keys/models exhausted');
}

// ─── AI Waterfall — Smart Model Switching ──────────────────────────────────
// Strategy: try each Cerebras model (best→fast), then Gemini, then Groq.
// If a model is deprecated, it's auto-skipped on all future calls.
// For GitHub Actions: set PREFERRED_MODEL env var to override.
async function callAI(prompt: string, maxTokens: number, mode: 'fast_tag' | 'full_curation'): Promise<any> {
  const modelList = mode === 'full_curation' ? CEREBRAS_MODELS.quality : CEREBRAS_MODELS.fast;
  
  // Build provider list dynamically — skip deprecated models
  const providers: Array<() => Promise<string>> = [];
  
  // 1. Cerebras models (smart: skip deprecated ones instantly)
  for (const model of modelList) {
    if (!deprecatedModels.has(model)) {
      providers.push(() => callCerebras(prompt, maxTokens, model));
    }
  }
  
  // 2. Gemini (optional)
  if (!NO_GEMINI) {
    const extra = mode === 'fast_tag' ? 1024 : 2048;
    providers.push(() => callGemini(prompt, maxTokens + extra));
  }
  
  // 3. Groq as final fallback
  providers.push(() => callGroq(prompt, maxTokens));

  for (const fn of providers) {
    try {
      const raw = await fn();
      return extractJSON(raw);
    } catch (e: any) {
      process.stdout.write(`    ⚡ ${e.message?.slice(0, 80)} → next\n`);
    }
  }
  throw new Error('All AI providers exhausted');
}

// ─── Exam-Anchored ELO Lookup ─────────────────────────────────────────────
const BAND_RANGES: Record<string, [number, number]> = {
  CLASS_8_RECALL:   [700,  900],
  CLASS_9_BASIC:    [900,  1100],
  BOARD_EASY:       [1100, 1400],
  BOARD_HARD:       [1400, 1700],
  NEET_EASY:        [1700, 1900],
  JEE_MAINS_EASY:   [1800, 2050],
  NEET_MEDIUM:      [1900, 2100],
  JEE_MAINS_MEDIUM: [2050, 2250],
  NEET_HARD:        [2100, 2350],
  JEE_MAINS_HARD:   [2250, 2500],
  JEE_ADV_EASY:     [2400, 2650],
  JEE_ADV_MEDIUM:   [2600, 2800],
  JEE_ADV_HARD:     [2800, 3000],
  JEE_ADV_EXPERT:   [3000, 3200],
};

// Common AI hallucinated band aliases → map to valid band_ids
const BAND_ALIASES: Record<string, string> = {
  BOARD_MEDIUM:       'BOARD_HARD',
  BOARD_VERY_EASY:    'BOARD_EASY',
  CLASS_10_EASY:      'BOARD_EASY',
  CLASS_10_MEDIUM:    'BOARD_HARD',
  CLASS_10_HARD:      'BOARD_HARD',
  CLASS_10_BASIC:     'BOARD_EASY',
  CLASS_9_EASY:       'CLASS_9_BASIC',
  CLASS_9_MEDIUM:     'CLASS_9_BASIC',
  CLASS_8_BASIC:      'CLASS_8_RECALL',
  CLASS_8_EASY:       'CLASS_8_RECALL',
  CLASS_11_BASIC:     'JEE_MAINS_EASY',
  CLASS_11_EASY:      'JEE_MAINS_EASY',
  CLASS_11_MEDIUM:    'JEE_MAINS_MEDIUM',
  CLASS_12_EASY:      'JEE_MAINS_EASY',
  CLASS_12_MEDIUM:    'JEE_MAINS_MEDIUM',
  CLASS_12_HARD:      'JEE_MAINS_HARD',
  NEET_BASIC:         'NEET_EASY',
  JEE_EASY:           'JEE_MAINS_EASY',
  JEE_MEDIUM:         'JEE_MAINS_MEDIUM',
  JEE_HARD:           'JEE_MAINS_HARD',
  JEE_ADVANCED_EASY:  'JEE_ADV_EASY',
  JEE_ADVANCED_MEDIUM:'JEE_ADV_MEDIUM',
  JEE_ADVANCED_HARD:  'JEE_ADV_HARD',
};

const BAND_DEFAULT: Record<string, string> = {
  JEEAdvanced: 'JEE_ADV_MEDIUM',
  JEEMains:    'JEE_MAINS_MEDIUM',
  NEET:        'NEET_MEDIUM',
  Board:       'BOARD_EASY',
};

function resolveElo(aiBand: string|undefined, aiElo: number|undefined, exam: string, cls: string): { elo: number; band: string } {
  // 0. Check aliases first
  const resolvedBand = aiBand ? (BAND_ALIASES[aiBand] || aiBand) : undefined;
  // 1. AI provided a valid band_id — use it
  if (resolvedBand && BAND_RANGES[resolvedBand]) {
    const [lo, hi] = BAND_RANGES[resolvedBand];
    const elo = (aiElo && aiElo >= lo && aiElo <= hi) ? aiElo : Math.round((lo + hi) / 2);
    return { elo, band: resolvedBand };
  }
  // 2. AI gave raw ELO — find matching band
  if (aiElo && aiElo > 0 && aiElo < 4000) {
    const entry = Object.entries(BAND_RANGES).find(([, [lo, hi]]) => aiElo >= lo && aiElo <= hi);
    if (entry) return { elo: aiElo, band: entry[0] };
  }
  // 3. Fallback: exam default + class adjustment
  const baseBand = BAND_DEFAULT[exam] || 'BOARD_EASY';
  const [lo, hi] = BAND_RANGES[baseBand];
  const clsAdj = ({ '12': 100, '11': 50, '10': 0, '9': -100, '8': -200 } as Record<string,number>)[cls] || 0;
  const elo = Math.max(lo, Math.min(hi, Math.round((lo + hi) / 2) + clsAdj));
  return { elo, band: baseBand };
}

// ─── SQL helpers ─────────────────────────────────────────────────────────
const esc      = (s: any) => String(s ?? '').replace(/'/g, "''");
const slugify  = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
const makeHash = (text: string, opts: string[]) =>
  crypto.createHash('sha256').update((text + opts.join('')).toLowerCase().replace(/\s+/g, '')).digest('hex').slice(0, 32);

// ─── ProcessedQuestion — v2 schema ───────────────────────────────────────
type QType = 'MCQ' | 'Multi-correct' | 'Integer';

interface ProcessedQ {
  id:                  string;
  exam:                string;
  class:               string;
  subject:             string;
  primary_topic_id:    string;
  primary_topic:       string;
  primary_subtopic:    string;
  secondary_topic_ids: string[];
  concept_tags:        string[];
  cross_chapter:       number;
  cross_subject:       number;
  also_for:            string[];
  type:                QType;
  has_image:           number;
  elo:                 number;
  band:                string;
  step_count:          number;
  negative_marking:    number;
  question_text:       string;
  options:             string[];
  correct_answer:      string;
  explanation:         string;
  solution_steps:      string[];
  key_formula:         string;
  error_trap_type:     string;
  source_exam:         string;
  year:                number | null;
  quality_tier:        string;
  confidence:          number;
}

// ─── Write SQL (v2 schema columns) ──────────────────────────────────────
function writeSql(q: ProcessedQ): void {
  if (DRY_RUN) return;
  const sql = `INSERT OR IGNORE INTO questions (
  id, exam, class, subject,
  primary_topic_id, primary_topic, primary_subtopic,
  secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for,
  type, has_image,
  difficulty_score, difficulty_band, step_count, negative_marking,
  question_text, options, correct_answer,
  explanation, solution_steps, key_formula, error_trap_type,
  source_exam, year, quality_tier, confidence, created_at, verified
) VALUES (
  '${esc(q.id)}','${esc(q.exam)}','${esc(q.class)}','${esc(q.subject)}',
  '${esc(q.primary_topic_id)}','${esc(q.primary_topic)}','${esc(q.primary_subtopic)}',
  '${esc(JSON.stringify(q.secondary_topic_ids))}',
  '${esc(JSON.stringify(q.concept_tags))}',
  ${q.cross_chapter},${q.cross_subject},
  '${esc(JSON.stringify(q.also_for))}',
  '${esc(q.type)}',${q.has_image},
  ${q.elo},'${esc(q.band)}',${q.step_count},${q.negative_marking},
  '${esc(q.question_text)}',
  '${esc(JSON.stringify(q.options))}',
  '${esc(q.correct_answer)}',
  '${esc(q.explanation)}',
  '${esc(JSON.stringify(q.solution_steps))}',
  '${esc(q.key_formula)}',
  '${esc(q.error_trap_type)}',
  '${esc(q.source_exam)}',
  ${q.year ?? 'NULL'},
  '${esc(q.quality_tier)}',${q.confidence},
  '${new Date().toISOString()}',0
);
`;
  fs.appendFileSync(SEED_FILE, sql, 'utf-8');
}

// ─── Strict Validation ───────────────────────────────────────────────────
function validateQ(raw: any, qIdx: number, defaultExam: string, defaultClass: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const t: string = raw?.type || 'MCQ';

  if (!raw?.question_text || String(raw.question_text).trim().length < 10)
    errors.push(`Q${qIdx}: question_text missing or <10 chars`);

  if (t === 'MCQ') {
    if (!Array.isArray(raw?.options) || raw.options.length < 4)
      errors.push(`Q${qIdx}: MCQ needs 4 options, got ${raw?.options?.length ?? 0}`);
    else {
      const correctStr = String(raw?.correct_answer || '').trim().toLowerCase();
      const match = raw.options.find((o: string) => String(o).trim().toLowerCase() === correctStr);
      // Also allow A/B/C/D
      const byLetter = /^[A-Da-d]$/.test(String(raw?.correct_answer || '').trim());
      if (!match && !byLetter)
        errors.push(`Q${qIdx}: MCQ correct_answer not found verbatim in options`);
    }
  }

  if (t === 'Multi-correct') {
    if (!Array.isArray(raw?.options) || raw.options.length < 4)
      errors.push(`Q${qIdx}: Multi-correct needs 4 options`);
    let corrects: string[] = [];
    const ca = raw?.correct_answer;
    // Handle both: native array from AI, or JSON-encoded string '["..."]'
    if (Array.isArray(ca)) {
      corrects = ca.map(String);
      // Normalize to JSON string for storage
      raw.correct_answer = JSON.stringify(corrects);
    } else {
      try { corrects = JSON.parse(String(ca || '[]')); }
      catch { /* will be caught below */ }
    }
    if (!corrects.length) errors.push(`Q${qIdx}: Multi-correct needs >=1 correct answer`);
    else {
      const allInOptions = corrects.every((c: string) =>
        raw?.options?.some((o: string) => String(o).trim().toLowerCase() === String(c).trim().toLowerCase())
      );
      if (!allInOptions) errors.push(`Q${qIdx}: Multi-correct: some correct_answers not found in options`);
    }
  }

  if (t === 'Integer') {
    const val = String(raw?.correct_answer ?? '');
    if (!val && val !== '0') errors.push(`Q${qIdx}: Integer needs correct_answer`);
    else if (isNaN(parseFloat(val))) errors.push(`Q${qIdx}: Integer correct_answer not numeric: "${val}"`);
  }

  if (!raw?.explanation || String(raw.explanation).trim().length < 10)
    errors.push(`Q${qIdx}: explanation missing or <10 chars`);

  const validExams = ['JEEMains','JEEAdvanced','NEET','Board'];
  if (raw?.exam && !validExams.includes(raw.exam))
    errors.push(`Q${qIdx}: invalid exam '${raw.exam}' (expected ${validExams.join('|')})`);

  const validClasses = ['8','9','10','11','12'];
  if (raw?.class && !validClasses.includes(String(raw.class)))
    errors.push(`Q${qIdx}: invalid class '${raw.class}'`);

  const validSubjects = ['Physics','Chemistry','Mathematics','Biology','Science','Social'];
  if (raw?.subject && !validSubjects.includes(raw.subject))
    errors.push(`Q${qIdx}: invalid subject '${raw.subject}'`);

  if (raw?.difficulty_band && !BAND_RANGES[raw.difficulty_band] && !BAND_ALIASES[raw.difficulty_band])
    process.stdout.write(`    ℹ️  Q${qIdx}: unknown band '${raw.difficulty_band}' — using exam fallback\n`);

  return { ok: errors.length === 0, errors };
}

// ─── Build ProcessedQ from validated AI output ───────────────────────────
function buildProcessedQ(raw: any, sourceQ: RawQuestion, defaultExam: string, defaultClass: string): ProcessedQ {
  const t: QType = (['MCQ','Multi-correct','Integer'].includes(raw?.type)) ? raw.type : 'MCQ';
  const exam     = raw?.exam    || sourceQ.exam    || defaultExam || 'JEEMains';
  const cls      = String(raw?.class || sourceQ.class?.replace('Class ','') || defaultClass || '12');
  const subject  = raw?.subject || sourceQ.subject || 'Physics';

  const { elo, band } = resolveElo(raw?.difficulty_band, raw?.elo, exam, cls);

  const secondaryIds:  string[] = Array.isArray(raw?.secondary_topic_ids) ? raw.secondary_topic_ids : [];
  const conceptTags:   string[] = Array.isArray(raw?.concept_tags) ? raw.concept_tags : [];
  const solutionSteps: string[] = Array.isArray(raw?.solution_steps) ? raw.solution_steps : [];
  const alsoFor:       string[] = Array.isArray(raw?.also_for) ? raw.also_for : [];

  // Negative marking by exam/type
  let negativeMarking = -1.0;
  if (exam === 'JEEAdvanced' && t === 'MCQ')           negativeMarking = -2.0;
  if (exam === 'JEEAdvanced' && t === 'Multi-correct')  negativeMarking = -2.0;
  if (exam === 'JEEMains'   && t === 'Integer')         negativeMarking = 0.0;
  if (exam === 'NEET')                                  negativeMarking = -1.0;
  if (exam === 'Board')                                 negativeMarking = 0.0;

  // Correct answer normalisation
  let correctAnswer = String(raw?.correct_answer ?? '');
  if (t === 'MCQ') {
    if (/^[A-Da-d]$/.test(correctAnswer.trim()) && Array.isArray(raw?.options)) {
      const letterIdx = 'ABCDabcd'.indexOf(correctAnswer.trim()) % 4;
      correctAnswer = raw.options[letterIdx] || correctAnswer;
    }
  }
  if (t === 'Multi-correct') {
    if (Array.isArray(correctAnswer)) {
      correctAnswer = JSON.stringify(correctAnswer.map(String));
    } else {
      try { JSON.parse(correctAnswer); }
      catch { correctAnswer = JSON.stringify([correctAnswer]); }
    }
  }

  const topicId = raw?.primary_topic_id ||
    `${slugify(subject)}_${cls}_${slugify(raw?.primary_topic || raw?.topic || 'general')}`;

  const opts: string[] =
    t === 'Integer' ? [] :
    Array.isArray(raw?.options) ? raw.options.slice(0, 4) :
    ['—', '—', '—', '—'];

  return {
    id:                  makeHash(raw?.question_text || sourceQ.raw_text, opts),
    exam,
    class:               cls,
    subject,
    primary_topic_id:    topicId,
    primary_topic:       raw?.primary_topic || raw?.topic || 'General',
    primary_subtopic:    raw?.primary_subtopic || raw?.subtopic || 'General',
    secondary_topic_ids: secondaryIds,
    concept_tags:        conceptTags,
    cross_chapter:       (secondaryIds.length > 0 || raw?.cross_chapter === 1) ? 1 : 0,
    cross_subject:       raw?.cross_subject === 1 ? 1 : 0,
    also_for:            alsoFor,
    type:                t,
    has_image:           0,
    elo,
    band,
    step_count:          Number(raw?.step_count) || (elo >= 2600 ? 4 : elo >= 2000 ? 2 : 1),
    negative_marking:    negativeMarking,
    question_text:       raw?.question_text || sourceQ.raw_text,
    options:             opts,
    correct_answer:      correctAnswer,
    explanation:         raw?.explanation || 'See official solution.',
    solution_steps:      solutionSteps,
    key_formula:         raw?.key_formula || '',
    error_trap_type:     raw?.error_trap_type || 'general.exam_trap',
    source_exam:         sourceQ.source_exam || 'AI-Generated',
    year:                sourceQ.year || null,
    quality_tier:        sourceQ.quality === 'verified' ? 'A' : 'C',
    confidence:          sourceQ.quality === 'verified' ? 0.95 : 0.87,
  };
}

// ─── FAST TAG: classify existing PYQs (batch 25) ─────────────────────────
async function fastTagBatch(questions: RawQuestion[]): Promise<ProcessedQ[]> {
  const prompt = `You are an ExamCompass classifier. Classify each question below.
Return JSON: {"results":[${questions.length} objects in SAME ORDER as input]}

Each object must have ALL these fields:
- primary_topic: canonical chapter topic name
- primary_subtopic: specific concept tested
- primary_topic_id: slug e.g. "phy_12_jm_electrostatics"
- secondary_topic_ids: [] or ["topic_slug1"] if cross-chapter question
- concept_tags: ["Concept1","Concept2",...] all fine-grained concepts touched (3-8 items)
- cross_chapter: 0 or 1
- cross_subject: 0 or 1
- also_for: [] or ["NEET","Board"] if useful for other exams
- subject: "Physics"|"Chemistry"|"Mathematics"|"Biology"|"Science"|"Social"
- class: "11"|"12"|"10"|"9"|"8"
- exam: "JEEMains"|"JEEAdvanced"|"NEET"|"Board"
- difficulty_band: the band_id from the ELO BAND TABLE below
- elo: integer within that band's elo_min–elo_max
- step_count: 1-6 (distinct reasoning steps needed)
- error_trap_type: dot-notation e.g. "physics.electrostatics.sign_flip"
- key_formula: primary formula used, or ""

${ELO_BAND_REFERENCE}

QUESTIONS TO CLASSIFY:
${questions.map((q,i) => `[${i+1}] ${q.raw_text.slice(0,280)}\nOptions: ${q.raw_options.slice(0,4).join(' | ').slice(0,200)}\nHint: ${q.subject||'?'} ${q.exam||'?'} Class${q.class||'?'}`).join('\n---\n')}`;

  const parsed = await callAI(prompt, 4000, 'fast_tag');
  const results: ProcessedQ[] = [];

  for (let i = 0; i < questions.length; i++) {
    const aiOut = parsed?.results?.[i];
    if (!aiOut) {
      process.stdout.write(`    ⚠️  Q${i+1} missing in AI output\n`);
      continue;
    }

    // Merge AI tags with raw question content
    const merged = {
      ...aiOut,
      type: 'MCQ',  // fast_tag processes only verified PYQs = always MCQ
      question_text: questions[i].raw_text,
      options: questions[i].raw_options.slice(0, 4),
      correct_answer: questions[i].raw_answer,
      explanation: 'Verified from official exam paper.',
      solution_steps: [],
    };

    const { ok, errors } = validateQ(merged, i + 1, 'JEEMains', '12');
    if (!ok) {
      process.stdout.write(`    ⚠️  Validation: ${errors.join(' | ')}\n`);
      if (!merged.question_text) continue; // Must have question text
    }

    results.push(buildProcessedQ(merged, questions[i], 'JEEMains', '12'));
  }
  return results;
}

// ─── FULL CURATION: generate from topic stubs — sub-batch of 10 per AI call ─
const AI_SUB_BATCH = 10; // Max questions per single AI call to prevent truncation

async function fullCurationSubBatch(questions: RawQuestion[]): Promise<ProcessedQ[]> {
  const prompt = `You are ExamCompass Senior Curator. Generate COMPLETE exam questions from topic stubs.
Return JSON: {"results":[${questions.length} question objects]}

Each object MUST have ALL these fields:
- question_text: Complete, unambiguous question in proper English. Use $...$ inline LaTeX, $$...$$ block.
- type: "MCQ" | "Multi-correct" | "Integer"
  • MCQ: single correct, 4 options (default for all exams)
  • Multi-correct: 1-4 correct options — JEE Advanced ONLY, use ~30% of JEE Adv questions
  • Integer: numerical answer 0-99 (may be decimal) — JEE Mains Section B ONLY, ~20% of JEE Mains
- options: Array of 4 strings for MCQ/Multi-correct. EMPTY ARRAY [] for Integer.
  • Options must be numerically/conceptually DISTINCT
  • Include plausible wrong options (common mistakes, sign errors, unit errors)
  • NO trick by minor wording changes — distinguish by value or concept
- correct_answer:
  • MCQ: exact verbatim copy of correct option string
  • Multi-correct: JSON string e.g. '["Option B text","Option D text"]' (1-4 items)
  • Integer: numeric string e.g. "7" or "2.50"
- explanation: 2-4 line step-by-step solution (LaTeX ok, plain English mandatory)
- solution_steps: array of 3-6 strings ["Step 1: Apply...", "Step 2: Substitute...", ...]
- primary_topic: canonical chapter name
- primary_subtopic: specific concept tested
- primary_topic_id: slug like "phy_12_jm_electrostatics"
- secondary_topic_ids: [] or slugs if cross-chapter (ENCOURAGED for JEE Adv)
- concept_tags: array of 3-8 fine-grained concept strings
- cross_chapter: 1 if spans 2+ chapters, else 0
- cross_subject: 1 if spans 2+ subjects (rare), else 0
- also_for: [] or ["NEET"] or ["Board"] if useful for other exam types
- subject: "Physics"|"Chemistry"|"Mathematics"|"Biology"|"Science"|"Social"
- class: "8"|"9"|"10"|"11"|"12"
- exam: "JEEMains"|"JEEAdvanced"|"NEET"|"Board"
- difficulty_band: exact band_id from the ELO BAND TABLE below
- elo: integer within that band's range
- step_count: 1-6 (how many distinct reasoning steps)
- key_formula: primary formula/concept, or ""
- error_trap_type: dot-notation e.g. "physics.emi.lenz_law_direction"

GENERATION GUIDELINES BY CLASS:
- Class 12 JEE Mains: LaTeX, multi-step, mix of MCQ+Integer, formula chain
- Class 12 JEE Advanced: Multi-step, cross-chapter mandatory, Multi-correct OR Integer common
- Class 11 JEE: Concept-building, derivation path clear
- Class 10-8 Board: Simple English, direct formula, NO calculus, MCQ only
- NEET Biology: Factual + application, no math needed, option traps on similar terms
- NEET Physics/Chem: Application-based, formula required, MCQ only

${ELO_BAND_REFERENCE}

STUBS TO GENERATE FROM:
${questions.map((q,i) => `[${i+1}] ${q.raw_text}`).join('\n')}`;

  const parsed = await callAI(prompt, 8000, 'full_curation');
  const results: ProcessedQ[] = [];

  for (let i = 0; i < questions.length; i++) {
    const aiOut = parsed?.results?.[i];
    if (!aiOut) {
      process.stdout.write(`    ⚠️  Q${i+1} missing in AI output — skipping\n`);
      continue;
    }

    const defaultExam  = questions[i].exam   || 'JEEMains';
    const defaultClass = questions[i].class?.replace('Class ', '') || '12';
    const { ok, errors } = validateQ(aiOut, i + 1, defaultExam, defaultClass);

    if (!ok) {
      process.stdout.write(`    ⚠️  ${errors.join(' | ')}\n`);
      if (!aiOut?.question_text) continue;
      if ((aiOut?.type === 'MCQ' || !aiOut?.type) && (!Array.isArray(aiOut?.options) || aiOut.options.length < 4)) continue;
    }

    results.push(buildProcessedQ(aiOut, questions[i], defaultExam, defaultClass));
  }
  return results;
}

// Wrapper: splits large batches into sub-batches of AI_SUB_BATCH and aggregates
async function fullCurationBatch(questions: RawQuestion[]): Promise<ProcessedQ[]> {
  if (questions.length <= AI_SUB_BATCH) {
    return fullCurationSubBatch(questions);
  }
  const all: ProcessedQ[] = [];
  for (let i = 0; i < questions.length; i += AI_SUB_BATCH) {
    const chunk = questions.slice(i, i + AI_SUB_BATCH);
    const results = await fullCurationSubBatch(chunk);
    all.push(...results);
  }
  return all;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────
function progressBar(done: number, total: number, qpm: number): void {
  const pct    = total > 0 ? done / total : 0;
  const filled = Math.round(pct * 20);
  const bar    = '═'.repeat(filled) + '╸' + '─'.repeat(Math.max(0, 19 - filled));
  const remaining = total - done;
  const etaSec = qpm > 0 ? Math.round(remaining / qpm * 60) : 0;
  const eta    = etaSec > 3600 ? `${Math.round(etaSec/3600)}h` : etaSec > 60 ? `${Math.round(etaSec/60)}m` : `${etaSec}s`;
  process.stdout.write(`\r  [${bar}] ${(pct*100).toFixed(0).padStart(3)}% (${done}/${total}) ${qpm.toFixed(0)} q/min ETA:${eta}    `);
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('═'.repeat(70));
  console.log(`🚀 EXAMCOMPASS PIPELINE v4.0 — ${MODE.toUpperCase()}`);
  console.log(`   Types: MCQ | Multi-correct | Integer  ·  Schema: v2  ·  ELO: 14-band`);
  console.log(`   Batch: ${BATCH_SIZE} | Workers: ${CONCURRENCY} | Limit: ${LIMIT}`);
  console.log(`   Cerebras: ${cerebrasKeys.count} keys | Gemini: ${geminiKeys.count} keys | Groq: ${groqKeys.count} keys`);
  console.log(`   Daily used → Cerebras: ${limits.cerebras} | Gemini: ${limits.gemini} | Groq: ${limits.groq}`);
  if (FILTER_CLASS) console.log(`   Filter: Class ${FILTER_CLASS} ${FILTER_EXAM}`);
  if (DRY_RUN) console.log('   ⚠️  DRY RUN — no SQL written');
  console.log('═'.repeat(70) + '\n');

  if (!fs.existsSync(CACHE_FILE)) {
    console.error(`❌ Cache not found: ${CACHE_FILE}`);
    console.log('   Run first: npx tsx scripts/distribution-manager.ts --stubs=2000');
    process.exit(1);
  }

  const doneHashes: Set<string> = new Set(
    fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8')) : []
  );

  let allRaw: RawQuestion[] = fs.readFileSync(CACHE_FILE, 'utf-8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean)
    .slice(OFFSET, OFFSET + LIMIT);

  if (FILTER_CLASS) allRaw = allRaw.filter(q => (q.class || '').includes(FILTER_CLASS));
  if (FILTER_EXAM)  allRaw = allRaw.filter(q => q.exam === FILTER_EXAM);

  const eligible = allRaw
    .filter(q => !doneHashes.has(q.hash))
    .filter(q => MODE === 'fast_tag' ? q.quality === 'verified' : q.quality === 'raw');

  console.log(`📦 Cache: ${allRaw.length} | Eligible: ${eligible.length}\n`);
  if (eligible.length === 0) {
    console.log('✅ Nothing to process. Generate stubs:');
    console.log('   npx tsx scripts/distribution-manager.ts --stubs=2000');
    return;
  }

  if (!DRY_RUN && !fs.existsSync(SEED_FILE)) {
    fs.writeFileSync(SEED_FILE,
      `-- ExamCompass D1 Seed v2\n-- Generated: ${new Date().toISOString()}\n-- Mode: ${MODE}\n\n`,
      'utf-8'
    );
  }

  const batches: RawQuestion[][] = [];
  for (let i = 0; i < eligible.length; i += BATCH_SIZE)
    batches.push(eligible.slice(i, i + BATCH_SIZE));

  const startMs = Date.now();
  let totalOk = 0, totalSkipped = 0;
  const batchRef = { idx: 0 };

  async function processBatch(batch: RawQuestion[], label: string): Promise<void> {
    try {
      const processed = MODE === 'fast_tag'
        ? await fastTagBatch(batch)
        : await fullCurationBatch(batch);
      if (!DRY_RUN) {
        for (const q of processed) writeSql(q);
        for (const raw of batch) doneHashes.add(raw.hash);
        fs.writeFileSync(DONE_FILE, JSON.stringify([...doneHashes]), 'utf-8');
      }
      totalOk      += processed.length;
      totalSkipped += batch.length - processed.length;
    } catch (e: any) {
      if (batch.length > 1) {
        // Auto-split on failure (TRUNCATED, long context, etc.)
        const half = Math.ceil(batch.length / 2);
        await processBatch(batch.slice(0, half), label + 'a');
        await processBatch(batch.slice(half),     label + 'b');
        return;
      }
      process.stdout.write(`\n  ❌ ${label} failed (single-q): ${e.message?.slice(0, 80)}\n`);
      totalSkipped += batch.length;
    }
  }

  async function worker(): Promise<void> {
    while (batchRef.idx < batches.length) {
      const myIdx = batchRef.idx++;
      await processBatch(batches[myIdx], `B${myIdx+1}`);
      const elapsed = (Date.now() - startMs) / 1000 / 60;
      const qpm = elapsed > 0 ? totalOk / elapsed : 0;
      progressBar(totalOk + totalSkipped, eligible.length, qpm);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker));

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const rate    = totalOk / (Number(elapsed) / 60);

  const report = `# ExamCompass Batch Pipeline Report v4.0
Generated: ${new Date().toLocaleString()}
Mode: ${MODE} | Batch: ${BATCH_SIZE} | Workers: ${CONCURRENCY}
Types: MCQ, Multi-correct (JEE Adv), Integer (JEE Mains B)

| Metric | Value |
|--------|-------|
| Processed ✅ | **${totalOk}** |
| Skipped ❌ | ${totalSkipped} |
| Throughput | **${rate.toFixed(0)} q/min** |
| Time | ${elapsed}s |
| Cerebras calls today | ${limits.cerebras} / ${CEREBRAS_DAILY_MAX} |
| Gemini calls today | ${limits.gemini} / ${GEMINI_DAILY_MAX} |
| Groq calls today | ${limits.groq} / ${GROQ_DAILY_MAX} |
`;
  fs.writeFileSync(REPORT_FILE, report, 'utf-8');

  console.log('\n\n' + '═'.repeat(70));
  console.log(`📊 DONE: ${totalOk} OK | ${totalSkipped} skipped | ${rate.toFixed(0)} q/min`);
  console.log(`   Seed: ${SEED_FILE}`);
  console.log(`   API → Cerebras: ${limits.cerebras} | Gemini: ${limits.gemini} | Groq: ${limits.groq}`);
  console.log('═'.repeat(70));
}

main().catch(e => { console.error('\n💥 FATAL:', e.message); process.exit(1); });
