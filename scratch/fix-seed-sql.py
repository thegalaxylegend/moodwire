import re
import json
import os
import glob

SEED_FILE = "scripts/seed.sql"
CHUNK_DIR = "scratch/d1-chunks"

# Allowed values from schema CHECK constraints
VALID_EXAMS = {'JEEMains', 'JEEAdvanced', 'NEET', 'Board'}
VALID_CLASSES = {'8', '9', '10', '11', '12'}
VALID_SUBJECTS = {'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'Social'}
VALID_TYPES = {'MCQ', 'Multi-correct', 'Integer', 'Passage', 'Matrix-Match'}

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
    text = text.replace('\u0009', '\\t') # tab
    text = text.replace('\u000c', '\\f') # form feed
    text = text.replace('\u0008', '\\b') # backspace
    text = text.replace('\u0007', '\\a') # bell
    text = text.replace('\u000b', '\\v') # vertical tab
    return text

def semantic_normalize(text):
    if not isinstance(text, str):
        return ""
    t = text.strip()
    if t.startswith('$') and t.endswith('$') and len(t) > 1:
        t = t[1:-1].strip()
    elif t.startswith(r'\(') and t.endswith(r'\)') and len(t) > 4:
        t = t[2:-2].strip()
    elif t.startswith(r'\[') and t.endswith(r'\]') and len(t) > 4:
        t = t[2:-2].strip()
    t = t.lower()
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'^[.,;!?"\'\(\)]+|[.,;!?"\'\(\)]+$', '', t)
    return t.strip()

def parse_multicorrect_letters(text):
    if not text:
        return None
    text = text.strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(x).strip().upper() for x in parsed]
    except Exception:
        pass
    
    normalized = re.sub(r'\b(and)\b', ',', text, flags=re.IGNORECASE)
    normalized = re.sub(r'[\s\[\]\(\)]', '', normalized)
    if re.match(r'^[A-D](,[A-D])*$', normalized, re.IGNORECASE):
        return [char.upper() for char in normalized.split(',')]
    if re.match(r'^[A-D]{1,4}$', text.upper().strip()):
        return list(text.upper().strip())
    return None

def fix_correct_answer(q_type, correct, options_list):
    if not correct:
        return correct
    correct = correct.strip()
    
    if q_type == 'MCQ':
        letter_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        if correct.upper() in letter_map:
            idx = letter_map[correct.upper()]
            if options_list and idx < len(options_list):
                return options_list[idx]
        if options_list and correct in options_list:
            return correct
        if options_list:
            norm_correct = semantic_normalize(correct)
            for opt in options_list:
                if norm_correct == semantic_normalize(opt):
                    return opt
            for opt in options_list:
                if semantic_normalize(clean_option(opt)) == semantic_normalize(clean_option(correct)):
                    return opt
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
                if options_list and all(opt in options_list for opt in parsed):
                    return correct
        except Exception:
            pass
    elif q_type == 'Integer':
        try:
            val = float(correct)
            if val.is_integer():
                return str(int(val))
            return str(val)
        except ValueError:
            pass
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
    if len(words) < 5:
        return True
    lower_exp = exp.lower()
    placeholders = [
        "step 1: recall the formula", "step 2: use the given values",
        "conclude that the correct answer is", "step 1: identify the key concept",
        "conclude that the correct option is", "step 1: recall the definition",
        "step 2: substitute the values", "step 2: substitute the given values",
        "first identify the concept", "then apply the equation",
        "finally compute the result", "hence the correct option is",
        "therefore, correct option is", "conclude that correct",
        "by solving this we get", "by solving we get"
    ]
    matched_placeholders = 0
    for p in placeholders:
        if p in lower_exp:
            matched_placeholders += 1
    if len(words) < 25 and matched_placeholders >= 2:
        return True
        
    all_words = re.findall(r'\b[a-z]{3,}\b', lower_exp)
    latex_keywords = {'frac', 'sqrt', 'cdot', 'times', 'text', 'quad', 'sum', 'int', 'lim', 'theta', 'alpha', 'beta', 'pi', 'delta', 'phi', 'psi', 'omega', 'lambda', 'sigma', 'infty'}
    narrative_words = [w for w in all_words if w not in latex_keywords]
    
    # Check if explanation is math-heavy (has LaTeX blocks or math keywords)
    math_indicators = len(re.findall(r'\$|\\\(|\\\[|\\frac|\\sqrt|\\cdot|\\times|\\vec|\\theta|\\alpha|\\beta|\\sigma', exp))
    is_math_heavy = math_indicators >= 2
    
    if len(narrative_words) >= 8:
        ttr = len(set(narrative_words)) / len(narrative_words)
        ttr_limit = 0.20 if is_math_heavy else 0.35
        if ttr < ttr_limit:
            return True
            
    words_q = set(re.findall(r'\b[a-z]{3,}\b', question_text.lower()))
    words_q = {w for w in words_q if w not in latex_keywords}
    
    words_exp = set(narrative_words)
    if words_exp:
        # Check if the explanation has new LaTeX math content not present in the question
        exp_math_blocks = set(re.findall(r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]', exp))
        q_math_blocks = set(re.findall(r'\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]', question_text))
        has_new_math = len(exp_math_blocks - q_math_blocks) > 0
        
        # If explanation has no new math, we run high overlap detection
        if not has_new_math:
            overlap_ratio = len(words_exp.intersection(words_q)) / len(words_exp)
            if overlap_ratio > 0.80 and len(words_exp) < 20:
                return True
    return False

def check_latex_sanity(text):
    if not text:
        return True
    dollars = len(re.findall(r'(?<!\\)\$', text))
    return dollars % 2 == 0

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
    t = text.lower()
    t = t.replace('$', '').replace(r'\(', '').replace(r'\)', '').replace(r'\[', '').replace(r'\]', '')
    t = re.sub(r'\s+', '', t)
    t = re.sub(r'[^a-z0-9+\-*/^=<>{}_\\()\[\],.]', '', t)
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

def parse_sql_values(val_part):
    tokens = []
    in_str = False
    current = []
    was_str = False
    i = 0
    while i < len(val_part):
        char = val_part[i]
        if in_str:
            if char == "'":
                if i + 1 < len(val_part) and val_part[i+1] == "'":
                    current.append("'")
                    i += 1
                else:
                    in_str = False
            else:
                current.append(char)
        else:
            if char == "'":
                in_str = True
                was_str = True
            elif char == ",":
                val = "".join(current).strip()
                tokens.append((was_str, val))
                current = []
                was_str = False
            elif char in (' ', '\n', '\t', '('):
                if current:
                    current.append(char)
            elif char == ')':
                pass
            else:
                current.append(char)
        i += 1
    val = "".join(current).strip()
    tokens.append((was_str, val))
    
    processed = []
    for was_str, val in tokens:
        if was_str:
            processed.append(val)
        else:
            val_lower = val.lower()
            if val_lower == 'null' or val == '':
                processed.append(None)
            else:
                try:
                    if '.' in val:
                        processed.append(float(val))
                    else:
                        processed.append(int(val))
                except ValueError:
                    processed.append(val)
    return processed

def escape_sql_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, str):
        escaped = val.replace("'", "''")
        return f"'{escaped}'"
    if isinstance(val, bool):
        return "1" if val else "0"
    return str(val)

def main():
    print(f"Reading master seed: {SEED_FILE}...")
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('\x00', '')
    separator = 'INSERT OR IGNORE INTO questions ('
    
    # Self-healing fallback if seed is empty
    if separator not in content:
        print("Master seed file is empty of INSERT statements. Rebuilding from chunks in scratch/d1-chunks...")
        chunk_files = sorted(glob.glob(os.path.join(CHUNK_DIR, "chunk_*.sql")))
        if not chunk_files:
            raise FileNotFoundError("Could not find chunk files to reconstruct the seed file.")
            
        print(f"Found {len(chunk_files)} chunk files to concatenate.")
        chunk_contents = []
        for cf in chunk_files:
            with open(cf, 'r', encoding='utf-8') as f_cf:
                chunk_contents.append(f_cf.read())
        
        content = "\n".join(chunk_contents)
        content = content.replace('\x00', '')
        # Set a generic seed header
        header = "-- ExamCompass D1 Seed v2\n-- Reconstructed from chunks\n\n"
    else:
        parts = content.split(separator)
        header = parts[0]
        
    parts = content.split(separator)
    rows = []
    failed_parses = 0
    print(f"Parsing {len(parts)-1} SQL statements...")
    
    for idx, part in enumerate(parts[1:]):
        last_idx = part.rfind(');')
        if last_idx != -1:
            part_clean = part[:last_idx + 2].strip()
        else:
            part_clean = part.strip()
            
        stmt = separator + part_clean
        
        val_idx = stmt.find('VALUES')
        if val_idx == -1:
            val_idx = stmt.find('values')
        if val_idx == -1:
            failed_parses += 1
            continue
            
        col_part = stmt[len(separator):val_idx].strip()
        if col_part.endswith(')'):
            col_part = col_part[:-1].strip()
            
        val_part = stmt[val_idx + 6:].strip()
        if val_part.endswith(';'):
            val_part = val_part[:-1].strip()
        if val_part.startswith('(') and val_part.endswith(')'):
            val_part = val_part[1:-1].strip()
            
        vals = parse_sql_values(val_part)
        
        # Determine dynamic mapping from columns in this statement
        col_part_clean = col_part.replace('\n', ' ').replace('\r', ' ')
        cols = [c.strip() for c in col_part_clean.split(',') if c.strip()]
        
        if not vals or len(vals) != len(cols):
            failed_parses += 1
            if failed_parses <= 5:
                print(f"Mismatch at index {idx}: cols count={len(cols)}, values count={len(vals) if vals else 0}")
                print(f"Statement snippet: {stmt[:250]}...")
            continue
            
        rows.append({
            "cols": cols,
            "cols_str": col_part,
            "values": vals,
            "index": idx
        })
        
    print(f"Successfully parsed {len(rows)} rows. Failed: {failed_parses}")
    
    # 1. Identify duplicates across all parsed rows
    print("Computing hashes and finding duplicate rows...")
    hash_map = {}
    for r in rows:
        vals = r["values"]
        col_to_idx = {col: i for i, col in enumerate(r["cols"])}
        
        def get_val(name):
            if name in col_to_idx:
                return vals[col_to_idx[name]]
            return None
            
        q_id = get_val("id")
        text = get_val("question_text")
        opts_json = get_val("options")
        q_hash = compute_normalized_hash(text, opts_json)
        if q_hash:
            if q_hash not in hash_map:
                hash_map[q_hash] = []
            hash_map[q_hash].append(r)
            
    duplicate_indices_to_quarantine = set()
    for q_hash, grouped in hash_map.items():
        if len(grouped) > 1:
            def sort_key(x):
                v_idx = {col: i for i, col in enumerate(x["cols"])}
                vals = x["values"]
                
                def get_v(name):
                    if name in v_idx:
                        return vals[v_idx[name]]
                    return None
                    
                v = get_v("verified") or 0
                tier = get_v("quality_tier") or 'C'
                tier_val = {'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1}.get(tier, 0)
                return (-v, -tier_val, x["index"])
            
            sorted_group = sorted(grouped, key=sort_key)
            # Keep the first one, quarantine the rest
            for dupe_r in sorted_group[1:]:
                duplicate_indices_to_quarantine.add(dupe_r["index"])
                
    print(f"Found {len(duplicate_indices_to_quarantine)} duplicate questions to quarantine.")
    
    # 2. Apply repairs
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
    
    repaired_statements = []
    
    print("Applying structural repairs and quality checks...")
    for r in rows:
        idx = r["index"]
        cols_str = r["cols_str"]
        vals = r["values"][:] # copy
        
        col_to_idx = {col: i for i, col in enumerate(r["cols"])}
        
        def get_val(name):
            if name in col_to_idx:
                return vals[col_to_idx[name]]
            return None
            
        def set_val(name, value):
            if name in col_to_idx:
                vals[col_to_idx[name]] = value
                
        q_id = get_val("id")
        exam = get_val("exam")
        class_val = get_val("class")
        subject = get_val("subject")
        q_type = get_val("type")
        text = get_val("question_text")
        options_json = get_val("options")
        correct = get_val("correct_answer")
        explanation = get_val("explanation")
        tier = get_val("quality_tier")
        verified = get_val("verified")
        
        updated_row = False
        
        # Check duplicate list
        if idx in duplicate_indices_to_quarantine:
            if tier != 'D' or verified != -1:
                tier = 'D'
                verified = -1
                explanation = "[Duplicate Quarantined] " + explanation
                metrics["quarantined_duplicates"] += 1
                updated_row = True
                
        # LaTeX escape fixes
        fixed_text = fix_latex_escapes(text)
        fixed_explanation = fix_latex_escapes(explanation)
        fixed_correct = fix_latex_escapes(correct)
        fixed_options_json = fix_latex_escapes(options_json)
        
        if (fixed_text != text or fixed_explanation != explanation or 
            fixed_correct != correct or fixed_options_json != options_json):
            text = fixed_text
            explanation = fixed_explanation
            correct = fixed_correct
            options_json = fixed_options_json
            metrics["fixed_latex"] += 1
            updated_row = True
            
        # Leaked answer stripping
        stripped_text = strip_leaked_answers(text)
        if stripped_text != text:
            text = stripped_text
            metrics["fixed_leaks"] += 1
            updated_row = True
            
        # Clean options
        options_list = []
        is_mcq = q_type in ['MCQ', 'Multi-correct']
        
        if q_type == 'Integer':
            if options_json != '[]':
                options_json = '[]'
                metrics["fixed_integer_options"] += 1
                updated_row = True
        else:
            try:
                options_list = json.loads(options_json)
            except Exception:
                pass
                
            if is_mcq and isinstance(options_list, list) and len(options_list) > 0:
                cleaned_options = [clean_option(opt) for opt in options_list]
                if cleaned_options != options_list:
                    options_json = json.dumps(cleaned_options, ensure_ascii=False)
                    metrics["fixed_options"] += 1
                    updated_row = True
                    options_list = cleaned_options
                    
        # Correct answer mapping (Semantic-Safe)
        mapped_correct = fix_correct_answer(q_type, correct, options_list)
        if mapped_correct != correct:
            correct = mapped_correct
            metrics["fixed_correct"] += 1
            updated_row = True
            
        # Verify MCQ / Multi-correct match
        if is_mcq and isinstance(options_list, list) and len(options_list) > 0:
            if q_type == 'MCQ':
                if correct not in options_list:
                    if tier != 'D' or verified != -1:
                        tier = 'D'
                        verified = -1
                        metrics["quarantined_mismatches"] += 1
                        updated_row = True
            elif q_type == 'Multi-correct':
                try:
                    parsed_correct = json.loads(correct)
                    if isinstance(parsed_correct, list):
                        valid = all(c in options_list for c in parsed_correct)
                        if not valid and (tier != 'D' or verified != -1):
                            tier = 'D'
                            verified = -1
                            metrics["quarantined_mismatches"] += 1
                            updated_row = True
                    else:
                        if tier != 'D' or verified != -1:
                            tier = 'D'
                            verified = -1
                            metrics["quarantined_mismatches"] += 1
                            updated_row = True
                except Exception:
                    if tier != 'D' or verified != -1:
                        tier = 'D'
                        verified = -1
                        metrics["quarantined_mismatches"] += 1
                        updated_row = True
                        
        # LaTeX Sanity check
        if not check_latex_sanity(text) or not check_latex_sanity(explanation):
            if tier != 'D' or verified != -1:
                tier = 'D'
                verified = -1
                metrics["quarantined_latex_errors"] += 1
                updated_row = True
                
        # Low-quality explanation check
        if is_low_quality_explanation(explanation, text):
            if tier != 'D' or verified != -1:
                tier = 'D'
                verified = -1
                metrics["quarantined_placeholders"] += 1
                updated_row = True

        # Local Explanation Contradiction Check
        correct_letter = None
        if q_type == 'MCQ' and isinstance(options_list, list) and len(options_list) > 0:
            letter_map = ['A', 'B', 'C', 'D']
            for o_idx, opt in enumerate(options_list):
                if opt == correct:
                    correct_letter = letter_map[o_idx]
                    break
        if correct_letter and check_explanation_contradiction(explanation, correct_letter):
            if tier != 'D' or verified != -1:
                tier = 'D'
                verified = -1
                explanation = "[Contradiction Quarantined] " + explanation
                metrics["quarantined_contradictions"] += 1
                updated_row = True
                
        if updated_row:
            metrics["updated"] += 1
            
        # Assign updated values back to array
        set_val("question_text", text)
        set_val("options", options_json)
        set_val("correct_answer", correct)
        set_val("explanation", explanation)
        set_val("quality_tier", tier)
        set_val("verified", verified)
        
        # Serialize back to SQL VALUES format
        escaped_vals = [escape_sql_value(v) for v in vals]
        stmt = f"INSERT OR IGNORE INTO questions ({cols_str}) VALUES ({', '.join(escaped_vals)});"
        repaired_statements.append(stmt)
        
    # Write back seed.sql
    print(f"Writing repaired SQL back to {SEED_FILE}...")
    seed_output = header + "\n" + "\n".join(repaired_statements) + "\n"
    with open(SEED_FILE, 'w', encoding='utf-8') as f:
        f.write(seed_output)
        
    # Split into chunks of 500
    print(f"Regenerating chunks in {CHUNK_DIR}...")
    os.makedirs(CHUNK_DIR, exist_ok=True)
    
    CHUNK_SIZE = 500
    chunks = []
    for i in range(0, len(repaired_statements), CHUNK_SIZE):
        chunks.append(repaired_statements[i:i + CHUNK_SIZE])
        
    for i, chunk_list in enumerate(chunks):
        chunk_file = os.path.join(CHUNK_DIR, f"chunk_{String_pad(i)}.sql")
        chunk_sql = "\n".join(chunk_list) + "\n"
        with open(chunk_file, 'w', encoding='utf-8') as f:
            f.write(chunk_sql)
            
    # Reset local upload progress so uploader runs clean
    for progress_file in ["d1-upload-progress-local.json", "d1-upload-progress-remote.json"]:
        p_path = os.path.join("scratch", progress_file)
        if os.path.exists(p_path):
            os.remove(p_path)
            print(f"Deleted upload progress tracker: {p_path}")
            
    print("\n" + "="*50)
    print("MASTER SQL SEED REPAIR COMPLETE!")
    print("="*50)
    print(f"Total statements processed:      {len(rows)}")
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
    print(f"Total rows updated:              {metrics['updated']}")
    print("="*50 + "\n")

def String_pad(i):
    return str(i).zfill(4)

if __name__ == "__main__":
    main()
