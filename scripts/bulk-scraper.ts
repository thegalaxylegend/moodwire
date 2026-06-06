// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS BULK QUESTION SCRAPER v2.0
// Fetches from confirmed working GitHub sources → normalises → JSONL cache
// Run: npx tsx scripts/bulk-scraper.ts [--source=<name>]
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR  = path.join(__dirname, '..', 'scratch');
const CACHE_FILE = path.join(CACHE_DIR, 'raw_questions_cache.jsonl');

// ─── Types ────────────────────────────────────────────────────────
export interface RawQuestion {
  hash:         string;
  source:       string;
  source_exam:  string;
  year?:        number;
  paper?:       string;
  question_no?: number;
  raw_text:     string;
  raw_options:  string[];
  raw_answer:   string;
  subject?:     string;
  class?:       string;
  exam?:        string;
  quality:      'verified' | 'raw';
}

// ─── Helpers ──────────────────────────────────────────────────────
function makeHash(text: string, options: string[]): string {
  const norm = (text + options.join('')).toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

async function fetchJson(url: string, ms = 30000): Promise<any> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function loadExistingHashes(): Set<string> {
  const hashes = new Set<string>();
  if (!fs.existsSync(CACHE_FILE)) return hashes;
  const lines = fs.readFileSync(CACHE_FILE, 'utf-8').split('\n').filter(Boolean);
  for (const line of lines) {
    try { hashes.add(JSON.parse(line).hash); } catch {}
  }
  return hashes;
}

function appendToCache(questions: RawQuestion[]): { written: number; skipped: number } {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const existing = loadExistingHashes();
  const stream   = fs.createWriteStream(CACHE_FILE, { flags: 'a' });
  let written = 0, skipped = 0;
  for (const q of questions) {
    if (existing.has(q.hash)) { skipped++; continue; }
    stream.write(JSON.stringify(q) + '\n');
    existing.add(q.hash);
    written++;
  }
  stream.end();
  return { written, skipped };
}

// ─── Parser: Samkarya / online-exam-questions schema ─────────────
// Schema: { question_number, subject, question_text, options:{a,b,c,d}, correct_answer:"a"|"b"|"c"|"d" }
function parseSamkaryaSchema(
  arr: any[],
  sourceLabel: string,
  examLabel: string,
  examType: 'JEEMains' | 'JEEAdvanced' | 'NEET',
  year?: number,
  paper?: string
): RawQuestion[] {
  const results: RawQuestion[] = [];
  for (const item of arr) {
    const text = String(item.question_text || '').trim();
    if (!text) continue;

    // Options: { a: "...", b: "...", c: "...", d: "..." }
    const optsMap: Record<string, string> = item.options || {};
    const opts = ['a','b','c','d'].map(k => String(optsMap[k] || '').trim()).filter(Boolean);
    if (opts.length < 2) continue;

    // correct_answer is "a"/"b"/"c"/"d" — convert to verbatim option text
    const ansKey = String(item.correct_answer || '').toLowerCase().trim();
    const ansIdx = ['a','b','c','d'].indexOf(ansKey);
    const answer = ansIdx >= 0 && opts[ansIdx] ? opts[ansIdx] : ansKey;

    results.push({
      hash:        makeHash(text, opts),
      source:      sourceLabel,
      source_exam: examLabel,
      year,
      paper,
      question_no: item.question_number,
      raw_text:    text,
      raw_options: opts,
      raw_answer:  answer,
      subject:     item.subject || undefined,
      class:       'Class 12',
      exam:        examType,
      quality:     'verified',
    });
  }
  return results;
}

// ─── Source 1: JEE Mains 2025 (Samkarya repo — confirmed working) ─
// Repo: Samkarya/online-exam-questions — real NTA papers, LaTeX-formatted
const JEE_MAINS_FILES = [
  { url: 'https://raw.githubusercontent.com/Samkarya/online-exam-questions/main/India/undergraduate/JEEMains/jeeMain_2025_22Jan_shift1.json', label: 'JEE Mains 2025 Jan 22 Shift 1', year: 2025, paper: 'Jan-S1' },
  { url: 'https://raw.githubusercontent.com/Samkarya/online-exam-questions/main/India/undergraduate/JEEMains/jeeMain_2025_22Jan_shift2.json', label: 'JEE Mains 2025 Jan 22 Shift 2', year: 2025, paper: 'Jan-S2' },
];

async function fetchJeeMainsPapers(): Promise<RawQuestion[]> {
  const all: RawQuestion[] = [];
  for (const file of JEE_MAINS_FILES) {
    try {
      console.log(`  → Fetching: ${file.label}`);
      const data = await fetchJson(file.url);
      const arr  = Array.isArray(data) ? data : [];
      const q    = parseSamkaryaSchema(arr, 'samkarya-jeemains', file.label, 'JEEMains', file.year, file.paper);
      console.log(`    ✅ ${q.length} questions`);
      all.push(...q);
    } catch (e: any) {
      console.warn(`    ⚠️  Failed: ${e.message}`);
    }
  }
  return all;
}

// ─── Source 2: JEE Advanced (dair-iitd/jeebench) ─────────────────
// Confirmed working — research dataset used by IIT Delhi
// Schema: { question, options: ["A)...", "B)..."], answer, subject, year }
async function fetchJeeAdvancedBench(): Promise<RawQuestion[]> {
  const URLS = [
    'https://raw.githubusercontent.com/dair-iitd/jeebench/main/data/jee_main_and_advanced_2016_2024.json',
    'https://raw.githubusercontent.com/dair-iitd/jeebench/main/data/dataset.json',
    'https://raw.githubusercontent.com/dair-iitd/jeebench/main/dataset.json',
  ];

  for (const url of URLS) {
    try {
      console.log(`  → Trying JEE Bench: ${url}`);
      const data = await fetchJson(url);
      const arr  = Array.isArray(data) ? data : (data.data || data.questions || []);
      if (!arr.length) continue;

      const results: RawQuestion[] = [];
      for (const item of arr) {
        const text = String(item.question || item.question_text || '').trim();
        if (!text) continue;

        // Options may be ["A) option", "B) option"] or { A: "opt", B: "opt" }
        let opts: string[] = [];
        if (Array.isArray(item.options)) {
          opts = item.options.map((o: any) => String(o).replace(/^[A-D]\)\s*/i, '').trim());
        } else if (typeof item.options === 'object') {
          opts = Object.values(item.options).map((o: any) => String(o).trim());
        }
        if (opts.length < 2) continue;

        const ansRaw = String(item.answer || item.correct_answer || '');
        // answer might be "A", "B", "C", "D" or verbatim
        const ansIdx = ['A','B','C','D','a','b','c','d'].findIndex(k => k === ansRaw.trim());
        const answer = ansIdx >= 0 && opts[ansIdx % 4] ? opts[ansIdx % 4] : ansRaw;

        results.push({
          hash:        makeHash(text, opts),
          source:      'jeebench-iitd',
          source_exam: `JEE Advanced ${item.year || ''}`.trim(),
          year:        item.year ? Number(item.year) : undefined,
          raw_text:    text,
          raw_options: opts.slice(0, 4),
          raw_answer:  answer,
          subject:     item.subject || undefined,
          class:       'Class 12',
          exam:        'JEEAdvanced',
          quality:     'verified',
        });
      }
      console.log(`  ✅ JEE Bench: ${results.length} questions`);
      return results;
    } catch (e: any) {
      console.warn(`  ⚠️  Failed ${url}: ${e.message}`);
    }
  }
  return [];
}

// ─── Source 3: Chemistry101 subject questions (Samkarya repo) ──────
// These are structured chapter-wise questions — great for Class 11/12 basics
// Schema: { id, question, options: ["A. ...", "B. ..."], correct_option: "A" }
const CHEM_FILES = [
  'chem101_Atomic_Theory', 'chem101_Chemical_Kinetics_wait',
  'chem101_Equilibrium', 'chem101_Thermochemistry',
  'chem101_Acids_Bases', 'chem101_Redox_Electrochemistry',
  'chem101_Stoichiometry', 'chem101_Gas_Laws',
];

async function fetchChemistrySubjectQs(): Promise<RawQuestion[]> {
  const BASE = 'https://raw.githubusercontent.com/Samkarya/online-exam-questions/main/global/subject/Chemistry101';
  const all: RawQuestion[] = [];
  for (const file of ['chem101_Acids_Bases','chem101_Atomic_Theory','chem101_Bonding_Geometry',
    'chem101_Equilibrium','chem101_Gas_Laws','chem101_Kinetics',
    'chem101_Redox_Electrochemistry','chem101_Stoichiometry','chem101_Thermochemistry']) {
    try {
      console.log(`  → Fetching Chemistry: ${file}`);
      const data = await fetchJson(`${BASE}/${file}.json`);
      const arr  = Array.isArray(data) ? data : (data.questions || []);
      let count = 0;
      for (const item of arr) {
        const text = String(item.question || item.question_text || item.stem || '').trim();
        if (!text) continue;

        // Options format varies: ["A. opt", "B. opt"] or {a:"opt"} or ["opt1","opt2"]
        let opts: string[] = [];
        if (Array.isArray(item.options)) {
          opts = item.options.map((o: any) => String(o).replace(/^[A-Da-d][.)]\s*/,'').trim());
        } else if (item.options && typeof item.options === 'object') {
          opts = Object.values(item.options).map((o: any) => String(o).trim());
        }
        if (opts.length < 2) continue;

        const ansRaw = String(item.correct_option || item.correct_answer || item.answer || '');
        const ansIdx = 'ABCDabcd'.indexOf(ansRaw.trim()) % 4;
        const answer = ansIdx >= 0 && opts[ansIdx] ? opts[ansIdx] : ansRaw;

        all.push({
          hash:        makeHash(text, opts),
          source:      'samkarya-chemistry101',
          source_exam: 'Chemistry Subject Practice',
          raw_text:    text,
          raw_options: opts.slice(0,4),
          raw_answer:  answer,
          subject:     'Chemistry',
          class:       'Class 12',
          exam:        'JEEMains',
          quality:     'verified',
        });
        count++;
      }
      console.log(`    ✅ ${count} questions from ${file}`);
    } catch (e: any) {
      console.warn(`    ⚠️  Failed ${file}: ${e.message}`);
    }
  }
  return all;
}

// ─── Source 4: Hugging Face NEET/JEE dataset ─────────────────────
async function fetchHuggingFaceDataset(): Promise<RawQuestion[]> {
  // Hugging Face datasets API — parquet → JSONL endpoint
  const URLS = [
    'https://datasets-server.huggingface.co/rows?dataset=Reja1%2Fjee-neet-benchmark&config=default&split=test&offset=0&limit=100',
    'https://datasets-server.huggingface.co/rows?dataset=iamtarun%2Fjee_advanced_mcq&config=default&split=train&offset=0&limit=100',
  ];
  const all: RawQuestion[] = [];
  for (const url of URLS) {
    try {
      console.log(`  → Trying HuggingFace: ${url.split('dataset=')[1]?.split('&')[0]}`);
      const data = await fetchJson(url);
      const rows = data?.rows || [];
      for (const row of rows) {
        const item = row.row || row;
        const text = String(item.question || item.Question || '').trim();
        if (!text) continue;
        let opts: string[] = [];
        if (Array.isArray(item.options)) opts = item.options.map(String);
        else if (item.option_a) opts = [item.option_a, item.option_b, item.option_c, item.option_d].filter(Boolean).map(String);
        if (opts.length < 2) continue;
        const ans = String(item.answer || item.correct_answer || item.Answer || '');
        all.push({
          hash:        makeHash(text, opts),
          source:      'huggingface-jee-neet',
          source_exam: String(item.exam || item.source || 'JEE/NEET'),
          raw_text:    text,
          raw_options: opts.slice(0,4),
          raw_answer:  ans,
          subject:     item.subject || item.Subject || undefined,
          class:       'Class 12',
          exam:        String(item.exam || '').includes('NEET') ? 'NEET' : 'JEEMains',
          quality:     'verified',
        });
      }
      console.log(`  ✅ HuggingFace: ${all.length} questions`);
    } catch (e: any) {
      console.warn(`  ⚠️  HuggingFace failed: ${e.message}`);
    }
  }
  return all;
}

// ─── Source 5: Synthetic topic stubs for FULL_CURATION ─────────────
// When real PYQ sources fail, these drive AI to generate questions from scratch
const SYLLABUS_TOPICS = [
  // Physics 11
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'Kinematics',          subtopic:'Projectile motion — range and max-height optimization'},
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'Newton\'s Laws',       subtopic:'Static and kinetic friction on double-incline pulley'},
  {subject:'Physics',class:'Class 11',exam:'JEEAdvanced',topic:'Rotational Dynamics',  subtopic:'Rolling without slipping — torque and angular acceleration'},
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'Work-Energy Theorem',  subtopic:'Work done by variable spring force via integration'},
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'Gravitation',          subtopic:'Orbital velocity, escape velocity, and binding energy'},
  {subject:'Physics',class:'Class 11',exam:'JEEAdvanced',topic:'Thermodynamics',       subtopic:'Carnot cycle efficiency and entropy change calculation'},
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'Waves',                subtopic:'Doppler effect — source and observer both moving'},
  {subject:'Physics',class:'Class 11',exam:'JEEMains',   topic:'SHM',                  subtopic:'Spring-mass energy and time-period with variable k'},
  // Physics 12
  {subject:'Physics',class:'Class 12',exam:'JEEAdvanced',topic:'Electrostatics',             subtopic:'Electric field due to non-uniform charge distribution'},
  {subject:'Physics',class:'Class 12',exam:'JEEMains',   topic:'Current Electricity',         subtopic:'Kirchhoff\'s laws — bridge circuit with internal resistance'},
  {subject:'Physics',class:'Class 12',exam:'JEEAdvanced',topic:'Electromagnetic Induction',   subtopic:'Faraday\'s law — motional EMF in changing magnetic fields'},
  {subject:'Physics',class:'Class 12',exam:'JEEMains',   topic:'Alternating Current',         subtopic:'LCR series resonance — power factor and impedance'},
  {subject:'Physics',class:'Class 12',exam:'JEEAdvanced',topic:'Optics',                      subtopic:'Young\'s double-slit — fringe shift and coherence'},
  {subject:'Physics',class:'Class 12',exam:'JEEMains',   topic:'Modern Physics',              subtopic:'Photoelectric effect — threshold frequency and stopping potential'},
  // Chemistry 11
  {subject:'Chemistry',class:'Class 11',exam:'JEEMains',    topic:'Atomic Structure',      subtopic:'Quantum numbers and orbital shape determination'},
  {subject:'Chemistry',class:'Class 11',exam:'JEEAdvanced', topic:'Chemical Bonding',      subtopic:'Hybridisation, VSEPR, and molecular geometry'},
  {subject:'Chemistry',class:'Class 11',exam:'JEEMains',    topic:'Thermochemistry',       subtopic:'Hess\'s law — lattice energy and Born-Haber cycle'},
  {subject:'Chemistry',class:'Class 11',exam:'JEEMains',    topic:'Chemical Equilibrium',  subtopic:'Kp, Kc relation and Le Chatelier\'s principle'},
  {subject:'Chemistry',class:'Class 11',exam:'JEEAdvanced', topic:'Organic Basics',        subtopic:'SN1 vs SN2 mechanism selection based on substrate'},
  // Chemistry 12
  {subject:'Chemistry',class:'Class 12',exam:'JEEMains',    topic:'Solutions',              subtopic:'Colligative properties — osmotic pressure and boiling point'},
  {subject:'Chemistry',class:'Class 12',exam:'JEEAdvanced', topic:'Electrochemistry',       subtopic:'Nernst equation and cell potential at non-standard conditions'},
  {subject:'Chemistry',class:'Class 12',exam:'JEEMains',    topic:'Chemical Kinetics',      subtopic:'Integrated rate laws and half-life determination'},
  {subject:'Chemistry',class:'Class 12',exam:'JEEAdvanced', topic:'Coordination Compounds', subtopic:'Crystal field splitting and spectrochemical series'},
  // Math 11
  {subject:'Mathematics',class:'Class 11',exam:'JEEAdvanced',topic:'Complex Numbers',           subtopic:'De Moivre\'s theorem — nth roots and geometric interpretation'},
  {subject:'Mathematics',class:'Class 11',exam:'JEEMains',   topic:'Sequences and Series',      subtopic:'AGP sum and infinite series convergence'},
  {subject:'Mathematics',class:'Class 11',exam:'JEEAdvanced',topic:'Trigonometry',              subtopic:'Inverse trig identities and principal value determination'},
  {subject:'Mathematics',class:'Class 11',exam:'JEEAdvanced',topic:'Conic Sections',            subtopic:'Chord of contact and pair of tangents to hyperbola'},
  // Math 12
  {subject:'Mathematics',class:'Class 12',exam:'JEEAdvanced',topic:'Matrices and Determinants', subtopic:'Cayley-Hamilton theorem and matrix inverse computation'},
  {subject:'Mathematics',class:'Class 12',exam:'JEEAdvanced',topic:'Integral Calculus',         subtopic:'Integration by reduction formula and definite integral bounds'},
  {subject:'Mathematics',class:'Class 12',exam:'JEEAdvanced',topic:'Differential Equations',    subtopic:'Exact ODE and integrating factor — first order linear'},
  {subject:'Mathematics',class:'Class 12',exam:'JEEAdvanced',topic:'Probability',               subtopic:'Bayes\' theorem — conditional probability problems'},
  {subject:'Mathematics',class:'Class 12',exam:'JEEAdvanced',topic:'3D Geometry',               subtopic:'Skew lines — shortest distance and angle between planes'},
  {subject:'Mathematics',class:'Class 12',exam:'JEEMains',   topic:'Vectors',                   subtopic:'Scalar triple product — coplanarity and volume of parallelepiped'},
  // Biology 11
  {subject:'Biology',class:'Class 11',exam:'NEET',topic:'Cell Biology',          subtopic:'Cell organelle functions and differences'},
  {subject:'Biology',class:'Class 11',exam:'NEET',topic:'Biomolecules',          subtopic:'Enzyme kinetics — Michaelis-Menten and inhibition'},
  {subject:'Biology',class:'Class 11',exam:'NEET',topic:'Plant Physiology',      subtopic:'Photosynthesis — Z-scheme and cyclic photophosphorylation'},
  {subject:'Biology',class:'Class 11',exam:'NEET',topic:'Animal Physiology',     subtopic:'Digestion enzymes and absorption in small intestine'},
  // Biology 12
  {subject:'Biology',class:'Class 12',exam:'NEET',topic:'Molecular Biology',     subtopic:'Chargaff rules, DNA replication and proofreading'},
  {subject:'Biology',class:'Class 12',exam:'NEET',topic:'Genetics',              subtopic:'Mendelian ratios — codominance and incomplete dominance'},
  {subject:'Biology',class:'Class 12',exam:'NEET',topic:'Evolution',             subtopic:'Hardy-Weinberg equilibrium — allele frequency calculation'},
  {subject:'Biology',class:'Class 12',exam:'NEET',topic:'Biotechnology',         subtopic:'PCR, gel electrophoresis, and rDNA technology'},
  {subject:'Biology',class:'Class 12',exam:'NEET',topic:'Ecosystem',             subtopic:'Energy flow, GPP/NPP and ecological efficiency'},
];

function generateSyntheticBatch(): RawQuestion[] {
  return SYLLABUS_TOPICS.map((t, i) => {
    const stub = `[GENERATE] ${t.exam} | ${t.subject} | ${t.topic} | ${t.subtopic}`;
    return {
      hash:        makeHash(stub, [String(i), t.subject, t.topic]),
      source:      'synthetic-stub',
      source_exam: t.exam,
      raw_text:    stub,
      raw_options: [],
      raw_answer:  '',
      subject:     t.subject,
      class:       t.class,
      exam:        t.exam as any,
      quality:     'raw' as const,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────
const SOURCES: Array<[string, string, () => Promise<RawQuestion[]>]> = [
  ['jee-mains',     '📐 JEE Mains Papers (Samkarya)',      fetchJeeMainsPapers],
  ['jee-advanced',  '🔬 JEE Advanced Bench (IIT Delhi)',   fetchJeeAdvancedBench],
  ['chemistry',     '⚗️  Chemistry101 (Samkarya)',           fetchChemistrySubjectQs],
  ['huggingface',   '🤗 HuggingFace JEE/NEET Datasets',    fetchHuggingFaceDataset],
  ['synthetic',     '🤖 Synthetic Topic Stubs',             async () => generateSyntheticBatch()],
];

async function main() {
  const onlySource = process.argv.find(a => a.startsWith('--source='))?.split('=')[1];
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  let grandTotal = 0, grandWritten = 0;

  for (const [name, label, fn] of SOURCES) {
    if (onlySource && onlySource !== name) continue;
    console.log(`\n${label}`);
    try {
      const questions   = await fn();
      const { written, skipped } = appendToCache(questions);
      console.log(`  📊 ${questions.length} fetched → ${written} new, ${skipped} duplicates`);
      grandTotal   += questions.length;
      grandWritten += written;
    } catch (e: any) {
      console.error(`  ❌ ${name} crashed: ${e.message}`);
    }
  }

  const totalCached = loadExistingHashes().size;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SCRAPER COMPLETE`);
  console.log(`   Fetched this run : ${grandTotal}`);
  console.log(`   New questions    : ${grandWritten}`);
  console.log(`   Total in cache   : ${totalCached}`);
  console.log(`   Cache path       : ${CACHE_FILE}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(e => { console.error('💥 Scraper crashed:', e); process.exit(1); });
