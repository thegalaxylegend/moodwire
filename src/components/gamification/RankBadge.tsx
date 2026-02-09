
import React from 'react';
import { motion } from 'framer-motion';
import { getRankByValue } from '../../services/gamificationService';

interface RankBadgeProps {
    xp: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (e?: React.MouseEvent) => void;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ xp, showLabel = true, size = 'md', onClick }) => {
    const rank = getRankByValue(xp);

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-xl',
        lg: 'w-16 h-16 text-3xl'
    };

    return (
        <div
            className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}`}
            onClick={onClick}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={onClick ? { scale: 1.1, rotate: 5 } : undefined}
                className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-lg`}
                style={{
                    background: `linear-gradient(135deg, ${rank.color}33, ${rank.color}66)`,
                    border: `1px solid ${rank.color}88`
                }}
            >
                {/* Glow Effect */}
                <div
                    className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity blur-xl"
                    style={{ backgroundColor: rank.color }}
                />

                <span className="relative z-10 drop-shadow-md">{rank.icon}</span>
            </motion.div>

            {showLabel && (
                <motion.span
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/60"
                >
                    {rank.name}
                </motion.span>
            )}
        </div>
    );
};
