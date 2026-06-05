#!/usr/bin/env python3
"""
Step 3: AI Enrichment - takes raw questions and adds:
  - ELO band (from the official table, hard-enforced)
  - Full metadata: primary_topic, subtopic, concept_tags, key_formula
  - explanation (if missing)
  - solution_steps (2-3 steps)
  - error_trap_type, also_for, cross_chapter

For Class 8-10 stubs: generates FULL question content from topic hints.
For Class 11-12 PYQ: enriches metadata only, preserves original question text.

API priority: Cerebras (fastest) → Groq (fast) → Gemini (reliable)
Key rotation: Thread-safe round-robin across ALL keys with per-key cooldown tracking.
"""

import os, json, re, time, threading
try:
    import dotenv
    dotenv.load_dotenv(r"C:\Users\Admin\Downloads\Desktop\.env")
    dotenv.load_dotenv()
except ImportError:
    pass
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request, urllib.error

IN_FILE  = Path("pipeline/output/raw_questions.jsonl")
OUT_FILE = Path("pipeline/output/enriched_questions.jsonl")
ELO_DATA = json.loads(Path("pipeline/elo_bands.json").read_text(encoding="utf-8"))
ELO_BANDS      = ELO_DATA["bands"]
BAND_ALIASES   = ELO_DATA["aliases"]
CLASS_CONST    = ELO_DATA["class_constraints"]
EXAM_CONST     = ELO_DATA["exam_constraints"]

TARGET = int(os.environ.get("TARGET", "10000"))

# ── API Keys ──────────────────────────────────────────────────────────────────
def get_keys(prefix: str, count: int = 8) -> list[str]:
    keys = []
    for i in range(1, count + 1):
        for pref in [prefix, f"VITE_{prefix}"]:
            name = f"{pref}_{i}" if i > 1 else pref
            k = os.environ.get(name)
            if k and len(k) > 10:
                keys.append(k)
                break
    return keys

CEREBRAS_KEYS = get_keys("CEREBRAS_API_KEY", 8)
GROQ_KEYS     = get_keys("GROQ_API_KEY", 8)
GEMINI_KEYS   = get_keys("GEMINI_API_KEY", 6)

print(f"[KEYS] Keys loaded: Cerebras={len(CEREBRAS_KEYS)} Groq={len(GROQ_KEYS)} Gemini={len(GEMINI_KEYS)}")

# ── Latest models per provider (ordered by speed/quality) ────────────────────
# Cerebras free tier - ultra-fast inference
CEREBRAS_MODELS = [
    "gpt-oss-120b",
    "zai-glm-4.7",
]

# Groq free tier - fast LPU inference
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

# Gemini free tier - reliable, works from GitHub Actions
GEMINI_MODELS = [
    "gemini-2.5-flash",
]

# ── Thread-safe Key Rotator ───────────────────────────────────────────────────
class KeyRotator:
    """
    Thread-safe round-robin key selector with per-key cooldown.
    When a key gets 429, it's cooled for `cooldown_sec` seconds.
    Other keys continue unaffected.
    """
    def __init__(self, keys: list, cooldown_sec: int = 65):
        self._keys = list(keys)
        self._cooldown = cooldown_sec
        self._idx = 0
        self._cooling: dict = {}   # key -> expiry timestamp
        self._lock = threading.Lock()

    def get(self) -> Optional[str]:
        """Get the next available (non-cooling) key. Returns None if all are cooling."""
        with self._lock:
            now = time.time()
            n = len(self._keys)
            for _ in range(n):
                key = self._keys[self._idx % n]
                self._idx += 1
                if self._cooling.get(key, 0) <= now:
                    return key
            return None  # all keys cooling

    def mark_rate_limited(self, key: str):
        """Put this key on cooldown for cooldown_sec seconds."""
        with self._lock:
            self._cooling[key] = time.time() + self._cooldown
            print(f"\n   [COOLDOWN] Key {key[:12]}... rate-limited -> cooling {self._cooldown}s")

    def available(self) -> int:
        with self._lock:
            now = time.time()
            return sum(1 for k in self._keys if self._cooling.get(k, 0) <= now)

    def __len__(self):
        return len(self._keys)

# Shared global rotators (all workers share these)
CB_ROTATOR    = KeyRotator(CEREBRAS_KEYS, cooldown_sec=61)
GROQ_ROTATOR  = KeyRotator(GROQ_KEYS,    cooldown_sec=61)
GEMINI_ROTATOR = KeyRotator(GEMINI_KEYS, cooldown_sec=62)

# ── ELO Table for Prompt ──────────────────────────────────────────────────────
ELO_TABLE_PROMPT = """
ELO DIFFICULTY BAND TABLE - YOU MUST USE EXACT band_id VALUES:
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

HARD RULES - NEVER VIOLATE:
- class=8  → difficulty_band MUST be CLASS_8_RECALL, elo MUST be 700-900
- class=9  → difficulty_band MUST be CLASS_9_BASIC, elo MUST be 900-1100
- class=10 → difficulty_band MUST be BOARD_EASY or BOARD_HARD
- exam=NEET → difficulty_band MUST be NEET_EASY, NEET_MEDIUM, or NEET_HARD
- exam=JEEMains → difficulty_band MUST be JEE_MAINS_EASY, JEE_MAINS_MEDIUM, or JEE_MAINS_HARD
- exam=JEEAdvanced → difficulty_band MUST be JEE_ADV_EASY, JEE_ADV_MEDIUM, JEE_ADV_HARD, or JEE_ADV_EXPERT
- elo value MUST be within [elo_min, elo_max] of your chosen band_id - NO EXCEPTIONS
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
        return f"""You are an expert NCERT question writer creating authentic Class {cls} Board exam questions.
Generate a COMPLETE exam question based on the NCERT syllabus topic below.

Topic: {subj} - {topic} - {subtopic}
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
  "difficulty_band": "CLASS_8_RECALL or CLASS_9_BASIC or BOARD_EASY or BOARD_HARD",
  "elo": <integer within band range>,
  "step_count": 2,
  "key_formula": "main formula or empty string",
  "error_trap_type": "general.recall or specific trap"
}}

CRITICAL: difficulty_band and elo MUST follow the ELO table rules above. Class {cls} has strict constraints."""

    else:
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

CRITICAL: DO NOT solve the math/science questions step-by-step. Do NOT perform any calculations. Just perform tag classification and metadata enrichment directly. Keep reasoning to an absolute minimum (under 50 words).

Return ONLY valid JSON with enrichment metadata:
{{
  "question_text": "<copy original exactly>",
  "type": "MCQ",
  "options": <copy original options array>,
  "correct_answer": "<copy original correct answer>",
  "explanation": "Clear 1-2 sentence explanation of the solution approach",
  "solution_steps": ["step 1 (<=15 words)", "step 2 (<=15 words)", "step 3 if needed"],
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


# ── Low-level API callers ─────────────────────────────────────────────────────
def _http_post(url: str, payload: bytes, headers: dict, timeout: int = 45) -> Optional[str]:
    """Generic POST helper. Returns response text or None. Raises ValueError on 429/403."""
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode()
    except urllib.error.HTTPError as e:
        body = ""
        try: body = e.read().decode()
        except: pass
        code = e.code
        if code == 429:
            raise ValueError("RATE_LIMIT")
        if code == 403:
            raise ValueError("BLOCKED")
        raise ValueError(f"HTTP_{code}: {body[:200]}")

def call_cerebras_model(key: str, model: str, prompt: str) -> Optional[str]:
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.15,
        "max_completion_tokens": 4000,
        "response_format": {"type": "json_object"},
    }).encode()
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    try:
        resp = _http_post("https://api.cerebras.ai/v1/chat/completions", payload, headers)
        data = json.loads(resp)
        return data["choices"][0]["message"]["content"]
    except ValueError as e:
        if "RATE_LIMIT" in str(e) or "BLOCKED" in str(e):
            raise  # bubble up to rotator
        print(f"   [ERROR] Cerebras {model}: {e}")
    return None

def call_cerebras_key(key: str, prompt: str) -> Optional[str]:
    """Try all Cerebras models with one key. Returns text or None."""
    for model in CEREBRAS_MODELS:
        res = call_cerebras_model(key, model, prompt)
        if res:
            return res
    return None

def call_groq(key: str, model: str, prompt: str) -> Optional[str]:
    """Exposed for test compatibility, calls a specific Groq model."""
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.15,
        "max_tokens": 1500,
        "response_format": {"type": "json_object"},
    }).encode()
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    try:
        resp = _http_post("https://api.groq.com/openai/v1/chat/completions", payload, headers)
        data = json.loads(resp)
        return data["choices"][0]["message"]["content"]
    except ValueError as e:
        if "RATE_LIMIT" in str(e) or "BLOCKED" in str(e):
            raise
        print(f"   [ERROR] Groq {model}: {e}")
    return None

def call_groq_key(key: str, prompt: str) -> Optional[str]:
    """Try all Groq models with one key."""
    for model in GROQ_MODELS:
        res = call_groq(key, model, prompt)
        if res:
            return res
    return None

def call_gemini(key: str, model: str, prompt: str) -> Optional[str]:
    """Calls standard Gemini API generateContent with thinking disabled."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    for attempt in range(3):   # up to 2 retries per model
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": 4000,
                "temperature": 0.15,
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0}
            }
        }).encode()
        try:
            resp = _http_post(url, payload, headers, timeout=60)
            data = json.loads(resp)
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if text:
                return text
        except ValueError as e:
            err = str(e)
            if "RATE_LIMIT" in err:
                if attempt < 2:
                    wait = (2 ** attempt) * 20   # 20s, 40s
                    print(f"\n   [COOLDOWN] Gemini 429 on {model} attempt {attempt+1} - sleeping {wait}s")
                    time.sleep(wait)
                    continue
                raise  # exhausted retries → bubble to rotator
            if "BLOCKED" in err:
                break  # try next model
            print(f"   [ERROR] Gemini {model}: {err[:100]}")
            break
    return None

def call_gemini_key(key: str, prompt: str) -> Optional[str]:
    """Try all Gemini models with one key."""
    for model in GEMINI_MODELS:
        res = call_gemini(key, model, prompt)
        if res:
            return res
    return None

# For test_enrich.py backwards compatibility
call_cerebras = call_cerebras_key

# ── Rotator-aware caller ───────────────────────────────────────────────────────
def call_with_rotator(rotator: KeyRotator, caller_fn, prompt: str) -> Optional[str]:
    """
    Try keys from the rotator one by one until one succeeds.
    On RATE_LIMIT, marks that key as cooling and tries the next.
    On BLOCKED (WAF), marks as cooling and tries next.
    """
    tried = 0
    max_tries = len(rotator)
    while tried < max_tries:
        key = rotator.get()
        if key is None:
            # All keys cooling - wait for the shortest cooldown
            time.sleep(5)
            tried += 1
            continue
        try:
            result = caller_fn(key, prompt)
            if result:
                return result
        except ValueError as e:
            if "RATE_LIMIT" in str(e) or "BLOCKED" in str(e):
                rotator.mark_rate_limited(key)
            # else non-recoverable error for this key
        tried += 1
    return None


# ── JSON extraction ───────────────────────────────────────────────────────────
def extract_json(text: str) -> Optional[dict]:
    if not text: return None
    try: return json.loads(text)
    except: pass
    m = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', text)
    if m:
        try: return json.loads(m.group(1))
        except: pass
    m = re.search(r'\{[\s\S]+\}', text)
    if m:
        try: return json.loads(m.group(0))
        except: pass
    return None


def resolve_band_alias(band: str) -> str:
    return BAND_ALIASES.get(band, band)


def fix_elo(data: dict) -> Optional[dict]:
    """Fix ELO to be within band range. Returns None if band invalid."""
    band = resolve_band_alias(str(data.get("difficulty_band", "")))
    if band not in ELO_BANDS:
        return None
    data["difficulty_band"] = band
    elo_min = ELO_BANDS[band]["elo_min"]
    elo_max = ELO_BANDS[band]["elo_max"]
    try:
        elo = int(data.get("elo", 0))
    except (ValueError, TypeError):
        elo = 0
    if not (elo_min <= elo <= elo_max):
        data["elo"] = (elo_min + elo_max) // 2   # auto-fix to midpoint
    return data


# ── Single question enrichment ────────────────────────────────────────────────
def enrich_question(q: dict) -> Optional[dict]:
    prompt = build_enrich_prompt(q)
    result_text = None

    # 1. Try Cerebras (fastest - WAF blocked from GH Actions but works locally)
    if CB_ROTATOR.available() > 0:
        result_text = call_with_rotator(CB_ROTATOR, call_cerebras_key, prompt)

    # 2. Fallback to Groq (also WAF blocked from GH Actions, works locally)
    if not result_text and GROQ_ROTATOR.available() > 0:
        result_text = call_with_rotator(GROQ_ROTATOR, call_groq_key, prompt)

    # 3. Fallback to Gemini (works from GH Actions)
    if not result_text and GEMINI_ROTATOR.available() > 0:
        result_text = call_with_rotator(GEMINI_ROTATOR, call_gemini_key, prompt)

    if not result_text:
        return None

    data = extract_json(result_text)
    if not data:
        return None

    # Merge, preserve original PYQ fields
    merged = {**q, **data}
    if not q.get("is_stub"):
        if q.get("question_text") and len(q["question_text"]) > 20:
            merged["question_text"] = q["question_text"]
        if q.get("options") and len(q["options"]) >= 2:
            merged["options"] = q["options"]
        if q.get("correct_answer"):
            merged["correct_answer"] = q["correct_answer"]

    merged = fix_elo(merged)
    if not merged:
        return None

    merged["source"]       = q.get("source", "AI-Generated")
    merged["source_exam"]  = q.get("source_exam", "AI-Generated")
    merged["year"]         = q.get("year")
    merged["quality_tier"] = q.get("quality_tier", "C")
    merged["confidence"]   = q.get("confidence", 0.87)
    return merged


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    if not IN_FILE.exists():
        print(f"[ERROR] {IN_FILE} not found")
        exit(1)

    lines = [l for l in IN_FILE.read_text(encoding="utf-8").splitlines() if l.strip()]
    raw_questions = [json.loads(l) for l in lines]
    print(f"[LOADED] Loaded {len(raw_questions)} raw questions")
    print(f"[TARGET] Target: {TARGET} enriched questions")

    # Workers: one per Gemini key (guaranteed from GH Actions) plus bonus for Cerebras/Groq
    gemini_cap = max(len(GEMINI_KEYS), 1)
    extra_cap  = max(len(CEREBRAS_KEYS) + len(GROQ_KEYS), 0) // 3
    max_workers = min(gemini_cap + extra_cap, max(1, len(raw_questions)), 20)
    print(f"[WORKERS] Running {max_workers} parallel workers")
    print(f"   Cerebras={len(CEREBRAS_KEYS)} keys x {len(CEREBRAS_MODELS)} models")
    print(f"   Groq={len(GROQ_KEYS)} keys x {len(GROQ_MODELS)} models")
    print(f"   Gemini={len(GEMINI_KEYS)} keys x {len(GEMINI_MODELS)} models")

    enriched = []
    skipped = 0
    start = time.time()
    write_lock = threading.Lock()

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    out_fp = OUT_FILE.open("w", encoding="utf-8")

    questions_to_process = raw_questions[:TARGET]

    def process_one(q):
        result = enrich_question(q)
        return result

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_one, q): q for q in questions_to_process}

        for future in as_completed(futures):
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
                qpm = len(enriched) / max(elapsed / 60, 0.01)
                remaining = max(0, TARGET - len(enriched))
                eta = f"{remaining/max(qpm,1):.0f}m" if qpm > 0 else "?"
                avail = f"Cer={CB_ROTATOR.available()}/{len(CB_ROTATOR)} Groq={GROQ_ROTATOR.available()}/{len(GROQ_ROTATOR)} Gem={GEMINI_ROTATOR.available()}/{len(GEMINI_ROTATOR)}"
                print(f"\r   [{len(enriched)}/{TARGET}] {qpm:.1f} q/min | skip={skipped} | ETA={eta} | {avail}   ",
                      end="", flush=True)
            else:
                with write_lock:
                    skipped += 1

    out_fp.close()

    elapsed = time.time() - start
    print(f"\n\n{'='*55}")
    print(f"ENRICHMENT COMPLETE")
    print(f"   Enriched: {len(enriched)} questions")
    print(f"   Skipped:  {skipped}")
    print(f"   Time:     {elapsed/60:.1f}m")
    print(f"   Rate:     {len(enriched)/(max(elapsed,1)/60):.1f} q/min")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()
