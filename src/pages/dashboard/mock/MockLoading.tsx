import React from 'react';
import { createPortal } from 'react-dom';
import { Brain, ArrowLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MockLoadingProps {
    progress: number;
    message: string;
    step: 'loading' | 'config';
    onCancel: () => void;
}

// Static deterministic values for floating math symbols defined outside the component to keep render pure
const PARTICLE_PRESETS = Array.from({ length: 20 }).map((_, i) => {
    const symbols = ['∑', '∫', 'π', 'Δ', 'θ', 'λ', 'μ', '∞', 'ƒ', 'α', 'β', 'Ω', 'x²', '±', '√'];
    const symbolIdx = (i * 7) % symbols.length;
    const leftVal = (i * 13) % 100;
    const durationVal = 6 + ((i * 17) % 6);
    const delayVal = (i * 3) % 5;
    const sizeVal = i % 2 === 0 ? 'text-2xl' : 'text-4xl';
    return {
        id: i,
        symbol: symbols[symbolIdx],
        left: `${leftVal}vw`,
        duration: durationVal,
        delay: delayVal,
        size: sizeVal
    };
});

export const MockLoading: React.FC<MockLoadingProps> = ({ progress, message, step, onCancel }) => {
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const particles = PARTICLE_PRESETS;

    const content = (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden">
            {/* Floating Math Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ y: '100vh', left: p.left, opacity: 0, scale: 0.5, position: 'absolute' }}
                        animate={{ y: '-20vh', opacity: [0, 0.4, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180] }}
                        transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
                        className={`text-primary/10 font-bold ${p.size}`}
                    >
                        {p.symbol}
                    </motion.div>
                ))}
            </div>

            {/* Close / Back Button — top-left */}
            <button type="button"
                onClick={onCancel}
                className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all font-medium group z-10"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back</span>
            </button>

            {/* Close X — top-right */}
            <button type="button"
                onClick={onCancel}
                className="absolute top-5 right-5 p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-red-400 hover:border-red-400/30 transition-all z-10"
                aria-label="Cancel generation"
            >
                <X size={20} />
            </button>

            <div className="flex flex-col items-center space-y-8 max-w-md px-6">
                {/* Circular Progress Ring */}
                <div className="relative size-28">
                    {/* Outer glow pulse */}
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.08, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                    />

                    <svg className="size-28" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                        {/* Progress arc */}
                        <motion.circle
                            cx="50" cy="50" r={radius}
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        />
                        {/* Orbiting dot wrapper */}
                        <motion.g
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            style={{ transformOrigin: "50px 50px" }}
                        >
                            <circle cx="50" cy="6" r="4" fill="var(--color-primary, #a855f7)" />
                            <circle cx="50" cy="6" r="10" fill="var(--color-primary, #a855f7)" className="opacity-20" />
                            <circle cx="50" cy="6" r="16" fill="var(--color-primary, #a855f7)" className="opacity-10" />
                        </motion.g>
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="var(--color-primary, #a855f7)" />
                                <stop offset="100%" stopColor="var(--color-secondary, #6366f1)" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary tabular-nums">{progress}%</span>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2 text-center w-full">
                    <h2 className="text-xl font-bold text-text-main">Building Your Exam</h2>
                    <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="text-text-muted text-sm h-5"
                    >
                        {message}
                    </motion.p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface border border-border h-3 rounded-full overflow-hidden shadow-inner relative">
                    <motion.div
                        initial={{ width: '5%' }}
                        animate={{ width: `${Math.max(progress, 5)}%` }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-primary to-secondary relative overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                    </motion.div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Brain size={14} /> Only sourcing last 10 years PYQ-style
                </div>

                {step === 'config' && (
                    <p className="text-[10px] text-text-muted/30 text-center">Verifying Credentials & Pattern Isolation…</p>
                )}

                {/* Cancel Button */}
                <button type="button"
                    onClick={onCancel}
                    className="w-full max-w-xs flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all font-medium group mt-4"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Cancel & Return
                </button>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
