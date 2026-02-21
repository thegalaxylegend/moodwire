
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Star, Zap, Coffee, ArrowRight, RefreshCw } from 'lucide-react';
import type { DailyMission } from '../../services/missionService';

const ConfettiPiece = ({ index }: { index: number }) => {
    const randomX = Math.random() * 200 - 100;
    const randomY = Math.random() * -200 - 50;
    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

    return (
        <motion.div
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
                opacity: 0,
                scale: Math.random() + 0.5,
                x: randomX,
                y: randomY,
                rotate: 360
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: colors[index % colors.length], zIndex: 50 }}
        />
    );
};

interface DailyMissionCardProps {
    missions: DailyMission[];
    onComplete: (missionId: string) => void;
    onRefresh: () => void;
    onAction: (mission: DailyMission) => void;
}

export const DailyMissionCard: React.FC<DailyMissionCardProps> = ({ missions, onComplete, onRefresh, onAction }) => {
    const [celebratingId, setCelebratingId] = React.useState<string | null>(null);
    const completedCount = missions.filter(m => m.completed).length;
    const progress = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;

    const handleComplete = (id: string) => {
        setCelebratingId(id);
        onComplete(id);
        setTimeout(() => setCelebratingId(null), 1000);
    };

    return (
        <div className="glass-card premium-border active-glow oxygen-card overflow-hidden bg-gradient-to-br from-surface to-surface/80">
            {/* Header */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20 text-primary">
                        <Zap size={20} className="fill-primary/20" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">Daily Missions</h3>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Study OS v2.0</p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors group"
                    title="Refresh Missions"
                >
                    <RefreshCw size={16} className="group-active:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="px-5 py-3 bg-black/20">
                <div className="flex justify-between text-[10px] font-bold text-text-muted mb-2 uppercase">
                    <span>Campaign Progress</span>
                    <span>{completedCount} / {missions.length} Complete</span>
                </div>
                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
                    />
                </div>
            </div>

            {/* Mission List */}
            <div className="divide-y divide-border/30">
                {missions.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                        <Star className="mx-auto text-text-muted/30" size={32} />
                        <p className="text-sm text-text-muted">No missions available. Click refresh to generate yours!</p>
                        <button
                            onClick={onRefresh}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Generate Missions
                        </button>
                    </div>
                ) : (
                    missions.map((mission, idx) => (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-4 flex items-start gap-4 transition-colors relative ${mission.completed ? 'bg-green-500/5' : 'hover:bg-white/5'}`}
                        >
                            <div className="relative mt-1">
                                {celebratingId === mission.id && Array.from({ length: 12 }).map((_, i) => (
                                    <ConfettiPiece key={i} index={i} />
                                ))}
                                <button
                                    onClick={() => !mission.completed && handleComplete(mission.id)}
                                    className={`shrink-0 ${mission.completed ? 'text-green-500' : 'text-text-muted hover:text-primary'} transition-all active:scale-90`}
                                >
                                    {mission.completed ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <CheckCircle2 size={20} />
                                        </motion.div>
                                    ) : <Circle size={20} />}
                                </button>
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-sm font-bold ${mission.completed ? 'text-text-muted line-through' : 'text-text-main'}`}>
                                        {mission.title}
                                    </h4>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${mission.type === 'practice' ? 'bg-blue-500/10 text-blue-400' :
                                        mission.type === 'discovery' ? 'bg-purple-500/10 text-purple-400' :
                                            mission.type === 'rest' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-slate-500/10 text-slate-400'
                                        }`}>
                                        {mission.type}
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    {mission.description}
                                </p>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500">
                                        <Star size={10} className="fill-yellow-500" />
                                        +{mission.rewardXp} XP
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted">
                                        {mission.difficulty}
                                    </div>
                                </div>
                            </div>

                            {!mission.completed && mission.type !== 'rest' && (
                                <button
                                    onClick={() => onAction(mission)}
                                    className="p-2 rounded-lg bg-surface border border-border hover:border-primary/50 transition-all group"
                                >
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}

                            {mission.type === 'rest' && (
                                <Coffee size={18} className="text-orange-400/50 mt-1" />
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            {missions.length > 0 && progress === 100 && (
                <div className="p-4 bg-green-500/10 text-center">
                    <p className="text-xs font-bold text-green-500 flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> Day 1 Campaign Mastered!
                    </p>
                </div>
            )}
        </div>
    );
};
