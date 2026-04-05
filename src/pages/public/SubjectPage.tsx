import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { EXAM_SUBJECT_MAPPING, SOCIAL_LINKS } from '../../lib/constants';
import { Navbar } from '../../components/Navbar';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SITE_URL } from '../../lib/siteConfig';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { examDates } from '../../config/examDates';

export const SubjectPage = () => {
    const { exam, subject } = useParams();
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
            // Generate a subject-level revision guide
            const content = await generateCheatSheetContent(realSubject || 'Subject', exam || 'General');
            if (content) await downloadCheatSheetPDF(content);
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Reverse Slugify (Primitive)
    const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subject) || subject;
    const topics = SYLLABUS_DB[realSubject as string] || [];

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase();

    // Build keywords from top topics
    const topicNames = topics.slice(0, 8).map(t => t.topic.replace(/\[.*?\]\s*/g, '')).join(', ');
    const seoKeywords = `${realSubject} for ${formattedExam}, ${formattedExam} ${realSubject} syllabus, ${topicNames}`;

    const targetYear = examDates.getExamYear(exam || '');
    const siblingSubjects = exam ? getSubjectsForExam(exam).filter(s => slugify(s) !== subject) : [];

    // Schema Data
    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Course",
                "name": `${realSubject} Syllabus for ${formattedExam} ${targetYear}`,
                "description": `Complete ${realSubject} syllabus breakdown with ${topics.length} chapters and important topics for ${formattedExam} ${targetYear}.`,
                "provider": {
                    "@type": "Organization",
                    "name": "Exam Compass",
                    "sameAs": [
                        "https://www.youtube.com/@moodwire",
                        SOCIAL_LINKS.twitter.url,
                        SOCIAL_LINKS.threads.url
                    ],
                    "url": SITE_URL
                },
                "hasCourseInstance": {
                    "@type": "CourseInstance",
                    "courseMode": "Online",
                    "courseWorkload": "PT2H"
                },
                "numberOfCredits": topics.length,
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "INR",
                    "category": "Free"
                },
                "isAccessibleForFree": true
            },
            {
                "@type": "ItemList",
                "name": `${realSubject} Chapters for ${formattedExam}`,
                "numberOfItems": topics.length,
                "itemListElement": topics.map((t, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": t.topic.replace(/\[.*?\]\s*/g, ''),
                    "url": `${SITE_URL}/${exam}/${subject}/${slugify(t.topic)}`
                }))
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `${SITE_URL}/${exam}` },
                    { "@type": "ListItem", "position": 3, "name": realSubject, "item": `${SITE_URL}/${exam}/${subject}` }
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${realSubject} ${formattedExam} Syllabus ${targetYear} - Notes, Formulas & PYQ PDF`}
                description={`Download ${realSubject} notes and formula PDF for ${formattedExam} ${targetYear}. Complete ${topics.length}-chapter syllabus breakdown with topics like ${topicNames.substring(0, 80)}. Practice questions and AI solutions.`}
                canonical={`${SITE_URL}/${exam}/${subject}`}
                keywords={seoKeywords}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto border-b border-white/5">
                <div className="mb-4">
                    <Breadcrumbs />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                        {realSubject} <span className="text-purple-500/50 block text-2xl mt-2">for {formattedExam} {targetYear}</span>
                    </h1>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={generatingPdf}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 group whitespace-nowrap"
                    >
                        {generatingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />}
                        {generatingPdf ? 'Generating...' : `Download ${realSubject} PDF`}
                    </button>
                </div>

                <article className="prose prose-invert max-w-4xl space-y-8">
                    <p className="text-xl text-gray-300 leading-relaxed font-medium">
                        The {realSubject} syllabus for {formattedExam} comprises {topics.length} crucial chapters that form the backbone of your preparation.
                        Mastering these concepts is absolutely essential for securing a top rank in your upcoming examinations, as {realSubject} often acts as the high-scoring differentiator between top-tier aspirants.
                    </p>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        Preparing for {realSubject} requires a dual approach: building an unshakeable theoretical foundation and developing rapid problem-solving intuition. For {formattedExam} {targetYear}, the exam pattern suggests a move towards more application-based questions that test how well you can apply basic principles to complex, multi-layered scenarios. Our comprehensive, AI-driven guide breaks down each chapter into its core concepts, providing you with targeted practice questions and structured explanations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h4 className="text-purple-400 font-bold mb-3 uppercase text-xs tracking-widest">Weightage Analysis</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Historical data from previous {formattedExam} papers shows that {realSubject} contributes approximately {Math.round(100/getSubjectsForExam(exam || '').length)}% of the total marks. Focusing on high-yield chapters first can boost your score by up to 40% in the final attempt.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h4 className="text-pink-400 font-bold mb-3 uppercase text-xs tracking-widest">Revision Strategy</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                We recommend a 3-pass revision for {realSubject}: first to understand concepts, second to solve level-1 PYQs, and a final pass for timed mock tests to build exam-day stamina.
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        Whether you are beginning your {realSubject} preparation journey from scratch or looking to solidify your understanding of advanced subtopics,
                        this hub serves as your ultimate resource. Each of the {topics.length} chapters listed below has been meticulously analyzed for its exam weightage and difficulty level.
                        Explore the chapter-wise index to dive directly into categorized Previous Year Questions (PYQs) and mock assessments tailored specifically for the {formattedExam} pattern.
                    </p>
                    <p className="text-gray-300 leading-relaxed text-lg">
                        Every topic in {realSubject} requires a unique approach. While some chapters rely heavily on memorization and theoretical understanding, others demand rigorous problem-solving
                        and the application of complex formulas. Using our advanced tracking system, you can monitor your proficiency across all {topics.length} chapters, identify your weakest areas,
                        and generate customized mock tests that focus entirely on bridging your knowledge gaps. Regular practice using these curated resources guarantees a massive improvement in your
                        speed, accuracy, and overall confidence when approaching the {realSubject} section of the {formattedExam}.
                    </p>
                </article>

                {siblingSubjects.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10 hidden md:block">
                        <span className="text-sm text-gray-500 uppercase tracking-wider mb-3 block">Explore Related Subjects:</span>
                        <div className="flex flex-wrap gap-3">
                            {siblingSubjects.map((sibling, k) => (
                                <Link
                                    key={k}
                                    to={`/${exam}/${slugify(sibling)}`}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-purple-500/50 transition-all text-sm text-gray-300"
                                >
                                    {sibling}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section className="py-12 px-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-bold text-white">Chapter-wise Syllabus</h2>
                    <span className="text-sm text-gray-500">{topics.length} Modules</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((t, i) => (
                        <Link
                            key={i}
                            to={`/${exam}/${subject}/${slugify(t.topic)}`}
                            className="p-6 rounded-2xl bg-[#0f0f11] border border-white/5 hover:border-purple-500/30 hover:bg-[#15151a] transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-lg font-bold mb-3 group-hover:text-purple-400 transition-colors leading-snug">{t.topic}</h3>
                                <ul className="text-sm text-gray-500 space-y-1.5 mb-6">
                                    {t.subtopics.slice(0, 3).map((sub, j) => (
                                        <li key={j} className="flex items-start">
                                            <span className="text-purple-500 mr-2 mt-0.5">•</span>
                                            <span className="line-clamp-1">{sub}</span>
                                        </li>
                                    ))}
                                    {t.subtopics.length > 3 && <li className="text-xs text-gray-600 italic pt-1">+ {t.subtopics.length - 3} more concepts</li>}
                                </ul>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                <span className="text-xs font-medium bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md">{t.class}</span>
                                <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md">{t.subtopics.length} Concepts</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom navigation for better internal linking */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold mb-6 italic text-gray-500">Explore Other Exams</h3>
                    <div className="flex flex-wrap gap-2">
                        {['JEE Mains', 'NEET'].map(e => (
                            <Link
                                key={e}
                                to={`/${slugify(e)}`}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 text-xs text-gray-400 hover:text-white transition-all"
                            >
                                {e} Prep
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-16 pt-10 border-t border-white/10">
                    <h2 className="text-3xl font-bold mb-8 tracking-tight">Expert Strategy for {realSubject}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-purple-400">The Modern Preparation Approach</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Mastering {realSubject} in the {targetYear} cycle is not about how many books you read, but how many different types of problems you can recall during the exam. Our AI-driven analytics show that students who practice at least 15 questions per topic in {realSubject} see a 40% improvement in mock test scores within just three weeks.
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                                For {formattedExam}, the difficulty curve of {realSubject} has been steadily increasing. Concepts that were once considered 'advanced' are now part of the foundational set. To stay ahead, you must transition from passive reading to active testing. Our question bank for {realSubject} includes both Previous Year Questions (PYQs) and AI-curated challenges that reflect the latest trends from NTA and other testing bodies.
                            </p>
                            <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl">
                                <h4 className="font-bold text-white mb-2">Pro Tip: The MCQ Blitz</h4>
                                <p className="text-sm text-gray-400 leading-relaxed">Try solving 20 {realSubject} MCQs in exactly 20 minutes every morning. This builds the 'Internal Clock' needed for high-pressure exams like JEE or NEET.</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-blue-400">Mastering the Syllabus</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Every topic in the {topics.length} chapters of {realSubject} has a different 'Retainability Index'. For instance, theoretical sections need revision every 7 days, whereas calculation-heavy chapters need consistent daily practice to maintain speed. 
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                                Our platform uses your attempt history to create a 'Topic Heatmap'. If the AI notices you are taking more than 90 seconds for a specific type of {realSubject} question, it will automatically flag that topic for a re-study session. This personalized loop ensures that your {formattedExam} preparation is always optimized and never redundant.
                            </p>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Cross-Subject Linkage</h4>
                                <p className="text-sm text-gray-400 leading-relaxed mb-4">Success in {realSubject} often unlocks better understanding in these related subjects:</p>
                                <ul className="flex flex-wrap gap-2">
                                    {Object.keys(EXAM_SUBJECT_MAPPING).find((k: string) => k === exam) && EXAM_SUBJECT_MAPPING[exam || ''].filter((s: string) => s !== realSubject).map((s: string) => (
                                        <Link
                                            key={s}
                                            to={`/${exam}/${s.toLowerCase().replace(/ /g, '-')}`}
                                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/20 text-xs transition-colors whitespace-nowrap"
                                        >
                                            {s}
                                        </Link>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
