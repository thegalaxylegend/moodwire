import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface AuthGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode; // Optional custom fallback UI instead of default modal/redirect
    mode?: 'modal' | 'redirect'; // Default to modal for less disruption
}

export const AuthGate = ({ children, fallback, mode = 'modal' }: AuthGateProps) => {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showModal, setShowModal] = useState(false);
    useScrollLock(showModal);

    useEffect(() => {
        if (!showModal) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowModal(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showModal]);

    const handleAccess = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            e.stopPropagation();

            if (mode === 'redirect') {
                navigate('/login', { state: { from: location } });
            } else {
                setShowModal(true);
            }
        }
    };

    if (user) {
        return <>{children}</>;
    }

    if (fallback) {
        return (
            <div className="w-full flex flex-col items-center justify-center relative">
                {fallback}
                <div className="w-full flex justify-center mt-6 relative z-10 px-4">
                    <button type="button"
                        onClick={() => navigate('/login', { state: { from: location } })}
                        className="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-black shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all outline-none border border-white/20 uppercase tracking-widest text-sm"
                    >
                        Sign In / Create Account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* 
               We wrap the children in a div that captures clicks. 
               Note: This is a simple implementation. For complex interactive children, 
               we might need a transparent overlay or specific handling. 
            */}
            <div onClickCapture={handleAccess} className="relative">
                {/* Optional: Add a lock overlay if desired, but request said "feature previews" so we keep it visible */}
                {children}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title" onClick={() => setShowModal(false)}>
                    <div className="bg-surface border border-primary/20 p-8 rounded-2xl max-w-sm w-full shadow-2xl relative oxygen-card text-center space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="text-primary" size={32} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-text-main">Login Required</h2>
                            <p className="text-text-muted mt-2 text-sm">
                                You need to sign in to use this feature and save your progress.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button type="button"
                                onClick={() => navigate('/login', { state: { from: location } })}
                                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all oxygen-button"
                            >
                                Sign In / Sign Up
                            </button>
                            <button type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 rounded-xl bg-transparent border border-border text-text-muted hover:text-text-main hover:bg-white/5 transition-all oxygen-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
