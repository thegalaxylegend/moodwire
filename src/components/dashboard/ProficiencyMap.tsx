import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { SYLLABUS_DB } from '../../lib/constants';
import type { SyllabusTopic } from '../../lib/constants';
import { getWeakTopics, getStrongTopics } from '../../services/topicStrengthService';
import type { TopicStat } from '../../services/topicStrengthService';
import { Atom, FlaskConical, Calculator, Globe, BookOpen, HelpCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProficiencyMap = () => {
    const { user, authResolved } = useUserStore();
    const [stats, setStats] = useState<Record<string, 'high' | 'medium' | 'low' | 'none'>>({});
    const [loading, setLoading] = useState(true);
    
    // Custom Tooltip State
    const [activeTooltip, setActiveTooltip] = useState<{
        topic: SyllabusTopic;
        subject: string;
        level: 'high' | 'medium' | 'low' | 'none';
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        if (user && authResolved) loadProficiency();
    }, [user, user?.syllabusProgress, authResolved]);

    const loadProficiency = async () => {
        setLoading(true);
        try {
            const [weak, strong] = await Promise.all([
                getWeakTopics(user?.id || '', 100, user?.userClass, user?.targetExam) as Promise<TopicStat[]>,
                getStrongTopics(user?.id || '', 100, user?.userClass, user?.targetExam) as Promise<TopicStat[]>
            ]);

            const newStats: Record<string, 'high' | 'medium' | 'low' | 'none'> = {};

            strong.forEach(s => {
                if (s.score_percentage >= 80) newStats[s.topic] = 'high';
                else if (s.score_percentage >= 60) newStats[s.topic] = 'medium';
                else newStats[s.topic] = 'low';
            });

            weak.forEach(w => {
                if (w.score_percentage < 40) newStats[w.topic] = 'low';
                else if (w.score_percentage < 60) newStats[w.topic] = 'medium';
            });

            setStats(newStats);
        } catch (e) {
            console.error("Failed to load proficiency map", e);
        } finally {
            setLoading(false);
        }
    };

    const getSubjectsForExam = (exam?: string) => {
        const type = exam?.toLowerCase() || '';
        if (type.includes('neet') || type.includes('medical')) {
            return ['Physics', 'Chemistry', 'Biology'];
        }
        if (type.includes('jee') || type.includes('engineering') || type.includes('mains') || type.includes('advanced')) {
            return ['Physics', 'Chemistry', 'Mathematics'];
        }

        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
        if (isJunior || type.includes('class') || type.includes('school')) {
            return ['Mathematics', 'Science', 'Social Science', 'English'];
        }

        const allSubjects = Object.keys(SYLLABUS_DB);
        return allSubjects.slice(0, 3);
    };

    const subjects = getSubjectsForExam(user?.targetExam);

    const getSubjectIcon = (sub: string) => {
        const name = sub.toLowerCase();
        if (name.includes('physics')) return <Atom size={13} className="text-violet-400" />;
        if (name.includes('chemistry')) return <FlaskConical size={13} className="text-emerald-400" />;
        if (name.includes('math')) return <Calculator size={13} className="text-sky-400" />;
        if (name.includes('biology')) return <Atom size={13} className="text-rose-400" />;
        if (name.includes('science')) return <Atom size={13} className="text-teal-400" />;
        if (name.includes('social')) return <Globe size={13} className="text-amber-400" />;
        if (name.includes('english')) return <BookOpen size={13} className="text-pink-400" />;
        return <HelpCircle size={13} className="text-slate-400" />;
    };

    const handleNodeMouseEnter = (e: React.MouseEvent, topic: SyllabusTopic, subject: string, level: 'high' | 'medium' | 'low' | 'none') => {
        const nodeRect = e.currentTarget.getBoundingClientRect();
        const container = document.getElementById('proficiency-map-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            setActiveTooltip({
                topic,
                subject,
                level,
                x: nodeRect.left - containerRect.left + nodeRect.width / 2,
                y: nodeRect.top - containerRect.top - 6
            });
        }
    };

    return (
        <div 
            id="proficiency-map-container"
            className="glass-card oxygen-card p-6 space-y-5 relative overflow-visible"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                    <h3 className="text-lg font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">
                        Compass IQ
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Syllabus Mastery Map
                    </p>
                </div>
                
                {/* Legend badges */}
                <div className="flex gap-2.5">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                        <div className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                        <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase">Safe</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/5 border border-amber-500/10">
                        <div className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                        <span className="text-[9px] text-amber-400 font-extrabold tracking-wider uppercase">Mid</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/5 border border-rose-500/10">
                        <div className="size-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
                        <span className="text-[9px] text-rose-400 font-extrabold tracking-wider uppercase">Risk</span>
                    </div>
                </div>
            </div>

            {/* Subjects Lists */}
            <div className="space-y-4 relative">
                {subjects.map(sub => {
                    const topics = SYLLABUS_DB[sub] || [];
                    const mastered = topics.filter(t => stats[t.topic] === 'high').length;
                    const totalTopics = topics.length;
                    const completionRate = totalTopics > 0 ? Math.round((mastered / totalTopics) * 100) : 0;

                    return (
                        <div key={sub} className="space-y-2 group/sub relative">
                            {/* Subject Title & Stats */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-white/5 border border-white/5 group-hover/sub:border-white/10 transition-colors">
                                        {getSubjectIcon(sub)}
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/sub:text-slate-200 transition-colors">
                                        {sub}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 font-semibold">
                                    <span>{mastered} / {totalTopics}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-violet-400/80 font-bold">{completionRate}% Safe</span>
                                </div>
                            </div>

                            {/* Node Matrix Grid */}
                            <div className="flex flex-wrap gap-1.5 bg-slate-950/20 border border-white/[0.02] p-2.5 rounded-xl">
                                {topics.map((topic, idx) => {
                                    const level = stats[topic.topic] || 'none';
                                    
                                    // Custom colors based on mastery level
                                    let colorClasses = 'bg-white/[0.04] border-white/[0.05] hover:bg-white/[0.12] hover:border-white/[0.15]';
                                    if (level === 'high') {
                                        colorClasses = 'bg-emerald-500/80 border-emerald-400/30 shadow-[0_0_4px_rgba(16,185,129,0.2)] hover:bg-emerald-400 hover:border-emerald-300 hover:shadow-[0_0_10px_rgba(52,211,153,0.5)]';
                                    } else if (level === 'medium') {
                                        colorClasses = 'bg-amber-500/80 border-amber-400/30 shadow-[0_0_4px_rgba(245,158,11,0.2)] hover:bg-amber-400 hover:border-amber-300 hover:shadow-[0_0_10px_rgba(251,191,36,0.5)]';
                                    } else if (level === 'low') {
                                        colorClasses = 'bg-rose-500/80 border-rose-400/30 shadow-[0_0_4px_rgba(244,63,94,0.2)] hover:bg-rose-400 hover:border-rose-300 hover:shadow-[0_0_10px_rgba(248,113,113,0.5)]';
                                    }

                                    return (
                                        <motion.div
                                            key={`${sub}-${idx}-${topic.topic}`}
                                            whileHover={{ scale: 1.35 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                            className={`w-3.5 h-3.5 rounded-full border transition-colors cursor-crosshair relative z-10 ${colorClasses}`}
                                            onMouseEnter={(e) => handleNodeMouseEnter(e, topic, sub, level)}
                                            onMouseLeave={() => setActiveTooltip(null)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty state notice */}
            {!loading && Object.keys(stats).length === 0 && (
                <p className="text-[10px] text-center text-slate-500 italic pb-1">
                    🚀 Take mock tests or practice goals to populate your mastery heatmap!
                </p>
            )}

            {/* Custom Portal-like Floating Glass Tooltip */}
            <AnimatePresence>
                {activeTooltip && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 pointer-events-none w-64 backdrop-blur-md bg-slate-950/90 border border-white/10 p-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.05)] text-left"
                        style={{
                            left: `${activeTooltip.x}px`,
                            top: `${activeTooltip.y}px`,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        {/* Title & Subject */}
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-400">
                                {activeTooltip.subject}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide ${
                                activeTooltip.level === 'high' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                activeTooltip.level === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                activeTooltip.level === 'low' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-white/5 text-slate-400 border border-white/5'
                            }`}>
                                {activeTooltip.level === 'high' ? 'Safe (80%+)' :
                                 activeTooltip.level === 'medium' ? 'Mid (60%+)' :
                                 activeTooltip.level === 'low' ? 'Risk (<40%)' :
                                 'Uncharted'}
                            </span>
                        </div>
                        
                        <p className="text-xs font-bold text-slate-100 leading-snug mb-1">
                            {activeTooltip.topic.topic}
                        </p>
                        
                        <div className="flex gap-2 text-[9px] text-slate-400 font-medium mb-2 pb-2 border-b border-white/5">
                            <span>{activeTooltip.topic.class}</span>
                            <span className="text-slate-600">•</span>
                            <span>Weight: <strong className={
                                activeTooltip.topic.weightage === 'High' ? 'text-rose-400' :
                                activeTooltip.topic.weightage === 'Medium' ? 'text-amber-400' :
                                'text-emerald-400'
                            }>{activeTooltip.topic.weightage}</strong></span>
                            <span className="text-slate-600">•</span>
                            <span>{activeTooltip.topic.examPattern}</span>
                        </div>

                        {/* Subtopics preview */}
                        {activeTooltip.topic.subtopics && activeTooltip.topic.subtopics.length > 0 && (
                            <div>
                                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                                    Key Syllabus Concepts:
                                </span>
                                <div className="space-y-0.5">
                                    {activeTooltip.topic.subtopics.slice(0, 3).map((sub, sIdx) => (
                                        <div key={sIdx} className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                                            <ChevronRight size={8} className="text-slate-600 flex-shrink-0" />
                                            <span className="truncate">{sub}</span>
                                        </div>
                                    ))}
                                    {activeTooltip.topic.subtopics.length > 3 && (
                                        <span className="text-[8px] text-slate-500 pl-2">
                                            +{activeTooltip.topic.subtopics.length - 3} more concepts
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Tooltip arrow/triangle */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 size-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-950/90 z-20" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 size-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white/10 z-10" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

