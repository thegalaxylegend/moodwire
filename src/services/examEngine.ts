import { askAI } from '../lib/ai';
import { extractJSON } from '../lib/utils';

export interface Question {
    question_id: string;
    question: string;
    options: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    correct_option: 'A' | 'B' | 'C' | 'D';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    chapter: string;
    class: string;
}

export interface ExamSection {
    subject: string;
    questions: Question[];
}

export interface ExamTest {
    exam: string;
    mode: string;
    total_questions: number;
    time_limit_minutes: number;
    marking_scheme: {
        correct: string;
        incorrect: string;
        unattempted: string;
    };
    sections: ExamSection[];
}

const EXAM_RULES: Record<string, string> = {
    'JEE': 'Subjects: Physics, Chemistry, Mathematics. Pattern: Mixed MCQ + Numerical. Difficulty: JEE Advanced level. Marking: +4, -1.',
    'NEET': 'Subjects: Physics, Chemistry, Biology. Pattern: MCQ only. Biology strictly NCERT-based. Marking: +4, -1.'
};

export const generateTest = async (
    targetExam: string,
    selectedClass: string,
    mode: 'Quick_Test' | 'Full_Mock',
    difficultyBias: 'Exam_Level' | 'Slightly_Harder'
): Promise<ExamTest | null> => {

    // 1. Validation
    const validExams = ['JEE', 'NEET'];
    const examKey = validExams.find(e => targetExam.toUpperCase().includes(e));

    if (!examKey) {
        throw new Error(`Unsupported Exam: ${targetExam}. Must be one of ${validExams.join(', ')}.`);
    }

    const rules = EXAM_RULES[examKey];

    // 2. Construct Prompt
    const prompt = `
    GENERATE A STRICT EXAM-AUTHENTIC TEST.
    
    TARGET_EXAM: ${examKey}
    SELECTED_CLASS: ${selectedClass}
    MODE: ${mode}
    DIFFICULTY: ${difficultyBias}

    CRITICAL INSTRUCTIONS (MUST FOLLOW):
    1. GRADE LOYALTY: 
       - If Class 11/12/Dropper: STRICTLY NO Class 9/10 level questions. Assume student knows basics.
       - Questions must be at the depth of the TARGET_EXAM (e.g., JEE Advanced = Multi-concept, twisted).
    2. PYQ PATTERN MATCHING:
       - Mimic the exact style, length, and complexity of Previous Year Questions (2020-2024).
       - Do NOT generate generic "textbook" questions.
    3. DIFFICULTY CALIBRATION:
       - "Hard" = Top 1% of students can solve. (e.g. Rotational Motion + Electrostatics mixed).
       - "Medium" = Standard Exam Level.
       - "Easy" = Formula based (Only for NEET, never for JEE Adv).
    4. REVIEWER PERSONA:
       - Act as a strict exam setter. REJECT any question that looks too simple or "school level".
       - If you generate a Class 9 question for JEE, you FAIL.
    5. MATH FORMATTING (CRITICAL — USE UNICODE, NOT LATEX):
       - Write ALL math as plain text with Unicode characters.
       - Superscripts/Subscripts: x², a₀, etc.
       - Greek letters: α, β, γ, Δ, Ω, etc.
       - Math operators: ×, ÷, ±, √, ∞, ≈, ≤
       - NEVER USE LaTeX syntax (e.g., $...$, \\frac, \\alpha).

    RULES:
    ${rules}
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "exam": "${examKey}",
      "mode": "${mode}",
      "total_questions": ${mode === 'Quick_Test' ? 10 : 'REAL_EXAM_COUNT'},
      "time_limit_minutes": ${mode === 'Quick_Test' ? 30 : 'REAL_EXAM_DURATION'},
      "marking_scheme": { "correct": "+4", "incorrect": "-1", "unattempted": "0" },
      "concept_personality_summary": "Overall personality of this test set",
      "sections": [
        {
          "subject": "Subject Name",
          "questions": [
             {
                "question_id": "unique_id",
                "question": "Question Text",
                "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
                "correct_option": "A",
                "difficulty": "Hard",
                "chapter": "Chapter Name",
                "class": "${selectedClass}",
                "trap_type": "Time Pressure / Ambiguity / Conceptual"
             }
          ]
        }
      ]
    }
    
    IMPORTANT: Return ONLY the raw JSON. No markdown.
    `;

    try {
        // 3. Call AI
        // We use temperature 0.7 for creativity in questions but strictness in format
        const response = await askAI(
            "You are 'Exa', a brilliant but sweet exam mentor. Your purpose is to generate real-exam-accurate tests while being encouraging and sweet. Use emojis 💖✨.",
            prompt,
            'groq'
        );

        if (!response) {
            throw new Error("Failed to generate test content (AI response was empty).");
        }

        // 4. Parse JSON
        const testData: ExamTest = extractJSON(response);

        return testData;

    } catch (e) {
        console.error("Exam Engine Generation Failed", e);
        throw e;
    }
};
