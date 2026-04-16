import React from 'react';
import { School, GraduationCap, CheckCircle, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CollegeFitResult } from '../../services/predictionService';

interface CollegePredictorCardProps {
    fitment: CollegeFitResult[];
    predictedRank: number;
}

export const CollegePredictorCard: React.FC<CollegePredictorCardProps> = ({ fitment, predictedRank }) => {
    if (!fitment || fitment.length === 0) return null;

    const getStatusStyles = (status: CollegeFitResult['status']) => {
        switch (status) {
            case 'Safe': return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', icon: CheckCircle };
            case 'Probable': return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Target };
            case 'Dream': return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: GraduationCap };
            default: return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: AlertTriangle };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <School className="text-accent" size={20} />
                    <h4 className="text-sm font-bold text-text-main uppercase tracking-widest">Target Institutions</h4>
                </div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-tighter bg-white/5 px-2 py-1 rounded border border-white/10">
                    AIR {predictedRank.toLocaleString()}
                </div>
            </div>

            <div className="space-y-3">
                {fitment.map((item, idx) => {
                    const styles = getStatusStyles(item.status);
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 glass-card premium-border relative overflow-hidden group hover:bg-white/5 transition-all"
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="space-y-1">
                                    <h5 className="font-bold text-text-main group-hover:text-primary transition-colors">{item.institution}</h5>
                                    <p className="text-xs text-text-muted">{item.branch}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-md border ${styles.border} ${styles.bg} ${styles.color} text-[10px] font-black uppercase flex items-center gap-1`}>
                                    <styles.icon size={10} />
                                    {item.status}
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 relative z-10">
                                <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                                    <span>Probability</span>
                                    <span>{Math.round(item.probability * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.probability * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                        className={`h-full ${styles.color.replace('text-', 'bg-')}`}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] mt-1">
                                    <span className="text-text-muted">Target: AIR {item.requiredRank.toLocaleString()}</span>
                                    <span className={item.requiredRank >= predictedRank ? 'text-green-400 font-bold' : 'text-yellow-400'}>
                                        {item.requiredRank >= predictedRank 
                                            ? `+${(item.requiredRank - predictedRank).toLocaleString()} Rank Cushion` 
                                            : `${(predictedRank - item.requiredRank).toLocaleString()} Rank Gap`
                                        }
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="p-3 bg-accent/5 rounded-xl border border-accent/20 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Target className="text-accent" size={16} />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">
                    Data based on <span className="text-white font-bold">2024 JOSAA/MCC</span> closing ranks. Predicted probability factors in current mock consistency and growth trends.
                </p>
            </div>
        </div>
    );
};
