import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TAXONOMY } from './curriculum-taxonomy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_FILE = path.join(__dirname, '..', 'scratch', 'local_db_analysis_report.md');
const DB_NAME = 'examcompass-questions';

// Helper to run query via wrangler local D1
function runQuery(sql: string): any[] {
  try {
    const escapedSql = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `npx wrangler d1 execute ${DB_NAME} --local --json --command "${escapedSql}"`;
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
    
    // Wrangler output contains logs followed by a JSON array or is a single JSON array
    // Let's extract the JSON block
    const jsonMatch = output.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      // Try parsing the whole output if it's pure JSON
      try {
        const parsed = JSON.parse(output.trim());
        return parsed[0]?.results || [];
      } catch {
        return [];
      }
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed[0]?.results || [];
  } catch (e: any) {
    console.error(`Error running query: ${sql}\nError: ${e.message}`);
    return [];
  }
}

async function analyze() {
  console.log('📊 Querying local D1 SQLite database...');
  
  // 1. Core Counts
  console.log('   - Fetching general stats...');
  const totalRes = runQuery('SELECT COUNT(*) as total FROM questions;');
  const totalQuestions = totalRes[0]?.total || 0;
  
  const verifiedRes = runQuery('SELECT verified, COUNT(*) as count FROM questions GROUP BY verified;');
  const subjectRes = runQuery('SELECT subject, COUNT(*) as count FROM questions GROUP BY subject ORDER BY count DESC;');
  const examRes = runQuery('SELECT exam, COUNT(*) as count FROM questions GROUP BY exam ORDER BY count DESC;');
  const classRes = runQuery('SELECT class, COUNT(*) as count FROM questions GROUP BY class ORDER BY CAST(class AS INTEGER) ASC;');
  const typeRes = runQuery('SELECT type, COUNT(*) as count FROM questions GROUP BY type ORDER BY count DESC;');
  
  // 2. ELO & Difficulty Band Stats
  console.log('   - Fetching ELO stats...');
  const bandRes = runQuery('SELECT difficulty_band, COUNT(*) as count FROM questions GROUP BY difficulty_band ORDER BY count DESC;');
  const eloSubjectRes = runQuery('SELECT subject, MIN(difficulty_score) as min_elo, MAX(difficulty_score) as max_elo, ROUND(AVG(difficulty_score), 1) as avg_elo FROM questions GROUP BY subject;');
  const eloExamRes = runQuery('SELECT exam, MIN(difficulty_score) as min_elo, MAX(difficulty_score) as max_elo, ROUND(AVG(difficulty_score), 1) as avg_elo FROM questions GROUP BY exam;');
  
  // 3. Quality & Source Stats
  console.log('   - Fetching quality and metadata stats...');
  const qualityRes = runQuery('SELECT quality_tier, COUNT(*) as count FROM questions GROUP BY quality_tier ORDER BY count DESC;');
  const pyqYearsRes = runQuery('SELECT year, COUNT(*) as count FROM questions WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC;');
  const crossChapterRes = runQuery('SELECT cross_chapter, COUNT(*) as count FROM questions GROUP BY cross_chapter;');
  const crossSubjectRes = runQuery('SELECT cross_subject, COUNT(*) as count FROM questions GROUP BY cross_subject;');

  // 4. Topic-level Stats (to compare against TAXONOMY)
  console.log('   - Fetching chapter stats...');
  const topicCountsRes = runQuery('SELECT primary_topic, subject, COUNT(*) as count FROM questions GROUP BY primary_topic, subject;');
  const topicCountMap = new Map<string, number>();
  topicCountsRes.forEach(row => {
    const key = `${row.subject.toLowerCase()}:${row.primary_topic.toLowerCase().trim()}`;
    topicCountMap.set(key, row.count);
  });

  // 5. Syllabus Coverage Analysis (comparing local DB against the defined Curriculum Taxonomy)
  console.log('   - Computing syllabus coverage...');
  let coveredCount = 0;
  let partialCount = 0; // 1 to 9 questions
  let fullCount = 0; // 10+ questions
  let untouchedCount = 0; // 0 questions
  
  const taxonomyCoverage = TAXONOMY.map(node => {
    const key = `${node.subject.toLowerCase()}:${node.topic.toLowerCase().trim()}`;
    const count = topicCountMap.get(key) || 0;
    
    if (count >= 10) {
      fullCount++;
      coveredCount++;
    } else if (count > 0) {
      partialCount++;
      coveredCount++;
    } else {
      untouchedCount++;
    }
    
    return {
      ...node,
      current_count: count,
      status: count >= 10 ? '✅ Full (10+)' : count > 0 ? '⚠️ Partial' : '❌ Empty'
    };
  });
  
  const overallCoveragePct = ((coveredCount / TAXONOMY.length) * 100).toFixed(1);
  const fullCoveragePct = ((fullCount / TAXONOMY.length) * 100).toFixed(1);

  // Classify chapters by coverage
  const emptyChapters = taxonomyCoverage.filter(c => c.current_count === 0);
  const thinChapters = taxonomyCoverage.filter(c => c.current_count > 0 && c.current_count < 10);
  const strongChapters = taxonomyCoverage.filter(c => c.current_count >= 20);

  // Group stats by Subject in Taxonomy
  const subjectTaxonomyStats: Record<string, { total: number; covered: number; full: number }> = {};
  TAXONOMY.forEach(node => {
    const key = `${node.subject.toLowerCase()}:${node.topic.toLowerCase().trim()}`;
    const count = topicCountMap.get(key) || 0;
    
    if (!subjectTaxonomyStats[node.subject]) {
      subjectTaxonomyStats[node.subject] = { total: 0, covered: 0, full: 0 };
    }
    subjectTaxonomyStats[node.subject].total++;
    if (count > 0) subjectTaxonomyStats[node.subject].covered++;
    if (count >= 10) subjectTaxonomyStats[node.subject].full++;
  });

  console.log('📊 Formatting report...');

  // Helper to draw horizontal bars
  const makeBar = (val: number, max: number, length = 15) => {
    const filled = Math.round((val / max) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  };

  const maxSubjectCount = Math.max(...subjectRes.map(r => r.count), 1);
  const maxExamCount = Math.max(...examRes.map(r => r.count), 1);
  const maxClassCount = Math.max(...classRes.map(r => r.count), 1);
  const maxTypeCount = Math.max(...typeRes.map(r => r.count), 1);
  const maxBandCount = Math.max(...bandRes.map(r => r.count), 1);

  // Character helper for backticks in markdown
  const BT = String.fromCharCode(96);

  // Generate Markdown
  const md = `# 📊 ExamCompass Local D1 Question Bank Audit & Analysis

Generated on: **${new Date().toLocaleString()}**  
Database Size: **${totalQuestions.toLocaleString()} questions**  
Schema: **v2 (ELO-Anchored)**

---

## 📈 Executive Summary

| Metric | Value | Description |
| :--- | :--- | :--- |
| **Total Question Count** | **${totalQuestions.toLocaleString()}** | Total questions stored in the local SQLite database |
| **Verified Questions** | **${(verifiedRes.find(r => r.verified === 1)?.count || 0).toLocaleString()}** | Checked and confirmed by verifiers/humans |
| **Syllabus Coverage** | **${overallCoveragePct}%** | **${coveredCount}/${TAXONOMY.length}** taxonomy topics have at least 1 question |
| **Robustly Covered** | **${fullCoveragePct}%** | **${fullCount}/${TAXONOMY.length}** taxonomy topics have 10+ questions |
| **Untouched Topics** | **${untouchedCount}** | Topics with **zero** questions in the database |

---

## 📚 Subject-wise Breakdown

| Subject | Questions | Percentage | Distribution Visual |
| :--- | :--- | :---: | :--- |
${subjectRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| **${r.subject}** | ${r.count.toLocaleString()} | ${pct}% | ${BT}${makeBar(r.count, maxSubjectCount)}${BT} |`;
}).join('\n')}

---

## 🏆 Exam & Class Target Distribution

### By Target Exam
| Exam | Questions | Percentage | Distribution Visual |
| :--- | :--- | :---: | :--- |
${examRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| **${r.exam}** | ${r.count.toLocaleString()} | ${pct}% | ${BT}${makeBar(r.count, maxExamCount)}${BT} |`;
}).join('\n')}

### By Class Level
| Class | Questions | Percentage | Distribution Visual |
| :--- | :--- | :---: | :--- |
${classRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| **Class ${r.class}** | ${r.count.toLocaleString()} | ${pct}% | ${BT}${makeBar(r.count, maxClassCount)}${BT} |`;
}).join('\n')}

---

## 🧩 Question Type & Quality Tiers

### By Format Type
| Question Type | Questions | Percentage | Distribution Visual |
| :--- | :--- | :---: | :--- |
${typeRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| **${r.type}** | ${r.count.toLocaleString()} | ${pct}% | ${BT}${makeBar(r.count, maxTypeCount)}${BT} |`;
}).join('\n')}

### By Quality Tier
* **S**: Verbatim PYQ (Confirmed 100% Correct)
* **A**: Vetted past exam reference question
* **B**: AI-curated and audited syllabus questions (Verified via 70B verifiers)
* **C**: AI-Generated (Initial raw pass)
* **D**: Unverified

| Quality Tier | Questions | Percentage | Description |
| :--- | :--- | :---: | :--- |
${qualityRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| **Tier ${r.quality_tier}** | ${r.count.toLocaleString()} | ${pct}% | ${r.quality_tier === 'S' ? 'Verbatim PYQ' : r.quality_tier === 'A' ? 'Vetted Reference' : r.quality_tier === 'B' ? 'Audited Syllabus Curation' : r.quality_tier === 'C' ? 'AI Raw Curation' : 'Unverified'} |`;
}).join('\n')}

---

## ⚡ ELO difficulty score Distribution

| Difficulty Band | Questions | Percentage | Distribution Visual |
| :--- | :--- | :---: | :--- |
${bandRes.map(r => {
  const pct = ((r.count / totalQuestions) * 100).toFixed(1);
  return `| ${BT}${r.difficulty_band}${BT} | ${r.count.toLocaleString()} | ${pct}% | ${BT}${makeBar(r.count, maxBandCount)}${BT} |`;
}).join('\n')}

### ELO Ranges by Subject
| Subject | Min ELO | Max ELO | Average ELO |
| :--- | :---: | :---: | :---: |
${eloSubjectRes.map(r => `| **${r.subject}** | ${r.min_elo} | ${r.max_elo} | **${r.avg_elo}** |`).join('\n')}

### ELO Ranges by Exam Target
| Exam | Min ELO | Max ELO | Average ELO |
| :--- | :---: | :---: | :---: |
${eloExamRes.map(r => `| **${r.exam}** | ${r.min_elo} | ${r.max_elo} | **${r.avg_elo}** |`).join('\n')}

---

## 🔗 Multi-Concept Tagging Stats

| Tag Property | Questions | Percentage | Description |
| :--- | :--- | :---: | :--- |
| **Cross-Chapter Questions** | ${(crossChapterRes.find(r => r.cross_chapter === 1)?.count || 0).toLocaleString()} | ${(((crossChapterRes.find(r => r.cross_chapter === 1)?.count || 0) / totalQuestions) * 100).toFixed(1)}% | Questions spanning 2+ chapters |
| **Cross-Subject Questions** | ${(crossSubjectRes.find(r => r.cross_subject === 1)?.count || 0).toLocaleString()} | ${(((crossSubjectRes.find(r => r.cross_subject === 1)?.count || 0) / totalQuestions) * 100).toFixed(1)}% | Questions combining subjects (e.g. Bio-Chemistry) |

---

## 📅 Past Year Questions (PYQs) Coverage by Year
Total past-year-exam questions cataloged: **${pyqYearsRes.reduce((acc, r) => acc + r.count, 0).toLocaleString()}**

| Exam Year | Questions | Percentage of PYQ |
| :---: | :--- | :--- |
${pyqYearsRes.map(r => {
  const totPyq = pyqYearsRes.reduce((acc, r) => acc + r.count, 0);
  const pct = ((r.count / totPyq) * 100).toFixed(1);
  return `| **${r.year}** | ${r.count.toLocaleString()} | ${pct}% |`;
}).join('\n')}

---

## 🏫 Curriculum Syllabus Coverage Analysis

### Coverage Summary by Subject
| Subject | Total Topics | Covered Topics (>=1 Q) | Robust Topics (>=10 Q) | Subject Coverage |
| :--- | :---: | :---: | :---: | :---: |
${Object.entries(subjectTaxonomyStats).map(([subj, data]) => {
  const pct = ((data.covered / data.total) * 100).toFixed(1);
  return `| **${subj}** | ${data.total} | ${data.covered} | ${data.full} | **${pct}%** |`;
}).join('\n')}

### 🚨 TOP 15 Empty Topics (Needs Curation Priority)
These chapters have **zero questions** in the local database.

| Class | Exam | Subject | Chapter / Topic |
| :---: | :---: | :---: | :--- |
${emptyChapters.slice(0, 15).map(c => `| Class ${c.class} | ${BT}${c.exam}${BT} | **${c.subject}** | ${c.chapter} - *${c.topic}* |`).join('\n')}
*Total entirely empty taxonomy topics: **${emptyChapters.length}** / ${TAXONOMY.length}*

### ⚠️ TOP 15 Thin Topics (Needs Curation Priority)
These chapters have **1 to 9 questions** in the local database (under-saturated).

| Class | Exam | Subject | Chapter / Topic | Current Count |
| :---: | :---: | :---: | :--- | :---: |
${thinChapters.slice(0, 15).map(c => `| Class ${c.class} | ${BT}${c.exam}${BT} | **${c.subject}** | ${c.chapter} - *${c.topic}* | **${c.current_count}** |`).join('\n')}

### 🏆 TOP 15 Strongest Topics
These chapters have the highest question density.

| Class | Exam | Subject | Chapter / Topic | Current Count |
| :---: | :---: | :---: | :--- | :---: |
${strongChapters.slice(0, 15).map(c => `| Class ${c.class} | ${BT}${c.exam}${BT} | **${c.subject}** | ${c.chapter} - *${c.topic}* | **${c.current_count}** |`).join('\n')}

---

## 💡 Recommendations for Next Generation Cycle

1. **Prioritize Empty Topics**: Direct the automated pipeline stubs (${BT}task-1037${BT} / ${BT}auto-pipeline.ps1${BT}) to focus on the **${emptyChapters.length} empty chapters** listed above, specifically targeting Class ${emptyChapters[0]?.class || '11/12'} ${emptyChapters[0]?.subject || 'Biology'}.
2. **Backfill Thin Topics**: Set batch filters to focus on subtopics that currently have fewer than 10 questions to ensure reliable student testing.
3. **Upgrade Quality Tiers**: Introduce automated double-verifier cycles for raw Tier C questions to promote them to Tier B (Audited Syllabus Curation).
`;

  fs.writeFileSync(REPORT_FILE, md, 'utf-8');
  console.log(`\n✅ Analysis Complete! Report generated at: ${REPORT_FILE}`);
}

analyze().catch(e => {
  console.error('💥 Analyzer crashed:', e);
  process.exit(1);
});
