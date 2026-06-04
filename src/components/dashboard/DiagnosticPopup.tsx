/**
 * DiagnosticPopup.tsx
 * 
 * Modal shown to new users prompting them to take the AI calibration diagnostic test.
 * Extracted from Overview.tsx to keep components small and reusable.
 */

import { useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Props {
    onDismiss: () => void;
    onStart: () => void;
}

export const DiagnosticPopup = ({ onDismiss, onStart }: Props) => {
    useScrollLock(true);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onDismiss]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Calibrate Your AI"
            onClick={onDismiss}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-primary/20 p-8 rounded-2xl max-w-md w-full shadow-2xl relative oxygen-card"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-20 bg-primary/20 rounded-full flex items-center justify-center border-4 border-background">
                    <div className="size-14 bg-primary rounded-full flex items-center justify-center">
                        <TrendingUp className="text-white" size={32} />
                    </div>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold text-text-main">Calibrate Your AI</h2>
                    <p className="text-text-muted">
                        To give you personalized recommendations, we need to know your current level.
                        Take a quick 5-min diagnostic test.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="px-4 py-3 rounded-xl border border-border text-text-muted hover:bg-white/5 font-medium transition-all"
                        >
                            Not Now
                        </button>
                        <button
                            type="button"
                            onClick={onStart}
                            className="px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
                        >
                            Start Test
                        </button>
                    </div>
                    <p className="text-[10px] text-text-muted opacity-60">
                        We won't ask again if you skip.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
