import sqlite3
import os
import glob
import re
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
    
    rows = cursor.execute("SELECT primary_topic_id, primary_topic, class, exam, subject, COUNT(*) FROM questions GROUP BY primary_topic_id LIMIT 100;").fetchall()
    
    print("Sample primary_topic_id mappings in DB:")
    for row in rows[:50]:
        print(f"ID: {row[0]:<40} | Topic: {row[1]:<30} | Class: {row[2]:<5} | Exam: {row[3]:<12} | Subj: {row[4]:<12} | Count: {row[5]}")
        
    conn.close()

if __name__ == "__main__":
    main()
