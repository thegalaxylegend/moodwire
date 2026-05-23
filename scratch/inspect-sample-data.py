import sqlite3
import glob
import os
import json

db = glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')[0]
conn = sqlite3.connect(db)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

rows = cursor.execute("SELECT * FROM questions LIMIT 5;").fetchall()
data = [dict(row) for row in rows]

with open("scratch/sample_inspection.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

conn.close()
print("Exported 5 sample database questions to scratch/sample_inspection.json successfully.")
