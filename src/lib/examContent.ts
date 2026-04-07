
export interface ExamDetail {
    title: string;
    subTitle?: string;
    longDescription: string[];
    features: { title: string; desc: string; iconColor: string }[];
    uspPoints?: { title: string; desc: string; icon: string }[];
    preparationStrategy: string;
    targetAudience: string;
    successStats?: { label: string; value: string }[];
    comparisonData?: { competitor: string; feature: string; value: string }[];
    longDescriptionExtended?: string[];
}

export const EXAM_CONTENT: Record<string, ExamDetail> = {
    'jee-mains': {
        title: "Master JEE Mains 2026",
        subTitle: "The AI-Powered Unfair Advantage for 99+ Percentile",
        longDescription: [
            "The Joint Entrance Examination (JEE) Mains is widely considered one of the most competitive engineering entrance exams in the world. With over 12 lakh students appearing annually for a limited number of seats in NITs, IIITs, and GFTIs, the pressure is immense. At Exam Compass, we recognize that standard preparation methods are no longer enough to secure a 99+ percentile. Our platform is engineered to give you the 'Unfair Advantage' through data-driven precision.",
            "JEE Mains 2026 demands a perfect blend of conceptual depth and high-speed execution. The exam consists of 90 questions across Physics, Chemistry, and Mathematics, where candidates must attempt 75. This 300-mark paper isn't just a test of knowledge; it's a test of decision-making under pressure. Our AI identifies your 'Fatigue Point'—the moment in a 3-hour test where your accuracy starts to drop—helping you build the stamina needed for the actual exam floor.",
            "For Physics, we focus on the transition from theory to application. Whether it's Mechanics, Electrodynamics, or Modern Physics, our practice modules prioritize the NTA-style numericals that often bridge two or more concepts. Our goal is to ensure you move beyond formula-substitution to true problem-solving, which is the hallmark of a top-percentiler.",
            "Chemistry is often the 'Rank Booster' in JEE Mains. Our system emphasizes the NCERT-centric approach for Inorganic and Organic Chemistry, while providing rigorous practice for Physical Chemistry calculations. We've mapped over 5,000 PYQs to specific NCERT paragraphs, allowing you to see exactly where the NTA frames its questions from.",
            "Mathematics in JEE Mains has become increasingly lengthy and challenging over the last three years. Success here requires 'Shortcut Mastery.' Our platform teaches you how to use options elimination and dimensional analysis to solve complex Calculus and Algebra problems in half the time. We track your 'Seconds Per Mark' to ensure you're investing your 180 minutes optimally.",
            "The road to IIT/NIT is a marathon, not a sprint. Our AI engine identifies your personal 'High-Yield Chapters'—the ones that appear most frequently in the actual papers but where you currently have a low accuracy rate. This allows you to prioritize your study time for maximum marks per hour, rather than blindly following a linear syllabus.",
            "Join a community where every mock test is a learning opportunity. Our detailed analytics provide negative marking insights, subject heatmaps, and a real-time probability of selection based on your current trajectory. Don't leave your 2026 results to chance; use precision-engineered practice to secure your future.",
            "Finally, we provide a structured Class 11 and Class 12 roadmap. For 11th-grade students, we emphasize building a rock-solid foundation in Mechanics and Mole Concepts. For 12th-grade and dropper students, we focus on high-impact chapters like Electrostatics, Optics, and Multi-step Organic synthesis. Your path to excellence starts here."
        ],
        features: [
            { title: "NTA-Standard Mocks", desc: "Practice in an interface that mirrors the real NTA test centers to eliminate exam-day anxiety.", iconColor: "text-white" },
            { title: "AI Score Predictor", desc: "Our algorithm analyzes your mock performance to give you a realistic expected percentile.", iconColor: "text-white" },
            { title: "PYQ Topic Mapping", desc: "5,000+ Previous Year Questions categorized by difficulty and importance.", iconColor: "text-white" },
            { title: "Shortcut Mastery", desc: "Interactive modules teaching you how to solve complex math problems in under 60 seconds.", iconColor: "text-white" },
            { title: "Weak Spot Heatmaps", desc: "Instantly see which chapters are pulling your percentile down with visual data.", iconColor: "text-white" },
            { title: "Rank Trend Analytics", desc: "Track your improvement over multiple mocks with real-time progress charts.", iconColor: "text-white" }
        ],
        uspPoints: [
            { title: "Data-Driven Precision", desc: "Identify the exact sub-topics pulling your score down with core subject heatmaps.", icon: "Target" },
            { title: "Exa AI Doubt Solver", desc: "Integrated assistant solves and explains complex Physics and Math problems instantly.", icon: "Brain" },
            { title: "Daily AI Challenges", desc: "3 targeted questions every day to keep your fundamental concepts sharp and active.", icon: "Zap" },
            { title: "Weightage Analytics", desc: "Real-time updates on which chapters are trending in the latest NTA exam sessions.", icon: "TrendingUp" }
        ],
        successStats: [
            { label: "Verified PYQs", value: "5,000+" },
            { label: "Subject Modules", value: "90+" },
            { label: "AI Explanations", value: "Instant" },
            { label: "Predictor Accuracy", value: "94%" }
        ],
        preparationStrategy: "Master the 75-question format by alternating between 1-hour subject sprints and full 3-hour mocks. Prioritize high-weightage topics like Electromagnetism, Calculus, and Organic Chemistry while maintaining a baseline in NCERT theory.",
        targetAudience: "Aspirants looking for a precision-based study ecosystem for JEE Mains 2026."
    },
    'neet': {
        title: "Cracking NEET UG 2026",
        subTitle: "650+ is Not a Dream, It's the Result of Data-Driven Discipline",
        longDescription: [
            "The National Eligibility cum Entrance Test (NEET) is the single gateway to all medical colleges in India. With competition levels crossing 20 lakh aspirants, even a single mistake can cost you a government seat. Exam Compass is built to ensure that you achieve the 650+ score necessary for top-tier medical institutions like AIIMS and MAMC.",
            "Success in NEET 2026 is a game of retention and speed. You have 200 minutes to tackle 200 questions (out of which 180 are mandatory). This means you have less than one minute per question. Our AI 'Speed Booster' doesn't just track if you got the answer right; it tracks your 'Thinking Time' versus 'Solving Time,' helping you identify topics where you're struggling with conceptual recall.",
            "Biology accounts for 50% of the total NEET score (360/720). Our platform features a 'Line-by-Line NCERT Extractor' that tests your knowledge of the most minute details from the Class 11 and 12 Biology textbooks. We've converted every diagram, table, and summary point into an objective question, ensuring you cover everything the NTA might ask.",
            "For Physics and Chemistry, we aim to eliminate the 'Calculation Phobia.' By providing over 10,000 practice questions with video-level AI step-by-step explanations, we help you master the unit-conversion and formula-application skills that often trip up medical aspirants. We prioritize high-yield chapters like Modern Physics, Thermal Physics, and Equilibrium.",
            "The 'Section B' strategy is often what separates an AIR 1000 from an AIR 10,000. Our mock tests simulate the new NEET pattern precisely, teaching you how to select the easiest 10 questions out of the 15 provided in Section B. Mastering this selection process can save you valuable minutes and prevent negative marking errors.",
            "Retention is the key to mastering 97 chapters across three subjects. Our AI study mentor 'Exa' uses spaced repetition algorithms to remind you to revise difficult topics like Animal Kingdom or Morphology just as you are reaching the 'forgetting curve.' This ensures your long-term memory is primed for the May 2026 examination.",
            "Our Class 11 and 12 roadmap for NEET is meticulously structured. For 11thies, we focus on Human Physiology and Diversity. For 12thies, we move into intensive Genetics, Biotech, and Reproduction. We provide a clear track to hitting the 650+ benchmark through consistent, data-backed discipline.",
            "Become part of a elite circle of future doctors. Track your real-time ranking against other serious aspirants on our community leaderboard and use our 'Topic Heatmaps' to focus on your 'Red Zones' (low accuracy chapters). Your stethoscope is waiting; let's start the journey."
        ],
        features: [
            { title: "NCERT Line-By-Line", desc: "Questions extracted from every diagram and table of your Biology NCERT textbooks.", iconColor: "text-white" },
            { title: "AI Speed Booster", desc: "Track your 'Seconds Per Question' to ensure you finish 200 questions within the time limit.", iconColor: "text-white" },
            { title: "Interactive Dashboards", desc: "Visualize your accuracy in Zoology vs Botany to prioritize your revision.", iconColor: "text-white" },
            { title: "Section B Strategy", desc: "Specific modules to master the art of question selection in the 2026 NEET pattern.", iconColor: "text-white" },
            { title: "Diagram Mastery", desc: "Special practice sets for all 250+ NCERT diagrams, ensuring high marks in bio.", iconColor: "text-white" },
            { title: "Flashcard Revision", desc: "AI-generated flashcards for difficult names and cycles in Morphology and Genetics.", iconColor: "text-white" }
        ],
        uspPoints: [
            { title: "NCERT Extractor", desc: "Master the 360/360 biology goal with questions that test the hidden lines of your textbook.", icon: "BookOpen" },
            { title: "Chapter-Wise Mocks", desc: "Create focused tests for just the chapters you find difficult after reading NCERT.", icon: "Target" },
            { title: "Exa Study Mentor", desc: "A 24/7 AI companion to clear your doubts in Human Physiology or Plant Diversity.", icon: "RefreshCcw" },
            { title: "Retention Engine", desc: "AI-driven revision schedule based on your personal forgetting curve and past errors.", icon: "Clock" }
        ],
        successStats: [
            { label: "NCERT Questions", value: "15,000+" },
            { label: "Speed Accuracy", value: "Real-time" },
            { label: "Mock Full Tests", value: "Unlimited" },
            { label: "Retention Rate", value: "+40%" }
        ],
        longDescriptionExtended: [
            "Advanced preparation strategy includes dedicated cycles for 'weak-topic drills' and 'full-length marathons.' We suggest dedicating 4 hours daily to Biology and 2 hours each to Physics and Chemistry for balanced growth."
        ],
        preparationStrategy: "Read NCERT line-by-line for Biology at least 10 times. Use our NCERT Extractor feature to verify your retention of diagrams and labels. For Physics, solve all NCERT examples and PYQs.",
        targetAudience: "Medical aspirants seeking a disciplined, data-backed path to a government MBBS seat."
    },
};

export const getExamContent = (examId: string): ExamDetail | null => {
    if (EXAM_CONTENT[examId]) return EXAM_CONTENT[examId];
    
    const formattedId = examId.replace(/-/g, ' ').toUpperCase();
    
    // Check if it's a valid class or mapped exam
    const isValidId = examId.startsWith('class-') || 
                      ['jee-mains', 'neet', 'jee-advanced'].includes(examId);

    if (!isValidId) return null;

    return {
        title: `${formattedId} Preparation 2026`,
        longDescription: [
            `Master the complexities of ${formattedId} with the industry's most advanced AI-powered learning platform. Our ecosystem is custom-built to provide a rigorous, data-driven approach to one of India's most challenging examinations, ensuring you're not just studying, but studying effectively.`,
            `Preparing for ${formattedId} is an endurance race that requires exceptional conceptual clarity, speed, and accuracy. At Exam Compass, we bridge the gap between hard work and smart work. Our platform features over 10 meticulously mapped subjects, providing a complete chapter-wise breakdown of the entire syllabus.`,
            `What sets us apart is our proprietary AI-driven preparation engine. Unlike static test series that treat every aspirant the same, Exam Compass adapts to your unique learning curve. Our algorithms analyze every attempt, identifying your personal "blind spots" and knowledge gaps.`,
            "Track your real-time probability of selection, visualize your progress through advanced analytics, and build the confidence required to crack the exam 2026."
        ],
        features: [
            { title: "Selection Probability AI", desc: "Proprietary algorithm calculates your readiness based on accuracy, speed, and consistency.", iconColor: "text-purple-400" },
            { title: "Real-Time Analytics", desc: "Track your Fatigue Point and visualize subject heatmaps to optimize study breaks.", iconColor: "text-pink-400" },
            { title: "AI Study Mentor", desc: "Get instant doubt resolution and personalized study plans from our Exa AI chatbot.", iconColor: "text-blue-400" },
            { title: "Performance Benchmarking", desc: "Compare your performance against anonymized data from thousands of other aspirants.", iconColor: "text-green-400" },
            { title: "Custom Mock Generator", desc: "Create tests specifically for your weak chapters to bridge knowledge gaps effectively.", iconColor: "text-yellow-400" },
            { title: "Adaptive Revision", desc: "Our AI identifies which topics you are likely to forget and schedules revision alerts.", iconColor: "text-red-400" }
        ],
        preparationStrategy: "Follow the NCERT syllabus, solve previous year questions, and take regular mock tests to improve your performance.",
        targetAudience: "Students preparing for Indian competitive examinations."
    };
};
