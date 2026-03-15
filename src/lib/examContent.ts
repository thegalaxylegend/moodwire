
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
    },
    'upsc': {
        title: "UPSC Civil Services 2026: AI-Driven Strategy for Prelims and Mains",
        longDescription: [
            "The UPSC Civil Services Examination (CSE) is often called the 'toughest exam in the world.' It requires not just vast knowledge, but the ability to connect dots across History, Geography, Polity, Science & Tech, and Ethics. Exam Compass is your digital partner in navigating this massive syllabus through an AI-led strategy.",
            "Our UPSC module is divided into two parts: Prelims focus and Mains foundation. For Prelims, we provide an exhaustive database of over 10,000 questions including 30 years of PYQs. Our AI analyzes trends to tell you which sections of the Economic Survey or Budget are most likely to appear in the 2026 paper.",
            "Understanding current affairs is the biggest hurdle for UPSC aspirants. Exam Compass uses AI to scan daily newspapers and link news items directly to the static syllabus. If there is a news piece about a new Supreme Court judgment, our platform will suggest the related Constitutional Articles you need to revise. This 'Dynamic-Static Linkage' is what sets toppers apart from the rest.",
            "We also understand the mental toll of a 12-month-long examination cycle. Our mission planner adapts to your pace, ensuring you don't burn out by February. Whether you are a working professional or a full-time aspirant, we provide the structured path you need to see your name in the final PDF."
        ],
        features: [
            { title: "Dynamic-Static Linkage", desc: "AI connects current affairs news directly to relevant parts of your static GS syllabus.", iconColor: "text-indigo-400" },
            { title: "30-Year PYQ Analysis", desc: "Detailed breakdown of UPSC trends over three decades to identify repeating themes.", iconColor: "text-amber-400" },
            { title: "Optional Selection Guide", desc: "Data-driven tool to help you choose the highest-scoring optional subject for your background.", iconColor: "text-cyan-400" }
        ],
        preparationStrategy: "Focus on conceptual clarity from NCERTs first. Read 'The Hindu' or 'Indian Express' religiously. Practice daily answer writing for the Mains from day one.",
        targetAudience: "Serious aspirants for IAS, IPS, IFS, and other central services."
    },
    'gate': {
        title: "GATE 2026: Technical Mastery through AI-Powered Adaptive Testing",
        longDescription: [
            "The Graduate Aptitude Test in Engineering (GATE) is a high-stakes exam for those looking to pursue M.Tech in IITs/IISc or secure a prestigious PSU job. It tests technical depth like no other exam. Exam Compass provides the specialized tools needed for engineers to dominate this conceptual challenge.",
            "Our GATE modules are branch-specific, covering Computer Science (CS), Electronics (ECE), Mechanical (ME), Civil (CE), and Electrical (EE). Each subject is broken down into its mathematical and technical fundamentals. Our Virtual Calculator simulator ensures you are comfortable with the interface you will see on the exam day.",
            "The 'Numerical Answer Type' (NAT) questions are where most GATE aspirants lose marks. There is no guesswork here—you either know it or you don't. Exam Compass has a huge repository of NAT-specific questions with AI-generated feedback that points out common calculation errors and units-conversion mistakes.",
            "Beyond technical subjects, our platform offers a dedicated section for Engineering Mathematics and General Aptitude, which together account for 28-30% of the total marks. Mastering these can easily put you in the top 10% of candidates. Build your technical career with the precision of AI on Exam Compass."
        ],
        features: [
            { title: "Virtual Calculator Trainer", desc: "Get comfortable with the official GATE interface to save time during the actual exam.", iconColor: "text-orange-400" },
            { title: "NAT Mastery Series", desc: "Dedicated practice for Numerical Answer Type questions where accuracy is critical.", iconColor: "text-sky-400" },
            { title: "PSU Recruitment Tracker", desc: "Receive alerts on which PSUs are recruiting through GATE based on your mock scores.", iconColor: "text-emerald-400" }
        ],
        preparationStrategy: "Understand the core concepts of each subject. Practice previous 10-15 years' GATE papers. Focus heavily on Engineering Mathematics and Aptitude.",
        targetAudience: "Final year engineering students and graduates aiming for higher studies or PSU careers."
    },
    'clat': {
        title: "CLAT 2026: AI-Enhanced Reading and Legal Reasoning Mastery",
        longDescription: [
            "The Common Law Admission Test (CLAT) has shifted from a knowledge-based exam to a reading-intensive, passage-based assessment. Success now depends on your ability to process 450-word passages in under 5 minutes. Exam Compass is the only platform designed for this new pattern.",
            "Our CLAT module provides thousands of passage-based questions across Legal Reasoning, Logical Reasoning, English Language, Current Affairs, and Quantitative Techniques. Our AI tracks your 'reading speed' and 'comprehension accuracy' separately, telling you if you are reading too fast or missing key details.",
            "Legal Reasoning is the heart of CLAT. We provide passages based on recent landmark judgments and legal principles, helping you build the legal mindset required for National Law Universities (NLUs). Our AI mentor 'Exa' can explain complex legal jargon in simple terms, making the preparation accessible for students from all backgrounds.",
            "The current affairs section in CLAT requires a deep understanding of 'Why' and 'How' rather than just 'What.' Our curated passage-based news updates ensure you are prepared for the analytical nature of the GK section. Secure your seat at NLSIU or NALSAR with the data-driven edge of Exam Compass."
        ],
        features: [
            { title: "Comprehension Tracker", desc: "AI measures how well you understand long legal passages versus your reading speed.", iconColor: "text-violet-400" },
            { title: "Landmark Judgment Bank", desc: "A curated repository of legal passages based on real-world Supreme Court cases.", iconColor: "text-rose-400" },
            { title: "Passage-Based GK", desc: "Current affairs practice that mimics the analytical 400-word passage format of CLAT.", iconColor: "text-lime-400" }
        ],
        preparationStrategy: "Read newspapers daily to improve reading speed. Practice at least 3 passage-based sets for Legal and Logical Reasoning every day. Take full-length mocks twice a week.",
        targetAudience: "Class 11 and 12 students aiming for top law schools in India."
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
