import sqlite3
import os
import glob

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
    
    rows = cursor.execute("""
        SELECT difficulty_band, exam, class, MIN(difficulty_score), MAX(difficulty_score), COUNT(*)
        FROM questions
        GROUP BY difficulty_band, exam, class
        ORDER BY exam, class, MIN(difficulty_score) ASC;
    """).fetchall()
    
    print("Band Recalculation Determinant Matrix currently in DB:")
    print(f"{'Difficulty Band':<20} | {'Exam':<12} | {'Class':<5} | {'Min ELO':<8} | {'Max ELO':<8} | {'Count':<5}")
    print("-"*75)
    for row in rows:
        print(f"{row[0]:<20} | {row[1]:<12} | {row[2]:<5} | {row[3]:<8} | {row[4]:<8} | {row[5]:<5}")
        
    conn.close()

if __name__ == "__main__":
    main()
