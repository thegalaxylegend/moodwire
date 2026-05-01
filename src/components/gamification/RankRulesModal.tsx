import React, { useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, BookOpen, Flame, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { XP_RANKS } from '../../services/gamificationService';

interface RankRulesModalProps {
    onClose: () => void;
}

export const RankRulesModal: React.FC<RankRulesModalProps> = ({ onClose }) => {
    const navigate = useNavigate();
    useScrollLock(true);
    // Group ranks by their base name (e.g. Bronze, Silver) to show divisions clearly
    const uniqueTiers = Array.from(new Set(XP_RANKS.map(r => r.name.split(' ')[0])));

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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="rank-rules-title">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Trophy className="text-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-main">Rank System Rules</h2>
                                <p className="text-xs text-text-muted">How to climb the leaderboard</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Section 1: XP Sources */}
                        <section>
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Target size={14} /> How to Earn XP
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        <BookOpen size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main">+20 XP</p>
                                        <p className="text-[10px] text-text-muted">Correct Answer</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Flame size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main">+5 XP</p>
                                        <p className="text-[10px] text-text-muted">Wrong Answer</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <PlayIcon size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main">+10 XP</p>
                                        <p className="text-[10px] text-text-muted">Per Minute Video</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-surface border border-border rounded-xl flex flex-col items-center text-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <StarIcon size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-main">+100 XP</p>
                                        <p className="text-[10px] text-text-muted">Daily Login</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Rank Hierarchy */}
                        <section>
                            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Trophy size={14} /> Rank Tiers
                            </h3>
                            <div className="space-y-2">
                                {uniqueTiers.map((tierName) => {
                                    // Get the base rank data for this tier (usually the lowest division or main tier)
                                    const baseRank = XP_RANKS.find(r => r.name.startsWith(tierName));
                                    if (!baseRank) return null;

                                    return (
                                        <div key={tierName} className="flex items-center gap-4 p-3 bg-surface/50 border border-border rounded-xl">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
                                                style={{ backgroundColor: baseRank.color + '22', color: baseRank.color }}
                                            >
                                                {baseRank.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-text-main text-lg">{tierName}</h4>
                                                <p className="text-xs text-text-muted">
                                                    {tierName === 'Grandmaster'
                                                        ? 'The highest honor. Top 1% of students.'
                                                        : 'Divisions: V → IV → III → II → I'
                                                    }
                                                </p>
                                            </div>
                                            {tierName !== 'Grandmaster' && (
                                                <div className="flex gap-1">
                                                    {[5, 4, 3, 2, 1].map(div => (
                                                        <div key={div} className="w-6 h-6 rounded bg-black/20 flex items-center justify-center text-[10px] font-mono text-text-muted">
                                                            {div}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/dashboard/ranks');
                                }}
                                className="w-full mt-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold flex items-center justify-center gap-2 transition-all group"
                            >
                                View Full Rank Details <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </section>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Simple Icons for local use
const PlayIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const StarIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
