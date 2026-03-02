
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';


// FAQ data per exam for rich snippets
const EXAM_FAQS: Record<string, { question: string; answer: string }[]> = {
    'jee-mains': [
        { question: "How many questions are in JEE Mains?", answer: "JEE Mains has 75 questions across Physics (25), Chemistry (25), and Mathematics (25). Each section has 20 mandatory MCQs and 5 numerical value questions (attempt any)." },
        { question: "What is the best way to prepare for JEE Mains 2026?", answer: "Focus on NCERT for Class 11 and 12, solve previous year questions (PYQs), take regular mock tests, and use adaptive AI practice to identify weak topics. Exam Compass provides all of these in one platform." },
        { question: "Is JEE Mains online or offline?", answer: "JEE Mains is conducted in Computer Based Test (CBT) mode online at designated exam centers across India." }
    ],
    'jee-advanced': [
        { question: "Who is eligible for JEE Advanced?", answer: "Only the top 2,50,000 rank holders in JEE Mains are eligible to appear for JEE Advanced. Candidates must have passed Class 12 with at least 75% marks (65% for reserved categories)." },
        { question: "What is the pattern of JEE Advanced?", answer: "JEE Advanced consists of two papers (Paper 1 and Paper 2), each 3 hours long. Questions include MCQ (single/multi-correct), integer type, and matching type questions in Physics, Chemistry, and Mathematics." },
        { question: "How to prepare for JEE Advanced effectively?", answer: "Master conceptual clarity through HC Verma, Irodov for Physics, Morrison Boyd for Chemistry, and Cengage for Mathematics. Practice previous year papers extensively and take timed mock tests." }
    ],
    'neet': [
        { question: "How many questions are in NEET?", answer: "NEET has 200 questions (180 to be attempted) across Physics (45), Chemistry (45), Botany (45), and Zoology (45). Each correct answer gives +4 marks and each wrong answer gives -1 mark." },
        { question: "What is a good score in NEET?", answer: "A score above 620+ out of 720 is considered excellent for top government medical colleges. For a general category seat, typically 550+ is needed." },
        { question: "Is NCERT enough for NEET?", answer: "NCERT is the foundation and covers ~90% of NEET Biology. For Physics and Chemistry, supplement NCERT with standard reference books and previous year questions." }
    ],
    'upsc': [
        { question: "How to start UPSC preparation?", answer: "Begin with understanding the syllabus and exam pattern. Start with NCERT books for all subjects (Class 6-12), then move to standard references. Read the newspaper daily and practice answer writing." },
        { question: "How many attempts are allowed in UPSC?", answer: "General category candidates get 6 attempts, OBC gets 9 attempts, and SC/ST candidates have unlimited attempts until the age limit of 32/35/37 years respectively." },
        { question: "What are the stages of UPSC CSE?", answer: "UPSC Civil Services Examination has three stages: Prelims (MCQ-based screening), Mains (descriptive written exam), and Interview (personality test)." }
    ],
    'clat': [
        { question: "What is CLAT exam?", answer: "CLAT (Common Law Admission Test) is a national-level entrance exam for admission to 22 National Law Universities in India for UG (BA LLB) and PG (LLM) law programs." },
        { question: "What is the CLAT exam pattern?", answer: "CLAT UG has 120 questions in 120 minutes covering English Language, Current Affairs, Legal Reasoning, Logical Reasoning, and Quantitative Techniques. All questions are passage-based." },
        { question: "What is a good CLAT score?", answer: "A score of 100+ out of 120 is considered excellent. For top NLUs like NLSIU Bangalore, typically 110+ is needed for general category." }
    ],
    'gate': [
        { question: "What is GATE exam used for?", answer: "GATE (Graduate Aptitude Test in Engineering) scores are used for admissions to M.Tech/PhD programs in IITs/NITs, and for recruitment in PSUs like IOCL, NTPC, ONGC, BHEL, etc." },
        { question: "How many times can I attempt GATE?", answer: "There is no limit on the number of attempts for GATE. Candidates can appear for GATE any number of times. GATE scores are valid for 3 years from the date of announcement of results." },
        { question: "Is GATE tough?", answer: "GATE is considered challenging due to its vast syllabus and conceptual depth. Only about 15-17% of candidates qualify, making regular practice and mock tests essential." }
    ],
    'bitsat': [
        { question: "What is BITSAT exam?", answer: "BITSAT (Birla Institute of Technology and Science Admission Test) is an online entrance exam for admission to all BITS campuses — Pilani, Goa, and Hyderabad." },
        { question: "How many questions are in BITSAT?", answer: "BITSAT has 130 questions in 180 minutes covering Physics (30), Chemistry (30), Mathematics (40), English Proficiency (10), and Logical Reasoning (20)." },
        { question: "What is the cutoff for BITS Pilani?", answer: "For CS at BITS Pilani, the cutoff is typically 340+ out of 390. For other branches, it ranges from 250-320 depending on the campus and branch." }
    ]
};

// Generate FAQ schema for class pages
const getClassFAQs = (classNum: string): { question: string; answer: string }[] => [
    { question: `What subjects are covered for ${classNum} on Exam Compass?`, answer: `Exam Compass covers Mathematics, Science, Social Science, English, and Hindi for ${classNum} with chapter-wise practice questions, AI mock tests, and detailed solutions following the CBSE/NCERT curriculum.` },
    { question: `How can AI help in ${classNum} exam preparation?`, answer: `Our AI engine generates unlimited practice questions at your difficulty level, identifies weak topics, creates personalized study plans, and provides instant doubt resolution — all aligned with the ${classNum} NCERT syllabus.` },
    { question: `Are the questions based on the latest ${classNum} syllabus?`, answer: `Yes, all questions are generated based on the latest CBSE/NCERT ${classNum} syllabus and are regularly verified for accuracy and relevance.` }
];


export const ExamLanding = () => {
    const { exam } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';

    // Get FAQ data for this exam
    const isClassPage = exam?.startsWith('class-');
    const classNum = isClassPage ? exam?.replace('class-', 'Class ') : null;
    const faqs = isClassPage && classNum
        ? getClassFAQs(classNum)
        : (EXAM_FAQS[exam || ''] || []);

    // Build schema array
    const schemaGraph: any[] = [
        {
            "@type": "Course",
            "name": `${formattedExam} Preparation`,
            "description": `Comprehensive ${formattedExam} preparation with AI-generated mock tests, PYQs, and deep analytics.`,
            "provider": {
                "@type": "Organization",
                "name": "Exam Compass",
                "sameAs": "https://examcompass.web.app"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online"
            }
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://examcompass.web.app/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": formattedExam,
                    "item": `https://examcompass.web.app/${exam}`
                }
            ]
        }
    ];

    // Add FAQ Schema if we have data
    if (faqs.length > 0) {
        schemaGraph.push({
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer
                }
            }))
        });
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${formattedExam} Preparation 2026 | AI Mock Tests, PYQs & Study Plans`}
                description={`Crack ${formattedExam} with AI-generated mock tests, 5000+ PYQs, real-time analytics, and personalized study plans. Free practice for ${formattedExam} 2026.`}
                canonical={`https://examcompass.web.app/${exam}`}
                keywords={`${formattedExam} preparation, ${formattedExam} mock test, ${formattedExam} PYQ, ${formattedExam} practice questions, ${formattedExam} 2026`}
                schema={{
                    "@context": "https://schema.org",
                    "@graph": schemaGraph
                }}
            />
            <Navbar />

            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Crack {formattedExam}
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mb-10">
                    The smartest way to prepare. AI-driven mock tests, real-time analytics, and rigorous practice questions for {formattedExam}.
                </p>
                <Link to={`/dashboard/mock?exam=${exam}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                    Start {formattedExam} Mock Test <ArrowRight size={20} />
                </Link>
            </section>

            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
                <h2 className="text-3xl font-bold mb-10">Study by Subject</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {getSubjectsForExam(exam || '').map(subject => {
                        const topicCount = SYLLABUS_DB[subject]?.length || 0;
                        if (topicCount === 0) return null; // Skip empty subjects

                        return (
                            <Link
                                key={subject}
                                to={`/${exam}/${slugify(subject)}`}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                            >
                                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{subject}</h3>
                                <p className="text-sm text-gray-400">{topicCount} Topics • {topicCount * 15}+ Questions</p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* FAQ Section — Visible to users AND Google crawlers for rich snippets */}
            {faqs.length > 0 && (
                <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
                    <h2 className="text-3xl font-bold mb-10">Frequently Asked Questions</h2>
                    <div className="space-y-6 max-w-3xl">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="group p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
                                <summary className="text-lg font-semibold group-open:text-purple-400 transition-colors list-none flex justify-between items-center">
                                    {faq.question}
                                    <span className="text-gray-500 group-open:rotate-180 transition-transform text-xl">▼</span>
                                </summary>
                                <p className="mt-4 text-gray-400 leading-relaxed">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
