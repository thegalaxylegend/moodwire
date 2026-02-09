
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Star, Target, BookOpen, Flame, Play, ChevronRight, Zap, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { XP_RANKS, POINT_RANKS, getCurrentSeason, getCurrentPointCycle } from '../../services/gamificationService';
import { useState } from 'react';

export const RankInfo = () => {
    const navigate = useNavigate();
    const [rankBasis, setRankBasis] = useState<'xp' | 'pts'>('xp');

    const activeRanks = rankBasis === 'xp' ? XP_RANKS : POINT_RANKS;

    const currentSeason = getCurrentSeason();
    const currentPointCycle = getCurrentPointCycle();
    const activeCycleLabel = rankBasis === 'xp'
        ? `Season ${currentSeason.split('-')[1]}`
        : `Point Cycle ${currentPointCycle.split('-')[1]}`;

    // Group ranks by tier
    const tiers = [
        { name: 'Bronze', color: '#cd7f32', icon: '🥉' },
        { name: 'Silver', color: '#c0c0c0', icon: '🥈' },
        { name: 'Gold', color: '#ffd700', icon: '🥇' },
        { name: 'Platinum', color: '#00bcd4', icon: '💠' },
        { name: 'Diamond', color: '#b9f2ff', icon: '💎' },
        { name: 'Heroic', color: '#ef4444', icon: '🩸' },
        { name: 'Master', color: '#a855f7', icon: '🟣' },
        { name: 'Elite Master', color: '#3b82f6', icon: '⚡' },
        { name: 'Grandmaster', color: '#ff00ff', icon: '👑' }
    ];

    const getDivisionsForTier = (tierName: string) => {
        return activeRanks.filter(r => r.name.startsWith(tierName));
    };

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-10 space-y-10 pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white border border-border/50 shadow-sm"
                    >
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold text-text-main font-heading">Rank Hierarchy</h1>
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                                {activeCycleLabel}
                            </span>
                        </div>
                        <p className="text-text-muted text-lg mt-1">Detailed breakdown of requirements and climbing rules</p>
                    </div>
                </div>

                {/* Rank Basis Toggle */}
                <div className="flex bg-surface/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md self-start md:self-center">
                    <button
                        onClick={() => setRankBasis('xp')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${rankBasis === 'xp'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-text-muted hover:text-text-main hover:bg-white/5'
                            }`}
                    >
                        <Zap size={18} /> Seasonal XP
                    </button>
                    <button
                        onClick={() => setRankBasis('pts')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${rankBasis === 'pts'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-text-muted hover:text-text-main hover:bg-white/5'
                            }`}
                    >
                        <Coins size={18} /> Monthly Points
                    </button>
                </div>
            </header>

            <div className="flex flex-col gap-12">

                {/* Top Section: XP Rules */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Target className="text-primary" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-text-main">How to Climb</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-8 flex flex-col gap-5 border border-border/40 rounded-3xl hover:border-green-500/20 transition-all bg-transparent group">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center text-green-500 group-hover:bg-green-500/10 transition-colors">
                                <BookOpen size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-2xl text-text-main">
                                    {rankBasis === 'xp' ? '0 XP' : '+40-60 PTS'}
                                </h4>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    {rankBasis === 'xp'
                                        ? 'Test mastery fuels your Monthly Points rank. XP is reserved for learning.'
                                        : 'Master MCQs to dominate the leaderboard. Correct answers yield high points.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col gap-5 border border-border/40 rounded-3xl hover:border-red-500/20 transition-all bg-transparent group">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/5 flex items-center justify-center text-red-500 group-hover:bg-red-500/10 transition-colors">
                                <Flame size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-2xl text-text-main">
                                    {rankBasis === 'xp' ? '0 XP' : '+10 PTS'}
                                </h4>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    {rankBasis === 'xp'
                                        ? 'Incorrect answers don\'t grant XP. Focus on video study for growth.'
                                        : 'Every attempt matters. Incorrect answers still contribute to your monthly total.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col gap-5 border border-border/40 rounded-3xl hover:border-blue-500/20 transition-all bg-transparent group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                                <Play size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-2xl text-text-main">
                                    {rankBasis === 'xp' ? '+10 XP / Min' : '0 PTS'}
                                </h4>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    {rankBasis === 'xp'
                                        ? 'Passive learning fuels your Seasonal Rank. Every hour of study grants 600 XP.'
                                        : 'Video watching marks progress but does not contribute to competitive points.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col gap-5 border border-border/40 rounded-3xl hover:border-yellow-500/20 transition-all bg-transparent group">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/5 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500/10 transition-colors">
                                <Star size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-2xl text-text-main">
                                    +100-200+ XP/PTS
                                </h4>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    Loyalty rewards multiplier. Your login bonus increases by 10 for every day of your study streak!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom Section: Full Table */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-yellow-500/10 rounded-xl">
                            <Trophy className="text-yellow-500" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-text-main">Rank Tiers & Divisions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-heading">
                        {tiers.filter(t => t.name !== 'Grandmaster').map((tier, idx) => {
                            const divisions = getDivisionsForTier(tier.name);
                            if (divisions.length === 0) return null;

                            return (
                                <motion.div
                                    key={tier.name}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-transparent border border-border/40 rounded-[2rem] overflow-hidden shadow-sm hover:border-white/20 transition-colors"
                                >
                                    {/* Tier Header (Standard) */}
                                    <div
                                        className="p-6 flex items-center justify-between border-b border-border/20"
                                        style={{ background: `linear-gradient(135deg, ${tier.color}08, transparent)` }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-surface/30 border border-white/5 shadow-inner flex items-center justify-center text-3xl">
                                                {tier.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold" style={{ color: tier.color }}>{tier.name}</h3>
                                                <p className="text-xs text-text-muted font-medium uppercase tracking-widest">
                                                    Rank Step System
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divisions Table */}
                                    <div className="p-2">
                                        <table className="w-full text-left">
                                            <thead className="text-[10px] uppercase tracking-[0.2em] text-text-muted border-b border-border/10">
                                                <tr>
                                                    <th className="px-6 py-4">Level</th>
                                                    <th className="px-6 py-4">{rankBasis === 'xp' ? 'XP' : 'PTS'} Requirement</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/5">
                                                {divisions.map((div, dIdx) => {
                                                    const nextDiv = activeRanks[activeRanks.indexOf(div) + 1];
                                                    const nextXp = nextDiv ? nextDiv.minXp : '∞';

                                                    return (
                                                        <tr key={div.name} className="group hover:bg-white/[0.01] transition-colors">
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center text-xs font-mono font-bold text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                                        {5 - dIdx}
                                                                    </div>
                                                                    <span className="font-bold text-text-main group-hover:text-white transition-colors">Division {5 - dIdx}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-baseline gap-2 font-mono">
                                                                    <span className="text-lg font-bold text-text-main">{div.minXp.toLocaleString()}</span>
                                                                    <span className="text-xs text-text-muted">→</span>
                                                                    <span className="text-sm font-medium text-text-muted">{typeof nextXp === 'number' ? nextXp.toLocaleString() : nextXp}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Grandmaster - Full Width Standalone */}
                        {(() => {
                            const gmTier = tiers.find(t => t.name === 'Grandmaster');
                            const grandmaster = activeRanks.find(r => r.name === 'Grandmaster');
                            if (!gmTier || !grandmaster) return null;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="col-span-full bg-transparent border-2 border-primary/30 rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 hover:border-primary/50 transition-all group"
                                >
                                    <div
                                        className="p-10 flex flex-col md:flex-row items-center justify-between gap-8"
                                        style={{ background: `linear-gradient(135deg, ${gmTier.color}15, transparent)` }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-3xl bg-surface/50 border border-white/10 shadow-2xl flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                                                {gmTier.icon}
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ff00ff] to-primary">
                                                    {gmTier.name}
                                                </h3>
                                                <p className="text-sm text-text-muted font-medium uppercase tracking-[0.3em]">
                                                    Peak of Performance • The Legend Status
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end gap-2 p-6 bg-black/20 rounded-3xl border border-white/5">
                                            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">{rankBasis === 'xp' ? 'XP' : 'PTS'} Requirement</span>
                                            <div className="flex items-center gap-3">
                                                {rankBasis === 'xp' ? (
                                                    <Star className="text-yellow-500 fill-yellow-500" size={24} />
                                                ) : (
                                                    <Coins className="text-primary" size={24} />
                                                )}
                                                <span className="text-4xl font-mono font-bold text-text-main">
                                                    {grandmaster.minXp.toLocaleString()}+
                                                </span>
                                            </div>
                                            <span className="text-xs text-primary font-bold uppercase tracking-tighter">
                                                {rankBasis === 'xp' ? 'Unlimited Growth' : 'Reserved for Top 10,000 Students'}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                </section>

                <div className="p-10 text-center space-y-4 max-w-4xl mx-auto w-full border border-border/20 rounded-[3rem]">
                    <Trophy className="mx-auto text-primary" size={48} />
                    <h3 className="text-2xl font-bold text-text-main">Are you ready to climb?</h3>
                    <p className="text-text-muted">Every question you answer correctly brings you closer to Grandmaster status.</p>
                    <button
                        onClick={() => navigate('/dashboard/test-center')}
                        className="mt-6 px-10 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        Start Your Journey <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
