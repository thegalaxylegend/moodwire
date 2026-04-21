import os
import random
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

# Include the 3d-geometry file specifically because it's highly corrupted
target_files = ["3d-geometry-intro-class-11-revision-notes-jee-neet.md"]
remaining_count = 29
random.seed(42)
selected = random.sample([f for f in files if f not in target_files], remaining_count)
target_files.extend(selected)

def fix_content(content):
    # 1. Basic Hallucinations/Artifacts
    content = content.replace("Solved Yes", "Solved PYQs")
    content = content.replace("(suggestion limit reached)", "")
    
    # 2. Case-mangled or typoed LaTeX commands
    replacements = {
        r"\\franc": r"\\frac",
        r"\\GEQ": r"\\geq",
        r"\\LEQ": r"\\leq",
        r"\\delta E": r"\\Delta E",
        r"\\delta x": r"\\Delta x",
        r"\\delta p": r"\\Delta p",
        r"\\delta t": r"\\Delta t",
        r"\\delta": r"\\Delta", # Dangerous but often intended as Delta in this context
        r"or_n": r"r_n", # Radius often mangled to or_n
        r"or_H": r"R_H", # Rydberg constant
        r"OR_H": r"R_H",
        r"OR_HE": r"R_{He}",
        r"in=": r"n=", # n= orbit often mangled to in=
        r"in^": r"n^",
        r"in_": r"n_",
    }
    
    for old, new in replacements.items():
        content = re.sub(old, new, content)

    # 3. Broken LaTeX structural patterns
    content = re.sub(r"\\left\(\$\s*\\frac", r"\\left(\\frac", content)
    content = re.sub(r"\}\s*\$\s*\\frac", r"}\\frac", content)
    
    # Fix the weird double brace squashing: \frac{{a}{b}} -> \frac{a}{b}
    content = re.sub(r"\\frac\{\{([^}]*)\}\{([^}]*)\}\}", r"\\frac{\1}{\2}", content)
    
    # Fix triple brace squashing if any
    content = re.sub(r"\\frac\{\{([^}]*)\}\{([^}]*)\}\}\{([^}]*)\}", r"\\frac{\1}{\2}", content)

    # Fix aligned block mangling
    content = re.sub(r"\\end\{aligned\}\s*\\begin\{aligned\}", r"\\\\\n", content)

    # 4. Deduplicate Sections (common in these blogs)
    lines = content.split('\n')
    new_lines = []
    seen_headers = set()
    in_related_topics = False
    
    for line in lines:
        if line.startswith('## ') or line.startswith('### '):
            header = line.strip().lower()
            if header in seen_headers:
                # If it's a common section that gets repeated at the end, skip it
                if "related topics" in header or "ready to ace" in header:
                    continue
            seen_headers.add(header)
        new_lines.append(line)
    
    content = '\n'.join(new_lines)

    # 5. Fix Practice Link consistency if needed (optional but good)
    # content = re.sub(r"practice_link: \"/class-11/physics/(.*)\"", r"practice_link: \"/class-12/physics/\1\"", content) 

    return content

processed_count = 0
for filename in target_files:
    path = os.path.join(blog_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    fixed = fix_content(content)
    
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        processed_count += 1

print(f"Fixed {processed_count} files out of {len(target_files)} selected.")
