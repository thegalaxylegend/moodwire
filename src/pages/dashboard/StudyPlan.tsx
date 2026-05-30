import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, Brain, Sparkles, Target } from 'lucide-react';
import { askAI } from '../../lib/ai';
import { useUserStore } from '../../store/userStore';
import { extractJSON } from '../../lib/utils';
import { AuthGate } from '../../components/auth/AuthGate';
import { EloService, DEFAULT_CALIBRATION } from '../../services/eloService';

export const StudyPlan = () => {
    const { user } = useUserStore();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);
    const [generatedFor, setGeneratedFor] = useState<string | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [insightLoading, setInsightLoading] = useState(false);

    const calibration = user?.calibrationProfile || DEFAULT_CALIBRATION;
    const summary = EloService.getCalibrationSummary(calibration);
    const confidence = EloService.getConfidenceLevel(calibration);

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

        // Build calibration-aware context
        const subjectStrengths = [
            `Physics: ${calibration.subjectRatings.physics || 1000} (${EloService.getSubjectDifficultyRating(calibration, 'physics')})`,
            `Chemistry: ${calibration.subjectRatings.chemistry || 1000} (${EloService.getSubjectDifficultyRating(calibration, 'chemistry')})`,
            `Math: ${calibration.subjectRatings.math || 1000} (${EloService.getSubjectDifficultyRating(calibration, 'math')})`,
            `Biology: ${calibration.subjectRatings.biology || 1000} (${EloService.getSubjectDifficultyRating(calibration, 'biology')})`
        ].join(', ');

        const prompt = `
            STRICT REQUIREMENT: YOUR RESPONSE MUST BE A VALID JSON ARRAY ONLY. 
            NO CONVERSATIONAL TEXT, NO INTRODUCTIONS, NO "HERE IS YOUR PLAN".
            
            Create a realistic daily study schedule for an Indian student preparing for ${exam}.
            Date: ${date}.
            Student Level: ${user?.prepLevel || 'Intermediate'} (Overall Tier: ${summary.overallTier}).
            Focus Areas: ${focusAreas}.
            Subject Ability Ratings: ${subjectStrengths}.
            Weak Subjects: ${summary.weakSubjects.length > 0 ? summary.weakSubjects.join(', ') : 'None identified yet'}.
            Strong Subjects: ${summary.strongSubjects.length > 0 ? summary.strongSubjects.join(', ') : 'None identified yet'}.
            Total Questions Attempted: ${calibration.totalAttempts}.
            
            PRIORITY RULES:
            1. Allocate MORE time to weak subjects.
            2. Include at least one practice session for strong subjects to maintain them.
            3. If total attempts < 20, include a "Diagnostic Practice" slot.
            
            ${videoContext}
            
            OUTPUT FORMAT (MANDATORY):
            [
                { "time": "08:00 AM", "task": "Topic/Subject focus", "duration": "2h", "type": "study", "status": "pending" },
                { "time": "10:30 AM", "task": "Break / Revision", "duration": "30m", "type": "break", "status": "pending" }
            ]
            Include about 5-6 slots.
        `;

        try {
            const response = await askAI("Act as a strict academic mentor. Prioritize the MANDATORY ASSIGNMENT if provided.", prompt, 'groq', [], { stream: false });
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

    // AI Insight Generation (Gemini Free Tier)
    const generateInsight = async () => {
        if (!user || insightLoading) return;
        setInsightLoading(true);
        try {
            const insightPrompt = `You are a concise study advisor. Given this student's data, write ONE short actionable tip (2-3 sentences max).

Student: ${user.name}, preparing for ${user.targetExam || 'Competitive Exam'}.
Overall Ability: ${calibration.overall} (${summary.overallTier}).
Strong: ${summary.strongSubjects.join(', ') || 'Undetermined'}.
Weak: ${summary.weakSubjects.join(', ') || 'Undetermined'}.
Attempts: ${calibration.totalAttempts}. Current Streak: ${user.streak} days.
Calibration Confidence: ${confidence}.

Give a specific, data-driven tip. Mention exact subjects. No generic motivational advice.`;

            const result = await askAI(
                'You are a brief academic advisor. One paragraph max.',
                insightPrompt,
                'gemini',
                [],
                { stream: false, noCache: true }
            );
            if (result && typeof result === 'string') {
                setAiInsight(result);
            }
        } catch (err) {
            console.error('[StudyPlan] AI Insight failed:', err);
            setAiInsight('Focus on your weakest subject today. Even 30 minutes of targeted practice outperforms 2 hours of passive revision.');
        } finally {
            setInsightLoading(false);
        }
    };

    useEffect(() => {
        if (user && !aiInsight) generateInsight();
    }, [user]);

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                    <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
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
                    <button type="button"
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
                                    <p className="text-text-muted animate-pulse">Analyzing syllabus & energy levels…</p>
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
                                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur opacity-30 animate-pulse"></div>
                                                <div className="relative size-16 bg-slate-900/80 border border-white/10 rounded-full flex items-center justify-center shadow-xl">
                                                    <Brain className="text-violet-400" size={28} />
                                                </div>
                                            </div>
                                            <div className="max-w-sm space-y-2">
                                                <h3 className="text-lg font-black text-slate-100 uppercase tracking-wider bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                                                    No Active Study Plan
                                                </h3>
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    Our Neural Planner can analyze your current ELO ratings, active diagnostic gaps, and study goals to craft a high-performance routine.
                                                </p>
                                            </div>
                                            <button type="button"
                                                onClick={generateSchedule}
                                                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_25px_rgba(124,58,237,0.5)] active:scale-95 border-t border-white/10 flex items-center gap-2"
                                            >
                                                <Sparkles size={14} className="animate-pulse" />
                                                Generate First Plan
                                            </button>
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
                                <Sparkles size={16} className="text-primary" /> AI Insight
                                <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-bold ml-auto">
                                    {confidence} Confidence
                                </span>
                            </h3>
                            {insightLoading ? (
                                <p className="text-sm text-text-muted animate-pulse">Analyzing your performance data…</p>
                            ) : aiInsight ? (
                                <p className="text-sm text-text-muted leading-relaxed">{aiInsight}</p>
                            ) : (
                                <p className="text-sm text-text-muted">
                                    {weeklyGoals.length > 0 && weeklyGoals[0].progress < 30 ? (
                                        <>
                                            Consider switching to <strong>{weeklyGoals[0].label.replace('Master ', '')}</strong> this weekend to balance your preparation.
                                        </>
                                    ) : (
                                        <>Keep up the momentum! Take a <strong>Full Mock Test</strong> this weekend.</>
                                    )}
                                </p>
                            )}
                            <button type="button"
                                onClick={generateInsight}
                                disabled={insightLoading}
                                className="w-full mt-2 py-1.5 text-xs font-bold bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-text-muted flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw size={12} className={insightLoading ? 'animate-spin' : ''} />
                                Refresh Insight
                            </button>
                        </div>

                        {/* Calibration Summary Card */}
                        <div className="glass-card oxygen-card p-6 space-y-3">
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Target size={16} className="text-accent" /> Calibration Profile
                            </h3>
                            <div className="text-xs text-text-muted space-y-2">
                                <div className="flex justify-between"><span>Overall</span><span className="font-bold text-text-main">{calibration.overall}</span></div>
                                {['Physics', 'Chemistry', 'Math', 'Biology'].map(s => {
                                    const key = s.toLowerCase() as 'physics' | 'chemistry' | 'math' | 'biology';
                                    const val = calibration.subjectRatings[key] || 1000;
                                    const color = val > 1200 ? 'text-green-400' : val < 800 ? 'text-red-400' : 'text-text-main';
                                    return (
                                        <div key={s} className="flex justify-between items-center">
                                            <span>{s}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (val / 20))}%` }} />
                                                </div>
                                                <span className={`font-bold ${color}`}>{val}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-2 border-t border-white/10">
                                    <span className="text-[10px] uppercase tracking-widest">{calibration.totalAttempts} attempts • {summary.overallTier}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
};
