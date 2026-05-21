import { useUserStore } from '../../store/userStore';
import { Brain, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const DailyStudyGoalIcon = () => {
    const { user } = useUserStore();
    const studyTime = user?.dailyStudyTime || 0;
    const goal = 900; // 15 minutes in seconds
    const progress = Math.min(100, Math.round((studyTime / goal) * 100));
    const isComplete = studyTime >= goal;

    // Precise SVG Circumference Calculations
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="group relative flex items-center justify-center">
            {/* Circular Progress Container */}
            <motion.div 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-11 h-11 flex items-center justify-center cursor-pointer transition-colors"
            >
                {/* Background Ring Shadow/Glow */}
                <div className="absolute inset-0 bg-white/5 rounded-full blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <svg className="w-full h-full transform -rotate-90">
                    {/* Track ring */}
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        className="text-white/[0.04] dark:text-white/[0.06]"
                    />
                    
                    {/* Glowing neon progress shadow (Blur layer) */}
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 opacity-40 blur-[2px] ${
                            isComplete ? 'text-emerald-500' : 'text-primary'
                        }`}
                    />
                    
                    {/* Main crisp progress layer */}
                    <circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${
                            isComplete ? 'text-emerald-400' : 'text-violet-400'
                        }`}
                    />
                </svg>

                {/* Inner Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {isComplete ? (
                        <CheckCircle size={16} className="text-emerald-400 fill-emerald-500/20 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)] animate-pulse" />
                    ) : (
                        <Brain size={16} className="text-violet-400 drop-shadow-[0_0_4px_rgba(139,92,246,0.3)]" />
                    )}
                </div>
            </motion.div>

            {/* Hover Tooltip (Glassmorphism Floating Bubble) */}
            <div className="absolute top-[120%] mt-1 right-0 w-52 backdrop-blur-md bg-slate-950/80 border border-white/10 p-3.5 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50 pointer-events-none">
                {/* Micro badge header */}
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">STUDY TARGET</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/60'
                    }`}>
                        {isComplete ? 'Goal Met' : 'Active'}
                    </span>
                </div>
                <p className="text-xs font-bold text-slate-100 mb-2">Daily Study Streak</p>
                
                {/* Metric Details */}
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                    <span>{Math.round(studyTime / 60)} / 15 mins</span>
                    <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-violet-400'}>{progress}%</span>
                </div>
                
                {/* Progress capsule */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                            isComplete ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-violet-500 to-indigo-400'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                {/* Bottom tip text */}
                <p className="text-[9px] text-slate-500 leading-tight mt-2.5 pt-2 border-t border-white/5">
                    {isComplete 
                        ? "✨ Daily goal cleared! Streak safe for today." 
                        : "🎯 Complete a Daily Quiz & study 15 mins to lock streak."}
                </p>
            </div>
        </div>
    );
};

