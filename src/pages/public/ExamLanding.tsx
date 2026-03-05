
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';
import { Footer } from '../../components/Footer';


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
                "logo": "https://examcompass.web.app/exa-logo.png",
                "sameAs": "https://examcompass.web.app",
                "url": "https://examcompass.web.app"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT10H"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "category": "Free"
            },
            "isAccessibleForFree": true
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
                title={`${formattedExam} Prep 2026: AI Mock Tests & PYQs`}
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
                <div className="flex items-center gap-3 text-sm text-gray-300 mb-6 uppercase tracking-widest">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-white">{formattedExam}</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Crack {formattedExam}
                </h1>

                <article className="max-w-4xl mb-12 space-y-6">
                    <p className="text-xl text-gray-300 font-medium leading-relaxed">
                        Master the complexities of {formattedExam} with the industry's most advanced AI-powered learning platform. Our ecosystem is custom-built to provide a rigorous, data-driven approach to one of India's most challenging entrance examinations, ensuring you're not just studying, but studying effectively.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Preparing for {formattedExam} is an endurance race that requires exceptional conceptual clarity, speed, and accuracy. At Exam Compass, we bridge the gap between hard work and smart work. Our platform features over {getSubjectsForExam(exam || '').length} meticulously mapped subjects, providing a complete chapter-wise breakdown of the entire {formattedExam} syllabus. From high-weightage topics that appear year after year to the most obscure concepts, we ensure nothing is left to chance.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        What sets us apart is our proprietary AI-driven preparation engine. Unlike static test series that treat every aspirant the same, Exam Compass adapts to your unique learning curve. Our algorithms analyze every attempt, identifying your personal "blind spots" and knowledge gaps. This allows the platform to generate personalized mock tests that focus specifically on the areas where you need the most improvement, drastically reducing time wasted on already mastered topics.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Gain a competitive edge with our database of 9,000+ verified Previous Year Questions (PYQs). Each question is accompanied by a detailed AI-generated explanation that doesn't just give you the answer, but teaches you the logic, shortcut techniques, and common pitfalls to avoid during the actual {formattedExam} exam. Track your real-time probability of selection, visualize your progress through advanced analytics, and build the confidence required to crack the exam 2026.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Beyond just testing, we offer dynamic learning roadmaps. If you're struggling with a particular topic in {getSubjectsForExam(exam || '')[0] || 'your syllabus'}, the AI will automatically suggest high-yield subjects and video lectures from our curated collection to reinforce your foundation. With Exam Compass, your preparation is constant, evolving, and always targeted toward your dream college admission.
                    </p>
                </article>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-purple-400">Selection Probability AI</span>
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Our proprietary algorithm calculates your readiness for {formattedExam} based on accuracy, speed, and consistency. Unlike traditional percentages, Selection Probability takes into account the difficulty of questions you're solving compared to the thousands of other aspirants on the platform.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
                            <span>Real-time tracking</span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span>Competitive indexing</span>
                        </div>
                    </div>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-pink-400">Real-Time Analytics</span>
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Don't wait for the weekly mock result to know where you stand. Every question you answer in {formattedExam} practice sets feeds into your live performance dashboard. We track your "Fatigue Point" — the moment your accuracy drops — to suggest the ideal time for your study breaks.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest">
                            <span>Fatigue detection</span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span>Subject heatmaps</span>
                        </div>
                    </div>
                </div>

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
                                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors uppercase text-sm tracking-wide text-gray-400">{subject} Core</h3>
                                <p className="text-sm text-gray-300">{topicCount} Topics • {topicCount * 15}+ Questions</p>
                                <div className="mt-4 text-xs text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Explore Modules <ArrowRight size={12} />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-20 pt-10 border-t border-white/10">
                    <h2 className="text-2xl font-bold mb-6">Preparation Roadmaps</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                            <h3 className="text-xl font-bold mb-4">The 90-Day Sprint</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Designed for students in the final stretch. This roadmap prioritizes high-weightage chapters in {getSubjectsForExam(exam || '').join(', ')} and focuses on solving at least 50 PYQs daily to build muscle memory and speed for {formattedExam}.
                            </p>
                            <Link to="/dashboard" className="text-purple-400 text-sm font-semibold hover:underline">View Roadmap →</Link>
                        </div>
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                            <h3 className="text-xl font-bold mb-4">Foundational Mastery</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Perfect for Class 11 or early starters. We focus on conceptual depth and building a strong theoretical base before diving into complex problem-solving. AI tracks your accuracy to ensure a 100% success rate on fundamentals.
                            </p>
                            <Link to="/dashboard" className="text-blue-400 text-sm font-semibold hover:underline">View Roadmap →</Link>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-white/10">
                    <h2 className="text-2xl font-bold mb-6 italic text-gray-500">Compare with Other Goals</h2>
                    <div className="flex flex-wrap gap-3">
                        {['JEE Mains', 'NEET', 'UPSC', 'GATE', 'CLAT', 'Class 12'].filter(e => slugify(e) !== exam).map(other => (
                            <Link
                                key={other}
                                to={`/${slugify(other)}`}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 text-xs text-gray-400 hover:text-white transition-all"
                            >
                                {other}
                            </Link>
                        ))}
                    </div>
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
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">▼</span>
                                </summary>
                                <p className="mt-4 text-gray-300 leading-relaxed">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};
