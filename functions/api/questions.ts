// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS QUESTIONS D1 ROUTER v2.0 — Cloudflare Pages Function
// Schema-corrected to match actual D1 table columns
// ═══════════════════════════════════════════════════════════════════

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<D1Result<T>>;
}

interface D1Result<T = any> {
  results: T[];
  success: boolean;
  error?: string;
}

interface Env {
  DB?: D1Database;
}

// Real D1 schema columns
interface QuestionRow {
  id: string;
  exam: string;
  class: string;
  subject: string;
  primary_topic_id: string;
  primary_topic: string;
  primary_subtopic: string;
  secondary_topic_ids: string;
  concept_tags: string;
  cross_chapter: number;
  cross_subject: number;
  also_for: string;
  type: string;
  passage_id: string;
  has_image: number;
  difficulty_score: number;
  difficulty_band: string;
  step_count: number;
  negative_marking: number;
  question_text: string;
  options: string;
  correct_answer: string;
  explanation: string;
  solution_steps: string;
  key_formula: string;
  error_trap_type: string;
  source_exam: string;
  year: number;
  quality_tier: string;
  confidence: number;
  created_at: string;
  verified: number;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function safeParse(str: string | undefined | null, fallback: any = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

function mapRowToQuestion(row: QuestionRow) {
  return {
    id: row.id,
    exam: row.exam,
    class: row.class,
    subject: row.subject,
    topic_id: row.primary_topic_id,
    topic: row.primary_topic,
    subtopic: row.primary_subtopic,
    type: row.type as any,
    difficulty_score: row.difficulty_score,
    difficulty_band: row.difficulty_band,
    question: row.question_text,
    question_text: row.question_text,
    options: safeParse(row.options, []),
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    solution_steps: safeParse(row.solution_steps, []),
    concept_tags: safeParse(row.concept_tags, []),
    error_trap_type: row.error_trap_type || '',
    key_formula: row.key_formula || '',
    source_exam: row.source_exam || '',
    year: row.year || null,
    confidence: row.confidence ?? 0.8,
    verified: !!row.verified,
    quality_tier: row.quality_tier || 'standard',
    created_at: row.created_at,
    usage_count: 0,
    also_for: safeParse(row.also_for, []),
  };
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    if (!env.DB) {
      return err('Cloudflare D1 DB binding missing. Check Pages → Settings → Bindings → DB.', 503);
    }

    const body = await request.json() as any;
    const { needs, exam, abilityScore = 1000 } = body;

    if (!needs || !Array.isArray(needs)) return err('needs array required', 400);
    if (!exam) return err('exam string required', 400);

    // Normalize exam to match DB values
    let normalizedExam = 'JEEMains';
    const eLower = String(exam).toLowerCase();
    if (eLower.includes('neet'))                                              normalizedExam = 'NEET';
    else if (eLower.includes('advanced'))                                     normalizedExam = 'JEEAdvanced';
    else if (eLower.includes('board') || eLower.includes('foundation'))       normalizedExam = 'Board';
    else                                                                      normalizedExam = 'JEEMains';

    const allQuestions: any[] = [];
    const selectedIds = new Set<string>();

    for (const group of needs) {
      const { topic, count, topic_id } = group;
      if (!topic || !count) continue;

      const targetTopicId = topic_id || topic.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const alsoForPattern = `%"${normalizedExam}"%`;

      // ELO banding: 70% comfort / 20% challenge / 10% stretch
      const comfortCount   = Math.max(0, Math.floor(count * 0.7));
      const challengeCount = Math.max(0, Math.floor(count * 0.2));
      const stretchCount   = Math.max(0, count - comfortCount - challengeCount);

      const targets = [
        { rating: abilityScore - 150, count: comfortCount },
        { rating: abilityScore,       count: challengeCount },
        { rating: abilityScore + 250, count: stretchCount },
      ];

      for (const target of targets) {
        if (target.count <= 0) continue;
        let needed = target.count;

        // Expanding ELO window search
        for (let windowSize = 200; needed > 0 && windowSize <= 1500; windowSize += 200) {
          const minScore = target.rating - windowSize;
          const maxScore = target.rating + windowSize;

          const excludePlaceholders = selectedIds.size > 0
            ? `AND id NOT IN (${Array.from({ length: selectedIds.size }).fill('?').join(',')})` : '';

          const sql = `
            SELECT * FROM questions
            WHERE (exam = ? OR also_for LIKE ?)
              AND (primary_topic_id = ? OR primary_topic = ?)
              AND difficulty_score BETWEEN ? AND ?
              ${excludePlaceholders}
            ORDER BY RANDOM()
            LIMIT ?
          `;
          const params: any[] = [
            normalizedExam, alsoForPattern,
            targetTopicId, topic,
            minScore, maxScore,
            ...Array.from(selectedIds),
            needed,
          ];

          const res = await env.DB.prepare(sql).bind(...params).all<QuestionRow>();
          if (res.success && res.results?.length > 0) {
            for (const row of res.results) {
              allQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }
        }

        // Final fallback: no difficulty filter, just topic match
        if (needed > 0) {
          const excludePlaceholders = selectedIds.size > 0
            ? `AND id NOT IN (${Array.from({ length: selectedIds.size }).fill('?').join(',')})` : '';

          const sql = `
            SELECT * FROM questions
            WHERE (exam = ? OR also_for LIKE ?)
              AND (primary_topic_id = ? OR primary_topic = ?)
              ${excludePlaceholders}
            ORDER BY RANDOM()
            LIMIT ?
          `;
          const params: any[] = [
            normalizedExam, alsoForPattern,
            targetTopicId, topic,
            ...Array.from(selectedIds),
            needed,
          ];

          const res = await env.DB.prepare(sql).bind(...params).all<QuestionRow>();
          if (res.success && res.results?.length > 0) {
            for (const row of res.results) {
              allQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }
        }
      }

      // Last resort: any question from this exam
      if (allQuestions.filter(q => q.topic === topic).length === 0) {
        const sql = `SELECT * FROM questions WHERE exam = ? ORDER BY RANDOM() LIMIT ?`;
        const res = await env.DB.prepare(sql).bind(normalizedExam, count).all<QuestionRow>();
        if (res.success && res.results?.length > 0) {
          for (const row of res.results) {
            if (!selectedIds.has(row.id)) {
              allQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify(allQuestions), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[questions API] Error:', e);
    return err(e?.message || 'Internal server error', 500);
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    if (!env.DB) return err('D1 binding missing', 503);
    const url = new URL(request.url);
    const exam = url.searchParams.get('exam') || 'JEEMains';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const res = await env.DB.prepare(
      `SELECT * FROM questions WHERE exam = ? ORDER BY RANDOM() LIMIT ?`
    ).bind(exam, limit).all<QuestionRow>();
    return new Response(JSON.stringify(res.results?.map(mapRowToQuestion) || []), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return err(e?.message || 'Internal error', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
