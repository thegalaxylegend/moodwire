import sqlite3
import json
import os
import glob
import re

def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        db_files = [f for f in files if "metadata" not in f]
    return db_files[0]

def main():
    db_path = find_db()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    import sys
    sys.path.append(os.path.abspath("scratch"))
    from05_verify_integrity = __import__("05_verify_integrity")
    check_latex_balance = from05_verify_integrity.check_latex_balance
    has_mojibake = from05_verify_integrity.has_mojibake
    has_anti_llm = from05_verify_integrity.has_anti_llm
    
    rows = cursor.execute(
        "SELECT id, question_text, options, correct_answer, explanation, solution_steps, quality_tier, exam, class, subject FROM questions;"
    ).fetchall()
    
    failures = []
    for row in rows:
        q_id, text, options_str, correct, explanation, steps_str, tier, exam, cls, subj = row
        if tier == 'D':
            continue
            
        try:
            options = json.loads(options_str)
            steps = json.loads(steps_str)
        except Exception:
            continue
            
        q_fails = []
        
        # Stem
        ok, err = check_latex_balance(text)
        if not ok: q_fails.append(("question_text", text, f"LaTeX: {err}"))
        bad, err = has_mojibake(text)
        if bad: q_fails.append(("question_text", text, f"Mojibake: {err}"))
        bad, err = has_anti_llm(text)
        if bad: q_fails.append(("question_text", text, f"Anti-LLM: {err}"))
        
        # Explanation
        ok, err = check_latex_balance(explanation)
        if not ok: q_fails.append(("explanation", explanation, f"LaTeX: {err}"))
        bad, err = has_mojibake(explanation)
        if bad: q_fails.append(("explanation", explanation, f"Mojibake: {err}"))
        bad, err = has_anti_llm(explanation)
        if bad: q_fails.append(("explanation", explanation, f"Anti-LLM: {err}"))
        
        # Options
        for idx, opt in enumerate(options):
            ok, err = check_latex_balance(opt)
            if not ok: q_fails.append((f"option_{idx}", opt, f"LaTeX: {err}"))
            bad, err = has_mojibake(opt)
            if bad: q_fails.append((f"option_{idx}", opt, f"Mojibake: {err}"))
            
        # Steps
        for idx, step in enumerate(steps):
            ok, err = check_latex_balance(step)
            if not ok: q_fails.append((f"step_{idx}", step, f"LaTeX: {err}"))
            
        if q_fails:
            failures.append({
                "id": q_id,
                "tier": tier,
                "exam": exam,
                "class": cls,
                "subject": subj,
                "failures": q_fails
            })
            
    with open("scratch/integrity_failures_list.json", "w", encoding="utf-8") as f:
        json.dump(failures, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully dumped {len(failures)} failures to scratch/integrity_failures_list.json")
    conn.close()

if __name__ == "__main__":
    main()
