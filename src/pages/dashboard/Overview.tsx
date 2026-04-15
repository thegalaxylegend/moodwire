import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, RefreshCw, Flame, Play, ChevronRight, Target, Sparkles as SparkleIcon, Brain, Swords, ArrowRight } from 'lucide-react';

import { getWeakTopics, getStrongTopics, type TopicStat } from '../../services/topicStrengthService';
import { offlineSyncService } from '../../services/offlineSyncService';
import { DailyChallenge } from '../../components/DailyChallenge';
import { syncHistoricalScoresToLeaderboard, syncSyllabusFromMocks, syncTopicStatsFromMocks } from '../../services/dataSyncService';
import { RankBadge } from '../../components/gamification/RankBadge';
import { XPProgress } from '../../components/gamification/XPProgress';
import { AuthGate } from '../../components/auth/AuthGate';

import { ProficiencyMap } from '../../components/dashboard/ProficiencyMap';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyStudyGoalIcon } from '../../components/dashboard/DailyStudyGoalIcon';
import { RootCauseInsight } from '../../components/dashboard/RootCauseInsight';
import { ConceptGraphService } from '../../services/conceptGraphService';
import type { DependencyInsight } from '../../services/conceptGraphService';
import { DailyMissionCard } from '../../components/dashboard/DailyMissionCard';
import type { DailyMission } from '../../services/missionService';

const DiagnosticPopup = ({ onDismiss, onStart }: { onDismiss: () => void; onStart: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-primary/20 p-8 rounded-2xl max-w-md w-full shadow-2xl relative oxygen-card"
            >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-4 border-background">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                        <TrendingUp className="text-white" size={32} />
                    </div>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <h2 className="text-2xl font-bold text-text-main">Calibrate Your AI</h2>
                    <p className="text-text-muted">
                        To give you personalized recommendations, we need to know your current level. Take a quick 5-min diagnostic test.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                            onClick={onDismiss}
                            className="px-4 py-3 rounded-xl border border-border text-text-muted hover:bg-white/5 font-medium transition-all"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={onStart}
                            className="px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
                        >
                            Start Test
                        </button>
                    </div>
                    <p className="text-[10px] text-text-muted opacity-60">
                        We won't ask again if you skip.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export const Overview = () => {
    const { user, fetchSyllabusProgress, refreshMissions, completeMission, authResolved } = useUserStore();
    const navigate = useNavigate();

    // -- GUEST / INTENT LOGIC --
    const [intent, setIntent] = useState<{ class?: string; exam?: string } | null>(null);
    useEffect(() => {
        const stored = sessionStorage.getItem('exam_compass_intent');
        if (stored) {
            try {
                setIntent(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse intent", e);
            }
        }
    }, []);

    // Create a display user for the UI (so we don't crash on nulls)
    const displayUser = user || {
        id: 'guest',
        name: 'Guest Student',
        userClass: intent?.class || 'Class 12th', // Default to 12th if unknown
        targetExam: intent?.exam || 'JEE Mains', // Default
        targetYear: new Date().getFullYear(),
        xp: 0,
        totalPoints: 0,
        lifetimeXp: 0,
        streak: 0,
        // Mock skills for the preview
        skills: { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() },
        isGuest: true
    };
    // ---------------------------
    const [isSyncing, setIsSyncing] = useState(false);
    const handleSync = async () => {
        if (!user || isSyncing || user.isGuest) return;
        setIsSyncing(true);
        try {
            await Promise.all([
                syncHistoricalScoresToLeaderboard(user.id, {
                    displayName: user.name,
                    avatar: user.avatarUrl
                }),
                syncSyllabusFromMocks(user.id),
                syncTopicStatsFromMocks(user.id, user.userClass, user.targetExam)
            ]);

            // Refresh counts, progress, AND AI Stats
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const qMock = query(collection(db, 'mock_attempts'), where('user_id', '==', user.id));
            const snapshotMock = await getDocs(qMock);
            setAttempts(snapshotMock.size);

            // Re-fetch centralized syllabus progress
            await fetchSyllabusProgress();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const [attempts, setAttempts] = useState(0);
    // Use store value if available, else local state (though we can just direct use store)
    const progress = user?.syllabusProgress || 0;

    const [weakTopicStats, setWeakTopicStats] = useState<TopicStat[]>([]);
    const [strongTopicStats, setStrongTopicStats] = useState<TopicStat[]>([]);

    // Video States
    const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]); // Using any for ActiveRecommendation to avoid deep type imports if lazy loaded

    const [loading, setLoading] = useState(true);
    const [showDiagnosticPopup, setShowDiagnosticPopup] = useState(false);

    useEffect(() => {
        if (user && authResolved) {
            fetchStats();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, authResolved]);

    useEffect(() => {
        if (user && !user.isGuest && (!user.dailyMissions || user.dailyMissions.length === 0)) {
            refreshMissions();
        }
    }, [user, refreshMissions]);

    const handleMissionAction = (mission: DailyMission) => {
        if (mission.type === 'practice' || mission.type === 'review') {
            navigate(`/dashboard/mock?topic=${encodeURIComponent(mission.topic)}`);
        } else if (mission.type === 'discovery') {
            const slug = mission.topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
            navigate(`/dashboard/lectures/${slug}`);
        }
    };

    const fetchStats = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let weakStats: TopicStat[] = [];
            // 0. Skip cloud fetches for Guests
            if (user.isGuest) {
                console.log("[Overview] Guest Mode: Skipping cloud data sync.");
                // Proceed to video fetching...
            } else {
                // 1. Check if user has taken diagnostic test
                try {
                    const { db } = await import('../../lib/firebase');
                    const { collection, query, where, getDocs, limit } = await import('firebase/firestore');

                    // Filter by user_id AND class AND exam for strict isolation
                    const diagQ = query(
                        collection(db, 'diagnostic_results'),
                        where('user_id', '==', user.id),
                        where('class', '==', user.userClass || 'General'),
                        where('exam', '==', user.targetExam || 'General'),
                        limit(1)
                    );
                    const diagSnap = await getDocs(diagQ);
                    let diagnosticTaken = !diagSnap.empty;
                    // NEW: Bypass for old users based on XP
                    if (!diagnosticTaken && user.xp > 0) {
                        console.log("[Overview] Old user verified via XP. Bypassing diagnostic popup.");
                        diagnosticTaken = true;
                    }

                    // Fallback: Check for legacy diagnostic (no class/exam set) meant for this user
                    if (!diagnosticTaken) {
                        const legacyQ = query(
                            collection(db, 'diagnostic_results'),
                            where('user_id', '==', user.id),
                            limit(1)
                        );
                        const legacySnap = await getDocs(legacyQ);
                        if (!legacySnap.empty) {
                            // Found legacy record! Migrate it to current class/exam
                            const legacyDoc = legacySnap.docs[0];
                            const { updateDoc } = await import('firebase/firestore');
                            await updateDoc(legacyDoc.ref, {
                                class: user.userClass || 'General',
                                exam: user.targetExam || 'General'
                            });
                            console.log("[Overview] Legacy diagnostic result migrated to", user.userClass, user.targetExam);
                            diagnosticTaken = true;
                        }
                    }


                    // Check for popup (Only if not taken AND not dismissed)
                    if (!diagnosticTaken) {
                        const dismissed = localStorage.getItem(`diagnostic_dismissed_${user.id}_${user.userClass}`);
                        if (!dismissed) {
                            setShowDiagnosticPopup(true);
                        }
                    }
                } catch (err) {
                    console.warn("Diagnostic fetch failed (permissions?):", err);

                }

                // 2. Fetch weak topics (Independent)
                // weakStats declared in outer scope
                try {
                    weakStats = await getWeakTopics(user.id, 5, user.userClass, user.targetExam);
                    setWeakTopicStats(weakStats);
                    
                    // Offline First: Pre-cache questions based on user's weak topics
                    if (navigator.onLine) {
                        offlineSyncService.preCacheWeakTopics(user.id, user.userClass, user.targetExam);
                    }
                } catch (err) {
                    console.warn("Weak topics fetch failed:", err);
                }

                // 3. Fetch strong topics (Independent)
                try {
                    const strongStats = await getStrongTopics(user.id, 5, user.userClass, user.targetExam);
                    setStrongTopicStats(strongStats);
                } catch (err) {
                    console.warn("Strong topics fetch failed:", err);
                }

                // 4. Video and fallback logic handled in the unified block below
            }

            // [NEW] 4. Fetch Video Recommendations (Runs for EVERYONE)
            let subjectsToFetch: string[] = [];
            if (Array.isArray(weakStats) && weakStats.length > 0) {
                subjectsToFetch = weakStats.map(t => t.topic);
            } else if (user.skills) {
                console.log('[Overview] Using subject skills for videos.');
                const subjects = [
                    { name: 'Physics', score: user.skills.physics || 0.5 },
                    { name: 'Chemistry', score: user.skills.chemistry || 0.5 },
                    { name: 'Math', score: user.skills.math || 0.5 }
                ];
                subjectsToFetch = subjects.sort((a, b) => a.score - b.score).slice(0, 3).map(s => s.name);

                // Set fake stats for UI
                if (subjectsToFetch.length > 0) {
                    const fakeWeakStats: TopicStat[] = subjectsToFetch.map(subject => ({
                        id: `fake-${subject}`,
                        user_id: user.id,
                        topic: subject,
                        topic_id: subject.toLowerCase().replace(/\s+/g, '-'),
                        subject: subject,
                        correct_count: 0,
                        total_attempts: 1,
                        score_percentage: Math.round((subjects.find(s => s.name === subject)?.score || 0.5) * 100),
                        last_attempt: new Date().toISOString(),
                        status: 'weak' as const
                    }));
                    setWeakTopicStats(fakeWeakStats);
                }
            } else {
                console.log('[Overview] Default fallback videos.');
                subjectsToFetch = ['Physics', 'Chemistry', 'Math'];
                const placeholderStats: TopicStat[] = subjectsToFetch.map(subject => ({
                    id: `default-${subject}`,
                    user_id: user.id,
                    topic: subject,
                    topic_id: subject.toLowerCase().replace(/\s+/g, '-'),
                    subject: subject,
                    correct_count: 0,
                    total_attempts: 0,
                    score_percentage: 0,
                    last_attempt: new Date().toISOString(),
                    status: 'weak' as const
                }));
                setWeakTopicStats(placeholderStats);
            }

            if (subjectsToFetch.length > 0) {
                // Video fetching is handled by fetchActiveVideo now
            }

            // 5. Fetch Mock Counts (Independent - Guests still want their local history!)
            try {
                let cloudCount = 0;
                if (!user.isGuest) {
                    const { db } = await import('../../lib/firebase');
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const mockColl = collection(db, 'mock_attempts');
                    const qMock = query(mockColl, where('user_id', '==', user.id));
                    const snapshotMock = await getDocs(qMock);
                    cloudCount = snapshotMock.size;
                }

                const localDataRaw = localStorage.getItem('exam_compass_local_history');
                const localData = localDataRaw ? JSON.parse(localDataRaw) : [];
                const localCount = localData.length;

                setAttempts(cloudCount + localCount);
            } catch (err) {
                console.warn("Mock counts fetch failed:", err);
                // Fallback to local only
                const localDataRaw = localStorage.getItem('exam_compass_local_history');
                const localCount = localDataRaw ? (JSON.parse(localDataRaw) || []).length : 0;
                setAttempts(localCount);
            }

            // 6. Trigger centralized syllabus fetch
            try {
                fetchSyllabusProgress();
            } catch (err) {
                console.warn("Syllabus progress fetch failed:", err);
            }

        } catch (e) {
            console.error("Global error in fetchStats:", e);
        } finally {
            setLoading(false);
        }
    };

    // AI 2.0: Concept Graph Insights
    const [dependencyInsights, setDependencyInsights] = useState<DependencyInsight[]>([]);
    useEffect(() => {
        if (weakTopicStats.length > 0) {
            const insights = ConceptGraphService.findRootCauseInstabilities(
                weakTopicStats.map(s => s.topic)
            );
            setDependencyInsights(insights);
        }
    }, [weakTopicStats]);

    // Optimized Video Fetching - Multi Focus
    const fetchRecommendations = async () => {
        if (!user || !user.id) return;

        try {
            const { getRecommendedVideos } = await import('../../services/recommendationService');
            // Fetch multiple recommendations
            const recommendations = await getRecommendedVideos(user.id, user.userClass, user.targetExam);

            if (recommendations && recommendations.length > 0) {
                setRecommendedVideos(recommendations);
            } else {
                setRecommendedVideos([]);
            }
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [user]);

    // Format numbers

    const daysLeft = displayUser?.targetYear
        ? Math.ceil((new Date(`${displayUser.targetYear}-01-24`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 365;

    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(displayUser?.userClass || '');

    // Hoist Header out of loading state
    const header = (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8">
            <div className="flex items-center gap-3 md:gap-6">
                <div className="shrink-0 scale-90 md:scale-100 origin-left">
                    <RankBadge xp={displayUser?.xp || 0} size="lg" onClick={() => navigate('/dashboard/ranks')} />
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-heading font-bold text-text-main truncate">
                        Welcome back, {displayUser?.name || 'Aspirant'}.
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 text-sm md:text-base">
                        {!isJunior && (
                            <>
                                <p className="text-text-muted truncate max-w-[150px] md:max-w-none">
                                    Targeting <span className="text-primary font-bold">{displayUser?.targetExam || 'Undecided'} {displayUser?.targetYear}</span>
                                </p>
                                <span className="hidden md:inline w-1 h-1 bg-text-muted rounded-full" />
                            </>
                        )}
                        <p className="text-text-muted truncate">
                            Season Points: <span className="text-accent font-bold">{(displayUser?.totalPoints || 0).toLocaleString()}</span>
                        </p>
                        <span className="hidden md:inline w-1 h-1 bg-text-muted rounded-full" />
                        <p className="text-text-muted truncate">
                            Career XP: <span className="text-primary font-bold">{(displayUser?.lifetimeXp || 0).toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="mt-3 md:mt-4 w-full md:w-80">
                        <XPProgress xp={displayUser?.xp || 0} />
                    </div>
                </div>
            </div>

            {/* Desktop Stats Indicators */}
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 px-5 py-3 glass-card premium-border active-glow shadow-xl">
                    <DailyStudyGoalIcon />
                    <div className="w-px h-8 bg-border/50 mx-2"></div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-2 bg-primary/10 rounded-xl"
                    >
                        <Flame size={20} className="fill-primary text-primary" />
                    </motion.div>
                    <div>
                        <p className="text-sm font-black text-text-main leading-none">{displayUser?.streak || 0}-DAY STREAK</p>
                        <div className="flex items-center gap-1 mt-1">
                            <SparkleIcon size={10} className="text-yellow-500 fill-yellow-500" />
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Elite Learner</p>
                        </div>
                    </div>
                </div>
                {user && !user.isGuest && (
                    <button 
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/report/${user.id}`;
                            navigator.clipboard.writeText(shareUrl);
                            alert("Parent Report URL copied to clipboard!");
                        }}
                        className="hidden lg:flex items-center gap-2 px-5 py-3 glass-card premium-border text-purple-400 font-bold hover:bg-white/5 transition-all shadow-xl hover:shadow-purple-500/20 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                        Share Parent Report
                    </button>
                )}
            </div>
        </header>
    );

    return (
        <div className="space-y-8 min-h-screen">
            {header}

            <div className="animate-fade-in-up space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6 relative z-10">
                        <AuthGate
                            mode="modal"
                            fallback={
                                <div className="glass-card oxygen-card p-10 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                        <Brain className="text-primary" size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-text-main">Daily Quick-Fire Locked</h2>
                                        <p className="text-text-muted mt-2">
                                            Log in to test your knowledge, earn XP, and build your studying streak daily.
                                        </p>
                                    </div>
                                </div>
                            }
                        >
                            <DailyChallenge />
                        </AuthGate>

                        {user && !user.isGuest && (
                            <DailyMissionCard
                                missions={user.dailyMissions || []}
                                onComplete={(id) => completeMission(id)}
                                onRefresh={() => refreshMissions()}
                                onAction={handleMissionAction}
                            />
                        )}

                        {/* Arena Card */}
                        <div className="glass-card oxygen-card p-6 border-red-500/20 bg-gradient-to-br from-[#11131c] to-red-500/10 flex flex-col justify-between group overflow-hidden relative" >
                            <div className="absolute right-[-20%] bottom-[-20%] opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Swords size={180} />
                            </div>
                            <div className="relative z-10 w-full mb-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-white tracking-widest uppercase shadow-sm flex items-center gap-2"><Swords size={20} className="text-red-500" /> The Arena</h3>
                                    <span className="bg-red-500/20 text-red-500 border border-red-500/40 px-2 py-1 rounded-md text-[10px] font-black uppercase shadow-inner animate-pulse">Live</span>
                                </div>
                                <p className="text-sm text-text-muted mt-2 w-2/3">Challenge friends or random opponents in real-time 1v1 battles. Prove your mastery.</p>
                            </div>
                            <button onClick={() => navigate('/dashboard/arena')} className="relative z-10 w-max bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-red-500/20">
                                Enter Matchmaking <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <ProficiencyMap />

                        {/* Coverage Card */}
                        <div className="glass-card oxygen-card p-6 space-y-2 min-h-[160px]">
                            <h3 className="text-lg font-semibold text-text-muted">Syllabus Coverage</h3>
                            {loading ? <div className="h-10 w-24 bg-surface animate-pulse rounded-lg" /> : (
                                <>
                                    <p className="text-4xl font-bold text-accent">{progress}%</p>
                                    <div className="w-full bg-surface h-1.5 rounded-full mt-2">
                                        <div className="bg-accent h-full rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-text-muted">{attempts} mocks completed</p>
                                        {!user?.isGuest && (
                                            <button
                                                onClick={handleSync}
                                                disabled={isSyncing}
                                                title="Sync old test data to leaderboard"
                                                className="p-1 px-2 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-all flex items-center gap-1"
                                            >
                                                <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                                                {isSyncing ? 'Syncing...' : 'Sync Data'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Days Left / Class Card */}
                        <div className="glass-card oxygen-card p-6 space-y-2 min-h-[160px] flex flex-col justify-center">
                            {loading ? <div className="h-10 w-32 bg-surface animate-pulse rounded-lg" /> : (
                                isJunior ? (
                                    <>
                                        <h3 className="text-lg font-semibold text-text-muted">School Year</h3>
                                        <p className="text-3xl font-bold text-text-main">{displayUser?.userClass}</p>
                                        <p className="text-xs text-text-muted">Consistently study your subjects!</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold text-text-muted">Days Left</h3>
                                        <p className="text-4xl font-bold text-text-main">{daysLeft}</p>
                                        <p className="text-xs text-text-muted">Until Jan 24, {displayUser?.targetYear || '2026'}</p>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Skill Profile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['physics', 'chemistry', 'math'] as const).map(subject => {
                        const score = displayUser.skills?.[subject] || 0.5;
                        const percentage = Math.round(score * 100);
                        let color = 'text-yellow-500';
                        let bg = 'bg-yellow-500/10';
                        let border = 'border-yellow-500/20';
                        let label = 'Average';

                        if (score >= 0.7) {
                            color = 'text-green-500'; bg = 'bg-green-500/10'; border = 'border-green-500/20'; label = 'Strong';
                        } else if (score <= 0.4) {
                            color = 'text-red-500'; bg = 'bg-red-500/10'; border = 'border-red-500/20'; label = 'Weak';
                        }

                        return (
                            <div key={subject} className={`glass-card oxygen-card p-4 border ${border} ${bg} flex items-center justify-between`}>
                                <div>
                                    <h4 className="capitalize font-bold text-text-main">{subject}</h4>
                                    <p className={`text-xs uppercase font-bold tracking-wider ${color}`}>{label}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${color}`}>{percentage}%</span>
                                    <p className="text-[10px] text-text-muted">Proficiency</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Focus Areas + Videos */}
                {(loading || weakTopicStats.length > 0 || strongTopicStats.length > 0) ? (
                    <div className="glass-card oxygen-card p-6 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="text-red-400" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold text-text-main">AI Diagnostics</h3>
                                    <p className="text-sm text-text-muted">Master your syllabus through root-cause analysis</p>
                                </div>
                            </div>
                            <Link to="/dashboard/analytics" className="text-sm text-primary hover:underline whitespace-nowrap">Full Analytics →</Link>
                        </div>

                        {loading ? <div className="h-20 w-full bg-surface animate-pulse rounded-xl" /> : (
                            <div className="space-y-8">
                                {/* AI 2.0 Root Cause Layer */}
                                {dependencyInsights.length > 0 && (
                                    <RootCauseInsight
                                        insights={dependencyInsights}
                                        onFixAction={(topic) => navigate(`/dashboard/mock?topic=${encodeURIComponent(topic)}`)}
                                    />
                                )}

                                {weakTopicStats.length > 0 && (
                                    <div className="space-y-3 relative">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="text-red-400" size={18} />
                                            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">Specific Focus Topics</h4>
                                        </div>
                                        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
                                            {weakTopicStats.map((stat, idx) => (
                                                <div key={idx} className="shrink-0 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 oxygen-card">
                                                    <span className="text-sm font-medium text-red-50">{stat.topic}</span>
                                                    <span className="text-xs px-2 py-1 bg-red-500/20 rounded-md text-red-300 font-bold">{stat.score_percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Videos Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Play size={14} /> Recommended Videos
                                </h4>
                                <Link to="/dashboard/lectures" className="text-xs text-primary hover:underline flex items-center gap-1">More Videos <ChevronRight size={12} /></Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {loading || recommendedVideos.length === 0 ? (
                                    [1, 2, 3].map(i => <div key={i} className="aspect-video bg-surface/50 rounded-xl animate-pulse" />)
                                ) : (
                                    recommendedVideos.map((rec, idx) => (
                                        <Link key={idx} to={`/dashboard/lectures/${rec.topic.toLowerCase().replace(/\s+/g, '-')}`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                                            <div className="relative aspect-video bg-black/20 shrink-0">
                                                <img src={rec.video.thumbnailUrl} alt={rec.video.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"><Play size={20} className="text-white ml-1" /></div>
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-white font-medium border border-white/10">{rec.reason}</div>
                                            </div>
                                            <div className="p-3">
                                                <h5 className="font-medium text-text-main text-sm line-clamp-2 group-hover:text-primary transition-colors">{rec.video.title}</h5>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card p-12 flex flex-col items-center justify-center border-dashed border-2 border-border bg-transparent text-center space-y-4">
                        <p className="text-lg text-text-main font-medium">Your Dashboard is Ready.</p>
                        <p className="text-text-muted max-w-md">Take a quick mock test to start tracking your strengths and weaknesses.</p>
                        <Link to="/dashboard/mock" className="px-6 py-2 bg-primary text-white rounded-lg font-bold oxygen-button">Take Quick Test</Link>
                    </div>
                )}
            </div>


            <AnimatePresence>
                {showDiagnosticPopup && (
                    <DiagnosticPopup
                        onDismiss={() => {
                            setShowDiagnosticPopup(false);
                            localStorage.setItem(`diagnostic_dismissed_${user?.id}_${user?.userClass}`, 'true');
                        }}
                        onStart={() => {
                            // Dismiss logic included so it doesn't show on back nav
                            localStorage.setItem(`diagnostic_dismissed_${user?.id}_${user?.userClass}`, 'true');
                            window.location.href = '/dashboard/mock?mode=diagnostic'; // Hard nav to ensure clean state
                        }}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};
