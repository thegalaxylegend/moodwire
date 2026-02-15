
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

    // SEO Data Hydration
    const sampleQuestions = (typeof globalThis !== 'undefined' && globalThis.SEO_TOPIC_DATA)
        ? globalThis.SEO_TOPIC_DATA
        : [];

    // Schema Data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": `${cleanTopicName} for ${contextName}`,
        "description": `Master ${cleanTopicName} with PYQs and AI-assisted learning.`,
        "provider": {
            "@type": "Organization",
            "name": "Exam Compass",
            "sameAs": "https://examcompass.web.app"
        },
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "courseWorkload": "PT2H"
        },
        "itemListElement": sampleQuestions.map((q, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `https://examcompass.web.app/${exam}/q/${q.slug}`
        }))
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${cleanTopicName} Questions for ${contextName} | Important PYQs`}
                description={`Practice ${cleanTopicName} questions for ${contextName}. Important formulas, common mistakes, and 50+ past year questions.`}
                canonical={`https://examcompass.web.app/${exam}/${subject}/${topic}`}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
                <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link> /
                    <Link to={`/${exam}/${subject}`} className="hover:text-white transition-colors mx-1">{realSubject}</Link> /
                    <span className="text-purple-400 mx-1">{cleanTopicName}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            {cleanTopicName}
                        </h1>
                        <p className="text-lg text-gray-400 mb-6">
                            Master this high-weightage topic for {formattedExam}. This chapter typically accounts for 2-3 questions in the final exam.
                        </p>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-xl mb-4 text-purple-300">Key Concepts</h3>
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

                {/* Internal Linking for SEO - Sample Questions */}
                {sampleQuestions.length > 0 && (
                    <div className="mt-20 border-t border-white/10 pt-10">
                        <h2 className="text-2xl font-bold mb-6">Practice {cleanTopicName} Questions</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {sampleQuestions.map((q: { id: string; slug: string; text: string; sourceYear?: string }) => (
                                <Link
                                    key={q.id}
                                    to={`/${exam}/q/${q.slug}`}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                                >
                                    <h4 className="font-semibold text-gray-200 group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                                        {q.text}
                                    </h4>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span className="bg-black/30 px-2 py-1 rounded">View Solution</span>
                                        {q.sourceYear && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">{q.sourceYear}</span>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
