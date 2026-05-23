import sqlite3
import os
import glob
from collections import Counter

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
    
    rows = cursor.execute("SELECT id, class, difficulty_band, subject, primary_topic_id FROM questions;").fetchall()
    
    mismatches = []
    band_class_counts = Counter()
    
    for row in rows:
        qid, q_class, q_band, q_subject, topic_id = row
        band_class_counts[(q_band, q_class)] += 1
        
        # Determine if mismatch
        # E.g. band contains "CLASS_8" but class is not "8" or "Class 8"
        # band contains "CLASS_9" but class is not "9" or "Class 9"
        # band contains "BOARD" but class is not "10" or "Class 10" (Wait, is Board for Class 10?)
        # Let's check what ELO bands exist and what classes they should belong to.
        
        # Let's check if the band name contains the class:
        # CLASS_8_RECALL -> Class 8
        # CLASS_9_BASIC -> Class 9
        # BOARD_EASY / BOARD_HARD -> Class 10
        # NEET_EASY / NEET_MEDIUM / NEET_HARD -> Class 11 or 12
        # JEE_MAINS_EASY / JEE_MAINS_MEDIUM / JEE_MAINS_HARD -> Class 11 or 12
        # JEE_ADV_EASY / JEE_ADV_MEDIUM / JEE_ADV_HARD -> Class 11 or 12
        
        has_mismatch = False
        expected_class = None
        
        if "CLASS_8" in q_band and q_class not in ("8", "Class 8"):
            has_mismatch = True
            expected_class = "Class 8"
        elif "CLASS_9" in q_band and q_class not in ("9", "Class 9"):
            has_mismatch = True
            expected_class = "Class 9"
        elif "BOARD" in q_band and q_class not in ("10", "Class 10"):
            has_mismatch = True
            expected_class = "Class 10"
            
        if has_mismatch:
            mismatches.append((qid, q_band, q_class, q_subject, topic_id))
            
    print(f"Total questions: {len(rows)}")
    print(f"Total class/band mismatches found: {len(mismatches)}")
    
    print("\n--- Top 10 Mismatches ---")
    for m in mismatches[:10]:
        print(f"QID: {m[0]} | Band: {m[1]} | Class: {m[2]} | Subject: {m[3]} | Topic ID: {m[4]}")
        
    print("\n--- Band vs Class Distribution ---")
    for (band, cls), count in sorted(band_class_counts.items()):
        print(f"Band: {band:<20} | Class: {cls:<10} | Count: {count}")
        
    conn.close()

if __name__ == "__main__":
    main()
