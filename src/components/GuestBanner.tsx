import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { ChevronRight, Flame, Trophy, AlertCircle } from 'lucide-react';

export const GuestBanner = () => {
    const { user, logout } = useUserStore();
    const navigate = useNavigate();

    const isGuest = user?.isGuest || user?.email?.startsWith('guest_') || user?.name === 'Guest Student';

    if (!isGuest || !user) return null;

    const handleSignUp = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="relative group mb-8">
            {/* Animated Background Glow - Warm Warning Tone */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden">
                {/* Decorative Urgency Signal */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-600"></div>

                <div className="flex items-start gap-5 z-10 w-full lg:w-auto">
                    <div className="hidden sm:flex relative shrink-0">
                        <div className="p-3 bg-white/5 rounded-xl text-amber-500 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <AlertCircle size={28} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        </div>
                    </div>

                    <div className="text-center sm:text-left">
                        <h4 className="text-xl font-black text-white tracking-tight leading-tight mb-1 uppercase italic">
                            You've worked too hard to lose this
                        </h4>

                        <div className="flex flex-col gap-1 text-sm">
                            <p className="text-gray-300 font-medium">
                                <span className="text-amber-400 font-bold">{user.streak || 0} {user.streak === 1 ? 'day' : 'days'}</span> of effort, <span className="text-amber-400 font-bold">{user.xp || 0} XP</span> earned.
                                <span className="text-white font-bold block sm:inline sm:ml-1">One tab close away from gone.</span>
                            </p>

                            <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <Flame size={14} className="text-orange-500" />
                                    <span className="text-[11px] font-bold text-gray-400">UNSECURED STREAK</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <Trophy size={14} className="text-purple-400" />
                                    <span className="text-[11px] font-bold text-gray-400">SYNC REQUIRED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto z-10">
                    <button type="button"
                        onClick={() => navigate('/login')}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest px-4 py-2"
                    >
                        I'll risk losing it
                    </button>

                    <button type="button"
                        onClick={handleSignUp}
                        className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-sm font-black rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 group/btn active:scale-95 border-t border-white/20"
                    >
                        Save My Progress
                        <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
