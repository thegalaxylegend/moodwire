import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { SYLLABUS_DB, SOCIAL_LINKS } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';
import { Footer } from '../../components/Footer';
import { useState } from 'react';
import { examDates } from '../../config/examDates';
import { getExamPersonality } from '../../data/examPersonality';
import { DirectAnswerBlock } from '../../components/seo/DirectAnswerBlock';
import { SITE_URL, SITE_LOGO } from '../../lib/siteConfig';
import { StudentTip } from '../../components/seo/StudentTip';
import * as Icons from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';



const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/10">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left hover:text-purple-400 transition-colors"
            >
                <span className="text-xl font-bold">{question}</span>
                <Icons.ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-400 leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};



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

};

// Generate FAQ schema for class pages
const getClassFAQs = (classNum: string): { question: string; answer: string }[] => [
    { question: `What subjects are covered for ${classNum} on Exam Compass?`, answer: `Exam Compass covers Mathematics, Science, Social Science, English, and Hindi for ${classNum} with chapter-wise practice questions, AI mock tests, and detailed solutions following the CBSE/NCERT curriculum.` },
    { question: `How can AI help in ${classNum} exam preparation?`, answer: `Our AI engine generates unlimited practice questions at your difficulty level, identifies weak topics, creates personalized study plans, and provides instant doubt resolution — all aligned with the ${classNum} NCERT syllabus.` },
    { question: `Are the questions based on the latest ${classNum} syllabus?`, answer: `Yes, all questions are generated based on the latest CBSE/NCERT ${classNum} syllabus and are regularly verified for accuracy and relevance.` }
];

import { getExamContent } from '../../lib/examContent';
import { NotFoundPage } from './NotFoundPage';

export const ExamLanding = () => {
    const { exam } = useParams();
    const examDetail = getExamContent(exam || '');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    if (!examDetail) {
        return <NotFoundPage />;
    }

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';
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
                "logo": SITE_LOGO,
                "sameAs": [
                    "https://www.youtube.com/@moodwire",
                    SOCIAL_LINKS.twitter.url,
                    SOCIAL_LINKS.threads.url
                ],
                "url": SITE_URL
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
                    "item": `${SITE_URL}/`
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": formattedExam,
                    "item": `${SITE_URL}/${exam}`
                }
            ]
        }
    ];

    // INJECT FAQ SCHEMA FOR SEO AUTHORITY
    if (faqs && faqs.length > 0) {
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

    const { tier } = usePerformance();
    const isElite = tier === 'elite';
    const isLow = tier === 'low';
    
    const { scrollY } = useScroll();
    
    const heroY = useTransform(scrollY, [0, 500], [0, isElite ? 100 : 0]);
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className={`min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-x-hidden perf-tier-${tier} relative`}>
            <SEO
                title={examDetail.title + ` | Exam Compass ${targetYear}`}
                description={examDetail.subTitle || `Master ${formattedExam} ${targetYear} with AI-powered mock tests, chapter-wise revision notes, and formula PDF.`}
                canonical={`${SITE_URL}/${exam}`}
                keywords={`${formattedExam} preparation, ${formattedExam} mock test, ${formattedExam} syllabus pdf, ${formattedExam} revision notes, ${formattedExam} ${targetYear}`}
                schema={{
                    "@context": "https://schema.org",
                    "@graph": schemaGraph
                }}
            />
            <Navbar />
            
            {/* ADVANCED MARKETING HERO */}
            <section className="pt-24 md:pt-40 pb-20 px-6 max-w-7xl mx-auto relative overflow-hidden">
                {!isLow && (
                    <motion.div 
                        style={{ y: heroY, opacity: heroOpacity }}
                        className={`absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 -z-10 rounded-full will-change-transform ${isElite ? 'blur-[130px]' : 'blur-[60px]'}`} 
                    />
                )}
                
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <motion.div 
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 text-center lg:text-left"
                    >
                        <nav className="flex items-center justify-center lg:justify-start gap-3 text-xs text-purple-400 mb-8 uppercase tracking-[0.2em] font-bold" aria-label="Breadcrumb">
                            <Link to="/" className="hover:text-white transition-colors">Exam Compass</Link>
                            <span>/</span>
                            <span className="text-white">{formattedExam} {targetYear}</span>
                        </nav>

                        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9] text-white">
                            {examDetail.title.split(':').map((part, i) => (
                                <span key={i} className={i === 1 ? "block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mt-2" : ""}>
                                    {part}
                                </span>
                            ))}
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            {examDetail.subTitle || `The only AI-driven study ecosystem engineered to help you crack ${formattedExam} with precision.`}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12">
                            <Link to={`/dashboard/mock?exam=${exam}`} className="group relative px-8 py-5 bg-white text-black rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-[0_20px_40px_rgba(168,85,247,0.25)] flex items-center gap-2">
                                Start Your AI Mock Test 
                                <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button 
                                onClick={handleDownloadPDF}
                                disabled={generatingPdf}
                                className="px-8 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md"
                            >
                                {generatingPdf ? <Icons.Loader2 className="w-5 h-5 animate-spin" /> : <Icons.Download className="w-5 h-5" />}
                                Syllabus PDF
                            </button>
                        </div>

                        {/* Success Stats */}
                        {examDetail.successStats && (
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 border-t border-white/10 pt-10">
                                {examDetail.successStats.map((stat, i) => (
                                    <div key={i} className="text-center lg:text-left">
                                        <div className="text-2xl font-black text-white">{stat.value}</div>
                                        <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div 
                        initial={false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="w-full lg:w-[450px] relative group flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-colors" />
                        
                        {/* Static High-Quality Marketing Visual/Trust Card */}
                        <div className="relative z-10 w-full p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl hover:scale-105 transition-transform duration-500 will-change-transform">
                             <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                                <Icons.PieChart className="w-10 h-10 text-white" />
                             </div>
                             <h3 className="text-3xl font-black mb-4 text-white">Syllabus Mastery</h3>
                             <p className="text-gray-400 font-medium mb-8 leading-relaxed">We map every sub-topic and diagram to ensure 100% curriculum coverage for {formattedExam} 2026.</p>
                             
                             <div className="flex items-center gap-4 py-4 border-t border-white/5">
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <Icons.Activity className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-sm font-bold text-gray-300">Live Accuracy Tracking</div>
                             </div>
                             <div className="text-xs uppercase tracking-widest font-black text-purple-500/50 mt-4">Precision over Volume</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* THE AI UNFAIR ADVANTAGE GRID */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">The AI Unfair Advantage</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">Standard coaching is dead. Data-driven precision is the only way to beat the competition at this scale.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {examDetail.features.map((usp, i) => (
                        <motion.div 
                            key={i}
                            initial={tier === 'elite' ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="group p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all relative overflow-hidden will-change-transform"
                        >
                            {!isLow && <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 blur-[50px] group-hover:bg-purple-500/10 transition-colors" />}
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 group-hover:scale-110 transition-transform">
                                <Icons.Zap className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">{usp.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{usp.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* EXAM PATTERN BREAKDOWN */}
            <motion.section 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-20 px-6 max-w-7xl mx-auto border-y border-white/5"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <motion.div 
                        initial={isLow ? {} : { opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl font-black mb-6 tracking-tight font-serif italic italic underline decoration-purple-500/30">Exam Pattern {targetYear}</h2>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed">Understanding the blueprint is the first step to conquering it. We've optimized our mocks to match these exact parameters.</p>
                        
                        <div className="space-y-4">
                            {[
                                { label: "Duration", value: exam === 'neet' ? "200 Minutes" : "180 Minutes" },
                                { label: "Total Questions", value: exam === 'neet' ? "200 (180 Mandatory)" : "90 (75 Mandatory)" },
                                { label: "Marking", value: "+4 for Correct, -1 for Incorrect" },
                                { label: "Mode", value: exam === 'neet' ? "Offline (OMR)" : "Online (CBT)" }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={isLow ? {} : { opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
                                >
                                    <span className="font-bold text-gray-400 italic">{item.label}</span>
                                    <span className="font-black text-white">{item.value}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-[3rem] p-12 border border-white/10 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8">
                            <Icons.TrendingUp className="w-20 h-20 text-purple-500/10 group-hover:text-purple-500/20 transition-colors" />
                         </div>
                         <h3 className="text-2xl font-black mb-8 text-white uppercase tracking-widest">The Win Matrix</h3>
                         <div className="space-y-12">
                             <div>
                                 <div className="flex justify-between mb-3 text-xs font-black uppercase text-purple-400 tracking-widest">Foundation (NCERT)</div>
                                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.5 }} className="h-full bg-purple-500" />
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between mb-3 text-xs font-black uppercase text-blue-400 tracking-widest">Application (PYQs)</div>
                                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.2 }} className="h-full bg-blue-500" />
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between mb-3 text-xs font-black uppercase text-pink-400 tracking-widest">Elite Mastery (Mocks)</div>
                                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.4 }} className="h-full bg-pink-500" />
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </motion.section>

            <section className="py-20 px-6 max-w-7xl mx-auto">
                <DirectAnswerBlock
                    title={`The Reality of ${formattedExam}`}
                    description={personality.uniqueHook}
                    impact={personality.statLine}
                />

                <article className="max-w-4xl mx-auto my-20 space-y-16">
                    {examDetail.longDescription.map((p, i) => (
                        <motion.p 
                            key={i} 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className={`${i === 0 ? 'text-3xl font-black text-white mb-16 leading-[1.1] tracking-tight' : 'text-xl'} text-gray-300 leading-relaxed border-l-4 border-purple-500/20 pl-10`}
                        >
                            {p}
                        </motion.p>
                    ))}
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-white/10 relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute top-0 right-0 p-8">
                            <Icons.ShieldCheck className="w-16 h-16 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
                        </div>
                        <h3 className="text-sm font-black text-blue-400 mb-6 tracking-[0.3em] uppercase">Strategic Winning Edge</h3>
                        <p className="text-3xl text-gray-200 leading-tight mb-12 font-black tracking-tight">
                            Success in {formattedExam} {targetYear} isn't about how much you study, it's about how <span className="text-white underline decoration-blue-500/50 underline-offset-8">effectively</span> you practice.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                            <div>
                                <div className="text-xs font-black text-gray-500 uppercase mb-3 tracking-widest">Common Mistake</div>
                                <div className="text-gray-300 border-l-2 border-red-500/40 pl-4 italic leading-relaxed text-lg">"{personality.studentPain}"</div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Exam Compass Way</div>
                                <div className="text-white border-l-2 border-blue-500 pl-4 font-bold leading-relaxed text-lg">"{personality.winningEdge}"</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Extended Expert Content */}
                    {examDetail.longDescriptionExtended && (
                        <div className="space-y-12">
                             {examDetail.longDescriptionExtended.map((p, i) => (
                                <motion.p 
                                    key={i} 
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="text-xl text-gray-400 leading-relaxed italic border-l-4 border-white/10 pl-10"
                                >
                                    {p}
                                </motion.p>
                            ))}
                        </div>
                    )}

                    <StudentTip seedText={exam || 'default'} />
                </article>

                {/* THE SYLLABUS HUB */}
                <section className="py-20 border-t border-white/10">
                    <h2 className="text-4xl font-black mb-12 tracking-tight">Subject Roadmaps</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {getSubjectsForExam(exam || '').map(subject => {
                            const allTopics = SYLLABUS_DB[subject] || [];
                            const classMatch = (exam || '').match(/class-(\d+)/);
                            const filteredTopics = classMatch 
                                ? allTopics.filter(t => t.class === `Class ${classMatch[1]}`)
                                : allTopics;

                            const topicCount = filteredTopics.length;
                            if (topicCount === 0) return null;

                            return (
                                <Link
                                    key={subject}
                                    to={`/${exam}/${slugify(subject)}`}
                                    className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group relative overflow-hidden"
                                >
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors uppercase text-sm tracking-widest text-gray-500">{subject} Mastery</h3>
                                    <p className="text-gray-300 font-bold">{topicCount} Technical Modules</p>
                                    <div className="mt-6 flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                        Open Guide <Icons.ArrowRight size={14} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* EXPERT FAQ SECTION */}
                <motion.section 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-32 border-t border-white/10 pt-20"
                >
                    <h2 className="text-4xl font-black mb-12 tracking-tight italic">Expert Aspirant FAQ</h2>
                    <div className="space-y-2">
                        <FAQItem 
                            question="How often should I take a full-length mock test?" 
                            answer={exam === 'neet' ? "For NEET, start with one full mock every Sunday. As the exam nears (last 2 months), increase this to 3 mocks per week to build OMR endurance." : "For JEE, we recommend one full CBT mock every week initially, moving to alternate days in the last month to master the 75-question time-split."} 
                        />
                        <FAQItem 
                            question="Is it better to focus on weak topics or strong ones?" 
                            answer="Our AI recommends a 70/30 split. Dedicate 70% of your time to bridging gaps in weak chapters identified in your heatmaps, and 30% to maintaining speed in your strong areas." 
                        />
                        <FAQItem 
                            question="How does the AI solve my doubts?" 
                            answer="Exa AI uses a massive database of STEM concepts and PYQs. Simply type your question or paste a snippet, and it provides a step-by-step breakdown of the logic, not just the final answer." 
                        />
                        <FAQItem 
                            question="Are these tests based on the latest NTA pattern?" 
                            answer={`Yes, all our modules are updated for the ${targetYear} cycle, including the Section B optional question format and negative marking for numerical entries.`} 
                        />
                    </div>
                </motion.section>

                <div className="flex flex-col items-center gap-8 py-20 bg-gradient-to-b from-transparent to-purple-900/10 rounded-[4rem] border border-white/[0.03]">
                    <Link to={`/dashboard/mock?exam=${exam}`} rel="nofollow" className="inline-flex items-center gap-2 bg-white text-black px-12 py-7 rounded-2xl font-black hover:scale-105 transition-transform w-full md:w-auto justify-center text-xl shadow-[0_25px_50px_rgba(0,0,0,0.4)]">
                        Start Your AI Mock Journey <Icons.ArrowRight size={24} />
                    </Link>
                    <div className="flex items-center gap-4 text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">
                        <span>Updated 2026</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <Link to="/dashboard/rank-predictor" rel="nofollow" className="text-purple-400 hover:underline">Rank Predictor</Link>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span>Official PYQ database</span>
                    </div>
                </div>
            </section>

            {/* FOUNDER'S MISSION */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="p-12 md:p-20 rounded-[4rem] bg-zinc-950 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12">
                        <Icons.Compass className="w-32 h-32 text-white/5 group-hover:text-purple-500/10 transition-colors rotate-12" />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl font-black italic">A</div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black mb-6 text-white tracking-tight">The Mission Behind the Code</h3>
                            <p className="text-2xl text-gray-300 leading-relaxed mb-10 font-medium max-w-3xl">
                                "Exam Compass was born from a simple realization: Most students fail not because they lack discipline, but because they are practicing in the dark. We built this platform to turn the lights on—providing the exact data and AI mentorship needed to make every hour of study count."
                            </p>
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-white font-black text-xl">Ayush Kumar</div>
                                    <div className="text-purple-400 text-sm font-bold uppercase tracking-widest">Founder & Visionary</div>
                                </div>
                                <div className="flex gap-4 ml-6 pl-6 border-l border-white/5">
                                    <a href={SOCIAL_LINKS.twitter.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Icons.Twitter size={24}/></a>
                                    <a href={SOCIAL_LINKS.linkedin.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><Icons.Linkedin size={24}/></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
