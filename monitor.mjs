// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS LIVE SPEED MONITOR  (pure JS, no TypeScript)
// Usage: node monitor.mjs
//        node monitor.mjs --interval=3 --target=30000
// Open in a SECOND terminal while run-db-scale.cmd is running
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname);

const argv     = process.argv.slice(2);
const INTERVAL = Number((argv.find(a => a.startsWith('--interval=')) || '--interval=3').split('=')[1]) * 1000;
const TARGET   = Number((argv.find(a => a.startsWith('--target='))   || '--target=30000').split('=')[1]);

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  green:   '\x1b[32m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  gray:    '\x1b[90m',
  white:   '\x1b[97m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
};

// ─── Data readers ─────────────────────────────────────────────────────────────
let lastSeedFilePos = 0;
let cachedSeedCount = 0;
let dbScriptInitialized = false;

function getSeedCount() {
  try {
    const f = path.join(ROOT, 'scripts', 'seed.sql');
    if (!fs.existsSync(f)) {
      lastSeedFilePos = 0;
      cachedSeedCount = 0;
      return 0;
    }
    const stat = fs.statSync(f);
    if (stat.size < lastSeedFilePos) {
      // File was truncated or recreated
      lastSeedFilePos = 0;
      cachedSeedCount = 0;
    }
    if (stat.size === lastSeedFilePos) {
      return cachedSeedCount;
    }
    
    // Read new chunk
    const fd = fs.openSync(f, 'r');
    const bufferSize = stat.size - lastSeedFilePos;
    const buffer = Buffer.alloc(bufferSize);
    fs.readSync(fd, buffer, 0, bufferSize, lastSeedFilePos);
    fs.closeSync(fd);
    
    const newContent = buffer.toString('utf-8');
    const matches = newContent.match(/^INSERT/gm);
    const newInserts = matches ? matches.length : 0;
    
    cachedSeedCount += newInserts;
    lastSeedFilePos = stat.size;
    return cachedSeedCount;
  } catch {
    // Fallback: full read if incremental read fails
    try {
      const f = path.join(ROOT, 'scripts', 'seed.sql');
      if (!fs.existsSync(f)) return 0;
      const content = fs.readFileSync(f, 'utf-8');
      const count = (content.match(/^INSERT/gm) || []).length;
      cachedSeedCount = count;
      lastSeedFilePos = content.length;
      return count;
    } catch {
      return cachedSeedCount;
    }
  }
}

function getDbCount() {
  try {
    const script = path.join(ROOT, 'scratch', '_monitor_count.py');
    if (!dbScriptInitialized || !fs.existsSync(script)) {
      fs.writeFileSync(script, [
        'import sqlite3, glob, os',
        "files = [x for x in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite') if 'metadata' not in x]",
        "files.sort(key=lambda x: os.path.getsize(x), reverse=True)",
        "if not files:",
        "    print(0)",
        "else:",
        "    conn = sqlite3.connect(files[0])",
        "    print(conn.execute('SELECT count(*) FROM questions').fetchone()[0])",
        "    conn.close()",
      ].join('\n'));
      dbScriptInitialized = true;
    }
    const r = execSync(`python "${script}"`, { cwd: ROOT, encoding: 'utf-8', timeout: 6000 });
    return parseInt(r.trim()) || 0;
  } catch { return 0; }
}

function getLimits() {
  try {
    const f = path.join(ROOT, 'scratch', 'daily_limits.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf-8'));
  } catch {}
  return { cerebras: 0, gemini: 0, groq: 0 };
}

function getLastReport() {
  try {
    const f = path.join(ROOT, 'turbo_pipeline_report.md');
    if (!fs.existsSync(f)) return '(no run yet)';
    const lines = fs.readFileSync(f, 'utf-8').split('\n');
    const ts    = lines.find(l => l.startsWith('Generated:')) || '';
    const spd   = lines.find(l => l.includes('Speed')) || '';
    const gen   = lines.find(l => l.includes('Generated') && l.includes('**')) || '';
    const spd2  = spd.replace(/\|/g,'').replace(/Speed/,'').replace(/\*/g,'').trim();
    const gen2  = gen.replace(/\|/g,'').replace(/Generated/,'').replace(/\*/g,'').trim();
    return `${ts} | ${gen2} | ${spd2}`.replace(/\s+/g,' ');
  } catch { return '(error)'; }
}

// ─── Render helpers ───────────────────────────────────────────────────────────
function progBar(pct, width = 30) {
  const filled = Math.round(Math.min(pct, 100) / 100 * width);
  const color  = pct > 80 ? C.green : pct > 50 ? C.yellow : C.cyan;
  return color + '█'.repeat(filled) + C.gray + '░'.repeat(width - filled) + C.reset;
}

function apiBar(used, max, width = 20) {
  const pct    = used / max * 100;
  const filled = Math.round(Math.min(pct, 100) / 100 * width);
  const color  = pct > 80 ? C.red : pct > 50 ? C.yellow : C.green;
  return color + '█'.repeat(filled) + C.gray + '░'.repeat(width - filled) + C.reset;
}

function miniChart(arr, width = 42) {
  if (arr.length < 2) return C.gray + '  (waiting for data...)' + C.reset;
  const max    = Math.max(...arr, 1);
  const chars  = ['▁','▂','▃','▄','▅','▆','▇','█'];
  const recent = arr.slice(-width);
  let line = '  ';
  for (const v of recent) {
    const idx   = Math.min(Math.floor(v / max * (chars.length - 1)), chars.length - 1);
    const color = v > max * 0.7 ? C.green : v > max * 0.3 ? C.yellow : C.red;
    line += color + chars[idx] + C.reset;
  }
  return line;
}

function fmt(n) { return n.toLocaleString(); }

// ─── State ────────────────────────────────────────────────────────────────────
const samples     = [];    // { time, seedQ, dbQ }
const speedHist   = [];    // q/min per sample
let sessionStart  = Date.now();
let sessionStartQ = null;

// ─── Main render loop ─────────────────────────────────────────────────────────
function render() {
  const now   = Date.now();
  const seedQ = getSeedCount();
  const dbQ   = getDbCount();
  const lim   = getLimits();
  const rep   = getLastReport();

  if (sessionStartQ === null) sessionStartQ = seedQ;

  samples.push({ time: now, seedQ, dbQ });
  if (samples.length > 120) samples.shift();

  // q/sec + q/min (based on last interval for instant, and rolling 30s)
  let qPerSec = 0, qPerMin = 0;
  let qPerSec30 = 0, qPerMin30 = 0, dq30 = 0;
  
  if (samples.length >= 2) {
    // Inst: last interval
    const prevInst = samples[samples.length - 2];
    const dtSInst  = (now - prevInst.time) / 1000;
    const dqInst   = seedQ - prevInst.seedQ;
    qPerSec        = dtSInst > 0 ? dqInst / dtSInst : 0;
    qPerMin        = qPerSec * 60;
    
    // 30s rolling average (up to 10 samples back)
    const prev30 = samples[Math.max(0, samples.length - 11)];
    const dtS30  = (now - prev30.time) / 1000;
    dq30         = seedQ - prev30.seedQ;
    qPerSec30    = dtS30 > 0 ? dq30 / dtS30 : 0;
    qPerMin30    = qPerSec30 * 60;
  }

  // Speed history holds the 30s average to make the chart smooth
  speedHist.push(Math.max(0, qPerMin30));
  if (speedHist.length > 42) speedHist.shift();

  const sessionMin    = (now - sessionStart) / 1000 / 60;
  const sessionGained = seedQ - sessionStartQ;
  const sessionQpm    = sessionMin > 0 ? sessionGained / sessionMin : 0;

  const remaining = Math.max(0, TARGET - seedQ);
  // Use the 30s rolling average speed for ETA if active, otherwise session average
  const etaMin    = qPerMin30 > 1 ? remaining / qPerMin30 : (sessionQpm > 0 ? remaining / sessionQpm : 0);
  const etaStr    = etaMin > 0
    ? etaMin > 60 ? `${(etaMin / 60).toFixed(1)}h` : `${Math.ceil(etaMin)}min`
    : '?';

  const pct = Math.min(100, seedQ / TARGET * 100);
  const W   = 64;

  // Clear screen
  process.stdout.write('\x1b[2J\x1b[H');

  const ln = (s = '') => process.stdout.write(s + '\n');

  ln();
  ln(`${C.bold}${C.cyan}  ${'═'.repeat(W)}${C.reset}`);
  ln(`${C.bold}${C.cyan}    EXAMCOMPASS LIVE MONITOR  ${C.gray}${new Date().toLocaleTimeString()}${C.reset}`);
  ln(`${C.bold}${C.cyan}  ${'═'.repeat(W)}${C.reset}`);
  ln();

  // ── Speed ──
  const sc = qPerMin30 > 200 ? C.green : qPerMin30 > 50 ? C.yellow : qPerMin30 > 0 ? C.red : C.gray;
  ln(`  ${C.bold}SPEED${C.reset}`);
  ln(`  ${sc}${C.bold}${qPerSec.toFixed(2).padStart(6)} q/sec (inst)${C.reset}  |  ${sc}${C.bold}${Math.round(qPerMin30).toString().padStart(4)} q/min (30s avg)${C.reset}  |  ${C.gray}+${dq30} q in last 30s${C.reset}`);
  ln(`  ${C.dim}Session avg: ${Math.round(sessionQpm)} q/min  (+${fmt(sessionGained)} this session, ${sessionMin.toFixed(1)}min)${C.reset}`);
  ln();

  // ── Chart ──
  const maxSpd = Math.max(...speedHist, 1);
  ln(`  ${C.bold}SPEED CHART${C.reset}  ${C.gray}peak=${Math.round(maxSpd)} q/min  (each bar = ${INTERVAL/1000}s)${C.reset}`);
  ln(miniChart(speedHist));
  ln();

  ln(`  ${C.gray}${'─'.repeat(W)}${C.reset}`);

  // ── Progress ──
  ln(`  ${C.bold}PROGRESS TO ${fmt(TARGET)}${C.reset}`);
  ln(`  seed.sql : ${C.bold}${C.white}${fmt(seedQ)}${C.reset}  questions`);
  ln(`  SQLite   : ${C.white}${fmt(dbQ)}${C.reset}  ${C.gray}(gap: ${fmt(seedQ - dbQ)} not yet imported)${C.reset}`);
  ln(`  Remaining: ${C.yellow}${fmt(remaining)}${C.reset}  |  ETA: ${C.cyan}${etaStr}${C.reset}`);
  ln();
  ln(`  [${progBar(pct, 50)}] ${C.bold}${pct.toFixed(1)}%${C.reset}`);
  ln();

  ln(`  ${C.gray}${'─'.repeat(W)}${C.reset}`);

  // ── API ──
  ln(`  ${C.bold}API CALLS TODAY${C.reset}`);
  ln(`  Cerebras  [${apiBar(lim.cerebras, 50000)}] ${fmt(lim.cerebras).padStart(6)} / 50000`);
  ln(`  Gemini    [${apiBar(lim.gemini,   10000)}] ${fmt(lim.gemini).padStart(6)} / 10000`);
  ln(`  Groq      [${apiBar(lim.groq,     15000)}] ${fmt(lim.groq).padStart(6)} / 15000`);
  ln();

  ln(`  ${C.gray}${'─'.repeat(W)}${C.reset}`);

  // ── Last run ──
  ln(`  ${C.bold}LAST RUN${C.reset}`);
  ln(`  ${C.gray}${rep.slice(0, W + 10)}${C.reset}`);
  ln();

  ln(`  ${C.dim}Refresh: ${INTERVAL/1000}s | Ctrl+C to stop | Run pipeline: .\\run-db-scale.cmd run${C.reset}`);
  ln(`${C.bold}${C.cyan}  ${'═'.repeat(W)}${C.reset}`);
}

process.stdout.write('\x1b[2J\x1b[H');
process.stdout.write('  Starting monitor (first read ~5s)...\n');

render();
const id = setInterval(render, INTERVAL);

process.on('SIGINT', () => {
  clearInterval(id);
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('  Monitor stopped.');
  process.exit(0);
});
