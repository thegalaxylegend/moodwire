import sqlite3
import json
import os
import glob

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
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    qids = {
        "trypsin": "0ed87f6f67cd5729bdae64a036bde299",
        "vector_volume": "c4c549e762704f06136ef8fa40b220cb",
        "ellipse": "4d0658b0f3e06f1f18cf938c303ce629"
    }
    
    for name, qid in qids.items():
        print(f"\n=================== INSPECTING: {name} (ID: {qid}) ===================")
        row = cursor.execute(
            "SELECT id, subject, exam, class, primary_topic, question_text, options, correct_answer, explanation, type, quality_tier, verified, difficulty_band FROM questions WHERE id = ?;",
            (qid,)
        ).fetchone()
        
        if not row:
            print("Question NOT found in local DB!")
            continue
            
        fields = ["id", "subject", "exam", "class", "primary_topic", "question_text", "options", "correct_answer", "explanation", "type", "quality_tier", "verified", "difficulty_band"]
        for field, val in zip(fields, row):
            print(f"**{field}**: {val}")
            
    conn.close()

if __name__ == "__main__":
    main()
