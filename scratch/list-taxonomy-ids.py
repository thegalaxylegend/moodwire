import json

with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
    tax = json.load(f)

for exam in sorted(list(set(item['exam'] for item in tax))):
    print(f"\n--- Exam: {exam} ---")
    sub_items = [item for item in tax if item['exam'] == exam]
    for item in sub_items[:10]:
        print(f"ID: {item['id']:<30} | Class: {item['class']:<3} | Subject: {item['subject']:<12} | Topic: {item['topic']}")
