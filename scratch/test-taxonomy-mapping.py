import json
import sqlite3
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

def tokenize(s):
    if not s:
        return set()
    s = s.lower()
    s = re.sub(r'[^a-z0-9_]', ' ', s)
    tokens = [t for t in s.split() if t]
    # Expand tokens containing underscores to also include individual parts
    expanded = []
    for t in tokens:
        expanded.append(t)
        if '_' in t:
            expanded.extend(t.split('_'))
    return set(expanded)

def main():
    with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
        taxonomy = json.load(f)
        
    db_path = find_db()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    rows = cursor.execute("SELECT DISTINCT primary_topic_id, primary_topic, primary_subtopic, class, exam, subject FROM questions;").fetchall()
    conn.close()
    
    print(f"Total distinct DB topics to map: {len(rows)}")
    
    mapped_count = 0
    sample_mappings = []
    
    for row in rows:
        db_id, db_topic, db_subtopic, db_class, db_exam, db_subj = row
        
        # Determine class, exam, subject from the db_id if possible
        # E.g. bio_10_board_adrenaline
        id_tokens = tokenize(db_id)
        
        # Standardize subject
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
            
        # Standardize class
        cls_candidates = set()
        for c in ['8', '9', '10', '11', '12']:
            if c in id_tokens or db_class == c or f"class{c}" in id_tokens or f"class_{c}" in id_tokens:
                cls_candidates.add(c)
        if not cls_candidates:
            cls_candidates.add(db_class)
            
        # Standardize exam
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
        
        # Token set for comparison
        db_tokens = tokenize(db_id) | tokenize(db_topic) | tokenize(db_subtopic)
        
        for tax_item in taxonomy:
            tax_id = tax_item['id']
            tax_class = tax_item['class']
            tax_exam = tax_item['exam']
            tax_subj = tax_item['subject']
            tax_topic = tax_item['topic']
            tax_chapter = tax_item['chapter']
            
            # Compatibility checks
            # 1. Class match (if candidates are specified, it must be in the candidates)
            if tax_class not in cls_candidates:
                continue
                
            # 2. Exam match
            if tax_exam not in exam_candidates:
                # Allow fallback compatibility between JEEMains and JEEAdvanced
                if not (tax_exam in ('JEEMains', 'JEEAdvanced') and any(e in ('JEEMains', 'JEEAdvanced') for e in exam_candidates)):
                    continue
                    
            # 3. Subject compatibility
            # In lower classes (8, 9, 10), Science subject is mapped to Science.
            # But in DB, it might be Biology, Chemistry, or Physics.
            # Check if there is any overlap in subject candidates
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
                
            # Calculate similarity score
            tax_tokens = tokenize(tax_id) | tokenize(tax_topic) | tokenize(tax_chapter)
            # Add subtopics to taxonomy tokens
            for sub in tax_item.get('subtopics', []):
                tax_tokens |= tokenize(sub)
                
            intersection = db_tokens.intersection(tax_tokens)
            union = db_tokens.union(tax_tokens)
            jaccard = len(intersection) / len(union) if union else 0
            
            # Exact ID suffix/prefix boost
            id_boost = 0
            if db_id == tax_id:
                id_boost = 10.0
            elif tax_id in db_id or db_id in tax_id:
                id_boost = 2.0
                
            score = jaccard + id_boost
            
            if score > best_score:
                best_score = score
                best_tax = tax_item
                
        if best_tax:
            mapped_count += 1
            if len(sample_mappings) < 50:
                sample_mappings.append((db_id, db_topic, best_tax['id'], best_tax['subject'], best_tax['class'], best_tax['exam'], best_score))
                
    print(f"Mapped {mapped_count} out of {len(rows)} distinct DB topics ({mapped_count/len(rows)*100:.1f}%)")
    
    print("\nSample 30 mappings:")
    for item in sample_mappings[:30]:
        print(f"DB: {item[0]:<40} -> Canonical: {item[2]:<30} | Subj: {item[3]:<12} | Cls: {item[4]:<3} | Exam: {item[5]:<12} (Score: {item[6]:.2f})")

if __name__ == "__main__":
    main()
