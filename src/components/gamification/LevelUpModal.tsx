
import React, { useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { getRankByValue } from '../../services/gamificationService';
import confetti from 'canvas-confetti';
import { RankBadge } from './RankBadge';

interface LevelUpModalProps {
    newXp: number;
    onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ newXp, onClose }) => {
    const rank = getRankByValue(newXp);
    useScrollLock(true);

    useEffect(() => {
        // Trigger multi-burst confetti
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: [rank.color, '#ffffff'] });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: [rank.color, '#ffd700'] });
        }, 250);

        return () => clearInterval(interval);
    }, [rank.color]);

    // Auto-close after 6 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 6500);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Escape to dismiss
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Rank Promotion">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.5, y: 100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: -50, opacity: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 100, mass: 0.8 }}
                    className="relative w-full max-w-sm bg-gradient-to-b from-white/[0.1] to-white/[0.05] border border-white/20 rounded-[32px] p-8 text-center shadow-2xl overflow-hidden"
                >
                    {/* Background Glow */}
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[80px] opacity-30 pointer-events-none"
                        style={{ backgroundColor: rank.color }}
                    />

                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-6 drop-shadow-2xl flex justify-center"
                    >
                        <RankBadge xp={newXp} showLabel={false} size="lg" />
                    </motion.div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">RANK PROMOTED!</h2>
                    <p className="text-white/60 text-lg mb-6">You are now a <span className="font-bold" style={{ color: rank.color }}>{rank.name}</span></p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-2 border-b border-white/5 pb-1">New Privileges</p>
                        <ul className="text-white/80 text-xs space-y-2 text-left list-disc list-inside">
                            <li>Higher Weightage in Global Rank</li>
                            <li>Exclusive Profile Badge unlocked</li>
                            <li>Priority Access to AI Tutors</li>
                        </ul>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 transition-all active:scale-95 shadow-xl relative z-10"
                    >
                        CONTINUE JOURNEY
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
