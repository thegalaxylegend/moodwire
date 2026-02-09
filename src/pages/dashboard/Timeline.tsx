import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { askAI } from '../../lib/ai';
import { extractJSON } from '../../lib/utils';
// import { supabase } from '../../lib/supabase'; // REMOVED

type TimelineEvent = {
    date: string;
    title: string;
    status: 'upcoming' | 'future' | 'highlight';
};

export const Timeline = () => {
    const { user } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<TimelineEvent[]>([]);

    useEffect(() => {
        if (user?.targetExam) fetchTimeline();
    }, [user?.targetExam, user?.targetYear]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, getDocs, limit } = await import('firebase/firestore');

            const q = query(collection(db, 'user_timelines'), where('user_id', '==', user?.id), limit(1));
            const snap = await getDocs(q);

            if (!snap.empty) {
                setEvents(snap.docs[0].data().events);
            } else {
                generateTimeline();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const generateTimeline = async () => {
        if (!user?.targetExam) return;

        setLoading(true);
        const exam = user.targetExam;
        const year = user.targetYear || new Date().getFullYear();

        const prompt = `
            Generate a realistic, consistent timeline for ${exam} for the academic year ${year}.
            Use ACTUAL known patterns or announced dates for India.
            Events to include: 
            1. Registration Starts
            2. Admit Card Release
            3. Exam Date (Phase 1)
            4. Result Declaration
            
            Strict JSON array format:
            [
                { "date": "Month Day, Year", "title": "Event Name", "status": "upcoming" | "future" | "highlight" }
            ]
            
            Key Rule: Dates must be specific (e.g., "January 24, ${year}"), not "January Week 4".
        `;

        try {
            const response = await askAI("Academic Counselor", prompt, 'groq');
            if (response) {
                const data = extractJSON(response);
                if (Array.isArray(data)) {
                    setEvents(data);

                    // Save to DB
                    const { db } = await import('../../lib/firebase');
                    const { collection, addDoc } = await import('firebase/firestore');

                    await addDoc(collection(db, 'user_timelines'), {
                        user_id: user.id,
                        exam_name: exam,
                        target_year: year,
                        events: data
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');

    if (!user?.targetExam || isJunior) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center px-4">
                <div className="p-4 bg-primary/10 rounded-full mb-2">
                    <Calendar size={48} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-text-main">
                    {isJunior ? 'Timeline Not Available' : 'Setup Required'}
                </h2>
                <p className="text-text-muted max-w-md">
                    {isJunior
                        ? 'Exam timelines are designed for competitive exams like JEE and NEET. Focus on your school syllabus!'
                        : 'Please configure your Target Exam in your profile to generate a timeline.'
                    }
                </p>
                {isJunior && (
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-2 bg-surface border border-border rounded-lg hover:bg-white/5 transition-all text-sm font-medium"
                        >
                            Go Back
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-main">Exam Timeline</h1>
                    <p className="text-text-muted">Critical dates for {user?.targetExam}.</p>
                </div>
                <button
                    onClick={() => generateTimeline()}
                    title="Regenerate Timeline"
                    className="p-2 border border-border rounded-lg hover:bg-white/5"
                >
                    <RefreshCw className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {loading && events.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            ) : (
                <div className="relative border-l-2 border-border ml-4 space-y-12 py-4">
                    {Array.isArray(events) && events.map((event, idx) => (
                        <div key={idx} className="relative pl-8 group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-surface 
                   ${event.status === 'highlight' ? 'bg-accent shadow-[0_0_10px_rgba(216,180,254,0.8)]' : 'bg-primary'}
                 `}></div>

                            <div className="glass-card p-6 hover:scale-[1.02] transition-transform">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-text-muted mt-1">
                                            <Calendar size={16} />
                                            <span>{event.date}</span>
                                        </div>
                                    </div>

                                    {event.status === 'highlight' && (
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20">
                                            <Clock size={16} />
                                            <span className="font-semibold">Major Event</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
