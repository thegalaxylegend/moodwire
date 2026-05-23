import json

def main():
    with open("scratch/taxonomy.json", "r", encoding="utf-8") as f:
        tax_data = json.load(f)
        
    print(f"Total entries in taxonomy: {len(tax_data)}")
    
    classes = set()
    exams = set()
    subjects = set()
    chapters = set()
    topics = set()
    
    for item in tax_data:
        classes.add(item.get("class"))
        exams.add(item.get("exam"))
        subjects.add(item.get("subject"))
        chapters.add(item.get("chapter"))
        topics.add(item.get("topic"))
        
    print("Classes in taxonomy:", sorted(list(classes)))
    print("Exams in taxonomy:", sorted(list(exams)))
    print("Subjects in taxonomy:", sorted(list(subjects)))
    print(f"Distinct Chapters: {len(chapters)}")
    print(f"Distinct Topics: {len(topics)}")
    
    # Print exam-subject combinations
    combos = {}
    for item in tax_data:
        k = (item.get("exam"), item.get("class"), item.get("subject"))
        combos[k] = combos.get(k, 0) + 1
        
    print("\nCombinations of (exam, class, subject) in taxonomy:")
    for k, v in sorted(combos.items()):
        print(f"Exam: {k[0]:<12} | Class: {k[1]:<5} | Subject: {k[2]:<12} | Chapters Count: {v}")

if __name__ == "__main__":
    main()
