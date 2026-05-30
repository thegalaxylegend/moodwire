import { useState, useEffect, useMemo } from 'react';
import { Loader2, BarChart3, LineChart, TrendingUp } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CustomSelect } from '../../components/CustomSelect';
import { AuthGate } from '../../components/auth/AuthGate';
import { ScorePredictor } from '../../components/ScorePredictor';
import { KnowledgeGraph } from '../../components/dashboard/KnowledgeGraph';
import { EloService } from '../../services/eloService';
import { storageService } from '../../services/storageService';

export const Analytics = () => {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isDemoData, setIsDemoData] = useState(false);

    // Data State
    const [rawMocks, setRawMocks] = useState<any[]>([]);

    // Filter State
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [testFilter, setTestFilter] = useState<'all' | 'quick' | 'full' | 'topic'>('all'); // Default to ALL
    const [timeRange, setTimeRange] = useState<'1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M'); // Default to 6M

    // Derived State for UI
    const [weakAreas, setWeakAreas] = useState<string[]>([]);
    const [subjectStats, setSubjectStats] = useState<any>(null);
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobileScreen(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
            const { SYLLABUS_DB } = await import('../../lib/constants');

            const exam = user?.targetExam?.toLowerCase() || '';
            const userCls = user?.userClass?.toLowerCase() || '';

            let relevantSubjects: string[] = [];

            // Resolve relevant subjects based on exam or class
            if (exam.includes('jee')) relevantSubjects = ['Physics', 'Chemistry', 'Mathematics'];
            else if (exam.includes('neet') || exam.includes('medical')) relevantSubjects = ['Physics', 'Chemistry', 'Biology'];
            else if (exam === 'school exams' || exam.includes('class') || exam.includes('board')) {
                // Map "Class 10th" -> "class-10"
                const classKey = userCls.replace(/th|st|nd|rd/g, '').replace(' ', '-');
                const EXAM_SUBJECT_MAPPING = (await import('../../lib/constants')).EXAM_SUBJECT_MAPPING;
                relevantSubjects = EXAM_SUBJECT_MAPPING[classKey] || EXAM_SUBJECT_MAPPING[exam] || ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
            } else {
                relevantSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
            }

            // 2. Initialize Stats
            const statsObj: Record<string, { total: number, master: number, scoreSum: number, count: number }> = {};
            
            const normUserClass = userCls ? userCls.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim() : '';
            const isComp = ['jee', 'neet'].some(e => exam.includes(e));
            const isDropper = normUserClass.includes('dropper');

            relevantSubjects.forEach(sub => {
                const classTopics = (SYLLABUS_DB[sub] || []).filter(t => {
                    if (!userCls) return true;
                    const normTopicClass = t.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                    if (isComp || isDropper) {
                        return normTopicClass === 'class 11' || normTopicClass === 'class 12';
                    }
                    return normTopicClass === normUserClass;
                });
                const totalTopics = classTopics.length || 10;
                statsObj[sub] = { total: totalTopics, master: 0, scoreSum: 0, count: 0 };
            });

            // 3. Syllabus Data
            const sylQ = query(collection(db, 'syllabus'), where('user_id', '==', user?.id));
            const sylSnap = await getDocs(sylQ);
            sylSnap.docs.forEach(doc => {
                const data = doc.data();
                if (statsObj[data.subject] && data.is_completed) {
                    const topicItem = (SYLLABUS_DB[data.subject] || []).find(t => t.topic === data.topic);
                    if (!userCls) {
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

            // 4. Calculate Syllabus Stats
            const fmtStats: any = {};
            relevantSubjects.forEach(subj => {
                const s = statsObj[subj];
                const completionPct = s.total > 0 ? Math.round((s.master / s.total) * 100) : 0;
                fmtStats[subj] = {
                    percentage: completionPct,
                    mastery: s.count > 0 ? Math.round(s.scoreSum / s.count) : 0,
                    source: 'syllabus'
                };
            });

            // 5. Fetch Mocks
            const mocksQ = query(collection(db, 'mock_attempts'), where('user_id', '==', user?.id), limit(100));
            const mockSnap = await getDocs(mocksQ);
            const cloudMocks = mockSnap.docs.map(d => ({ ...d.data(), source: 'cloud' }));

            let localMocks: any[] = [];
            try {
                localMocks = await storageService.getHistory(user?.id);
            } catch (jsonErr) {
                console.warn("Failed to parse local mocks", jsonErr);
            }

            // Helpers for filtering by class and exam
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

            // Merge & Normalise
            const mergedMocks: any[] = (Array.isArray(cloudMocks) ? cloudMocks as any[] : []).concat(Array.isArray(localMocks) ? localMocks : []);
            
            // Filter by active target exam and class boundaries
            const activeUserClass = user?.userClass || '';
            const activeUserExam = user?.targetExam || '';

            const filteredMocks = mergedMocks.filter((m: any) => {
                if (!m) return false;
                const attemptClass = m.user_class || m.userClass || '';
                if (!classesMatch(activeUserClass, attemptClass)) return false;
                if (!examsMatch(activeUserExam, m)) return false;
                return true;
            });

            const mocksToProcess: any[] = filteredMocks;
            const isSimulation = false;
            setIsDemoData(false);

            const rawMocksData = mocksToProcess
                .filter(m => m !== null)
                .map((m: any, i: number) => {
                    let inferredType = m.type;
                    if (!inferredType) {
                        // Legacy Data Heuristic
                        const qCount = Number(m.totalQuestions || m.total_questions || 0);
                        if (qCount > 0 && qCount <= 25) inferredType = 'quick';
                        else if (m.topic && m.topic.toLowerCase().includes('full mock')) inferredType = 'full';
                        else if (m.exam) inferredType = 'full'; // Fallback for real full mocks
                        else inferredType = 'quick';
                    }

                    // Resolve max score
                    let maxScore = m.total_marks || m.total;
                    if (!maxScore) {
                        const qCount = Number(m.total_questions || m.totalQuestions || 0);
                        if (qCount > 0) {
                            maxScore = qCount * 4;
                        } else {
                            // Heuristics based on exam/type
                            const examName = (m.exam_name || m.exam || user?.targetExam || '').toLowerCase();
                            const type = m.type || inferredType;
                            if (examName.includes('neet')) {
                                maxScore = type === 'full' ? 720 : 180;
                            } else if (examName.includes('jee')) {
                                maxScore = type === 'full' ? 300 : 100;
                            } else {
                                maxScore = 100;
                            }
                        }
                    }

                    // Normalize score
                    let norm = 0;
                    if (m.percentage !== undefined) {
                        norm = Number(m.percentage);
                    } else if (m.score !== undefined) {
                        if (maxScore > 0) {
                            norm = Math.round((Number(m.score) / maxScore) * 100);
                        } else {
                            norm = Number(m.score);
                        }
                    }

                    return {
                        ...m,
                        // Ensure valid date - Handle Firestore Timestamp or String
                        created_at: m.created_at?.toDate ? m.created_at.toDate().toISOString() : (m.created_at || m.date || new Date().toISOString()),
                        normalizedScore: norm,
                        maxScore: maxScore,
                        // Normalize Type
                        type: inferredType,
                        _sortId: i,
                        // Add stable ID for sort tie-breaking
                    };
                }).filter(m => m !== null && !isNaN(new Date(m.created_at).getTime()))
                .sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                    return (a._sortId || 0) - (b._sortId || 0);
                });

            setRawMocks(rawMocksData);

            // 6. Enriched Mastery
            const weak: string[] = [];
            const subjectMockScores: Record<string, { total: number, count: number }> = {};
            (Array.isArray(rawMocksData) ? rawMocksData : []).forEach((mock: any) => {
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

            relevantSubjects.forEach(subj => {
                const cal = user?.calibrationProfile;
                const subKey = subj.toLowerCase() === 'mathematics' || subj.toLowerCase() === 'math' ? 'math' : subj.toLowerCase();
                let eloRating = cal?.subjectRatings?.[subKey] || user?.abilityScore || 1000;
                
                // HEAL: If Math rating is stagnant at 1000 but Mathematics topic ELO is set, heal it!
                if (subKey === 'math' && eloRating === 1000 && cal?.topicRatings?.mathematics) {
                    eloRating = cal.topicRatings.mathematics;
                }
                const eloPercentile = EloService.calculatePercentile(eloRating);

                let percentage = fmtStats[subj].percentage;
                if (percentage === 0) {
                    if (subjectMockScores[subj]?.count > 0) {
                        const avg = Math.round(subjectMockScores[subj].total / subjectMockScores[subj].count);
                        percentage = avg;
                    }
                }

                // Blending formula: 30% syllabus/mock history, 70% live ELO mastery
                // If they have never completed a topic and never attempted any questions in this subject, show 0% Prepared
                let blended = 0;
                const hasHistory = percentage > 0 || (cal?.totalAttempts || 0) > 0 || isSimulation;
                if (hasHistory) {
                    blended = Math.round((percentage * 0.3) + (eloPercentile * 0.7));
                }

                fmtStats[subj] = {
                    percentage: blended,
                    mastery: eloPercentile,
                    source: 'blended-elo'
                };

                if (fmtStats[subj].percentage < 40) weak.push(subj);
            });

            setSubjectStats(fmtStats);

            // 7. ML WEAKNESS CLUSTERING
            const topicFailures: Record<string, number> = {};
            let criticalWeakness: string[] = [];

            if (isSimulation) {
                const exam = user?.targetExam?.toLowerCase() || '';
                if (exam.includes('neet') || exam.includes('medical')) {
                    criticalWeakness = ['Genetics & Evolution', 'Human Physiology', 'Rotational Dynamics', 'Chemical Bonding', 'Organic Chemistry Basics'];
                } else {
                    criticalWeakness = ['Rotational Motion', 'Definite Integrals', 'Electrostatics', 'Chemical Kinetics', 'Application of Derivatives'];
                }
            } else {
                localMocks.forEach((h: any) => {
                    if (h.weakTopics) {
                        h.weakTopics.forEach((t: string) => {
                            const cleanT = t.trim();
                            topicFailures[cleanT] = (topicFailures[cleanT] || 0) + 1;
                        });
                    }
                });

                criticalWeakness = Object.entries(topicFailures)
                    .filter(([_, count]) => count >= 2)
                    .sort((a, b) => b[1] - a[1])
                    .map(([topic]) => topic);
            }

            if (criticalWeakness.length > 0) setWeakAreas(criticalWeakness.slice(0, 5));

        } catch (e) {
            console.error("Fetch analytics failed", e);
        } finally {
            setLoading(false);
        }
    };

    // --- Filtering Logic ---
    const filteredData = useMemo(() => {
        if (!rawMocks.length) return [];

        const now = new Date();
        const cutoff = new Date();

        // 1. Time Filter
        // '1W', '2W', '1M', '3M', '6M', '1Y'
        switch (timeRange) {
            case '1W': cutoff.setDate(now.getDate() - 7); break;
            case '2W': cutoff.setDate(now.getDate() - 14); break;
            case '1M': cutoff.setMonth(now.getMonth() - 1); break;
            case '3M': cutoff.setMonth(now.getMonth() - 3); break;
            case '6M': cutoff.setMonth(now.getMonth() - 6); break;
            case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
        }

        let filtered = rawMocks.filter(m => new Date(m.created_at) >= cutoff);

        // 2. Type Filter
        if (testFilter !== 'all') {
            filtered = filtered.filter(m => m.type === testFilter);
        }

        return filtered;
    }, [rawMocks, timeRange, testFilter]);

    const visibleMocks = useMemo(() => {
        const limit = isMobileScreen ? 8 : 20;
        return (Array.isArray(filteredData) ? filteredData : []).slice(-limit);
    }, [filteredData, isMobileScreen]);

    const visibleScores = useMemo(() => {
        return visibleMocks.map(m => Math.min(100, Math.max(0, m.normalizedScore)));
    }, [visibleMocks]);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;


    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-6">
                    <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <BarChart3 size={40} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Unlock Your Performance Analytics</h2>
                        <p className="text-text-muted max-w-md mt-2">
                            Log in to track your mock test scores, identify weak areas, and get AI-predicted All India Ranks.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 animate-fade-in-up">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-main">Performance Analytics</h1>
                        <p className="text-xs sm:text-sm text-white/70">Real-time analysis of your diagnostic and mock history.</p>
                    </div>

                    {/* Main Controls */}
                    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 bg-surface/50 sm:bg-surface p-3 sm:p-2 rounded-2xl border border-border mt-4 md:mt-0 w-full sm:w-auto">
                        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
                            {/* Time Filter */}
                            <div className="flex flex-1 sm:flex-none items-center gap-1 bg-black/20 rounded-lg p-1">
                                {(['1W', '1M', '3M', '1Y'] as const).map((r) => (
                                    <button type="button"
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === r ? 'bg-primary text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block"></div>

                            {/* Visual Toggle */}
                            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 shrink-0">
                                <button type="button"
                                    onClick={() => setChartType('bar')}
                                    className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-secondary text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                                    title="Bar Chart"
                                >
                                    <BarChart3 size={16} />
                                </button>
                                <button type="button"
                                    onClick={() => setChartType('line')}
                                    className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-secondary text-white shadow-md' : 'text-white/60 hover:text-white'}`}
                                    title="Line Chart"
                                >
                                    <LineChart size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="w-[1px] h-6 bg-border mx-1 hidden sm:block"></div>

                        {/* Type Filter (Custom Dropdown) */}
                        <div className="w-full sm:w-44 relative z-30">
                            <CustomSelect
                                value={testFilter}
                                onChange={(val) => setTestFilter(val as any)}
                                options={[
                                    { value: 'quick', label: 'Quick Tests' },
                                    { value: 'full', label: 'Full Mocks' },
                                    { value: 'topic', label: 'Topic Tests' },
                                    { value: 'all', label: 'All Tests' }
                                ]}
                                placement="bottom"
                            />
                        </div>
                    </div>
                </header>

                {rawMocks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 text-center space-y-6 bg-gradient-to-br from-primary/10 via-surface to-secondary/5 border-primary/20 relative overflow-hidden my-6"
                    >
                        <div className="absolute top-0 right-0 size-32 bg-primary/10 blur-[80px] rounded-full" />
                        <div className="size-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                            <TrendingUp size={32} className="text-primary animate-pulse" />
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                            <h2 className="text-2xl font-bold text-text-main">No Test History Yet</h2>
                            <p className="text-sm text-text-muted leading-relaxed">
                                Take a 5-minute Quick Test or studied chapter practice in our Test Center to begin mapping your learning curves and All India Rank predictions!
                            </p>
                        </div>
                        <button type="button"
                            onClick={() => navigate('/dashboard/test-center')}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20 mx-auto block"
                        >
                            Start Your First Test
                        </button>
                    </motion.div>
                )}

                {/* Rank Predictor & Stats */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="w-full glass-card oxygen-card p-4 sm:p-6 space-y-6 flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-text-main">Performance Trends</h3>
                                    {isDemoData && (
                                        <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase tracking-widest animate-pulse">
                                            Simulated Baseline
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-white/70">
                                    {isDemoData 
                                        ? "Baseline calibration data. Take an active mock test to calibrate your actual performance curves." 
                                        : `Showing ${visibleScores.length} recent mock attempts.`}
                                </p>
                            </div>
                            {visibleScores.length > 0 && (
                                <div className="text-left sm:text-right shrink-0">
                                    <span className="text-2xl font-bold text-primary">{Math.round(visibleScores.reduce((a, b) => a + b, 0) / visibleScores.length)}%</span>
                                    <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Avg Score</p>
                                </div>
                            )}
                        </div>

                        <div className="h-[250px] relative w-full bg-black/20 rounded-xl border border-white/5 p-4">

                            {/* Grid Markings */}
                            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-[10px] text-white/50 font-mono">
                                {[100, 75, 50, 25, 0].map((mark) => (
                                    <div key={mark} className="w-full flex items-center gap-2 h-0">
                                        <span className="w-6 text-right shrink-0">{mark}%</span>
                                        <div className="flex-1 h-[1px] bg-border border-t border-dashed border-white/10"></div>
                                    </div>
                                ))}
                            </div>

                            {visibleScores.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted relative z-10">
                                    <p>No tests found for this filter.</p>
                                    <p className="text-sm mt-2 opacity-70">Try changing the time range or test type.</p>
                                </div>
                            ) : (
                                chartType === 'bar' ? (
                                    <div className="h-full flex gap-2 items-end relative z-10 pl-8">
                                        {visibleScores.map((value, i) => (
                                            <div key={i} className="flex-1 h-full flex items-end justify-center group relative">
                                                <div
                                                    className="bg-primary hover:bg-primary/90 transition-all rounded-t-sm w-[80%] max-w-[40px] relative min-h-[4px] border-t border-x border-primary/50"
                                                    style={{ height: `${Math.max(Number(value) || 0, 0)}%` }}
                                                >
                                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-text-main bg-surface border border-border px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                                        {value}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // SVG Line Chart
                                    <div className="h-full w-full relative pl-8 z-10">
                                        <div className="relative w-full h-full">
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>

                                                {(() => {
                                                    const width = 100;
                                                    const count = visibleScores.length;
                                                    if (count < 2) return null;

                                                    // Calculate coordinates once
                                                    const coordinates = visibleScores.map((score, i) => ({
                                                        x: (i / (count - 1)) * width,
                                                        y: 100 - score,
                                                        score
                                                    }));

                                                    const pointsStr = coordinates.map(c => `${c.x},${c.y}`).join(' ');

                                                    return (
                                                        <>
                                                            <polygon
                                                                points={`0,100 ${pointsStr} 100,100`}
                                                                fill="url(#lineColor)" // Keep opacity in defs or class
                                                                className="opacity-50"
                                                            />
                                                            <polyline
                                                                points={pointsStr}
                                                                fill="none"
                                                                stroke="var(--primary)"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                vectorEffect="non-scaling-stroke"
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </svg>

                                            {/* HTML Overlay Dots for Perfect Circles & Premium White Color Tooltips */}
                                            {(() => {
                                                const count = visibleScores.length;
                                                if (count < 2) return null;

                                                return visibleScores.map((score, i) => {
                                                    const x = (i / (count - 1)) * 100;
                                                    const y = 100 - score;

                                                    return (
                                                        <div
                                                            key={i}
                                                            className="absolute size-6 flex items-center justify-center cursor-pointer group z-20"
                                                            style={{
                                                                left: `${x}%`,
                                                                top: `${y}%`,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                        >
                                                            {/* Outer pulsing ring on hover */}
                                                            <div className="absolute inset-0 rounded-full bg-white/20 border border-white/30 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200" />
                                                            
                                                            {/* Inner Core Dot: Pure White */}
                                                            <div className="size-2.5 rounded-full bg-white border border-primary transition-all duration-200 group-hover:scale-125 shadow-[0_0_8px_rgba(255,255,255,1)]" />
                                                            
                                                            {/* Tooltip */}
                                                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-slate-900/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                                                {score}%
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Visual Knowledge Graph */}
                <div className="relative z-10 w-full">
                    <KnowledgeGraph />
                </div>

                {/* Hero Section: Rank Evolution */}
                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                            <TrendingUp className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter italic leading-tight">AIR Prediction Engine</h2>
                            <p className="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">Deep Learning v2.4 • 2026 Normalization Bias</p>
                        </div>
                    </div>
                    <div className="max-w-5xl">
                        <ScorePredictor />
                    </div>
                </div>

                {/* Section Separator */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                <div className="space-y-4">
                    <div className="flex items-end gap-3 px-2">
                        <BarChart3 className="text-accent mb-1" size={24} />
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Topic Proficiency</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Topic Mastery */}
                        <div className="glass-card oxygen-card p-6 space-y-6">
                            <h3 className="text-xl font-bold text-text-main">Topic Mastery</h3>
                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center text-text-muted bg-surface/50 rounded-xl">
                                    <Loader2 className="animate-spin mb-2" />
                                    <p>Loading subject data…</p>
                                </div>
                            ) : subjectStats && Object.keys(subjectStats).length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(subjectStats || {}).map(([subject, stats]: [string, any]) => {
                                        const percentage = stats.percentage || 0;
                                        return (
                                            <div key={subject} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-text-main">{subject}</span>
                                                    <span className={`font-bold ${percentage < 40 ? 'text-red-400' : 'text-green-400'}`}>{percentage}% Prepared</span>
                                                </div>
                                                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${percentage < 40 ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-text-muted bg-surface/50 rounded-xl border border-dashed border-border">
                                    <p>No subject data found.</p>
                                    <p className="text-sm mt-1">Check your target exam settings.</p>
                                </div>
                            )}
                        </div>

                        {/* Active Remedial Plan */}
                        <div className="glass-card p-6 overflow-hidden flex flex-col">
                            <h3 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                                Active Remedial Plan
                            </h3>

                            <div className="bg-surface/50 border border-border p-4 rounded-xl mb-4">
                                <p className="text-sm text-white/70 mb-3">
                                    {weakAreas.length > 0
                                        ? `You have ${weakAreas.length} weak areas requiring immediate attention.`
                                        : "You are doing well! Maintain your streak."}
                                </p>
                                <div
                                    className="block w-full text-center py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg transition-colors border border-primary/20"
                                >
                                    <Link to="/dashboard/study-plan" className="block w-full h-full">Generate Personalized Schedule</Link>
                                </div>
                            </div>

                            {weakAreas.length > 0 ? (
                                <div className="space-y-3 overflow-y-auto flex-1 max-h-[300px] pr-2">
                                    <p className="text-xs uppercase font-bold text-white/50">Recommended Crash Courses</p>
                                    {Array.isArray(weakAreas) && weakAreas.map(subject => (
                                        <a
                                            key={subject}
                                            href={`https://www.youtube.com/results?search_query=${user?.targetExam}+${subject}+Crash+Course`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group p-3 rounded-xl border border-border bg-surface hover:bg-red-500/10 hover:border-red-500 transition-all flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="font-bold text-text-main text-sm group-hover:text-red-400">{subject}</h4>
                                                <p className="text-[10px] text-white/50">High Priority • Watch Video</p>
                                            </div>
                                            <div className="text-red-500 opacity-50 group-hover:opacity-100">▶</div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-text-muted">
                                    <p>Keep completing syllabus topics to get recommendations!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-text-main">Recent Tests</h3>
                            {isDemoData && (
                                <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase tracking-widest">
                                    Simulated Run
                                </span>
                            )}
                        </div>
                        {visibleMocks.length === 0 ? (
                            <p className="text-white/60">No tests matching criteria.</p>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-white/60 text-xs uppercase tracking-wider border-b border-border">
                                                <th className="py-2 px-4 pb-3">Test &amp; Category</th>
                                                <th className="py-2 px-4 pb-3">Raw / Normalized Score</th>
                                                <th className="py-2 px-4 pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-text-main text-sm">
                                            {Array.isArray(visibleMocks) && visibleMocks.map((mock, i) => {
                                                const score = Math.min(100, Math.max(0, mock.normalizedScore));
                                                const title = mock.topic || mock.exam || 'Adaptive Practice Test';
                                                const dateStr = mock.created_at
                                                    ? new Date(mock.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—';
                                                const rawScoreStr = mock.score !== undefined
                                                    ? `${mock.score} / ${mock.maxScore || 100}`
                                                    : `${score}%`;
                                                const typeLabel = mock.type === 'quick'
                                                    ? 'Quick Test'
                                                    : mock.type === 'full'
                                                    ? 'Full Mock'
                                                    : mock.type === 'topic'
                                                    ? 'Topic Test'
                                                    : 'Practice';
                                                    
                                                return (
                                                    <tr key={mock.id || i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <p className="font-bold text-text-main">{title}</p>
                                                                <p className="text-[10px] text-white/50 mt-0.5">{dateStr} • {typeLabel}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 font-mono font-bold text-primary">{rawScoreStr}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                                score >= 75
                                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                    : score >= 45
                                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                            }`}>
                                                                {score >= 75 ? 'Mastered' : score >= 45 ? 'Developing' : 'Rebuilding'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="block sm:hidden space-y-3">
                                    {Array.isArray(visibleMocks) && visibleMocks.map((mock, i) => {
                                        const score = Math.min(100, Math.max(0, mock.normalizedScore));
                                        const title = mock.topic || mock.exam || 'Adaptive Practice Test';
                                        const dateStr = mock.created_at
                                            ? new Date(mock.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '—';
                                        const rawScoreStr = mock.score !== undefined
                                            ? `${mock.score} / ${mock.maxScore || 100}`
                                            : `${score}%`;
                                        const typeLabel = mock.type === 'quick'
                                            ? 'Quick Test'
                                            : mock.type === 'full'
                                            ? 'Full Mock'
                                            : mock.type === 'topic'
                                            ? 'Topic Test'
                                            : 'Practice';

                                        return (
                                            <div key={mock.id || i} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <p className="font-bold text-text-main text-sm line-clamp-1">{title}</p>
                                                        <p className="text-[10px] text-white/50 mt-0.5">{dateStr} • {typeLabel}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                                                        score >= 75
                                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                            : score >= 45
                                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                        {score >= 75 ? 'Mastered' : score >= 45 ? 'Developing' : 'Rebuilding'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                    <span className="text-xs text-white/50">Score</span>
                                                    <span className="font-mono font-bold text-primary text-sm">{rawScoreStr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AuthGate>
    );
};
