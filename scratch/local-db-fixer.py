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

def clean_option(opt):
    if not isinstance(opt, str):
        return opt
    opt = opt.strip()
    # Match "A. A) text" or "A. A. text" or "A) A) text"
    match = re.match(r'^([A-D])\s*[\.\)]\s*([A-D]\s*[\.\)])?\s*(.+)$', opt, re.IGNORECASE)
    if match:
        return match.group(3).strip()
    # Match simpler "A. text" or "A) text"
    match2 = re.match(r'^([A-D])\s*[\.\)]\s*(.+)$', opt, re.IGNORECASE)
    if match2:
        return match2.group(2).strip()
    return opt

def strip_leaked_answers(text):
    if not text:
        return text
    # Strip patterns like "[Answer: D]", "Answer: D", "\text{[Answer: D]}"
    text = re.sub(r'\s*\[Answer:\s*[A-D]\]\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\[Answer:\s*.*\]\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*Answer:\s*[A-D]\s*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*\\text\{\[Answer:\s*[A-D]\]\}\s*', '', text, flags=re.IGNORECASE)
    return text.strip()

def fix_latex_escapes(text):
    if not text:
        return text
    # Replace control characters with literal LaTeX backslash escapes
    text = text.replace('\u0009', '\\t') # tab -> \t (e.g. \times)
    text = text.replace('\u000c', '\\f') # form feed -> \f (e.g. \frac)
    text = text.replace('\u0008', '\\b') # backspace -> \b (e.g. \beta)
    text = text.replace('\u0007', '\\a') # bell -> \a (e.g. \alpha)
    text = text.replace('\u000b', '\\v') # vertical tab -> \v (e.g. \vec)
    return text

def is_placeholder_explanation(exp):
    if not exp:
        return True
    lower_exp = exp.lower()
    placeholders = [
        "step 1: recall the formula",
        "step 2: use the given values",
        "conclude that the correct answer is",
        "step 1: identify the key concept",
        "conclude that the correct option is",
        "step 1: recall the definition",
        "step 2: substitute the values",
        "step 2: substitute the given values"
    ]
    for p in placeholders:
        if p in lower_exp:
            return True
    return False

def main():
    db_path = find_db()
    print(f"Connecting to DB: {db_path}")
    conn = sqlite3.connect(db_path)
    # Enable WAL mode for safety and concurrency compatibility
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    
    # Get all questions
    questions = cursor.execute("SELECT id, exam, type, question_text, options, correct_answer, explanation, quality_tier, verified FROM questions;").fetchall()
    print(f"Loaded {len(questions)} questions from local database.")
    
    metrics = {
        "fixed_latex": 0,
        "fixed_options": 0,
        "fixed_leaks": 0,
        "quarantined_placeholders": 0,
        "quarantined_mismatches": 0,
        "deleted": 0,
        "updated": 0
    }
    
    for idx, row in enumerate(questions):
        q_id, exam, q_type, text, options_json, correct, explanation, tier, verified = row
        
        updated_row = False
        new_text = text
        new_options_json = options_json
        new_correct = correct
        new_explanation = explanation
        new_tier = tier
        new_verified = verified
        
        # 1. LaTeX Escape Fixes
        fixed_text = fix_latex_escapes(text)
        fixed_explanation = fix_latex_escapes(explanation)
        fixed_correct = fix_latex_escapes(correct)
        fixed_options_json = fix_latex_escapes(options_json)
        
        if (fixed_text != text or fixed_explanation != explanation or 
            fixed_correct != correct or fixed_options_json != options_json):
            new_text = fixed_text
            new_explanation = fixed_explanation
            new_correct = fixed_correct
            new_options_json = fixed_options_json
            metrics["fixed_latex"] += 1
            updated_row = True
            
        # 2. Leaked Answer Stripping
        stripped_text = strip_leaked_answers(new_text)
        if stripped_text != new_text:
            new_text = stripped_text
            metrics["fixed_leaks"] += 1
            updated_row = True
            
        # 3. Clean options array & letter matching
        is_mcq = q_type in ['MCQ', 'Multi-correct']
        options_list = []
        try:
            options_list = json.loads(new_options_json)
        except:
            pass
            
        if is_mcq and isinstance(options_list, list) and len(options_list) > 0:
            cleaned_options = [clean_option(opt) for opt in options_list]
            if cleaned_options != options_list:
                new_options_json = json.dumps(cleaned_options, ensure_ascii=False)
                metrics["fixed_options"] += 1
                updated_row = True
                options_list = cleaned_options
                
            # If MCQ, verify correct_answer matches options
            # If correct_answer is a letter (A, B, C, D) and NOT in the options, map it to the corresponding option text!
            letter_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            clean_correct = new_correct.strip()
            
            if clean_correct in letter_map:
                opt_idx = letter_map[clean_correct]
                if opt_idx < len(options_list):
                    new_correct = options_list[opt_idx]
                    metrics["updated"] += 1
                    updated_row = True
            else:
                # If correct_answer is not in options, try matching with cleaned version or letter fallback
                if clean_correct not in options_list:
                    # Check if there is an option that matches closely or if correct_answer was double lettered
                    cleaned_correct = clean_option(clean_correct)
                    if cleaned_correct in options_list:
                        new_correct = cleaned_correct
                        updated_row = True
                    else:
                        # Quarantine the question
                        if new_tier != 'D':
                            new_tier = 'D'
                            new_verified = -1 # Flagged as bad data
                            metrics["quarantined_mismatches"] += 1
                            updated_row = True
                            
        # 4. Placeholder Explanations Filtering
        if is_placeholder_explanation(new_explanation):
            if new_tier != 'D':
                new_tier = 'D'
                new_verified = -1 # Flagged as bad data
                metrics["quarantined_placeholders"] += 1
                updated_row = True
                
        # Commit updates if modified
        if updated_row:
            cursor.execute(
                "UPDATE questions SET question_text = ?, options = ?, correct_answer = ?, explanation = ?, quality_tier = ?, verified = ? WHERE id = ?;",
                (new_text, new_options_json, new_correct, new_explanation, new_tier, new_verified, q_id)
            )
            metrics["updated"] += 1
            
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("DATABASE AUDIT & CLEANING COMPLETE!")
    print("="*50)
    print(f"Questions processed:             {len(questions)}")
    print(f"Questions fixed (LaTeX escapes): {metrics['fixed_latex']}")
    print(f"Questions fixed (leaked answers):{metrics['fixed_leaks']}")
    print(f"Questions fixed (double options):{metrics['fixed_options']}")
    print(f"Quarantined (placeholder explanations): {metrics['quarantined_placeholders']}")
    print(f"Quarantined (answer/option mismatches): {metrics['quarantined_mismatches']}")
    print(f"Total database updates made:     {metrics['updated']}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
