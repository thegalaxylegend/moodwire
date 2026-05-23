import re
import json

SEED_FILE = "scripts/seed.sql"

# Allowed values from schema CHECK constraints
VALID_EXAMS = {'JEEMains', 'JEEAdvanced', 'NEET', 'Board'}
VALID_CLASSES = {'8', '9', '10', '11', '12'}
VALID_SUBJECTS = {'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'Social'}
VALID_TYPES = {'MCQ', 'Multi-correct', 'Integer', 'Passage', 'Matrix-Match'}

def parse_statements(content):
    separator = 'INSERT OR IGNORE INTO questions ('
    parts = content.split(separator)
    statements = []
    for i in range(1, len(parts)):
        stmt = separator + parts[i].strip()
        if stmt.endswith(');'):
            statements.append(stmt)
        else:
            last_index = stmt.lastIndexOf(');')
            if last_index != -1:
                statements.append(stmt[:last_index + 2])
    return statements

def extract_values(stmt):
    # Regex to extract columns and values
    # e.g., INSERT OR IGNORE INTO questions (id, exam, class, subject, ...) VALUES ('...', '...', '...', ...)
    # Let's extract values inside VALUES(...)
    # A simple but robust parser using find:
    val_idx = stmt.find('VALUES')
    if val_idx == -1:
        val_idx = stmt.find('values')
    if val_idx == -1:
        return None
    
    val_part = stmt[val_idx + 6:].strip()
    if val_part.startswith('(') and val_part.endswith(');'):
        val_part = val_part[1:-2]
    elif val_part.startswith('(') and val_part.endswith(')'):
        val_part = val_part[1:-1]
        
    # We need to split the values, but they are SQL strings, which can contain commas, escaped single quotes, etc.
    # Let's use a simple state machine to parse the SQL values list
    values = []
    current = []
    in_str = False
    escape = False
    
    i = 0
    while i < len(val_part):
        char = val_part[i]
        if in_str:
            if escape:
                current.append(char)
                escape = False
            elif char == "'":
                # Check for escaped quote in SQLite: ''
                if i + 1 < len(val_part) and val_part[i+1] == "'":
                    current.append("'")
                    i += 1 # skip next quote
                else:
                    in_str = False
            else:
                current.append(char)
        else:
            if char == "'":
                in_str = True
            elif char == ",":
                values.append("".join(current).strip())
                current = []
            elif char in (' ', '\n', '\t'):
                pass
            else:
                current.append(char)
        i += 1
    values.append("".join(current).strip())
    return values

def main():
    print(f"Reading {SEED_FILE}...")
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Clean null bytes
    content = content.replace('\x00', '')
    
    separator = 'INSERT OR IGNORE INTO questions ('
    parts = content.split(separator)
    print(f"Split seed.sql into {len(parts)-1} insert parts.")
    
    seen_ids = {}
    invalid_exams = {}
    invalid_classes = {}
    invalid_subjects = {}
    invalid_types = {}
    
    failed_parses = 0
    duplicate_count = 0
    valid_statements = []
    
    # Column mapping in questions schema
    # (id, exam, class, subject, primary_topic_id, primary_topic, primary_subtopic, secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for, type, passage_id, has_image, difficulty_score, difficulty_band, step_count, negative_marking, question_text, options, correct_answer, explanation, solution_steps, key_formula, error_trap_type, source_exam, year, quality_tier, confidence, created_at, verified)
    # The columns list:
    # 0: id
    # 1: exam
    # 2: class
    # 3: subject
    # ...
    # 12: type
    
    for idx, part in enumerate(parts[1:]):
        stmt = separator + part.strip()
        # Clean semicolon at end
        if stmt.endswith(';'):
            stmt = stmt[:-1]
        
        vals = extract_values(stmt)
        if not vals or len(vals) < 13:
            failed_parses += 1
            continue
            
        q_id = vals[0]
        exam = vals[1]
        class_val = vals[2]
        subject = vals[3]
        q_type = vals[12]
        
        # Track duplicates
        if q_id in seen_ids:
            seen_ids[q_id] += 1
            duplicate_count += 1
        else:
            seen_ids[q_id] = 1
            
        # Check constraints
        is_valid = True
        if exam not in VALID_EXAMS:
            invalid_exams[exam] = invalid_exams.get(exam, 0) + 1
            is_valid = False
        if class_val not in VALID_CLASSES:
            invalid_classes[class_val] = invalid_classes.get(class_val, 0) + 1
            is_valid = False
        if subject not in VALID_SUBJECTS:
            invalid_subjects[subject] = invalid_subjects.get(subject, 0) + 1
            is_valid = False
        if q_type not in VALID_TYPES:
            invalid_types[q_type] = invalid_types.get(q_type, 0) + 1
            is_valid = False
            
        if is_valid:
            valid_statements.append((q_id, stmt))

    print("\n" + "="*50)
    print("SEED FILE CONSTRAINT AUDIT")
    print("="*50)
    print(f"Total inserts processed:        {len(parts)-1}")
    print(f"Failed to parse values:         {failed_parses}")
    print(f"Duplicate IDs inside seed file: {duplicate_count}")
    print(f"Unique IDs inside seed file:    {len(seen_ids)}")
    print(f"Statements matching all checks: {len(valid_statements)}")
    
    print("\n--- Invalid Constraint Values Found ---")
    print(f"Invalid Exams (CHECK constraint failure):   {invalid_exams}")
    print(f"Invalid Classes (CHECK constraint failure): {invalid_classes}")
    print(f"Invalid Subjects (CHECK constraint failure):{invalid_subjects}")
    print(f"Invalid Types (CHECK constraint failure):   {invalid_types}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
