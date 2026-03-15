export const examPersonality: Record<string, any> = {
    'jee-mains': {
        uniqueHook: "Cracking JEE Mains isn't just about hard work; it's about strategic repetition and minimizing negative marking under extreme pressure.",
        studentPain: "Students often waste months studying irrelevant high-level concepts while ignoring the high-weightage NCERT foundations.",
        winningEdge: "Top 99 percentilers don't just solve problems—they analyze their mistakes immediately and track topic-level accuracy.",
        statLine: "Only 2.5 lakh out of 14 lakh candidates qualify for JEE Advanced each year."
    },
    'neet': {
        uniqueHook: "NEET demands ruthless consistency and the ability to recall thousands of NCERT facts within seconds.",
        studentPain: "Biology feels endless, and Physics numericals trap students into wasting precious minutes during the real exam.",
        winningEdge: "Toppers read NCERT line-by-line multiple times and prioritize active recall over passive reading.",
        statLine: "With over 24 lakh applicants, the competition for government medical seats is fierce, requiring a score of 650+."
    },
    'upsc': {
        uniqueHook: "The UPSC Civil Services Exam is a marathon that tests your perseverance, clarity of thought, and analytical depth.",
        studentPain: "The vastness of the syllabus leaves many aspirants overwhelmed and unable to revise effectively.",
        winningEdge: "Successful candidates focus on limited, high-quality resources and relentlessly practice answer writing.",
        statLine: "With a success rate of less than 0.2%, structured preparation is non-negotiable."
    },
    'gate': {
        uniqueHook: "GATE requires absolute conceptual clarity and the ability to solve complex engineering problems quickly.",
        studentPain: "Relying purely on semester exams is a formula for failure; GATE demands a fundamentally different problem-solving approach.",
        winningEdge: "The highest scorers prioritize previous year questions (PYQs) and extensive mock test analysis.",
        statLine: "A top 100 rank can unlock PSUs and premier IISc/IIT programs instantly."
    },
    'clat': {
        uniqueHook: "CLAT is fundamentally a test of reading comprehension, critical reasoning, and processing speed.",
        studentPain: "Many students focus on rote memorizing legal trivia instead of building rapid reading stamina.",
        winningEdge: "Toppers train themselves to comprehend dense passages under immense ticking-clock pressure.",
        statLine: "NLSIU Bangalore and other top NLUs look for sharp analytical minds, not just hard workers."
    },
    'cat': {
        uniqueHook: "The CAT exam measures your aptitude, decision-making, and ability to handle complexity in real-time.",
        studentPain: "Falling into the trap of attempting every question rather than selecting the right battles kills percentiles.",
        winningEdge: "99+ percentilers are masters of question selection and time management.",
        statLine: "Less than 2% of candidates score high enough to receive IIM BLACKI calls."
    },
    'default': {
        uniqueHook: "Success in this exam belongs to those who bridge the gap between hard work and intelligent, data-driven execution.",
        studentPain: "Many students burn out by memorizing passively instead of actively testing their knowledge.",
        winningEdge: "The best performers relentlessly identify their weak chapters and focus their revision exclusively there.",
        statLine: "Consistent daily revision and mock analysis are proven to boost final scores by up to 30%."
    }
};

export const getExamPersonality = (examId: string) => {
    return examPersonality[examId] || examPersonality['default'];
};
