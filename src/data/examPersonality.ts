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
