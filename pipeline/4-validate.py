#!/usr/bin/env python3
"""
Step 4: Validate every question. HARD validation - drop anything wrong.
ELO validation is the strictest: elo MUST be within [elo_min, elo_max] of its band.
"""

import json, hashlib, sys
from pathlib import Path

ELO_BANDS = json.loads(Path("pipeline/elo_bands.json").read_text())["bands"]
CLASS_CONSTRAINTS = json.loads(Path("pipeline/elo_bands.json").read_text())["class_constraints"]
EXAM_CONSTRAINTS  = json.loads(Path("pipeline/elo_bands.json").read_text())["exam_constraints"]
ALIASES           = json.loads(Path("pipeline/elo_bands.json").read_text())["aliases"]

IN_FILE  = Path("pipeline/output/enriched_questions.jsonl")
OUT_FILE = Path("pipeline/output/validated_questions.jsonl")
REPORT   = Path("pipeline/output/validation_report.json")

def resolve_band(band: str) -> str:
    return ALIASES.get(band, band)

def validate(q: dict, seen_hashes: set) -> tuple[bool, list[str]]:
    errors = []

    # 1. Required fields
    for f in ["question_text", "correct_answer", "explanation", "class", "exam",
              "subject", "difficulty_band", "elo", "type"]:
        if not q.get(f) and q.get(f) != 0:
            errors.append(f"MISSING_FIELD:{f}")

    if errors:
        return False, errors

    # 2. Resolve band alias
    band = resolve_band(str(q.get("difficulty_band", "")))
    if band not in ELO_BANDS:
        errors.append(f"INVALID_BAND:{q.get('difficulty_band')}")
        return False, errors
    q["difficulty_band"] = band  # normalize alias

    # 3. ELO range check - HARD rule
    elo = int(q.get("elo", 0))
    elo_min = ELO_BANDS[band]["elo_min"]
    elo_max = ELO_BANDS[band]["elo_max"]
    if not (elo_min <= elo <= elo_max):
        errors.append(f"ELO_OUT_OF_RANGE:band={band} elo={elo} expected=[{elo_min},{elo_max}]")
        return False, errors

    # 4. Class constraints - HARD rule
    cls = str(q.get("class", "")).replace("Class ", "").strip()
    allowed_bands_for_class = CLASS_CONSTRAINTS.get(cls, [])
    if allowed_bands_for_class and band not in allowed_bands_for_class:
        errors.append(f"CLASS_BAND_MISMATCH:class={cls} band={band} allowed={allowed_bands_for_class}")
        return False, errors
    q["class"] = cls  # normalize

    # 5. Exam constraints - HARD rule
    exam = str(q.get("exam", ""))
    allowed_bands_for_exam = EXAM_CONSTRAINTS.get(exam, [])
    if allowed_bands_for_exam and band not in allowed_bands_for_exam:
        errors.append(f"EXAM_BAND_MISMATCH:exam={exam} band={band} allowed={allowed_bands_for_exam}")
        return False, errors

    # 6. Question text length
    if len(str(q.get("question_text", "")).strip()) < 15:
        errors.append("QUESTION_TOO_SHORT")
        return False, errors

    # 7. Type validation
    qtype = str(q.get("type", "MCQ"))
    if qtype not in ["MCQ", "Multi-correct", "Integer"]:
        q["type"] = "MCQ"

    # 8. Options validation
    options = q.get("options", [])
    if qtype in ["MCQ", "Multi-correct"]:
        if not isinstance(options, list) or len(options) < 2:
            errors.append(f"INSUFFICIENT_OPTIONS:count={len(options) if isinstance(options, list) else 0}")
            return False, errors
        # Ensure exactly 4 options for MCQ
        if qtype == "MCQ" and len(options) < 4:
            errors.append(f"MCQ_NEEDS_4_OPTIONS:got={len(options)}")
            return False, errors

    # 9. Correct answer in options (MCQ)
    correct = str(q.get("correct_answer", ""))
    if qtype == "MCQ" and options:
        if correct not in options:
            # Try to fix letter answer (A/B/C/D)
            if len(correct) == 1 and correct.upper() in "ABCD":
                idx = "ABCD".index(correct.upper())
                if idx < len(options):
                    q["correct_answer"] = options[idx]
                    correct = options[idx]
                else:
                    errors.append("CORRECT_NOT_IN_OPTIONS")
                    return False, errors
            else:
                # Try fuzzy match
                clean = correct.lower().replace(" ", "")
                found = next((o for o in options if o.lower().replace(" ", "") == clean), None)
                if found:
                    q["correct_answer"] = found
                else:
                    errors.append("CORRECT_NOT_IN_OPTIONS")
                    return False, errors

    # 10. Integer type: must be numeric
    if qtype == "Integer":
        try:
            float(correct)
        except (ValueError, TypeError):
            errors.append(f"INTEGER_NOT_NUMERIC:{correct}")
            return False, errors

    # 11. Explanation
    if len(str(q.get("explanation", "")).strip()) < 10:
        errors.append("EXPLANATION_TOO_SHORT")
        return False, errors

    # 11b. LaTeX Parity Check
    import re
    q_text = str(q.get("question_text", ""))
    expl_text = str(q.get("explanation", ""))
    q_double_dollar = q_text.count("$$")
    expl_double_dollar = expl_text.count("$$")
    if (q_double_dollar + expl_double_dollar) % 2 != 0:
        errors.append("UNCLOSED_LATEX_BLOCK")
        return False, errors

    # 11c. Placeholder / Garbage Check
    q_lower = q_text.lower()
    for bad in ["placeholder", "lorem ipsum", "todo", "insert question", "[question]", "xxx", "tbd"]:
        if bad in q_lower:
            errors.append(f"GARBAGE_TEXT_FOUND:{bad}")
            return False, errors

    # 11d. MCQ Duplicate / Placeholder Options Check
    if qtype == "MCQ" and options:
        # Check duplicate options
        norm_opts = [str(o).lower().strip() for o in options]
        if len(set(norm_opts)) < len(options):
            errors.append("DUPLICATE_OPTIONS")
            return False, errors
        # Check placeholder options
        for opt in options:
            o = str(opt).strip()
            if re.match(r'^[A-Da-d]$', o) or re.match(r'(?i)^option [abcd]$', o):
                errors.append(f"PLACEHOLDER_OPTION:{o}")
                return False, errors

    # 12. Dedup hash
    text = str(q.get("question_text", "")).strip()
    h = hashlib.sha256(f"{text[:200]}|{correct}".encode()).hexdigest()[:16]
    if h in seen_hashes:
        errors.append("DUPLICATE")
        return False, errors
    seen_hashes.add(h)
    q["id"] = h

    return True, []

def main():
    if not IN_FILE.exists():
        print(f"[ERROR] Input file not found: {IN_FILE}")
        sys.exit(1)

    lines = [l for l in IN_FILE.read_text(encoding="utf-8").splitlines() if l.strip()]
    print(f"[CHECK] Validating {len(lines)} questions...")

    seen_hashes: set = set()
    valid, dropped = [], []
    error_counts: dict = {}

    for i, line in enumerate(lines):
        try:
            q = json.loads(line)
        except Exception:
            dropped.append({"line": i, "errors": ["JSON_PARSE_ERROR"]})
            continue

        ok, errors = validate(q, seen_hashes)
        if ok:
            valid.append(q)
        else:
            dropped.append({"id": q.get("id", f"line_{i}"), "errors": errors,
                           "text_preview": str(q.get("question_text", ""))[:80]})
            for e in errors:
                key = e.split(":")[0]
                error_counts[key] = error_counts.get(key, 0) + 1

    # Write valid questions
    OUT_FILE.write_text(
        "\n".join(json.dumps(q, ensure_ascii=False) for q in valid),
        encoding="utf-8"
    )

    # Write report
    report = {
        "total_input": len(lines),
        "valid": len(valid),
        "dropped": len(dropped),
        "pass_rate": f"{len(valid)/max(1,len(lines))*100:.1f}%",
        "error_breakdown": error_counts,
        "dropped_samples": dropped[:20],
    }
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"\n{'='*50}")
    print(f"[OK] VALIDATION COMPLETE")
    print(f"   Valid:   {len(valid)}")
    print(f"   Dropped: {len(dropped)} ({report['pass_rate']} pass rate)")
    print(f"\n   Error breakdown:")
    for err, cnt in sorted(error_counts.items(), key=lambda x: -x[1]):
        print(f"     {err}: {cnt}")
    print(f"{'='*50}")

    if len(valid) == 0:
        print("[ERROR] FATAL: Zero valid questions after validation!")
        sys.exit(1)

if __name__ == "__main__":
    main()
