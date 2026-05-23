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

def escape_sql_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "1" if val else "0"
    # String types
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def main():
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get columns dynamically
    cursor.execute("PRAGMA table_info(questions);")
    columns = [row[1] for row in cursor.fetchall()]
    cols_str = ", ".join(columns)
    
    # Fetch all records sorted by id for stable output ordering
    cursor.execute(f"SELECT {cols_str} FROM questions ORDER BY id ASC;")
    rows = cursor.fetchall()
    print(f"Fetched {len(rows)} questions from local SQLite database.")
    
    insert_statements = []
    for row in rows:
        escaped_vals = [escape_sql_value(v) for v in row]
        vals_str = ", ".join(escaped_vals)
        stmt = f"INSERT OR IGNORE INTO questions ({cols_str}) VALUES ({vals_str});"
        insert_statements.append(stmt)
        
    conn.close()
    
    # Write back to scripts/seed.sql
    SEED_FILE = "scripts/seed.sql"
    print(f"Writing all insert statements to {SEED_FILE}...")
    header = "-- ExamCompass D1 Seed v2.1\n-- Regenerated from canonical local SQLite database\n\n"
    seed_output = header + "\n".join(insert_statements) + "\n"
    
    os.makedirs(os.path.dirname(SEED_FILE), exist_ok=True)
    with open(SEED_FILE, 'w', encoding='utf-8') as f:
        f.write(seed_output)
        
    # Split into chunks of 500 questions each
    CHUNK_DIR = "scratch/d1-chunks"
    print(f"Regenerating SQL chunks in {CHUNK_DIR}...")
    os.makedirs(CHUNK_DIR, exist_ok=True)
    
    # Delete existing chunks first to prevent leftover files
    old_chunks = glob.glob(os.path.join(CHUNK_DIR, "chunk_*.sql"))
    for oc in old_chunks:
        os.remove(oc)
        
    CHUNK_SIZE = 500
    for i in range(0, len(insert_statements), CHUNK_SIZE):
        chunk_list = insert_statements[i:i + CHUNK_SIZE]
        chunk_file = os.path.join(CHUNK_DIR, f"chunk_{str(i//CHUNK_SIZE).zfill(4)}.sql")
        chunk_sql = "\n".join(chunk_list) + "\n"
        with open(chunk_file, 'w', encoding='utf-8') as f:
            f.write(chunk_sql)
            
    # Reset local upload progress trackers
    for progress_file in ["d1-upload-progress-local.json", "d1-upload-progress-remote.json"]:
        p_path = os.path.join("scratch", progress_file)
        if os.path.exists(p_path):
            os.remove(p_path)
            print(f"Deleted upload progress tracker: {p_path}")
            
    print("\n" + "="*50)
    print("PHASE 6: MASTER SEED & CHUNKS SYNCHRONIZATION COMPLETE!")
    print("="*50)
    print(f"Total SQL rows written:  {len(rows)}")
    print(f"Total chunk files split: {((len(rows)-1)//CHUNK_SIZE) + 1}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
