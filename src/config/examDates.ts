export const examDates = {
    currentYear: new Date().getFullYear(),
    nextYear: new Date().getFullYear() + 1,
    dates: {
        'jee-mains': new Date(`${new Date().getFullYear()}-01-20`),
        'jee-advanced': new Date(`${new Date().getFullYear()}-06-01`),
        'neet': new Date(`${new Date().getFullYear()}-05-01`),
        'upsc': new Date(`${new Date().getFullYear()}-05-25`),
        'clat': new Date(`${new Date().getFullYear()}-12-01`),
        'gate': new Date(`${new Date().getFullYear()}-02-01`),
        'bitsat': new Date(`${new Date().getFullYear()}-05-15`),
        'cat': new Date(`${new Date().getFullYear()}-11-25`),
    },
    getExamYear: (examId: string) => {
        const currentYear = new Date().getFullYear();
        const examDate = examDates.dates[examId as keyof typeof examDates.dates];
        if (!examDate) return currentYear;
        // If today is past the exam date for the current year, target next year
        return new Date() > examDate ? currentYear + 1 : currentYear;
    }
};
