// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS DISTRIBUTION MANAGER v1.0
// Tracks coverage per topic, generates stubs for gaps
// Run: npx tsx scripts/distribution-manager.ts [--stubs=1000] [--report-only]
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import 'dotenv/config';
import { TAXONOMY, getTotalTarget, type TopicNode } from './curriculum-taxonomy.js';
import type { RawQuestion } from './bulk-scraper.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH_DIR = path.join(__dirname, '..', 'scratch');
const CACHE_FILE  = path.join(SCRATCH_DIR, 'raw_questions_cache.jsonl');
const DONE_FILE   = path.join(SCRATCH_DIR, 'processed_hashes.json');
const REPORT_FILE = path.join(SCRATCH_DIR, 'distribution_report.json');
const DB_NAME     = 'examcompass-questions';

// ─── CLI Args ─────────────────────────────────────────────────────
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace('--','').split('=')));
const STUBS_TO_GENERATE = Number(args.stubs || 1000);
const REPORT_ONLY = 'report-only' in args;

// ─── Helper ───────────────────────────────────────────────────────
// Session nonce: unique per run, ensures fresh stub hashes every time
const SESSION_NONCE = Date.now().toString(36);

function makeHash(text: string, extras: string[]): string {
  const norm = (text + extras.join('') + SESSION_NONCE).toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

function bar(pct: number, width = 10): string {
  const filled = Math.round(pct / 100 * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── Count existing questions per topic ───────────────────────────
function countByTopic(): Map<string, number> {
  const counts = new Map<string, number>();

  // Init all topics to 0
  for (const t of TAXONOMY) counts.set(t.id, 0);

  try {
    const sql = 'SELECT primary_topic, subject, COUNT(*) as count FROM questions GROUP BY primary_topic, subject;';
    const escapedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `npx wrangler d1 execute ${DB_NAME} --local --json --command "${escapedSql}"`;
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
    
    let results: any[] = [];
    const jsonMatch = output.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      results = parsed[0]?.results || [];
    } else {
      try {
        const parsed = JSON.parse(output.trim());
        results = parsed[0]?.results || [];
      } catch {}
    }

    // Map database results to taxonomy nodes
    for (const r of results) {
      const dbTopic = String(r.primary_topic || '').toLowerCase().trim();
      const dbSubject = String(r.subject || '').toLowerCase().trim();
      const dbCount = Number(r.count || 0);

      // Find matching taxonomy node
      const match = TAXONOMY.find(t => 
        t.subject.toLowerCase().trim() === dbSubject &&
        t.topic.toLowerCase().trim() === dbTopic
      );

      if (match) {
        counts.set(match.id, dbCount);
      }
    }
  } catch (e: any) {
    console.warn(`⚠️ Failed to query local D1 database, falling back to cache estimation: ${e.message}`);
    // Fallback: original cache counting logic
    if (fs.existsSync(CACHE_FILE)) {
      const lines = fs.readFileSync(CACHE_FILE, 'utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const q: RawQuestion = JSON.parse(line);
          const matchingTopics = TAXONOMY.filter(t =>
            t.class === q.class &&
            t.exam  === q.exam &&
            (t.subject === q.subject || !q.subject)
          );
          for (const t of matchingTopics.slice(0, 1)) {
            counts.set(t.id, (counts.get(t.id) || 0) + 1);
          }
        } catch {}
      }
    }
  }

  return counts;
}

// ─── Topic gap analysis ───────────────────────────────────────────
interface TopicGap {
  topic: TopicNode;
  current: number;
  target: number;
  gap: number;
  pct: number;
}

function analyzeGaps(counts: Map<string, number>): TopicGap[] {
  return TAXONOMY
    .map(t => {
      const current = counts.get(t.id) || 0;
      const gap = Math.max(0, t.target_questions - current);
      const pct = Math.min(100, (current / t.target_questions) * 100);
      return { topic: t, current, target: t.target_questions, gap, pct };
    })
    .sort((a, b) => {
      // 1. Both empty? Sort by gap descending (or topic priority)
      if (a.current === 0 && b.current === 0) {
        return a.topic.priority - b.topic.priority || b.gap - a.gap;
      }
      // 2. One is empty? Put it first
      if (a.current === 0) return -1;
      if (b.current === 0) return 1;

      // 3. Both thin (< 10)? Sort by current ascending, then gap descending
      if (a.current < 10 && b.current < 10) {
        return a.current - b.current || b.gap - a.gap;
      }
      // 4. One is thin? Put it first
      if (a.current < 10) return -1;
      if (b.current < 10) return 1;

      // 5. Default sort for other gaps
      return a.topic.priority - b.topic.priority || b.gap - a.gap;
    });
}

// ─── Generate stubs for topics with gaps ─────────────────────────
function generateStubs(gaps: TopicGap[], count: number): RawQuestion[] {
  // existingHashes: only tracks hashes already in THIS session's cache file
  // (session nonce makes each run produce unique hashes, so processed_hashes.json won't block new stubs)
  const existingHashes = new Set<string>();
  if (fs.existsSync(CACHE_FILE)) {
    for (const line of fs.readFileSync(CACHE_FILE, 'utf-8').split('\n').filter(Boolean)) {
      try { existingHashes.add(JSON.parse(line).hash); } catch {}
    }
  }

  const stubs: RawQuestion[] = [];
  const topicsWithGap = gaps.filter(g => g.gap > 0);

  if (topicsWithGap.length === 0) {
    console.log('✅ All topics have met their targets! Database is complete.');
    return [];
  }

  // Cycle through subtopics for each topic
  const subtopicPointers = new Map<string, number>(); // topic.id → next subtopic index

  // Separate topics with gaps into Tier 1 (Priority: empty/thin < 10 questions) and Tier 2 (Robust >= 10 questions but still has gaps)
  const tier1 = topicsWithGap.filter(g => g.current < 10);

  let generated = 0;
  let iterationSafety = 0;

  // Process Tier 1 first (Empty & Thin topics)
  while (generated < count && tier1.some(g => g.gap > 0 && g.current < 10) && iterationSafety < count * 2) {
    iterationSafety++;
    for (const g of tier1) {
      if (generated >= count) break;
      if (g.current >= 10 || g.gap <= 0) continue;

      const t = g.topic;
      const ptr = subtopicPointers.get(t.id) || 0;
      const subtopic = t.subtopics[ptr % t.subtopics.length];
      subtopicPointers.set(t.id, ptr + 1);

      const text = `[GENERATE] ${t.exam} Class ${t.class} | ${t.subject} | ${t.chapter} | ${t.topic} | ${subtopic}`;
      const hash = makeHash(text, [t.id, String(ptr)]);

      if (!existingHashes.has(hash)) {
        const stub: RawQuestion = {
          hash,
          source: 'distribution-manager',
          source_exam: `${t.exam} Class ${t.class}`,
          raw_text: text,
          raw_options: [],
          raw_answer: '',
          subject: t.subject as any,
          class: `Class ${t.class}`,
          exam: t.exam,
          quality: 'raw',
        };
        stubs.push(stub);
        existingHashes.add(hash);
        generated++;
        g.gap--;
        g.current++;
      }
    }
  }

  // If we still need more stubs, process all topics with gaps (including Tier 2)
  iterationSafety = 0;
  while (generated < count && topicsWithGap.some(g => g.gap > 0) && iterationSafety < count * 2) {
    iterationSafety++;
    for (const g of topicsWithGap) {
      if (generated >= count) break;
      if (g.gap <= 0) continue;
      
      const t = g.topic;
      const ptr = subtopicPointers.get(t.id) || 0;
      const subtopic = t.subtopics[ptr % t.subtopics.length];
      subtopicPointers.set(t.id, ptr + 1);

      const text = `[GENERATE] ${t.exam} Class ${t.class} | ${t.subject} | ${t.chapter} | ${t.topic} | ${subtopic}`;
      const hash = makeHash(text, [t.id, String(ptr)]);

      if (!existingHashes.has(hash)) {
        const stub: RawQuestion = {
          hash,
          source: 'distribution-manager',
          source_exam: `${t.exam} Class ${t.class}`,
          raw_text: text,
          raw_options: [],
          raw_answer: '',
          subject: t.subject as any,
          class: `Class ${t.class}`,
          exam: t.exam,
          quality: 'raw',
        };
        stubs.push(stub);
        existingHashes.add(hash);
        generated++;
        g.gap--;
        g.current++;
      }
    }
  }

  return stubs;
}

// ─── Print coverage report ────────────────────────────────────────
function printReport(gaps: TopicGap[]): void {
  const total = getTotalTarget();
  const totalCurrent = gaps.reduce((s, g) => s + g.current, 0);
  const overallPct = Math.min(100, (totalCurrent / total) * 100);

  console.log('\n' + '═'.repeat(65));
  console.log('📊 EXAMCOMPASS COVERAGE REPORT');
  console.log('═'.repeat(65));

  // Group by class+exam
  const groups = new Map<string, TopicGap[]>();
  for (const g of gaps) {
    const key = `Class ${g.topic.class} ${g.topic.exam}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(g);
  }

  // Sort groups: Class 12 first, Class 8 last
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    const ca = Number(a[1][0].topic.class);
    const cb = Number(b[1][0].topic.class);
    return cb - ca || a[0].localeCompare(b[0]);
  });

  for (const [label, groupGaps] of sortedGroups) {
    const grpTarget  = groupGaps.reduce((s, g) => s + g.target, 0);
    const grpCurrent = groupGaps.reduce((s, g) => s + g.current, 0);
    const grpPct     = Math.min(100, (grpCurrent / grpTarget) * 100);
    const label24    = label.padEnd(24);
    console.log(`${label24} ${bar(grpPct)} ${grpPct.toFixed(0).padStart(3)}%  ${grpCurrent.toLocaleString().padStart(6)}/${grpTarget.toLocaleString()}`);
  }

  console.log('─'.repeat(65));
  console.log(`${'OVERALL'.padEnd(24)} ${bar(overallPct)} ${overallPct.toFixed(0).padStart(3)}%  ${totalCurrent.toLocaleString().padStart(6)}/${total.toLocaleString()}`);
  console.log('═'.repeat(65));

  // Find biggest gaps
  const topGaps = gaps.filter(g => g.gap > 0).slice(0, 5);
  if (topGaps.length > 0) {
    console.log('\n🎯 Top 5 Priorities (biggest gaps):');
    for (const g of topGaps) {
      console.log(`   Class ${g.topic.class} ${g.topic.exam} | ${g.topic.subject} | ${g.topic.topic} → gap: ${g.gap}`);
    }
  }
  console.log();
}

// ─── Write report JSON ────────────────────────────────────────────
function writeReport(gaps: TopicGap[]): void {
  const report = {
    generated_at: new Date().toISOString(),
    total_target: getTotalTarget(),
    total_current: gaps.reduce((s, g) => s + g.current, 0),
    topics: gaps.map(g => ({
      id: g.topic.id,
      class: g.topic.class,
      exam: g.topic.exam,
      subject: g.topic.subject,
      topic: g.topic.topic,
      current: g.current,
      target: g.target,
      gap: g.gap,
      pct: Math.round(g.pct),
    })),
  };
  if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
}

// ─── Append stubs to cache ────────────────────────────────────────
function appendStubs(stubs: RawQuestion[]): void {
  if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const stream = fs.createWriteStream(CACHE_FILE, { flags: 'a' });
  for (const s of stubs) stream.write(JSON.stringify(s) + '\n');
  stream.end();
}

// ─── Reorganize Cache to prioritize empty/thin topics ────────────────
function reorganizeCache(counts: Map<string, number>): void {
  if (!fs.existsSync(CACHE_FILE)) return;

  console.log('\n🔄 Reorganizing cache file to prioritize empty and thin topics...');

  // Load done hashes
  const doneHashes = new Set<string>();
  if (fs.existsSync(DONE_FILE)) {
    try {
      const hashes = JSON.parse(fs.readFileSync(DONE_FILE, 'utf-8'));
      if (Array.isArray(hashes)) {
        hashes.forEach(h => doneHashes.add(h));
      }
    } catch {}
  }

  const lines = fs.readFileSync(CACHE_FILE, 'utf-8').split('\n').filter(Boolean);
  const processedStubs: string[] = [];
  const priorityStubs: string[] = [];
  const regularStubs: string[] = [];

  // Helper to parse subject and topic from raw_text
  const getTopicAndSubj = (text: string) => {
    const parts = text.split('|');
    if (parts.length >= 4) {
      return {
        subject: parts[1].trim().toLowerCase(),
        topic: parts[3].trim().toLowerCase()
      };
    }
    const topicMatch = text.match(/Topic:\s*([^|]+)/);
    if (topicMatch) {
      return {
        subject: '',
        topic: topicMatch[1].trim().toLowerCase()
      };
    }
    return null;
  };

  for (const line of lines) {
    try {
      const q: RawQuestion = JSON.parse(line);
      if (doneHashes.has(q.hash)) {
        processedStubs.push(line);
        continue;
      }

      // Check if it belongs to a priority topic (current count < 10)
      const parsed = getTopicAndSubj(q.raw_text);
      let isPriority = false;
      if (parsed) {
        const match = TAXONOMY.find(t => 
          (parsed.subject ? t.subject.toLowerCase() === parsed.subject : true) &&
          (t.topic.toLowerCase() === parsed.topic || t.chapter.toLowerCase() === parsed.topic)
        );
        if (match) {
          const currentCount = counts.get(match.id) || 0;
          if (currentCount < 10) {
            isPriority = true;
          }
        }
      }

      if (isPriority) {
        priorityStubs.push(line);
      } else {
        regularStubs.push(line);
      }
    } catch {
      regularStubs.push(line);
    }
  }

  // Re-write cache file: priority stubs first, then regular stubs, then processed stubs
  const newContent = [...priorityStubs, ...regularStubs, ...processedStubs].join('\n') + '\n';
  fs.writeFileSync(CACHE_FILE, newContent, 'utf-8');
  console.log(`✅ Cache reorganized! Priority stubs: ${priorityStubs.length} | Regular stubs: ${regularStubs.length} | Processed stubs: ${processedStubs.length}`);
}

// ─── Main ─────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('🔍 Analyzing topic coverage...');
  const counts = countByTopic();
  const gaps   = analyzeGaps(counts);

  printReport(gaps);
  writeReport(gaps);

  if (REPORT_ONLY) {
    console.log(`📄 Full report saved: ${REPORT_FILE}`);
    return;
  }

  console.log(`\n🔧 Generating ${STUBS_TO_GENERATE} priority stubs...`);
  const stubs = generateStubs(gaps, STUBS_TO_GENERATE);

  if (stubs.length > 0) {
    appendStubs(stubs);

    // Show breakdown of what was generated
    const byClass = new Map<string, number>();
    for (const s of stubs) {
      const cls = s.class || '?';
      byClass.set(cls, (byClass.get(cls) || 0) + 1);
    }

    console.log(`\n✅ Generated ${stubs.length} stubs:`);
    for (const [cls, n] of [...byClass.entries()].sort()) {
      console.log(`   ${cls}: ${n} stubs`);
    }
    console.log(`\n📁 Appended to: ${CACHE_FILE}`);
  } else {
    console.log('✅ Nothing new generated.');
  }

  // Always reorganize cache to prioritize stubs matching empty/thin topics
  reorganizeCache(counts);

  console.log(`\nNext step: npx tsx scripts/batch-pipeline.ts --mode=full_curation --batch-size=5`);
}

main().catch(e => { console.error('💥 Distribution manager crashed:', e); process.exit(1); });
