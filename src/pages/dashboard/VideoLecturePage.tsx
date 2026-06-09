
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { ArrowLeft, Share2, Play, Pause, Volume2, VolumeX, Bookmark, BookmarkCheck, ChevronDown, Check, Loader2, Search, Send, User, Bot, Phone, Settings, X, Paperclip, MessageSquare, Mic, MicOff, BookOpen, Zap } from 'lucide-react';
import type { Video, Playlist } from '../../services/videoService';
import { getVideoByTopicIdCached } from '../../services/videoService';
import { getLibraryForChapter } from '../../services/videoLibraryService';
import { SEO } from '../../components/SEO';
import { askAI } from '../../lib/ai';
import { useChatStore } from '../../store/chatStore';
import { extractAndSaveMemory } from '../../lib/memoryExtractor';
import { trackLectureView } from '../../lib/analytics';
import { exportPremiumPDF } from '../../lib/pdfExporter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { calculateGains } from '../../services/gamificationService';
import {
    saveLectureToCloud,
    removeLectureFromCloud,
    getSavedLecturesFromCloud,
    migrateLocalToCloud
} from '../../services/savedLectureService';
import { markVideoAsFinished, isVideoFinished } from '../../services/videoProgressService';
import { SubtopicProgressService } from '../../services/subtopicProgressService';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';

// Chat messages handled by useChatStore (see store/chatStore.ts)

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
                return <strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>;
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

// Chat history persistence is now handled by useChatStore

import { AuthGate } from '../../components/auth/AuthGate';

// Extracted to fix "Hooks inside map" error
const VideoListItem = ({
    video,
    idx,
    currentVideo,
    isSaved,
    onSelect
}: {
    video: Video,
    idx: number,
    currentVideo: Video,
    isSaved: boolean,
    onSelect: (v: Video) => void
}) => {
    const { user } = useUserStore();
    const isActive = currentVideo.id === video.id;
    const isCompleted = user ? isVideoFinished(video.id, user.id, user.userClass, user.targetExam) : false;
    
    return (
        <div
            onClick={() => onSelect(video)}
            className={`relative group cursor-pointer p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${isActive
                ? 'bg-white/10 border-primary/50 shadow-[0_0_30px_-5px_rgb(var(--primary)/0.25)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                }`}
        >
            {/* Active Glow Line */}
            {isActive && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full shadow-[0_0_15px_rgb(var(--primary))]" />
            )}

            <div className="flex justify-between items-start mb-2 pl-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-purple-400' : 'text-white/40'}`}>
                    Chapter {idx + 1}:
                </span>

                <div className="flex items-center gap-1">
                    {/* Saved indicator */}
                    {isSaved && (
                        <BookmarkCheck size={12} className="text-green-500" />
                    )}

                    {/* Status Icon */}
                    {isCompleted ? (
                        <div className="size-5 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center">
                            <Check size={12} className="text-white" />
                        </div>
                    ) : isActive ? (
                        <div className="size-5 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="size-2 bg-white rounded-full animate-pulse" />
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
                                ? 'w-3/4 bg-gradient-to-r from-primary to-indigo-500'
                                : 'w-0'
                            }`}
                    />
                </div>
            </div>
        </div>
    );
};

interface VoicePreset {
    id: string;
    name: string;
    gender: 'female' | 'male';
    pitch: number;
    rate: number;
}

const VOICE_PRESETS: VoicePreset[] = [
    { id: 'girl_sweet', name: 'Exa (Sweet)', gender: 'female', pitch: 1.15, rate: 1.05 },
    { id: 'girl_calm', name: 'Exa (Calm)', gender: 'female', pitch: 1.0, rate: 0.95 },
    { id: 'girl_playful', name: 'Exa (Playful)', gender: 'female', pitch: 1.1, rate: 1.1 },
    { id: 'boy_chill', name: 'Exa (Chill)', gender: 'male', pitch: 1.0, rate: 0.95 },
    { id: 'boy_deep', name: 'Exa (Deep)', gender: 'male', pitch: 0.9, rate: 0.9 },
    { id: 'boy_brisk', name: 'Exa (Brisk)', gender: 'male', pitch: 1.0, rate: 1.1 },
];

// Resolve slug or name to the correct SYLLABUS_DB topic
const resolveSyllabusTopicBySlug = (slug: string) => {
    if (!slug) return null;
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
    for (const subject in SYLLABUS_DB) {
        const found = SYLLABUS_DB[subject].find(t => {
            const tSlug = t.topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
            const alternateSlug = slugify(t.topic);
            return tSlug === cleanSlug || alternateSlug === cleanSlug || t.id === slug;
        });
        if (found) return found;
    }
    return null;
};

export const VideoLecturePage = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryVideoId = searchParams.get('videoId');
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, addGains, recordActivity } = useUserStore(); // Get user, addGains, and recordActivity from store
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedVideos, setSavedVideos] = useState<Video[]>([]);
    const [aiInput, setAiInput] = useState('');
    const { 
        messages: chatMessages, 
        addMessage, 
        setMessages, 
        isThinking: isAiLoading, 
        setIsThinking: setIsAiLoading,
        isSearching: _isSearching,
        setIsSearching,
        selectedLanguage
    } = useChatStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(() => localStorage.getItem('exa_sidebar_voice_id') || "girl_sweet");
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const shadowNoteRef = useRef<HTMLDivElement>(null);

    const handleSaveNote = async () => {
        if (!noteContent.trim() || !user) return;
        setIsSavingNote(true);
        try {
            const { db } = await import('../../lib/firebase');
            const { collection, addDoc } = await import('firebase/firestore');
            
            await addDoc(collection(db, 'documents'), {
                user_id: user.id,
                title: `${currentVideo?.title || 'Lecture'} Notes`,
                content: noteContent,
                note_type: 'full',
                created_at: new Date().toISOString(),
                lecture_id: topicId,
                video_id: currentVideo?.id
            });
            
            alert("Note saved to your dashboard! 🚀");
        } catch (err) {
            console.error("Failed to save note:", err);
            alert("Failed to save note. Please try again.");
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleExportNotes = async () => {
        if (!noteContent.trim() || !shadowNoteRef.current) return;
        setIsExporting(true);
        try {
            await exportPremiumPDF({
                title: `${currentVideo?.title || 'Lecture'} Notes`,
                filename: `${(currentVideo?.title || 'lecture').replace(/\s+/g, '_').toLowerCase()}_notes.pdf`,
                category: 'Lecture Note',
                userName: user?.name || 'Scholar',
                userClass: user?.userClass || 'Class 12th',
                targetYear: user?.targetYear,
                contentHtml: shadowNoteRef.current.innerHTML
            });
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    // Speak AI messages - High Quality Version
    const speakText = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        // Strip emojis
        let cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        // Strip LaTeX/math notation: $$...$$ and $...$
        cleanText = cleanText.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*?\$/g, '').replace(/\\(text|frac|sqrt|left|right|times|cdot|geq|leq|neq|approx|infty|sum|int|prod|lim|rightarrow|leftarrow|Rightarrow|AA)\b\{?[^}]*\}?/g, '');
        // Strip markdown formatting: bold (**), italic (*), headers (#), links, code blocks
        cleanText = cleanText.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1').replace(/_{1,3}(.*?)_{1,3}/g, '$1').replace(/`{1,3}[^`]*`{1,3}/g, '').replace(/^#{1,6}\s+/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^[-*+]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/^>\s+/gm, '').replace(/\|/g, '').replace(/---+/g, '').trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const currentPreset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

        let systemVoice: SpeechSynthesisVoice | undefined;
        const findByName = (keywords: string[]) => voices.find(v => keywords.some(k => v.name.includes(k)));

        if (currentPreset.gender === 'female') {
            systemVoice = findByName(['Google US English', 'Samantha', 'Zira', 'Microsoft Zira', 'Google UK English Female'])
                || voices.find(v => v.name.includes('Female') || v.name.includes('female'))
                || voices.find(v => v.lang === 'en-US' && !v.name.includes('Male'))
                || voices[0];
        } else {
            systemVoice = findByName(['Google UK English Male', 'Daniel', 'Google US English Male', 'David', 'Microsoft David'])
                || voices.find(v => v.name.includes('Male') || v.name.includes('male'))
                || voices.find(v => v.lang === 'en-GB')
                || voices[0];
        }

        if (systemVoice) {
            utterance.voice = systemVoice;
            utterance.pitch = currentPreset.pitch;
            utterance.rate = currentPreset.rate;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e: any) => {
            // "interrupted" occurs when we cancel speech (e.g. user types a new message)
            // "canceled" occurs when speech is stopped manually
            if (e.error === 'interrupted' || e.error === 'canceled' || e.error === 'no-speech') {
                setIsSpeaking(false);
                return;
            }
            console.warn("SpeechSynthesis error:", e.error, e);
            setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
    };

    // Initial Greeting if needed handled by Chatbot store usually
    useEffect(() => {
        if (chatMessages.length === 0) {
            addMessage({
                id: Date.now(),
                sender: 'bot',
                text: `Ready to master ${currentVideo?.title || 'this topic'}? I'm here to solve your doubts instantly. 😊`
            });
        }
    }, []);

    // Syncing handled by useChatStore
    useEffect(() => {
    }, [chatMessages, topicId]);

    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            try {
                // Pass the user's target exam AND class to get relevant videos
                let data = await getVideoByTopicIdCached(topicId || 'physics-kinematics', user?.targetExam || 'JEE', user?.id || 'anon', user?.userClass || '');
                
                // Fallback to D1/static database if YouTube results are empty (e.g. API quota exhausted)
                if (!data || !data.videos || data.videos.length === 0) {
                    console.log(`[VideoLecturePage] YouTube search returned empty. Falling back to D1 / static library for chapter: ${topicId}`);
                    let subject = '';
                    const resolvedTopic = resolveSyllabusTopicBySlug(topicId || '');
                    const chapterId = resolvedTopic?.id || topicId || '';
                    for (const subj of Object.keys(SYLLABUS_DB)) {
                        if (SYLLABUS_DB[subj].some(c => c.id === chapterId)) {
                            subject = subj;
                            break;
                        }
                    }
                    const fallbackVideos = await getLibraryForChapter(chapterId, user?.targetExam || 'JEE', subject, user?.userClass || '', false, user?.id || 'anon');
                    if (fallbackVideos && fallbackVideos.length > 0) {
                        data = {
                            id: `playlist-${topicId}`,
                            topicId: topicId || '',
                            title: resolvedTopic?.topic || 'Lecture',
                            videos: fallbackVideos
                        };
                    }
                }

                setPlaylist(data);

                if (data && data.videos.length > 0) {
                    // Check if there is a query videoId parameter first
                    let initialVideo = null;
                    if (queryVideoId) {
                        const found = data.videos.find(v => v.id === queryVideoId || getYouTubeId(v.videoUrl) === queryVideoId || getYouTubeId(v.videoUrl) === getYouTubeId(queryVideoId));
                        if (found) initialVideo = found;
                    }

                    // Fallback to last watched ID — ONLY use if the stored playlist fingerprint
                    // matches the current playlist (prevents stale IDs from a different cache/user
                    // session matching a new playlist's videos and playing wrong content).
                    if (!initialVideo) {
                        const userScope = user?.id ? `_${user.id.substring(0, 8)}` : '';
                        const lastWatchedKey = `last-watched-id-${topicId}${userScope}`;
                        const playlistFingerprintKey = `last-watched-fp-${topicId}${userScope}`;
                        const currentFingerprint = data.videos.map(v => v.id).join(',');
                        const storedFingerprint = localStorage.getItem(playlistFingerprintKey);

                        // Only trust stored lastWatchedId if the playlist is the same set of videos
                        if (storedFingerprint === currentFingerprint) {
                            const lastWatchedId = localStorage.getItem(lastWatchedKey);
                            if (lastWatchedId) {
                                const found = data.videos.find(v => v.id === lastWatchedId);
                                if (found) initialVideo = found;
                            }
                        } else {
                            // Playlist changed — clear stale last-watched to avoid mismatches
                            localStorage.removeItem(lastWatchedKey);
                            localStorage.setItem(playlistFingerprintKey, currentFingerprint);
                        }
                    }

                    // Always default to the FIRST video when no reliable last-watched exists
                    if (!initialVideo) {
                        initialVideo = data.videos[0];
                    }

                    setCurrentVideo(initialVideo);
                }
            } catch (err) {
                console.error("Error fetching videos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [topicId, user?.targetExam, user?.userClass, queryVideoId]); // Added userClass and queryVideoId to deps


    // Sync current video when queryVideoId changes
    useEffect(() => {
        if (playlist && playlist.videos.length > 0 && queryVideoId) {
            const found = playlist.videos.find(v => v.id === queryVideoId || getYouTubeId(v.videoUrl) === queryVideoId || getYouTubeId(v.videoUrl) === getYouTubeId(queryVideoId));
            if (found && found.id !== currentVideo?.id) {
                setCurrentVideo(found);
                setIsPlaying(true);
            }
        }
    }, [queryVideoId, playlist]);

    // Save progress whenever current video changes (user-scoped to prevent cross-user contamination)
    useEffect(() => {
        if (topicId && playlist && currentVideo) {
            const userScope = user?.id ? `_${user.id.substring(0, 8)}` : '';
            const lastWatchedKey = `last-watched-id-${topicId}${userScope}`;
            const playlistFingerprintKey = `last-watched-fp-${topicId}${userScope}`;

            // Save current video ID and the playlist fingerprint together
            localStorage.setItem(lastWatchedKey, currentVideo.id);
            localStorage.setItem(playlistFingerprintKey, playlist.videos.map(v => v.id).join(','));

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
            if (event.origin !== 'https://www.youtube.com' && event.origin !== 'https://youtube.com') return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // YT.PlayerState.ENDED is 0
                if (data.event === 'onStateChange' && data.info === 0 && currentVideo && user) {
                    console.log("[VideoLecture] Video ended naturally. Marking as finished.");
                    markVideoAsFinished(currentVideo.id, user.id, user.userClass, user.targetExam);
                    
                    // Mark as watched in SubtopicProgressService for Lectures sequential timeline
                    const matchedTopic = resolveSyllabusTopicBySlug(topicId || '');
                    if (matchedTopic) {
                        SubtopicProgressService.markVideoWatched(user.id, matchedTopic.id, currentVideo.id).catch(console.error);
                    }
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
                const cloudSaved = await getSavedLecturesFromCloud(user.id, user.userClass, user.targetExam);
                setSavedVideos(cloudSaved);
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
                await removeLectureFromCloud(user.id, currentVideo.id, user.userClass, user.targetExam);
                setIsSaved(false);
            } else {
                await saveLectureToCloud(user.id, currentVideo, user.userClass, user.targetExam);
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
                    <Loader2 className="size-10 text-purple-500 animate-spin" />
                    <p className="text-white/60 font-medium animate-pulse">Loading Lecture…</p>
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
            <div className="fixed top-[-20%] left-[-10%] size-[800px] bg-purple-600/30 rounded-full blur-[250px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] size-[700px] bg-indigo-600/20 rounded-full blur-[200px] pointer-events-none" />
            <div className="fixed top-[40%] right-[5%] size-[500px] bg-blue-600/15 rounded-full blur-[180px] pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen p-4 lg:p-6">
                {/* Back Button */}
                <button type="button"
                    onClick={() => navigate('/dashboard/syllabus')}
                    className="mb-4 p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all inline-flex items-center gap-2 backdrop-blur-sm"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Syllabus</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto pb-8 items-stretch">

                    {/* LEFT COLUMN: VIDEO PLAYER + NOTES */}
                    <div className="lg:col-span-8 flex flex-col gap-6 h-full min-w-0">

                        {/* 1. VIDEO PLAYER - Frosted Glass Card */}
                        <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl h-fit bg-gradient-to-b from-white/[0.08] to-white/[0.02]">

                            {/* Video Header - Frosted */}
                            <div className="relative p-5 pb-3 flex items-start justify-between backdrop-blur-xl bg-white/[0.03]">
                                <div className="flex-1">
                                    <h1 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2">{currentVideo.title}</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
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
                                        <button type="button"
                                            onClick={handleSaveToggle}
                                            className={`p-2 rounded-lg transition-all ${isSaved ? 'bg-purple-600/30 text-purple-400' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                                            title={isSaved ? 'Remove from Saved' : 'Save Lecture'}
                                        >
                                            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                                        </button>
                                    </AuthGate>
                                    <button type="button" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* YouTube Player */}
                            <div className="relative aspect-video mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/10 isolate bg-black">
                                {videoId ? (
                                    <iframe sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                                        key={videoId} // Key ensures iframe re-renders on video change
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
                                <button type="button"
                                    onClick={() => sendPlayerCommand('seekTo', [Math.max(0, -10), true])}
                                    className="size-14 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white active:scale-90"
                                    title="Rewind 10 seconds"
                                >
                                    <svg viewBox="0 0 24 24" className="size-10" fill="currentColor">
                                        <path d="M12 5V1l7 6-7 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                                        <text x="12" y="14.5" textAnchor="middle" fontSize="6" fontWeight="bold" stroke="none">10</text>
                                    </svg>
                                </button>

                                {/* Play/Pause Button with Animation */}
                                <button type="button"
                                    onClick={handlePlayPause}
                                    className="relative size-12 flex items-center justify-center bg-primary hover:bg-primary/80 rounded-full transition-all shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
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
                                <button type="button"
                                    onClick={() => sendPlayerCommand('seekTo', [10, true])}
                                    className="size-14 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white active:scale-90"
                                    title="Forward 10 seconds"
                                >
                                    <svg viewBox="0 0 24 24" className="size-10" fill="currentColor">
                                        <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                                        <text x="12" y="14.5" textAnchor="middle" fontSize="6" fontWeight="bold" stroke="none">10</text>
                                    </svg>
                                </button>

                                <div className="flex-1" />

                                {/* Mute/Unmute */}
                                <button type="button"
                                    onClick={handleMuteToggle}
                                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>

                                {/* Mark Finished Button */}
                                <button type="button"
                                    onClick={() => {
                                        if (currentVideo && user) {
                                            markVideoAsFinished(currentVideo.id, user.id, user.userClass, user.targetExam);
                                            
                                            // Mark as watched in SubtopicProgressService for Lectures sequential timeline
                                            const matchedTopic = resolveSyllabusTopicBySlug(topicId || '');
                                            if (matchedTopic) {
                                                SubtopicProgressService.markVideoWatched(user.id, matchedTopic.id, currentVideo.id).catch(console.error);
                                            }

                                            // Force re-render to show updated status
                                            setPlaylist({ ...playlist! });
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${currentVideo && user && isVideoFinished(currentVideo.id, user.id, user.userClass, user.targetExam)
                                        ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                        : 'bg-primary/20 text-primary hover:bg-primary/40 border-primary/20'
                                        }`}
                                >
                                    <Check size={14} />
                                    {currentVideo && user && isVideoFinished(currentVideo.id, user.id, user.userClass, user.targetExam) ? 'Finished' : 'Mark Finished'}
                                </button>

                                {/* Save Button */}
                                <AuthGate mode="modal">
                                    <button type="button"
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
                        <div className="relative rounded-[24px] overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-xl h-[600px] flex flex-col group/notes">
                            {/* Notes Header */}
                            <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                        <BookOpen size={16} />
                                    </div>
                                    <h3 className="font-bold text-base text-white">Lecture Notes</h3>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" 
                                        onClick={handleExportNotes}
                                        disabled={isExporting || !noteContent.trim()}
                                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"
                                    >
                                        {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
                                        {isExporting ? 'Exporting...' : 'Export PDF'}
                                    </button>
                                </div>
                            </div>

                            {/* Notes Input */}
                            <div className="relative p-5 flex-1 flex flex-col min-h-0 bg-gradient-to-b from-black/20 to-transparent">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    className="w-full h-full flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white/80 placeholder:text-white/20 text-[15px] leading-relaxed resize-none focus:outline-none focus:border-primary/40 focus:bg-white/5 transition-all font-medium custom-scrollbar"
                                    placeholder="Write your study notes here... supports Markdown logic like **bold** or lists."
                                />
                                
                                {/* Shadow Renderer for PDF */}
                                <div ref={shadowNoteRef} className="hidden">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {noteContent}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Notes Footer */}
                            <div className="relative px-5 pb-5 flex justify-end shrink-0">
                                <AuthGate mode="modal">
                                    <button type="button" 
                                        onClick={handleSaveNote}
                                        disabled={isSavingNote || !noteContent.trim()}
                                        className="px-8 py-3 bg-white text-black hover:bg-primary hover:text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-black/40 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-3"
                                    >
                                        {isSavingNote ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                        {isSavingNote ? 'Saving...' : 'Save Note'}
                                    </button>
                                </AuthGate>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: COURSE CONTENT + AI */}
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full min-w-0">

                        {/* 2. PLAYLIST / COURSE CONTENT */}
                        <div className="rounded-[24px] overflow-hidden backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-2xl flex flex-col h-[580px]">
                            {/* Sidebar Header */}
                            <div className="relative p-5 pb-4">
                                <h2 className="text-lg font-bold text-white mb-4">Course Content</h2>

                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2">
                                    <button type="button" className="px-4 py-2 bg-primary/80 backdrop-blur-sm text-white text-xs font-semibold rounded-lg shadow-lg shadow-primary/20">All</button>
                                    <button type="button" className="px-4 py-2 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white/60 text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
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
                                        isSaved={savedVideos.some(sv => sv.id === video.id)}
                                        onSelect={(v) => { setCurrentVideo(v); setIsPlaying(true); }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 4. AI ASSISTANT - EXA BRANDED */}
                        <div className="rounded-[var(--card-radius)] overflow-hidden glass-card flex flex-col h-[725px]">
                            {/* AI Header - Exa Brand */}
                            <div className="relative px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg ring-1 ring-white/20">
                                        <Bot size={22} className="text-white" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-[17px] text-text-main tracking-tight">Exa</h3>
                                        <span className="px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/30">AI</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button type="button"
                                        onClick={() => setIsCalling(true)}
                                        title="Voice Call"
                                        className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all oxygen-button"
                                    >
                                        <Phone size={18} />
                                    </button>
                                    <button type="button"
                                        onClick={() => {
                                            if (isSpeaking) {
                                                window.speechSynthesis.cancel();
                                                setIsSpeaking(false);
                                                return;
                                            }
                                            const lastAssistantMsg = [...chatMessages].reverse().find(m => m.sender === 'bot');
                                            if (lastAssistantMsg) speakText(lastAssistantMsg.text);
                                        }}
                                        title="Voice Reply"
                                        className={`p-2 rounded-lg transition-all oxygen-button ${isSpeaking ? 'text-primary bg-primary/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Volume2 size={18} className={isSpeaking ? 'animate-pulse' : ''} />
                                    </button>
                                    <button type="button"
                                        onClick={() => setShowSettings(!showSettings)}
                                        title="AI Settings"
                                        className={`p-2 rounded-lg transition-all oxygen-button ${showSettings ? 'text-primary bg-primary/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button type="button" title="Close Chat" className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all oxygen-button ml-1"><X size={18} /></button>
                                </div>

                                {/* Settings Dropdown */}
                                {showSettings && (
                                    <div className="absolute top-[70px] right-6 w-48 bg-[#0d0e14] border border-border rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-border">
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Voice Engine</p>
                                        </div>
                                        <div className="p-1">
                                            {VOICE_PRESETS.slice(0, 3).map(preset => (
                                                <button type="button"
                                                    key={preset.id}
                                                    onClick={() => {
                                                        setSelectedPresetId(preset.id);
                                                        localStorage.setItem('exa_sidebar_voice_id', preset.id);
                                                        speakText(`How do I sound now?`);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${selectedPresetId === preset.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-white/40 hover:bg-white/5'}`}
                                                >
                                                    {preset.name} {selectedPresetId === preset.id && <Check size={12} />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-1 border-t border-border">
                                            <button type="button" onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                Reset AI Memory
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Messages */}
                            <div ref={chatContainerRef} className="relative p-6 flex-1 min-h-[250px] overflow-y-auto custom-scrollbar flex flex-col gap-6">
                                {/* Calling Overlay */}
                                {isCalling && (
                                    <div className="absolute inset-0 bg-[#0d0e14]/95 backdrop-blur-3xl z-30 flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <div className="relative">
                                            <div className="absolute inset-0 animate-ping bg-primary/20 rounded-full" />
                                            <div className="size-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl relative z-10 ring-1 ring-white/20">
                                                <Bot size={40} className="text-white" />
                                            </div>
                                        </div>
                                        <h3 className="mt-8 text-2xl font-bold text-white tracking-tight">Calling Exa…</h3>
                                        <p className="text-white/40 text-sm mt-2">{isMicMuted ? 'Microphone Muted' : 'Connecting secure study session'}</p>

                                        <div className="flex items-center gap-6 mt-20">
                                            <button type="button"
                                                onClick={() => setIsMicMuted(!isMicMuted)}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicMuted ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                                            >
                                                {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                            </button>
                                            <button type="button"
                                                onClick={() => setIsCalling(false)}
                                                className="size-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                                            >
                                                <X size={28} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 w-full ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 hover:scale-110 ${msg.sender === 'user'
                                            ? 'bg-blue-600 ring-2 ring-blue-500/20'
                                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-purple-500/20'
                                            }`}>
                                            {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={15} className="text-white" />}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className="flex flex-col gap-1.5 max-w-[85%]">
                                            {msg.sender === 'bot' && (
                                                <div className="flex items-center gap-1.5 ml-1">
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Exa</span>
                                                    <div className="size-1 rounded-full bg-purple-500/30" />
                                                </div>
                                            )}
                                            <div className={`relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-lg transition-all duration-300 ${msg.sender === 'user'
                                                ? 'bg-primary text-white rounded-tr-sm shadow-primary/10'
                                                : 'bg-white/5 text-text-main/90 rounded-tl-sm border border-border shadow-black/10'
                                                }`}>
                                                {/* Fancy mini-icon for Exa as seen in image */}
                                                {msg.sender === 'bot' && (
                                                    <div className="flex items-center gap-2 mb-2 text-white/20">
                                                        <MessageSquare size={10} className="opacity-50" />
                                                        <div className="h-px flex-1 bg-white/5" />
                                                    </div>
                                                )}

                                                {msg.sender === 'bot' ? renderMarkdown(msg.text) : (
                                                    <span className="font-medium">{msg.text}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Loading indicator */}
                                {isAiLoading && (
                                    <div className="flex gap-4 w-full">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-purple-500/20">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-white/5 rounded-2xl rounded-tl-sm px-5 py-3 border border-border flex items-center gap-3 shadow-lg">
                                            <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="size-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="size-1.5 bg-primary/60 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Field - Same to Same Design */}
                            <div className="relative px-6 pb-6 pt-2 shrink-0 bg-gradient-to-t from-background/50 to-transparent">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) alert(`Selected: ${e.target.files[0].name}`);
                                    }}
                                />
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const userText = aiInput.trim();
                                    if (!userText || isAiLoading) return;

                                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                                    setIsSpeaking(false);

                                    setAiInput('');
                                    const userMsg = { id: Date.now(), text: userText, sender: 'user' } as any;
                                    addMessage(userMsg);
                                    setIsAiLoading(true);

                                    setTimeout(() => {
                                        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
                                    }, 100);

                                    try {
                                        const history = chatMessages.slice(-9).map(m => ({
                                            role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                                            content: m.text
                                        }));

                                        const context = `Study Mode. Topic: ${topicId}. Video: ${currentVideo?.title}. Focus: Academic excellence.`;
                                        const response = await askAI(
                                            context, 
                                            userText, 
                                            'groq', 
                                            history, 
                                            { stream: true }, 
                                            user as any, 
                                            false, 
                                            undefined, 
                                            undefined, 
                                            [], 
                                            (s) => setIsSearching(s),
                                            { language: selectedLanguage }
                                        );

                                        if (typeof response === 'string') {
                                             addMessage({ id: Date.now() + 1, text: response, sender: 'bot' });
                                         } else {
                                             let fullText = "";
                                             const botId = Date.now() + 1;
                                             let botMessageAdded = false;

                                             if (response && typeof (response as any)[Symbol.asyncIterator] === 'function') {
                                                 for await (const chunk of (response as any)) {
                                                     const content = chunk.choices?.[0]?.delta?.content 
                                                         || chunk.candidates?.[0]?.content?.parts?.[0]?.text 
                                                         || "";
                                                     if (content) {
                                                         fullText += content;
                                                         if (!botMessageAdded) {
                                                             addMessage({ id: botId, text: fullText, sender: 'bot', isStreaming: true });
                                                             botMessageAdded = true;
                                                         } else {
                                                             setMessages((prev: any) => prev.map((m: any) => 
                                                                 m.id === botId ? { ...m, text: fullText } : m
                                                             ));
                                                         }
                                                     }
                                                 }
                                             } else {
                                                 fullText = (response as any)?.choices?.[0]?.message?.content 
                                                     || (response as any)?.choices?.[0]?.delta?.content 
                                                     || (response as any)?.content 
                                                     || String(response);
                                                 addMessage({ id: botId, text: fullText, sender: 'bot' });
                                                 botMessageAdded = true;
                                             }

                                             setMessages((prev: any) => prev.map((m: any) => 
                                                 m.id === botId ? { ...m, isStreaming: false } : m
                                             ));
                                             extractAndSaveMemory(userText);
                                         }
                                    } catch (error) {
                                        console.error("AI Error:", error);
                                        addMessage({ id: Date.now() + 1, text: "I'm having a connection issue. Try again? 🌸", sender: 'bot' });
                                    } finally {
                                        setIsAiLoading(false);
                                        setTimeout(() => {
                                            chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
                                        }, 100);
                                    }
                                }} className="group">
                                    <div className="flex items-center gap-2 bg-white/5 border border-border rounded-[22px] p-2 focus-within:border-primary/40 focus-within:bg-white/10 transition-all duration-300 shadow-2xl backdrop-blur-md group-focus-within:shadow-primary/5">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Add File"
                                            className="size-10 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 rounded-full transition-all flex-shrink-0 oxygen-button"
                                        >
                                            <Paperclip size={20} className="-rotate-45" />
                                        </button>
                                        <input
                                            type="text"
                                            value={aiInput}
                                            onChange={(e) => setAiInput(e.target.value)}
                                            placeholder="Ask Exa anything..."
                                            className="flex-1 bg-transparent text-white/80 placeholder:text-white/20 text-[15px] focus:outline-none px-2 font-medium"
                                            disabled={isAiLoading}
                                        />
                                        <AuthGate mode="modal">
                                            <button
                                                type="submit"
                                                disabled={isAiLoading || !aiInput.trim()}
                                                className="size-10 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/80 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-primary/20 active:scale-95 flex-shrink-0 oxygen-button"
                                            >
                                                {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                            </button>
                                        </AuthGate>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

