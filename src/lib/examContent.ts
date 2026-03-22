
export interface ExamDetail {
    title: string;
    longDescription: string[];
    features: { title: string; desc: string; iconColor: string }[];
    preparationStrategy: string;
    targetAudience: string;
}

export const EXAM_CONTENT: Record<string, ExamDetail> = {
    'jee-mains': {
        title: "JEE Mains 2026: The Ultimate AI-Powered Preparation Guide",
        longDescription: [
            "The Joint Entrance Examination (JEE) Mains is widely considered one of the most competitive engineering entrance exams in the world. With over 12 lakh students appearing annually for a limited number of seats in NITs, IIITs, and GFTIs, the pressure is immense. At Exam Compass, we recognize that standard preparation methods are no longer enough to secure a 99+ percentile. Our platform is engineered to give you the 'Unfair Advantage' through data-driven precision.",
            "Our JEE Mains ecosystem covers the entire Physics, Chemistry, and Mathematics syllabus across Class 11 and 12. Unlike traditional coaching that follows a linear path, our AI engine identifies your personal 'High-Yield Chapters'—the ones that appear most frequently in the actual NTA papers but where you currently have a low accuracy rate. This allows you to prioritize your study time for maximum marks per hour.",
            "We have meticulously categorized over 5,000 Previous Year Questions (PYQs) from 2019 to 2024, including those from the January and April sessions. Each question comes with a step-by-step AI-generated solution that teaches you the 'why' behind the concept. We also provide shortcuts for MCQ solving, which is crucial for the 75-question, 180-minute format where time management is everything.",
            "Visualizing your progress is key to success. Our JEE-specific dashboard shows your accuracy trends in Organic Chemistry vs. Inorganic, or Calculus vs. Algebra. By seeing these data points, you can shift your focus from your favorite subjects to the subjects that will actually increase your rank. Start your JEE Mains 2026 journey with Exam Compass today."
        ],
        features: [
            { title: "Percentile Predictor AI", desc: "Compare your mock scores against 100,000+ data points to predict your JEE Mains percentile.", iconColor: "text-purple-400" },
            { title: "Subject-Wise Heatmaps", desc: "Instantly see which parts of Physics, Chemistry, or Math are pulling your score down.", iconColor: "text-pink-400" },
            { title: "NTA-Standard Test Interface", desc: "Practice in an environment that looks exactly like the real JEE Mains center software.", iconColor: "text-blue-400" }
        ],
        preparationStrategy: "Focus on NCERT for Chemistry, HC Verma and DC Pandey for Physics, and Cengage or Arihant for Mathematics. Practice at least 25 questions per day for each subject using our AI generator.",
        targetAudience: "Class 11, Class 12, and Dropper students aiming for top engineering colleges in India."
    },
    'neet': {
        title: "NEET UG 2026: Master Biology, Physics, and Chemistry with AI",
        longDescription: [
            "The National Eligibility cum Entrance Test (NEET) is the single gateway to all medical colleges in India. With competition levels crossing 20 lakh aspirants, even a single mistake can cost you a government seat. Exam Compass is built to ensure that you achieve the 650+ score necessary for top-tier medical institutions like AIIMS and MAMC.",
            "Our NEET preparation module places a massive emphasis on Biology, recognizing that it accounts for 50% of your score. We have mapped every single line of the NCERT Biology textbooks for Class 11 and 12 into our question bank. Use our AI 'NCERT Extractor' to practice questions derived directly from the diagrams, tables, and side-notes of your textbook—the exact places where NTA loves to frame questions.",
            "For Physics and Chemistry, we focus on high-speed problem solving. Our platform tracks your 'seconds per question,' helping you identify if you are spending too much time on calculations. Our database includes 15,000+ NEET-level questions, ensuring that you are exposed to every possible question type, from statement-based questions to match-the-following pairs.",
            "Success in NEET is about retention. Our AI study mentor 'Exa' uses spaced repetition logic to remind you to revise old chapters just as you are about to forget them. This ensures that the Anatomy of Flowering Plants you studied in August is still fresh in your mind for the May examination. Join the community of future doctors preparing smarter on Exam Compass."
        ],
        features: [
            { title: "NCERT Biology Drill", desc: "Line-by-line questions from NCERT Biology to ensure 360/360 in the bio section.", iconColor: "text-green-400" },
            { title: "Speed Booster Analytics", desc: "Tracks your solving speed to ensure you finish the 200-question paper within time.", iconColor: "text-yellow-400" },
            { title: "Diagram-Based Practice", desc: "Special practice sets for all NCERT diagrams, which are high-scoring in NEET.", iconColor: "text-red-400" }
        ],
        preparationStrategy: "Read NCERT at least 10 times for Biology. For Physics, solve all examples and back exercises from NCERT before moving to objective books. Take a full-length mock test every Sunday.",
        targetAudience: "Medical aspirants from Class 11, 12, and repeaters aiming for MBBS, BDS, and AYUSH courses."
    }
};

export const getExamContent = (examId: string): ExamDetail => {
    return EXAM_CONTENT[examId] || {
        title: `${examId.toUpperCase()} Preparation 2026`,
        longDescription: [
            `Master the complexities of ${examId} with the industry's most advanced AI-powered learning platform. Our ecosystem is custom-built to provide a rigorous, data-driven approach to one of India's most challenging examinations, ensuring you're not just studying, but studying effectively.`,
            `Preparing for ${examId} is an endurance race that requires exceptional conceptual clarity, speed, and accuracy. At Exam Compass, we bridge the gap between hard work and smart work. Our platform features over 10 meticulously mapped subjects, providing a complete chapter-wise breakdown of the entire syllabus.`,
            `What sets us apart is our proprietary AI-driven preparation engine. Unlike static test series that treat every aspirant the same, Exam Compass adapts to your unique learning curve. Our algorithms analyze every attempt, identifying your personal "blind spots" and knowledge gaps.`,
            "Track your real-time probability of selection, visualize your progress through advanced analytics, and build the confidence required to crack the exam 2026."
        ],
        features: [
            { title: "Selection Probability AI", desc: "Proprietary algorithm calculates your readiness based on accuracy, speed, and consistency.", iconColor: "text-purple-400" },
            { title: "Real-Time Analytics", desc: "Track your Fatigue Point and visualize subject heatmaps to optimize study breaks.", iconColor: "text-pink-400" },
            { title: "AI Study Mentor", desc: "Get instant doubt resolution and personalized study plans from our Exa AI chatbot.", iconColor: "text-blue-400" }
        ],
        preparationStrategy: "Follow the NCERT syllabus, solve previous year questions, and take regular mock tests to improve your performance.",
        targetAudience: "Students preparing for Indian competitive examinations."
    };
};
