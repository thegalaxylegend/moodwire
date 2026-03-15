
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';
import { Footer } from '../../components/Footer';
import { SocialShare } from '../../components/SocialShare';
import { AuthorBio } from '../../components/AuthorBio';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { examDates } from '../../config/examDates';
import { getExamPersonality } from '../../data/examPersonality';
import { DirectAnswerBlock } from '../../components/seo/DirectAnswerBlock';
import { StudentTip } from '../../components/seo/StudentTip';



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

import { getExamContent } from '../../lib/examContent';

export const ExamLanding = () => {
    const { exam } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';
    const examDetail = getExamContent(exam || '');
    const [generatingPdf, setGeneratingPdf] = useState(false);
    
    const targetYear = examDates.getExamYear(exam || '');
    const personality = getExamPersonality(exam || '');

    const handleDownloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
            // Generate a high-level exam syllabus/guide
            const content = await generateCheatSheetContent(formattedExam, 'Full Syllabus Guide');
            if (content) await downloadCheatSheetPDF(content);
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };

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
            "name": examDetail.title,
            "description": examDetail.longDescription[0],
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
                title={`${formattedExam} Prep ${targetYear}: Syllabus, Notes, PYQ & Mock Test PDF`}
                description={`Master ${formattedExam} ${targetYear} with AI-powered mock tests, chapter-wise revision notes, and formula PDF. Explore the latest syllabus, practice PYQs, and boost your rank.`}
                canonical={`https://examcompass.web.app/${exam}`}
                keywords={`${formattedExam} preparation, ${formattedExam} mock test, ${formattedExam} syllabus pdf, ${formattedExam} revision notes, ${formattedExam} ${targetYear}`}
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
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h1 className="text-4xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Crack {formattedExam}
                    </h1>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={generatingPdf}
                            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {generatingPdf ? 'Generating...' : 'Syllabus PDF'}
                        </button>
                        <SocialShare title={`Crack ${formattedExam} with AI Practice & PYQs on Exam Compass`} />
                    </div>
                </div>

                <DirectAnswerBlock
                    title={`What is ${formattedExam}?`}
                    description={personality.uniqueHook}
                    impact={personality.statLine}
                />


                <article className="max-w-4xl mb-12 space-y-8">
                    {examDetail.longDescription.map((p, i) => (
                        <p key={i} className={`${i === 0 ? 'text-xl font-medium' : 'text-lg'} text-gray-300 leading-relaxed`}>
                            {p}
                        </p>
                    ))}
                    
                    <div className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20 mt-12">
                        <h3 className="text-xl font-bold text-blue-400 mb-4 tracking-tight uppercase text-sm">Strategic Preparation Edge</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            {examDetail.preparationStrategy} Success in {formattedExam} {targetYear} is reserved for those who can bridge the gap between hard work and intelligent, data-driven execution. Our AI models analyze every question you solve to suggest the exact topics that will increase your rank.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            <strong className="text-white">The Reality:</strong> {personality.studentPain} <br/><br/>
                            <strong className="text-white">The Winning Edge:</strong> {personality.winningEdge}
                        </p>
                    </div>

                    <StudentTip seedText={exam || 'default'} />
                </article>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {examDetail.features.map((feature, i) => (
                         <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all">
                            <h3 className={`text-2xl font-bold mb-4 ${feature.iconColor}`}>
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6 py-10">
                    <Link to={`/dashboard/mock?exam=${exam}`} rel="nofollow" className="inline-flex items-center gap-2 bg-white text-black px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform w-full md:w-auto justify-center text-lg">
                        Start {formattedExam} AI Mock Test <ArrowRight size={24} />
                    </Link>
                    <p className="text-gray-400 text-sm">
                        Analyzed for {formattedExam} {targetYear} pattern • <Link to="/dashboard/rank-predictor" rel="nofollow" className="text-purple-400 hover:text-purple-300 font-bold underline decoration-purple-500/30">Try AI Rank Predictor</Link>
                    </p>
                </div>

            </section>

            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
                <h2 className="text-3xl font-bold mb-10">Study by Subject</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {getSubjectsForExam(exam || '').map(subject => {
                        const allTopics = SYLLABUS_DB[subject] || [];
                        const classMatch = (exam || '').match(/class-(\d+)/);
                        const filteredTopics = classMatch 
                            ? allTopics.filter(t => t.class === `Class ${classMatch[1]}`)
                            : allTopics;

                        const topicCount = filteredTopics.length;
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
                            <Link to="/dashboard" rel="nofollow" className="text-purple-400 text-sm font-semibold hover:underline">View Roadmap →</Link>
                        </div>
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                            <h3 className="text-xl font-bold mb-4">Foundational Mastery</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Perfect for Class 11 or early starters. We focus on conceptual depth and building a strong theoretical base before diving into complex problem-solving. AI tracks your accuracy to ensure a 100% success rate on fundamentals.
                            </p>
                            <Link to="/dashboard" rel="nofollow" className="text-blue-400 text-sm font-semibold hover:underline">View Roadmap →</Link>
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
                                <summary className="text-lg font-semibold group-open:text-purple-400 transition-colors list-none flex justify-between items-center faq-question">
                                    {faq.question}
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">▼</span>
                                </summary>
                                <p className="mt-4 text-gray-300 leading-relaxed faq-answer">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                    
                    <div className="mt-20">
                        <AuthorBio 
                            name="Ayush"
                            role="Founder & EdTech Visionary"
                            bio="On a mission to make world-class competitive exam preparation accessible to every Indian student through AI. Built ExamCompass to ensure adaptive engines stay ahead of the latest exam patterns."
                            credentials={["Founder, Exam Compass", "AI Strategy Expert", "STEM Education Advocate"]}
                            linkedin="https://linkedin.com"
                            twitter="https://twitter.com"
                        />
                    </div>
                </section>
            )}


            <Footer />
        </div>
    );
};
