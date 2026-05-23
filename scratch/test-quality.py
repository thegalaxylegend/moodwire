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
    
    subjects = ["Physics", "Chemistry", "Mathematics", "Biology"]
    out_path = os.path.join("scratch", "quality_audit_sample.txt")
    
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("="*80 + "\n")
        f.write("EXTRACTING SAMPLE QUESTIONS FOR QUALITY EVALUATION\n")
        f.write("="*80 + "\n")
        
        for subj in subjects:
            f.write(f"\n--- SAMPLE FOR SUBJECT: {subj} ---\n")
            rows = cursor.execute(
                "SELECT exam, class, primary_topic, question_text, options, correct_answer, explanation, type FROM questions WHERE subject = ? ORDER BY RANDOM() LIMIT 5;",
                (subj,)
            ).fetchall()
            
            for idx, row in enumerate(rows):
                exam, cls, topic, text, options_json, correct, explanation, q_type = row
                try:
                    options = json.loads(options_json)
                except:
                    options = options_json
                
                f.write(f"\n[{subj} | Q{idx+1}] Exam: {exam} | Class: {cls} | Topic: {topic} | Type: {q_type}\n")
                f.write(f"Question Text:\n{text}\n")
                f.write("Options:\n")
                if isinstance(options, list):
                    for i, opt in enumerate(options):
                        letter = chr(65 + i)
                        f.write(f"  {letter}. {opt}\n")
                else:
                    f.write(f"  {options}\n")
                f.write(f"Correct Answer: {correct}\n")
                f.write(f"Explanation:\n{explanation}\n")
                f.write("-" * 50 + "\n")
                
    conn.close()
    print("Sample questions successfully exported to scratch/quality_audit_sample.txt")

if __name__ == "__main__":
    main()
