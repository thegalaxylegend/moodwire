import sqlite3
import json
import os
import glob
from datetime import datetime

# 1. Locate the wrangler local SQLite database file
def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    # Filter out metadata.sqlite and pick the one with a long hash name (usually largest)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        # Fallback to any sqlite file in that folder if none found
        db_files = [f for f in files if "metadata" not in f]
    
    if not db_files:
        raise FileNotFoundError("Could not locate local SQLite D1 file in .wrangler directories.")
    
    # Return the largest file (the one with questions)
    db_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    return db_files[0]

def make_bar(val, max_val, length=15):
    if max_val == 0:
        return "░" * length
    filled = int(round((val / max_val) * length))
    return "█" * filled + "░" * (length - filled)

def main():
    print("Starting direct Python SQLite Analysis...")
    db_path = find_db()
    print(f"   Found local DB: {db_path} ({os.path.getsize(db_path) / 1024 / 1024:.2f} MB)")
    
    conn = sqlite3.connect(db_path)
    # Enable WAL mode compatibility
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    
    # 1. General Queries
    total_q = cursor.execute("SELECT COUNT(*) FROM questions;").fetchone()[0]
    
    verified_res = cursor.execute("SELECT verified, COUNT(*) FROM questions GROUP BY verified;").fetchall()
    verified_map = {row[0]: row[1] for row in verified_res}
    verified_count = verified_map.get(1, 0)
    
    subject_res = cursor.execute("SELECT subject, COUNT(*) as cnt FROM questions GROUP BY subject ORDER BY cnt DESC;").fetchall()
    exam_res = cursor.execute("SELECT exam, COUNT(*) as cnt FROM questions GROUP BY exam ORDER BY cnt DESC;").fetchall()
    class_res = cursor.execute("SELECT class, COUNT(*) as cnt FROM questions GROUP BY class ORDER BY CAST(class AS INTEGER) ASC;").fetchall()
    type_res = cursor.execute("SELECT type, COUNT(*) as cnt FROM questions GROUP BY type ORDER BY cnt DESC;").fetchall()
    
    # 2. ELO & Band stats
    band_res = cursor.execute("SELECT difficulty_band, COUNT(*) as cnt FROM questions GROUP BY difficulty_band ORDER BY cnt DESC;").fetchall()
    elo_subject = cursor.execute("SELECT subject, MIN(difficulty_score), MAX(difficulty_score), ROUND(AVG(difficulty_score), 1) FROM questions GROUP BY subject;").fetchall()
    elo_exam = cursor.execute("SELECT exam, MIN(difficulty_score), MAX(difficulty_score), ROUND(AVG(difficulty_score), 1) FROM questions GROUP BY exam;").fetchall()
    
    # 3. Quality & Tagging stats
    quality_res = cursor.execute("SELECT quality_tier, COUNT(*) as cnt FROM questions GROUP BY quality_tier ORDER BY cnt DESC;").fetchall()
    pyq_years = cursor.execute("SELECT year, COUNT(*) as cnt FROM questions WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC;").fetchall()
    
    cross_chapter = cursor.execute("SELECT cross_chapter, COUNT(*) FROM questions GROUP BY cross_chapter;").fetchall()
    cross_chapter_map = {row[0]: row[1] for row in cross_chapter}
    cross_chapter_count = cross_chapter_map.get(1, 0)
    
    cross_subject = cursor.execute("SELECT cross_subject, COUNT(*) FROM questions GROUP BY cross_subject;").fetchall()
    cross_subject_map = {row[0]: row[1] for row in cross_subject}
    cross_subject_count = cross_subject_map.get(1, 0)
    
    # 4. Topic question counts
    topic_counts = cursor.execute("SELECT primary_topic, subject, COUNT(*) FROM questions GROUP BY primary_topic, subject;").fetchall()
    topic_count_map = {}
    for row in topic_counts:
        key = f"{row[1].lower()}:{row[0].lower().strip()}"
        topic_count_map[key] = row[2]
        
    conn.close()
    
    # 5. Load Syllabus Taxonomy
    taxonomy_file = os.path.join("scratch", "taxonomy.json")
    if not os.path.exists(taxonomy_file):
        print("   Warning: scratch/taxonomy.json not found. Run export-taxonomy first.")
        taxonomy = []
    else:
        with open(taxonomy_file, "r", encoding="utf-8") as f:
            taxonomy = json.load(f)
            
    # 6. Analyze Coverage
    covered_count = 0
    full_count = 0
    untouched_count = 0
    partial_count = 0
    
    taxonomy_coverage = []
    subject_taxonomy = {}
    
    for node in taxonomy:
        subj = node["subject"]
        topic = node["topic"]
        key = f"{subj.lower()}:{topic.lower().strip()}"
        count = topic_count_map.get(key, 0)
        
        if count >= 10:
            full_count += 1
            covered_count += 1
            status = "✅ Full (10+)"
        elif count > 0:
            partial_count += 1
            covered_count += 1
            status = "⚠️ Partial"
        else:
            untouched_count += 1
            status = "❌ Empty"
            
        taxonomy_coverage.append({
            "class": node["class"],
            "exam": node["exam"],
            "subject": subj,
            "chapter": node["chapter"],
            "topic": topic,
            "current_count": count,
            "status": status
        })
        
        # Group stats by subject
        if subj not in subject_taxonomy:
            subject_taxonomy[subj] = {"total": 0, "covered": 0, "full": 0}
        subject_taxonomy[subj]["total"] += 1
        if count > 0:
            subject_taxonomy[subj]["covered"] += 1
        if count >= 10:
            subject_taxonomy[subj]["full"] += 1
            
    taxonomy_len = len(taxonomy) if len(taxonomy) > 0 else 1
    overall_coverage_pct = (covered_count / taxonomy_len) * 100
    full_coverage_pct = (full_count / taxonomy_len) * 100
    
    empty_chapters = [c for c in taxonomy_coverage if c["current_count"] == 0]
    thin_chapters = [c for c in taxonomy_coverage if 0 < c["current_count"] < 10]
    strong_chapters = [c for c in taxonomy_coverage if c["current_count"] >= 20]
    strong_chapters.sort(key=lambda x: x["current_count"], reverse=True)
    
    # 7. Generate markdown
    max_subject = max([row[1] for row in subject_res]) if subject_res else 1
    max_exam = max([row[1] for row in exam_res]) if exam_res else 1
    max_class = max([row[1] for row in class_res]) if class_res else 1
    max_type = max([row[1] for row in type_res]) if type_res else 1
    max_band = max([row[1] for row in band_res]) if band_res else 1
    
    report_lines = [
        f"# 📊 ExamCompass Local D1 Question Bank Direct Audit",
        "",
        f"Generated on: **{datetime.now().strftime('%d/%m/%Y, %I:%M:%S %p')}**  ",
        f"Database File: **{os.path.basename(db_path)}**  ",
        f"Database Size: **{total_q:,} questions**  ",
        f"Schema: **v2 (ELO-Anchored)**",
        "",
        "---",
        "",
        "## 📈 Executive Summary",
        "",
        "| Metric | Value | Description |",
        "| :--- | :--- | :--- |",
        f"| **Total Question Count** | **{total_q:,}** | Total questions stored in the local SQLite database |",
        f"| **Verified Questions** | **{verified_count:,}** | Checked and confirmed by verifiers/humans |",
        f"| **Syllabus Coverage** | **{overall_coverage_pct:.1f}%** | **{covered_count}/{taxonomy_len}** taxonomy topics have at least 1 question |",
        f"| **Robustly Covered** | **{full_coverage_pct:.1f}%** | **{full_count}/{taxonomy_len}** taxonomy topics have 10+ questions |",
        f"| **Untouched Topics** | **{untouched_count}** | Topics with **zero** questions in the database |",
        "",
        "---",
        "",
        "## 📚 Subject-wise Breakdown",
        "",
        "| Subject | Questions | Percentage | Distribution Visual |",
        "| :--- | :--- | :---: | :--- |"
    ]
    
    for row in subject_res:
        pct = (row[1] / total_q) * 100
        report_lines.append(f"| **{row[0]}** | {row[1]:,} | {pct:.1f}% | `{make_bar(row[1], max_subject)}` |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## 🏆 Exam & Class Target Distribution",
        "",
        "### By Target Exam",
        "| Exam | Questions | Percentage | Distribution Visual |",
        "| :--- | :--- | :---: | :--- |"
    ])
    
    for row in exam_res:
        pct = (row[1] / total_q) * 100
        report_lines.append(f"| **{row[0]}** | {row[1]:,} | {pct:.1f}% | `{make_bar(row[1], max_exam)}` |")
        
    report_lines.extend([
        "",
        "### By Class Level",
        "| Class | Questions | Percentage | Distribution Visual |",
        "| :--- | :--- | :---: | :--- |"
    ])
    
    for row in class_res:
        pct = (row[1] / total_q) * 100
        report_lines.append(f"| **Class {row[0]}** | {row[1]:,} | {pct:.1f}% | `{make_bar(row[1], max_class)}` |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## 🧩 Question Type & Quality Tiers",
        "",
        "### By Format Type",
        "| Question Type | Questions | Percentage | Distribution Visual |",
        "| :--- | :--- | :---: | :--- |"
    ])
    
    for row in type_res:
        pct = (row[1] / total_q) * 100
        report_lines.append(f"| **{row[0]}** | {row[1]:,} | {pct:.1f}% | `{make_bar(row[1], max_type)}` |")
        
    report_lines.extend([
        "",
        "### By Quality Tier",
        "* **S**: Verbatim PYQ (Confirmed 100% Correct)",
        "* **A**: Vetted past exam reference question",
        "* **B**: AI-curated and audited syllabus questions (Verified via 70B verifiers)",
        "* **C**: AI-Generated (Initial raw pass)",
        "* **D**: Unverified",
        "",
        "| Quality Tier | Questions | Percentage | Description |",
        "| :--- | :--- | :---: | :--- |"
    ])
    
    for row in quality_res:
        pct = (row[1] / total_q) * 100
        desc = "Verbatim PYQ" if row[0] == 'S' else "Vetted Reference" if row[0] == 'A' else "Audited Syllabus Curation" if row[0] == 'B' else "AI Raw Curation" if row[0] == 'C' else "Unverified"
        report_lines.append(f"| **Tier {row[0]}** | {row[1]:,} | {pct:.1f}% | {desc} |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## ⚡ ELO difficulty score Distribution",
        "",
        "| Difficulty Band | Questions | Percentage | Distribution Visual |",
        "| :--- | :--- | :---: | :--- |"
    ])
    
    for row in band_res:
        pct = (row[1] / total_q) * 100
        report_lines.append(f"| `{row[0]}` | {row[1]:,} | {pct:.1f}% | `{make_bar(row[1], max_band)}` |")
        
    report_lines.extend([
        "",
        "### ELO Ranges by Subject",
        "| Subject | Min ELO | Max ELO | Average ELO |",
        "| :--- | :---: | :---: | :---: |"
    ])
    
    for row in elo_subject:
        report_lines.append(f"| **{row[0]}** | {row[1]} | {row[2]} | **{row[3]}** |")
        
    report_lines.extend([
        "",
        "### ELO Ranges by Exam Target",
        "| Exam | Min ELO | Max ELO | Average ELO |",
        "| :--- | :---: | :---: | :---: |"
    ])
    
    for row in elo_exam:
        report_lines.append(f"| **{row[0]}** | {row[1]} | {row[2]} | **{row[3]}** |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## 🔗 Multi-Concept Tagging Stats",
        "",
        "| Tag Property | Questions | Percentage | Description |",
        "| :--- | :--- | :---: | :--- |",
        f"| **Cross-Chapter Questions** | {cross_chapter_count:,} | {(cross_chapter_count / total_q * 100):.1f}% | Questions spanning 2+ chapters |",
        f"| **Cross-Subject Questions** | {cross_subject_count:,} | {(cross_subject_count / total_q * 100):.1f}% | Questions combining subjects (e.g. Bio-Chemistry) |",
        "",
        "---",
        "",
        "## 📅 Past Year Questions (PYQs) Coverage by Year",
        f"Total past-year-exam questions cataloged: **{sum([r[1] for r in pyq_years]):,}**",
        "",
        "| Exam Year | Questions | Percentage of PYQ |",
        "| :---: | :--- | :--- |"
    ])
    
    tot_pyq = sum([r[1] for r in pyq_years]) if pyq_years else 1
    for row in pyq_years:
        pct = (row[1] / tot_pyq) * 100
        report_lines.append(f"| **{row[0]}** | {row[1]:,} | {pct:.1f}% |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## 🏫 Curriculum Syllabus Coverage Analysis",
        "",
        "### Coverage Summary by Subject",
        "| Subject | Total Topics | Covered Topics (>=1 Q) | Robust Topics (>=10 Q) | Subject Coverage |",
        "| :--- | :---: | :---: | :---: | :---: |"
    ])
    
    for subj, data in subject_taxonomy.items():
        pct = (data["covered"] / data["total"]) * 100
        report_lines.append(f"| **{subj}** | {data['total']} | {data['covered']} | {data['full']} | **{pct:.1f}%** |")
        
    report_lines.extend([
        "",
        "### 🚨 TOP 15 Empty Topics (Needs Curation Priority)",
        "These chapters have **zero questions** in the local database.",
        "",
        "| Class | Exam | Subject | Chapter / Topic |",
        "| :---: | :---: | :---: | :--- |"
    ])
    
    for c in empty_chapters[:15]:
        report_lines.append(f"| Class {c['class']} | `{c['exam']}` | **{c['subject']}** | {c['chapter']} - *{c['topic']}* |")
        
    report_lines.extend([
        f"\n*Total entirely empty taxonomy topics: **{len(empty_chapters)}** / {taxonomy_len}*",
        "",
        "### ⚠️ TOP 15 Thin Topics (Needs Curation Priority)",
        "These chapters have **1 to 9 questions** in the local database (under-saturated).",
        "",
        "| Class | Exam | Subject | Chapter / Topic | Current Count |",
        "| :---: | :---: | :---: | :--- | :---: |"
    ])
    
    for c in thin_chapters[:15]:
        report_lines.append(f"| Class {c['class']} | `{c['exam']}` | **{c['subject']}** | {c['chapter']} - *{c['topic']}* | **{c['current_count']}** |")
        
    report_lines.extend([
        "",
        "### 🏆 TOP 15 Strongest Topics",
        "These chapters have the highest question density.",
        "",
        "| Class | Exam | Subject | Chapter / Topic | Current Count |",
        "| :---: | :---: | :---: | :--- | :---: |"
    ])
    
    for c in strong_chapters[:15]:
        report_lines.append(f"| Class {c['class']} | `{c['exam']}` | **{c['subject']}** | {c['chapter']} - *{c['topic']}* | **{c['current_count']}** |")
        
    report_lines.extend([
        "",
        "---",
        "",
        "## 💡 Recommendations for Next Generation Cycle",
        "",
        f"1. **Prioritize Empty Topics**: Direct the automated pipeline stubs (`task-1037` / `auto-pipeline.ps1`) to focus on the **{len(empty_chapters)} empty chapters** listed above, specifically targeting Class {empty_chapters[0]['class'] if empty_chapters else '11/12'} {empty_chapters[0]['subject'] if empty_chapters else 'Biology'}.",
        "2. **Backfill Thin Topics**: Set batch filters to focus on subtopics that currently have fewer than 10 questions to ensure reliable student testing.",
        "3. **Upgrade Quality Tiers**: Introduce automated double-verifier cycles for raw Tier C questions to promote them to Tier B (Audited Syllabus Curation).",
        ""
    ])
    
    report_path = os.path.join("scratch", "local_db_analysis_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print("Direct Python Analysis Complete!")
    print(f"   Total local questions: {total_q:,}")
    print(f"   Syllabus Coverage    : {overall_coverage_pct:.1f}%")
    print(f"   Report written to    : {report_path}")

if __name__ == "__main__":
    main()
