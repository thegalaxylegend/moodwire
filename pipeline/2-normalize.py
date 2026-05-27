#!/usr/bin/env python3
"""
Step 2: Normalize all raw question formats into unified schema.
Handles PYQ JSON, stub entries, and various source formats.
"""

import json, os, re
from pathlib import Path

IN_FILE  = Path("pipeline/output/raw_questions.jsonl")
OUT_FILE = Path("pipeline/output/raw_questions.jsonl")  # overwrite in-place after normalize

TARGET = int(os.environ.get("TARGET", "10000"))

VALID_SUBJECTS = {"Physics", "Chemistry", "Mathematics", "Biology", "Science", "Social Science", "Social"}
VALID_EXAMS    = {"Board", "JEEMains", "JEEAdvanced", "NEET"}
VALID_CLASSES  = {"8", "9", "10", "11", "12"}

def normalize_subject(s: str) -> str:
    s = str(s).strip().title()
    mapping = {
        "Maths": "Mathematics", "Math": "Mathematics",
        "Phy": "Physics", "Chem": "Chemistry",
        "Bio": "Biology", "Sc": "Science",
        "Social Science": "Social", "Sst": "Social",
    }
    return mapping.get(s, s if s in VALID_SUBJECTS else "Science")

def normalize_exam(e: str, cls: str) -> str:
    e = str(e).strip()
    mapping = {
        "JEE": "JEEMains", "JEE Main": "JEEMains", "JEE Mains": "JEEMains",
        "JEE Advanced": "JEEAdvanced", "JEE Adv": "JEEAdvanced",
        "NEET UG": "NEET", "NEET PG": "NEET",
        "CBSE": "Board", "Board": "Board",
    }
    result = mapping.get(e, e if e in VALID_EXAMS else None)
    if not result:
        # Infer from class
        if cls in ["8", "9", "10"]:
            return "Board"
        return "JEEMains"
    return result

def normalize_class(c) -> str:
    c = str(c).strip().replace("Class ", "").replace("class ", "")
    return c if c in VALID_CLASSES else "12"

def normalize_options(opts) -> list:
    if not opts: return []
    if isinstance(opts, dict):
        return [str(v) for v in opts.values()][:4]
    if isinstance(opts, (list, tuple)):
        return [str(o).strip() for o in opts if str(o).strip()][:4]
    return []

def normalize_correct(correct, opts: list, qtype: str = "MCQ") -> str:
    correct = str(correct).strip()
    if not correct: return opts[0] if opts else ""

    # Letter answer A/B/C/D
    if len(correct) == 1 and correct.upper() in "ABCD" and opts:
        idx = "ABCD".index(correct.upper())
        if idx < len(opts):
            return opts[idx]

    # Numeric index
    try:
        idx = int(correct)
        if 0 <= idx < len(opts):
            return opts[idx]
        if 1 <= idx <= len(opts):
            return opts[idx - 1]
    except ValueError:
        pass

    return correct

def main():
    if not IN_FILE.exists():
        print(f"❌ {IN_FILE} not found")
        exit(1)

    lines = [l for l in IN_FILE.read_text(encoding="utf-8").splitlines() if l.strip()]
    raw = [json.loads(l) for l in lines]
    print(f"🔄 Normalizing {len(raw)} raw questions...")

    normalized = []
    for q in raw:
        try:
            cls   = normalize_class(q.get("class", "12"))
            exam  = normalize_exam(q.get("exam", ""), cls)
            subj  = normalize_subject(q.get("subject", "Science"))
            opts  = normalize_options(q.get("options", []))
            qtype = "MCQ" if opts else ("Integer" if q.get("type") == "Integer" else "MCQ")
            correct = normalize_correct(q.get("correct_answer", ""), opts, qtype)

            # Skip clearly broken entries
            if not q.get("is_stub"):
                if not q.get("question_text") or len(str(q.get("question_text","")).strip()) < 8:
                    continue
                if qtype == "MCQ" and len(opts) < 2:
                    continue

            n = {
                "_hash":          q.get("_hash", ""),
                "source":         q.get("source", "Unknown"),
                "source_exam":    q.get("source_exam", exam),
                "year":           q.get("year"),
                "class":          cls,
                "exam":           exam,
                "subject":        subj,
                "question_text":  str(q.get("question_text", "")).strip(),
                "type":           qtype,
                "options":        opts,
                "correct_answer": correct,
                "topic_hint":     str(q.get("topic_hint", q.get("subtopic_hint", ""))).strip(),
                "subtopic_hint":  str(q.get("subtopic_hint", "")).strip(),
                "raw_band_hint":  q.get("raw_band_hint", "medium"),
                "needs_enrichment": True,
                "quality_tier":   q.get("quality_tier", "C"),
                "confidence":     float(q.get("confidence", 0.87)),
                "is_stub":        bool(q.get("is_stub", False)),
            }
            normalized.append(n)
        except Exception as e:
            continue

    OUT_FILE.write_text(
        "\n".join(json.dumps(q, ensure_ascii=False) for q in normalized),
        encoding="utf-8"
    )

    print(f"✅ Normalized: {len(normalized)} / {len(raw)} questions")
    print(f"   Stubs (class 8-10): {sum(1 for q in normalized if q.get('is_stub'))}")
    print(f"   PYQ (class 11-12): {sum(1 for q in normalized if not q.get('is_stub'))}")

if __name__ == "__main__":
    main()
