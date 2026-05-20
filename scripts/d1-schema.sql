-- ═══════════════════════════════════════════════════════════════════
-- EXAMCOMPASS D1 SCHEMA v2.0
-- Supports: MCQ | Multi-correct | Integer | Passage | Matrix-Match
-- ELO: Exam-anchored 700-3200 (14 bands)
-- Topics: Multi-concept tagging (primary + secondary + concept_tags)
-- Classes: 8-12 | Exams: JEEMains, JEEAdvanced, NEET, Board
-- ═══════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS elo_bands;
DROP TABLE IF EXISTS topic_nodes;

-- ─── ELO Reference Bands (fixed anchors — AI must use these) ──────
CREATE TABLE elo_bands (
  band_id   TEXT PRIMARY KEY,     -- 'JEE_ADV_HARD', 'NEET_EASY', etc.
  elo_min   INTEGER NOT NULL,
  elo_max   INTEGER NOT NULL,
  label     TEXT NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO elo_bands VALUES
  ('CLASS_8_RECALL',   700,  900,  'Band 1 — Class 8 Basic',         'Single fact recall, no calculation, Class 8 Board'),
  ('CLASS_9_BASIC',    900,  1100, 'Band 2 — Class 9 Basic',         '1-step application, F=ma with given values, Class 9 Board'),
  ('BOARD_EASY',       1100, 1400, 'Band 3 — Board Easy',            'Class 10 easy/medium, 2-step, direct formula use'),
  ('BOARD_HARD',       1400, 1700, 'Band 4 — Board Hard',            'Class 10 hard, proof-based, Punnett squares, mirror formula'),
  ('NEET_EASY',        1700, 1900, 'Band 5 — NEET Easy',             'Single concept NEET, formula recall + substitution'),
  ('JEE_MAINS_EASY',   1800, 2050, 'Band 6 — JEE Mains Easy',        'Single concept, must recall formula, routine calculation'),
  ('NEET_MEDIUM',      1900, 2100, 'Band 7 — NEET Medium',           'NEET 2-concept or tricky single concept, mechanism questions'),
  ('JEE_MAINS_MEDIUM', 2050, 2250, 'Band 8 — JEE Mains Medium',      '2 concepts, 3-step reasoning, formula chain'),
  ('NEET_HARD',        2100, 2350, 'Band 9 — NEET Hard',             'Multi-concept NEET, counter-intuitive, strong traps'),
  ('JEE_MAINS_HARD',   2250, 2500, 'Band 10 — JEE Mains Hard',       'Multi-concept, 3-4 steps, strong traps, complex circuit'),
  ('JEE_ADV_EASY',     2400, 2650, 'Band 11 — JEE Advanced Easy',    '2 chapters combined, clear method, novel framing'),
  ('JEE_ADV_MEDIUM',   2600, 2800, 'Band 12 — JEE Advanced Medium',  '3 chapters, non-obvious approach, requires insight'),
  ('JEE_ADV_HARD',     2800, 3000, 'Band 13 — JEE Advanced Hard',    '3-4 chapters, 5+ steps, strong misdirection'),
  ('JEE_ADV_EXPERT',   3000, 3200, 'Band 14 — JEE Advanced Expert',  'First-principles derivation, never-seen-before type');

-- ─── Main Questions Table ──────────────────────────────────────────
CREATE TABLE questions (

  -- ── Identity ──────────────────────────────────────────────────
  id TEXT PRIMARY KEY,
  -- SHA-256 of (question_text + options joined) — guarantees dedup

  -- ── Classification ────────────────────────────────────────────
  exam    TEXT NOT NULL CHECK(exam IN ('JEEMains','JEEAdvanced','NEET','Board')),
  class   TEXT NOT NULL CHECK(class IN ('8','9','10','11','12')),
  subject TEXT NOT NULL CHECK(subject IN (
    'Physics','Chemistry','Mathematics','Biology','Science','Social'
  )),

  -- ── Primary Topic (single chapter-level concept) ──────────────
  primary_topic_id  TEXT NOT NULL,
  -- Format: phy_12_ch03_kirchhoffs | mat_11_ch06_permcomb | bio_12_neet_ch05_genetics
  primary_topic     TEXT NOT NULL,   -- 'Current Electricity'
  primary_subtopic  TEXT NOT NULL,   -- 'Kirchhoff''s Laws — Complex Networks'

  -- ── Multi-Concept (CRITICAL for JEE Advanced) ─────────────────
  secondary_topic_ids TEXT NOT NULL DEFAULT '[]',
  -- JSON array of other chapter IDs this question also tests
  -- e.g. ["phy_11_ch07_rotation", "phy_12_ch06_emi"]
  concept_tags TEXT NOT NULL DEFAULT '[]',
  -- JSON array of ALL fine-grained concepts touched
  -- e.g. ["Faraday's law","angular velocity","torque on loop","circuit analysis","power"]
  cross_chapter  INTEGER NOT NULL DEFAULT 0, -- 1 = spans 2+ chapters
  cross_subject  INTEGER NOT NULL DEFAULT 0, -- 1 = spans 2+ subjects (rare in JEE)
  also_for       TEXT NOT NULL DEFAULT '[]', -- JSON: ["NEET","Board"] — cross-exam utility

  -- ── Question Type ─────────────────────────────────────────────
  type TEXT NOT NULL DEFAULT 'MCQ' CHECK(type IN (
    'MCQ',          -- Single correct, 4 options
    'Multi-correct',-- 1 to 4 correct options possible (JEE Advanced)
    'Integer',      -- Numerical answer 0-9 or 0-99 (no options)
    'Passage',      -- Part of a paragraph/comprehension group
    'Matrix-Match'  -- Column matching (JEE Advanced)
  )),
  passage_id TEXT DEFAULT NULL,
  -- Groups passage questions together (same passage_id = same paragraph)
  has_image INTEGER NOT NULL DEFAULT 0,
  -- 1 = question needs a diagram (AI-generated will always be 0)

  -- ── Difficulty (EXAM-ANCHORED ELO) ────────────────────────────
  difficulty_score INTEGER NOT NULL,
  -- 700-3200. References elo_bands table. EXAM-ANCHORED not class-anchored.
  difficulty_band TEXT NOT NULL,
  -- Must match a band_id in elo_bands table
  -- e.g. 'JEE_ADV_HARD' | 'JEE_MAINS_MEDIUM' | 'NEET_EASY' | 'BOARD_HARD'
  step_count INTEGER NOT NULL DEFAULT 1,
  -- Number of distinct reasoning steps: 1=direct, 2=2-step, 3+=multi-step
  negative_marking REAL NOT NULL DEFAULT -1.0,
  -- Marks deducted for wrong answer: 0=none, -1=standard, -2=double

  -- ── Content ───────────────────────────────────────────────────
  question_text TEXT NOT NULL,
  -- LaTeX supported: $...$ inline, $$...$$ block
  options TEXT NOT NULL DEFAULT '[]',
  -- JSON array of 4 strings for MCQ/Multi-correct
  -- Empty array '[]' for Integer type
  correct_answer TEXT NOT NULL,
  -- For MCQ: verbatim copy of correct option string
  -- For Multi-correct: JSON array of correct options e.g. '["A text","C text"]'
  -- For Integer: the numerical answer as string e.g. "7" or "3.14"
  explanation TEXT NOT NULL,
  -- 2-5 line step-by-step solution in LaTeX markdown
  solution_steps TEXT NOT NULL DEFAULT '[]',
  -- JSON array: ["Step 1: Apply Gauss's law...", "Step 2: Substitute values..."]
  key_formula TEXT DEFAULT NULL,
  -- Primary formula used: "∮E·dA = Q/ε₀" | "KE = ½Iω²" | NULL
  error_trap_type TEXT NOT NULL DEFAULT 'general.exam_trap',
  -- Dot-notation trap classification:
  -- physics.electrostatics.sign_flip | math.calculus.limit_direction
  -- chemistry.organic.stereochemistry | biology.genetics.codominance_vs_incomplete

  -- ── Source & Quality ──────────────────────────────────────────
  source_exam TEXT NOT NULL DEFAULT 'AI-Generated',
  -- 'JEE Mains 2023 Jan Shift 1' | 'NEET 2022' | 'AI-Generated' | 'NCERT Exemplar'
  year INTEGER DEFAULT NULL,
  -- PYQ year (NULL for AI-generated)
  quality_tier TEXT NOT NULL DEFAULT 'C' CHECK(quality_tier IN ('S','A','B','C','D')),
  -- S=actual PYQ(0.99) A=verified PYQ(0.95) B=AI-curated(0.87) C=AI-gen(0.75) D=unverified(0.60)
  confidence REAL NOT NULL DEFAULT 0.87,

  -- ── Tracking ──────────────────────────────────────────────────
  created_at TEXT NOT NULL,
  verified   INTEGER NOT NULL DEFAULT 0
  -- 0=not verified, 1=human-verified
);

-- ─── Performance Indexes ──────────────────────────────────────────

-- Primary dedup index
CREATE UNIQUE INDEX idx_q_hash ON questions(id);

-- API serving query: "Give me Physics questions at ELO ~2100 for JEE student"
CREATE INDEX idx_q_serve ON questions(exam, class, subject, difficulty_score);

-- Topic browsing: all questions for a specific chapter/topic
CREATE INDEX idx_q_topic ON questions(primary_topic_id, difficulty_score);
CREATE INDEX idx_q_primary_topic ON questions(primary_topic, difficulty_score);
CREATE INDEX idx_q_subject ON questions(subject, difficulty_score);

-- Band-based filtering
CREATE INDEX idx_q_band ON questions(difficulty_band);

-- Cross-chapter queries
CREATE INDEX idx_q_cross ON questions(cross_chapter, exam, difficulty_score);

-- Source filtering (PYQ vs AI)
CREATE INDEX idx_q_source ON questions(quality_tier, exam, subject);

-- Year-based PYQ filtering
CREATE INDEX idx_q_year ON questions(year, exam, subject);
