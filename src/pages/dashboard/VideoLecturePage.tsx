
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { ArrowLeft, Share2, Play, Pause, Volume2, VolumeX, Bookmark, BookmarkCheck, ChevronDown, Check, Loader2, Search, Send, Sparkles, User } from 'lucide-react';
import type { Video, Playlist } from '../../services/videoService';
import { getVideoByTopicIdCached } from '../../services/videoService';
import { SEO } from '../../components/SEO';
import { askAI } from '../../lib/ai';
import { trackLectureView } from '../../lib/analytics';
import { calculateGains } from '../../services/gamificationService';
import {
    saveLectureToCloud,
    removeLectureFromCloud,
    getSavedLecturesFromCloud,
    migrateLocalToCloud
} from '../../services/savedLectureService';
import { markVideoAsFinished, isVideoFinished } from '../../services/videoProgressService';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
};

// Simple markdown renderer for AI responses
const renderMarkdown = (text: string) => {
    // Split into lines
    const lines = text.split(/(?:\r?\n|(?<=\.) (?=\d+\.))/g);
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ol' | 'ul' | null = null;

    const processInlineFormatting = (line: string): React.ReactNode => {
        // Handle **bold** text
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-purple-300 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const flushList = () => {
        if (listItems.length > 0 && listType) {
            const ListTag = listType;
            elements.push(
                <ListTag key={elements.length} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside space-y-1 my-2`}>
                    {listItems.map((item, i) => (
                        <li key={i} className="text-white/80">{processInlineFormatting(item)}</li>
                    ))}
                </ListTag>
            );
            listItems = [];
            listType = null;
        }
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            flushList();
            return;
        }

        // Check for numbered list (1. 2. 3. etc)
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            listItems.push(numberedMatch[2]);
            return;
        }

        // Check for bullet list (- or *)
        const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
        if (bulletMatch) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(bulletMatch[1]);
            return;
        }

        // Regular paragraph
        flushList();
        elements.push(
            <p key={index} className="mb-2 last:mb-0">{processInlineFormatting(trimmed)}</p>
        );
    });

    flushList();
    return <div className="space-y-1">{elements}</div>;
};

// (Simplified or removed as we use cloud service now)
const isLectureSavedLocal = (videoId: string, userId?: string): boolean => {
    try {
        const key = userId ? `exam-compass-saved-lectures-${userId}` : 'exam-compass-saved-lectures';
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(saved) && saved.some((v: any) => v.id === videoId);
    } catch { return false; }
};

// Chat history persistence helpers
const CHAT_HISTORY_KEY = 'exam-compass-chat-history';

const getChatHistory = (topicId: string): ChatMessage[] => {
    try {
        const history = localStorage.getItem(`${CHAT_HISTORY_KEY}-${topicId}`);
        return history ? JSON.parse(history) : [];
    } catch {
        return [];
    }
};

const saveChatHistory = (topicId: string, messages: ChatMessage[]) => {
    try {
        localStorage.setItem(`${CHAT_HISTORY_KEY}-${topicId}`, JSON.stringify(messages));
    } catch {
        console.error('Failed to save chat history');
    }
};

import { AuthGate } from '../../components/auth/AuthGate';

// Extracted to fix "Hooks inside map" error
const VideoListItem = ({
    video,
    idx,
    currentVideo,
    playlist,
    user,
    onSelect
}: {
    video: Video,
    idx: number,
    currentVideo: Video,
    playlist: Playlist,
    user: any,
    onSelect: (v: Video) => void
}) => {
    const isActive = currentVideo.id === video.id;
    const isCompleted = idx < playlist.videos.findIndex(v => v.id === currentVideo.id);
    const [videoIsSaved, setVideoIsSaved] = useState(false);

    useEffect(() => {
        const checkItem = async () => {
            if (user?.id) {
                const cloud = await getSavedLecturesFromCloud(user.id);
                setVideoIsSaved(cloud.some(v => v.id === video.id));
            }
        };
        checkItem();
    }, [user?.id, video.id]);

    return (
        <div
            onClick={() => onSelect(video)}
            className={`relative group cursor-pointer p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${isActive
                ? 'bg-white/10 border-purple-500/50 shadow-[0_0_30px_-5px_rgba(168,85,247,0.25)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                }`}
        >
            {/* Active Glow Line */}
            {isActive && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-purple-500 rounded-r-full shadow-[0_0_15px_#a855f7]" />
            )}

            <div className="flex justify-between items-start mb-2 pl-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-purple-400' : 'text-white/40'}`}>
                    Chapter {idx + 1}:
                </span>

                <div className="flex items-center gap-1">
                    {/* Saved indicator */}
                    {videoIsSaved && (
                        <BookmarkCheck size={12} className="text-green-500" />
                    )}

                    {/* Status Icon */}
                    {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center">
                            <Check size={12} className="text-white" />
                        </div>
                    ) : isActive ? (
                        <div className="w-5 h-5 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    ) : null}
                </div>
            </div>

            <h4 className={`text-sm font-medium leading-snug pl-2 mb-3 line-clamp-2 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                {video.title}
            </h4>

            {/* Progress Bar */}
            <div className="pl-2">
                <div className="flex justify-between text-[10px] text-white/30 mb-1">
                    <span>{isCompleted ? '100%' : isActive ? 'In Progress' : '0% Completed'}</span>
                    <span>{video.duration}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted
                            ? 'w-full bg-green-500'
                            : isActive
                                ? 'w-3/4 bg-gradient-to-r from-purple-500 to-indigo-500'
                                : 'w-0'
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

export const VideoLecturePage = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, addGains, recordActivity } = useUserStore(); // Get user, addGains, and recordActivity from store
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [aiMessage, setAiMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Load chat history from localStorage on mount
    useEffect(() => {
        if (topicId) {
            const savedChat = getChatHistory(topicId);
            if (savedChat.length > 0) {
                setChatMessages(savedChat);
            }
        }
    }, [topicId]);

    // Save chat history to localStorage when messages change
    useEffect(() => {
        if (topicId && chatMessages.length > 0) {
            saveChatHistory(topicId, chatMessages);
        }
    }, [chatMessages, topicId]);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            console.log('Fetching videos for topic:', topicId);
            // normalized topicId handled by cache service
            // Pass the user's target exam to get relevant videos (e.g., CLAT vs JEE)
            const data = await getVideoByTopicIdCached(topicId || 'physics-kinematics', user?.targetExam || 'JEE');
            console.log('Received playlist:', data);
            setPlaylist(data);
            if (data && data.videos.length > 0) {
                // Check if there's a last watched index stored
                const savedProgress = localStorage.getItem(`syllabus-progress-${topicId}`);
                const lastIndex = savedProgress ? Math.floor((parseInt(savedProgress) / 100) * data.videos.length) : 0;
                // Bound index
                const safeIndex = Math.min(Math.max(lastIndex, 0), data.videos.length - 1);
                setCurrentVideo(data.videos[safeIndex]);
            }
            setLoading(false);
        };
        fetchVideos();
    }, [topicId]);
    // ... existing code ...


    // Save progress whenever current video changes
    useEffect(() => {
        if (topicId && playlist && currentVideo) {
            const index = playlist.videos.findIndex(v => v.id === currentVideo.id);
            if (index !== -1) {
                const percent = Math.round(((index + 1) / playlist.videos.length) * 100);
                localStorage.setItem(`syllabus-progress-${topicId}`, percent.toString());
            }
        }
    }, [topicId, playlist, currentVideo]);

    // Listen for YouTube API messages (Automatic Completion)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Check if origin is YouTube
            if (!event.origin.includes('youtube.com')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // YT.PlayerState.ENDED is 0
                if (data.event === 'onStateChange' && data.info === 0 && currentVideo) {
                    console.log("[VideoLecture] Video ended naturally. Marking as finished.");
                    markVideoAsFinished(currentVideo.id);
                }
            } catch (e) {
                // Ignore non-json messages
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [currentVideo]);

    useEffect(() => {
        const checkSaved = async () => {
            if (currentVideo && user?.id) {
                // First check cloud
                const cloudSaved = await getSavedLecturesFromCloud(user.id);
                const exists = cloudSaved.some(v => v.id === currentVideo.id);
                setIsSaved(exists);

                // Trigger background migration check once
                migrateLocalToCloud(user.id).catch(console.error);
            } else if (currentVideo) {
                // Fallback to local for anonymous if not initialized
                setIsSaved(isLectureSavedLocal(currentVideo.id));
            }
        };

        checkSaved();

        if (currentVideo) {
            // Track Lecture Start
            const startTime = Date.now();

            return () => {
                const duration = Math.round((Date.now() - startTime) / 1000);
                if (duration > 5) { // Only track if watched for more than 5 seconds
                    trackLectureView(currentVideo.title, duration);

                    // Gamification: Add gains based on duration
                    const gains = calculateGains('lecture_watch', { duration });
                    addGains(gains);
                    recordActivity(duration);
                }
            };
        }
    }, [currentVideo, user?.id]);

    // YouTube Player API commands via postMessage
    const sendPlayerCommand = (command: string, args?: any) => {
        if (iframeRef.current?.contentWindow) {
            const message = JSON.stringify({
                event: 'command',
                func: command,
                args: args || []
            });
            iframeRef.current.contentWindow.postMessage(message, '*');
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            sendPlayerCommand('pauseVideo');
        } else {
            sendPlayerCommand('playVideo');
        }
        setIsPlaying(!isPlaying);
    };

    const handleMuteToggle = () => {
        if (isMuted) {
            sendPlayerCommand('unMute');
        } else {
            sendPlayerCommand('mute');
        }
        setIsMuted(!isMuted);
    };



    const handleSaveToggle = async () => {
        if (!currentVideo || !user?.id) return;

        try {
            if (isSaved) {
                await removeLectureFromCloud(user.id, currentVideo.id);
                setIsSaved(false);
            } else {
                await saveLectureToCloud(user.id, currentVideo);
                setIsSaved(true);
            }
        } catch (e) {
            console.error("Failed to toggle save:", e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    <p className="text-white/60 font-medium animate-pulse">Loading Lecture...</p>
                </div>
            </div>
        );
    }

    if (!playlist || !currentVideo) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-gray-500">
                Video not found.
            </div>
        );
    }

    const videoId = getYouTubeId(currentVideo.videoUrl);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-x-hidden">
            {currentVideo && (
                <SEO
                    title={`${currentVideo.title} | Exam Compass Video Lectures`}
                    description={`Watch free AI-curated video lectures on ${currentVideo.title}. Complete with notes, AI doubts assistant, and progress tracking.`}
                    image={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                />
            )}
            {/* FULL SCREEN GALAXY BACKGROUND */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2011&auto=format&fit=crop')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.5,
                }}
            />
            {/* Dark Gradient Overlay */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f]/50 via-[#0a0a0f]/70 to-[#0a0a0f] pointer-events-none" />

            {/* Ambient Glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[250px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[200px] pointer-events-none" />
            <div className="fixed top-[40%] right-[5%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[180px] pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen p-4 lg:p-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard/syllabus')}
                    className="mb-4 p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all inline-flex items-center gap-2 backdrop-blur-sm"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Syllabus</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto pb-8 items-stretch">

                    {/* LEFT COLUMN: VIDEO PLAYER + NOTES */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full">

                        {/* 1. VIDEO PLAYER - Frosted Glass Card */}
                        <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl h-fit bg-gradient-to-b from-white/[0.08] to-white/[0.02]">

                            {/* Video Header - Frosted */}
                            <div className="relative p-5 pb-3 flex items-start justify-between backdrop-blur-xl bg-white/[0.03]">
                                <div className="flex-1">
                                    <h1 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2">{currentVideo.title}</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                            {currentVideo.channelName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white/90">{currentVideo.channelName}</p>
                                            <p className="text-xs text-white/40">Educator</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Save/Bookmark Button */}
                                    <AuthGate mode="modal">
                                        <button
                                            onClick={handleSaveToggle}
                                            className={`p-2 rounded-lg transition-all ${isSaved ? 'bg-purple-600/30 text-purple-400' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                                            title={isSaved ? 'Remove from Saved' : 'Save Lecture'}
                                        >
                                            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                                        </button>
                                    </AuthGate>
                                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* YouTube Player */}
                            <div className="relative aspect-video mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10 isolate bg-black">
                                {videoId ? (
                                    <iframe
                                        ref={iframeRef}
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
                                        title={currentVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                        allowFullScreen
                                        className="w-full h-full border-0"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/50 bg-black/50">
                                        <p>Video unavailable</p>
                                    </div>
                                )}
                            </div>

                            {/* Custom Control Bar - Frosted */}
                            <div className="relative px-5 py-4 flex items-center gap-3 backdrop-blur-xl bg-white/[0.03]">
                                {/* Rewind 10s - Circular Design */}
                                <button
                                    onClick={() => sendPlayerCommand('seekTo', [Math.max(0, -10), true])}
                                    className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white active:scale-90"
                                    title="Rewind 10 seconds"
                                >
                                    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
                                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                        <text x="12" y="14.5" textAnchor="middle" fontSize="6" fontWeight="bold" stroke="none">10</text>
                                    </svg>
                                </button>

                                {/* Play/Pause Button with Animation */}
                                <button
                                    onClick={handlePlayPause}
                                    className="relative w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded-full transition-all shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95"
                                    title={isPlaying ? 'Pause' : 'Play'}
                                >
                                    <div className={`transition-all duration-300 ${isPlaying ? 'opacity-0 scale-50' : 'opacity-100 scale-100'} absolute`}>
                                        <Play size={18} fill="white" className="ml-0.5" />
                                    </div>
                                    <div className={`transition-all duration-300 ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} absolute`}>
                                        <Pause size={18} fill="white" />
                                    </div>
                                </button>

                                {/* Forward 10s - Circular Design */}
                                <button
                                    onClick={() => sendPlayerCommand('seekTo', [10, true])}
                                    className="w-14 h-14 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white active:scale-90"
                                    title="Forward 10 seconds"
                                >
                                    <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor">
                                        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                                        <text x="12" y="14.5" textAnchor="middle" fontSize="6" fontWeight="bold" stroke="none">10</text>
                                    </svg>
                                </button>

                                <div className="flex-1" />

                                {/* Mute/Unmute */}
                                <button
                                    onClick={handleMuteToggle}
                                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>

                                {/* Mark Finished Button */}
                                <button
                                    onClick={() => {
                                        if (currentVideo) {
                                            markVideoAsFinished(currentVideo.id);
                                            // Force re-render to show updated status
                                            setPlaylist({ ...playlist! });
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${currentVideo && isVideoFinished(currentVideo.id)
                                        ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                        : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border-purple-500/20'
                                        }`}
                                >
                                    <Check size={14} />
                                    {currentVideo && isVideoFinished(currentVideo.id) ? 'Finished' : 'Mark Finished'}
                                </button>

                                {/* Save Button */}
                                <AuthGate mode="modal">
                                    <button
                                        onClick={handleSaveToggle}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isSaved
                                            ? 'bg-green-600/80 text-white hover:bg-green-600'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                            }`}
                                        title={isSaved ? 'Saved!' : 'Save for Later'}
                                    >
                                        {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                        {isSaved ? 'Saved' : 'Save'}
                                    </button>
                                </AuthGate>
                            </div>
                        </div>

                        {/* 3. MY NOTES */}
                        <div className="relative rounded-[24px] overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl h-[600px] flex flex-col">
                            {/* Notes Header */}
                            <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <h3 className="font-bold text-base text-white">My Notes</h3>
                                <div className="flex gap-3">
                                    <button className="text-xs font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                                        <Share2 size={12} /> Export Notes
                                    </button>
                                </div>
                            </div>

                            {/* Notes Input */}
                            <div className="relative p-5 flex-1 flex flex-col min-h-0">
                                <textarea
                                    className="w-full h-full flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 placeholder:text-white/30 text-sm leading-relaxed resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="Add a note at 14:35... (Click to type)"
                                />
                            </div>

                            {/* Notes Footer */}
                            <div className="relative px-5 pb-5 flex justify-end shrink-0">
                                <AuthGate mode="modal">
                                    <button className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all">
                                        Save Note
                                    </button>
                                </AuthGate>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: COURSE CONTENT + AI */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full">

                        {/* 2. PLAYLIST / COURSE CONTENT */}
                        <div className="rounded-[24px] overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl flex flex-col h-[580px]">
                            {/* Sidebar Header */}
                            <div className="relative p-5 pb-4">
                                <h2 className="text-lg font-bold text-white mb-4">Course Content</h2>

                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 bg-purple-600/80 backdrop-blur-sm text-white text-xs font-semibold rounded-lg shadow-lg shadow-purple-500/20">All</button>
                                    <button className="px-4 py-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white/60 text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                                        Filter <ChevronDown size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Playlist Items - Scrollable */}
                            {/* Playlist Items - Scrollable */}
                            <div className="relative flex-1 overflow-y-auto px-4 pb-5 space-y-3 custom-scrollbar">
                                {playlist.videos.map((video, idx) => (
                                    <VideoListItem
                                        key={video.id}
                                        video={video}
                                        idx={idx}
                                        currentVideo={currentVideo}
                                        playlist={playlist}
                                        user={user}
                                        onSelect={(v) => { setCurrentVideo(v); setIsPlaying(true); }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 4. AI ASSISTANT */}
                        <div className="rounded-[24px] overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl flex flex-col h-[725px]">
                            {/* AI Header */}
                            <div className="relative px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">AI Study Assistant</h3>
                                    <p className="text-[10px] text-white/40">Ask doubts about this lecture</p>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div ref={chatContainerRef} className="relative p-4 flex-1 min-h-[250px] overflow-y-auto custom-scrollbar">
                                {/* Welcome Message */}
                                <div className="flex gap-3 mb-4">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={10} className="text-white" />
                                    </div>
                                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 text-sm text-white/80 leading-relaxed">
                                        Hi! I'm your AI study assistant. Ask me any questions about <span className="text-purple-400 font-medium">{currentVideo.title.split('|')[0].trim()}</span> and I'll help you understand better!
                                    </div>
                                </div>

                                {/* Chat History */}
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                                            {msg.role === 'user' ? <User size={10} className="text-white" /> : <Sparkles size={10} className="text-white" />}
                                        </div>
                                        <div className={`rounded-2xl p-3 text-sm text-white/80 leading-relaxed max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600/30 rounded-tr-sm' : 'bg-white/5 rounded-tl-sm'}`}>
                                            {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                                        </div>
                                    </div>
                                ))}

                                {/* Loading indicator */}
                                {isAiLoading && (
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <Sparkles size={10} className="text-white" />
                                        </div>
                                        <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3">
                                            <Loader2 size={16} className="text-purple-400 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="relative px-4 pb-4 shrink-0">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!aiMessage.trim() || isAiLoading) return;

                                    if (!user || user.isGuest) {
                                        // AuthGate will handle standard clicks effectively 
                                        // but for form submit we might need a manual check if we want to be fancy.
                                        // However, standard wrapping of the button is easier.
                                    }

                                    const userMsg = aiMessage.trim();
                                    setAiMessage('');
                                    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
                                    setIsAiLoading(true);

                                    // Scroll to bottom
                                    setTimeout(() => {
                                        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
                                    }, 100);

                                    try {
                                        const context = `This is about the topic: ${currentVideo.title}. The student is watching a lecture about this topic.`;
                                        // Pass chat history for conversation memory
                                        const response = await askAI(context, userMsg, 'groq', chatMessages);
                                        setChatMessages(prev => [...prev, { role: 'assistant', content: response || "Sorry, I couldn't process that." }]);
                                    } catch (error) {
                                        setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had trouble answering. Please try again." }]);
                                    } finally {
                                        setIsAiLoading(false);
                                        setTimeout(() => {
                                            chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
                                        }, 100);
                                    }
                                }} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
                                    <input
                                        type="text"
                                        value={aiMessage}
                                        onChange={(e) => setAiMessage(e.target.value)}
                                        placeholder="Ask a question about this topic..."
                                        className="flex-1 bg-transparent text-white/80 placeholder:text-white/30 text-sm focus:outline-none px-2"
                                        disabled={isAiLoading}
                                    />
                                    <AuthGate mode="modal">
                                        <button
                                            type="submit"
                                            disabled={isAiLoading || !aiMessage.trim()}
                                            className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        </button>
                                    </AuthGate>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

