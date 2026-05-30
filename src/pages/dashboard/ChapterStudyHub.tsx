import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { generateCheatSheetContent, downloadCheatSheetPDF, type CheatSheetContent } from '../../services/cheatSheetService';
import { getVideoByTopicIdCached, type Video } from '../../services/videoService';
import { getLibraryForChapter, type LibraryVideo } from '../../services/videoLibraryService';
import { scoreVideos } from '../../services/videoScoringEngine';
import { SubtopicProgressService } from '../../services/subtopicProgressService';
import { isVideoFinished, markVideoAsFinished } from '../../services/videoProgressService';
import {
    ArrowLeft, Play, BookOpen, CheckCircle2, Circle, Clock,
    Zap, Target, RotateCcw, ChevronRight, Flame, Brain,
    Bookmark, BookmarkCheck, ExternalLink, Loader2, Check,
    TrendingUp, Video as VideoIcon, Star, Lock, Eye
} from 'lucide-react';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
};

const formatViewCount = (str?: string) => str || '';

// Infer video type from title keywords
const inferType = (title: string): 'oneshot' | 'revision' | 'topic' | 'pyq' | 'detailed' => {
    const t = title.toLowerCase();
    if (t.includes('pyq') || t.includes('past year') || t.includes('previous year')) return 'pyq';
    if (t.includes('revision') || t.includes('recap') || t.includes('quick')) return 'revision';
    if (t.includes('one shot') || t.includes('one-shot') || t.includes('oneshot') || t.includes('complete') || t.includes('full chapter')) return 'oneshot';
    if (t.includes('concept') || t.includes('lecture') || t.includes('part')) return 'detailed';
    return 'topic';
};

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    oneshot:  { label: 'One Shot',   color: 'text-violet-300', bg: 'bg-violet-500/20 border-violet-500/30', icon: '🎯' },
    revision: { label: 'Revision',   color: 'text-amber-300',  bg: 'bg-amber-500/20  border-amber-500/30',  icon: '⚡' },
    topic:    { label: 'Focused',    color: 'text-sky-300',    bg: 'bg-sky-500/20    border-sky-500/30',    icon: '🔬' },
    pyq:      { label: 'PYQ',        color: 'text-rose-300',   bg: 'bg-rose-500/20   border-rose-500/30',   icon: '📝' },
    detailed: { label: 'Detailed',   color: 'text-emerald-300',bg: 'bg-emerald-500/20 border-emerald-500/30', icon: '📚' },
};

// ─── VIDEO PLAYER CARD ────────────────────────────────────────────────────────

const VideoPlayerCard = ({
    video, chapterId, userId, onFinish
}: { video: Video; chapterId: string; userId: string; onFinish: () => void }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoId = getYouTubeId(video.videoUrl);
    const finished = userId ? isVideoFinished(video.id, userId, '', '') : false;
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('ec_bookmarks') || '[]';
        try { setIsBookmarked(JSON.parse(saved).includes(video.id)); } catch { }
    }, [video.id]);

    const toggleBookmark = () => {
        const saved = localStorage.getItem('ec_bookmarks') || '[]';
        try {
            const arr: string[] = JSON.parse(saved);
            const updated = arr.includes(video.id) ? arr.filter(id => id !== video.id) : [...arr, video.id];
            localStorage.setItem('ec_bookmarks', JSON.stringify(updated));
            setIsBookmarked(!isBookmarked);
        } catch { }
    };

    const handleMarkFinished = () => {
        if (userId) {
            markVideoAsFinished(video.id, userId, '', '');
            SubtopicProgressService.markVideoWatched(userId, chapterId, video.id).catch(() => { });
            onFinish();
        }
    };

    return (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0d18]">
            {/* Glow */}
            <div className="absolute -top-20 -left-20 size-80 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 size-60 bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-5 py-4 flex items-start justify-between backdrop-blur-xl bg-white/[0.02] border-b border-white/5">
                <div className="flex-1 pr-4">
                    <h2 className="text-base font-bold text-white leading-snug line-clamp-2 mb-1">{video.title}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {video.channelName.charAt(0)}
                        </div>
                        <span className="text-sm text-white/60">{video.channelName}</span>
                        {video.duration && (
                            <span className="flex items-center gap-1 text-xs text-white/40">
                                <Clock size={10} /> {video.duration}
                            </span>
                        )}
                        {video.viewCount && (
                            <span className="flex items-center gap-1 text-xs text-white/40">
                                <Eye size={10} /> {formatViewCount(video.viewCount)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={toggleBookmark} className={`p-2 rounded-xl transition-all ${isBookmarked ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}>
                        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white">
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* Player */}
            <div className="relative aspect-video bg-black">
                {videoId ? (
                    <iframe sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                        key={videoId}
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        className="w-full h-full border-0"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                        <VideoIcon size={40} />
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="relative z-10 px-5 py-3 flex items-center gap-3 bg-white/[0.02] border-t border-white/5">
                <button type="button"
                    onClick={handleMarkFinished}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${finished
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-violet-600/20 text-violet-300 border-violet-500/30 hover:bg-violet-600/30'
                    }`}
                >
                    <Check size={14} />
                    {finished ? 'Watched ✓' : 'Mark as Watched'}
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Full Screen available ↗</span>
            </div>
        </div>
    );
};

// ─── VIDEO THUMBNAIL CARD ──────────────────────────────────────────────────────

const VideoThumbCard = ({
    video, isActive, userId, onSelect
}: { video: Video | LibraryVideo; isActive: boolean; userId: string; onSelect: () => void }) => {
    // Derive the best thumbnail URL: prefer explicit field, then compute from videoUrl
    const videoId = getYouTubeId(video.videoUrl ?? '');
    const thumbSrc = video.thumbnailUrl
        || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null)
        || (video.id?.length === 11 ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : null);

    const type = inferType(video.title);
    const meta = TYPE_META[type];
    const finished = userId ? isVideoFinished(video.id, userId, '', '') : false;

    return (
        <button type="button"
            onClick={onSelect}
            className={`group w-full text-left rounded-2xl border transition-all duration-300 overflow-hidden ${isActive
                ? 'border-violet-500/60 bg-violet-500/10 shadow-[0_0_30px_-8px_rgba(139,92,246,0.4)]'
                : 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
            }`}
        >
            <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <div className="relative w-24 h-[54px] rounded-xl overflow-hidden shrink-0 bg-black">
                    {thumbSrc ? (
                        <img
                            src={thumbSrc}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.onerror = null; // prevent loop
                                // Try hqdefault as second attempt
                                if (videoId && !img.src.includes('hqdefault')) {
                                    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                } else {
                                    // Hide image and show gradient placeholder
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                        parent.style.background = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
                                        parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:4px;"><span style="font-size:9px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${video.title}</span></div>`;
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
                            <VideoIcon size={16} className="text-white/30" />
                        </div>
                    )}
                    {/* Play overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all ${isActive ? 'bg-violet-500/40' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                        <div className="size-7 rounded-full bg-white/90 flex items-center justify-center">
                            <Play size={10} className="text-black ml-0.5" fill="black" />
                        </div>
                    </div>
                    {/* Active indicator */}
                    {isActive && (
                        <div className="absolute bottom-1 left-1 size-1.5 rounded-full bg-violet-400 animate-pulse" />
                    )}
                    {/* Finished */}
                    {finished && !isActive && (
                        <div className="absolute top-1 right-1 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={8} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug line-clamp-2 mb-1.5 transition-colors ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                        {video.title}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${meta.bg} ${meta.color}`}>
                            {meta.icon} {meta.label}
                        </span>
                        {video.duration && (
                            <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                                <Clock size={8} /> {video.duration}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

type VideoTab = 'guided' | 'library' | 'materials';
type LibTab = 'oneshot' | 'revision' | 'topic' | 'pyq' | 'all';

export const ChapterStudyHub = () => {
    const { chapterId: urlChapterId, topicId: urlTopicId } = useParams<{ chapterId?: string; topicId?: string }>();
    const activeIdOrSlug = urlChapterId || urlTopicId;

    // Resolve chapter from DB
    const chapter = Object.values(SYLLABUS_DB).flat().find(t => 
        t.id === activeIdOrSlug || (activeIdOrSlug && slugify(t.topic) === activeIdOrSlug)
    );
    const chapterId = chapter?.id || '';
    const subject = chapter 
        ? Object.keys(SYLLABUS_DB).find(s => SYLLABUS_DB[s].some(t => t.id === chapter.id)) || ''
        : '';

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useUserStore();

    const userId = user?.id || 'guest';
    const targetExam = user?.targetExam || 'JEE';

    const [activeVideo, setActiveVideo] = useState<Video | null>(null);
    const [guidedVideos, setGuidedVideos] = useState<Video[]>([]);
    const [libraryVideos, setLibraryVideos] = useState<Array<LibraryVideo & { inferredType?: string }>>([]);
    const [loadingGuided, setLoadingGuided] = useState(true);
    const [loadingLib, setLoadingLib] = useState(false);
    const [progress, setProgress] = useState(() =>
        chapterId ? SubtopicProgressService.getChapterProgress(userId, chapterId) : null
    );
    const [videoTab, setVideoTab] = useState<VideoTab>('guided');
    const [libTab, setLibTab] = useState<LibTab>('all');

    const [cheatSheet, setCheatSheet] = useState<CheatSheetContent | null>(null);
    const [loadingCheatSheet, setLoadingCheatSheet] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const refreshProgress = useCallback(() => {
        if (chapterId) setProgress(SubtopicProgressService.getChapterProgress(userId, chapterId));
    }, [userId, chapterId]);

    // Load guided videos – strictly ONE chapter at a time, 3 structured slots
    useEffect(() => {
        if (!chapter) return;
        setLoadingGuided(true);
        const load = async () => {
            try {
                const chapterName = chapter.topic;
                const classLabel = chapter.class;
                const exam = targetExam;

                // 3 Structured slot queries – all anchored to the chapter name to avoid cross-chapter fallback
                const slotQueries = [
                    // Slot 1: Full one-shot / complete chapter video
                    `${chapterName} ${exam} ${classLabel} full chapter complete one shot`,
                    // Slot 2: Quick revision / recap
                    `${chapterName} ${exam} ${classLabel} quick revision recap`,
                    // Slot 3: First subtopic deep-dive
                    `${chapterName} ${chapter.subtopics[0] || ''} ${exam} ${classLabel} lecture explained`,
                ];

                const results = await Promise.allSettled(
                    slotQueries.map(q => getVideoByTopicIdCached(q, exam, userId, classLabel))
                );

                const vids: Video[] = [];
                const seen = new Set<string>();

                results.forEach(r => {
                    if (r.status === 'fulfilled' && r.value?.videos?.length) {
                        // Take ONLY the top-scored video from each slot to keep it focused
                        const best = r.value.videos[0];
                        if (best && !seen.has(best.id)) {
                            // Additional chapter relevance check: title must mention the chapter
                            // or come from a trusted channel to avoid stray results
                            const titleLower = best.title.toLowerCase();
                            const chapterKeywords = chapterName.toLowerCase().split(' ').filter(w => w.length > 3);
                            const isRelevant = chapterKeywords.some(kw => titleLower.includes(kw));
                            if (isRelevant) {
                                seen.add(best.id);
                                vids.push(best);
                            } else {
                                // Still include it but from a trusted channel
                                const trustedChannels = ['physics wallah', 'pw', 'jee wallah', 'vedantu', 'unacademy', 'mathongo', 'apni kaksha', 'alakh', 'neet'];
                                const isTrusted = trustedChannels.some(ch => best.channelName.toLowerCase().includes(ch));
                                if (isTrusted) {
                                    seen.add(best.id);
                                    vids.push(best);
                                }
                            }
                        }
                    }
                });

                setGuidedVideos(vids);
                // Set initial video from URL param or first result
                const initId = searchParams.get('videoId');
                const initVid = initId ? vids.find(v => v.id === initId) : vids[0];
                if (initVid) setActiveVideo(initVid);
            } catch (e) {
                console.error('[ChapterStudyHub] Guided load failed:', e);
            } finally {
                setLoadingGuided(false);
            }
        };
        load();
    }, [chapter?.id, targetExam, chapter?.class]);

    // Load library videos using chapter's own class to avoid caching mismatches
    useEffect(() => {
        if (!chapter || !chapterId || videoTab !== 'library') return;
        setLoadingLib(true);
        const load = async () => {
            try {
                const raw = await getLibraryForChapter(chapterId, targetExam, subject, chapter.class);
                const scored = scoreVideos(raw, userId, chapterId, null, chapter.class, targetExam, []);
                const withType = scored.map(sv => ({
                    ...(sv.video as LibraryVideo),
                    inferredType: inferType(sv.video.title),
                }));
                setLibraryVideos(withType);
            } catch (e) {
                console.error('[ChapterStudyHub] Library load failed:', e);
            } finally {
                setLoadingLib(false);
            }
        };
        load();
    }, [chapterId, videoTab, targetExam, subject, chapter?.class, userId]);

    // Load study materials (cheat sheet) dynamically
    useEffect(() => {
        if (!chapter || videoTab !== 'materials') return;
        if (cheatSheet) return; // already loaded
        
        setLoadingCheatSheet(true);
        const loadCheatSheet = async () => {
            try {
                const content = await generateCheatSheetContent(chapter.topic, subject);
                if (content) {
                    setCheatSheet(content);
                }
            } catch (e) {
                console.error('[ChapterStudyHub] Study materials load failed:', e);
            } finally {
                setLoadingCheatSheet(false);
            }
        };
        loadCheatSheet();
    }, [chapter?.topic, subject, videoTab, cheatSheet]);

    const handleDownloadPDF = async () => {
        if (!cheatSheet) return;
        setGeneratingPdf(true);
        try {
            await downloadCheatSheetPDF(cheatSheet);
        } catch (e) {
            console.error('[ChapterStudyHub] PDF download failed:', e);
        } finally {
            setGeneratingPdf(false);
        }
    };

    const toggleSubtopic = async (sub: string) => {
        if (!chapterId || !chapter) return;
        await SubtopicProgressService.toggleSubtopic(userId, chapterId, sub, chapter.subtopics.length);
        refreshProgress();
    };

    const checkedCount = progress?.checkedSubtopics.length || 0;
    const totalSubs = chapter?.subtopics.length || 0;
    const completionPct = totalSubs > 0 ? Math.round((checkedCount / totalSubs) * 100) : 0;

    const filteredLibrary = videoTab === 'library'
        ? (libTab === 'all' ? libraryVideos : libraryVideos.filter(v => v.inferredType === libTab))
        : [];

    if (!chapter) {
        return (
            <div className="min-h-screen bg-[#080810] flex items-center justify-center text-white/40">
                Chapter not found.{' '}
                <button type="button" onClick={() => navigate('/dashboard/lectures')} className="ml-2 underline text-violet-400">
                    Back to Lectures
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080810] text-white relative overflow-x-hidden">
            {/* ── AMBIENT BACKGROUND ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 size-[600px] bg-violet-700/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-0 size-[500px] bg-indigo-700/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-0 size-[400px] bg-blue-700/8 rounded-full blur-[100px]" />
            </div>

            {/* ── TOPBAR ── */}
            <div className="sticky top-0 z-50 backdrop-blur-2xl bg-[#080810]/80 border-b border-white/5 px-4 md:px-6 py-3">
                <div className="max-w-[1440px] mx-auto flex items-center gap-3">
                    <button type="button"
                        onClick={() => navigate('/dashboard/lectures')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back to Lectures</span>
                    </button>

                    <div className="h-4 w-px bg-white/10" />

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="text-white/30 hidden md:inline">{subject}</span>
                        <ChevronRight size={12} className="text-white/20 hidden md:inline shrink-0" />
                        <span className="text-white/80 font-medium truncate">{chapter.topic}</span>
                    </div>

                    <div className="flex-1" />

                    {/* Badges */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${chapter.class === 'Class 12'
                            ? 'bg-violet-500/15 text-violet-400 border-violet-400/20'
                            : 'bg-sky-500/15 text-sky-400 border-sky-400/20'}`}>
                            {chapter.class}
                        </span>
                        {chapter.weightage === 'High' && (
                            <span className="text-[10px] px-2 py-1 bg-red-500/15 text-red-400 border border-red-400/20 rounded-lg font-semibold flex items-center gap-1">
                                <Flame size={10} /> High Weightage
                            </span>
                        )}
                    </div>

                    <Link
                        to={`/dashboard/mock?topic=${encodeURIComponent(chapter.topic)}`}
                        className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-colors"
                    >
                        <Zap size={14} />
                        <span className="hidden sm:inline">Test</span>
                    </Link>
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* ════════ LEFT: VIDEO AREA ════════ */}
                    <div className="space-y-4 lg:col-span-8 min-w-0">

                        {/* Video Player */}
                        {activeVideo ? (
                            <VideoPlayerCard
                                video={activeVideo}
                                chapterId={chapterId || ''}
                                userId={userId}
                                onFinish={() => refreshProgress()}
                            />
                        ) : loadingGuided ? (
                            <div className="aspect-video rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 size={28} className="text-violet-400 animate-spin" />
                                    <p className="text-sm text-white/40 animate-pulse">Loading videos for {chapter.topic}…</p>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <div className="text-center text-white/30">
                                    <VideoIcon size={40} className="mx-auto mb-2 opacity-40" />
                                    <p>No videos found for this chapter.</p>
                                </div>
                            </div>
                        )}

                        {/* ── VIDEO TABS ── */}
                        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                            <button type="button"
                                onClick={() => setVideoTab('guided')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${videoTab === 'guided'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : 'text-white/50 hover:text-white/80'}`}
                            >
                                <Brain size={14} />
                                Guided Sequence
                            </button>
                            <button type="button"
                                onClick={() => setVideoTab('library')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${videoTab === 'library'
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'text-white/50 hover:text-white/80'}`}
                            >
                                <VideoIcon size={14} />
                                Full Library
                            </button>
                            <button type="button"
                                onClick={() => setVideoTab('materials')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${videoTab === 'materials'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-white/50 hover:text-white/80'}`}
                            >
                                <BookOpen size={14} />
                                Study Materials
                            </button>
                        </div>

                        {/* ── GUIDED VIDEO LIST ── */}
                        {videoTab === 'guided' && (
                            <div>
                                {loadingGuided ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : guidedVideos.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                                                🎯 {guidedVideos.length} curated picks for {chapter?.topic}
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {guidedVideos.map((v, idx) => {
                                                const slotLabels = [
                                                    { icon: '🎯', label: 'Full One-Shot', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                                                    { icon: '⚡', label: 'Quick Revision', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                                                    { icon: '🔬', label: 'Topic Focus', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                                                ];
                                                const slot = slotLabels[idx] || slotLabels[2];
                                                return (
                                                    <div key={v.id} className="flex items-start gap-2">
                                                        <div className={`shrink-0 mt-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-semibold ${slot.color}`}>
                                                            {slot.icon} {slot.label}
                                                        </div>
                                                        <div className="flex-1">
                                                            <VideoThumbCard
                                                                video={v}
                                                                isActive={activeVideo?.id === v.id}
                                                                userId={userId}
                                                                onSelect={() => setActiveVideo(v)}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-white/30 text-sm">
                                        <VideoIcon size={24} className="mx-auto mb-2 opacity-40" />
                                        No guided videos found. Try the Full Library tab.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── LIBRARY VIDEO LIST ── */}
                        {videoTab === 'library' && (
                            <div>
                                {/* Library sub-tabs */}
                                <div className="flex gap-1 flex-wrap mb-4">
                                    {(['all', 'oneshot', 'revision', 'topic', 'pyq'] as LibTab[]).map(tab => {
                                        const counts = libraryVideos.filter(v => tab === 'all' || v.inferredType === tab).length;
                                        return (
                                            <button type="button"
                                                key={tab}
                                                onClick={() => setLibTab(tab)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${libTab === tab
                                                    ? 'bg-white/10 border-white/20 text-white'
                                                    : 'border-white/5 text-white/40 hover:text-white/70 hover:border-white/10'}`}
                                            >
                                                {tab === 'all' ? '🎬 All' : `${TYPE_META[tab]?.icon} ${TYPE_META[tab]?.label}`}
                                                {counts > 0 && (
                                                    <span className={`text-[9px] px-1 rounded ${libTab === tab ? 'bg-white/20' : 'bg-white/5'}`}>{counts}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {loadingLib ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredLibrary.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredLibrary.map(v => (
                                            <VideoThumbCard
                                                key={v.id}
                                                video={v}
                                                isActive={activeVideo?.id === v.id}
                                                userId={userId}
                                                onSelect={() => setActiveVideo(v as Video)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-white/30 text-sm">
                                        <VideoIcon size={24} className="mx-auto mb-2 opacity-40" />
                                        No videos in this category yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── STUDY MATERIALS SHOWCASE ── */}
                        {videoTab === 'materials' && (
                            <div className="space-y-6">
                                {loadingCheatSheet ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-24 rounded-2xl bg-white/5 border border-white/5" />
                                        <div className="h-48 rounded-2xl bg-white/5 border border-white/5" />
                                        <div className="h-40 rounded-2xl bg-white/5 border border-white/5" />
                                    </div>
                                ) : cheatSheet ? (
                                    <>
                                        {/* Header & Download Row */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-white">Revision Study Guide</h3>
                                                <p className="text-[10px] text-white/40">AI-generated high-yield revision notes</p>
                                            </div>
                                            <button type="button"
                                                onClick={handleDownloadPDF}
                                                disabled={generatingPdf}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-emerald-500/20 border border-emerald-400/30 text-xs font-semibold transition-all disabled:opacity-50"
                                            >
                                                {generatingPdf ? (
                                                    <Loader2 className="animate-spin" size={13} />
                                                ) : (
                                                    <BookOpen size={13} />
                                                )}
                                                {generatingPdf ? 'Generating PDF...' : 'Download PDF Notes'}
                                            </button>
                                        </div>

                                        {/* Summary Section */}
                                        <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 overflow-hidden backdrop-blur-xl">
                                            <div className="absolute -top-10 -left-10 size-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <BookOpen size={12} className="text-emerald-400" />
                                                Core Concept Summary
                                            </h4>
                                            <p className="text-xs text-white/95 leading-relaxed font-medium">
                                                {cheatSheet.summary}
                                            </p>
                                        </div>

                                        {/* Key Points */}
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                                                <Target size={12} className="text-violet-400" />
                                                High-Yield Revision Points
                                            </h4>
                                            <div className="space-y-2.5">
                                                {cheatSheet.keyPoints.map((point, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl hover:bg-white/[0.03] transition-colors">
                                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="text-xs text-white/80 leading-relaxed">{point}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Formulas Table */}
                                        {cheatSheet.formulas && cheatSheet.formulas.length > 0 && (
                                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                                <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                                                    <Brain size={12} className="text-sky-400" />
                                                    <h4 className="text-[10px] font-bold text-white/85 uppercase tracking-widest">Key Formulas & Definitions</h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                                <th className="px-5 py-2.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Concept</th>
                                                                <th className="px-5 py-2.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Formula / Definition</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {cheatSheet.formulas.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                                                    <td className="px-5 py-3 text-xs font-bold text-white/95">{item.name}</td>
                                                                    <td className="px-5 py-3 text-xs font-mono text-emerald-450 bg-emerald-500/[0.01] selection:bg-emerald-500/20">{item.formula}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tips & Shortcuts */}
                                        {cheatSheet.viralTips && cheatSheet.viralTips.length > 0 && (
                                            <div className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.01] p-5 overflow-hidden">
                                                <div className="absolute -right-10 -bottom-10 size-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                                                <h4 className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                    <Zap size={12} className="text-amber-400" />
                                                    Expert Tips & Shortcut Traps
                                                </h4>
                                                <div className="space-y-2.5">
                                                    {cheatSheet.viralTips.map((tip, idx) => (
                                                        <div key={idx} className="flex gap-3 p-3 bg-amber-500/[0.03] border border-amber-500/10 rounded-xl">
                                                            <span className="text-sm shrink-0">💡</span>
                                                            <p className="text-xs text-amber-200/90 leading-relaxed italic">{tip}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-12 text-center text-white/30 text-sm">
                                        <BookOpen size={32} className="mx-auto mb-3 opacity-40 text-violet-400" />
                                        <p className="mb-2">No study materials found for this topic.</p>
                                        <button type="button"
                                            onClick={() => {
                                                setCheatSheet(null);
                                                setLoadingCheatSheet(true);
                                                generateCheatSheetContent(chapter.topic, subject).then(content => {
                                                    if (content) setCheatSheet(content);
                                                    setLoadingCheatSheet(false);
                                                });
                                            }}
                                            className="px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-600/30 transition-colors text-xs font-semibold"
                                        >
                                            Generate Revision Notes
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ════════ RIGHT: STUDY PANEL ════════ */}
                    <div className="space-y-4 lg:col-span-4 min-w-0">

                        {/* ── CHAPTER OVERVIEW CARD ── */}
                        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="size-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                                    <BookOpen size={18} className="text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm leading-tight">{chapter.topic}</h3>
                                    <p className="text-xs text-white/40 mt-0.5">{subject} · {chapter.class}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2">
                                <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                                    <span>Chapter Progress</span>
                                    <span className="font-semibold text-white/60">{checkedCount}/{totalSubs} subtopics</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                                        style={{ width: `${completionPct}%` }}
                                    />
                                </div>
                                <div className="text-right text-[10px] text-violet-400 mt-1 font-semibold">{completionPct}% complete</div>
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-2 mt-3">
                                <Link
                                    to={`/dashboard/mock?topic=${encodeURIComponent(chapter.topic)}`}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-colors"
                                >
                                    <Zap size={12} /> Test Chapter
                                </Link>
                                <Link
                                    to="/dashboard/revision"
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                                >
                                    <RotateCcw size={12} /> Revision Cards
                                </Link>
                            </div>
                        </div>

                        {/* ── SUBTOPICS CHECKLIST ── */}
                        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-sky-400" />
                                    <h4 className="text-sm font-semibold text-white">Subtopics Checklist</h4>
                                </div>
                                <span className="text-xs text-white/40">{checkedCount}/{totalSubs} done</span>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {chapter.subtopics.map(sub => {
                                    const isChecked = progress?.checkedSubtopics.includes(sub) || false;
                                    return (
                                        <button type="button"
                                            key={sub}
                                            onClick={() => toggleSubtopic(sub)}
                                            className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs text-left transition-all ${isChecked
                                                ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-300'
                                                : 'bg-white/3 border border-transparent text-white/60 hover:bg-white/8 hover:text-white hover:border-white/10'}`}
                                        >
                                            {isChecked
                                                ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                : <Circle size={14} className="text-white/25 shrink-0 mt-0.5" />
                                            }
                                            <span className="leading-snug break-words">{sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── EXAM PATTERN INFO ── */}
                        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={14} className="text-rose-400" />
                                <h4 className="text-sm font-semibold text-white">Exam Insights</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Weightage</p>
                                    <p className={`text-sm font-bold ${chapter.weightage === 'High' ? 'text-red-400' : chapter.weightage === 'Medium' ? 'text-amber-400' : 'text-white/60'}`}>
                                        {chapter.weightage}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Exam Pattern</p>
                                    <p className="text-sm font-bold text-sky-400">{(chapter as any).examPattern || 'MCQ'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 col-span-2">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Expected Qs in Exam</p>
                                    <p className="text-sm font-bold text-violet-400">
                                        {chapter.weightage === 'High' ? '3–4 questions' : chapter.weightage === 'Medium' ? '1–2 questions' : '0–1 questions'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── PREREQUISITES ── */}
                        {(chapter as any).prerequisites?.length > 0 && (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock size={12} className="text-amber-400" />
                                    <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Prerequisites</h4>
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed">{(chapter as any).prerequisites.join(', ')}</p>
                            </div>
                        )}

                        {/* ── RELATED CHAPTERS ── */}
                        <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                <Star size={13} className="text-amber-400" />
                                <h4 className="text-sm font-semibold text-white">Related Chapters</h4>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {(SYLLABUS_DB[subject] || [])
                                    .filter(t => t.id !== chapterId && (t.class === chapter.class))
                                    .slice(0, 5)
                                    .map(t => (
                                        <Link
                                            key={t.id}
                                            to={`/dashboard/lectures/chapter/${t.id}`}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/3 border border-transparent hover:bg-white/8 hover:border-white/10 transition-all group"
                                        >
                                            <span className="text-xs text-white/60 group-hover:text-white transition-colors line-clamp-1">{t.topic}</span>
                                            <ChevronRight size={12} className="text-white/20 group-hover:text-white/60 shrink-0 ml-2" />
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterStudyHub;
