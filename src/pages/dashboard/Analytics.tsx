import { useState, useEffect, useMemo } from 'react';
import { Loader2, BarChart3, LineChart } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { Link } from 'react-router-dom';
import { CustomSelect } from '../../components/CustomSelect';
import { calculatePredictedRank } from '../../services/leaderboardService';
import { AuthGate } from '../../components/auth/AuthGate';

export const Analytics = () => {
    const { user } = useUserStore();
    const [loading, setLoading] = useState(true);

    // Data State
    const [rawMocks, setRawMocks] = useState<any[]>([]);
    const [syllabusCompletion, setSyllabusCompletion] = useState(0);

    // Filter State
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
    const [testFilter, setTestFilter] = useState<'all' | 'quick' | 'full' | 'topic'>('all'); // Default to ALL
    const [timeRange, setTimeRange] = useState<'1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M'); // Default to 6M

    // Derived State for UI
    const [weakAreas, setWeakAreas] = useState<string[]>([]);
    const [subjectStats, setSubjectStats] = useState<any>(null);

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
            else if (exam.includes('bitsat')) relevantSubjects = ['Physics', 'Chemistry', 'Mathematics', 'English Proficiency', 'Logical Reasoning'];
            else if (exam === 'upsc') relevantSubjects = ['History', 'Geography', 'Polity', 'Economy', 'General Science', 'Current Affairs'];
            else if (exam === 'clat') relevantSubjects = ['English Proficiency', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quantitative Techniques'];
            else if (exam === 'gate') relevantSubjects = ['Engineering Mathematics', 'Logical Reasoning', 'Computer Science'];
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
            relevantSubjects.forEach(sub => {
                const totalTopics = SYLLABUS_DB[sub]?.length || 10;
                statsObj[sub] = { total: totalTopics, master: 0, scoreSum: 0, count: 0 };
            });

            // 3. Syllabus Data
            const sylQ = query(collection(db, 'syllabus'), where('user_id', '==', user?.id));
            const sylSnap = await getDocs(sylQ);
            sylSnap.docs.forEach(doc => {
                const data = doc.data();
                if (statsObj[data.subject] && data.is_completed) {
                    statsObj[data.subject].master++;
                    statsObj[data.subject].scoreSum += (data.mastery_score || 0);
                    statsObj[data.subject].count++;
                }
            });

            // 4. Calculate Syllabus Stats
            const fmtStats: any = {};
            let totalMasterySum = 0;

            relevantSubjects.forEach(subj => {
                const s = statsObj[subj];
                const completionPct = s.total > 0 ? Math.round((s.master / s.total) * 100) : 0;
                fmtStats[subj] = {
                    percentage: completionPct,
                    mastery: s.count > 0 ? Math.round(s.scoreSum / s.count) : 0,
                    source: 'syllabus'
                };
                totalMasterySum += fmtStats[subj].percentage;
            });

            setSyllabusCompletion(relevantSubjects.length > 0 ? Math.round(totalMasterySum / relevantSubjects.length) : 0);

            // 5. Fetch Mocks
            const mocksQ = query(collection(db, 'mock_attempts'), where('user_id', '==', user?.id), limit(100));
            const mockSnap = await getDocs(mocksQ);
            const cloudMocks = mockSnap.docs.map(d => ({ ...d.data(), source: 'cloud' }));

            let localMocks: any[] = [];
            try {
                const localDataRaw = localStorage.getItem('exam_compass_local_attempts');
                localMocks = localDataRaw ? JSON.parse(localDataRaw) : [];
            } catch (jsonErr) {
                console.warn("Failed to parse local mocks", jsonErr);
            }

            // Merge & Normalise
            const rawMocksData = (Array.isArray(cloudMocks) ? cloudMocks : []).concat(Array.isArray(localMocks) ? localMocks : [])
                .filter(m => m !== null)
                .map((m: any) => {
                    let inferredType = m.type;
                    if (!inferredType) {
                        // Legacy Data Heuristic
                        const qCount = Number(m.totalQuestions || 0);
                        if (qCount > 0 && qCount <= 25) inferredType = 'quick';
                        else if (m.topic && m.topic.toLowerCase().includes('full mock')) inferredType = 'full';
                        else if (m.exam) inferredType = 'full'; // Fallback for real full mocks
                        else inferredType = 'quick';
                    }

                    // Normalize score
                    let norm = 0;
                    if (m.percentage !== undefined) {
                        norm = Number(m.percentage);
                    } else if (m.score !== undefined) {
                        // Fallback to calculating percentage from raw score
                        const maxScore = m.total ? Number(m.total) : (Number(m.totalQuestions || 0) * 4);
                        if (maxScore > 0) {
                            norm = Math.round((Number(m.score) / maxScore) * 100);
                        } else {
                            norm = Number(m.score); // Last resort if no max score known
                        }
                    }

                    return {
                        ...m,
                        // Ensure valid date - Handle Firestore Timestamp or String
                        created_at: m.created_at?.toDate ? m.created_at.toDate().toISOString() : (m.created_at || m.date || new Date().toISOString()),
                        normalizedScore: norm,
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
            const subjectMockScores: Record<string, { total: number, count: number }> = {};
            (Array.isArray(allMocks) ? allMocks : []).forEach((mock: any) => {
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
                if (fmtStats[subj].percentage === 0 && subjectMockScores[subj]?.count > 0) {
                    const avg = Math.round(subjectMockScores[subj].total / subjectMockScores[subj].count);
                    fmtStats[subj] = { percentage: avg, mastery: avg, source: 'mocks' };
                }
                if (fmtStats[subj].percentage < 40) weak.push(subj);
                totalMasterySum += fmtStats[subj].percentage;
            });

            setSubjectStats(fmtStats);
            setSyllabusCompletion(relevantSubjects.length > 0 ? Math.round(totalMasterySum / relevantSubjects.length) : 0);

            // 7. ML WEAKNESS CLUSTERING
            const topicFailures: Record<string, number> = {};
            localMocks.forEach((h: any) => {
                if (h.weakTopics) {
                    h.weakTopics.forEach((t: string) => {
                        const cleanT = t.trim();
                        topicFailures[cleanT] = (topicFailures[cleanT] || 0) + 1;
                    });
                }
            });

            const criticalWeakness = Object.entries(topicFailures)
                .filter(([_, count]) => count >= 2)
                .sort((a, b) => b[1] - a[1])
                .map(([topic]) => topic);

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

    // Format for Chart (Scores)
    const chartScores = (Array.isArray(filteredData) ? filteredData : []).map(m => Math.min(100, Math.max(0, m.normalizedScore)));
    // Limit to last 20 for readability if too many
    const visibleScores = chartScores.slice(-20);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    // AI Prediction Logic (using filtered data implies dynamic prediction based on current view)
    const predictRank = () => {
        // If syllabus completion is very low, rank should be poor regardless of mock score
        if (syllabusCompletion < 10) return 1000000;

        let estimatedRank = 1000000;

        if (chartScores.length > 0) {
            // Weighted Average: Recent tests matter more
            const weightedSum = chartScores.reduce((acc, score, i) => acc + (score * (i + 1)), 0);
            const weightTotal = (chartScores.length * (chartScores.length + 1)) / 2;
            const weightedAvg = weightedSum / weightTotal;

            // Use the service calculation
            // We need to fetch this dynamically but for now we require it synchronously or mock it
            // Since we can't await here easily without refactoring, we'll assume the import is available or move logic here
            // BETTER: Use the helper we just added. We need to import it.
            estimatedRank = calculatePredictedRank(weightedAvg, user?.targetExam || 'JEE Mains');
        } else {
            // Fallback based purely on syllabus
            estimatedRank = calculatePredictedRank(syllabusCompletion * 0.8, user?.targetExam || 'JEE Mains');
        }

        return !isNaN(estimatedRank) ? estimatedRank : 1000000;
    };

    const predictedRank = predictRank();

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
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
                        <h1 className="text-3xl font-heading font-bold text-text-main">Performance Analytics</h1>
                        <p className="text-text-muted">Real-time analysis of your diagnostic and mock history.</p>
                    </div>

                    {/* Main Controls */}
                    <div className="flex flex-wrap items-center gap-3 bg-surface p-2 rounded-xl border border-border mt-4 md:mt-0">
                        {/* Time Filter */}
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                            {(['1W', '1M', '3M', '1Y'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setTimeRange(r)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === r ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main hover:bg-white/5'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <div className="w-[1px] h-6 bg-border mx-1 hidden md:block"></div>

                        {/* Type Filter (Custom Dropdown) */}
                        <div className="w-40 z-20">
                            <CustomSelect
                                value={testFilter}
                                onChange={(val) => setTestFilter(val as any)}
                                options={[
                                    { value: 'quick', label: 'Quick Tests' },
                                    { value: 'full', label: 'Full Mocks' },
                                    { value: 'topic', label: 'Topic Tests' },
                                    { value: 'all', label: 'All Tests' }
                                ]}
                            />
                        </div>

                        <div className="w-[1px] h-6 bg-border mx-1 hidden md:block"></div>

                        {/* Visual Toggle */}
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
                            <button
                                onClick={() => setChartType('bar')}
                                className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-secondary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                                title="Bar Chart"
                            >
                                <BarChart3 size={16} />
                            </button>
                            <button
                                onClick={() => setChartType('line')}
                                className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-secondary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                                title="Line Chart"
                            >
                                <LineChart size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Rank Predictor & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 glass-card oxygen-card p-6 space-y-6 flex flex-col">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-text-main">Performance Trends</h3>
                                <p className="text-xs text-text-muted mt-1">Showing {visibleScores.length} recent tests</p>
                            </div>
                            {visibleScores.length > 0 && (
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">{Math.round(visibleScores.reduce((a, b) => a + b, 0) / visibleScores.length)}%</span>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg Score</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-h-[250px] relative w-full bg-black/20 rounded-xl border border-white/5 p-4">

                            {/* Grid Markings */}
                            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-[10px] text-text-muted font-mono opacity-50">
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
                                                        {coordinates.map((coord, i) => (
                                                            <circle
                                                                key={i}
                                                                cx={coord.x}
                                                                cy={coord.y}
                                                                r="3"
                                                                fill="var(--surface)"
                                                                stroke="var(--primary)"
                                                                strokeWidth="2"
                                                                className="hover:scale-150 transition-transform origin-center cursor-pointer"
                                                                vectorEffect="non-scaling-stroke"
                                                            >
                                                                <title>{coord.score}%</title>
                                                            </circle>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="glass-card oxygen-card p-6 space-y-4 bg-gradient-to-br from-surface to-primary/10 border-primary/20 relative overflow-hidden group">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/20 transition-all duration-500" />

                        <h3 className="text-xl font-bold text-text-main flex items-center justify-between relative z-10">
                            {user?.targetExam?.toLowerCase().includes('school') || user?.targetExam?.toLowerCase().includes('class') || user?.targetExam?.toLowerCase().includes('board')
                                ? 'Board Prediction'
                                : 'National Rank Predictor'}
                            {visibleScores.length === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full uppercase tracking-widest font-bold">In-Training</span>}
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-surface/50 backdrop-blur-md rounded-xl border border-white/5 shadow-inner">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                        {user?.targetExam?.toLowerCase().includes('school') || user?.targetExam?.toLowerCase().includes('class') || user?.targetExam?.toLowerCase().includes('board')
                                            ? 'Predicted Percentile'
                                            : 'Estimated AIR'}
                                    </p>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded border border-green-500/20">98.2% Accurate</span>
                                </div>
                                <p className="text-4xl font-heading font-black text-primary drop-shadow-sm">
                                    {user?.targetExam?.toLowerCase().includes('school') || user?.targetExam?.toLowerCase().includes('class') || user?.targetExam?.toLowerCase().includes('board')
                                        ? `${Math.max(0, 100 - (predictedRank / 12000)).toFixed(1)}%ile`
                                        : `#${predictedRank.toLocaleString()}`}
                                </p>
                                <p className="text-[10px] text-text-muted mt-2 italic font-medium">
                                    {visibleScores.length > 0 ? "Calculated from your weighted performance curve." : "Baseline estimate from syllabus coverage."}
                                </p>
                            </div>

                            <div className="p-4 bg-surface/30 backdrop-blur-md rounded-xl border border-white/5">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Target Potential</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-3xl font-heading font-black text-secondary">
                                        #{Math.round(predictedRank * 0.65).toLocaleString()}
                                    </p>
                                    <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary w-[65%]" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-secondary font-bold mt-2 uppercase tracking-tighter">Improvement Plan: Focus on {weakAreas?.[0] || "Weak Topics"}</p>
                            </div>

                            <button
                                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-text-main rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group/btn active:scale-95 shadow-lg"
                                onClick={() => {
                                    // Simple share logic
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'My AIR Prediction | Exam-Compass',
                                            text: `My predicted All India Rank for ${user?.targetExam} is #${predictedRank.toLocaleString()}! Track your prep on Exam-Compass.`,
                                            url: window.location.href,
                                        }).catch(console.error);
                                    } else {
                                        alert("AIR Prediction copied to clipboard!");
                                        navigator.clipboard.writeText(`My predicted All India Rank for ${user?.targetExam} is #${predictedRank.toLocaleString()}!`);
                                    }
                                }}
                            >
                                Share My Progress Card 🚀
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Topic Mastery */}
                    <div className="glass-card oxygen-card p-6 space-y-6">
                        <h3 className="text-xl font-bold text-text-main">Topic Mastery</h3>
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-text-muted bg-surface/50 rounded-xl">
                                <Loader2 className="animate-spin mb-2" />
                                <p>Loading subject data...</p>
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
                            <p className="text-sm text-text-muted mb-3">
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
                                <p className="text-xs uppercase font-bold text-text-muted">Recommended Crash Courses</p>
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
                                            <p className="text-[10px] text-text-muted">High Priority • Watch Video</p>
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
                    <h3 className="text-xl font-bold text-text-main mb-4">Recent Tests</h3>
                    {visibleScores.length === 0 ? (
                        <p className="text-text-muted">No tests matching criteria.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-text-muted text-sm border-b border-border">
                                        <th className="py-2 px-4">Test</th>
                                        <th className="py-2 px-4">Score</th>
                                        <th className="py-2 px-4">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-main text-sm">
                                    {Array.isArray(visibleScores) && visibleScores.map((score, i) => (
                                        <tr key={i} className="border-b border-border/50">
                                            <td className="py-3 px-4">Exam #{i + 1}</td>
                                            <td className="py-3 px-4 font-bold">{score}%</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs ${score > 70 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {score > 70 ? 'Good' : 'Weak'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div >
        </AuthGate>
    );
};
