
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useUserStore } from '../../store/userStore';

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
        }
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

                    <div className="glass-card p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ArrowRight size={200} />
                        </div>
                        <h3 className="font-bold text-2xl mb-6">Sample Question</h3>

                        <div className="space-y-4">
                            <p className="text-lg font-serif">
                                Q. A particle moves in a circle of radius R with a constant speed v. The work done by the centripetal force in one complete revolution is:
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-3 bg-black/40 rounded border border-white/10 cursor-not-allowed">A. 2πRmv²</div>
                                <div className="p-3 bg-black/40 rounded border border-white/10 cursor-not-allowed">B. mv²/R</div>
                                <div className="p-3 bg-green-500/20 border border-green-500 rounded font-bold">C. Zero</div>
                                <div className="p-3 bg-black/40 rounded border border-white/10 cursor-not-allowed">D. mv²R</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 text-sm text-gray-400">
                            <span className="font-bold text-green-400">Correct Answer: C</span>
                            <p className="mt-1">Work done = Force × Displacement. Since centripetal force is always perpendicular to displacement, Work = 0.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
