import sqlite3
import glob
import os

db = glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')[0]
conn = sqlite3.connect(db)
text = conn.cursor().execute("SELECT question_text FROM questions WHERE id = '5532abf8455189d4d8d099402bc985f1';").fetchone()[0]

idx = -1
while True:
    idx = text.find('Cl', idx + 1)
    if idx == -1:
        break
    print(f"idx={idx}: {repr(text[idx:idx+10])}")
    print([ord(c) for c in text[idx:idx+10]])

conn.close()
