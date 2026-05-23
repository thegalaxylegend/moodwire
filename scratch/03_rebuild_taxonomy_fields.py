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

def tokenize(s):
    if not s:
        return set()
    s = s.lower()
    s = re.sub(r'[^a-z0-9_]', ' ', s)
    tokens = [t for t in s.split() if t]
    expanded = []
    for t in tokens:
        expanded.append(t)
        if '_' in t:
            expanded.extend(t.split('_'))
    return set(expanded)

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
        taxonomy = json.load(f)
        
    print(f"Loaded {len(taxonomy)} canonical taxonomy items.")
    
    # Pre-tokenize taxonomy items
    tax_items_compiled = []
    for tax_item in taxonomy:
        tax_id = tax_item['id']
        tax_class = tax_item['class']
        tax_exam = tax_item['exam']
        tax_subj = tax_item['subject']
        tax_topic = tax_item['topic']
        tax_chapter = tax_item['chapter']
        
        tax_tokens = tokenize(tax_id) | tokenize(tax_topic) | tokenize(tax_chapter)
        for sub in tax_item.get('subtopics', []):
            tax_tokens |= tokenize(sub)
            
        tax_items_compiled.append({
            'item': tax_item,
            'tokens': tax_tokens
        })
        
    # Read all questions from DB
    questions = cursor.execute(
        "SELECT id, primary_topic_id, primary_topic, primary_subtopic, class, exam, subject FROM questions;"
    ).fetchall()
    
    print(f"Loaded {len(questions)} questions from DB to align taxonomy.")
    
    updated_count = 0
    mismatch_counts = {
        'class': 0,
        'exam': 0,
        'subject': 0
    }
    
    conn.execute("BEGIN TRANSACTION;")
    
    for idx, (q_id, db_id, db_topic, db_subtopic, db_class, db_exam, db_subj) in enumerate(questions):
        id_tokens = tokenize(db_id)
        
        # Determine subject candidates
        subj_candidates = set()
        if any(x in id_tokens for x in ['phy', 'phys', 'physics']):
            subj_candidates.add('Physics')
        if any(x in id_tokens for x in ['che', 'chem', 'chemistry']):
            subj_candidates.add('Chemistry')
        if any(x in id_tokens for x in ['bio', 'biol', 'biology']):
            subj_candidates.add('Biology')
        if any(x in id_tokens for x in ['mat', 'math', 'mathematics']):
            subj_candidates.add('Mathematics')
        if any(x in id_tokens for x in ['sci', 'science']):
            subj_candidates.add('Science')
            
        if not subj_candidates:
            subj_candidates.add(db_subj)
            
        # Determine class candidates
        cls_candidates = set()
        for c in ['8', '9', '10', '11', '12']:
            if c in id_tokens or db_class == c or f"class{c}" in id_tokens or f"class_{c}" in id_tokens:
                cls_candidates.add(c)
        if not cls_candidates:
            cls_candidates.add(db_class)
            
        # Determine exam candidates
        exam_candidates = set()
        if any(x in id_tokens for x in ['board', 'bd', 'cbse']):
            exam_candidates.add('Board')
        if any(x in id_tokens for x in ['jm', 'jeemains', 'mains']):
            exam_candidates.add('JEEMains')
        if any(x in id_tokens for x in ['ja', 'jeeadvanced', 'adv', 'advanced']):
            exam_candidates.add('JEEAdvanced')
        if any(x in id_tokens for x in ['nt', 'neet']):
            exam_candidates.add('NEET')
        if not exam_candidates:
            exam_candidates.add(db_exam)
            
        best_score = -1
        best_tax = None
        db_tokens = tokenize(db_id) | tokenize(db_topic) | tokenize(db_subtopic)
        
        # 1. Compatible match try
        for comp in tax_items_compiled:
            tax_item = comp['item']
            tax_class = tax_item['class']
            tax_exam = tax_item['exam']
            tax_subj = tax_item['subject']
            
            # Compatibility checks
            if tax_class not in cls_candidates:
                continue
                
            if tax_exam not in exam_candidates:
                if not (tax_exam in ('JEEMains', 'JEEAdvanced') and any(e in ('JEEMains', 'JEEAdvanced') for e in exam_candidates)):
                    continue
                    
            subject_overlap = False
            for cand in subj_candidates:
                if cand == tax_subj:
                    subject_overlap = True
                elif cand in ('Physics', 'Chemistry', 'Biology') and tax_subj == 'Science':
                    subject_overlap = True
                elif cand == 'Science' and tax_subj in ('Physics', 'Chemistry', 'Biology'):
                    subject_overlap = True
            if not subject_overlap:
                continue
                
            # Score
            intersection = db_tokens.intersection(comp['tokens'])
            union = db_tokens.union(comp['tokens'])
            jaccard = len(intersection) / len(union) if union else 0
            
            id_boost = 0
            if db_id == tax_item['id']:
                id_boost = 10.0
            elif tax_item['id'] in db_id or db_id in tax_item['id']:
                id_boost = 2.0
                
            score = jaccard + id_boost
            
            if score > best_score:
                best_score = score
                best_tax = tax_item
                
        # 2. Fallback try without compatibility checks if no match found
        if not best_tax:
            for comp in tax_items_compiled:
                tax_item = comp['item']
                intersection = db_tokens.intersection(comp['tokens'])
                union = db_tokens.union(comp['tokens'])
                jaccard = len(intersection) / len(union) if union else 0
                
                id_boost = 0
                if db_id == tax_item['id']:
                    id_boost = 10.0
                elif tax_item['id'] in db_id or db_id in tax_item['id']:
                    id_boost = 2.0
                    
                score = jaccard + id_boost
                
                if score > best_score:
                    best_score = score
                    best_tax = tax_item
                    
        if best_tax:
            canonical_class = best_tax['class']
            canonical_exam = best_tax['exam']
            canonical_subj = best_tax['subject']
            
            # Check if any field differs
            is_mismatch = (
                canonical_class != db_class or
                canonical_exam != db_exam or
                canonical_subj != db_subj
            )
            
            if is_mismatch:
                if canonical_class != db_class:
                    mismatch_counts['class'] += 1
                if canonical_exam != db_exam:
                    mismatch_counts['exam'] += 1
                if canonical_subj != db_subj:
                    mismatch_counts['subject'] += 1
                    
                cursor.execute(
                    """
                    UPDATE questions
                    SET class = ?, exam = ?, subject = ?,
                        last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
                        repair_notes = ?
                    WHERE id = ?;
                    """,
                    (
                        canonical_class, canonical_exam, canonical_subj,
                        f"Taxonomy alignment: updated class ({db_class}->{canonical_class}), exam ({db_exam}->{canonical_exam}), subject ({db_subj}->{canonical_subj}) to match canonical taxonomy item {best_tax['id']}",
                        q_id
                    )
                )
                updated_count += 1
                
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("PHASE 3: TAXONOMY FIELD ALIGNMENT COMPLETE!")
    print("="*50)
    print(f"Total questions aligned to taxonomy:  {len(questions)}")
    print(f"Total question updates made:          {updated_count}")
    print(f"Class field mismatches corrected:     {mismatch_counts['class']}")
    print(f"Exam field mismatches corrected:      {mismatch_counts['exam']}")
    print(f"Subject field mismatches corrected:   {mismatch_counts['subject']}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
