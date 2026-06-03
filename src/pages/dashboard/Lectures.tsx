import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserStore } from '../../store/userStore';
import { SYLLABUS_DB, type SyllabusTopic } from '../../lib/constants';
import { getVideoByTopicIdCached, type Video } from '../../services/videoService';
import { getLibraryForChapter, discoverVideoForSubtopic } from '../../services/videoLibraryService';
import { scoreVideos, type ScoredVideo } from '../../services/videoScoringEngine';
import { SubtopicProgressService, type ChapterProgress, type ChapterState } from '../../services/subtopicProgressService';
import { SpacedRepetitionService, type ReviewCard } from '../../services/spacedRepetitionService';
import { getWeakTopics } from '../../services/topicStrengthService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import {
    Loader2, Play, CheckCircle2, Circle, Lock, AlertTriangle,
    ChevronDown, ChevronRight, BookOpen, Zap, RotateCcw,
    Target, TrendingUp, Brain, Video as VideoIcon, Clock,
    CheckCheck, Flame
} from 'lucide-react';

// ─── TYPES ─────────────────────────────────────────────────────────────────

type PacingMode = 'sequential' | 'high_yield';

interface ChapterVideos {
    oneShot: Video | null;        // Full chapter one-shot / complete lecture
    recap: Video | null;          // Previous chapter recap / short revision
    topicVideos: Video[];         // Topic-by-topic focused short videos
    loaded: boolean;
}

interface ActiveChapter {
    topic: SyllabusTopic;
    subject: string;
    videos: ChapterVideos;
    sm2Cards: ReviewCard[];
    progress: ChapterProgress | null;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<ChapterState, { label: string; color: string; icon: typeof CheckCircle2; glow: string }> = {
    locked:        { label: 'Locked',        color: 'text-gray-500',    icon: Lock,          glow: '' },
    next:          { label: 'Up Next',       color: 'text-amber-400',   icon: Target,        glow: 'ring-2 ring-amber-400/60' },
    in_progress:   { label: 'In Progress',   color: 'text-blue-400',    icon: TrendingUp,    glow: 'ring-2 ring-blue-400/40' },
    mastered:      { label: 'Mastered ✓',   color: 'text-emerald-400', icon: CheckCircle2,  glow: 'ring-2 ring-emerald-400/40' },
    review_needed: { label: '⚠ Review',     color: 'text-red-400',     icon: AlertTriangle, glow: 'ring-2 ring-red-400/60' },
};

const SUBJECT_COLORS: Record<string, string> = {
    Physics:     'from-blue-600/20 to-cyan-600/10 border-blue-500/30',
    Chemistry:   'from-purple-600/20 to-pink-600/10 border-purple-500/30',
    Mathematics: 'from-amber-600/20 to-orange-600/10 border-amber-500/30',
    Biology:     'from-emerald-600/20 to-teal-600/10 border-emerald-500/30',
};

const SUBJECT_ACCENT: Record<string, string> = {
    Physics: 'bg-blue-500',
    Chemistry: 'bg-purple-500',
    Mathematics: 'bg-amber-500',
    Biology: 'bg-emerald-500',
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export const Lectures = () => {
    const { user, authResolved } = useUserStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Derived user info
    const userId = user?.id || 'guest';
    const userClass = user?.userClass || 'Class 11th';
    const targetExam = user?.targetExam || 'JEE';
    const isClass12 = userClass.toLowerCase().includes('12');

    const [remainingDays, setRemainingDays] = useState<number | null>(null);

    useEffect(() => {
        const calculateRemainingDays = () => {
            const examDate = user?.examDate ? new Date(user.examDate) : null;
            const targetYear = user?.targetYear || new Date().getFullYear();
            if (examDate) {
                const diffTime = examDate.getTime() - Date.now();
                return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);
            if (isJunior) {
                const currentYear = new Date().getFullYear();
                const targetMonth = new Date().getMonth() > 2 ? currentYear + 1 : currentYear;
                const diff = new Date(`${targetMonth}-03-31`).getTime() - Date.now();
                return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            } else {
                let targetYr = targetYear;
                let examDateVal = new Date(`${targetYr}-01-24`);
                if (examDateVal.getTime() < Date.now()) {
                    targetYr = new Date().getFullYear() + 1;
                    examDateVal = new Date(`${targetYr}-01-24`);
                }
                const diff = examDateVal.getTime() - Date.now();
                return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
        };
        setRemainingDays(calculateRemainingDays());
    }, [user?.examDate, user?.targetYear, userClass]);

    // State
    const [activeSubject, setActiveSubject] = useState<string>('Physics');
    const [pacingMode, setPacingMode] = useState<PacingMode>('sequential');
    const [allProgress, setAllProgress] = useState<Record<string, ChapterProgress>>({});
    const [openChapterId, setOpenChapterId] = useState<string | null>(null);
    const [activeChapter, setActiveChapter] = useState<ActiveChapter | null>(null);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [weakTopicIds, setWeakTopicIds] = useState<Set<string>>(new Set());
    const [dueCardCount, setDueCardCount] = useState(0);
    const [initializing, setInitializing] = useState(true);

    const [videoMode, setVideoMode] = useState<'guided' | 'library'>('guided');
    const [libraryTab, setLibraryTab] = useState<'detailed' | 'quick' | 'topic' | 'pyq'>('detailed');
    const [libraryVideos, setLibraryVideos] = useState<ScoredVideo[]>([]);
    const [discoveringSubtopic, setDiscoveringSubtopic] = useState<string | null>(null);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [weakTopicsList, setWeakTopicsList] = useState<Array<{ topic: string; score_percentage: number }>>([]);

    // ─── SUBJECTS for this exam/class ──────────────────────────────────────

    const subjects = useMemo(() => {
        const exam = targetExam.toLowerCase();
        if (exam.includes('neet')) return ['Physics', 'Chemistry', 'Biology'];
        if (exam.includes('jee')) return ['Physics', 'Chemistry', 'Mathematics'];
        if (['class 8th', 'class 9th', 'class 10th'].some(c => userClass.toLowerCase().includes(c.replace('th', '').toLowerCase()))) {
            return ['Mathematics', 'Physics', 'Chemistry'];
        }
        return ['Physics', 'Chemistry', 'Mathematics'];
    }, [targetExam, userClass]);

    // ─── CHAPTERS for current subject (filtered by class) ──────────────────

    const getChapters = useCallback((subject: string): SyllabusTopic[] => {
        let chapters = SYLLABUS_DB[subject] || [];

        const isDropper = userClass.toLowerCase().includes('dropper');

        if (isDropper) {
            // For Droppers: Show both Class 11 and Class 12, sorted Class 11 first
            chapters = chapters.filter(t => t.class === 'Class 11' || t.class === 'Class 12');
            chapters = [...chapters].sort((a, b) => {
                if (a.class === b.class) return 0;
                return a.class === 'Class 11' ? -1 : 1;
            });
        } else {
            // Filter strictly by the user's specific class (8th to 12th)
            const classNum = userClass.includes('12') ? 'Class 12' :
                             userClass.includes('11') ? 'Class 11' :
                             userClass.includes('10') ? 'Class 10' :
                             userClass.includes('9')  ? 'Class 9'  :
                             userClass.includes('8')  ? 'Class 8'  : 'Class 11';
            chapters = chapters.filter(t => t.class === classNum);
        }

        if (pacingMode === 'high_yield') {
            // Sort by weightage: High → Medium → Low
            const order = { High: 0, Medium: 1, Low: 2 };
            chapters = [...chapters].sort((a, b) => order[a.weightage] - order[b.weightage]);
        }

        return chapters;
    }, [userClass, pacingMode]);

    // ─── INIT ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!authResolved) return;

        const init = async () => {
            setInitializing(true);

            // Fetch progress, weak topics, and SM2 due cards in parallel to minimize latency
            const cloudLoadPromise = SubtopicProgressService.loadFromCloud(userId);
            const weakPromise = getWeakTopics(userId, 20, user?.userClass, user?.targetExam).catch(() => []);
            const dueCardsPromise = SpacedRepetitionService.getDueCards(userId, 100).catch(() => ({ total_due: 0 }));

            const [_, weak, dueCards] = await Promise.all([
                cloudLoadPromise.catch(() => {}),
                weakPromise,
                dueCardsPromise
            ]);

            // Load all local progress
            const progress = SubtopicProgressService.getAllProgress(userId);
            setAllProgress(progress);

            // Set weak topics
            setWeakTopicsList(weak);
            const weakIds = new Set<string>(
                weak.map(w => w.topic.toLowerCase().replace(/\s+/g, '_'))
            );
            setWeakTopicIds(weakIds);

            // Flag weak chapters for review in progress service
            for (const w of weak) {
                const matchingTopic = Object.values(SYLLABUS_DB)
                    .flat()
                    .find(t => t.topic.toLowerCase().includes(w.topic.toLowerCase()));
                if (matchingTopic) {
                    await SubtopicProgressService.flagForReview(userId, matchingTopic.id);
                }
            }

            // Set SM2 due card count
            setDueCardCount(dueCards?.total_due || 0);

            // 5. Determine "next" chapter (first chapter of user's class with no progress)
            const visibleChapters = getChapters(activeSubject);
            const hasNextVisible = visibleChapters.some(c => progress[c.id]?.state === 'next' || progress[c.id]?.state === 'in_progress');
            if (!hasNextVisible) {
                const hasNoProgress = visibleChapters.find(c => !progress[c.id]);
                if (hasNoProgress) {
                    SubtopicProgressService.setChapterAsNext(userId, hasNoProgress.id);
                    setAllProgress(SubtopicProgressService.getAllProgress(userId));
                }
            }

            // 6. Handle deep links from URL parameters
            const subjectParam = searchParams.get('subject');
            const chapterParam = searchParams.get('chapter');
            if (subjectParam && subjects.includes(subjectParam)) {
                setActiveSubject(subjectParam);
                if (chapterParam) {
                    const chapterList = getChapters(subjectParam);
                    const matchedChapter = chapterList.find(c => c.id === chapterParam);
                    if (matchedChapter) {
                        setOpenChapterId(chapterParam);
                        setLoadingVideos(true);
                        const sm2Cards = SpacedRepetitionService.getCardsByTopic(userId, matchedChapter.topic);
                        const chapterProgress = progress[chapterParam] || null;
                        
                        setActiveChapter({
                            topic: matchedChapter,
                            subject: subjectParam,
                            videos: { oneShot: null, recap: null, topicVideos: [], loaded: false },
                            sm2Cards,
                            progress: chapterProgress
                        });

                        try {
                            const currentIdx = chapterList.findIndex(c => c.id === chapterParam);
                            const prevTopic = currentIdx > 0 ? chapterList[currentIdx - 1] : null;
                            
                            // Build class-aware queries using matched chapter's class
                            const classLabel = matchedChapter.class;
                            const oneShotQuery = `${matchedChapter.topic} ${targetExam} ${classLabel} full chapter complete one shot`;
                            const oneShotPlaylist = await getVideoByTopicIdCached(oneShotQuery, targetExam, 'anon', classLabel);
                            let recapVideo = null;
                            if (prevTopic) {
                                const recapQuery = `${prevTopic.topic} ${targetExam} ${prevTopic.class} quick revision recap`;
                                const recapPlaylist = await getVideoByTopicIdCached(recapQuery, targetExam, 'anon', prevTopic.class);
                                recapVideo = recapPlaylist?.videos?.[0] || null;
                            }
                            const topicVideos: Video[] = [];
                            for (const subtopic of matchedChapter.subtopics.slice(0, 3)) {
                                try {
                                    const subQuery = `${subtopic} ${matchedChapter.topic} ${targetExam} ${classLabel} explained`;
                                    const subPlaylist = await getVideoByTopicIdCached(subQuery, targetExam, 'anon', classLabel);
                                    if (subPlaylist?.videos?.[0]) {
                                        topicVideos.push(subPlaylist.videos[0]);
                                    }
                                } catch (e) { }
                            }
                            setActiveChapter(prev => prev ? {
                                ...prev,
                                videos: {
                                    oneShot: oneShotPlaylist?.videos?.[0] || null,
                                    recap: recapVideo,
                                    topicVideos,
                                    loaded: true
                                }
                            } : null);
                        } catch (e) {
                            setActiveChapter(prev => prev ? {
                                ...prev, videos: { oneShot: null, recap: null, topicVideos: [], loaded: true }
                            } : null);
                        }
                        setLoadingVideos(false);
                    }
                }
            }

            setInitializing(false);
        };

        init();
    }, [authResolved, userId, searchParams, subjects, getChapters, targetExam, activeSubject]);

    // ─── RELOAD PROGRESS ──────────────────────────────────────────────────

    const refreshProgress = () => {
        setAllProgress(SubtopicProgressService.getAllProgress(userId));
    };

    // ─── OPEN CHAPTER ─────────────────────────────────────────────────────

    const openChapter = async (topic: SyllabusTopic, subject: string) => {
        if (openChapterId === topic.id) {
            setOpenChapterId(null);
            setActiveChapter(null);
            return;
        }

        setOpenChapterId(topic.id);
        setLoadingVideos(true);

        // Get SM2 cards for this topic
        const sm2Cards = SpacedRepetitionService.getCardsByTopic(userId, topic.topic);
        const progress = allProgress[topic.id] || null;

        setActiveChapter({
            topic,
            subject,
            videos: { oneShot: null, recap: null, topicVideos: [], loaded: false },
            sm2Cards,
            progress
        });

        // Load the 3 types of videos using chapter's own class to isolate grade caching
        try {
            const chapters = getChapters(subject);
            const currentIdx = chapters.findIndex(c => c.id === topic.id);
            const prevTopic = currentIdx > 0 ? chapters[currentIdx - 1] : null;

            const classLabel = topic.class;

            // 1. One-shot: Full chapter complete lecture
            const oneShotQuery = `${topic.topic} ${targetExam} ${classLabel} full chapter complete one shot`;
            const oneShotPlaylist = await getVideoByTopicIdCached(oneShotQuery, targetExam, 'anon', classLabel);
            let oneShotVideo: Video | null = oneShotPlaylist?.videos?.[0] || null;

            // 2. Recap: Previous chapter quick revision (if exists)
            let recapVideo: Video | null = null;
            if (prevTopic) {
                const recapQuery = `${prevTopic.topic} ${targetExam} ${prevTopic.class} quick revision recap`;
                const recapPlaylist = await getVideoByTopicIdCached(recapQuery, targetExam, 'anon', prevTopic.class);
                recapVideo = recapPlaylist?.videos?.[0] || null;
            }

            // 3. Topic-by-topic: Focused subtopic-level videos
            const topicVideos: Video[] = [];
            for (const subtopic of topic.subtopics.slice(0, 3)) {
                try {
                    const subQuery = `${subtopic} ${topic.topic} ${targetExam} ${classLabel} explained`;
                    const subPlaylist = await getVideoByTopicIdCached(subQuery, targetExam, 'anon', classLabel);
                    if (subPlaylist?.videos?.[0]) {
                        topicVideos.push(subPlaylist.videos[0]);
                    }
                } catch (e) { /* skip */ }
            }

            // If YouTube search failed or returned empty (e.g. quota exhausted), fall back to D1/static library
            if (!oneShotVideo || topicVideos.length === 0) {
                console.log(`[Lectures] Empty results from YouTube API. Pulling fallbacks from D1/static for: ${topic.topic}`);
                try {
                    const fallbackVideos = await getLibraryForChapter(topic.id, targetExam, subject, classLabel, false);
                    if (fallbackVideos && fallbackVideos.length > 0) {
                        if (!oneShotVideo) {
                            oneShotVideo = fallbackVideos.find(v => v.type === 'oneshot' || v.type === 'detailed') || fallbackVideos[0] || null;
                        }
                        if (topicVideos.length === 0) {
                            const subtopicVideos = fallbackVideos.filter(v => v.type === 'topic_wise');
                            if (subtopicVideos.length > 0) {
                                topicVideos.push(...subtopicVideos.slice(0, 3));
                            } else {
                                const extraVideos = fallbackVideos.filter(v => v.id !== oneShotVideo?.id);
                                topicVideos.push(...extraVideos.slice(0, 3));
                            }
                        }
                    }
                } catch (fallbackErr) {
                    console.error('[Lectures] Guided sequence fallback fetch failed:', fallbackErr);
                }
            }

            setActiveChapter(prev => prev ? {
                ...prev,
                videos: {
                    oneShot: oneShotVideo,
                    recap: recapVideo,
                    topicVideos,
                    loaded: true
                }
            } : null);

        } catch (e) {
            console.error('[Lectures] Video load error:', e);
            // Final fallback: try loading any video from D1 for this chapter
            try {
                const fallbackVideos = await getLibraryForChapter(topic.id, targetExam, subject, topic.class, false);
                const fallbackOne = fallbackVideos[0]?.id ? fallbackVideos[0] as Video : null;
                setActiveChapter(prev => prev ? {
                    ...prev, videos: { oneShot: fallbackOne, recap: null, topicVideos: [], loaded: true }
                } : null);
            } catch {
                setActiveChapter(prev => prev ? {
                    ...prev, videos: { oneShot: null, recap: null, topicVideos: [], loaded: true }
                } : null);
            }
        }

        setLoadingVideos(false);
    };

    // Load library videos when chapter opens or mode switches to library (class-aware)
    useEffect(() => {
        if (!openChapterId || videoMode !== 'library' || !activeChapter) return;

        const loadLibrary = async () => {
            setLoadingLibrary(true);
            try {
                const chClass = activeChapter.topic.class;
                const libVideos = await getLibraryForChapter(
                    openChapterId,
                    targetExam,
                    activeSubject,
                    chClass
                );
                // Score them
                const scored = scoreVideos(
                    libVideos,
                    userId,
                    openChapterId,
                    null,
                    chClass,
                    targetExam,
                    weakTopicsList
                );
                setLibraryVideos(scored);
            } catch (e) {
                console.error('[Lectures] Failed to load library videos:', e);
            } finally {
                setLoadingLibrary(false);
            }
        };

        loadLibrary();
    }, [openChapterId, videoMode, targetExam, activeSubject, activeChapter?.topic.class, userId, weakTopicsList, activeChapter]);

    // ─── SUBTOPIC TOGGLE ──────────────────────────────────────────────────

    const toggleSubtopic = async (topicId: string, subtopic: string, totalSubtopics: number) => {
        await SubtopicProgressService.toggleSubtopic(userId, topicId, subtopic, totalSubtopics);
        refreshProgress();
        if (activeChapter?.topic.id === topicId) {
            setActiveChapter(prev => prev ? {
                ...prev,
                progress: SubtopicProgressService.getChapterProgress(userId, topicId)
            } : null);
        }
    };

    // ─── NAVIGATE TO VIDEO ─────────────────────────────────────────────────

    const watchVideo = async (video: Video, topicId: string) => {
        await SubtopicProgressService.markVideoWatched(userId, topicId, video.id);
        refreshProgress();
        navigate(`/dashboard/lectures/chapter/${topicId}?videoId=${video.id}`);
    };

    // ─── DISCOVER VIDEO CALLBACK ───────────────────────────────────────────

    const handleDiscoverVideo = async (topicId: string, subtopic: string, subject: string) => {
        if (!activeChapter) return;
        setDiscoveringSubtopic(subtopic);
        try {
            const chClass = activeChapter.topic.class;
            await discoverVideoForSubtopic(topicId, subtopic, targetExam, subject, chClass);
            const libVideos = await getLibraryForChapter(topicId, targetExam, subject, chClass, true);
            const scored = scoreVideos(libVideos, userId, topicId, subtopic, chClass, targetExam, weakTopicsList);
            setLibraryVideos(scored);
        } catch (e) {
            console.error('[Lectures] Failed to discover video:', e);
        } finally {
            setDiscoveringSubtopic(null);
        }
    };

    // ─── CHAPTER STATE DISPLAY ────────────────────────────────────────────

    const getEffectiveState = (topic: SyllabusTopic, index: number): ChapterState => {
        const p = allProgress[topic.id];

        if (pacingMode === 'sequential') {
            // Under sequential study mode, lock any chapter if there is a preceding chapter that is not mastered
            for (let i = 0; i < index; i++) {
                const prevTopic = chapters[i];
                const prevProgress = allProgress[prevTopic.id];
                if (!prevProgress || prevProgress.state !== 'mastered') {
                    return 'locked';
                }
            }
            // If all preceding chapters are mastered, this chapter is unlocked (state is next if no progress, else keep in_progress/review_needed)
            if (!p) {
                return 'next';
            }
            return p.state === 'locked' ? 'next' : p.state;
        }

        if (!p) {
            return 'locked';
        }
        return p.state;
    };

    // ─── SUBJECT MASTERY % ────────────────────────────────────────────────

    const getSubjectMastery = (subject: string): number => {
        const topicIds = getChapters(subject).map(t => t.id);
        return SubtopicProgressService.getSubjectMastery(userId, topicIds);
    };

    // ─── LOADING ──────────────────────────────────────────────────────────

    if (initializing) {
        return (
            <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
                <div className="relative">
                    <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Brain className="absolute inset-0 m-auto text-primary" size={20} />
                </div>
                <p className="text-text-muted animate-pulse">Loading your learning journey…</p>
            </div>
        );
    }

    const chapters = getChapters(activeSubject);

    return (
        <>
            <SEO 
                title={`Lectures — ${targetExam} | ExamCompass`} 
                description="Master your subject sequentially chapter-by-chapter with a dedicated 3-video sequence, subtopic checklist, active recall, and SM-2 spaced repetition." 
            />
            <div className="space-y-6 pb-16 animate-fade-in-up">

                {/* ── HEADER ── */}
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent border border-white/10 overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-white mb-1">
                                Your Learning Journey
                            </h1>
                            <p className="text-white/60 text-sm">
                                Study one chapter at a time. Master it before moving ahead.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* SM2 Due Cards Badge */}
                            {dueCardCount > 0 && (
                                <Link
                                    to="/dashboard/revision"
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                                >
                                    <Brain size={14} />
                                    {dueCardCount} revision cards due
                                </Link>
                            )}
                            {/* Pacing Mode Toggle */}
                            <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                <button type="button"
                                    onClick={() => setPacingMode('sequential')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        pacingMode === 'sequential'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-white/50 hover:text-white/80'
                                    }`}
                                >
                                    📚 Sequential
                                </button>
                                <button type="button"
                                    onClick={() => setPacingMode('high_yield')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        pacingMode === 'high_yield'
                                            ? 'bg-amber-500 text-white shadow-md'
                                            : 'text-white/50 hover:text-white/80'
                                    }`}
                                >
                                    ⚡ High-Yield
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pacing suggestion banner */}
                    {remainingDays !== null && remainingDays < 200 && pacingMode === 'sequential' && (
                        <div className="mt-4 flex items-center gap-2 text-amber-300 text-xs bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2">
                            <Flame size={12} />
                            <span>
                                {remainingDays} days to exam. Switch to <strong>High-Yield</strong> mode to prioritize high-weightage chapters first.
                            </span>
                            <button type="button"
                                onClick={() => setPacingMode('high_yield')}
                                className="ml-auto underline underline-offset-2 hover:text-amber-200"
                            >
                                Switch
                            </button>
                        </div>
                    )}

                    <div className="absolute -right-16 -top-16 size-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                </div>

                {/* ── SUBJECT TABS ── */}
                <div className="flex gap-2 flex-wrap">
                    {subjects.map(subj => {
                        const mastery = getSubjectMastery(subj);
                        const isActive = activeSubject === subj;
                        return (
                            <button type="button"
                                key={subj}
                                onClick={() => { setActiveSubject(subj); setOpenChapterId(null); setActiveChapter(null); }}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                                    isActive
                                        ? `bg-gradient-to-r ${SUBJECT_COLORS[subj]} border-opacity-80 text-white shadow-lg`
                                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10'
                                }`}
                            >
                                <span>{subj}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                                }`}>
                                    {mastery}%
                                </span>
                                {/* Mastery bar at bottom */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-white/10">
                                        <div
                                            className={`h-full rounded-full ${SUBJECT_ACCENT[subj] || 'bg-primary'} transition-all duration-700`}
                                            style={{ width: `${mastery}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>


                {/* ── CHAPTER LEGEND ── */}
                <div className="flex flex-wrap gap-3 text-xs text-white/50">
                    {Object.entries(STATE_CONFIG).map(([state, cfg]) => (
                        <span key={state} className={`flex items-center gap-1 ${cfg.color}`}>
                            <cfg.icon size={12} />
                            {cfg.label}
                        </span>
                    ))}
                    <span className="ml-auto text-white/30">
                        {chapters.filter(c => allProgress[c.id]?.state === 'mastered').length} / {chapters.length} mastered
                    </span>
                </div>

                {/* ── CHAPTER LIST ── */}
                <div className="space-y-3">
                    {chapters.map((topic, idx) => {
                        const state = getEffectiveState(topic, idx);
                        const progress = allProgress[topic.id];
                        const cfg = STATE_CONFIG[state];
                        const isOpen = openChapterId === topic.id;
                        const checkedCount = progress?.checkedSubtopics.length || 0;
                        const totalSubs = topic.subtopics.length;
                        const completionPct = totalSubs > 0 ? Math.round((checkedCount / totalSubs) * 100) : 0;
                        const isWeak = weakTopicIds.has(topic.id) || state === 'review_needed';
                        const sm2ForTopic = SpacedRepetitionService.getCardsByTopic(userId, topic.topic);

                        return (
                            <div
                                key={topic.id}
                                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                    state === 'locked'
                                        ? 'bg-white/2 border-white/5 opacity-50'
                                        : `glass-card bg-white/5 border-white/10 ${cfg.glow}`
                                }`}
                            >
                                {/* Chapter Header Row */}
                                <button type="button"
                                    onClick={() => state !== 'locked' && openChapter(topic, activeSubject)}
                                    disabled={state === 'locked'}
                                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors disabled:cursor-not-allowed"
                                >
                                    {/* Chapter number */}
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        state === 'mastered' ? 'bg-emerald-500/20 text-emerald-400' :
                                        state === 'next' ? 'bg-amber-500/20 text-amber-400' :
                                        state === 'review_needed' ? 'bg-red-500/20 text-red-400' :
                                        state === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-white/10 text-white/30'
                                    }`}>
                                        {state === 'mastered' ? <CheckCircle2 size={14} /> :
                                         state === 'locked' ? <Lock size={12} /> :
                                         idx + 1}
                                    </div>

                                    {/* Topic info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className={`font-semibold text-sm ${
                                                state === 'locked' ? 'text-white/30' :
                                                state === 'mastered' ? 'text-emerald-300' : 'text-white'
                                            }`}>
                                                {topic.topic}
                                            </h3>
                                            {/* Badges */}
                                            {/* Class badge: shows Class 11/12 to avoid confusion in JEE (both classes shown together) */}
                                            {(targetExam.toLowerCase().includes('jee') || targetExam.toLowerCase().includes('neet')) && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${
                                                    topic.class === 'Class 12'
                                                        ? 'bg-violet-500/15 text-violet-400 border-violet-400/20'
                                                        : 'bg-sky-500/15 text-sky-400 border-sky-400/20'
                                                }`}>
                                                    {topic.class}
                                                </span>
                                            )}
                                            {topic.weightage === 'High' && state !== 'mastered' && (
                                                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded-md border border-red-400/20">
                                                    High Weightage
                                                </span>
                                            )}
                                            {state === 'next' && (
                                                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-400/20 animate-pulse">
                                                    → Study This Now
                                                </span>
                                            )}
                                            {isWeak && state !== 'mastered' && (
                                                <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded-md border border-orange-400/20">
                                                    Weak in Tests
                                                </span>
                                            )}
                                            {sm2ForTopic.length > 0 && (
                                                <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-md border border-purple-400/20">
                                                    💡 {sm2ForTopic.length} SM2 due
                                                </span>
                                            )}
                                        </div>
                                        {/* Progress bar for in-progress chapters */}
                                        {(state === 'in_progress' || state === 'mastered') && completionPct > 0 && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            state === 'mastered' ? 'bg-emerald-400' : 'bg-blue-400'
                                                        }`}
                                                        style={{ width: `${completionPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-white/40">{checkedCount}/{totalSubs}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtopic count + expand icon */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-white/30 hidden sm:block">
                                            {totalSubs} subtopics
                                        </span>
                                        {state !== 'locked' && (
                                            isOpen
                                                ? <ChevronDown size={16} className="text-white/40" />
                                                : <ChevronRight size={16} className="text-white/40" />
                                        )}
                                    </div>
                                </button>

                                {/* ── EXPANDED CHAPTER PANEL ── */}
                                {isOpen && (
                                    <div className="border-t border-white/5 animate-fade-in-up">

                                        {/* SM2 Review Cards Alert */}
                                        {activeChapter?.sm2Cards && activeChapter.sm2Cards.length > 0 && (
                                            <div className="mx-4 mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-start gap-3">
                                                <Brain size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-purple-300 text-sm font-medium">
                                                        💡 Spaced Repetition Due
                                                    </p>
                                                    <p className="text-purple-300/70 text-xs mt-0.5">
                                                        You have {activeChapter.sm2Cards.length} past mistake{activeChapter.sm2Cards.length > 1 ? 's' : ''} from mock tests scheduled for review in this chapter.
                                                    </p>
                                                </div>
                                                <Link
                                                    to="/dashboard/revision"
                                                    className="text-xs px-3 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors whitespace-nowrap"
                                                >
                                                    Review Now
                                                </Link>
                                            </div>
                                        )}

                                        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">

                                            {/* LEFT: Subtopic Checklist */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                                    <BookOpen size={14} />
                                                    Subtopics Checklist
                                                    <span className="text-xs text-white/40 font-normal">
                                                        ({checkedCount}/{totalSubs} done)
                                                    </span>
                                                </h4>
                                                <div className="space-y-2">
                                                    {topic.subtopics.map(sub => {
                                                        const isChecked = progress?.checkedSubtopics.includes(sub) || false;
                                                        return (
                                                            <button type="button"
                                                                key={sub}
                                                                onClick={() => toggleSubtopic(topic.id, sub, totalSubs)}
                                                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-sm text-left transition-all ${
                                                                    isChecked
                                                                        ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-300'
                                                                        : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                            >
                                                                {isChecked
                                                                    ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                                    : <Circle size={14} className="text-white/30 shrink-0" />
                                                                }
                                                                <span>{sub}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Prerequisites notice */}
                                                {topic.prerequisites && topic.prerequisites.length > 0 && (
                                                    <div className="text-xs text-white/30 flex items-center gap-1 pt-1">
                                                        <Lock size={10} />
                                                        Prerequisite: {topic.prerequisites.join(', ')}
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="mt-2 flex gap-2">
                                                    <Link
                                                        to={`/dashboard/lectures/chapter/${topic.id}`}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600/25 border border-violet-500/40 rounded-xl text-violet-300 text-sm font-semibold hover:bg-violet-600/40 transition-all shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_-3px_rgba(139,92,246,0.5)]"
                                                    >
                                                        <Play size={13} fill="currentColor" />
                                                        Full Study Page
                                                    </Link>
                                                    <Link
                                                        to={`/dashboard/mock?topic=${encodeURIComponent(topic.topic)}`}
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                                                    >
                                                        <Zap size={14} />
                                                        Test
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* RIGHT: Video System */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                                    <VideoIcon size={14} />
                                                    {videoMode === 'library' ? 'Curated Video Library' : 'Recommended Videos'}
                                                </h4>

                                                {isClass12 && (
                                                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                                                        <button type="button"
                                                            onClick={() => setVideoMode('guided')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                                                                videoMode === 'guided'
                                                                    ? 'bg-primary text-white shadow-md'
                                                                    : 'text-white/50 hover:text-white/80'
                                                            }`}
                                                        >
                                                            🎬 Guided Sequence
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => setVideoMode('library')}
                                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                                                                videoMode === 'library'
                                                                    ? 'bg-primary text-white shadow-md'
                                                                    : 'text-white/50 hover:text-white/80'
                                                            }`}
                                                        >
                                                            📚 Curated Library
                                                        </button>
                                                    </div>
                                                )}

                                                {videoMode === 'library' && isClass12 ? (
                                                    loadingLibrary ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <Loader2 className="animate-spin text-primary" size={24} />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3 mt-2">
                                                            <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                                                <button type="button"
                                                                    onClick={() => setLibraryTab('detailed')}
                                                                    className={`py-1.5 rounded-lg text-center text-[10px] sm:text-xs font-medium transition-all ${
                                                                        libraryTab === 'detailed'
                                                                            ? 'bg-white/10 text-white font-semibold'
                                                                            : 'text-white/50 hover:text-white/80'
                                                                    }`}
                                                                >
                                                                    📖 Detailed
                                                                </button>
                                                                <button type="button"
                                                                    onClick={() => setLibraryTab('quick')}
                                                                    className={`py-1.5 rounded-lg text-center text-[10px] sm:text-xs font-medium transition-all ${
                                                                        libraryTab === 'quick'
                                                                            ? 'bg-white/10 text-white font-semibold'
                                                                            : 'text-white/50 hover:text-white/80'
                                                                    }`}
                                                                >
                                                                    ⚡ Revision
                                                                </button>
                                                                <button type="button"
                                                                    onClick={() => setLibraryTab('topic')}
                                                                    className={`py-1.5 rounded-lg text-center text-[10px] sm:text-xs font-medium transition-all ${
                                                                        libraryTab === 'topic'
                                                                            ? 'bg-white/10 text-white font-semibold'
                                                                            : 'text-white/50 hover:text-white/80'
                                                                    }`}
                                                                >
                                                                    🎯 Topics
                                                                </button>
                                                                <button type="button"
                                                                    onClick={() => setLibraryTab('pyq')}
                                                                    className={`py-1.5 rounded-lg text-center text-[10px] sm:text-xs font-medium transition-all ${
                                                                        libraryTab === 'pyq'
                                                                            ? 'bg-white/10 text-white font-semibold'
                                                                            : 'text-white/50 hover:text-white/80'
                                                                    }`}
                                                                >
                                                                    📝 PYQs
                                                                </button>
                                                            </div>

                                                            {/* Subtab Contents */}
                                                            {libraryTab === 'topic' ? (
                                                                <div className="space-y-4">
                                                                    {topic.subtopics.map(subtopicName => {
                                                                        const subtopicVideos = libraryVideos.filter(v => {
                                                                            const type = getVideoType(v.video);
                                                                            if (type !== 'topic_wise') return false;
                                                                            
                                                                            const vSub = (v.video as any).subtopic;
                                                                            if (vSub && vSub.toLowerCase() === subtopicName.toLowerCase()) return true;
                                                                            const title = v.video.title.toLowerCase();
                                                                            const cleanSub = subtopicName.toLowerCase();
                                                                            return title.includes(cleanSub) || cleanSub.split(' ').filter(w => w.length > 3).some(w => title.includes(w));
                                                                        });

                                                                        const isDiscovering = discoveringSubtopic === subtopicName;

                                                                        return (
                                                                            <div key={subtopicName} className="p-3 rounded-xl border border-white/5 bg-white/2 space-y-2">
                                                                                <div className="flex items-center justify-between gap-3">
                                                                                    <span className="text-xs font-semibold text-white/80">{subtopicName}</span>
                                                                                    {subtopicVideos.length === 0 && (
                                                                                        <button type="button"
                                                                                            onClick={() => handleDiscoverVideo(topic.id, subtopicName, activeSubject)}
                                                                                            disabled={discoveringSubtopic !== null}
                                                                                            className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all font-medium ${
                                                                                                isDiscovering ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                                                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                                        >
                                                                                            {isDiscovering ? (
                                                                                                <>
                                                                                                    <Loader2 size={10} className="animate-spin" />
                                                                                                    Finding...
                                                                                                </>
                                                                                            ) : (
                                                                                                <>🔍 Find Best Video</>
                                                                                            )}
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {subtopicVideos.length > 0 ? (
                                                                                    <div className="space-y-2 pt-1">
                                                                                        {subtopicVideos.map(v => (
                                                                                            <LibraryVideoCard
                                                                                                key={v.video.id}
                                                                                                scoredVideo={v}
                                                                                                isWatched={progress?.videosWatched.includes(v.video.id) || false}
                                                                                                onWatch={() => watchVideo(
                                                                                                    v.video as Video,
                                                                                                    topic.id
                                                                                                )}
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    !isDiscovering && <p className="text-[10px] text-white/30 italic">No focused mini-lecture cached.</p>
                                                                                )}

                                                                                {isDiscovering && (
                                                                                    <div className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[10px] text-amber-300 animate-pulse">
                                                                                        <Loader2 size={10} className="animate-spin shrink-0" />
                                                                                        <span>Searching top channels and running quality ranking…</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {libraryVideos.filter(v => {
                                                                        const type = getVideoType(v.video);
                                                                        if (libraryTab === 'detailed') return type === 'detailed' || type === 'oneshot';
                                                                        if (libraryTab === 'quick') return type === 'quick_revision';
                                                                        if (libraryTab === 'pyq') return type === 'pyq';
                                                                        return false;
                                                                    }).length > 0 ? (
                                                                        libraryVideos.filter(v => {
                                                                            const type = getVideoType(v.video);
                                                                            if (libraryTab === 'detailed') return type === 'detailed' || type === 'oneshot';
                                                                            if (libraryTab === 'quick') return type === 'quick_revision';
                                                                            if (libraryTab === 'pyq') return type === 'pyq';
                                                                            return false;
                                                                        }).map(v => (
                                                                            <LibraryVideoCard
                                                                                key={v.video.id}
                                                                                scoredVideo={v}
                                                                                isWatched={progress?.videosWatched.includes(v.video.id) || false}
                                                                                onWatch={() => watchVideo(
                                                                                    v.video as Video,
                                                                                    topic.id
                                                                                )}
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-center py-8 text-white/30 text-xs">
                                                                            <VideoIcon size={20} className="mx-auto mb-2 opacity-40" />
                                                                            <p>No videos found in this category.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                ) : (
                                                    loadingVideos ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <Loader2 className="animate-spin text-primary" size={24} />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {/* Video 1: One-Shot Full Chapter */}
                                                            {activeChapter?.videos.oneShot && (
                                                                <VideoCard
                                                                    video={activeChapter.videos.oneShot}
                                                                    label="📹 Full One-Shot"
                                                                    sublabel="Complete chapter in one video"
                                                                    accent="border-blue-400/30 bg-blue-500/5"
                                                                    isWatched={progress?.videosWatched.includes(activeChapter.videos.oneShot.id) || false}
                                                                    onWatch={() => watchVideo(
                                                                        activeChapter.videos.oneShot!,
                                                                        topic.id
                                                                    )}
                                                                />
                                                            )}

                                                            {/* Video 2: Previous Chapter Recap */}
                                                            {activeChapter?.videos.recap && (
                                                                <VideoCard
                                                                    video={activeChapter.videos.recap}
                                                                    label="🔄 Previous Chapter Recap"
                                                                    sublabel="Quick revision before starting"
                                                                    accent="border-amber-400/30 bg-amber-500/5"
                                                                    isWatched={progress?.videosWatched.includes(activeChapter.videos.recap.id) || false}
                                                                    onWatch={() => watchVideo(
                                                                        activeChapter.videos.recap!,
                                                                        topic.id
                                                                    )}
                                                                />
                                                            )}

                                                            {/* Video 3: Topic-by-topic focused */}
                                                            {activeChapter?.videos.topicVideos && activeChapter.videos.topicVideos.length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs text-white/40 flex items-center gap-1">
                                                                        <Target size={10} />
                                                                        Subtopic-focused videos
                                                                    </p>
                                                                    {activeChapter.videos.topicVideos.map((v, i) => (
                                                                        <VideoCard
                                                                            key={`${v.id}-${i}`}
                                                                            video={v}
                                                                            label={`🎯 ${topic.subtopics[i] || 'Focus Video'}`}
                                                                            sublabel="Deep dive on one concept"
                                                                            accent="border-emerald-400/20 bg-emerald-500/5"
                                                                            isWatched={progress?.videosWatched.includes(v.id) || false}
                                                                            onWatch={() => watchVideo(
                                                                                v,
                                                                                topic.id
                                                                            )}
                                                                            compact
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* No videos fallback */}
                                                            {activeChapter?.videos.loaded &&
                                                             !activeChapter.videos.oneShot &&
                                                             activeChapter.videos.topicVideos.length === 0 && (
                                                                <div className="text-center py-6 text-white/30 text-sm">
                                                                    <VideoIcon size={24} className="mx-auto mb-2 opacity-50" />
                                                                    <p>Videos loading… try refreshing</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom action: Mark as studied / Move next */}
                                        {state !== 'mastered' && (
                                            <div className="px-4 pb-4 flex flex-wrap gap-2">
                                                {completionPct === 100 && (
                                                    <button type="button"
                                                        onClick={async () => {
                                                            await SubtopicProgressService.setMasteryScore(userId, topic.id, 85);
                                                            refreshProgress();
                                                            setOpenChapterId(null);
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                                                    >
                                                        <CheckCheck size={14} />
                                                        Mark Chapter as Mastered
                                                    </button>
                                                )}
                                                {state === 'review_needed' && (
                                                    <button type="button"
                                                        onClick={async () => {
                                                            await SubtopicProgressService.setMasteryScore(userId, topic.id, 85);
                                                            refreshProgress();
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Mark as Reviewed
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {chapters.length === 0 && (
                    <div className="glass-card p-12 text-center space-y-3">
                        <BookOpen size={32} className="mx-auto text-white/30" />
                        <p className="text-white/60">No chapters found for your current class/exam settings.</p>
                        <Link to="/dashboard/profile" className="text-primary text-sm hover:underline">
                            Update your profile →
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};

// ─── VIDEO CARD COMPONENT ───────────────────────────────────────────────────

interface VideoCardProps {
    video: Video;
    label: string;
    sublabel: string;
    accent: string;
    isWatched: boolean;
    onWatch: () => void;
    compact?: boolean;
}

const VideoCard = ({ video, label, sublabel, accent, isWatched, onWatch, compact }: VideoCardProps) => {
    if (compact) {
        return (
            <button type="button"
                onClick={onWatch}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all hover:scale-[1.01] ${accent} ${
                    isWatched ? 'opacity-60' : ''
                }`}
            >
                <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play size={10} className="text-white ml-0.5" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/90 line-clamp-1">{label}</p>
                    <p className="text-xs text-white/40 line-clamp-1">{video.title}</p>
                </div>
                {isWatched && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                <Clock size={10} className="text-white/30 shrink-0" />
                <span className="text-xs text-white/30 shrink-0">{video.duration}</span>
            </button>
        );
    }

    return (
        <button type="button"
            onClick={onWatch}
            className={`w-full flex gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.01] hover:shadow-lg group ${accent} ${
                isWatched ? 'opacity-70' : ''
            }`}
        >
            <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="size-7 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                        <Play size={12} className="text-black ml-0.5" />
                    </div>
                </div>
                <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[9px] text-white font-mono">
                    {video.duration}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">{label}</span>
                    {isWatched && <CheckCircle2 size={10} className="text-emerald-400" />}
                </div>
                <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">{video.title}</p>
                <p className="text-[10px] text-white/40 mt-1">{video.channelName}</p>
                <p className="text-[10px] text-white/30">{sublabel}</p>
            </div>
        </button>
    );
};

// ─── VIDEO TYPE HELPER ──────────────────────────────────────────────────────

const getVideoType = (video: any): string => {
    return video.type || 'detailed';
};

// ─── LIBRARY VIDEO CARD COMPONENT ───────────────────────────────────────────

interface LibraryVideoCardProps {
    scoredVideo: ScoredVideo;
    isWatched: boolean;
    onWatch: () => void;
}

const LibraryVideoCard = ({ scoredVideo, isWatched, onWatch }: LibraryVideoCardProps) => {
    const { video, score, relevanceReason } = scoredVideo;
    const isCurated = (video as any).isCurated;
    const teacherName = (video as any).teacherName;
    const viewCount = (video as any).viewCount;

    return (
        <button type="button"
            onClick={onWatch}
            className={`w-full flex gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-xl group bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 ${
                isWatched ? 'opacity-70' : ''
            }`}
        >
            {/* Thumbnail */}
            <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 shadow-inner">
                <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="size-8 rounded-full bg-white/95 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <Play size={12} className="text-black ml-0.5 fill-black" />
                    </div>
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/85 rounded-md text-[9px] text-white font-mono">
                    {video.duration}
                </div>
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    {/* Top tags row */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {isCurated ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                                Curated
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                                Discovered
                            </span>
                        )}
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-400/20">
                            🎯 {score} Match
                        </span>
                        {isWatched && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 flex items-center gap-0.5">
                                <CheckCircle2 size={8} /> Watched
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {video.title}
                    </p>
                </div>

                {/* Footer details */}
                <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                        <span className="truncate max-w-[150px] font-medium">
                            {video.channelName}{teacherName ? ` • By ${teacherName}` : ''}
                        </span>
                        {viewCount && <span className="shrink-0">{viewCount}</span>}
                    </div>
                    {relevanceReason && (
                        <p className="text-[9px] text-white/40 italic flex items-center gap-1 leading-normal border-t border-white/5 pt-1.5">
                            <Zap size={8} className="text-amber-400 shrink-0" />
                            {relevanceReason}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
};

