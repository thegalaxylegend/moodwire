import os
import re

blog_dir = r"c:\Users\Admin\Downloads\Desktop\src\content\blogs"
files = [f for f in os.listdir(blog_dir) if f.endswith(".md")]

def polish_content(content):
    # 1. Restore 'and' where it was accidentally replaced by 'n'
    # Pattern: word + ' n ' + word
    content = re.sub(r"([a-zA-Z])\s+n\s+([a-zA-Z])", r"\1 and \2", content)
    
    # 2. Fix 'n n' duplication
    content = content.replace("n n ", "n ")
    
    # 3. Fix math symbols that missed backslashes
    content = content.replace(" mu ", " \\mu ")
    content = content.replace(" sigma ", " \\sigma ")
    content = content.replace(" alpha ", " \\alpha ")
    content = content.replace(" beta ", " \\beta ")
    
    # 4. Fix double backslashes in \times or other commands if they occurred
    content = content.replace("\\\\\\times", "\\times")
    content = content.replace("\\\\times", "\\times")
    
    # 5. Fix common typos
    content = content.replace(" n proportion", " in proportion")
    content = content.replace(" n value", " in value")
    content = content.replace(" n the data set", " in the data set")

    return content

processed_count = 0
for filename in files:
    path = os.path.join(blog_dir, filename)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    fixed = polish_content(content)
    
    if fixed != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fixed)
        processed_count += 1

print(f"Final polish applied to {processed_count} files.")
