import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Flame, CheckCircle, Brain, Gift } from 'lucide-react';
import { calculateGains } from '../services/gamificationService';

const QUESTIONS = [
    { q: "What is the unit of Force?", a: "Newton", options: ["Joule", "Pascal", "Newton", "Watt"] },
    { q: "d/dx of sin(x) is?", a: "cos(x)", options: ["-cos(x)", "cos(x)", "sin(x)", "-sin(x)"] },
    { q: "Light travels fastest in?", a: "Vacuum", options: ["Water", "Glass", "Vacuum", "Diamond"] },
    { q: "Atomic number of Carbon?", a: "6", options: ["5", "6", "7", "8"] },
    { q: "Value of g (gravity) approx?", a: "9.8 m/s²", options: ["10.5 m/s²", "9.8 m/s²", "8.9 m/s²", "9.2 m/s²"] },
];

export const DailyChallenge = () => {
    const { user, addGains, completeDailyChallenge } = useUserStore();
    const [completed, setCompleted] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    // Pick question based on day of year to ensure daily rotation for everyone
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const question = QUESTIONS[dayOfYear % QUESTIONS.length];
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (user?.lastTestDate === todayStr) {
            setCompleted(true);
        }
    }, [user]);

    const handleAnswer = async (option: string) => {
        setSelected(option);
        if (option === question.a) {
            setCompleted(true);

            // Complete Daily Challenge (Streak gating handled in store)
            await completeDailyChallenge();

            // Award Daily Login Gains with Streak Bonus
            const gains = calculateGains('daily_claim', { streak: user?.streak });
            await addGains(gains);

            // Ask for Notification permission (Soft Launch)
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            setTimeout(() => setSelected(null), 1000); // Shaky effect logic could go here
        }
    };

    if (completed) {
        const studyTime = user?.dailyStudyTime || 0;
        const studyGoalMet = studyTime >= 900;

        return (
            <div className={`bg-gradient-to-br ${studyGoalMet ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-orange-500/10 to-orange-600/10 border-orange-500/20'} border p-6 rounded-2xl flex items-center justify-between animate-fade-in relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-10 ${studyGoalMet ? 'bg-green-500/10' : 'bg-orange-500/10'} blur-3xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>

                <div className="relative z-10">
                    <h3 className={`text-xl font-bold ${studyGoalMet ? 'text-green-400' : 'text-orange-400'} flex items-center gap-2`}>
                        {studyGoalMet ? <CheckCircle size={24} className="fill-green-500/20" /> : <Brain size={24} className="fill-orange-500/20" />}
                        {studyGoalMet ? "Daily Goal Complete" : "Quiz Complete!"}
                    </h3>
                    <p className="text-text-muted mt-1">
                        {studyGoalMet
                            ? "Streak maintained! Come back tomorrow."
                            : `Study ${Math.ceil((900 - studyTime) / 60)} more mins to save streak!`}
                    </p>
                </div>

                <div className="text-center relative z-10">
                    <div className="text-3xl font-bold text-text-main flex items-center justify-center gap-1">
                        {user?.streak || 0} <Flame className={`${studyGoalMet ? 'text-orange-500 fill-orange-500' : 'text-text-muted fill-transparent'} animate-pulse`} />
                    </div>
                    <p className="text-xs uppercase font-bold text-text-muted tracking-wider">Day Streak</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-0 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Brain size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main">Daily Quick-Fire</h3>
                            <p className="text-xs text-text-muted">Keep your streak alive!</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-text-muted flex items-center gap-1">
                        <Gift size={12} /> +1 Streak
                    </div>
                </div>

                <h4 className="text-lg font-medium text-text-main mb-6">{question.q}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => handleAnswer(opt)}
                            disabled={!!selected}
                            className={`p-3 rounded-xl border text-left text-sm font-medium transition-all duration-200
                                ${selected === opt && opt !== question.a
                                    ? 'bg-red-500/20 border-red-500 text-red-200'
                                    : 'bg-surface border-border hover:bg-white/5 hover:border-primary/50 text-text-muted hover:text-text-main'
                                }
                            `}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};
