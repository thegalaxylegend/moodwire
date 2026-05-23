import json

with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
    tax = json.load(f)

for item in tax:
    print(f"ID: {item['id']:<30} | Exam: {item['exam']:<12} | Class: {item['class']:<3} | Subject: {item['subject']:<12} | Topic: {item['topic']} | Chapter: {item['chapter']}")
