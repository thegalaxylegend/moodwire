import { useUserStore } from '../../store/userStore';
import { Brain, CheckCircle } from 'lucide-react';

export const DailyStudyGoalIcon = () => {
    const { user } = useUserStore();
    const studyTime = user?.dailyStudyTime || 0;
    const goal = 900; // 15 minutes in seconds
    const progress = Math.min(100, Math.round((studyTime / goal) * 100));
    const isComplete = studyTime >= goal;

    return (
        <div className="group relative flex items-center justify-center">
            {/* Circular Progress */}
            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className="text-surface-light"
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={100}
                        strokeDashoffset={100 - progress}
                        className={`transition-all duration-1000 ${isComplete ? 'text-green-500' : 'text-primary'}`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {isComplete ? (
                        <CheckCircle size={16} className="text-green-500 fill-green-500/20" />
                    ) : (
                        <Brain size={16} className="text-primary" />
                    )}
                </div>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute top-full mt-2 right-0 w-48 bg-surface border border-border p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="text-sm font-bold text-text-main mb-1">Daily Study Goal</p>
                <div className="flex justify-between text-xs text-text-muted mb-2">
                    <span>{Math.round(studyTime / 60)} / 15 mins</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-[10px] text-text-muted mt-2">
                    {isComplete ? "Goal complete! Streak saved." : "Quiz + 15m Study = Streak Saved"}
                </p>
            </div>
        </div>
    );
};
