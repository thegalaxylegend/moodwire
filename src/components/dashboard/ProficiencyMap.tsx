import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { SYLLABUS_DB } from '../../lib/constants';
import { getWeakTopics, getStrongTopics } from '../../services/topicStrengthService';
import type { TopicStat } from '../../services/topicStrengthService';

export const ProficiencyMap = () => {
    const { user, authResolved } = useUserStore();
    const [stats, setStats] = useState<Record<string, 'high' | 'medium' | 'low' | 'none'>>({});
    const [loading, setLoading] = useState(true);

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

        // Match user class/school exams
        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
        if (isJunior || type.includes('class') || type.includes('school')) {
            return ['Mathematics', 'Science', 'Social Science', 'English'];
        }

        const allSubjects = Object.keys(SYLLABUS_DB);
        return allSubjects.slice(0, 3);
    };

    const subjects = getSubjectsForExam(user?.targetExam);

    return (
        <div className="glass-card oxygen-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-text-main to-text-muted bg-clip-text text-transparent">Compass IQ</h3>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-tighter">Syllabus Mastery Map</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        <span className="text-[10px] text-text-muted font-bold">Safe</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                        <span className="text-[10px] text-text-muted font-bold">Mid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        <span className="text-[10px] text-text-muted font-bold">Risk</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {subjects.map(sub => {
                    const topics = SYLLABUS_DB[sub] || [];
                    const mastered = topics.filter(t => stats[t.topic] === 'high').length;

                    return (
                        <div key={sub} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{sub}</h4>
                                <span className="text-[10px] text-text-muted/60 font-mono">{mastered}/{topics.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {topics.map((topic, idx) => {
                                    const level = stats[topic.topic] || 'none';
                                    let color = 'bg-white/5 border-white/5';
                                    if (level === 'high') color = 'bg-green-500 shadow-sm shadow-green-500/20 border-green-400';
                                    if (level === 'medium') color = 'bg-yellow-500 shadow-sm shadow-yellow-500/20 border-yellow-400';
                                    if (level === 'low') color = 'bg-red-500 shadow-sm shadow-red-500/20 border-red-400';

                                    return (
                                        <div
                                            key={`${sub}-${idx}-${topic.topic}`}
                                            title={`${topic.topic}: ${level.toUpperCase()}`}
                                            className={`w-3 h-3 rounded-[2px] border ${color} transition-all hover:scale-150 cursor-help hover:z-10`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!loading && Object.keys(stats).length === 0 && (
                <p className="text-[10px] text-center text-text-muted italic">Take mock tests to see your heat map grow!</p>
            )}
        </div>
    );
};
