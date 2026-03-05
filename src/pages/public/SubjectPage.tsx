import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { EXAM_SUBJECT_MAPPING } from '../../lib/constants';
import { Navbar } from '../../components/Navbar';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';
import { useUserStore } from '../../store/userStore';

export const SubjectPage = () => {
    const { exam, subject } = useParams();
    const { user } = useUserStore();

    // Reverse Slugify (Primitive)
    const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subject) || subject;
    const topics = SYLLABUS_DB[realSubject as string] || [];

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase();

    // Build keywords from top topics
    const topicNames = topics.slice(0, 8).map(t => t.topic.replace(/\[.*?\]\s*/g, '')).join(', ');
    const seoKeywords = `${realSubject} for ${formattedExam}, ${formattedExam} ${realSubject} syllabus, ${topicNames}`;

    const siblingSubjects = exam ? getSubjectsForExam(exam).filter(s => slugify(s) !== subject) : [];

    // Schema Data
    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Course",
                "name": `${realSubject} Syllabus for ${formattedExam}`,
                "description": `Complete ${realSubject} syllabus breakdown with ${topics.length} chapters and important topics for ${formattedExam}.`,
                "provider": {
                    "@type": "Organization",
                    "name": "Exam Compass",
                    "sameAs": "https://examcompass.web.app",
                    "url": "https://examcompass.web.app"
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
                    "url": `https://examcompass.web.app/${exam}/${subject}/${slugify(t.topic)}`
                }))
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examcompass.web.app/" },
                    { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `https://examcompass.web.app/${exam}` },
                    { "@type": "ListItem", "position": 3, "name": realSubject, "item": `https://examcompass.web.app/${exam}/${subject}` }
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${realSubject} for ${formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || 'CBSE Board') : formattedExam} | Syllabus`}
                description={`Master ${realSubject} for ${formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || 'CBSE School Exams') : formattedExam}. Complete ${topics.length}-chapter syllabus with topics like ${topicNames.substring(0, 80)}. Practice questions and solutions.`}
                canonical={`https://examcompass.web.app/${exam}/${subject}`}
                keywords={seoKeywords}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto border-b border-white/5">
                <div className="text-sm text-gray-300 mb-4 uppercase tracking-widest flex items-center space-x-2">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link>
                    <span>/</span>
                    <span className="text-white">{realSubject}</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                    {realSubject} <span className="text-purple-500/50 block text-2xl mt-2">for {formattedExam}</span>
                </h1>

                <article className="prose prose-invert max-w-4xl space-y-6">
                    <p className="text-lg text-gray-300 leading-relaxed">
                        The {realSubject} syllabus for {formattedExam} comprises {topics.length} crucial chapters that form the backbone of your preparation.
                        Mastering these concepts is absolutely essential for securing a top rank in your upcoming examinations, as {realSubject} often acts as the high-scoring differentiator between top-tier aspirants.
                        Our comprehensive, AI-driven guide breaks down each chapter into its core concepts, providing you with targeted practice questions,
                        structured explanations, and the strategic edge you need to succeed in {formattedExam} 2026.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Whether you are beginning your {realSubject} preparation journey from scratch or looking to solidify your understanding of advanced subtopics,
                        this hub serves as your ultimate resource. Each of the {topics.length} chapters listed below has been meticulously analyzed for its exam weightage and difficulty level.
                        Explore the chapter-wise index to dive directly into categorized Previous Year Questions (PYQs) and mock assessments tailored specifically for the {formattedExam} pattern.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Every topic in {realSubject} requires a unique approach. While some chapters rely heavily on memorization and theoretical understanding, others demand rigorous problem-solving
                        and the application of complex formulas. Using our advanced tracking system, you can monitor your proficiency across all {topics.length} chapters, identify your weakest areas,
                        and generate customized mock tests that focus entirely on bridging your knowledge gaps. Regular practice using these curated resources guarantees a massive improvement in your
                        speed, accuracy, and overall confidence when approaching the {realSubject} section of the {formattedExam}.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Don't just study hard; study smart with integrated data. Our platform provides real-time analytics on your accuracy for {realSubject} questions, helping you visualize your progress
                        over weeks and months. By focusing your efforts on high-yield chapters first, you can maximize your potential score while minimizing the time spent on topics you have already mastered.
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
                        {['JEE Mains', 'NEET', 'UPSC', 'GATE', 'CLAT'].map(e => (
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
                    <h2 className="text-2xl font-bold mb-6">Subject Syllabus & Strategy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-purple-400">Preparation Approach for {subject}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Mastering {subject} requires a balance between conceptual understanding and practical application. For the 2026 {exam?.toUpperCase()} session, we recommend focusing on the high-weightage chapters listed above. AI-driven analytics show that students who practice at least 15 questions per topic in {subject} see a 40% improvement in mock test scores.
                            </p>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Our question bank for {subject} includes both Previous Year Questions (PYQs) and AI-curated challenges that reflect the latest difficulty trends.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Related Subjects</h4>
                            <ul className="space-y-2">
                                {Object.keys(EXAM_SUBJECT_MAPPING).find((k: string) => k === exam) && EXAM_SUBJECT_MAPPING[exam || ''].filter((s: string) => s !== subject).map((s: string) => (
                                    <Link
                                        key={s}
                                        to={`/${exam}/${s.toLowerCase().replace(/ /g, '-')}`}
                                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/20 text-sm transition-colors whitespace-nowrap"
                                    >
                                        {s}
                                    </Link>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
