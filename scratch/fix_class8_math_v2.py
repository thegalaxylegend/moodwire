import os
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

def fix_math_corruption(content):
    # 1. Specific Hallucinations / Placeholders (Literal replacements first)
    literals = {
        "desert[3]{": "\\sqrt[3]{",
        "sort[3]{": "\\sqrt[3]{",
        "sort{": "\\sqrt{",
        "sort[9]{": "\\sqrt[9]{",
        "AR{x}": "\\bar{x}",
        "CIRC": "^\\circ",
        "DIV": "\\div",
        "Rightarrow": "\\Rightarrow",
        "Right arrow": "\\implies",
    }
    
    for old, new in literals.items():
        content = content.replace(old, new)

    # 2. Case Mangled / Typoed Commands
    content = content.replace(" mud ", " \\mu ")
    content = content.replace("sigma^2", "\\sigma^2")
    content = content.replace("sigma ", "\\sigma ")
    content = content.replace(" cdot ", " \\cdot ")
    content = content.replace(" times ", " \\times ")
    
    # 3. Compound Interest / Braces
    content = content.replace(" left(", " \\left(")
    content = re.sub(r" light\)\^", r" \\right)^n", content)
    content = content.replace(" light)", " \\right)")

    # 4. Correct word boundary replacements (Surgical)
    # Only replace 'ex', 'by', 'in' if they look like variables in a math context
    # Usually they are surrounded by spaces or math delimiters
    content = re.sub(r"\bex\b", "x", content)
    content = re.sub(r"\bby\b", "y", content)
    content = re.sub(r"\bin\b", "n", content)
    # Be VERY careful with 'and'. Only replace if it's 'and = ' or 'and is' in a formula bank context
    content = re.sub(r"and\s+and", "n", content) # Fix the previous mistake
    
    # 5. Fix \frac squashing: \frac{a}{b}{c} -> \frac{a}{b} = c
    content = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}", r"\\frac{\1}{\2} = \3", content)
    
    # 6. Deduplicate sections that might have been doubled by previous runs
    content = re.sub(r",- \*\*", "\n- **", content)

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

print(f"Refined surgical fix applied to {processed_count} files.")
