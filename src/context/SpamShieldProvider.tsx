import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertOctagon, ShieldAlert, ZapOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ShieldReason = 'ai' | 'db_write' | 'external_api' | 'global_fetch' | 'click_spam';

interface SpamShieldContextProps {
    isShielded: boolean;
    shieldReason: ShieldReason | null;
    resetTime: number;
    triggerShield: (reason: ShieldReason, resetTimeMs: number) => void;
}

const SpamShieldContext = createContext<SpamShieldContextProps | undefined>(undefined);

export const useSpamShield = () => {
    const context = useContext(SpamShieldContext);
    if (!context) {
        throw new Error('useSpamShield must be used within a SpamShieldProvider');
    }
    return context;
};

export const SpamShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isShielded, setIsShielded] = useState(false);
    const [shieldReason, setShieldReason] = useState<ShieldReason | null>(null);
    const [resetTime, setResetTime] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const triggerShield = useCallback((reason: ShieldReason, resetTimeMs: number) => {
        setShieldReason(reason);
        setResetTime(resetTimeMs);
        setIsShielded(true);
        setTimeLeft(Math.max(0, Math.round((resetTimeMs - Date.now()) / 1000)));
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!isShielded || resetTime <= 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = resetTime - now;
            if (diff <= 0) {
                setIsShielded(false);
                setShieldReason(null);
                setResetTime(0);
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(Math.max(1, Math.round(diff / 1000)));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isShielded, resetTime]);

    // Listen for custom trigger events from non-React service layers
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleTrigger = (e: Event) => {
            const customEvent = e as CustomEvent<{ reason: ShieldReason; resetTimeMs: number }>;
            if (customEvent.detail) {
                triggerShield(customEvent.detail.reason, customEvent.detail.resetTimeMs);
            }
        };
        window.addEventListener('spam_shield_trigger', handleTrigger);
        return () => window.removeEventListener('spam_shield_trigger', handleTrigger);
    }, [triggerShield]);

    const getReasonContent = () => {
        switch (shieldReason) {
            case 'ai':
                return {
                    title: "Exa AI Cool-Down Mode",
                    desc: "You've typed a lot of questions in a short time. Your personal Exa AI tutor is gathering its thoughts.",
                    icon: ShieldAlert,
                    tip: "Tip: While waiting, try re-reading your notes or analyzing your previous mock questions!"
                };
            case 'db_write':
                return {
                    title: "Database Lock Engaged",
                    desc: "To protect the syllabus database, we have placed a brief cool-down lock on updates.",
                    icon: AlertOctagon,
                    tip: "No progress will be lost. Legitimate saves will resume once the lock is lifted."
                };
            case 'click_spam':
                return {
                    title: "Anti-Spam Triggered",
                    desc: "Rapid clicking detected. Take a deep breath! Exam Compass performs better when clicked at a natural pace.",
                    icon: ZapOff,
                    tip: "Sit back and relax for a moment. We're keeping things stable."
                };
            case 'external_api':
            case 'global_fetch':
            default:
                return {
                    title: "High-Frequency Security Shield",
                    desc: "Multiple rapid requests detected. Our global request shield has been active to maintain platform stability.",
                    icon: ShieldAlert,
                    tip: "If you are running an automated script, please disable it to continue using Exam Compass."
                };
        }
    };

    const content = getReasonContent();
    const IconComponent = content.icon;

    return (
        <SpamShieldContext.Provider value={{ isShielded, shieldReason, resetTime, triggerShield }}>
            {children}
            <AnimatePresence>
                {isShielded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-4 right-4 z-[99999] max-w-sm w-[calc(100vw-32px)] sm:w-96 bg-[#0f1016]/95 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex items-start gap-4"
                    >
                        {/* Animated gradient accent border */}
                        <div className="absolute inset-0 rounded-2xl border border-primary/20 pointer-events-none" />

                        {/* Icon */}
                        <div className="size-10 rounded-xl bg-gradient-to-br from-[#5d21df] to-[#153ae4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#5d21df]/25">
                            <IconComponent className="size-5 text-white animate-pulse" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-sm font-bold text-white mb-1 tracking-tight">
                                {content.title}
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed mb-3">
                                {content.desc}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                                    Cool-down:
                                </span>
                                <span className="text-xs font-black text-white font-mono bg-white/5 px-2 py-0.5 rounded">
                                    {timeLeft}s
                                </span>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => {
                                setIsShielded(false);
                                setShieldReason(null);
                                setResetTime(0);
                                setTimeLeft(0);
                            }}
                            className="text-gray-400 hover:text-white transition-colors text-lg font-bold leading-none p-1"
                            aria-label="Dismiss"
                        >
                            &times;
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </SpamShieldContext.Provider>
    );
};
