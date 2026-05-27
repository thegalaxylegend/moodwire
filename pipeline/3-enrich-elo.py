#!/usr/bin/env python3
"""
Step 3: AI Enrichment — takes raw questions and adds:
  - ELO band (from the official table, hard-enforced)
  - Full metadata: primary_topic, subtopic, concept_tags, key_formula
  - explanation (if missing)
  - solution_steps (2-3 steps)
  - error_trap_type, also_for, cross_chapter

For Class 8-10 stubs: generates FULL question content from topic hints.
For Class 11-12 PYQ: enriches metadata only, preserves original question text.

Uses Cerebras (fastest) with Groq fallback.
"""

import os, json, re, hashlib, asyncio, time
from pathlib import Path
from typing import Optional

IN_FILE  = Path("pipeline/output/raw_questions.jsonl")
OUT_FILE = Path("pipeline/output/enriched_questions.jsonl")
ELO_DATA = json.loads(Path("pipeline/elo_bands.json").read_text())
ELO_BANDS      = ELO_DATA["bands"]
BAND_ALIASES   = ELO_DATA["aliases"]
CLASS_CONST    = ELO_DATA["class_constraints"]
EXAM_CONST     = ELO_DATA["exam_constraints"]

TARGET = int(os.environ.get("TARGET", "10000"))

# ── API Keys ──────────────────────────────────────────────────────────────────
def get_keys(prefix: str, count: int = 8) -> list[str]:
    keys = []
    for i in range(1, count + 1):
        k = os.environ.get(f"{prefix}_{i}" if i > 1 else prefix)
        if k and len(k) > 10:
            keys.append(k)
    return keys

CEREBRAS_KEYS = get_keys("CEREBRAS_API_KEY")
GROQ_KEYS     = get_keys("GROQ_API_KEY")
GEMINI_KEYS   = get_keys("GEMINI_API_KEY")

print(f"🔑 Keys: Cerebras={len(CEREBRAS_KEYS)} Groq={len(GROQ_KEYS)} Gemini={len(GEMINI_KEYS)}")

# ── ELO Table for Prompt ──────────────────────────────────────────────────────
ELO_TABLE_PROMPT = """
ELO DIFFICULTY BAND TABLE — YOU MUST USE EXACT band_id VALUES:
| band_id          | elo_min | elo_max | class  | exam         |
|------------------|---------|---------|--------|--------------|
| CLASS_8_RECALL   |  700    |  900    | 8      | Board        |
| CLASS_9_BASIC    |  900    | 1100    | 9      | Board        |
| BOARD_EASY       | 1100    | 1400    | 10     | Board easy   |
| BOARD_HARD       | 1400    | 1700    | 10     | Board hard   |
| NEET_EASY        | 1700    | 1900    | 11/12  | NEET easy    |
| JEE_MAINS_EASY   | 1800    | 2050    | 11/12  | JEE easy     |
| NEET_MEDIUM      | 1900    | 2100    | 11/12  | NEET medium  |
| JEE_MAINS_MEDIUM | 2050    | 2250    | 11/12  | JEE medium   |
| NEET_HARD        | 2100    | 2350    | 11/12  | NEET hard    |
| JEE_MAINS_HARD   | 2250    | 2500    | 11/12  | JEE hard     |
| JEE_ADV_EASY     | 2400    | 2650    | 12     | JEE Adv easy |
| JEE_ADV_MEDIUM   | 2600    | 2800    | 12     | JEE Adv med  |
| JEE_ADV_HARD     | 2800    | 3000    | 12     | JEE Adv hard |
| JEE_ADV_EXPERT   | 3000    | 3200    | 12     | Olympiad     |

HARD RULES — NEVER VIOLATE:
- class=8  → difficulty_band MUST be CLASS_8_RECALL, elo MUST be 700-900
- class=9  → difficulty_band MUST be CLASS_9_BASIC, elo MUST be 900-1100
- class=10 → difficulty_band MUST be BOARD_EASY or BOARD_HARD
- exam=NEET → difficulty_band MUST be NEET_EASY, NEET_MEDIUM, or NEET_HARD
- exam=JEEMains → difficulty_band MUST be JEE_MAINS_EASY, JEE_MAINS_MEDIUM, or JEE_MAINS_HARD
- exam=JEEAdvanced → difficulty_band MUST be JEE_ADV_EASY, JEE_ADV_MEDIUM, JEE_ADV_HARD, or JEE_ADV_EXPERT
- elo value MUST be within [elo_min, elo_max] of your chosen band_id — NO EXCEPTIONS
"""

# ── Prompt Builder ─────────────────────────────────────────────────────────────
def build_enrich_prompt(q: dict) -> str:
    is_stub = q.get("is_stub", False)
    cls     = q.get("class", "12")
    exam    = q.get("exam", "JEEMains")
    subj    = q.get("subject", "Physics")
    topic   = q.get("topic_hint", "")
    subtopic = q.get("subtopic_hint", "")

    if is_stub:
        # Full question generation for Class 8-10 stubs
        # These are NCERT/Board level — use official NCERT content style
        return f"""You are an expert NCERT question writer creating authentic Class {cls} Board exam questions.
Generate a COMPLETE exam question based on the NCERT syllabus topic below.

Topic: {subj} — {topic} — {subtopic}
Class: {cls} | Exam: Board | Source style: NCERT Exemplar / CBSE Board PYQ

{ELO_TABLE_PROMPT}

Generate 1 complete MCQ question. Return ONLY valid JSON:
{{
  "question_text": "Full question text (can use simple math notation, no LaTeX needed for class 8-10)",
  "type": "MCQ",
  "options": ["option A text", "option B text", "option C text", "option D text"],
  "correct_answer": "exact text of correct option",
  "explanation": "Brief explanation (1-2 sentences) of why the answer is correct",
  "solution_steps": ["step 1", "step 2"],
  "primary_topic": "{topic}",
  "primary_subtopic": "{subtopic}",
  "primary_topic_id": "slug like sci_8_board_microorganisms",
  "secondary_topic_ids": [],
  "concept_tags": ["tag1", "tag2", "tag3"],
  "cross_chapter": 0,
  "cross_subject": 0,
  "also_for": [],
  "subject": "{subj}",
  "class": "{cls}",
  "exam": "Board",
  "difficulty_band": "CLASS_{cls.replace('8','8').replace('9','9')}_{'RECALL' if cls=='8' else 'BASIC' if cls=='9' else 'EASY or BOARD_HARD'}",
  "elo": <integer within band range>,
  "step_count": 2,
  "key_formula": "main formula or empty string",
  "error_trap_type": "general.recall or specific trap"
}}

CRITICAL: difficulty_band and elo MUST follow the ELO table rules above. Class {cls} has strict constraints."""

    else:
        # Enrichment for existing PYQ (Class 11-12)
        text    = q.get("question_text", "")
        opts    = q.get("options", [])
        correct = q.get("correct_answer", "")

        return f"""You are ExamCompass Senior Curator. Enrich this existing exam question with full metadata.
DO NOT change the question text, options, or correct answer.

ORIGINAL QUESTION:
Subject: {subj} | Class: {cls} | Exam: {exam}
Question: {text[:500]}
Options: {json.dumps(opts)}
Correct: {correct}
Topic hint: {topic}

{ELO_TABLE_PROMPT}

Return ONLY valid JSON with enrichment metadata:
{{
  "question_text": "<copy original exactly>",
  "type": "MCQ",
  "options": <copy original options array>,
  "correct_answer": "<copy original correct answer>",
  "explanation": "Clear 1-2 sentence explanation of the solution approach",
  "solution_steps": ["step 1 (≤15 words)", "step 2 (≤15 words)", "step 3 if needed"],
  "primary_topic": "Specific topic name",
  "primary_subtopic": "Specific subtopic",
  "primary_topic_id": "slug_format_topic_id",
  "secondary_topic_ids": [],
  "concept_tags": ["tag1", "tag2", "tag3", "tag4"],
  "cross_chapter": 0,
  "cross_subject": 0,
  "also_for": [],
  "subject": "{subj}",
  "class": "{cls}",
  "exam": "{exam}",
  "difficulty_band": "<exact band_id from table>",
  "elo": <integer within band range>,
  "step_count": <1-6>,
  "key_formula": "main formula or empty string",
  "error_trap_type": "category.specific_trap"
}}

CRITICAL ELO RULES FOR {exam} class {cls}:
{f"- MUST use NEET_EASY/NEET_MEDIUM/NEET_HARD only" if exam == "NEET" else ""}
{f"- MUST use JEE_MAINS_EASY/MEDIUM/HARD only" if exam == "JEEMains" else ""}
{f"- MUST use JEE_ADV_EASY/MEDIUM/HARD/EXPERT only" if exam == "JEEAdvanced" else ""}
{f"- class={cls} allows: {CLASS_CONST.get(cls, [])}"}"""


# ── API Callers ────────────────────────────────────────────────────────────────
import urllib.request, urllib.error

def call_cerebras(key: str, prompt: str) -> Optional[str]:
    for model in ["qwen-3-235b-a22b-instruct-2507", "llama3.1-8b"]:
        try:
            payload = json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.15,
                "max_completion_tokens": 1500,
                "response_format": {"type": "json_object"}
            }).encode()
            req = urllib.request.Request(
                "https://api.cerebras.ai/v1/chat/completions",
                data=payload,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
            content = data["choices"][0]["message"]["content"]
            return content
        except Exception as e:
            err_str = str(e)
            if hasattr(e, 'read'):
                try: err_str += " - Details: " + e.read().decode()
                except: pass
            print(f"⚠️ Cerebras call failed for model {model}: {err_str}")
            if "429" in str(e): raise Exception("RATE_LIMIT")
    return None

def call_groq(key: str, model: str, prompt: str) -> Optional[str]:
    for m in [model, "llama-3.1-8b-instant"]:
        try:
            payload = json.dumps({
                "model": m,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.15,
                "max_tokens": 1500,
                "response_format": {"type": "json_object"}
            }).encode()
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=payload,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read())
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            err_str = str(e)
            if hasattr(e, 'read'):
                try: err_str += " - Details: " + e.read().decode()
                except: pass
            print(f"⚠️ Groq call failed for model {m}: {err_str}")
            if "429" in str(e) or "403" in str(e): raise Exception("RATE_LIMIT")
    return None

def call_gemini(key: str, model: str, prompt: str) -> Optional[str]:
    for m in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]:
        # Retry with exponential backoff on 429 rate-limit errors
        for attempt in range(4):  # up to 3 retries
            try:
                payload = json.dumps({
                    "model": m,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.15,
                    "max_tokens": 1500,
                    "response_format": {"type": "json_object"}
                }).encode()
                req = urllib.request.Request(
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    data=payload,
                    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=45) as r:
                    data = json.loads(r.read())
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                err_str = str(e)
                if hasattr(e, 'read'):
                    try: err_str += " - Details: " + e.read().decode()
                    except: pass
                is_rate_limit = "429" in err_str
                is_blocked    = "403" in err_str
                if is_rate_limit and attempt < 3:
                    wait = (2 ** attempt) * 15  # 15s, 30s, 60s
                    print(f"⏳ Gemini 429 on {m} (attempt {attempt+1}/3) — sleeping {wait}s...")
                    time.sleep(wait)
                    continue  # retry same model
                if is_blocked:
                    print(f"⚠️ Gemini 403 on {m}: blocked — trying next model")
                    break  # try next model
                print(f"⚠️ Gemini call failed for model {m}: {err_str}")
                if is_rate_limit:
                    raise Exception("RATE_LIMIT")  # exhausted retries
                break  # non-recoverable error, try next model
    return None

def extract_json(text: str) -> Optional[dict]:
    if not text: return None
    # Try direct parse
    try: return json.loads(text)
    except: pass
    # Extract from markdown
    m = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if m:
        try: return json.loads(m.group(1))
        except: pass
    # Find JSON object
    m = re.search(r'\{[\s\S]+\}', text)
    if m:
        try: return json.loads(m.group(0))
        except: pass
    return None

def resolve_band_alias(band: str) -> str:
    return BAND_ALIASES.get(band, band)

def fix_elo(data: dict) -> dict:
    """Fix ELO to be within band range. Drop if band is invalid."""
    band = resolve_band_alias(str(data.get("difficulty_band", "")))
    if band not in ELO_BANDS:
        return None
    data["difficulty_band"] = band

    elo_min = ELO_BANDS[band]["elo_min"]
    elo_max = ELO_BANDS[band]["elo_max"]
    elo = int(data.get("elo", 0))

    if not (elo_min <= elo <= elo_max):
        # Auto-fix: set to midpoint of band
        data["elo"] = (elo_min + elo_max) // 2

    return data

def enrich_question(q: dict, cb_keys: list, groq_keys: list, gemini_keys: list) -> Optional[dict]:
    prompt = build_enrich_prompt(q)

    result_text = None
    # Try Cerebras keys
    for key in cb_keys:
        try:
            result_text = call_cerebras(key, prompt)
            if result_text: break
        except Exception as e:
            if "RATE_LIMIT" in str(e): continue
            break

    # Fallback to Groq
    if not result_text:
        for key in groq_keys:
            try:
                result_text = call_groq(key, "llama-3.3-70b-versatile", prompt)
                if result_text: break
            except Exception as e:
                if "RATE_LIMIT" in str(e): continue
                break

    # Fallback to Gemini
    if not result_text:
        for key in gemini_keys:
            try:
                result_text = call_gemini(key, "gemini-1.5-flash", prompt)
                if result_text: break
            except Exception as e:
                if "RATE_LIMIT" in str(e): continue
                break

    if not result_text:
        return None

    data = extract_json(result_text)
    if not data: return None

    # Merge with original (preserve source fields)
    merged = {**q, **data}

    # Preserve original question text/options/answer for PYQ
    if not q.get("is_stub"):
        if q.get("question_text") and len(q["question_text"]) > 20:
            merged["question_text"] = q["question_text"]
        if q.get("options") and len(q["options"]) >= 2:
            merged["options"] = q["options"]
        if q.get("correct_answer"):
            merged["correct_answer"] = q["correct_answer"]

    # Fix ELO
    merged = fix_elo(merged)
    if not merged: return None

    # Set required fields from source
    merged["source"]       = q.get("source", "AI-Generated")
    merged["source_exam"]  = q.get("source_exam", "AI-Generated")
    merged["year"]         = q.get("year")
    merged["quality_tier"] = q.get("quality_tier", "C")
    merged["confidence"]   = q.get("confidence", 0.87)

    return merged


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    if not IN_FILE.exists():
        print(f"❌ {IN_FILE} not found")
        exit(1)

    lines = [l for l in IN_FILE.read_text(encoding="utf-8").splitlines() if l.strip()]
    raw_questions = [json.loads(l) for l in lines]
    print(f"📋 Loaded {len(raw_questions)} raw questions")
    print(f"🎯 Target: {TARGET} enriched questions")

    # Shuffle Cerebras / Groq / Gemini key lists for round-robin
    cb_keys     = CEREBRAS_KEYS * 3
    groq_keys   = GROQ_KEYS * 2
    gemini_keys = GEMINI_KEYS * 3

    enriched = []
    skipped = 0
    start = time.time()

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    out_fp = OUT_FILE.open("w", encoding="utf-8")

    from concurrent.futures import ThreadPoolExecutor, as_completed
    import threading
    write_lock = threading.Lock()

    # Limit concurrent workers to 3 to stay within Gemini free-tier rate limits
    # (GitHub Action IPs are WAF-blocked on Cerebras/Groq, so Gemini is the sole API)
    max_workers = min(3, max(1, len(raw_questions)))
    print(f"🚀 Running enrichment with {max_workers} parallel workers (rate-limit safe)...")

    # Select the slice of questions we want to target
    questions_to_process = raw_questions[:TARGET]

    def process_one(idx, q):
        nonlocal skipped
        # Stagger start to avoid all workers hitting API simultaneously
        time.sleep(idx % max_workers * 1.5)
        cb_key_slice = cb_keys[idx % len(cb_keys):] + cb_keys[:idx % len(cb_keys)] if cb_keys else []
        groq_key_slice = groq_keys[idx % len(groq_keys):] + groq_keys[:idx % len(groq_keys)] if groq_keys else []
        gemini_key_slice = gemini_keys[idx % len(gemini_keys):] + gemini_keys[:idx % len(gemini_keys)] if gemini_keys else []

        result = enrich_question(q, cb_key_slice[:3], groq_key_slice[:3], gemini_key_slice[:3])
        # Brief cooldown after each question to spread load across the minute window
        time.sleep(1.0)
        return result

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_one, i, q): q for i, q in enumerate(questions_to_process)}
        
        for future in as_completed(futures):
            # Stop submitting/waiting if target reached
            with write_lock:
                if len(enriched) >= TARGET:
                    break
            
            result = future.result()
            if result:
                with write_lock:
                    enriched.append(result)
                    out_fp.write(json.dumps(result, ensure_ascii=False) + "\n")
                    out_fp.flush()
                
                elapsed = time.time() - start
                qpm = len(enriched) / max(elapsed/60, 0.01)
                remaining = max(0, TARGET - len(enriched))
                eta = f"{remaining/max(qpm,1):.0f}m" if qpm > 0 else "?"
                print(f"\r   [{len(enriched)}/{TARGET}] {qpm:.0f} q/min | skipped={skipped} | ETA={eta}   ", end="", flush=True)
            else:
                with write_lock:
                    skipped += 1

    out_fp.close()

    elapsed = time.time() - start
    print(f"\n\n{'='*50}")
    print(f"✅ ENRICHMENT COMPLETE")
    print(f"   Enriched: {len(enriched)} questions")
    print(f"   Skipped:  {skipped}")
    print(f"   Time:     {elapsed/60:.1f}m")
    print(f"   Rate:     {len(enriched)/(elapsed/60):.0f} q/min")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
