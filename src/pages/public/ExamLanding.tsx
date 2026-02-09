
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { ArrowRight } from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify, getSubjectsForExam } from '../../lib/utils';


export const ExamLanding = () => {
    const { exam } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';

    // Simple mapping logic (In real app, map slug 'jee-mains' -> 'JEE' key in DB)
    // For MVP, we just list all subjects.

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={`${formattedExam} Preparation 2026 | Mock Tests & PYQs`}
                description={`Crack ${formattedExam} with AI-generated mock tests, 5000+ PYQs, and deep analytics. Start practicing for free.`}
                canonical={`https://examcompass.web.app/${exam}`}
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
        </div>
    );
};
