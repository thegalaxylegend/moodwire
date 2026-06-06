// ═══════════════════════════════════════════════════════════════════════
// EXAMCOMPASS KEY HEALTH CHECK
// Tests ALL keys × ALL models in parallel — shows what's working RIGHT NOW
// Takes ~8-15 seconds to complete
//
// Usage: npx tsx scripts/check-keys.ts
// ═══════════════════════════════════════════════════════════════════════
import 'dotenv/config';

const ENV = process.env as Record<string, string | undefined>;

// ─── All keys ────────────────────────────────────────────────────────────────
const CEREBRAS_KEYS = [
  ENV.CEREBRAS_API_KEY,    ENV.CEREBRAS_API_KEY_2, ENV.CEREBRAS_API_KEY_3, ENV.CEREBRAS_API_KEY_4,
  ENV.CEREBRAS_API_KEY_5,  ENV.CEREBRAS_API_KEY_6, ENV.CEREBRAS_API_KEY_7, ENV.CEREBRAS_API_KEY_8,
].map((k, i) => ({ key: k, label: `CB-K${i+1}` })).filter(x => x.key) as { key: string; label: string }[];

const GEMINI_KEYS = [
  ENV.VITE_GEMINI_API_KEY,   ENV.VITE_GEMINI_API_KEY_2, ENV.VITE_GEMINI_API_KEY_3,
  ENV.VITE_GEMINI_API_KEY_4, ENV.VITE_GEMINI_API_KEY_5, ENV.VITE_GEMINI_API_KEY_6,
].map((k, i) => ({ key: k, label: `GM-K${i+1}` })).filter(x => x.key) as { key: string; label: string }[];

const GROQ_KEYS = [
  ENV.VITE_GROQ_API_KEY,   ENV.VITE_GROQ_API_KEY_2, ENV.VITE_GROQ_API_KEY_3, ENV.VITE_GROQ_API_KEY_4,
  ENV.VITE_GROQ_API_KEY_5, ENV.VITE_GROQ_API_KEY_6, ENV.VITE_GROQ_API_KEY_7, ENV.VITE_GROQ_API_KEY_8,
].map((k, i) => ({ key: k, label: `GQ-K${i+1}` })).filter(x => x.key) as { key: string; label: string }[];

// ─── All models to test ───────────────────────────────────────────────────────
// CONFIRMED LIVE MODELS (health-checked 2026-06-05):
// Cerebras: gpt-oss-120b OK (all 8 keys) | zai-glm-4.7 OK (all 8 keys)
// Cerebras: qwen-3-235b DEAD | llama3.1-8b DEAD
// Gemini: gemini-2.5-flash OK (K2-K6)
// Groq: llama-3.3-70b OK (K1-K7) | llama-3.1-8b OK (K1-K6+K8) | qwen3-32b DEAD
const CEREBRAS_MODELS = [
  'gpt-oss-120b',
  'zai-glm-4.7',
  // qwen-3-235b-a22b-instruct-2507 DEAD — not testing
  // llama3.1-8b DEAD — not testing
];
const GEMINI_MODELS = ['gemini-2.5-flash'];
const GROQ_MODELS   = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
// qwen/qwen3-32b DEAD on all Groq keys — not testing

const TINY_PROMPT = 'Reply with only valid JSON: {"ok":true}';

// ─── Test functions ───────────────────────────────────────────────────────────
interface TestResult {
  label: string;
  model: string;
  status: 'OK' | 'RATE' | 'BLOCK' | 'AUTH' | 'FAIL';
  latencyMs?: number;
  error?: string;
}

async function testCerebras(key: string, label: string, model: string): Promise<TestResult> {
  const t0 = Date.now();
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role:'user', content: TINY_PROMPT }],
        max_completion_tokens: 20, temperature: 0, response_format: { type: 'json_object' } }),
    });
    const latencyMs = Date.now() - t0;
    if (res.status === 429) return { label, model, status: 'RATE', latencyMs };
    if (res.status === 401) return { label, model, status: 'AUTH', latencyMs };
    if (!res.ok) {
      const txt = await res.text();
      if (txt.includes('does not exist') || txt.includes('deprecated') || txt.includes('not found'))
        return { label, model, status: 'BLOCK', latencyMs, error: `model dead (${res.status})` };
      return { label, model, status: 'FAIL', latencyMs, error: `HTTP ${res.status}` };
    }
    return { label, model, status: 'OK', latencyMs };
  } catch (e: any) {
    return { label, model, status: 'FAIL', latencyMs: Date.now() - t0, error: e.message?.slice(0,40) };
  }
}

async function testGemini(key: string, label: string, model: string): Promise<TestResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents:[{ parts:[{ text: TINY_PROMPT }] }],
          generationConfig: { maxOutputTokens: 20, responseMimeType: 'application/json' } }) }
    );
    const latencyMs = Date.now() - t0;
    if (res.status === 429) return { label, model, status: 'RATE', latencyMs };
    if (res.status === 400) return { label, model, status: 'BLOCK', latencyMs, error: 'bad request' };
    if (!res.ok) return { label, model, status: 'FAIL', latencyMs, error: `HTTP ${res.status}` };
    return { label, model, status: 'OK', latencyMs };
  } catch (e: any) {
    return { label, model, status: 'FAIL', latencyMs: Date.now() - t0, error: e.message?.slice(0,40) };
  }
}

async function testGroq(key: string, label: string, model: string): Promise<TestResult> {
  const t0 = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role:'user', content: TINY_PROMPT }],
        max_tokens: 20, temperature: 0, response_format: { type: 'json_object' } }),
    });
    const latencyMs = Date.now() - t0;
    if (res.status === 429) return { label, model, status: 'RATE', latencyMs };
    if (res.status === 401) return { label, model, status: 'AUTH', latencyMs };
    if (res.status === 403) return { label, model, status: 'BLOCK', latencyMs, error: 'blocked at project' };
    if (!res.ok) {
      const txt = await res.text();
      if (txt.includes('blocked') || txt.includes('decommissioned'))
        return { label, model, status: 'BLOCK', latencyMs };
      return { label, model, status: 'FAIL', latencyMs, error: `HTTP ${res.status}` };
    }
    return { label, model, status: 'OK', latencyMs };
  } catch (e: any) {
    return { label, model, status: 'FAIL', latencyMs: Date.now() - t0, error: e.message?.slice(0,40) };
  }
}

// ─── Display helpers ──────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
  bold:   '\x1b[1m',
};

function statusIcon(s: TestResult['status']): string {
  switch (s) {
    case 'OK':    return `${C.green}  OK  ${C.reset}`;
    case 'RATE':  return `${C.yellow} RATE ${C.reset}`;
    case 'BLOCK': return `${C.red} BLCK ${C.reset}`;
    case 'AUTH':  return `${C.red} AUTH ${C.reset}`;
    case 'FAIL':  return `${C.red} FAIL ${C.reset}`;
  }
}

function printSection(title: string, results: TestResult[], models: string[]) {
  console.log(`\n${C.bold}${C.cyan}  ── ${title} ──${C.reset}`);

  // Header
  const col0 = '  KEY'.padEnd(9);
  const modelCols = models.map(m => m.split('/').pop()!.slice(0,16).padEnd(18)).join('');
  console.log(`${C.gray}${col0}${modelCols}${C.reset}`);
  console.log(`${C.gray}  ${'─'.repeat(9 + models.length * 18)}${C.reset}`);

  // Group by key label
  const keyLabels = [...new Set(results.map(r => r.label))];
  for (const label of keyLabels) {
    const row = results.filter(r => r.label === label);
    let line = `  ${label.padEnd(7)}`;
    for (const m of models) {
      const r = row.find(x => x.model === m);
      if (!r) { line += '  ----              '; continue; }
      const icon   = statusIcon(r.status);
      const ms     = r.latencyMs ? `${r.latencyMs}ms` : '';
      const errStr = r.error ? `(${r.error.slice(0,10)})` : '';
      line += `${icon}${C.gray}${(ms + errStr).slice(0,11).padEnd(12)}${C.reset}`;
    }
    console.log(line);
  }

  // Summary
  const ok   = results.filter(r => r.status === 'OK').length;
  const rate = results.filter(r => r.status === 'RATE').length;
  const fail = results.filter(r => r.status === 'BLOCK' || r.status === 'FAIL' || r.status === 'AUTH').length;
  const avgMs = Math.round(results.filter(r => r.status === 'OK' && r.latencyMs).reduce((s,r) => s + r.latencyMs!, 0) / Math.max(ok, 1));
  console.log(`  ${C.gray}Summary: ${C.green}${ok} OK${C.gray} | ${C.yellow}${rate} RATE${C.gray} | ${C.red}${fail} FAIL${C.gray} | avg ${avgMs}ms${C.reset}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log(`\n${C.bold}${'═'.repeat(70)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  EXAMCOMPASS KEY HEALTH CHECK — Testing all keys + models in parallel${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(70)}${C.reset}`);
  console.log(`  ${C.gray}Keys found: Cerebras:${CEREBRAS_KEYS.length} | Gemini:${GEMINI_KEYS.length} | Groq:${GROQ_KEYS.length}${C.reset}`);
  console.log(`  ${C.gray}Testing... (this takes ~10s)${C.reset}`);

  // Fire everything in parallel
  const allTests: Promise<TestResult>[] = [];

  for (const { key, label } of CEREBRAS_KEYS)
    for (const model of CEREBRAS_MODELS)
      allTests.push(testCerebras(key, label, model));

  for (const { key, label } of GEMINI_KEYS)
    for (const model of GEMINI_MODELS)
      allTests.push(testGemini(key, label, model));

  for (const { key, label } of GROQ_KEYS)
    for (const model of GROQ_MODELS)
      allTests.push(testGroq(key, label, model));

  const results = await Promise.all(allTests);

  const cerebrasResults = results.filter(r => CEREBRAS_KEYS.some(k => k.label === r.label));
  const geminiResults   = results.filter(r => GEMINI_KEYS.some(k => k.label === r.label));
  const groqResults     = results.filter(r => GROQ_KEYS.some(k => k.label === r.label));

  printSection('CEREBRAS', cerebrasResults, CEREBRAS_MODELS);
  printSection('GEMINI', geminiResults, GEMINI_MODELS);
  printSection('GROQ', groqResults, GROQ_MODELS);

  // ─── Working Slots Summary ──────────────────────────────────────────────────
  const workingSlots = results.filter(r => r.status === 'OK');
  const rateLimited  = results.filter(r => r.status === 'RATE');
  const totalElapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n${C.bold}${'═'.repeat(70)}${C.reset}`);
  console.log(`${C.bold}${C.white}  WORKING SLOTS (ready to generate NOW):${C.reset}`);

  // Group by provider and model
  const byModel = new Map<string, TestResult[]>();
  for (const r of workingSlots) {
    if (!byModel.has(r.model)) byModel.set(r.model, []);
    byModel.get(r.model)!.push(r);
  }
  for (const [model, rs] of byModel) {
    const keys = rs.map(r => r.label).join(', ');
    const avgMs = Math.round(rs.reduce((s,r) => s + (r.latencyMs||0), 0) / rs.length);
    console.log(`  ${C.green}✓${C.reset} ${model.split('/').pop()!.padEnd(32)} ${C.white}${rs.length} keys${C.reset}  ${C.gray}(avg ${avgMs}ms)  [${keys}]${C.reset}`);
  }

  if (rateLimited.length > 0) {
    console.log(`\n${C.bold}${C.yellow}  RATE LIMITED (429 — will recover in 1 min):${C.reset}`);
    const byModelRate = new Map<string, string[]>();
    for (const r of rateLimited) {
      if (!byModelRate.has(r.model)) byModelRate.set(r.model, []);
      byModelRate.get(r.model)!.push(r.label);
    }
    for (const [model, keys] of byModelRate) {
      console.log(`  ${C.yellow}⚡${C.reset} ${model.split('/').pop()!.padEnd(32)} ${keys.join(', ')}`);
    }
  }

  // Speed estimate
  const parallelSlots = Math.min(workingSlots.length, 24);
  const avgLatency    = workingSlots.reduce((s,r) => s + (r.latencyMs||0), 0) / Math.max(workingSlots.length, 1);
  const estQpm        = avgLatency > 0 ? Math.round(parallelSlots * 5 / (avgLatency / 1000) * 60) : 0;

  console.log(`\n${C.bold}${'═'.repeat(70)}${C.reset}`);
  console.log(`  ${C.green}Working slots: ${workingSlots.length}${C.reset}  |  ${C.yellow}Rate-limited: ${rateLimited.length}${C.reset}  |  Total tested: ${results.length}`);
  console.log(`  ${C.cyan}Estimated speed with --workers=24: ~${Math.min(estQpm, 500)} q/min${C.reset}`);
  console.log(`  ${C.gray}Check took ${totalElapsed}s${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(70)}${C.reset}\n`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
