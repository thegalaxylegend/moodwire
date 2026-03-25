import { Calendar, TrendingUp, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
        name: 'Junior School (8-10)',
        desc: 'CBSE Academic Foundation',
        nextDate: 'Mar 15, 2026',
        progress: 100,
        color: 'bg-purple-500',
        category: 'School',
        difficulty: 'School Level'
    }
];

const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};

export const ExamGrid = () => {
    const [filter, setFilter] = useState('All');

    const filteredExams = filter === 'All'
        ? exams
        : exams.filter(exam => exam.category === filter);

    const categories = ['All', 'School', 'Engineering', 'Medical'];

    return (
        <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-heading font-bold text-text-main">Popular Exams</h2>
                    <p className="text-text-muted mt-2">Explore top entrance exams across India.</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar"
                >
                    <Filter size={20} className="text-text-muted min-w-[20px]" />
                    {categories.map(cat => (
                        <motion.button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${filter === cat
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 animate-glow-pulse'
                                : 'bg-surface border border-border text-text-muted hover:text-text-main hover:bg-white/5'
                                }`}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                    <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                            <TiltCard>
                                <Link
                                    to={`/${exam.id}`}
                                    className="glass-card h-full p-6 cursor-pointer group block hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-text-main group-hover:text-primary transition-colors">{exam.name}</h3>
                                            <p className="text-sm text-text-muted">{exam.desc}</p>
                                        </div>
                                        <motion.div 
                                            whileHover={{ rotate: 360 }}
                                            transition={{ duration: 0.6 }}
                                            className="p-2 rounded-lg bg-surface border border-border group-hover:bg-primary/10 transition-colors"
                                        >
                                            <TrendingUp size={18} className="text-accent" />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-text-muted">
                                                <span>Syllabus Completion</span>
                                                <span>{exam.progress}%</span>
                                            </div>
                                            <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${exam.progress}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                                    className={`h-full rounded-full ${exam.color} opacity-80`}
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
                        </TiltCard>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
