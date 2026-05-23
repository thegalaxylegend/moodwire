import sqlite3
import json
import os
import glob
import re
import ftfy

cp1252_to_byte = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f
}

# Match consecutive CP1252-related characters that could represent double/triple UTF-8 mojibake
mojibake_pattern = re.compile(
    r'[\u00c0-\u00ff\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178\x80-\x9f]{2,}'
)

def decode_segment(m):
    seg = m.group(0)
    try:
        # Convert chars to CP1252 bytes
        b = [cp1252_to_byte.get(ord(c), ord(c)) for c in seg]
        # Decode as UTF-8
        decoded = bytes(b).decode('utf-8')
        # Recursively resolve nested mojibake if pattern matches the output
        while mojibake_pattern.search(decoded):
            new_decoded = mojibake_pattern.sub(decode_segment, decoded)
            if new_decoded == decoded:
                break
            decoded = new_decoded
        return decoded
    except Exception:
        return seg

def repair_text(text):
    if not text:
        return text
    
    # 1. Custom recursive CP1252 segment restoration
    text = mojibake_pattern.sub(decode_segment, text)
    
    # 2. General ftfy cleaning
    text = ftfy.fix_text(text)
    
    # 3. Targeted LaTeX character restorations (e.g. standardizing arrows and symbols in math contexts)
    # Convert unicode arrows to standard LaTeX in math sections if preferred, or keep standard unicode.
    # Let's also fix standard double-escaping residual patterns
    text = text.replace("â†’", "\\rightarrow")
    text = text.replace("â‚‚", "_2")
    text = text.replace("â€”", "—")
    text = text.replace("âº", "^+")
    
    return text.strip()

def repair_json_array(json_str):
    if not json_str:
        return json_str
    try:
        arr = json.loads(json_str)
        if isinstance(arr, list):
            cleaned = [repair_text(str(item)) for item in arr]
            return json.dumps(cleaned, ensure_ascii=False)
    except Exception:
        pass
    return repair_text(json_str)

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

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    rows = cursor.execute("SELECT id, question_text, options, correct_answer, explanation, solution_steps FROM questions;").fetchall()
    print(f"Loaded {len(rows)} records for encoding audit.")
    
    repaired_count = 0
    conn.execute("BEGIN TRANSACTION;")
    
    for row in rows:
        q_id, q_text, q_options, q_correct, q_explanation, q_steps = row
        
        r_text = repair_text(q_text)
        r_options = repair_json_array(q_options)
        r_correct = repair_text(q_correct)
        r_explanation = repair_text(q_explanation)
        r_steps = repair_json_array(q_steps)
        
        is_changed = (
            r_text != q_text or
            r_options != q_options or
            r_correct != q_correct or
            r_explanation != q_explanation or
            r_steps != q_steps
        )
        
        if is_changed:
            cursor.execute(
                """
                UPDATE questions 
                SET question_text = ?, options = ?, correct_answer = ?, explanation = ?, solution_steps = ?,
                    last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1', 
                    repair_notes = 'Encoding mojibake healed via Phase 1 recursive CP1252 segment decoder and ftfy'
                WHERE id = ?;
                """,
                (r_text, r_options, r_correct, r_explanation, r_steps, q_id)
            )
            repaired_count += 1
            
    conn.commit()
    conn.close()
    print(f"Encoding repair pass complete! Repaired {repaired_count} questions.")

if __name__ == "__main__":
    main()
