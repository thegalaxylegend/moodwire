import sqlite3
import glob
import os
import json

db = glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite')[0]
conn = sqlite3.connect(db)
cursor = conn.cursor()

db_topic_ids = [row[0] for row in cursor.execute("SELECT DISTINCT primary_topic_id FROM questions;").fetchall()]
conn.close()

with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
    tax_data = json.load(f)
tax_ids = [item['id'] for item in tax_data]

print(f"Total distinct primary_topic_ids in DB: {len(db_topic_ids)}")
print(f"Total IDs in taxonomy.json: {len(tax_ids)}")

intersection = set(db_topic_ids).intersection(set(tax_ids))
print(f"Direct overlap: {len(intersection)}")

print("\nSample 10 DB Topic IDs:")
print(db_topic_ids[:10])

print("\nSample 10 Taxonomy IDs:")
print(tax_ids[:10])
