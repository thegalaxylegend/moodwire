import os
import random
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

# Target files
target_files = ["3d-geometry-intro-class-11-revision-notes-jee-neet.md"]
remaining_count = 29
random.seed(42)
selected = random.sample([f for f in files if f not in target_files], remaining_count)
target_files.extend(selected)

def clean_latex(text):
    # Fix mashed frac: \frac{{x_1+x_2}{2}, } -> \frac{x_1+x_2}{2}
    text = re.sub(r"\\frac\{\{([^}]*)\}\{([^}]*)\}[^}]*\}", r"\\frac{\1}{\2}", text)
    # Fix mashed midpoint: \left(\frac{{x_1+x_2}{2}, }{\right) -> \left(\frac{x_1+x_2}{2}\right)
    text = re.sub(r"\\left\(\\frac\{([^}]*)\}\{([^}]*)\}[^}]*\}\s*,?\s*\{\\right\)", r"\\left(\\frac{\1}{\2}\\right)", text)
    text = re.sub(r"\\left\(\\frac\{([^}]*)\}\{([^}]*)\}[^}]*\}\s*,?\s*\\right\)", r"\\left(\\frac{\1}{\2}\\right)", text)
    
    # Fix leading/trailing garbage in formulas
    text = re.sub(r"\}\s*(\$?)\\frac", r"\1\\frac", text)
    text = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}\}", r"\\frac{\1}{\2}", text)
    
    return text

def fix_content(content):
    # 1. Basic Hallucinations/Artifacts
    content = content.replace("Solved Yes", "Solved PYQs")
    content = content.replace("(suggestion limit reached)", "")
    
    # 2. Case-mangled or typoed LaTeX commands
    replacements = {
        r"\\franc": r"\\frac",
        r"\\GEQ": r"\\geq",
        r"\\LEQ": r"\\leq",
        r"or_n": r"r_n",
        r"or_H": r"R_H",
        r"OR_H": r"R_H",
        r"OR_HE": r"R_{He}",
        r"in=": r"n=",
        r"in^": r"n^",
        r"in_": r"n_",
    }
    
    for old, new in replacements.items():
        content = re.sub(old, new, content)

    # 3. Structural Cleaning
    content = clean_latex(content)
    
    # 4. Remove planning artifacts (looking for lists of rules or "Concept 1")
    # In 3d-geometry, there's a block from line 345 to 424.
    # It starts with "*   Topic: 3D Geometry" and ends near "### Core Concepts"
    content = re.sub(r"\*   Topic:[\s\S]*?### Core Concepts", "### Core Concepts", content)

    # 5. Deduplicate common footer sections
    lines = content.split('\n')
    new_lines = []
    seen_headers = set()
    
    for line in lines:
        if line.startswith('## ') or line.startswith('### '):
            header = line.strip().lower()
            if header in seen_headers:
                if any(x in header for x in ["related topics", "ready to ace", "table of contents"]):
                    continue
            seen_headers.add(header)
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # Final sweep for specific 3D geometry mess
    content = content.replace(r"\left(\frac{{x_1+x_2}{2}, }{\right)", r"\left(\frac{x_1+x_2}{2}\right)")
    content = content.replace(r"}\frac{y_1+y_2}{2}$, $\frac{z_1+z_2}{2}(", r"\left(\frac{y_1+y_2}{2}, \frac{z_1+z_2}{2}\right)(")

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
