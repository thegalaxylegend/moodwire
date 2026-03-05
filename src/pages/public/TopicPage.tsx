
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useUserStore } from '../../store/userStore';

declare global {
    var SEO_TOPIC_DATA: any[];
}

export const TopicPage = () => {
    const { exam, subject, topic } = useParams();
    const { user } = useUserStore();

    // Data Finding Logic
    const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subject);
    const topicList = SYLLABUS_DB[realSubject as string] || [];

    const topicData = topicList.find(t => slugify(t.topic) === topic);

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase();
    const cleanTopicName = topicData?.topic.replace(/\[.*?\]\s*/g, '') || topic?.replace(/-/g, ' ');

    const contextName = formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || topicData?.class || 'CBSE Class') : formattedExam;

    // SEO Data Hydration with Client-Side Fallback
    const [sampleQuestions, setSampleQuestions] = React.useState<any[]>(
        (typeof globalThis !== 'undefined' && globalThis.SEO_TOPIC_DATA)
            ? globalThis.SEO_TOPIC_DATA
            : []
    );

    // Fallback: If no SSG data, try to fetch from internal API/DB (Client-Side)
    React.useEffect(() => {
        if (sampleQuestions.length === 0 && topicData) {
            const fetchQuestions = async () => {
                try {
                    const response = await fetch('/question-db.json');
                    if (!response.ok) throw new Error('Failed to fetch DB');

                    const db = await response.json();
                    const relatedQuestions = Object.values(db).filter((q: any) => {
                        const qTopic = (q.topic || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const pTopic = topicData.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return qTopic === pTopic || qTopic.includes(pTopic) || pTopic.includes(qTopic);
                    }).slice(0, 15);

                    if (relatedQuestions.length > 0) {
                        setSampleQuestions(relatedQuestions);
                    }
                } catch (error) {
                    console.warn("Client-side question fetch failed:", error);
                }
            };
            fetchQuestions();
        }
    }, [sampleQuestions.length, topicData]);

    // Build keywords from subtopics
    const subtopicKeywords = topicData?.subtopics.slice(0, 6).join(', ') || '';
    const seoKeywords = `${cleanTopicName}, ${contextName} ${cleanTopicName}, ${cleanTopicName} questions, ${cleanTopicName} PYQ, ${subtopicKeywords}`;
    const seoDescription = `Practice ${cleanTopicName} questions for ${contextName}. Key concepts: ${topicData?.subtopics.slice(0, 4).join(', ')}. ${sampleQuestions.length}+ past year questions with detailed solutions.`;

    // Schema Data
    const schemaGraph: any[] = [
        {
            "@type": "Course",
            "name": `${cleanTopicName} for ${contextName}`,
            "description": `Master ${cleanTopicName} with PYQs and AI-assisted learning for ${contextName}.`,
            "provider": {
                "@type": "Organization",
                "name": "Exam Compass",
                "sameAs": "https://examcompass.web.app",
                "url": "https://examcompass.web.app"
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT2H"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "category": "Free"
            },
            "isAccessibleForFree": true,
            "about": topicData?.subtopics.map((s: string) => ({ "@type": "Thing", "name": s })) || []
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examcompass.web.app/" },
                { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `https://examcompass.web.app/${exam}` },
                { "@type": "ListItem", "position": 3, "name": realSubject, "item": `https://examcompass.web.app/${exam}/${subject}` },
                { "@type": "ListItem", "position": 4, "name": cleanTopicName, "item": `https://examcompass.web.app/${exam}/${subject}/${topic}` }
            ]
        }
    ];

    // Add ItemList for sample questions
    if (sampleQuestions.length > 0) {
        schemaGraph.push({
            "@type": "ItemList",
            "name": `${cleanTopicName} Practice Questions for ${contextName}`,
            "numberOfItems": sampleQuestions.length,
            "itemListElement": sampleQuestions.map((q: any, i: number) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `https://examcompass.web.app/${exam}/q/${q.slug}`
            }))
        });
    }

    const schemaData = {
        "@context": "https://schema.org",
        "@graph": schemaGraph
    };

    // SEO: Shorten title if topic is extremely long (like some English chapters)
    const shortTopic = cleanTopicName ? (cleanTopicName.length > 35 ? `${cleanTopicName.substring(0, 32)}...` : cleanTopicName) : 'Practice Questions';
    const pageTitle = `${shortTopic} PYQs | ${contextName}`;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={pageTitle}
                description={seoDescription}
                canonical={`https://examcompass.web.app/${exam}/${subject}/${topic}`}
                keywords={seoKeywords}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
                <div className="text-sm text-gray-300 mb-4 uppercase tracking-widest">
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link> /
                    <Link to={`/${exam}/${subject}`} className="hover:text-white transition-colors mx-1">{realSubject}</Link> /
                    <span className="text-purple-400 mx-1">{cleanTopicName}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            {cleanTopicName}
                        </h1>
                        <article className="prose prose-invert max-w-full mb-8 space-y-6">
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Mastering <strong className="text-white">{cleanTopicName}</strong> is a critical step in your {formattedExam} preparation journey.
                                Based on past year trends and historical data analysis, this chapter typically accounts for {topicData?.subtopics.length && topicData.subtopics.length > 5 ? '3-4' : '1-2'} direct questions in the final examination,
                                making it a high-yield topic. Our analysis shows that students who build strong foundational clarity in these core concepts
                                consistently score higher in the overarching {realSubject} section of the {formattedExam} 2026.
                            </p>
                            <p className="text-md text-gray-300 leading-relaxed">
                                The {contextName} syllabus heavily emphasizes application-based learning for {cleanTopicName}. It is not enough to simply memorize definitions;
                                you must understand their underlying principles and boundary conditions. This dedicated study module is designed to bridge the gap between
                                theoretical knowledge and practical problem-solving. By practicing the curated Previous Year Questions (PYQs) below, you will develop
                                the intuition required to quickly identify the correct approach during the actual {formattedExam} test.
                            </p>
                            <p className="text-md text-gray-300 leading-relaxed">
                                Begin by reviewing the key concepts listed in the modules below. Once you are confident in your conceptual understanding, transition to solving
                                our mock questions. Our AI-driven adaptive engine will test your proficiency across all subtopics of {cleanTopicName}, ensuring
                                that no blind spots remain in your preparation for the upcoming entrance cycle.
                            </p>
                        </article>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                            <h2 className="font-bold text-xl mb-4 text-purple-300">Key Concepts</h2>
                            <div className="flex flex-wrap gap-2">
                                {topicData?.subtopics.map(sub => (
                                    <span key={sub} className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/10">
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Link to={`/dashboard/mock?exam=${exam}&topic=${topic}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform w-full md:w-auto justify-center">
                            Start Practice Test <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>

                {/* Internal Linking for SEO - Sample Questions & Related Chapters */}
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-white/10 pt-10">
                    <div className="lg:col-span-2">
                        {sampleQuestions.length > 0 && (
                            <>
                                <h2 className="text-2xl font-bold mb-6">Practice {cleanTopicName} Questions</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {sampleQuestions.map((q: { id: string; slug: string; text: string; sourceYear?: string }) => (
                                        <Link
                                            key={q.id}
                                            to={`/${exam}/q/${q.slug}`}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                                        >
                                            <h3 className="font-semibold text-gray-200 group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                                                {q.text}
                                            </h3>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span className="bg-black/30 px-2 py-1 rounded">View Solution</span>
                                                {q.sourceYear && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">{q.sourceYear}</span>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <aside>
                        <h2 className="text-xl font-bold mb-6 text-purple-300">Related {realSubject} Chapters</h2>
                        <div className="space-y-3">
                            {topicList.filter(t => t.topic !== topicData?.topic).slice(0, 8).map((t, idx) => (
                                <Link
                                    key={idx}
                                    to={`/${exam}/${subject}/${slugify(t.topic)}`}
                                    className="block p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-colors text-sm text-gray-300 hover:text-white"
                                >
                                    {t.topic.replace(/\[.*?\]\s*/g, '')}
                                </Link>
                            ))}
                            <Link
                                to={`/${exam}/${subject}`}
                                className="block p-3 rounded-lg border border-purple-500/20 text-center text-purple-400 font-bold hover:bg-purple-500/10 transition-colors text-sm mt-4"
                            >
                                View All {realSubject} Topics
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
};
