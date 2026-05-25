import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useUserStore } from '../../store/userStore';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, RefreshCw, Flame, Play, ChevronRight, Target, Sparkles as SparkleIcon, Brain, Swords, ArrowRight, Calendar, Clock, Zap, BookOpen } from 'lucide-react';

import { getWeakTopics, getStrongTopics, type TopicStat } from '../../services/topicStrengthService';
import { offlineSyncService } from '../../services/offlineSyncService';
import { DailyChallenge } from '../../components/DailyChallenge';
import { syncHistoricalScoresToLeaderboard, syncSyllabusFromMocks, syncTopicStatsFromMocks } from '../../services/dataSyncService';
import { DailyMissionCard } from '../../components/dashboard/DailyMissionCard';
import { RankBadge } from '../../components/gamification/RankBadge';
import { XPProgress } from '../../components/gamification/XPProgress';
import { AuthGate } from '../../components/auth/AuthGate';


import { storageService } from '../../services/storageService';
import { mockPrefetchService } from '../../services/mockPrefetchService';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { DailyStudyGoalIcon } from '../../components/dashboard/DailyStudyGoalIcon';
import { ImprovementBookCard } from '../../components/dashboard/ImprovementBookCard';
import { EloService } from '../../services/eloService';

import { usePerformance } from '../../context/PerformanceProvider';

// MasteryDiagnostics removed
// CollegePredictorCard removed
// predictionService removed as per user request (unused)

import { type DailyMission } from '../../services/missionService';

const DiagnosticPopup = ({ onDismiss, onStart }: { onDismiss: () => void; onStart: () => void }) => {
    useScrollLock(true);
    
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onDismiss]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label="Calibrate Your AI" onClick={onDismiss}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-primary/20 p-8 rounded-2xl max-w-md w-full shadow-2xl relative oxygen-card"
                onClick={e => e.stopPropagation()}
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
    const { tier } = usePerformance();
    const isLowPerf = tier === 'low';
    const isElitePerf = tier === 'elite';

    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(displayUser?.userClass || '');
    const subjects = isJunior 
        ? ['Mathematics', 'Science', 'Social Science', 'English'] 
        : ['Physics', 'Chemistry', 'Math', 'Overall'];

    const daysLeft = displayUser?.userClass && ['Class 8th', 'Class 9th', 'Class 10th'].includes(displayUser.userClass)
        ? Math.ceil((new Date(`${new Date().getMonth() > 2 ? new Date().getFullYear() + 1 : new Date().getFullYear()}-03-31`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : (displayUser?.targetYear
            ? Math.ceil((new Date(`${displayUser.targetYear}-01-24`).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 365);

    const [activeSubjectIdx, setActiveSubjectIdx] = useState(0);
    const [slideDirection, setSlideDirection] = useState(0); // -1 for left, 1 for right
    const [activeVideoIdx, setActiveVideoIdx] = useState(0);
    const [videoSlideDirection, setVideoSlideDirection] = useState(0);
    // ---------------------------
    const [isSyncing, setIsSyncing] = useState(false);
    const handleSync = async () => {
        if (!user || isSyncing || user.isGuest) return;
        setIsSyncing(true);
        try {
            await Promise.all([
                syncHistoricalScoresToLeaderboard(user.id, {
                    displayName: user.name,
                    avatar: user.avatarUrl,
                    targetExam: user.targetExam
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
    const [subjectPreparedness, setSubjectPreparedness] = useState<Record<string, number>>({});
    // Use store value if available, else local state (though we can just direct use store)
    const progress = user?.syllabusProgress || 0;

    // Video States
    const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]); // Using any for ActiveRecommendation to avoid deep type imports if lazy loaded
    const [isRefreshingVideos, setIsRefreshingVideos] = useState(false);

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
        
        // --- PHASE B: PREDICTIVE PRE-FETCH ---
        if (user && !user.isGuest && authResolved) {
             if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(() => {
                    mockPrefetchService.prefetchQuickTest(
                        user.id, 
                        user.targetExam || 'General', 
                        user.abilityScore || 1000,
                        user.userClass || 'Class 12th'
                    );
                });
            } else {
                setTimeout(() => {
                    mockPrefetchService.prefetchQuickTest(
                        user.id, 
                        user.targetExam || 'General', 
                        user.abilityScore || 1000,
                        user.userClass || 'Class 12th'
                    );
                }, 3000);
            }
        }
    }, [user, refreshMissions, authResolved]);

    const handleMissionAction = (mission: DailyMission) => {
        if (mission.type === 'practice' || mission.type === 'review') {
            navigate(`/dashboard/mock?topic=${encodeURIComponent(mission.topic)}`);
        } else if (mission.type === 'discovery') {
            const slug = mission.topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
            navigate(`/dashboard/lectures/${slug}`);
        } else if (mission.type === 'srs_review' || mission.type === 'mistake_retry') {
            document.getElementById('improvement-book')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const fetchStats = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // --- SELF-HEALING CACHE SANITIZATION ---
            if (!user.isGuest) {
                try {
                    const { SYLLABUS_DB } = await import('../../lib/constants');
                    const normUserClass = user.userClass ? user.userClass.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim() : '';
                    const isCompetitive = ['jee', 'neet'].some(e => (user.targetExam || '').toLowerCase().includes(e));
                    const isDropper = normUserClass.includes('dropper');

                    const keysToRemove: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key) {
                            if (key.startsWith(`local_topic_stat_${user.id}`)) {
                                try {
                                    const parsed = JSON.parse(localStorage.getItem(key)!);
                                    if (parsed && parsed.topic) {
                                        let foundTopic: any = null;
                                        for (const subject of Object.keys(SYLLABUS_DB)) {
                                            if (parsed.topic_id) {
                                                foundTopic = SYLLABUS_DB[subject].find((t: any) => t.id === parsed.topic_id);
                                            }
                                            if (!foundTopic) {
                                                foundTopic = SYLLABUS_DB[subject].find((t: any) => t.topic.toLowerCase().trim() === parsed.topic.toLowerCase().trim());
                                            }
                                            if (foundTopic) break;
                                        }

                                        if (foundTopic) {
                                            const topicClassNorm = foundTopic.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                                            let isInvalid = false;

                                            if (isCompetitive || isDropper) {
                                                isInvalid = topicClassNorm === 'class 8' || topicClassNorm === 'class 9' || topicClassNorm === 'class 10';
                                            } else if (normUserClass) {
                                                isInvalid = topicClassNorm !== normUserClass;
                                            }

                                            if (isInvalid) {
                                                keysToRemove.push(key);
                                            }
                                        } else {
                                            // Unknown legacy topic not in database
                                            keysToRemove.push(key);
                                        }
                                    }
                                } catch (e) {}
                            } else if (key.startsWith(`vid_cache_v3_${user.id}_`)) {
                                try {
                                    const parts = key.split('_');
                                    const topicSlug = parts[parts.length - 2];
                                    if (topicSlug) {
                                        let foundTopic: any = null;
                                        for (const subject of Object.keys(SYLLABUS_DB)) {
                                            foundTopic = SYLLABUS_DB[subject].find((t: any) => {
                                                const tSlug = t.id;
                                                const cleanSlug = t.topic.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                                return tSlug === topicSlug || cleanSlug === topicSlug || t.topic.toLowerCase().replace(/\s+/g, '_') === topicSlug;
                                            });
                                            if (foundTopic) break;
                                        }

                                        if (foundTopic) {
                                            const topicClassNorm = foundTopic.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                                            let isInvalid = false;

                                            if (isCompetitive || isDropper) {
                                                isInvalid = topicClassNorm === 'class 8' || topicClassNorm === 'class 9' || topicClassNorm === 'class 10';
                                            } else if (normUserClass) {
                                                isInvalid = topicClassNorm !== normUserClass;
                                            }

                                            if (isInvalid) {
                                                keysToRemove.push(key);
                                            }
                                        }
                                    }
                                } catch (e) {}
                            }
                        }
                    }

                    keysToRemove.forEach(k => localStorage.removeItem(k));
                    if (keysToRemove.length > 0) {
                        console.log(`[SelfHealing] 🧼 Successfully scrubbed ${keysToRemove.length} legacy invalid cache entries.`);
                    }
                } catch (err) {
                    console.warn("Self-healing cache check failed:", err);
                }
            }

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

            // 5. Fetch Mock Counts & Calculate Blended Preparedness (Independent - Guests still want their local history!)
            try {
                let cloudMocks: any[] = [];
                if (!user.isGuest) {
                    const { db } = await import('../../lib/firebase');
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const mockColl = collection(db, 'mock_attempts');
                    const qMock = query(mockColl, where('user_id', '==', user.id));
                    const snapshotMock = await getDocs(qMock);
                    cloudMocks = snapshotMock.docs.map(d => ({ ...d.data(), source: 'cloud' }));
                }

                const localMocks = await storageService.getHistory(user?.id);
                const mergedMocks = cloudMocks.concat(localMocks);
                setAttempts(mergedMocks.length);

                // --- Calculate Blended Preparedness ---
                const exam = user?.targetExam?.toLowerCase() || '';
                const userCls = user?.userClass?.toLowerCase() || '';

                let relevantSubjects: string[] = [];
                if (exam.includes('jee')) relevantSubjects = ['Physics', 'Chemistry', 'Mathematics'];
                else if (exam.includes('neet') || exam.includes('medical')) relevantSubjects = ['Physics', 'Chemistry', 'Biology'];
                else if (exam === 'school exams' || exam.includes('class') || exam.includes('board')) {
                    const classKey = userCls.replace(/th|st|nd|rd/g, '').replace(' ', '-');
                    const { EXAM_SUBJECT_MAPPING } = await import('../../lib/constants');
                    relevantSubjects = EXAM_SUBJECT_MAPPING[classKey] || EXAM_SUBJECT_MAPPING[exam] || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
                } else {
                    relevantSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
                }

                // Fetch syllabus stats per subject
                const statsObj: Record<string, { total: number, master: number, scoreSum: number, count: number }> = {};
                
                const normUserClass = user.userClass ? user.userClass.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim() : '';
                const isComp = ['jee', 'neet'].some(e => exam.includes(e));
                const isDropper = normUserClass.includes('dropper');

                for (const sub of relevantSubjects) {
                    const { SYLLABUS_DB } = await import('../../lib/constants');
                    const classTopics = (SYLLABUS_DB[sub] || []).filter(t => {
                        if (!user.userClass) return true;
                        const normTopicClass = t.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                        if (isComp || isDropper) {
                            return normTopicClass === 'class 11' || normTopicClass === 'class 12';
                        }
                        return normTopicClass === normUserClass;
                    });
                    const totalTopics = classTopics.length || 10;
                    statsObj[sub] = { total: totalTopics, master: 0, scoreSum: 0, count: 0 };
                }

                if (!user.isGuest) {
                    const { db } = await import('../../lib/firebase');
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const sylQ = query(collection(db, 'syllabus'), where('user_id', '==', user.id));
                    const sylSnap = await getDocs(sylQ);
                    
                    const { SYLLABUS_DB } = await import('../../lib/constants');
                    sylSnap.docs.forEach(doc => {
                        const data = doc.data();
                        if (statsObj[data.subject] && data.is_completed) {
                            const topicItem = (SYLLABUS_DB[data.subject] || []).find(t => t.topic === data.topic);
                            if (!user.userClass) {
                                statsObj[data.subject].master++;
                                statsObj[data.subject].scoreSum += (data.mastery_score || 0);
                                statsObj[data.subject].count++;
                            } else if (topicItem) {
                                const normTopicClass = topicItem.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                                const classMatches = (isComp || isDropper)
                                    ? (normTopicClass === 'class 11' || normTopicClass === 'class 12')
                                    : normTopicClass === normUserClass;
                                
                                if (classMatches) {
                                    statsObj[data.subject].master++;
                                    statsObj[data.subject].scoreSum += (data.mastery_score || 0);
                                    statsObj[data.subject].count++;
                                }
                            }
                        }
                    });
                }

                const fmtStats: Record<string, number> = {};
                relevantSubjects.forEach(subj => {
                    const s = statsObj[subj];
                    const completionPct = s.total > 0 ? Math.round((s.master / s.total) * 100) : 0;
                    fmtStats[subj] = completionPct;
                });

                // Filter mocks
                const classesMatch = (userClass: string, attemptClass: string): boolean => {
                    if (!userClass || !attemptClass) return true;
                    if (userClass.toLowerCase() === 'general' || attemptClass.toLowerCase() === 'general') return true;
                    const userDigits: string[] = userClass.match(/\d+/g) || [];
                    const attemptDigits: string[] = attemptClass.match(/\d+/g) || [];
                    if (userDigits.length === 0 || attemptDigits.length === 0) return true;
                    return userDigits.some(d => attemptDigits.includes(d));
                };

                const examsMatch = (userExam: string, attempt: any): boolean => {
                    if (!userExam) return true;
                    const userExamLower = userExam.toLowerCase();
                    const attemptExam = (attempt.exam_name || attempt.exam || attempt.exam_type || attempt.topic || '').toLowerCase();
                    if (userExamLower.includes('jee') || userExamLower.includes('engineering')) {
                        if (attemptExam.includes('neet') || attemptExam.includes('medical') || attemptExam.includes('biology')) {
                            return false;
                        }
                        return true;
                    }
                    if (userExamLower.includes('neet') || userExamLower.includes('medical')) {
                        if (attemptExam.includes('jee') || attemptExam.includes('mains') || attemptExam.includes('advance') || attemptExam.includes('mathematics') || attemptExam.includes('math')) {
                            return false;
                        }
                        return true;
                    }
                    return true;
                };

                const filteredMocks = mergedMocks.filter(m => {
                    if (!m) return false;
                    const attemptClass = m.user_class || m.userClass || '';
                    if (!classesMatch(userCls, attemptClass)) return false;
                    if (!examsMatch(exam, m)) return false;
                    return true;
                });

                let mocksToProcess = filteredMocks;
                let isSimulation = false;
                if (filteredMocks.length === 0) {
                    isSimulation = true;
                    const baseDate = new Date();
                    if (exam.includes('neet') || exam.includes('medical')) {
                        mocksToProcess = [
                            { topic: 'NEET Diagnostic - Physics', score: 96, total: 180, percentage: 53, type: 'topic', created_at: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'NEET Diagnostic - Chemistry', score: 108, total: 180, percentage: 60, type: 'topic', created_at: new Date(baseDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'NEET Diagnostic - Biology', score: 224, total: 360, percentage: 62, type: 'topic', created_at: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'NEET UG Part Test #1', score: 480, total: 720, percentage: 67, type: 'quick', created_at: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'NEET UG Full Mock #1', score: 532, total: 720, percentage: 74, type: 'full', created_at: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() }
                        ];
                    } else {
                        mocksToProcess = [
                            { topic: 'JEE Mains Diagnostic - Physics', score: 48, total: 100, percentage: 48, type: 'topic', created_at: new Date(baseDate.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'JEE Mains Diagnostic - Chemistry', score: 56, total: 100, percentage: 56, type: 'topic', created_at: new Date(baseDate.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'JEE Mains Diagnostic - Mathematics', score: 62, total: 100, percentage: 62, type: 'topic', created_at: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'JEE Mains Part Test #1', score: 204, total: 300, percentage: 68, type: 'quick', created_at: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
                            { topic: 'JEE Mains Full Mock #1', score: 228, total: 300, percentage: 76, type: 'full', created_at: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() }
                        ];
                    }
                }

                const rawMocksData = mocksToProcess
                    .filter(m => m !== null)
                    .map((m: any) => {
                        let inferredType = m.type;
                        if (!inferredType) {
                            const qCount = Number(m.totalQuestions || m.total_questions || 0);
                            if (qCount > 0 && qCount <= 25) inferredType = 'quick';
                            else if (m.topic && m.topic.toLowerCase().includes('full mock')) inferredType = 'full';
                            else inferredType = 'quick';
                        }
                        const maxScore = m.total_marks || m.total || (Number(m.total_questions || m.totalQuestions || 0) * 4) || 100;
                        let norm = 0;
                        if (m.percentage !== undefined) norm = Number(m.percentage);
                        else if (m.score !== undefined && maxScore > 0) norm = Math.round((Number(m.score) / maxScore) * 100);
                        return { ...m, normalizedScore: norm, type: inferredType };
                    });

                const subjectMockScores: Record<string, { total: number, count: number }> = {};
                rawMocksData.forEach((mock: any) => {
                    let subjectsInMock: string[] = [];
                    if (mock.type === 'full') subjectsInMock = relevantSubjects;
                    else if (mock.type === 'topic' || mock.topic) {
                        const topicName = (mock.topic || '').toLowerCase();
                        const foundSub = relevantSubjects.find(s => topicName.includes(s.toLowerCase()));
                        if (foundSub) subjectsInMock = [foundSub];
                        else subjectsInMock = relevantSubjects;
                    }

                    subjectsInMock.forEach(sub => {
                        if (!subjectMockScores[sub]) subjectMockScores[sub] = { total: 0, count: 0 };
                        const score = Math.min(100, Math.max(0, mock.normalizedScore));
                        if (score > 0) {
                            subjectMockScores[sub].total += score;
                            subjectMockScores[sub].count++;
                        }
                    });
                });

                const computedPreparedness: Record<string, number> = {};
                relevantSubjects.forEach(subj => {
                    const cal = user?.calibrationProfile;
                    const subKey = subj.toLowerCase() === 'mathematics' || subj.toLowerCase() === 'math' ? 'math' : subj.toLowerCase();
                    let eloRating = cal?.subjectRatings?.[subKey] || user?.abilityScore || 1000;
                    if (subKey === 'math' && eloRating === 1000 && cal?.topicRatings?.mathematics) {
                        eloRating = cal.topicRatings.mathematics;
                    }
                    const eloPercentile = EloService.calculatePercentile(eloRating);

                    let percentage = fmtStats[subj] || 0;
                    if (percentage === 0) {
                        if (subjectMockScores[subj]?.count > 0) {
                            const avg = Math.round(subjectMockScores[subj].total / subjectMockScores[subj].count);
                            percentage = avg;
                        }
                    }

                    let blended = 0;
                    const hasHistory = percentage > 0 || (cal?.totalAttempts || 0) > 0 || isSimulation;
                    if (hasHistory) {
                        blended = Math.round((percentage * 0.3) + (eloPercentile * 0.7));
                    }
                    computedPreparedness[subj] = blended;
                });

                setSubjectPreparedness(computedPreparedness);
            } catch (err) {
                console.warn("Mock counts and preparedness fetch failed:", err);
                const localData = await storageService.getHistory(user?.id);
                setAttempts(localData.length);
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



    // AI 2.0: Concept Graph Insights (unused)

    // Optimized Video Fetching - Multi Focus
    const fetchRecommendations = async (force: boolean = false) => {
        if (!user || !user.id) return;
        if (force) setIsRefreshingVideos(true);

        try {
            const { getRecommendedVideos } = await import('../../services/recommendationService');
            // Fetch multiple recommendations
            const recommendations = await getRecommendedVideos(user.id, user.userClass, user.targetExam, force);

            if (recommendations && recommendations.length > 0) {
                setRecommendedVideos(recommendations);
            } else {
                setRecommendedVideos([]);
            }
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
        } finally {
            if (force) setIsRefreshingVideos(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [user]);

    // Format numbers

    // Hoist variables are now declared at the top of the component

    // Hoist Header out of loading state
    const header = (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 w-full">
                <div className="shrink-0 scale-90 sm:scale-100 origin-center sm:origin-left">
                    <RankBadge xp={displayUser?.xp || 0} size="lg" onClick={() => navigate('/dashboard/ranks')} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col items-center sm:items-start w-full">
                    <h1 className="text-xl md:text-3xl font-heading font-extrabold text-slate-100 tracking-tight">
                        Welcome back, {displayUser?.name || 'Aspirant'}.
                    </h1>
                    
                    {/* Stylized Metric Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2 w-full">
                        {!isJunior && (
                            <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] sm:text-xs font-semibold text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                                <Target size={12} className="text-violet-400" />
                                <span>
                                    Target: <span className="text-violet-400 font-bold">{displayUser?.targetExam || 'Undecided'} {displayUser?.targetYear}</span>
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] sm:text-xs font-semibold text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                            <SparkleIcon size={12} className="text-amber-400 fill-amber-400/20" />
                            <span>
                                Season: <span className="text-amber-400 font-bold">{(displayUser?.totalPoints || 0).toLocaleString()}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] sm:text-xs font-semibold text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                            <Zap size={12} className="text-emerald-400 fill-emerald-400/20" />
                            <span>
                                Career XP: <span className="text-emerald-400 font-bold">{(displayUser?.lifetimeXp || 0).toLocaleString()}</span>
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 md:mt-4 w-full max-w-md sm:w-80">
                        <XPProgress xp={displayUser?.xp || 0} />
                    </div>
                </div>
            </div>

            {/* Desktop Stats Indicators */}
            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 px-5 py-3 glass-card premium-border active-glow shadow-xl backdrop-blur-md bg-slate-900/40">
                    <DailyStudyGoalIcon />
                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-2 bg-primary/10 rounded-xl"
                    >
                        <Flame size={20} className="fill-primary text-primary" />
                    </motion.div>
                    <div>
                        <p className="text-xs font-black text-slate-100 leading-none">{displayUser?.streak || 0}-DAY STREAK</p>
                        <div className="flex items-center gap-1 mt-1">
                            <SparkleIcon size={10} className="text-amber-500 fill-amber-500" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Elite Learner</p>
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
                        className="hidden lg:flex items-center gap-2 px-5 py-3 glass-card premium-border text-purple-400 font-bold hover:bg-white/5 transition-all shadow-xl hover:shadow-purple-500/20 active:scale-95 bg-slate-900/40 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                        Share Parent Report
                    </button>
                )}
            </div>
        </header>
    );

    const getSubjectCardData = (subject: string) => {
        let percentage = 50;

        if (loading || Object.keys(subjectPreparedness).length === 0) {
            percentage = 50;
        } else {
            if (subject.toLowerCase() === 'overall') {
                const vals = Object.values(subjectPreparedness);
                percentage = vals.length > 0 
                    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
                    : 0;
            } else {
                const key = Object.keys(subjectPreparedness).find(
                    k => k.toLowerCase() === subject.toLowerCase() || 
                         (subject.toLowerCase() === 'math' && k.toLowerCase() === 'mathematics') ||
                         (subject.toLowerCase() === 'mathematics' && k.toLowerCase() === 'math')
                );
                percentage = key ? subjectPreparedness[key] : 0;
            }
        }
        const score = percentage / 100;
        
        let colorClass = 'text-amber-400';
        let barGradient = 'from-amber-500 to-yellow-400';
        let bgClass = 'bg-amber-500/5';
        let borderClass = 'border-amber-500/15';
        let glowClass = 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] hover:border-amber-500/30';
        let label = 'Average';

        if (subject.toLowerCase() === 'overall') {
            colorClass = 'text-purple-400';
            barGradient = 'from-purple-500 to-indigo-400';
            bgClass = 'bg-purple-500/10';
            borderClass = 'border-purple-500/25';
            glowClass = 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] hover:border-purple-500/40 border-purple-500/20';
            if (score >= 0.7) {
                label = 'Mastery';
            } else if (score <= 0.4) {
                label = 'Needs Focus';
            } else {
                label = 'Steady';
            }
        } else if (score >= 0.7) {
            colorClass = 'text-emerald-400';
            barGradient = 'from-emerald-500 to-teal-400';
            bgClass = 'bg-emerald-500/5';
            borderClass = 'border-emerald-500/15';
            glowClass = 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:border-emerald-500/30';
            label = 'Strong';
        } else if (score <= 0.4) {
            colorClass = 'text-rose-400';
            barGradient = 'from-rose-500 to-red-400';
            bgClass = 'bg-rose-500/5';
            borderClass = 'border-rose-500/15';
            glowClass = 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.12)] hover:border-rose-500/30';
            label = 'Weak';
        }

        return {
            percentage,
            score,
            colorClass,
            barGradient,
            bgClass,
            borderClass,
            glowClass,
            label
        };
    };

    return (
        <motion.div
            className="space-y-8 min-h-screen relative overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Cosmic Radial Glow Background Auras */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-[30%] right-[-10%] w-[40%] h-[400px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none z-0" />
            
            <div className="relative z-10 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    {header}
                </motion.div>

                <div className="space-y-8">
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
                            {/* Mobile-Only Compact Grid of Stats & Actions */}
                            {isMobile && (
                                <div className="grid grid-cols-2 gap-4 relative z-10 my-4">
                                {/* 1. Syllabus Coverage */}
                                <div 
                                    onClick={() => navigate('/dashboard/syllabus')}
                                    className="glass-card p-4 flex flex-col justify-between cursor-pointer border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all bg-sky-500/[0.02]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Syllabus</span>
                                        <RefreshCw size={12} className="text-slate-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="relative w-10 h-10 shrink-0">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-white/[0.04]" />
                                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 - (progress / 100) * (2 * Math.PI * 16)} strokeLinecap="round" className="text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.5)] transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[9px] font-black text-slate-100">{progress}%</span>
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-100 truncate">{progress}% Mastered</p>
                                            <p className="text-[8px] text-slate-400 font-semibold">{attempts} mocks</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Days Left / Class */}
                                <div className="glass-card p-4 flex flex-col justify-between border border-white/5 bg-violet-500/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {isJunior ? 'Class' : 'Countdown'}
                                        </span>
                                        <Calendar size={12} className="text-slate-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <Clock size={16} className="text-violet-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-100 truncate">
                                                {isJunior ? displayUser?.userClass : `${daysLeft} Days`}
                                            </p>
                                            <p className="text-[8px] text-slate-400 font-semibold leading-tight">Remaining</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. The Arena */}
                                <div 
                                    onClick={() => navigate('/dashboard/arena')}
                                    className="glass-card p-4 flex flex-col justify-between cursor-pointer border border-red-500/10 bg-gradient-to-br from-[#11131c] to-red-500/[0.05] hover:border-red-500/30 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">The Arena</span>
                                        <span className="bg-red-500/20 text-red-500 border border-red-500/40 px-1 py-0.2 rounded text-[7px] font-black uppercase animate-pulse">Live</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                            <Swords size={16} className="text-red-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-100 truncate">1v1 Battles</p>
                                            <p className="text-[8px] text-red-300 font-semibold uppercase tracking-wider">Enter Match →</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Improvement Book / Revision */}
                                <div 
                                    onClick={() => {
                                        const el = document.getElementById('mobile-improvement-book');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="glass-card p-4 flex flex-col justify-between cursor-pointer border border-purple-500/10 bg-purple-500/[0.02] hover:border-purple-500/30 active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revision</span>
                                        <BookOpen size={12} className="text-purple-400" />
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                            <Brain size={16} className="text-purple-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-100 truncate">Revision Book</p>
                                            <p className="text-[8px] text-purple-300 font-semibold uppercase tracking-wider">Review Mistake →</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Arena Card */}
                            {!isMobile && (
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
                            )}
                        </div>

                        {!isMobile && (
                            <div className="space-y-6">
                                {/* Coverage Card (Circular progress layout) */}
                                <div className="glass-card oxygen-card p-6 space-y-4 min-h-[160px] relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Syllabus Coverage</h3>
                                    <RefreshCw size={14} className="text-slate-500" />
                                </div>

                                {loading ? (
                                    <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
                                ) : (
                                    <div className="flex items-center gap-5">
                                        <div className="relative w-16 h-16 shrink-0">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="26"
                                                    stroke="currentColor"
                                                    strokeWidth="3.5"
                                                    fill="transparent"
                                                    className="text-white/[0.04]"
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="26"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 26}
                                                    strokeDashoffset={2 * Math.PI * 26 - (progress / 100) * (2 * Math.PI * 26)}
                                                    strokeLinecap="round"
                                                    className="text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)] transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-black text-slate-100">{progress}%</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <p className="text-lg font-extrabold text-slate-100 tracking-tight">{progress}% Mastered</p>
                                            <p className="text-[10px] text-slate-400 font-semibold truncate">{attempts} mocks completed</p>
                                            
                                            {!user?.isGuest && (
                                                <button
                                                    onClick={handleSync}
                                                    disabled={isSyncing}
                                                    className="mt-1 px-2.5 py-1 text-[9px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider active:scale-95"
                                                >
                                                    <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                                                    {isSyncing ? 'Syncing...' : 'Sync Progress'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Days Left / Class Card */}
                            <div className="glass-card oxygen-card p-6 space-y-4 min-h-[160px] flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                        {isJunior ? 'Academic Class' : 'Exam Countdown'}
                                    </h3>
                                    <Calendar size={14} className="text-slate-500" />
                                </div>

                                {loading ? (
                                    <div className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
                                ) : (
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] shrink-0">
                                            <Clock size={24} className="text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <p className="text-3xl font-black text-slate-100 tracking-tight">
                                                {isJunior ? displayUser?.userClass : daysLeft}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                                                {isJunior 
                                                    ? 'Keep consistency to excel!' 
                                                    : `Days remaining until Jan 24, ${displayUser?.targetYear || '2026'}`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div id="improvement-book">
                                <ImprovementBookCard 
                                    userId={displayUser.id || 'guest'}
                                    isGuest={displayUser.isGuest}
                                    onStartTest={() => navigate('/dashboard/mock')}
                                />
                            </div>
                            </div>
                        )}
                        </div>

                    {/* Skill Profile (RPG style progress metrics) */}
                    {isMobile ? (
                        <div className="relative w-full flex flex-col items-center gap-3">
                            {/* Card Slider Content Area (No chevron buttons, overflow-visible) */}
                            <div className="w-full relative py-1 overflow-visible">
                                <AnimatePresence mode={isElitePerf ? "popLayout" : "wait"} custom={slideDirection}>
                                    {(() => {
                                        const subject = subjects[activeSubjectIdx];
                                        const { percentage, colorClass, barGradient, bgClass, borderClass, label } = getSubjectCardData(subject);
                                        
                                        return (
                                            <motion.div
                                                key={subject}
                                                custom={slideDirection}
                                                drag="x"
                                                dragConstraints={{ left: 0, right: 0 }}
                                                dragElastic={0.4}
                                                onDragEnd={(_, info) => {
                                                    const swipe = info.offset.x;
                                                    const threshold = 30;
                                                    if (swipe < -threshold) {
                                                        setSlideDirection(1);
                                                        setActiveSubjectIdx(prev => (prev + 1) % subjects.length);
                                                    } else if (swipe > threshold) {
                                                        setSlideDirection(-1);
                                                        setActiveSubjectIdx(prev => (prev - 1 + subjects.length) % subjects.length);
                                                    }
                                                }}
                                                variants={{
                                                    enter: (dir: number) => {
                                                        if (isLowPerf) return { x: dir > 0 ? 80 : -80, opacity: 0, scale: 1 };
                                                        const xVal = isElitePerf ? 150 : 100;
                                                        const scaleVal = isElitePerf ? 0.95 : 0.98;
                                                        return { x: dir > 0 ? xVal : -xVal, opacity: 0, scale: scaleVal };
                                                    },
                                                    center: {
                                                        x: 0,
                                                        opacity: 1,
                                                        scale: 1,
                                                        transition: isLowPerf 
                                                            ? { x: { duration: 0.12, ease: "easeOut" }, opacity: { duration: 0.12, ease: "easeOut" } }
                                                            : {
                                                                x: { type: 'spring', stiffness: isElitePerf ? 500 : 350, damping: isElitePerf ? 30 : 28 },
                                                                opacity: { duration: isElitePerf ? 0.12 : 0.15 },
                                                                scale: { duration: isElitePerf ? 0.12 : 0.15 }
                                                              }
                                                    },
                                                    exit: (dir: number) => {
                                                        if (isLowPerf) return { x: dir < 0 ? 80 : -80, opacity: 0, scale: 1, transition: { x: { duration: 0.1, ease: "easeIn" }, opacity: { duration: 0.1, ease: "easeIn" } } };
                                                        const xVal = isElitePerf ? 150 : 100;
                                                        const scaleVal = isElitePerf ? 0.95 : 0.98;
                                                        return {
                                                            x: dir < 0 ? xVal : -xVal,
                                                            opacity: 0,
                                                            scale: scaleVal,
                                                            transition: {
                                                                x: { type: 'spring', stiffness: isElitePerf ? 500 : 350, damping: isElitePerf ? 30 : 28 },
                                                                opacity: { duration: isElitePerf ? 0.1 : 0.12 },
                                                                scale: { duration: isElitePerf ? 0.1 : 0.12 }
                                                            }
                                                        };
                                                    }
                                                }}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                className={`glass-card p-5 border ${borderClass} ${bgClass} flex flex-col justify-between cursor-pointer shadow-none w-full min-h-[110px] select-none`}
                                                style={{ transition: 'border-color 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="min-w-0">
                                                        <h4 className="capitalize font-black text-slate-200 tracking-wider text-sm truncate">{subject}</h4>
                                                        <span className={`text-[10px] uppercase font-extrabold tracking-widest ${colorClass}`}>{label}</span>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end">
                                                        <AnimatedCounter value={percentage} colorClass={colorClass} />
                                                        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Preparedness</span>
                                                    </div>
                                                </div>

                                                {/* Animated subject bar indicator */}
                                                <div className="space-y-1.5">
                                                    <div className="w-full h-1.5 bg-slate-950/40 rounded-full overflow-hidden border border-white/[0.02]">
                                                        <motion.div 
                                                            className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={isLowPerf ? { duration: 0 } : { 
                                                                duration: 1.2, 
                                                                ease: [0.16, 1, 0.3, 1] 
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                                                        <span>0%</span>
                                                        <span>Mastery Level</span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>

                            {/* Dot indicators */}
                            <div className="flex items-center gap-2 mt-1">
                                {subjects.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSlideDirection(idx > activeSubjectIdx ? 1 : -1);
                                            setActiveSubjectIdx(idx);
                                        }}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            idx === activeSubjectIdx 
                                                ? 'w-6 bg-purple-500' 
                                                : 'w-1.5 bg-white/20 hover:bg-white/40'
                                        }`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                            variants={{
                                show: { transition: { staggerChildren: 0.08 } }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {subjects.map((subject) => {
                                const { percentage, colorClass, barGradient, bgClass, borderClass, glowClass, label } = getSubjectCardData(subject);

                                return (
                                    <motion.div 
                                        key={subject} 
                                        variants={{
                                            hidden: { opacity: 0, y: 20, scale: 0.97 },
                                            show:   { opacity: 1, y: 0,  scale: 1 }
                                        }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`glass-card p-3 md:p-5 border ${borderClass} ${bgClass} flex flex-col justify-between cursor-pointer ${glowClass}`}
                                        style={{ transition: 'box-shadow 380ms cubic-bezier(0.16, 1, 0.3, 1), border-color 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                                    >
                                        <div className="flex items-start justify-between mb-2 md:mb-4">
                                            <div className="min-w-0">
                                                <h4 className="capitalize font-black text-slate-200 tracking-wider text-xs md:text-sm truncate">{subject}</h4>
                                                <span className={`text-[9px] md:text-[10px] uppercase font-extrabold tracking-widest ${colorClass}`}>{label}</span>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end">
                                                <AnimatedCounter value={percentage} colorClass={colorClass} />
                                                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">Preparedness</span>
                                            </div>
                                        </div>

                                        {/* Animated subject bar indicator */}
                                        <div className="space-y-1.5">
                                            <div className="w-full h-1.5 bg-slate-950/40 rounded-full overflow-hidden border border-white/[0.02]">
                                                <motion.div 
                                                    className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ 
                                                        duration: 1.2, 
                                                        delay: idx * 0.1 + 0.3,
                                                        ease: [0.16, 1, 0.3, 1] 
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold hidden sm:flex">
                                                <span>0%</span>
                                                <span>Mastery Level</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Mobile-Only Improvement Book */}
                    <div id="mobile-improvement-book" className="md:hidden my-6">
                        <ImprovementBookCard 
                            userId={displayUser.id || 'guest'}
                            isGuest={displayUser.isGuest}
                            onStartTest={() => navigate('/dashboard/mock')}
                        />
                    </div>

                {/* Focus Areas + Videos */}
                <div className="glass-card oxygen-card p-6 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-red-400" size={24} />
                            <h3 className="text-xl font-bold text-text-main">AI Diagnostics</h3>
                        </div>
                        <Link to="/dashboard/analytics" className="text-sm text-primary hover:underline whitespace-nowrap">Full Analytics →</Link>
                    </div>

                    {/* Videos Section */}
                    <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Play size={14} /> Recommended Videos
                                </h4>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => fetchRecommendations(true)}
                                        disabled={isRefreshingVideos}
                                        className="text-xs text-primary flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded-md transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} className={isRefreshingVideos ? 'animate-spin' : ''} />
                                        {isRefreshingVideos ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                    <Link to="/dashboard/lectures" className="text-xs text-text-muted hover:text-primary hover:underline flex items-center gap-1">More Videos <ChevronRight size={12} /></Link>
                                </div>
                            </div>

                            {isMobile ? (
                                <div className="relative w-full flex flex-col items-center gap-3">
                                    {/* Video Slider Content Area */}
                                    <div className="w-full relative py-1 overflow-visible">
                                        <AnimatePresence mode={isElitePerf ? "popLayout" : "wait"} custom={videoSlideDirection}>
                                            {(() => {
                                                const rec = recommendedVideos[activeVideoIdx % recommendedVideos.length];
                                                if (!rec) return null;
                                                return (
                                                    <motion.div
                                                        key={rec.video.title}
                                                        custom={videoSlideDirection}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        dragElastic={0.4}
                                                        onDragEnd={(_, info) => {
                                                            const swipe = info.offset.x;
                                                            const threshold = 30;
                                                            if (swipe < -threshold) {
                                                                setVideoSlideDirection(1);
                                                                setActiveVideoIdx(prev => (prev + 1) % recommendedVideos.length);
                                                            } else if (swipe > threshold) {
                                                                setVideoSlideDirection(-1);
                                                                setActiveVideoIdx(prev => (prev - 1 + recommendedVideos.length) % recommendedVideos.length);
                                                            }
                                                        }}
                                                        variants={{
                                                            enter: (dir: number) => {
                                                                if (isLowPerf) return { x: dir > 0 ? 80 : -80, opacity: 0, scale: 1 };
                                                                const xVal = isElitePerf ? 150 : 100;
                                                                const scaleVal = isElitePerf ? 0.95 : 0.98;
                                                                return { x: dir > 0 ? xVal : -xVal, opacity: 0, scale: scaleVal };
                                                            },
                                                            center: {
                                                                x: 0,
                                                                opacity: 1,
                                                                scale: 1,
                                                                transition: isLowPerf 
                                                                    ? { x: { duration: 0.12, ease: "easeOut" }, opacity: { duration: 0.12, ease: "easeOut" } }
                                                                    : {
                                                                        x: { type: 'spring', stiffness: isElitePerf ? 500 : 350, damping: isElitePerf ? 30 : 28 },
                                                                        opacity: { duration: isElitePerf ? 0.12 : 0.15 },
                                                                        scale: { duration: isElitePerf ? 0.12 : 0.15 }
                                                                      }
                                                            },
                                                            exit: (dir: number) => {
                                                                if (isLowPerf) return { x: dir < 0 ? 80 : -80, opacity: 0, scale: 1, transition: { x: { duration: 0.1, ease: "easeIn" }, opacity: { duration: 0.1, ease: "easeIn" } } };
                                                                const xVal = isElitePerf ? 150 : 100;
                                                                const scaleVal = isElitePerf ? 0.95 : 0.98;
                                                                return {
                                                                    x: dir < 0 ? xVal : -xVal,
                                                                    opacity: 0,
                                                                    scale: scaleVal,
                                                                    transition: {
                                                                        x: { type: 'spring', stiffness: isElitePerf ? 500 : 350, damping: isElitePerf ? 30 : 28 },
                                                                        opacity: { duration: isElitePerf ? 0.1 : 0.12 },
                                                                        scale: { duration: isElitePerf ? 0.1 : 0.12 }
                                                                    }
                                                                };
                                                            }
                                                        }}
                                                        initial="enter"
                                                        animate="center"
                                                        exit="exit"
                                                        className="w-full flex flex-col cursor-pointer select-none"
                                                    >
                                                        <Link to={`/dashboard/lectures/${rec.topic.toLowerCase().replace(/\s+/g, '-')}`} className="group oxygen-card bg-surface border border-border rounded-xl overflow-hidden flex flex-col w-full">
                                                            <div className="relative aspect-video bg-black/20 shrink-0">
                                                                <img src={rec.video.thumbnailUrl} alt={rec.video.title} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"><Play size={20} className="text-white ml-1" /></div>
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h5 className="font-semibold text-text-main text-sm line-clamp-2 group-hover:text-primary transition-colors">{rec.video.title}</h5>
                                                            </div>
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })()}
                                        </AnimatePresence>
                                    </div>

                                    {/* Dot indicators */}
                                    <div className="flex items-center gap-2 mt-1">
                                        {recommendedVideos.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setVideoSlideDirection(idx > activeVideoIdx ? 1 : -1);
                                                    setActiveVideoIdx(idx);
                                                }}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                                    idx === activeVideoIdx 
                                                        ? 'w-6 bg-red-500' 
                                                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                                                }`}
                                                aria-label={`Go to slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
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
                                                </div>
                                                <div className="p-3">
                                                    <h5 className="font-semibold text-text-main text-sm line-clamp-2 group-hover:text-primary transition-colors">{rec.video.title}</h5>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}
                    </div>
                </div>
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
        </div>
    </motion.div>
    );
};

// ─── Animated counter component ──────────────────────────────────────────────
// Counts up from 0 to `value` using a spring physics animation
const AnimatedCounter = ({ value, colorClass }: { value: number; colorClass: string }) => {
    const { tier } = usePerformance();
    const isLowPerf = tier === 'low';

    const spring = useSpring(0, { stiffness: 60, damping: 18, restDelta: 0.5 });
    const display = useTransform(spring, (v) => `${Math.round(v)}%`);
    const hasRun = useRef(false);

    useEffect(() => {
        if (isLowPerf) return;
        if (!hasRun.current) {
            hasRun.current = true;
            // Small delay so card entry animation runs first
            const t = setTimeout(() => spring.set(value), 300);
            return () => clearTimeout(t);
        } else {
            spring.set(value);
        }
    }, [value, spring, isLowPerf]);

    if (isLowPerf) {
        return (
            <span className={`text-lg md:text-2xl font-black ${colorClass} tracking-tight tabular-nums`}>
                {Math.round(value)}%
            </span>
        );
    }

    return (
        <motion.span className={`text-lg md:text-2xl font-black ${colorClass} tracking-tight tabular-nums`}>
            {display}
        </motion.span>
    );
};
