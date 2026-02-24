/**
 * 🧪 LOGIC LAB SERVICE (JEE/NEET 2026 Edition)
 * Specialized reasoning engine for Assertion-Reasoning questions.
 */

export interface ReasoningQuestion {
    id: string;
    assertion: string;
    reason: string;
    correctOption: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    subject: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const REASONING_OPTIONS = {
    A: "Both A and R are true and R is the correct explanation of A",
    B: "Both A and R are true but R is NOT the correct explanation of A",
    C: "A is true but R is false",
    D: "Both A and R are false"
};

class ReasoningService {
    /**
     * Fetches reasoning-specific questions based on 2026 trends.
     */
    static async getReasoningQuestions(subject?: string): Promise<ReasoningQuestion[]> {
        // Real-world 2026 JEE/NEET assertion-reasoning patterns
        const mockQuestions: ReasoningQuestion[] = [
            {
                id: 'r1',
                assertion: "An object can have zero velocity but non-zero acceleration.",
                reason: "Acceleration is the rate of change of velocity.",
                correctOption: 'A',
                explanation: "At the highest point of a vertical toss, velocity is 0, but acceleration is 'g' (9.8 m/s²).",
                subject: "Physics",
                topic: "Kinematics",
                difficulty: "Medium"
            },
            {
                id: 'r2',
                assertion: "Diamond is the hardest natural substance.",
                reason: "Diamond has a giant covalent structure with 3D networks.",
                correctOption: 'A',
                explanation: "The strong covalent bonds throughout the tetrahedral lattice provide extreme hardness.",
                subject: "Chemistry",
                topic: "Solid State",
                difficulty: "Easy"
            },
            {
                id: 'r3',
                assertion: "Mitochondria are called the powerhouse of the cell.",
                reason: "Mitochondria produce cellular energy in the form of ATP.",
                correctOption: 'A',
                explanation: "ATP is the energy currency of life, produced through aerobic respiration in mitochondria.",
                subject: "Biology",
                topic: "Cell Biology",
                difficulty: "Easy"
            },
            {
                id: 'r4',
                assertion: "The force of friction always opposes the motion of an object.",
                reason: "Friction is a contact force.",
                correctOption: 'B',
                explanation: "While both are true, being a contact force is not the *reason* why it opposes motion (it opposes motion due to surface irregularities).",
                subject: "Physics",
                topic: "Laws of Motion",
                difficulty: "Hard"
            }
        ];

        if (subject) {
            return mockQuestions.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
        }
        return mockQuestions;
    }
}

export default ReasoningService;
