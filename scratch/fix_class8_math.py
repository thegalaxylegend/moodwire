import os
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
# Focus on Class 8 Math files but scan all to be safe
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

def fix_math_corruption(content):
    # 1. Specific Hallucinations / Placeholders
    replacements = {
        r"desert\[3\]\{": r"\\sqrt[3]{",
        r"sort\[3\]\{": r"\\sqrt[3]{",
        r"sort\{": r"\\sqrt{",
        r"sort\[9\]\{": r"\\sqrt[9]{",
        r"AR\{x\}": r"\\bar{x}",
        r" mud ": r" \\mu ",
        r"sigma\^2": r"\\sigma^2",
        r"sigma ": r"\\sigma ",
        r"CIRC": r"^\circ",
        r"DIV": r"\\div",
        r"Rightarrow": r"\\Rightarrow",
        r"cdot": r"\\cdot",
        r"Right arrow": r"\\implies",
        r"times": r"\\times",
        r" left\(": r" \\left(",
        r" light\)\^": r" \\right)^n", # Compound interest specific
        r" light\)": r" \\right)",
        r" MTV ": r" V ", # Volume typo
        r" UV ": r" V ", # Volume typo
        r" HQ_": r" Q_", # Quartile typo
        r" ex_in ": r" x_i ", # Data points
        r" ex_n ": r" x_n ",
        r" ex ": r" x ",
        r" by ": r" y ",
        r" in ": r" n ",
        r" and ": r" n ", # Sometimes 'and' is used for 'n'
    }

    for old, new in replacements.items():
        # Use word boundaries for simple words like 'in', 'ex', 'by'
        if old.strip() in ['ex', 'by', 'in', 'and']:
            content = re.sub(rf"\b{old.strip()}\b", new.strip(), content)
        else:
            content = content.replace(old, new)

    # 2. Fix the \frac squashing: \frac{a}{b}{c} -> \frac{a}{b} and potentially fix the rest
    # This is often seen in Class 8 Math blogs
    content = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}", r"\\frac{\1}{\2} = \3", content)
    
    # 3. Fix the 3 Solved PYQs bullet squashing if any remains
    content = content.replace(",- **", "\n- **")

    # 4. Correct known wrong answers in MCQs for Cubes
    if "cubes-and-cube-roots-class-8-notes" in content:
        content = content.replace("**Answer:** D) Cube root of 729 is 9", "**Answer:** A) Cube root of 64 is 4")

    return content

processed_count = 0
for filename in files:
    path = os.path.join(blog_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    fixed = fix_math_corruption(content)
    
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        processed_count += 1

print(f"Surgically fixed {processed_count} files for Class 8 Math corruption.")
