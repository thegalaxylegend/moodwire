import os
import random
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]
random.seed(42) # For reproducibility
selected_files = random.sample(files, 30)

corruption_patterns = [
    r"\\left\(\$\s*\\frac",
    r"\}\s*\$\s*\\frac",
    r"\\frac\{\{[^}]*\}\{[^}]*\}\{[^}]*\}", # Triple braces
    r"\d+k\s*\+\s*\d+\s*=\s*\d+\d+k\s*\+\s*\d+\s*=\s*\d+", # Repeated equations
    r"\\begin\{aligned\}[\s\S]*?\\begin\{aligned\}", # Nested or squashed aligned
    r"\$\s*\\frac\{\{[^}]*\}\{[^}]*\}\}", # Double braces with dollar
    r"Solved Yes", # Common hallucination
    r"Suggestion limit reached",
]

report = []

for filename in selected_files:
    path = os.path.join(blog_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    issues = []
    for pattern in corruption_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            issues.append(f"{pattern}: {len(matches)}")
    
    if issues:
        report.append(f"File: {filename}\nIssues: {', '.join(issues)}\n")

with open("corruption_report.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report))

print(f"Scanned 30 files. Found issues in {len(report)} files.")
