
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
                    <span className="text-xs font-black text-amber-400 tracking-wider">MAX RANK REACHED</span>
                    <span className="text-xs text-white/50 font-mono">{xp.toLocaleString()} XP</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-amber-500/20 relative shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                    <div className="h-full w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 relative shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
            </div>
        );
    }

    const range = nextRank.minXp - currentRank.minXp;
    const progress = ((xp - currentRank.minXp) / range) * 100;

    return (
        <div className="w-full select-none">
            <div className="flex justify-between items-center mb-1.5 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-wider">Next Tier:</span>
                    <span 
                        className="text-xs font-bold transition-all duration-300"
                        style={{
                            color: nextRank.color,
                            textShadow: `0 0 8px ${nextRank.color}20`
                        }}
                    >
                        {nextRank.name}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-text-muted/70 font-mono whitespace-nowrap">
                    {(nextRank.minXp - xp).toLocaleString()} XP to go
                </span>
            </div>

            <div 
                className="h-2.5 w-full bg-white/[0.02] rounded-full border relative"
                style={{
                    borderColor: `${nextRank.color}15`
                }}
            >
                {/* Glowing Track fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full relative group/progress"
                    style={{
                        background: `linear-gradient(to right, ${currentRank.color}, ${nextRank.color})`,
                        boxShadow: `0 0 8px ${nextRank.color}30`
                    }}
                >
                    {/* Animated Shine sweep */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 rounded-full"
                    />

                    {/* Progress head bubble (neon active point) */}
                    {progress > 1 && (
                        <div 
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white flex items-center justify-center shadow-lg"
                            style={{
                                backgroundColor: nextRank.color,
                                boxShadow: `0 0 10px ${nextRank.color}, inset 0 1px 2px rgba(255,255,255,0.4)`
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
