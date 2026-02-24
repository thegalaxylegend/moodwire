import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, Brain } from 'lucide-react';
import { askAI } from '../../lib/ai';
import { useUserStore } from '../../store/userStore';
// import { supabase } from '../../lib/supabase'; // REMOVED
import { extractJSON } from '../../lib/utils';
import { AuthGate } from '../../components/auth/AuthGate';

export const StudyPlan = () => {
    const { user } = useUserStore();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
    const [generatedFor, setGeneratedFor] = useState<string | null>(null);

    useEffect(() => {
        fetchLatestPlan();
    }, [user]);

    const fetchLatestPlan = async () => {
        if (!user) return;
        try {
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, getDocs } = await import('firebase/firestore');

            // Simplified query to avoid composite index requirement
            const q = query(
                collection(db, 'study_plans'),
                where('user_id', '==', user.id)
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
                // Client-side sort to get the latest plan
                const plans = snap.docs.map(d => d.data());
                plans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                const latest = plans[0];
                if (latest.plan_data && Array.isArray(latest.plan_data)) {
                    setSchedule(latest.plan_data);
                    setGeneratedFor(new Date(latest.created_at).toLocaleDateString());
                } else if (latest.plan_data) {
                    console.warn("[StudyPlan] Found legacy/malformed plan data (not an array):", latest.plan_data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch plan", err);
        }
    };

    const generateSchedule = async () => {
        setLoading(true);
        const exam = user?.targetExam || 'Competitive Exam';
        const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

        // Fetch incomplete topics from syllabus
        const { db } = await import('../../lib/firebase');
        const { collection, query, where, limit, getDocs, addDoc } = await import('firebase/firestore');

        let focusAreas = "General high-yield topics";
        try {
            if (user?.id) {
                // const { data: weakTopics } = await supabase...
                const q = query(collection(db, 'syllabus'), where('user_id', '==', user.id), where('is_completed', '==', false), limit(5));
                const snap = await getDocs(q);
                const weakTopics = snap.docs.map(d => d.data());

                if (weakTopics.length > 0) {
                    focusAreas = weakTopics.map((t: any) => t.topic).join(', ');
                }
            }
        } catch (e) {
            console.error("Error fetching weak topics", e);
        }

        // Fetch active video recommendation
        let videoContext = "";
        try {
            const { getActiveRecommendation } = await import('../../services/recommendationService');
            const activeRec = await getActiveRecommendation(user?.id || '', user?.userClass, user?.targetExam);

            if (activeRec && activeRec.video) {
                videoContext = `
                MANDATORY ASSIGNMENT:
                The student MUST watch the video lecture "${activeRec.video.title}" (${activeRec.video.duration}).
                Topic: ${activeRec.topic}.
                Reason: ${activeRec.reason}.
                
                INSTRUCTIONS FOR PLANNER:
                1. You MUST schedule this video in the plan.
                2. If the video is longer than 3 hours, split it into multiple sessions (e.g., "Part 1", "Part 2").
                3. Label it clearly as "Lecture: [Title]".
                `;
            }
        } catch (e) {
            console.error("Failed to fetch active recommendation for planner", e);
        }

        const prompt = `
            STRICT REQUIREMENT: YOUR RESPONSE MUST BE A VALID JSON ARRAY ONLY. 
            NO CONVERSATIONAL TEXT, NO INTRODUCTIONS, NO "HERE IS YOUR PLAN".
            
            Create a realistic daily study schedule for an Indian student preparing for ${exam}.
            Date: ${date}.
            Student Level: ${user?.prepLevel || 'Intermediate'}.
            Focus Areas: ${focusAreas}.
            
            ${videoContext}
            
            OUTPUT FORMAT (MANDATORY):
            [
                { "time": "08:00 AM", "task": "Topic/Subject focus", "duration": "2h", "type": "study", "status": "pending" },
                { "time": "10:30 AM", "task": "Break / Revision", "duration": "30m", "type": "break", "status": "pending" }
            ]
            Include about 5-6 slots.
        `;

        try {
            const response = await askAI("Act as a strict academic mentor. Prioritize the MANDATORY ASSIGNMENT if provided.", prompt, 'groq');
            if (response) {
                const planData = extractJSON(response);
                if (planData && Array.isArray(planData)) {
                    setSchedule(planData);
                    setGeneratedFor("Just Now");

                    // Save to DB
                    if (user) {
                        try {
                            await addDoc(collection(db, 'study_plans'), {
                                user_id: user.id,
                                plan_data: planData,
                                created_at: new Date().toISOString()
                            });
                        } catch (dbErr) {
                            console.error("[StudyPlan] Failed to save plan to Firestore:", dbErr);
                            // We still have the local state, so the user can see it, but it won't persist on refresh.
                            // Optionally add a non-blocking toast here if available.
                        }
                    }
                } else {
                    console.warn("[StudyPlan] AI returned non-array plan data:", planData);
                    setError("AI returned invalid plan format. Please try again.");
                }
            } else {
                setError("AI failed to generate a plan. Please check your connection.");
            }
        } catch (error) {
            console.error("Schedule generation failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Moving weeklyGoals state above for log access
    // const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);

    useEffect(() => {
        const fetchGoals = async () => {
            if (!user) return;
            // Fetch topics that are in progress
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, limit, getDocs } = await import('firebase/firestore');

            try {
                const q = query(collection(db, 'syllabus'), where('user_id', '==', user.id), where('is_completed', '==', false), limit(3));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const data = snap.docs.map(d => d.data());
                    setWeeklyGoals(data.map((d: any) => ({
                        label: `Master ${d.topic}`,
                        progress: d.mastery_score || 0
                    })));
                } else {
                    setWeeklyGoals([
                        { label: 'Start your first Topic', progress: 0 },
                        { label: 'Take a Diagnostic Test', progress: 0 }
                    ]);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchGoals();
    }, [user]);

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <CalendarIcon size={40} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Your Personalized AI Study Plan</h2>
                        <p className="text-text-muted max-w-md mt-2">
                            Log in to get a custom daily schedule based on your weak areas, exam date, and energy levels.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-text-main">Adaptive Study Plan</h1>
                        <p className="text-text-muted">
                            AI-optimized schedule for <span className="font-bold text-primary">{user?.name || 'Aspirant'}</span>
                            {' '}targeting <span className="text-secondary">{user?.targetExam || 'Exams'}</span>.
                        </p>
                    </div>
                    <button
                        onClick={generateSchedule}
                        disabled={loading}
                        className="px-4 py-2 bg-surface border border-border rounded-lg text-text-main flex items-center gap-2 oxygen-button disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        {loading ? 'Optimizing...' : 'Regenerate Plan'}
                    </button>
                </header>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
                        <Brain size={18} /> {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
                    {/* Today's Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card oxygen-card p-6 min-h-[400px]">
                            <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                                <CalendarIcon className="text-primary" />
                                {generatedFor || "Today's Focus"}
                            </h3>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Brain size={48} className="text-primary animate-pulse" />
                                    <p className="text-text-muted animate-pulse">Analyzing syllabus & energy levels...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Array.isArray(schedule) && schedule.length > 0 ? (
                                        schedule.map((slot, idx) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 rounded-full border-2 ${slot.status === 'completed' ? 'bg-primary border-primary' : 'border-text-muted'} group-hover:border-primary transition-colors`} />
                                                    {idx !== schedule.length - 1 && <div className="w-px h-full bg-border my-1" />}
                                                </div>

                                                <div className={`flex-1 p-4 rounded-xl border transition-all cursor-pointer ${slot.status === 'completed'
                                                    ? 'bg-primary/5 border-primary/30 opacity-60'
                                                    : slot.type === 'break'
                                                        ? 'bg-surface/50 border-border/50 opacity-70'
                                                        : 'bg-surface border-border hover:border-primary/50'
                                                    }`}
                                                    onClick={() => {
                                                        const newSchedule = [...schedule];
                                                        newSchedule[idx].status = slot.status === 'completed' ? 'pending' : 'completed';
                                                        setSchedule(newSchedule);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <h4 className={`font-semibold ${slot.status === 'completed' ? 'text-primary/70 line-through' : 'text-text-main'}`}>
                                                            {slot.task}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            {slot.status === 'completed' && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">COMPLETED</span>}
                                                            <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                                                                <Clock size={12} /> {slot.duration}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-text-muted mt-1">{slot.time}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-text-muted">No active plan. Click 'Regenerate' to start.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Goals Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card oxygen-card p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-text-main">Weekly Targets</h3>
                                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">Auto-generated</span>
                            </div>
                            <div className="space-y-3">
                                {Array.isArray(weeklyGoals) && weeklyGoals.map((goal, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-main">{goal.label}</span>
                                            <span className="text-text-muted">{goal.progress}%</span>
                                        </div>
                                        <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-secondary h-full rounded-full" style={{ width: `${goal.progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card oxygen-card p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 space-y-3">
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Brain size={16} /> AI Suggestion
                            </h3>
                            <p className="text-sm text-text-muted">
                                {weeklyGoals.length > 0 && weeklyGoals[0].progress < 30 ? (
                                    <>
                                        You've been focusing heavily on other subjects.
                                        Consider switching to <strong>{weeklyGoals[0].label.replace('Master ', '')}</strong> this weekend to balance your preparation.
                                    </>
                                ) : (
                                    <>
                                        Great progress! Keep maintaining your streak.
                                        Try a <strong>Full Mock Test</strong> this weekend to test your retention.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
};
