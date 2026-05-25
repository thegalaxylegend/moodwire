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
            <div 
                className={`relative border p-6 md:p-8 rounded-3xl flex flex-col justify-between overflow-hidden min-h-[220px] transition-all duration-500 ${
                    studyGoalMet 
                        ? 'bg-gradient-to-br from-green-500/[0.05] via-emerald-600/[0.03] to-transparent border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                        : 'bg-gradient-to-br from-orange-500/[0.05] via-amber-600/[0.03] to-transparent border-orange-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                }`}
            >
                {/* Radial Glows */}
                <div 
                    className={`absolute -top-12 -right-12 p-24 ${studyGoalMet ? 'bg-green-500/10' : 'bg-orange-500/15'} blur-[60px] rounded-full pointer-events-none`}
                />
                <div 
                    className={`absolute -bottom-16 -left-16 p-20 ${studyGoalMet ? 'bg-emerald-500/5' : 'bg-amber-500/5'} blur-[50px] rounded-full pointer-events-none`}
                />

                <div className="flex items-center justify-between relative z-10 gap-4">
                    <div className="space-y-2">
                        <h3 className={`text-xl md:text-2xl font-black ${studyGoalMet ? 'text-green-400' : 'text-orange-400'} flex items-center gap-2.5 tracking-tight`}>
                            {studyGoalMet ? (
                                <div className="p-1.5 rounded-xl bg-green-500/20 text-green-400">
                                    <CheckCircle size={20} className="fill-green-500/10" />
                                </div>
                            ) : (
                                <div className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 animate-pulse">
                                    <Brain size={20} className="fill-orange-500/10" />
                                </div>
                            )}
                            {studyGoalMet ? "Daily Goal Cleared" : "Knowledge Locked!"}
                        </h3>
                        <p className="text-text-muted text-xs md:text-sm font-medium leading-relaxed max-w-[280px] md:max-w-md">
                            {studyGoalMet
                                ? "You're ahead of the curve! Keep up this amazing learning momentum."
                                : `Push for ${Math.ceil((900 - studyTime) / 60)} more mins of active studying to maintain the blaze.`}
                        </p>
                    </div>

                    <div className="text-center group shrink-0">
                        <div className="text-4xl md:text-5xl font-black text-text-main flex items-center justify-center gap-1.5 relative">
                            <span>{user?.streak || 0}</span>
                            <Flame 
                                className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-500 ${
                                    studyGoalMet 
                                        ? 'text-orange-500 fill-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' 
                                        : 'text-text-muted/30 fill-transparent'
                                } animate-pulse`} 
                            />
                        </div>
                        <p className="text-[9px] uppercase font-black text-text-muted/60 tracking-[0.2em] mt-1">Day Streak</p>
                    </div>
                </div>

                <div className="mt-8 pt-5 border-t border-white/[0.04] flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        {/* Legendary Reward Chest Icon style */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/5 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <Gift size={18} className="animate-bounce" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-text-muted/60 uppercase tracking-wider">Today's Reward Claimed</p>
                            <p className="text-xs font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.2)]">+50 XP & +1 Streak Token</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="text-[9px] font-black text-primary uppercase tracking-[0.15em] hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20"
                    >
                        Refresh Stats
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card premium-border active-glow p-0 overflow-hidden relative group z-10 bg-gradient-to-br from-surface to-surface/90">
            {/* Glowing Accent bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent pointer-events-none" />
            <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20 text-primary shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                            <Brain size={20} className="fill-primary/10" />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main">Daily Quick-Fire</h3>
                            <p className="text-xs text-text-muted">Keep your streak alive!</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-surface-light/30 border border-white/5 rounded-full text-[10px] font-bold text-amber-400 flex items-center gap-1.5 shadow-sm">
                        <Gift size={12} className="animate-pulse" /> +1 Streak
                    </div>
                </div>

                <h4 className="text-base md:text-lg font-medium text-text-main mb-6 leading-relaxed">
                    {question.q}
                </h4>

                <div className="grid grid-cols-2 gap-3 relative z-20">
                    {question.options.map((opt) => {
                        const isSelected = selected === opt;
                        const isCorrect = opt === question.a;

                        let buttonClass = 'bg-surface/50 border-white/5 hover:bg-white/5 hover:border-primary/40 text-text-muted hover:text-text-main hover:scale-[1.02] shadow-sm';

                        if (showResult && isSelected) {
                            buttonClass = isCorrect
                                ? 'bg-green-500/20 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'bg-red-500/20 border-red-500 text-red-200 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                        } else if (showResult && isCorrect) {
                            buttonClass = 'bg-green-500/10 border-green-500/30 text-green-200/50';
                        }

                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                disabled={!!selected}
                                className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-all duration-300 ${buttonClass} ${selected ? 'cursor-default' : 'cursor-pointer active:scale-98'}`}
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
