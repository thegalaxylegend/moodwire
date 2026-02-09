
import React from 'react';
import { motion } from 'framer-motion';
import { getRankByValue, getNextRank } from '../../services/gamificationService';

interface XPProgressProps {
    xp: number;
}

export const XPProgress: React.FC<XPProgressProps> = ({ xp }) => {
    const currentRank = getRankByValue(xp);
    const nextRank = getNextRank(xp);

    if (!nextRank) {
        return (
            <div className="w-full">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-amber-400 tracking-wider">MAX RANK REACHED</span>
                    <span className="text-xs text-white/40">{xp.toLocaleString()} XP</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full w-full bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
            </div>
        );
    }

    const range = nextRank.minXp - currentRank.minXp;
    const progress = ((xp - currentRank.minXp) / range) * 100;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Next Level:</span>
                    <span className="text-xs font-bold text-white/90">{nextRank.name}</span>
                </div>
                <span className="text-[10px] font-medium text-white/30">
                    {(nextRank.minXp - xp).toLocaleString()} XP to go
                </span>
            </div>

            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 relative"
                >
                    {/* Animated Shine */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2"
                    />
                </motion.div>
            </div>
        </div>
    );
};
