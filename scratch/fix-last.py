import sqlite3
import glob
import json

db = glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')[0]
conn = sqlite3.connect(db)
cursor = conn.cursor()

cursor.execute("BEGIN TRANSACTION;")
row = cursor.execute('SELECT solution_steps FROM questions WHERE id="03323cde3c15b9adfaa9e56a42e0e5ce"').fetchone()
if row:
    steps = json.loads(row[0])
    steps[1] = "Step 2: Substitute $x = 4$ into the derivative to find the rate of change of $y$ with respect to $x$."
    cursor.execute('UPDATE questions SET solution_steps = ? WHERE id="03323cde3c15b9adfaa9e56a42e0e5ce"', (json.dumps(steps),))
    
conn.commit()
conn.close()
print("Successfully fixed the final LaTeX balancing issue in ID 03323cde3c15b9adfaa9e56a42e0e5ce!")
