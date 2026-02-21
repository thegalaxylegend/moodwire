
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Zap, ArrowRight, Target } from 'lucide-react';
import type { DependencyInsight } from '../../services/conceptGraphService';

interface RootCauseInsightProps {
    insights: DependencyInsight[];
    onFixAction: (topic: string) => void;
}

export const RootCauseInsight: React.FC<RootCauseInsightProps> = ({ insights, onFixAction }) => {
    if (!insights || insights.length === 0) return null;

    // Show the top 2 instabilities to keep it clean
    const topInsights = insights.slice(0, 2);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <Zap className="text-yellow-400 fill-yellow-400/20" size={18} />
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                    AI Diagnostic: Root Cause Instabilities
                </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topInsights.map((insight, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative group overflow-hidden glass-card p-5 border-l-4 border-l-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent"
                    >
                        {/* Status Chip */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 text-[10px] font-bold text-yellow-500 border border-yellow-500/20 uppercase">
                                <AlertCircle size={10} />
                                High Instability
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">Impact Sc: {(insight.instability_score * 10).toFixed(0)}</span>
                        </div>

                        {/* Title */}
                        <h5 className="text-lg font-bold text-text-main group-hover:text-yellow-400 transition-colors">
                            {insight.topic}
                        </h5>

                        <p className="text-xs text-text-muted mt-2 leading-relaxed">
                            This fundamental gap is causing instability in <span className="text-text-main font-medium">{insight.dependent_weak_topics.join(', ')}</span>.
                        </p>

                        {/* Progress Tracker (Visual) */}
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(insight.instability_score * 40, 100)}%` }}
                                    className="h-full bg-yellow-500"
                                />
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={() => onFixAction(insight.topic)}
                            className="mt-5 w-full py-2.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white border border-yellow-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group/btn"
                        >
                            Fix Foundation First
                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>

                        {/* Background Decor */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                            <Target size={120} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
