import os
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

def clean_latex(text):
    # 1. Fix mashed frac: \frac{{x_1+x_2}{2}, } -> \frac{x_1+x_2}{2}
    # This regex looks for double braces and ignores trailing garbage
    text = re.sub(r"\\frac\{\{([^}]*)\}\{([^}]*)\}[^}]*\}", r"\\frac{\1}{\2}", text)
    
    # 2. Fix balanced delimiters: \left( ... \right)
    # Sometimes LLM forgets backslash for right: {\right) -> \right)
    text = re.sub(r"\{\\right\)", r"\\right)", text)
    
    # 3. Fix squashed midpoint: \left(\frac{a}{b}{\right) -> \left(\frac{a}{b}\right)
    text = re.sub(r"\\left\(\\frac\{([^}]*)\}\{([^}]*)\}[^}]*\}\s*\\right\)", r"\\left(\\frac{\1}{\2}\\right)", text)

    # 4. Fix leading/trailing garbage in formulas
    text = re.sub(r"\}\s*(\$?)\\frac", r"\1\\frac", text)
    
    # 5. Fix double brace squashing: \frac{{a}{b}} -> \frac{a}{b}
    text = re.sub(r"\\frac\{\{([^}]*)\}\{([^}]*)\}\}", r"\\frac{\1}{\2}", text)
    
    return text

def fix_content(content):
    # 1. Basic Hallucinations/Artifacts
    content = content.replace("Solved Yes", "Solved PYQs")
    content = content.replace("(suggestion limit reached)", "")
    
    # 2. Command Normalization (Surgical)
    # Use word boundaries or specific patterns to avoid over-matching
    content = content.replace("\\franc", "\\frac")
    content = content.replace("\\GEQ", "\\geq")
    content = content.replace("\\LEQ", "\\leq")
    content = content.replace("or_n", "r_n")
    content = content.replace("or_H", "R_H")
    content = content.replace("OR_H", "R_H")
    content = content.replace("OR_HE", "R_{He}")
    
    # Physics/Chemistry specific mangling
    content = re.sub(r"\bin\s*=\s*", "n = ", content) # n = principal quantum number
    content = re.sub(r"\bin_([a-zA-Z0-9])", r"n_\1", content)
    content = re.sub(r"\bin\^", "n^", content)
    
    # Fix the \delta vs \Delta (usually \Delta E is intended for change)
    # But only if followed by a capital letter or common variable
    content = re.sub(r"\\delta\s+([E|P|V|T|X|M])", r"\\Delta \1", content)
    content = re.sub(r"\\delta([E|P|V|T|X|M])", r"\\Delta \1", content)

    # 3. Structural Cleaning
    content = clean_latex(content)
    
    # 4. Remove planning artifacts
    content = re.sub(r"\*   Topic:[\s\S]*?### Core Concepts", "### Core Concepts", content)

    # 5. Deduplicate common footer sections
    lines = content.split('\n')
    new_lines = []
    seen_headers = set()
    
    for line in lines:
        if line.startswith('## ') or line.startswith('### '):
            header = line.strip().lower()
            if "table of contents" in header: # Always allow one TOC
                 pass
            elif header in seen_headers:
                if any(x in header for x in ["related topics", "ready to ace", "last 5 minutes", "practice mcqs"]):
                    continue
            seen_headers.add(header)
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # Final sweep for specific 3D geometry mess
    content = content.replace(r"\left(\frac{x_1+x_2}{2}{\right)", r"\left(\frac{x_1+x_2}{2}\right)")
    content = content.replace(r"}\frac{y_1+y_2}{2}$, $\frac{z_1+z_2}{2}(", r"\left(\frac{y_1+y_2}{2}, \frac{z_1+z_2}{2}\right)(")

    return content

processed_count = 0
for filename in files:
    path = os.path.join(blog_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    fixed = fix_content(content)
    
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        processed_count += 1

print(f"Fixed {processed_count} files out of {len(files)} total files.")
