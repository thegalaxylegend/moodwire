import sqlite3
import json
import os
import glob

def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        db_files = [f for f in files if "metadata" not in f]
    if not db_files:
        raise FileNotFoundError("Could not locate local SQLite D1 file.")
    db_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    return db_files[0]

def main():
    db_path = find_db()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # All ELO bands in order
    elo_bands = [
        'CLASS_8_RECALL',
        'CLASS_9_BASIC',
        'BOARD_EASY',
        'BOARD_HARD',
        'NEET_EASY',
        'JEE_MAINS_EASY',
        'NEET_MEDIUM',
        'JEE_MAINS_MEDIUM',
        'NEET_HARD',
        'JEE_MAINS_HARD',
        'JEE_ADV_EASY',
        'JEE_ADV_MEDIUM',
        'JEE_ADV_HARD',
        'JEE_ADV_EXPERT'
    ]
    
    md_lines = [
        "# 📚 Sample Questions Across All 14 ELO Difficulty Bands",
        "",
        "This document contains 3 sample approved questions (`quality_tier = 'B'`) for each ELO difficulty band in the ExamCompass database.",
        ""
    ]
    
    for band in elo_bands:
        # Fetch 3 questions of this band
        query = """
            SELECT id, exam, class, subject, difficulty_band, difficulty_score, type, question_text, options, correct_answer, explanation 
            FROM questions 
            WHERE difficulty_band = ? AND quality_tier = 'B'
            LIMIT 3
        """
        rows = cursor.execute(query, (band,)).fetchall()
        
        md_lines.extend([
            f"## ⚡ ELO Band: `{band}`",
            f"Questions found: **{len(rows)}**",
            ""
        ])
        
        if not rows:
            md_lines.append("*No approved questions found in this band.* \n")
            continue
            
        for idx, row in enumerate(rows):
            options_str = ""
            try:
                options = json.loads(row['options'])
                if isinstance(options, list) and options:
                    options_str = "\n".join(f"- **{chr(65+i)}**: {opt}" for i, opt in enumerate(options))
            except Exception:
                options_str = str(row['options'])
                
            md_lines.extend([
                f"### Question {idx + 1} (ID: `{row['id']}`)",
                f"- **Subject**: {row['subject']}",
                f"- **Exam**: {row['exam']}",
                f"- **Class**: Class {row['class']}",
                f"- **Type**: {row['type']}",
                f"- **ELO Score**: {row['difficulty_score']}",
                "",
                "**Question Text**:",
                f"{row['question_text']}",
                ""
            ])
            
            if options_str:
                md_lines.extend([
                    "**Options**:",
                    options_str,
                    ""
                ])
                
            md_lines.extend([
                f"**Correct Answer**: `{row['correct_answer']}`",
                "",
                "**Explanation**:",
                f"{row['explanation']}",
                "",
                "---",
                ""
            ])
            
    conn.close()
    
    out_path = os.path.join("scratch", "sample_elo_questions.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))
    print(f"Sample questions written to: {out_path}")

if __name__ == "__main__":
    main()
