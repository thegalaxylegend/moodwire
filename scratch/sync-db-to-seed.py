import sqlite3
import json
import os
import glob
import re

SEED_FILE = "scripts/seed.sql"
CHUNK_DIR = "scratch/d1-chunks"

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

def parse_sql_values(val_part):
    tokens = []
    in_str = False
    current = []
    was_str = False
    i = 0
    while i < len(val_part):
        char = val_part[i]
        if in_str:
            if char == "'":
                if i + 1 < len(val_part) and val_part[i+1] == "'":
                    current.append("'")
                    i += 1
                else:
                    in_str = False
            else:
                current.append(char)
        else:
            if char == "'":
                in_str = True
                was_str = True
            elif char == ",":
                val = "".join(current).strip()
                tokens.append((was_str, val))
                current = []
                was_str = False
            elif char in (' ', '\n', '\t', '('):
                if current:
                    current.append(char)
            elif char == ')':
                pass
            else:
                current.append(char)
        i += 1
    val = "".join(current).strip()
    tokens.append((was_str, val))
    
    processed = []
    for was_str, val in tokens:
        if was_str:
            processed.append(val)
        else:
            val_lower = val.lower()
            if val_lower == 'null' or val == '':
                processed.append(None)
            else:
                try:
                    if '.' in val:
                        processed.append(float(val))
                    else:
                        processed.append(int(val))
                except ValueError:
                    processed.append(val)
    return processed

def escape_sql_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, str):
        escaped = val.replace("'", "''")
        return f"'{escaped}'"
    if isinstance(val, bool):
        return "1" if val else "0"
    return str(val)

def main():
    # 1. Fetch updates from local SQLite DB
    db_path = find_db()
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    db_questions = cursor.execute("SELECT id, quality_tier, verified, explanation FROM questions;").fetchall()
    conn.close()
    
    print(f"Loaded {len(db_questions)} questions from local SQLite database.")
    
    db_map = {}
    for q_id, tier, verified, exp in db_questions:
        db_map[q_id] = {
            "quality_tier": tier,
            "verified": verified,
            "explanation": exp
        }
        
    # 2. Read master seed.sql or chunks
    print(f"Reading master seed: {SEED_FILE}...")
    if not os.path.exists(SEED_FILE) or os.path.getsize(SEED_FILE) == 0:
        print("Master seed file is empty of INSERT statements. Rebuilding from chunks in scratch/d1-chunks...")
        chunk_files = sorted(glob.glob(os.path.join(CHUNK_DIR, "chunk_*.sql")))
        if not chunk_files:
            raise FileNotFoundError("Could not find chunk files to reconstruct the seed file.")
            
        print(f"Found {len(chunk_files)} chunk files to concatenate.")
        chunk_contents = []
        for cf in chunk_files:
            with open(cf, 'r', encoding='utf-8') as f_cf:
                chunk_contents.append(f_cf.read())
        
        content = "\n".join(chunk_contents)
        content = content.replace('\x00', '')
        header = "-- ExamCompass D1 Seed v2\n-- Reconstructed from chunks\n\n"
    else:
        with open(SEED_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('\x00', '')
        
        separator = 'INSERT OR IGNORE INTO questions ('
        if separator not in content:
            raise ValueError(f"Could not find insert statements with '{separator}' in seed.sql")
            
        parts = content.split(separator)
        header = parts[0]
        
    parts = content.split('INSERT OR IGNORE INTO questions (')
    rows = []
    failed_parses = 0
    print(f"Parsing {len(parts)-1} SQL statements...")
    
    for idx, part in enumerate(parts[1:]):
        last_idx = part.rfind(');')
        if last_idx != -1:
            part_clean = part[:last_idx + 2].strip()
        else:
            part_clean = part.strip()
            
        stmt = 'INSERT OR IGNORE INTO questions (' + part_clean
        
        val_idx = stmt.find('VALUES')
        if val_idx == -1:
            val_idx = stmt.find('values')
        if val_idx == -1:
            failed_parses += 1
            continue
            
        col_part = stmt[len('INSERT OR IGNORE INTO questions ('):val_idx].strip()
        if col_part.endswith(')'):
            col_part = col_part[:-1].strip()
            
        val_part = stmt[val_idx + 6:].strip()
        if val_part.endswith(';'):
            val_part = val_part[:-1].strip()
        if val_part.startswith('(') and val_part.endswith(')'):
            val_part = val_part[1:-1].strip()
            
        vals = parse_sql_values(val_part)
        
        col_part_clean = col_part.replace('\n', ' ').replace('\r', ' ')
        cols = [c.strip() for c in col_part_clean.split(',') if c.strip()]
        
        if not vals or len(vals) != len(cols):
            failed_parses += 1
            continue
            
        rows.append({
            "cols": cols,
            "cols_str": col_part,
            "values": vals,
            "index": idx
        })
        
    print(f"Successfully parsed {len(rows)} SQL statements. Failed: {failed_parses}")
    
    # 3. Align parsed SQL rows with DB states
    synced_count = 0
    repaired_statements = []
    
    for r in rows:
        cols_str = r["cols_str"]
        vals = r["values"][:]
        col_to_idx = {col: i for i, col in enumerate(r["cols"])}
        
        def get_val(name):
            if name in col_to_idx:
                return vals[col_to_idx[name]]
            return None
            
        def set_val(name, value):
            if name in col_to_idx:
                vals[col_to_idx[name]] = value
                
        q_id = get_val("id")
        
        if q_id in db_map:
            db_state = db_map[q_id]
            # Get current values in SQL statement
            sql_tier = get_val("quality_tier")
            sql_verified = get_val("verified")
            sql_explanation = get_val("explanation")
            
            # If there's a difference, update
            if (sql_tier != db_state["quality_tier"] or 
                sql_verified != db_state["verified"] or 
                sql_explanation != db_state["explanation"]):
                
                set_val("quality_tier", db_state["quality_tier"])
                set_val("verified", db_state["verified"])
                set_val("explanation", db_state["explanation"])
                synced_count += 1
                
        escaped_vals = [escape_sql_value(v) for v in vals]
        stmt = f"INSERT OR IGNORE INTO questions ({cols_str}) VALUES ({', '.join(escaped_vals)});"
        repaired_statements.append(stmt)
        
    print(f"Synchronized {synced_count} statements with SQLite database changes.")
    
    # Write back seed.sql
    print(f"Writing updated SQL back to {SEED_FILE}...")
    seed_output = header + "\n" + "\n".join(repaired_statements) + "\n"
    with open(SEED_FILE, 'w', encoding='utf-8') as f:
        f.write(seed_output)
        
    # Split into chunks of 500
    print(f"Regenerating chunks in {CHUNK_DIR}...")
    os.makedirs(CHUNK_DIR, exist_ok=True)
    
    CHUNK_SIZE = 500
    chunks = []
    for i in range(0, len(repaired_statements), CHUNK_SIZE):
        chunks.append(repaired_statements[i:i + CHUNK_SIZE])
        
    for i, chunk_list in enumerate(chunks):
        chunk_file = os.path.join(CHUNK_DIR, f"chunk_{str(i).zfill(4)}.sql")
        chunk_sql = "\n".join(chunk_list) + "\n"
        with open(chunk_file, 'w', encoding='utf-8') as f:
            f.write(chunk_sql)
            
    # Reset local upload progress so next wrangler upload uploads fresh chunks
    for progress_file in ["d1-upload-progress-local.json", "d1-upload-progress-remote.json"]:
        p_path = os.path.join("scratch", progress_file)
        if os.path.exists(p_path):
            os.remove(p_path)
            print(f"Deleted upload progress tracker: {p_path}")
            
    print("\n" + "="*50)
    print("SQL AND CHUNK DATABASE SYNCHRONIZATION COMPLETE!")
    print("="*50)
    print(f"Total SQL rows:        {len(rows)}")
    print(f"Synced updates:        {synced_count}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
