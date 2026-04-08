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
    const [showResult, setShowResult] = useState(false);

    // Pick question based on day of year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const question = QUESTIONS[dayOfYear % QUESTIONS.length];
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (user?.lastTestDate === todayStr) {
            setCompleted(true);
        }
    }, [user, todayStr]);

    const handleAnswer = async (option: string) => {
        setSelected(option);
        setShowResult(true);

        if (option === question.a) {
            // Correct answer feedback
            setTimeout(async () => {
                setCompleted(true);
                await completeDailyChallenge();
                const gains = calculateGains('daily_claim', { streak: user?.streak });
                await addGains(gains);

                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }, 800);
        } else {
            // Wrong answer feedback
            setTimeout(() => {
                setSelected(null);
                setShowResult(false);
            }, 1000);
        }
    };

    if (completed) {
        const studyTime = user?.dailyStudyTime || 0;
        const studyGoalMet = studyTime >= 900;

        return (
            <div className={`bg-gradient-to-br ${studyGoalMet ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-orange-500/10 to-orange-600/10 border-orange-500/20'} border p-8 rounded-2xl flex flex-col justify-between animate-fade-in relative overflow-hidden min-h-[200px]`}>
                <div className={`absolute top-0 right-0 p-20 ${studyGoalMet ? 'bg-green-500/20' : 'bg-orange-500/20'} blur-3xl rounded-full translate-x-1/2 -translate-y-1/2`}></div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <h3 className={`text-2xl font-black ${studyGoalMet ? 'text-green-400' : 'text-orange-400'} flex items-center gap-2 tracking-tight`}>
                            {studyGoalMet ? <CheckCircle size={24} className="fill-green-500/20" /> : <Brain size={24} className="fill-orange-500/20" />}
                            {studyGoalMet ? "Daily Goal Cleared" : "Knowledge Locked!"}
                        </h3>
                        <p className="text-text-muted text-sm font-medium">
                            {studyGoalMet
                                ? "You're ahead of the curve! Stay consistent."
                                : `Push for ${Math.ceil((900 - studyTime) / 60)} more mins to maintain the blaze.`}
                        </p>
                    </div>

                    <div className="text-center group">
                        <div className="text-4xl font-black text-text-main flex items-center justify-center gap-2">
                            {user?.streak || 0}
                            <Flame className={`${studyGoalMet ? 'text-orange-500 fill-orange-500' : 'text-text-muted/30 fill-transparent'} animate-pulse`} size={32} />
                        </div>
                        <p className="text-[10px] uppercase font-black text-text-muted tracking-widest mt-1">Day Streak</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                            <Gift size={16} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Today's Reward</p>
                            <p className="text-xs font-bold text-text-main">+50 XP & +1 Streak Token</p>
                        </div>
                    </div>
                    <button onClick={() => window.location.reload()} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                        Refresh Stats
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-0 overflow-hidden relative group z-10">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 pointer-events-none"></div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-20">
                    {question.options.map((opt) => {
                        const isSelected = selected === opt;
                        const isCorrect = opt === question.a;

                        let buttonClass = 'bg-surface border-border hover:bg-white/5 hover:border-primary/50 text-text-muted hover:text-text-main hover:scale-[1.02]';

                        if (showResult && isSelected) {
                            buttonClass = isCorrect
                                ? 'bg-green-500/20 border-green-500 text-green-200'
                                : 'bg-red-500/20 border-red-500 text-red-200 animate-shake';
                        } else if (showResult && isCorrect) {
                            buttonClass = 'bg-green-500/10 border-green-500/50 text-green-200/50';
                        }

                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                disabled={!!selected}
                                className={`p-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${buttonClass} ${selected ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};
