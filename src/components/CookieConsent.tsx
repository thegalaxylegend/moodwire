import { useState, useEffect } from 'react';
import { useTestMode } from '../hooks/useTestMode';

const isServer = typeof window === 'undefined';

export const CookieConsent = () => {
    const [visible, setVisible] = useState(false);
    const isTestMode = useTestMode();

    useEffect(() => {
        if (isServer) return;
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Slight delay so it doesn't flash during initial page load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setVisible(false);
    };

    // Suppress during test mode & when not visible
    if (!visible || isTestMode) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-fade-in-up"
            role="dialog"
            aria-label="Cookie consent"
        >
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-surface/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                <p className="text-sm text-gray-300 text-center sm:text-left">
                    We use cookies and similar technologies for analytics (Google Analytics) and advertising (Google AdSense) to improve your experience.
                    By continuing, you agree to our{' '}
                    <a href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</a>.
                </p>
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

