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
    if not db_files:
        raise FileNotFoundError("Could not locate local SQLite D1 file.")
    db_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    return db_files[0]

def check_latex_balance(text):
    if not text:
        return True, ""
    # Count unescaped $ signs
    # An unescaped $ is one not preceded by an odd number of backslashes
    dollar_indices = []
    i = 0
    while i < len(text):
        if text[i] == '$':
            # Check how many backslashes precede it
            bs_count = 0
            j = i - 1
            while j >= 0 and text[j] == '\\':
                bs_count += 1
                j -= 1
            if bs_count % 2 == 0:
                dollar_indices.append(i)
        i += 1
        
    if len(dollar_indices) % 2 != 0:
        return False, f"Unbalanced inline math delimiters ($): found {len(dollar_indices)} unescaped '$'"
        
    # Check brace balancing in math blocks
    # We locate text sections between pairs of '$' or '$$'
    # For simplicity, let's check brace balancing overall, but especially in math blocks
    # Wait, overall brace check can sometimes trigger on JSON or standard text, so let's only check inside math blocks
    math_blocks = []
    # If double $$ exists, let's split by them first
    # Or we can just inspect sections between the dollar indices
    for k in range(0, len(dollar_indices) - 1, 2):
        start = dollar_indices[k] + 1
        end = dollar_indices[k+1]
        math_blocks.append(text[start:end])
        
    for idx, block in enumerate(math_blocks):
        # Count { and }
        open_braces = block.count('{')
        close_braces = block.count('}')
        if open_braces != close_braces:
            return False, f"Unbalanced curly braces in math block {idx+1}: '{block}' ({{: {open_braces}, }}: {close_braces})"
            
    return True, ""

def has_mojibake(text):
    if not text:
        return False, ""
    # Look for common cp1252 / double utf-8 mojibake markers
    suspicious_patterns = [
        r'â€”', r'â†’', r'â‚‚', r'âº', r'âˆ’', r'â€²', r'ï¿½',
        r'â[ˆ€†™œˆ˜¢â]', r'Â[°±²³´µ¶·]', r'Ã[‚ƒ„…†‡ˆ‰Š‹Œ]', r'Î[‘“”…‡‰‹Œ]',
        r'Â½', r'Â¼', r'Â¾'
    ]
    for pattern in suspicious_patterns:
        if re.search(pattern, text):
            return True, f"Detected mojibake pattern matching regex '{pattern}'"
            
    # Generally look for weird characters like â, Î, Ã followed by punctuation or control chars
    # that usually don't appear in clean technical English/LaTeX text.
    return False, ""

def has_anti_llm(text):
    if not text:
        return False, ""
    anti_llm_phrases = [
        r'\bas an ai\b',
        r'\bmy knowledge cutoff\b',
        r'\baccepted answer\b',
        r'\bassume a typo\b',
        r'\btypo in the question\b',
        r'\bquestion seems to have a typo\b',
        r'\boptions are incorrect\b',
        r'\bnone of the options match\b',
        r'\binvalid option\b',
        r'\bcorrect option should be\b',
        r'\btechnically correct\b',
        r'\baccepted solution\b',
        r'\bassume that the question\b',
        r'\btypo in options\b'
    ]
    for pattern in anti_llm_phrases:
        if re.search(pattern, text, re.IGNORECASE):
            return True, f"Detected anti-LLM phrase matching regex '{pattern}'"
    return False, ""

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    rows = cursor.execute(
        "SELECT id, exam, class, subject, primary_topic_id, question_text, options, correct_answer, explanation, solution_steps, type, quality_tier FROM questions;"
    ).fetchall()
    
    print(f"Loaded {len(rows)} questions for strict integrity verification.")
    
    failures = []
    duplicate_stems = {}
    
    for row in rows:
        q_id, exam, class_val, subject, topic_id, text, options_str, correct, explanation, steps_str, q_type, tier = row
        
        # We only strictly assert on active, non-quarantined tiers (S, A, B, C)
        # Quarantine Tier D is excluded from strict validation checks
        is_active = (tier != 'D')
        
        # 1. Stem uniqueness tracker
        duplicate_stems.setdefault(text, []).append(q_id)
        
        # 2. Check JSON validity of options and solution steps
        if is_active:
            # Check options JSON
            try:
                options = json.loads(options_str)
                if not isinstance(options, list):
                    failures.append((q_id, tier, "Options is not a valid JSON list"))
                    continue
            except Exception:
                failures.append((q_id, tier, "Options is not valid JSON"))
                continue
                
            # Check solution steps JSON
            try:
                steps = json.loads(steps_str)
                if not isinstance(steps, list):
                    failures.append((q_id, tier, "Solution steps is not a valid JSON list"))
                    continue
            except Exception:
                failures.append((q_id, tier, "Solution steps is not valid JSON"))
                continue
                
            # Check correct_answer exists in options for MCQ
            if q_type == 'MCQ' and options:
                if correct not in options:
                    # Let's see if correct_answer corresponds to option index, or option value
                    failures.append((q_id, tier, f"MCQ correct_answer '{correct}' not found in options: {options}"))
            
            # 3. Check LaTeX Balance
            # Stem
            ok, err = check_latex_balance(text)
            if not ok:
                failures.append((q_id, tier, f"LaTeX error in stem: {err}"))
            # Explanation
            ok, err = check_latex_balance(explanation)
            if not ok:
                failures.append((q_id, tier, f"LaTeX error in explanation: {err}"))
            # Options
            for idx, opt in enumerate(options):
                ok, err = check_latex_balance(opt)
                if not ok:
                    failures.append((q_id, tier, f"LaTeX error in option {idx+1}: {err}"))
            # Steps
            for idx, step in enumerate(steps):
                ok, err = check_latex_balance(step)
                if not ok:
                    failures.append((q_id, tier, f"LaTeX error in solution step {idx+1}: {err}"))
                    
            # 4. Check Mojibake residues
            # Stem
            bad, err = has_mojibake(text)
            if bad:
                failures.append((q_id, tier, f"Mojibake residue in stem: {err}"))
            # Explanation
            bad, err = has_mojibake(explanation)
            if bad:
                failures.append((q_id, tier, f"Mojibake residue in explanation: {err}"))
            # Options
            for idx, opt in enumerate(options):
                bad, err = has_mojibake(opt)
                if bad:
                    failures.append((q_id, tier, f"Mojibake residue in option {idx+1}: {err}"))
                    
            # 5. Check Anti-LLM filters
            # Stem
            bad, err = has_anti_llm(text)
            if bad:
                failures.append((q_id, tier, f"Anti-LLM phrase in stem: {err}"))
            # Explanation
            bad, err = has_anti_llm(explanation)
            if bad:
                failures.append((q_id, tier, f"Anti-LLM phrase in explanation: {err}"))
                
    # Count duplicate stems
    dups_count = sum(len(ids) - 1 for ids in duplicate_stems.values() if len(ids) > 1)
    
    # Compile report
    report_lines = [
        "# 🛡️ ExamCompass Database Integrity Verification Report",
        "",
        f"Database Audit Path: `{db_path}`",
        f"Total Questions Evaluated: **{len(rows)}**",
        "",
        "## 🚦 Strict Validation Gates Summary",
        "",
        "| Gate | Status | Details |",
        "| :--- | :--- | :--- |",
    ]
    
    # 1. LaTeX gate
    latex_fails = [f for f in failures if "LaTeX" in f[2]]
    latex_status = "🔴 FAIL" if latex_fails else "🟢 PASS"
    report_lines.append(f"| **LaTeX Math Delimiters & Braces** | {latex_status} | {len(latex_fails)} issues found |")
    
    # 2. Mojibake gate
    moji_fails = [f for f in failures if "Mojibake" in f[2]]
    moji_status = "🔴 FAIL" if moji_fails else "🟢 PASS"
    report_lines.append(f"| **Double Encoding & Mojibake Residues** | {moji_status} | {len(moji_fails)} issues found |")
    
    # 3. Anti-LLM gate
    llm_fails = [f for f in failures if "Anti-LLM" in f[2]]
    llm_status = "🔴 FAIL" if llm_fails else "🟢 PASS"
    report_lines.append(f"| **Robotic AI Phrases & Filters** | {llm_status} | {len(llm_fails)} issues found |")
    
    # 4. JSON & Format gate
    json_fails = [f for f in failures if "JSON" in f[2] or "MCQ correct_answer" in f[2]]
    json_status = "🔴 FAIL" if json_fails else "🟢 PASS"
    report_lines.append(f"| **JSON Schema & Option Relational Checks** | {json_status} | {len(json_fails)} issues found |")
    
    # 5. Duplicate Stems gate
    dup_status = "🟡 WARNING" if dups_count > 0 else "🟢 PASS"
    report_lines.append(f"| **Duplicate Question Stems** | {dup_status} | {dups_count} near-duplicates found |")
    
    report_lines.extend([
        "",
        "## 🚨 Detailed Failure Log",
        ""
    ])
    
    if not failures:
        report_lines.append("*Hurray! Zero structural, mathematical, or encoding errors were found in active tiers!* \n")
    else:
        report_lines.extend([
            f"Found **{len(failures)}** integrity issues in active tiers. Please inspect the list below:",
            "",
            "| Question ID | Tier | Failure Reason |",
            "| :--- | :---: | :--- |"
        ])
        for fail in failures[:100]: # limit to first 100 for readability
            report_lines.append(f"| `{fail[0]}` | `{fail[1]}` | {fail[2]} |")
            
        if len(failures) > 100:
            report_lines.append(f"\n*...and {len(failures) - 100} more issues.*")
            
    # Add duplicate stems detailed warning
    if dups_count > 0:
        report_lines.extend([
            "",
            "## 👥 Duplicate Question Stems Detail",
            "",
            "The following stems have multiple question entries in the database:",
            "",
            "| Stem Snippet | Duplicate Count | Associated IDs |",
            "| :--- | :---: | :--- |"
        ])
        dup_stems_sorted = sorted([(stem, ids) for stem, ids in duplicate_stems.items() if len(ids) > 1], key=lambda x: len(x[1]), reverse=True)
        for stem, ids in dup_stems_sorted[:20]: # top 20
            snippet = stem[:60].replace("\n", " ") + "..."
            report_lines.append(f"| {snippet} | **{len(ids)}** | {', '.join(f'`{id_val}`' for id_val in ids)} |")
            
    conn.close()
    
    out_path = os.path.join("scratch", "integrity_verification_report.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print("\n" + "="*50)
    print("PHASE 5: DATABASE INTEGRITY VERIFICATION GATES RUN COMPLETE!")
    print("="*50)
    print(f"Total Integrity Failures Found: {len(failures)}")
    print(f"Total Duplicate Stems Found:    {dups_count}")
    print(f"Detailed Markdown report saved:  {out_path}")
    print("="*50 + "\n")
    
    # If there are hard fails in LaTeX or Mojibake or JSON, we print them out
    if failures:
        print("SAMPLE FAILURES:")
        for fail in failures[:10]:
            print(f"- ID: {fail[0]} | Tier: {fail[1]} | Error: {fail[2]}")

if __name__ == "__main__":
    main()
