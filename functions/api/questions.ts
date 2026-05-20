// ═══════════════════════════════════════════════════════════════════
// EXAMCOMPASS QUESTIONS D1 ROUTER v1.0 — Cloudflare Pages Function
// Serves adaptive curated questions with multi-tier ELO fallbacks
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
  DB?: D1Database; // Cloudflare D1 Binding
}

interface QuestionRow {
  id: string;
  exam: string;
  class: string;
  subject: string;
  topic_id: string;
  topic: string;
  subtopic: string;
  type: string;
  difficulty_score: number;
  difficulty_band: string;
  question_text: string;
  options: string; // JSON string representation
  correct_answer: string;
  explanation: string;
  rich_explanation?: string; // JSON string
  concept_tags: string; // JSON string
  error_trap_type: string;
  numerical_formula?: string;
  given_values?: string; // JSON string
  final_numerical_value?: number;
  final_unit?: string;
  source_exam?: string;
  confidence?: number;
  created_at: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function err(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

// Helper to safely parse JSON strings
function safeParse(str: string | undefined | null, fallback: any = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// Convert D1 database row to StoredQuestion format expected by frontend
function mapRowToQuestion(row: QuestionRow) {
  return {
    id: row.id,
    exam: row.exam,
    class: row.class,
    subject: row.subject,
    topic: row.topic,
    topic_id: row.topic_id,
    subtopic: row.subtopic,
    type: row.type as any,
    difficulty_score: row.difficulty_score,
    difficulty_band: row.difficulty_band,
    question: row.question_text, // Map to frontend's question field
    options: safeParse(row.options, []),
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    rich_explanation: safeParse(row.rich_explanation, null),
    concept_tags: safeParse(row.concept_tags, []),
    error_trap_type: row.error_trap_type,
    numerical_formula: row.numerical_formula,
    given_values: safeParse(row.given_values, {}),
    final_numerical_value: row.final_numerical_value,
    final_unit: row.final_unit,
    source_exam: row.source_exam,
    confidence: row.confidence ?? 0.8,
    created_at: row.created_at,
    usage_count: 0
  };
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    if (!env.DB) {
      return err('Cloudflare D1 DB binding is missing or not configured.', 500);
    }

    const body = await request.json() as any;
    const { needs, exam, abilityScore = 1000 } = body;

    if (!needs || !Array.isArray(needs)) {
      return err('needs array required', 400);
    }

    if (!exam) {
      return err('exam string required', 400);
    }

    // Normalize exam to match DB values: 'JEEMains', 'JEEAdvanced', 'NEET', 'Board'
    let normalizedExam = 'JEEMains';
    const eLower = String(exam).toLowerCase();
    if (eLower.includes('neet')) {
      normalizedExam = 'NEET';
    } else if (eLower.includes('board') || eLower.includes('foundation') || eLower.includes('school')) {
      normalizedExam = 'Board';
    } else if (eLower.includes('advanced')) {
      normalizedExam = 'JEEAdvanced';
    } else {
      normalizedExam = 'JEEMains'; // default
    }

    const allQuestions: any[] = [];
    const selectedIds = new Set<string>();

    for (const group of needs) {
      const { topic, count, topic_id } = group;
      if (!topic || !count) continue;

      const targetTopicId = topic_id || topic.toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // 1. Determine Distribution (70/20/10 Banding)
      const comfortCount = Math.max(0, Math.floor(count * 0.7));
      const challengeCount = Math.max(0, Math.floor(count * 0.2));
      const stretchCount = Math.max(0, count - comfortCount - challengeCount);

      const targets = [
        { rating: abilityScore - 150, count: comfortCount, label: 'Comfort' },
        { rating: abilityScore, count: challengeCount, label: 'Challenge' },
        { rating: abilityScore + 250, count: stretchCount, label: 'Stretch' }
      ];

      const groupQuestions: any[] = [];

      for (const target of targets) {
        if (target.count <= 0) continue;

        let needed = target.count;
        let windowSize = 150;
        const maxWindow = 1200; // Cap search window expansion

        while (needed > 0 && windowSize <= maxWindow) {
          const minScore = target.rating - windowSize;
          const maxScore = target.rating + windowSize;

          // Also match cross-exam questions via also_for JSON column
          let queryStr = `
            SELECT * FROM questions 
            WHERE (exam = ? OR also_for LIKE ?) 
              AND (topic_id = ? OR topic = ?) 
              AND difficulty_score BETWEEN ? AND ?
          `;
          
          // Exclude already selected questions
          const alsoForPattern = `%"${normalizedExam}"%`;
          const params: any[] = [normalizedExam, alsoForPattern, targetTopicId, topic, minScore, maxScore];
          if (selectedIds.size > 0) {
            const placeholders = Array.from({ length: selectedIds.size }).map(() => '?').join(',');
            queryStr += ` AND id NOT IN (${placeholders})`;
            params.push(...Array.from(selectedIds));
          }

          queryStr += ` ORDER BY RANDOM() LIMIT ?`;
          params.push(needed);

          const dbRes = await env.DB.prepare(queryStr).bind(...params).all<QuestionRow>();
          
          if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
            for (const row of dbRes.results) {
              groupQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }

          // Expand ELO window by ±150 points for next attempt
          windowSize += 150;
        }

        // Final fallback: If we still need questions after ELO window search, relax difficulty constraints completely
        if (needed > 0) {
          let fallbackQuery = `
            SELECT * FROM questions 
            WHERE (exam = ? OR also_for LIKE ?) 
              AND (topic_id = ? OR topic = ?)
          `;
          const alsoForPatternFb = `%"${normalizedExam}"%`;
          const params: any[] = [normalizedExam, alsoForPatternFb, targetTopicId, topic];
          if (selectedIds.size > 0) {
            const placeholders = Array.from({ length: selectedIds.size }).map(() => '?').join(',');
            fallbackQuery += ` AND id NOT IN (${placeholders})`;
            params.push(...Array.from(selectedIds));
          }
          fallbackQuery += ` ORDER BY RANDOM() LIMIT ?`;
          params.push(needed);

          const dbRes = await env.DB.prepare(fallbackQuery).bind(...params).all<QuestionRow>();
          if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
            for (const row of dbRes.results) {
              groupQuestions.push(mapRowToQuestion(row));
              selectedIds.add(row.id);
              needed--;
            }
          }
        }
      }

      allQuestions.push(...groupQuestions);
    }

    return new Response(JSON.stringify(allQuestions), {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/json',
      },
    });

  } catch (e: any) {
    return err(e.message || 'Internal error', 500);
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
