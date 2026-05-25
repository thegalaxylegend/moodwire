import sqlite3
import os
import glob
import re

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

def parse_sql_statements(content):
    # Regex to find each INSERT statement
    separator = 'INSERT OR IGNORE INTO questions ('
    parts = content.split(separator)
    statements = []
    
    for i in range(1, len(parts)):
        stmt = separator + parts[i].strip()
        if stmt.endswith(');'):
            statements.append(stmt)
        else:
            last_index = stmt.lastIndexOf(');')
            if last_index != -1:
                statements.append(stmt[:last_index + 2])
            else:
                # Find trailing ); using regex fallback
                m = re.search(r'\);\s*$', stmt)
                if m:
                    statements.append(stmt)
    return statements

def main():
    db_path = find_db()
    seed_file = "scripts/seed.sql"
    
    if not os.path.exists(seed_file):
        print(f"❌ seed.sql not found at {seed_file}")
        return
        
    print(f"📖 Reading {seed_file}...")
    with open(seed_file, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Clean null bytes
    content = content.replace('\x00', '')
    
    print("Parsing SQL statements...")
    statements = []
    # Find all INSERT INTO or INSERT OR IGNORE statements
    # Match complete SQL statements ending with );
    matches = re.finditer(r'(INSERT\s+OR\s+IGNORE\s+INTO\s+questions\s+[\s\S]*?\);)', content, re.IGNORECASE)
    for m in matches:
        statements.append(m.group(1))
        
    print(f"📦 Found {len(statements)} INSERT statements.")
    if len(statements) == 0:
        print("Nothing to import.")
        return
        
    print(f"🔗 Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get current count
    cursor.execute("SELECT COUNT(*) FROM questions;")
    before_count = cursor.fetchone()[0]
    print(f"📊 Questions in database before import: {before_count}")
    
    print("Executing batch import inside a transaction...")
    conn.execute("BEGIN TRANSACTION;")
    
    imported = 0
    errors = 0
    for idx, stmt in enumerate(statements):
        try:
            cursor.execute(stmt)
            imported += 1
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"❌ Error at statement {idx}: {str(e)}")
                print(f"Statement: {stmt[:150]}...")
                
    conn.commit()
    
    # Get final count
    cursor.execute("SELECT COUNT(*) FROM questions;")
    after_count = cursor.fetchone()[0]
    conn.close()
    
    print("\n" + "="*50)
    print("SQLITE SEED IMPORT COMPLETE!")
    print("="*50)
    print(f"Questions before: {before_count}")
    print(f"Imported successfully: {imported}")
    print(f"Errors encountered:    {errors}")
    print(f"Questions after:  {after_count}")
    print(f"Net change:       +{after_count - before_count}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
