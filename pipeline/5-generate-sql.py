#!/usr/bin/env python3
"""
Step 5: Generate SQL chunks for D1 upload.
Splits into 500-question chunks to stay within Cloudflare D1 limits.
"""

import json, math
from pathlib import Path
from datetime import datetime

IN_FILE    = Path("pipeline/output/validated_questions.jsonl")
OUT_DIR    = Path("pipeline/output/sql_chunks")
SUMMARY    = Path("pipeline/output/sql_summary.json")

OUT_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 500  # D1 execute limit per file

def esc(s) -> str:
    if s is None: return ""
    return str(s).replace("'", "''").replace("\x00", "")

def slugify(s: str) -> str:
    import re
    return re.sub(r'[^a-z0-9_]', '_', s.lower())[:60]

def build_insert(q: dict) -> str:
    now = datetime.utcnow().isoformat() + "Z"

    # Compute topic_id slug
    subj = q.get("subject", "Science")
    cls  = q.get("class", "10")
    exam = q.get("exam", "Board")
    topic = q.get("primary_topic") or q.get("topic_hint") or "general"
    topic_id = q.get("primary_topic_id") or f"{slugify(subj)}_{cls}_{slugify(exam)}_{slugify(topic)}"

    # Metadata
    secondary_ids = json.dumps(q.get("secondary_topic_ids", []))
    concept_tags  = json.dumps(q.get("concept_tags", []))
    also_for      = json.dumps(q.get("also_for", []))
    solution_steps = json.dumps(q.get("solution_steps", []))
    options       = json.dumps(q.get("options", []))

    # Quality markers
    quality_tier  = q.get("quality_tier", "C")
    confidence    = float(q.get("confidence", 0.87))
    verified      = 1 if quality_tier == "A" else 0

    source_exam   = q.get("source_exam", "AI-Generated")
    year          = q.get("year")
    year_sql      = str(year) if year else "NULL"

    neg_mark = -1.0
    qtype = q.get("type", "MCQ")
    if q.get("exam") == "JEEAdvanced":    neg_mark = -2.0
    if q.get("exam") == "JEEMains" and qtype == "Integer": neg_mark = 0.0
    if q.get("exam") == "Board":          neg_mark = 0.0

    return f"""INSERT OR IGNORE INTO questions (
  id, exam, class, subject,
  primary_topic_id, primary_topic, primary_subtopic,
  secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for,
  type, has_image, difficulty_score, difficulty_band, step_count, negative_marking,
  question_text, options, correct_answer, explanation, solution_steps,
  key_formula, error_trap_type,
  source_exam, year, quality_tier, confidence,
  created_at, verified
) VALUES (
  '{esc(q["id"])}', '{esc(q.get("exam","Board"))}', '{esc(cls)}', '{esc(subj)}',
  '{esc(topic_id)}', '{esc(q.get("primary_topic", topic))}', '{esc(q.get("primary_subtopic","General"))}',
  '{esc(secondary_ids)}', '{esc(concept_tags)}',
  {1 if q.get("cross_chapter") else 0}, {1 if q.get("cross_subject") else 0}, '{esc(also_for)}',
  '{esc(qtype)}', 0, {int(q.get("elo",1200))}, '{esc(q.get("difficulty_band","BOARD_EASY"))}',
  {int(q.get("step_count",2))}, {neg_mark},
  '{esc(q.get("question_text",""))}', '{esc(options)}', '{esc(q.get("correct_answer",""))}',
  '{esc(q.get("explanation",""))}', '{esc(solution_steps)}',
  '{esc(q.get("key_formula",""))}', '{esc(q.get("error_trap_type","general.exam_trap"))}',
  '{esc(source_exam)}', {year_sql}, '{esc(quality_tier)}', {confidence},
  '{now}', {verified}
);"""

def main():
    if not IN_FILE.exists():
        print(f"❌ Input not found: {IN_FILE}")
        exit(1)

    lines = [l for l in IN_FILE.read_text(encoding="utf-8").splitlines() if l.strip()]
    questions = [json.loads(l) for l in lines]
    total = len(questions)
    chunks = math.ceil(total / CHUNK_SIZE)

    print(f"📦 Generating SQL: {total} questions → {chunks} chunks of {CHUNK_SIZE}")

    # Remove old chunks
    for f in OUT_DIR.glob("batch_*.sql"):
        f.unlink()

    chunk_files = []
    for i in range(chunks):
        batch = questions[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        fname = OUT_DIR / f"batch_{i+1:04d}.sql"
        sql = "\n".join(build_insert(q) for q in batch)
        fname.write_text(sql, encoding="utf-8")
        chunk_files.append(str(fname))
        print(f"   chunk {i+1}/{chunks}: {len(batch)} questions → {fname.name}")

    summary = {
        "total_questions": total,
        "chunks": chunks,
        "chunk_size": CHUNK_SIZE,
        "files": [f.name for f in OUT_DIR.glob("batch_*.sql")],
    }
    SUMMARY.write_text(json.dumps(summary, indent=2))

    print(f"\n✅ SQL generation complete: {total} questions in {chunks} files")
    print(f"   Output dir: {OUT_DIR}")

if __name__ == "__main__":
    main()
