import { Calendar, TrendingUp, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const exams = [
    {
        id: 'jee-mains',
        name: 'JEE Mains',
        desc: 'Engineering Entrance Exam',
        nextDate: 'Jan 24, 2026',
        progress: 75,
        color: 'bg-primary',
        category: 'Engineering',
        difficulty: 'Hard'
    },
    {
        id: 'neet',
        name: 'NEET UG',
        desc: 'Medical Entrance Test',
        nextDate: 'May 05, 2026',
        progress: 45,
        color: 'bg-secondary',
        category: 'Medical',
        difficulty: 'Hard'
    },
    {
        id: 'clat',
        name: 'CLAT',
        desc: 'Common Law Admission Test',
        nextDate: 'Dec 07, 2026',
        progress: 90,
        color: 'bg-accent',
        category: 'Law',
        difficulty: 'Medium'
    },
    {
        id: 'upsc',
        name: 'UPSC CSE',
        desc: 'Civil Services Examination',
        nextDate: 'May 26, 2026',
        progress: 30,
        color: 'bg-orange-500',
        category: 'Civil Services',
        difficulty: 'Nightmare'
    },
    {
        id: 'cat',
        name: 'CAT',
        desc: 'Common Admission Test',
        nextDate: 'Nov 29, 2026',
        progress: 60,
        color: 'bg-emerald-500',
        category: 'Management',
        difficulty: 'Hard'
    },
    {
        id: 'gate',
        name: 'GATE',
        desc: 'Graduate Aptitude Test',
        nextDate: 'Feb 03, 2026',
        progress: 10,
        color: 'bg-rose-500',
        category: 'Engineering',
        difficulty: 'Very Hard'
    },
    {
        id: 'class-12',
        name: 'Class 12 Boards',
        desc: 'CBSE/State Board Excellence',
        nextDate: 'Feb 15, 2026',
        progress: 100,
        color: 'bg-indigo-500',
        category: 'School',
        difficulty: 'Medium'
    },
    {
        id: 'class-11',
        name: 'Class 11 Exams',
        desc: 'Annual School Examination',
        nextDate: 'Mar 01, 2026',
        progress: 100,
        color: 'bg-cyan-500',
        category: 'School',
        difficulty: 'Medium'
    },
    {
        id: 'school-exams',
        name: 'Junior School (6-10)',
        desc: 'CBSE Academic Foundation',
        nextDate: 'Mar 15, 2026',
        progress: 100,
        color: 'bg-purple-500',
        category: 'School',
        difficulty: 'School Level'
    }
];

export const ExamGrid = () => {
    const [filter, setFilter] = useState('All');

    const filteredExams = filter === 'All'
        ? exams
        : exams.filter(exam => exam.category === filter);

    const categories = ['All', 'School', 'Engineering', 'Medical', 'Law', 'Civil Services', 'Management'];

    return (
        <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-text-main">Popular Exams</h2>
                    <p className="text-text-muted mt-2">Explore top entrance exams across India.</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <Filter size={20} className="text-text-muted min-w-[20px]" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === cat
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-surface border border-border text-text-muted hover:text-text-main hover:bg-white/5'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {filteredExams.map((exam) => (
                    <Link
                        key={exam.id}
                        to={`/${exam.id}`}
                        className="glass-card p-6 hover:translate-y-[-4px] cursor-pointer group block"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">{exam.name}</h3>
                                <p className="text-sm text-text-muted">{exam.desc}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-surface border border-border">
                                <TrendingUp size={18} className="text-accent" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-text-muted">
                                    <span>Syllabus Completion</span>
                                    <span>{exam.progress}%</span>
                                </div>
                                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${exam.color} opacity-80`}
                                        style={{ width: `${exam.progress}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Calendar size={14} />
                                    <span>Next: {exam.nextDate}</span>
                                </div>
                                <span className="text-xs px-2 py-1 rounded bg-surface border border-border text-text-muted">
                                    {exam.difficulty}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
