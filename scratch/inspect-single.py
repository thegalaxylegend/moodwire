import sqlite3
import os
import glob
import json

def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        db_files = [f for f in files if "metadata" not in f]
    return db_files[0]

def main():
    db_path = find_db()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    row = cursor.execute("SELECT id, question_text, options, correct_answer, explanation, solution_steps FROM questions WHERE id = ?;", ("47557810ced26e4323b339da5f84f926",)).fetchone()
    if row:
        print(f"ID: {row[0]}")
        print(f"Text: {row[1]}")
        print(f"Options: {row[2]}")
        print(f"Correct: {row[3]}")
        print(f"Explanation: {row[4]}")
        print(f"Steps: {row[5]}")
    else:
        print("Not found")
        
    conn.close()

if __name__ == "__main__":
    main()
