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
    
    # We will import functions from 05_verify_integrity
    import sys
    sys.path.append(os.path.abspath("scratch"))
    from05_verify_integrity = __import__("05_verify_integrity")
    check_latex_balance = from05_verify_integrity.check_latex_balance
    has_mojibake = from05_verify_integrity.has_mojibake
    has_anti_llm = from05_verify_integrity.has_anti_llm
    
    rows = cursor.execute(
        "SELECT id, question_text, options, correct_answer, explanation, solution_steps, quality_tier FROM questions;"
    ).fetchall()
    
    failures = []
    for row in rows:
        q_id, text, options_str, correct, explanation, steps_str, tier = row
        if tier == 'D':
            continue
            
        try:
            options = json.loads(options_str)
            steps = json.loads(steps_str)
        except Exception:
            continue
            
        # Stem
        ok, err = check_latex_balance(text)
        if not ok: failures.append((q_id, "stem", text, f"LaTeX: {err}"))
        bad, err = has_mojibake(text)
        if bad: failures.append((q_id, "stem", text, f"Mojibake: {err}"))
        bad, err = has_anti_llm(text)
        if bad: failures.append((q_id, "stem", text, f"Anti-LLM: {err}"))
        
        # Explanation
        ok, err = check_latex_balance(explanation)
        if not ok: failures.append((q_id, "explanation", explanation, f"LaTeX: {err}"))
        bad, err = has_mojibake(explanation)
        if bad: failures.append((q_id, "explanation", explanation, f"Mojibake: {err}"))
        bad, err = has_anti_llm(explanation)
        if bad: failures.append((q_id, "explanation", explanation, f"Anti-LLM: {err}"))
        
        # Options
        for idx, opt in enumerate(options):
            ok, err = check_latex_balance(opt)
            if not ok: failures.append((q_id, f"option {idx+1}", opt, f"LaTeX: {err}"))
            bad, err = has_mojibake(opt)
            if bad: failures.append((q_id, f"option {idx+1}", opt, f"Mojibake: {err}"))
            
        # Steps
        for idx, step in enumerate(steps):
            ok, err = check_latex_balance(step)
            if not ok: failures.append((q_id, f"step {idx+1}", step, f"LaTeX: {err}"))
            
    print(f"Total failures to inspect: {len(failures)}")
    for f in failures[:30]:
        print("\n" + "-"*50)
        print(f"ID: {f[0]} | Field: {f[1]} | Error: {f[3]}")
        print(f"Content: {f[2]}")
        
    conn.close()

if __name__ == "__main__":
    main()
