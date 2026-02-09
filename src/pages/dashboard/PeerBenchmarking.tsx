import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Loader2, Calendar } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { getLeaderboard, getUserStats, getCurrentSeasonKey, calculatePredictedRank } from '../../services/leaderboardService';
import type { LeaderboardEntry } from '../../services/leaderboardService';

import { SEO } from '../../components/SEO';
import { AuthGate } from '../../components/auth/AuthGate';

export const PeerBenchmarking = () => {
    const { user } = useUserStore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState("");
    // Default to user's targeted exam or All if undefined
    const [examFilter, setExamFilter] = useState<string>('All');
    const [metric, setMetric] = useState<'totalScore' | 'xp'>('totalScore');

    // Set default filter once user is loaded
    useEffect(() => {
        if (user?.targetExam && examFilter === 'All') {
            setExamFilter(user.targetExam);
        }
    }, [user, examFilter]);

    useEffect(() => {
        const fetch = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // 1. Set season display
                const key = getCurrentSeasonKey(); // "2026-02"
                const [year, month] = key.split('-');
                const dateObj = new Date(parseInt(year), parseInt(month) - 1);
                setSeason(dateObj.toLocaleString('default', { month: 'long', year: 'numeric' }));

                // 2. Fetch data
                const [topList, myStats] = await Promise.all([
                    getLeaderboard(50, examFilter === 'All' ? undefined : examFilter, metric),
                    user ? getUserStats(user.id) : null
                ]);

                setLeaderboard(topList);
                setUserRank(myStats);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [user, examFilter, metric]);

    // Derived rank for current user from full list if not in stats (or sync rank)
    const myRankIndex = (Array.isArray(leaderboard) ? leaderboard : []).findIndex(u => u.userId === user?.id);
    const displayRank = myRankIndex !== -1 ? myRankIndex + 1 : (userRank?.rank || '-');

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <Trophy size={40} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Join the Global Leaderboard</h2>
                        <p className="text-text-muted max-w-md mt-2">
                            Log in to see where you stand among thousands of aspirants and compete for the top spot.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 pb-20">
                <SEO
                    title={`Global Leaderboard (${season}) | Exam Compass`}
                    description="Compete with top students globally in JEE, NEET, and UPSC. Track your real-time rankings and analyze peer performance benchmarks."
                />
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
                        <Calendar size={14} /> Season: {season}
                    </div>
                    <h1 className="text-4xl font-heading font-bold text-text-main">Global Rankings</h1>


                    {/* Exam Category Badge */}
                    <div className="flex justify-center mt-2">
                        <span className="px-4 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-wider">
                            Category: {examFilter === 'All' ? 'Global' : examFilter}
                        </span>
                    </div>

                    <p className="text-text-muted max-w-2xl mx-auto mt-4">
                        Compete with peers purely on monthly performance. Scores reset every month to give everyone a fair chance.
                    </p>

                    {/* Metric Selector */}
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            onClick={() => setMetric('totalScore')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${metric === 'totalScore'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : 'bg-surface border border-border text-text-muted hover:border-primary/50'
                                }`}
                        >
                            Monthly Points
                        </button>
                        <button
                            onClick={() => setMetric('xp')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${metric === 'xp'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : 'bg-surface border border-border text-text-muted hover:border-primary/50'
                                }`}
                        >
                            Career XP
                        </button>
                    </div>

                    {/* DEV ONLY RESET - ADMIN ONLY */}
                    {
                        user?.role === 'admin' && (
                            <button
                                onClick={async () => {
                                    if (confirm('Clear ALL rankings for this season?')) {
                                        setLoading(true);
                                        await import('../../services/leaderboardService').then(m => m.resetLeaderboard());
                                        window.location.reload();
                                    }
                                }}
                                className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Loader2 size={14} /> Reset Season (Admin)
                            </button>
                        )
                    }
                </header >

                {loading ? (
                    <div className="flex h-[40vh] items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={48} />
                    </div>
                ) : (
                    <div className="animate-fade-in-up space-y-8">
                        {/* Podium (Top 3) */}
                        {
                            leaderboard.length >= 3 && (
                                <div className="flex justify-center items-end gap-4 md:gap-8 pb-8 relative z-10">
                                    {/* 2nd Place */}
                                    <PodiumUser entry={leaderboard[1]} place={2} delay={0.2} metric={metric} />
                                    {/* 1st Place */}
                                    <PodiumUser entry={leaderboard[0]} place={1} delay={0} metric={metric} />
                                    {/* 3rd Place */}
                                    <PodiumUser entry={leaderboard[2]} place={3} delay={0.4} metric={metric} />

                                    {/* Background Glow */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full -z-10" />
                                </div>
                            )
                        }

                        {/* National Rank Prediction & User Stats Card */}
                        {user && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Standing (Long Box) */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="lg:col-span-2 glass-card oxygen-card p-6 flex flex-wrap items-center justify-between gap-6 border-l-4 border-l-primary"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-surface border-2 border-primary flex items-center justify-center overflow-hidden shadow-xl">
                                                {(user as any).avatar ? (
                                                    <img src={(user as any).avatar} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-bold text-primary">{user.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs shadow-lg border border-background">
                                                #{displayRank}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-text-main">Global Standing</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-tighter">
                                                    {userRank?.rankName || 'Competitor'}
                                                </span>
                                                <p className="text-text-muted text-[10px] uppercase font-medium">{metric === 'totalScore' ? season : 'All Time'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{metric === 'totalScore' ? 'Monthly Points' : 'Career XP'}</p>
                                            <p className="text-2xl font-bold text-primary">{(metric === 'totalScore' ? userRank?.totalScore : userRank?.xp || 0)?.toLocaleString()}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Tests</p>
                                            <p className="text-2xl font-bold text-text-main">{userRank?.testsTaken || 0}</p>
                                        </div>
                                        <div className="text-center hidden sm:block">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Daily Streak</p>
                                            <p className="text-2xl font-bold text-secondary">3 🔥</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* National Predictor (Small Box) */}
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="glass-card oxygen-card p-6 bg-gradient-to-br from-primary/20 to-surface border-primary/30 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16 rounded-full" />
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">National Prediction</h3>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-text-muted font-bold uppercase">Estimated All India Rank</p>
                                        <p className="text-4xl font-heading font-black text-text-main">
                                            #{calculatePredictedRank(
                                                userRank?.totalScore ? Math.min(99, (userRank.totalScore / 5000) * 100) : 10,
                                                user?.targetExam || 'JEE Mains'
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                            <span className="text-text-muted">Target Potential</span>
                                            <span className="text-secondary">Top 100</span>
                                        </div>
                                        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                                            <div className="h-full bg-secondary w-[45%]" />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )
                        }

                        {/* Full List */}
                        <div className="glass-card overflow-hidden">
                            {leaderboard.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <Trophy size={48} className="text-text-muted opacity-20 mb-4" />
                                    <h3 className="text-xl font-bold text-text-muted">Season Starts Now!</h3>
                                    <p className="text-text-muted mt-2">
                                        Scores reset every month to give everyone a fair chance.
                                        Be the first to take a test and claim Rank #1 for {season}.
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-black/20 text-text-muted text-xs uppercase tracking-wider">
                                            <th className="p-4 w-20 text-center">Rank</th>
                                            <th className="p-4">Student</th>
                                            <th className="p-4 text-right">Tests</th>
                                            {metric === 'totalScore' ? (
                                                <th className="p-4 text-right">Season Points</th>
                                            ) : (
                                                <th className="p-4 text-right">Career XP</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {Array.isArray(leaderboard) && leaderboard.map((entry, idx) => (
                                            <tr
                                                key={entry.userId}
                                                className={`border-b border-border/50 hover:bg-white/5 transition-colors ${entry.userId === user?.id ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="p-4 text-center font-bold text-text-muted">
                                                    {idx < 3 ? (
                                                        idx === 0 ? '👑' : idx === 1 ? '🥇' : '🥈'
                                                    ) : (
                                                        `#${idx + 1}`
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden shadow-inner">
                                                            {entry.user.avatar ? (
                                                                <img src={entry.user.avatar} alt="u" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-bold text-text-muted">{entry.user.displayName?.[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className={`font-bold block ${entry.userId === user?.id ? 'text-primary' : 'text-text-main'}`}>
                                                                {entry.user.displayName || 'Anonymous'}
                                                                {entry.userId === user?.id && " (You)"}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
                                                                {entry.rankName || 'Warrior'} • {entry.examType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-text-muted font-mono">{entry.testsTaken}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-text-main">
                                                            {(metric === 'totalScore' ? entry.totalScore || 0 : entry.xp || 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] text-primary/70 font-bold">{metric === 'totalScore' ? 'PTS' : 'XP'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div >
        </AuthGate>
    );
};

// Podium Component
const PodiumUser = ({ entry, place, delay, metric }: { entry: LeaderboardEntry, place: number, delay: number, metric: 'totalScore' | 'xp' }) => {
    const isFirst = place === 1;
    const height = isFirst ? 'h-48' : place === 2 ? 'h-32' : 'h-24';
    const color = isFirst ? 'bg-yellow-500' : place === 2 ? 'bg-gray-300' : 'bg-orange-600';
    const score = metric === 'totalScore' ? entry.totalScore : entry.xp;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ delay, duration: 0.5, type: 'spring' }}
            className="flex flex-col items-center gap-2"
        >
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-surface shadow-lg overflow-hidden relative z-10">
                    {(entry.user as any).avatar ? (
                        <img src={(entry.user as any).avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-surface flex items-center justify-center font-bold text-xl">
                            {entry.user.displayName?.[0]}
                        </div>
                    )}
                </div>
                {isFirst && <Crown size={24} className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-lg animate-bounce" />}
            </div>

            <div className={`w-24 md:w-32 ${height} ${color}/20 border-t-4 border-${color} rounded-t-lg relative flex flex-col justify-end items-center pb-4 backdrop-blur-md`}>
                <span className={`text-4xl font-bold ${isFirst ? 'text-yellow-400' : place === 2 ? 'text-gray-300' : 'text-orange-400'}`}>
                    {place}
                </span>
                <span className="text-xs font-bold text-text-main mt-1 opacity-80">{(score || 0).toLocaleString()} {metric === 'totalScore' ? 'PTS' : 'XP'}</span>
            </div>

            <span className="text-sm font-bold text-text-main max-w-[100px] truncate text-center">
                {entry.user.displayName}
            </span>
        </motion.div>
    );
};
