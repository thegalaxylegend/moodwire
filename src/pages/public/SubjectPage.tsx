
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useUserStore } from '../../store/userStore';

export const SubjectPage = () => {
    const { exam, subject } = useParams();
    const { user } = useUserStore();

    // Reverse Slugify (Primitive)
    const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subject) || subject;
    const topics = SYLLABUS_DB[realSubject as string] || [];

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase();

    // Schema Data
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": `${realSubject} Syllabus for ${formattedExam}`,
        "description": `Complete ${realSubject} syllabus breakdown and important topics for ${formattedExam}.`,
        "provider": {
            "@type": "Organization",
            "name": "Exam Compass",
            "sameAs": "https://examcompass.web.app"
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${realSubject} for ${formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || 'CBSE School Exams') : formattedExam} | Complete Syllabus & PYQs`}
                description={`Master ${realSubject} for ${formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || 'CBSE School Exams') : formattedExam}. Chapter-wise weightage, important topics, and practice questions.`}
                canonical={`https://examcompass.web.app/${exam}/${subject}`}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
                <div className="text-sm text-gray-400 mb-4 uppercase tracking-widest">
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link> / {realSubject}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                    {realSubject}
                </h1>
                <p className="text-lg text-gray-400 max-w-3xl">
                    Detailed syllabus breakdown and practice questions for {realSubject} in {formattedExam}.
                </p>
            </section>

            <section className="py-10 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((t, i) => (
                        <Link
                            key={i}
                            to={`/${exam}/${subject}/${slugify(t.topic)}`}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                        >
                            <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">{t.topic}</h3>
                            <div className="flex gap-2 mb-4">
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">{t.class}</span>
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{t.subtopics.length} Concepts</span>
                            </div>
                            <ul className="text-sm text-gray-500 space-y-1">
                                {t.subtopics.slice(0, 3).map((sub, j) => (
                                    <li key={j}>• {sub}</li>
                                ))}
                                {t.subtopics.length > 3 && <li>+ {t.subtopics.length - 3} more</li>}
                            </ul>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};
