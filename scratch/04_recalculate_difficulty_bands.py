import sqlite3
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
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    questions = cursor.execute("SELECT id, exam, class, difficulty_score, difficulty_band FROM questions;").fetchall()
    print(f"Loaded {len(questions)} questions for difficulty band recalculation.")
    
    updated_count = 0
    conn.execute("BEGIN TRANSACTION;")
    
    band_changes = {}
    
    for row in questions:
        q_id, exam, class_val, score, old_band = row
        
        # Calculate new difficulty band based on exam, class, and score
        new_band = old_band
        
        if exam == 'Board':
            if class_val == '8':
                new_band = 'CLASS_8_RECALL'
            elif class_val == '9':
                new_band = 'CLASS_9_BASIC'
            else: # Class 10
                if score < 1400:
                    new_band = 'BOARD_EASY'
                else:
                    new_band = 'BOARD_HARD'
                    
        elif exam == 'NEET':
            if score < 1900:
                new_band = 'NEET_EASY'
            elif score < 2150:
                new_band = 'NEET_MEDIUM'
            else:
                new_band = 'NEET_HARD'
                
        elif exam == 'JEEMains':
            if score < 2050:
                new_band = 'JEE_MAINS_EASY'
            elif score < 2275:
                new_band = 'JEE_MAINS_MEDIUM'
            else:
                new_band = 'JEE_MAINS_HARD'
                
        elif exam == 'JEEAdvanced':
            if score < 2600:
                new_band = 'JEE_ADV_EASY'
            elif score < 2825:
                new_band = 'JEE_ADV_MEDIUM'
            elif score < 3025:
                new_band = 'JEE_ADV_HARD'
            else:
                new_band = 'JEE_ADV_EXPERT'
                
        if new_band != old_band:
            cursor.execute(
                """
                UPDATE questions
                SET difficulty_band = ?,
                    last_repaired_at = CURRENT_TIMESTAMP, repair_version = 'v2.1',
                    repair_notes = ?
                WHERE id = ?;
                """,
                (
                    new_band,
                    f"ELO band recalculation: difficulty_band updated ({old_band}->{new_band}) based on ELO score {score} and target exam {exam}",
                    q_id
                )
            )
            updated_count += 1
            change_key = (old_band, new_band)
            band_changes[change_key] = band_changes.get(change_key, 0) + 1
            
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("PHASE 4: DIFFICULTY BAND RECALCULATION COMPLETE!")
    print("="*50)
    print(f"Total questions processed: {len(questions)}")
    print(f"Total band updates made:    {updated_count}")
    
    if updated_count > 0:
        print("\n--- Detailed Band Transitions ---")
        for (old, new), cnt in sorted(band_changes.items(), key=lambda x: x[1], reverse=True):
            print(f"`{old}` -> `{new}` : {cnt} questions")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
