import sqlite3
import glob
import json

db = glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')[0]
conn = sqlite3.connect(db)
steps = conn.cursor().execute('SELECT solution_steps FROM questions WHERE id="03323cde3c15b9adfaa9e56a42e0e5ce"').fetchone()[0]
step2 = json.loads(steps)[1]
print("Step 2 string:", repr(step2))
for idx, char in enumerate(step2):
    if char == '$':
        print(f"Found $ at index {idx}, context: ...{step2[max(0, idx-10):idx]} ${step2[idx+1:idx+11]}...")
conn.close()
