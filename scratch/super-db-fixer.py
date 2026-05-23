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
    val = opt.strip()
    # Loop up to 2 times to clean nested prefixes (e.g., "(A) A. Option text")
    for _ in range(2):
        # Match prefixes that end with a parenthesis, dot, or bracket
        # e.g., "(A)", "[B]", "C.", "D)"
        # We explicitly exclude bare letters followed only by whitespace to avoid matching "A + B"
        match = re.match(r'^\s*(?:[\(\[]\s*[A-D]\s*[\)\]\.]|[\(\[]?\s*[A-D]\s*[\)\.])\s*', val, re.IGNORECASE)
        if match:
            val = val[match.end():].strip()
        else:
            break
    if val:
        return val
    return opt

def strip_leaked_answers(text):
    if not text:
        return text
    
    # Common leaked answer patterns
    patterns = [
        r'\s*\[\s*Answer\s*:\s*[A-D]\s*\]\s*',
        r'\s*\\text\{\s*\[\s*Answer\s*:\s*[A-D]\s*\]\s*\}\s*',
        r'\s*\\text\{\s*Answer\s*:\s*[A-D]\s*\}\s*',
        r'\s*Answer\s*:\s*[A-D]\s*$',
        r'\s*Correct\s*Option\s*:\s*[A-D]\s*$',
        r'\s*Correct\s*Answer\s*:\s*[A-D]\s*$',
        r'\s*Option\s*:\s*[A-D]\s*$',
        r'\s*\[\s*[A-D]\s*\]\s*$',
    ]
    
    for pat in patterns:
        text = re.sub(pat, '', text, flags=re.IGNORECASE)
        
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

def semantic_normalize(text):
    if not isinstance(text, str):
        return ""
    t = text.strip()
    
    # Strip full math wrapper blocks: $...$, \(...\), \[...\]
    if t.startswith('$') and t.endswith('$') and len(t) > 1:
        t = t[1:-1].strip()
    elif t.startswith(r'\(') and t.endswith(r'\)') and len(t) > 4:
        t = t[2:-2].strip()
    elif t.startswith(r'\[') and t.endswith(r'\]') and len(t) > 4:
        t = t[2:-2].strip()
        
    t = t.lower()
    t = re.sub(r'\s+', ' ', t)
    
    # Clean surrounding punctuation, preserving internal decimals and letters
    t = re.sub(r'^[.,;!?"\'\(\)]+|[.,;!?"\'\(\)]+$', '', t)
    return t.strip()

def parse_multicorrect_letters(text):
    if not text:
        return None
    text = text.strip()
    
    # 1. Try parsing as JSON first
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(x).strip().upper() for x in parsed]
    except Exception:
        pass
    
    # 2. Strict text-based extraction: detect if it is a list of letters (e.g. "A, C" or "A and C")
    normalized = re.sub(r'\b(and)\b', ',', text, flags=re.IGNORECASE)
    normalized = re.sub(r'[\s\[\]\(\)]', '', normalized)
    
    if re.match(r'^[A-D](,[A-D])*$', normalized, re.IGNORECASE):
        return [char.upper() for char in normalized.split(',')]
        
    # Also support raw character letters e.g. "AC" or "BD" if exactly A-D characters and nothing else
    if re.match(r'^[A-D]{1,4}$', text.upper().strip()):
        return list(text.upper().strip())
        
    return None

def fix_correct_answer(q_type, correct, options_list):
    if not correct:
        return correct
        
    correct = correct.strip()
    
    # MCQ
    if q_type == 'MCQ':
        # If it is a letter A-D
        letter_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        if correct.upper() in letter_map:
            idx = letter_map[correct.upper()]
            if options_list and idx < len(options_list):
                return options_list[idx]
        
        # If it matches an option text exactly
        if options_list and correct in options_list:
            return correct
            
        # Try semantic-safe normalization match (preserves decimals/symbols)
        if options_list:
            norm_correct = semantic_normalize(correct)
            for opt in options_list:
                if norm_correct == semantic_normalize(opt):
                    return opt
                    
            # Try comparing normalized versions after prefix stripping
            for opt in options_list:
                if semantic_normalize(clean_option(opt)) == semantic_normalize(clean_option(correct)):
                    return opt
                
    # Multi-correct
    elif q_type == 'Multi-correct':
        parsed_letters = parse_multicorrect_letters(correct)
        if parsed_letters:
            letter_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
            mapped_opts = []
            for val in parsed_letters:
                val_str = str(val).strip().upper()
                if val_str in letter_map:
                    idx = letter_map[val_str]
                    if options_list and idx < len(options_list):
                        mapped_opts.append(options_list[idx])
                    else:
                        mapped_opts.append(val)
                else:
                    mapped_opts.append(val)
            return json.dumps(mapped_opts, ensure_ascii=False)
            
        try:
            parsed = json.loads(correct)
            if isinstance(parsed, list):
                if options_list:
                    # Check if they match option texts
                    all_in_options = all(opt in options_list for opt in parsed)
                    if all_in_options:
                        return correct
        except Exception:
            pass
                 
    # Integer
    elif q_type == 'Integer':
        try:
            val = float(correct)
            if val.is_integer():
                return str(int(val))
            return str(val)
        except ValueError:
            pass
            
        # Match number
        match = re.search(r'(-?\d+(\.\d+)?)', correct)
        if match:
            num_str = match.group(1)
            try:
                val = float(num_str)
                if val.is_integer():
                    return str(int(val))
                return str(val)
            except ValueError:
                pass
                
    return correct

def is_low_quality_explanation(explanation, question_text):
    if not explanation or not isinstance(explanation, str):
        return True
    
    exp = explanation.strip()
    words = exp.split()
    
    # 1. Length check: very short explanations are useless
    if len(words) < 5:
        return True
        
    # 2. Known templated low-quality patterns
    lower_exp = exp.lower()
    placeholders = [
        "step 1: recall the formula",
        "step 2: use the given values",
        "conclude that the correct answer is",
        "step 1: identify the key concept",
        "conclude that the correct option is",
        "step 1: recall the definition",
        "step 2: substitute the values",
        "step 2: substitute the given values",
        "first identify the concept",
        "then apply the equation",
        "finally compute the result",
        "hence the correct option is",
        "therefore, correct option is",
        "conclude that correct",
        "by solving this we get",
        "by solving we get"
    ]
    matched_placeholders = 0
    for p in placeholders:
        if p in lower_exp:
            matched_placeholders += 1
            
    if len(words) < 25 and matched_placeholders >= 2:
        return True
        
    # 3. Math-aware Vocabulary Diversity (Type-Token Ratio)
    # Extracts pure English words, skipping LaTeX keywords and short math symbols
    # to avoid false positives on JEE advanced proofs
    all_words = re.findall(r'\b[a-z]{3,}\b', lower_exp)
    latex_keywords = {'frac', 'sqrt', 'cdot', 'times', 'text', 'quad', 'sum', 'int', 'lim', 'theta', 'alpha', 'beta', 'pi', 'delta', 'phi', 'psi', 'omega', 'lambda', 'sigma', 'infty'}
    narrative_words = [w for w in all_words if w not in latex_keywords]
    
    # Check if explanation is math-heavy (has LaTeX blocks or math keywords)
    math_indicators = len(re.findall(r'\$|\\\(|\\\[|\\frac|\\sqrt|\\cdot|\\times|\\vec|\\theta|\\alpha|\\beta|\\sigma', exp))
    is_math_heavy = math_indicators >= 2
    
    if len(narrative_words) >= 8:
        ttr = len(set(narrative_words)) / len(narrative_words)
        ttr_limit = 0.20 if is_math_heavy else 0.35
        if ttr < ttr_limit: # repetitive English narrative words
            return True
                
    # 4. Overlap Ratio Check (Similarity scoring instead of substring)
    # Checks if the vocabulary of explanation narrative words is mostly a duplicate subset of the question narrative words
    words_exp = set(narrative_words)
    words_q = set(re.findall(r'\b[a-z]{3,}\b', question_text.lower()))
    words_q = {w for w in words_q if w not in latex_keywords}
    
    if words_exp:
        # Check if the explanation has new LaTeX math content not present in the question
        exp_math_blocks = set(re.findall(r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]', exp))
        q_math_blocks = set(re.findall(r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]', question_text))
        has_new_math = len(exp_math_blocks - q_math_blocks) > 0
        
        # If explanation has no new math, we run high overlap detection
        if not has_new_math:
            overlap_ratio = len(words_exp.intersection(words_q)) / len(words_exp)
            if overlap_ratio > 0.80 and len(words_exp) < 20: # 80% of explanation narrative words are just copied from the question
                return True
        
    return False

def check_latex_sanity(text):
    if not text:
        return True
    # Check for unescaped '$' characters count
    dollars = len(re.findall(r'(?<!\\)\$', text))
    if dollars % 2 != 0:
        return False
    return True

def check_explanation_contradiction(explanation, correct_letter):
    if not explanation or not correct_letter:
        return False
        
    sentences = re.split(r'[.!?\n]', explanation)
    for sent in sentences:
        sent_lower = sent.strip().lower()
        if not sent_lower:
            continue
            
        # Check if sentence has correctness indicators AND does NOT have negation/incorrectness indicators
        has_positive = any(k in sent_lower for k in ['correct', 'hence', 'therefore', 'thus', 'conclude', 'answer is'])
        has_negative = any(k in sent_lower for k in ['incorrect', 'false', 'wrong', 'invalid', 'not correct', 'is not'])
        
        if has_positive and not has_negative:
            # Find option letter in this positive sentence
            p1 = re.findall(r'\b(?:option|choice|answer)\s*[\(\[]?([A-D])[\)\]]?\b', sent, re.IGNORECASE)
            p2 = re.findall(r'[\(\[]([A-D])[\)\]]', sent, re.IGNORECASE)
            p3 = re.findall(r'\b([A-D])\s+is\s+(?:the\s+)?correct\b', sent, re.IGNORECASE)
            
            letters = [l.upper() for l in p1 + p2 + p3]
            for l in letters:
                if l != correct_letter:
                    # Contradiction found! Explanation concludes a different option letter is correct.
                    return True
    return False

def compute_normalized_hash(text, options_json):
    if not text:
        return ""
    # Normalize question text (preserves numbers, math operators/variables, formatting brackets, decimals, and commas)
    t = text.lower()
    t = t.replace('$', '').replace(r'\(', '').replace(r'\)', '').replace(r'\[', '').replace(r'\]', '')
    t = re.sub(r'\s+', '', t)
    t = re.sub(r'[^a-z0-9+\-*/^=<>{}_\\()\[\],.]', '', t)
    
    # Normalize options
    opt_str = ""
    try:
        opts = json.loads(options_json)
        if isinstance(opts, list):
            cleaned = []
            for o in opts:
                co = str(o).lower()
                co = co.replace('$', '').replace(r'\(', '').replace(r'\)', '')
                co = re.sub(r'\s+', '', co)
                co = re.sub(r'[^a-z0-9+\-*/^=<>{}_\\()\[\],.]', '', co)
                cleaned.append(co)
            cleaned.sort()
            opt_str = "".join(cleaned)
    except Exception:
        pass
        
    return t + "|" + opt_str

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()

    questions = cursor.execute("SELECT id, exam, type, question_text, options, correct_answer, explanation, quality_tier, verified FROM questions;").fetchall()
    print(f"Loaded {len(questions)} questions from local database.")

    metrics = {
        "fixed_latex": 0,
        "fixed_options": 0,
        "fixed_leaks": 0,
        "fixed_correct": 0,
        "fixed_integer_options": 0,
        "quarantined_placeholders": 0,
        "quarantined_mismatches": 0,
        "quarantined_latex_errors": 0,
        "quarantined_duplicates": 0,
        "quarantined_contradictions": 0,
        "updated": 0
    }

    # First pass: Check for duplicates
    hash_map = {}
    for row in questions:
        q_id, exam, q_type, text, options_json, correct, explanation, tier, verified = row
        q_hash = compute_normalized_hash(text, options_json)
        if q_hash:
            if q_hash not in hash_map:
                hash_map[q_hash] = []
            hash_map[q_hash].append(row)

    duplicate_ids_to_quarantine = set()
    for q_hash, rows in hash_map.items():
        if len(rows) > 1:
            # Sort priority: verified=1 first, then quality_tier (S > A > B > C > D)
            def sort_key(r):
                v = r[8]
                tier = r[7]
                tier_val = {'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1}.get(tier, 0)
                return (-v, -tier_val, r[0]) # Ascending ID for tie-breaker
            
            sorted_rows = sorted(rows, key=sort_key)
            # Quarantine the rest
            for dupe_row in sorted_rows[1:]:
                duplicate_ids_to_quarantine.add(dupe_row[0])

    updates = []

    for idx, row in enumerate(questions):
        q_id, exam, q_type, text, options_json, correct, explanation, tier, verified = row
        
        updated_row = False
        new_text = text
        new_options_json = options_json
        new_correct = correct
        new_explanation = explanation
        new_tier = tier
        new_verified = verified

        # Check duplicate quarantine list
        if q_id in duplicate_ids_to_quarantine:
            if new_tier != 'D' or new_verified != -1:
                new_tier = 'D'
                new_verified = -1
                new_explanation = "[Duplicate Quarantined] " + new_explanation
                metrics["quarantined_duplicates"] += 1
                updated_row = True

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

        # 3. Clean Options
        options_list = []
        is_mcq = q_type in ['MCQ', 'Multi-correct']
        
        if q_type == 'Integer':
            if new_options_json != '[]':
                new_options_json = '[]'
                metrics["fixed_integer_options"] += 1
                updated_row = True
        else:
            try:
                options_list = json.loads(new_options_json)
            except Exception:
                pass
                
            if is_mcq and isinstance(options_list, list) and len(options_list) > 0:
                cleaned_options = [clean_option(opt) for opt in options_list]
                if cleaned_options != options_list:
                    new_options_json = json.dumps(cleaned_options, ensure_ascii=False)
                    metrics["fixed_options"] += 1
                    updated_row = True
                    options_list = cleaned_options

        # 4. Correct Answer Mapping (Semantic-Safe)
        mapped_correct = fix_correct_answer(q_type, new_correct, options_list)
        if mapped_correct != new_correct:
            new_correct = mapped_correct
            metrics["fixed_correct"] += 1
            updated_row = True

        # 5. Verify correct_answer matches options for MCQ/Multi-correct
        if is_mcq and isinstance(options_list, list) and len(options_list) > 0:
            if q_type == 'MCQ':
                if new_correct not in options_list:
                    if new_tier != 'D' or new_verified != -1:
                        new_tier = 'D'
                        new_verified = -1
                        metrics["quarantined_mismatches"] += 1
                        updated_row = True
            elif q_type == 'Multi-correct':
                try:
                    parsed_correct = json.loads(new_correct)
                    if isinstance(parsed_correct, list):
                        valid = all(c in options_list for c in parsed_correct)
                        if not valid and (new_tier != 'D' or new_verified != -1):
                            new_tier = 'D'
                            new_verified = -1
                            metrics["quarantined_mismatches"] += 1
                            updated_row = True
                    else:
                        if new_tier != 'D' or new_verified != -1:
                            new_tier = 'D'
                            new_verified = -1
                            metrics["quarantined_mismatches"] += 1
                            updated_row = True
                except Exception:
                    if new_tier != 'D' or new_verified != -1:
                        new_tier = 'D'
                        new_verified = -1
                        metrics["quarantined_mismatches"] += 1
                        updated_row = True

        # 6. LaTeX Sanity Check
        if not check_latex_sanity(new_text) or not check_latex_sanity(new_explanation):
            if new_tier != 'D' or new_verified != -1:
                new_tier = 'D'
                new_verified = -1
                metrics["quarantined_latex_errors"] += 1
                updated_row = True

        # 7. Low-Quality Explanation Filtering
        if is_low_quality_explanation(new_explanation, new_text):
            if new_tier != 'D' or new_verified != -1:
                new_tier = 'D'
                new_verified = -1
                metrics["quarantined_placeholders"] += 1
                updated_row = True

        # 8. Local Explanation Contradiction Check
        correct_letter = None
        if q_type == 'MCQ' and isinstance(options_list, list) and len(options_list) > 0:
            letter_map = ['A', 'B', 'C', 'D']
            for o_idx, opt in enumerate(options_list):
                if opt == new_correct:
                    correct_letter = letter_map[o_idx]
                    break
        if correct_letter and check_explanation_contradiction(new_explanation, correct_letter):
            if new_tier != 'D' or new_verified != -1:
                new_tier = 'D'
                new_verified = -1
                new_explanation = "[Contradiction Quarantined] " + new_explanation
                metrics["quarantined_contradictions"] += 1
                updated_row = True

        # Collect updates for batch execution
        if updated_row:
            updates.append((new_text, new_options_json, new_correct, new_explanation, new_tier, new_verified, q_id))
            metrics["updated"] += 1

    # Execute all updates in a single batch
    if updates:
        cursor.executemany(
            "UPDATE questions SET question_text = ?, options = ?, correct_answer = ?, explanation = ?, quality_tier = ?, verified = ? WHERE id = ?;",
            updates
        )

    conn.commit()
    conn.close()

    print("\n" + "="*50)
    print("COMPREHENSIVE LOCAL REPAIRS COMPLETE!")
    print("="*50)
    print(f"Questions processed:             {len(questions)}")
    print(f"LaTeX escapes fixed:             {metrics['fixed_latex']}")
    print(f"Option double-prefixes fixed:    {metrics['fixed_options']}")
    print(f"Leaked answers removed:          {metrics['fixed_leaks']}")
    print(f"Correct answers mapped/fixed:    {metrics['fixed_correct']}")
    print(f"Integer options reset:           {metrics['fixed_integer_options']}")
    print(f"Quarantined (low quality exp):   {metrics['quarantined_placeholders']}")
    print(f"Quarantined (options mismatch):  {metrics['quarantined_mismatches']}")
    print(f"Quarantined (LaTeX errors):      {metrics['quarantined_latex_errors']}")
    print(f"Quarantined (duplicates):        {metrics['quarantined_duplicates']}")
    print(f"Quarantined (contradictions):    {metrics['quarantined_contradictions']}")
    print(f"Total database updates:          {metrics['updated']}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
