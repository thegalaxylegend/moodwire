import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export const GuestBanner = () => {
    const { user, logout } = useUserStore();
    const navigate = useNavigate();

    // Check if guest based on email pattern from userStore
    const isGuest = user?.email?.startsWith('guest_') || user?.name === 'Guest Student';

    if (!isGuest) return null;

    const handleSignUp = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-6 flex items-center justify-between animate-fade-in group">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                    <AlertTriangle size={16} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-500">Guest Mode Active</h4>
                    <p className="text-xs text-text-muted hidden sm:block">Your progress is only saved on this device. Sign up to sync across devices.</p>
                </div>
            </div>

            <button
                onClick={handleSignUp}
                className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1"
            >
                Sign Up <ChevronRight size={14} />
            </button>
        </div>
    );
};
