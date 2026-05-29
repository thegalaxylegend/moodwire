import sqlite3
import os

db_path = r"c:\Users\Admin\Downloads\Desktop\.wrangler\state\v3\d1\miniflare-D1DatabaseObject\32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"

print(f"Checking local wrangler sqlite file: {db_path}")
if not os.path.exists(db_path):
    print("❌ File does not exist!")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print("Tables found:", ", ".join(tables))
    
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"Table '{t}': {count} rows")
        
    conn.close()
except Exception as e:
    print("❌ Error reading sqlite file:", str(e))
