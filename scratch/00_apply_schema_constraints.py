import sqlite3
import os
import glob
import traceback

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
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    
    try:
        # Check if table questions already has cognitive_level column
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(questions);")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "cognitive_level" in columns:
            print("Table 'questions' already has the new schema and constraints. Skipping schema rebuild.")
            conn.close()
            return
            
        print("Starting safe transaction to rebuild schema with constraints...")
        conn.execute("BEGIN TRANSACTION;")
        
        # 1. Rename old questions table
        conn.execute("ALTER TABLE questions RENAME TO questions_old;")
        
        # 2. Create new questions table with strict check constraints and new metadata fields
        create_table_sql = """
        CREATE TABLE questions (
          -- Identity
          id TEXT PRIMARY KEY,

          -- Classification
          exam    TEXT NOT NULL CHECK(exam IN ('JEEMains','JEEAdvanced','NEET','Board')),
          class   TEXT NOT NULL CHECK(class IN ('8','9','10','11','12')),
          subject TEXT NOT NULL CHECK(subject IN ('Physics','Chemistry','Mathematics','Biology','Science','Social')),

          -- Primary Topic
          primary_topic_id  TEXT NOT NULL,
          primary_topic     TEXT NOT NULL,
          primary_subtopic  TEXT NOT NULL,

          -- Multi-Concept
          secondary_topic_ids TEXT NOT NULL DEFAULT '[]' CHECK(quality_tier = 'D' OR json_valid(secondary_topic_ids)),
          concept_tags TEXT NOT NULL DEFAULT '[]' CHECK(quality_tier = 'D' OR json_valid(concept_tags)),
          cross_chapter  INTEGER NOT NULL DEFAULT 0,
          cross_subject  INTEGER NOT NULL DEFAULT 0,
          also_for       TEXT NOT NULL DEFAULT '[]' CHECK(quality_tier = 'D' OR json_valid(also_for)),

          -- Question Type
          type TEXT NOT NULL DEFAULT 'MCQ' CHECK(type IN ('MCQ', 'Multi-correct', 'Integer', 'Passage', 'Matrix-Match')),
          passage_id TEXT DEFAULT NULL,
          has_image INTEGER NOT NULL DEFAULT 0,

          -- Difficulty
          difficulty_score INTEGER NOT NULL CHECK(quality_tier = 'D' OR (difficulty_score BETWEEN 500 AND 3500)),
          difficulty_band TEXT NOT NULL CHECK(quality_tier = 'D' OR (difficulty_band IN (
            'CLASS_8_RECALL', 'CLASS_9_BASIC', 'BOARD_EASY', 'BOARD_HARD',
            'NEET_EASY', 'NEET_MEDIUM', 'NEET_HARD',
            'JEE_MAINS_EASY', 'JEE_MAINS_MEDIUM', 'JEE_MAINS_HARD',
            'JEE_ADV_EASY', 'JEE_ADV_MEDIUM', 'JEE_ADV_HARD', 'JEE_ADV_EXPERT'
          ))),
          step_count INTEGER NOT NULL DEFAULT 1,
          negative_marking REAL NOT NULL DEFAULT -1.0,

          -- Content
          question_text TEXT NOT NULL,
          options TEXT NOT NULL DEFAULT '[]' CHECK(quality_tier = 'D' OR json_valid(options)),
          correct_answer TEXT NOT NULL,
          explanation TEXT NOT NULL CHECK(quality_tier = 'D' OR length(trim(explanation)) >= 10),
          solution_steps TEXT NOT NULL DEFAULT '[]' CHECK(quality_tier = 'D' OR json_valid(solution_steps)),
          key_formula TEXT DEFAULT NULL,
          error_trap_type TEXT NOT NULL DEFAULT 'general.exam_trap',

          -- Source & Quality
          source_exam TEXT NOT NULL DEFAULT 'AI-Generated',
          year INTEGER DEFAULT NULL,
          quality_tier TEXT NOT NULL DEFAULT 'C' CHECK(quality_tier IN ('S','A','B','C','D')),
          confidence REAL NOT NULL DEFAULT 0.87,

          -- Provenance & Versioning Metadata
          cognitive_level TEXT DEFAULT 'Recall' CHECK(cognitive_level IN ('Recall', 'Application', 'Multi-step', 'Proof-heavy', 'Olympiad-style')),
          last_repaired_at TEXT DEFAULT NULL,
          repair_version TEXT DEFAULT NULL,
          repair_notes TEXT DEFAULT NULL,

          -- Tracking
          created_at TEXT NOT NULL,
          verified   INTEGER NOT NULL DEFAULT 0
        );
        """
        conn.execute(create_table_sql)
        print("Created new 'questions' table with CHECK constraints successfully.")
        
        # 3. Copy data from questions_old to questions, supplying defaults for the new fields
        # Note: mapping existing columns explicitly
        insert_sql = """
        INSERT INTO questions (
          id, exam, class, subject, primary_topic_id, primary_topic, primary_subtopic,
          secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for,
          type, passage_id, has_image, difficulty_score, difficulty_band, step_count,
          negative_marking, question_text, options, correct_answer, explanation,
          solution_steps, key_formula, error_trap_type, source_exam, year, quality_tier,
          confidence, created_at, verified, cognitive_level, last_repaired_at,
          repair_version, repair_notes
        )
        SELECT
          id, exam, class, subject, primary_topic_id, primary_topic, primary_subtopic,
          secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for,
          type, passage_id, has_image, difficulty_score, difficulty_band, step_count,
          negative_marking, question_text, options, correct_answer, explanation,
          solution_steps, key_formula, error_trap_type, source_exam, year, quality_tier,
          confidence, created_at, verified, 'Recall', NULL, NULL, NULL
        FROM questions_old;
        """
        conn.execute(insert_sql)
        print("Copied all existing question records into new structure.")
        
        # 4. Drop old table to clear old indexes
        conn.execute("DROP TABLE questions_old;")
        print("Dropped questions_old.")
        
        # 5. Create Indexes
        conn.execute("CREATE UNIQUE INDEX idx_q_hash ON questions(id);")
        conn.execute("CREATE INDEX idx_q_serve ON questions(exam, class, subject, difficulty_score);")
        conn.execute("CREATE INDEX idx_q_topic ON questions(primary_topic_id, difficulty_score);")
        conn.execute("CREATE INDEX idx_q_primary_topic ON questions(primary_topic, difficulty_score);")
        conn.execute("CREATE INDEX idx_q_subject ON questions(subject, difficulty_score);")
        conn.execute("CREATE INDEX idx_q_band ON questions(difficulty_band);")
        conn.execute("CREATE INDEX idx_q_cross ON questions(cross_chapter, exam, difficulty_score);")
        conn.execute("CREATE INDEX idx_q_source ON questions(quality_tier, exam, subject);")
        conn.execute("CREATE INDEX idx_q_year ON questions(year, exam, subject);")
        print("Recreated performance indexes on 'questions'.")
        
        conn.commit()
        print("Transaction successfully committed! Schema constraints applied.")
        
    except Exception as e:
        print("Migration failed! Rolling back changes to ensure safety.")
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
