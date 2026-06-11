import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Ban } from 'lucide-react';
import { useVibeStore } from '../store/vibeStore';
import { lyricsService, type LyricLine } from '../services/lyricsService';
import { DisplayTransformer } from '../utils/DisplayTransformer';
import YouTube from 'react-youtube';

// Debug
console.log('FS: Using react-youtube (IFrame Wrapper)');

const MusicPlayerFullScreen: React.FC = () => {
    const {
        currentTrack, isPlaying, progress, duration,
        playNext, playPrevious, seekTo, togglePlay,
        isFullScreen, setFullScreen,
        volume,
        dislikedTracks, toggleDislike
    } = useVibeStore();

    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [isNativeFs, setIsNativeFs] = useState(false);
    const [viewMode, setViewMode] = useState<'video' | 'thumbnail'>('thumbnail');
    const [isSeeking, setIsSeeking] = useState(false);
    const [isHoveringLyrics, setIsHoveringLyrics] = useState(false);
    const lyricsRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    const [artError, setArtError] = useState(false);

    // Sync lyrics when track changes
    useEffect(() => {
        if (currentTrack) {
            setLyrics(lyricsService.getLyrics(currentTrack.id, currentTrack.title));
            setArtError(false); // Reset error state
        }
    }, [currentTrack]);

    const activeLyricIndex = lyrics.findIndex((l, i) => {
        const next = lyrics[i + 1];
        return progress >= l.time && (!next || progress < next.time);
    });

    // Fix: Memoize opts prevents re-iframe on every render
    const opts: any = useMemo(() => ({
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            controls: 0,
            origin: window.location.origin
        }
    }), []);

    // Helper to extract Video ID from URL
    const getVideoId = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            return urlObj.searchParams.get('v');
        } catch (e) {
            return null;
        }
    };

    // ... (rest of the code omitted for brevity but logic continues)

    // Sync isPlaying state to internal player
    useEffect(() => {
        if (playerRef.current && currentTrack?.source === 'youtube') {
            try {
                const playerState = playerRef.current.getPlayerState();
                console.log(`FS: Syncing isPlaying (${isPlaying}) - Current State: ${playerState}`);

                if (isPlaying && (playerState !== 1 && playerState !== 3)) { // 1: playing, 3: buffering
                    playerRef.current.playVideo();
                } else if (!isPlaying && playerState === 1) {
                    playerRef.current.pauseVideo();
                }
            } catch (e) {
                console.error('FS: Play/Pause Sync Failed', e);
            }
        }
    }, [isPlaying, currentTrack?.id]);

    // Handle seek requests in Full Screen (Centralized in Store, but we can also trigger direct seeks)
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setIsSeeking(true);
        seekTo(time); // Store update
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(time, true);
        }
    };

    const handleSeekEnd = () => {
        setIsSeeking(false);
    };

    // Update progress in store while playing in Full Screen (YouTube only)
    useEffect(() => {
        let interval: number | null = null;
        if (isFullScreen && isPlaying && !isSeeking && currentTrack?.source === 'youtube') {
            interval = window.setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    const currentTime = playerRef.current.getCurrentTime();
                    if (currentTime > 0) {
                        useVibeStore.getState().setProgress(currentTime);
                    }
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isFullScreen, isPlaying, isSeeking, currentTrack?.id]);

    // Auto-scroll lyrics (custom smooth scroll to keep active line centered)
    useEffect(() => {
        if (!isSeeking && !isHoveringLyrics && lyricsRef.current && activeLyricIndex !== -1) {
            const container = lyricsRef.current;
            const activeElement = container.children[activeLyricIndex] as HTMLElement;

            if (activeElement) {
                // Calculate position to center the active line
                // offsetTop is relative to the container because of `position: relative` (ensure container has it)
                const elementTop = activeElement.offsetTop;
                const elementHeight = activeElement.clientHeight;
                const containerHeight = container.clientHeight;

                const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);

                container.scrollTo({
                    top: targetScroll,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeLyricIndex, isSeeking, isHoveringLyrics]);

    // Native Fullscreen Logic
    const toggleNativeFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsNativeFs(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (!isFullScreen || !currentTrack) return null;

    return (
        <motion.div
            className="fullscreen-player"
            initial={{ y: '100vh' }}
            animate={{ y: 0 }}
            exit={{ y: '100vh' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
            {/* Cinematic Background */}
            <div className="fs-background">
                {currentTrack.artwork && !artError && (
                    <img
                        src={currentTrack.artwork}
                        alt=""
                        className="fs-bg-image"
                        onError={() => setArtError(true)}
                    />
                )}
                <div className="fs-bg-overlay" />
            </div>

            {/* Header Controls */}
            <div className="fs-header">
                <button className="fs-control-btn" onClick={() => setFullScreen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronDown size={32} />
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>Back</span>
                </button>
                <div className="fs-header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="native-fs-btn-static" onClick={toggleNativeFullscreen}>
                        {isNativeFs ? <Minimize size={20} /> : <Maximize size={20} />}
                        <span style={{ marginLeft: '8px' }}>{isNativeFs ? 'Exit Immersive' : 'Go Immersive'}</span>
                    </button>
                    {currentTrack.source === 'youtube' && (
                        <button
                            className="native-fs-btn-static"
                            onClick={() => setViewMode(v => v === 'video' ? 'thumbnail' : 'video')}
                            style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}
                        >
                            {viewMode === 'video' ? 'Thumbnail Mode' : 'Watch Video'}
                        </button>
                    )}
                </div>
                <div style={{ width: 32 }} /> {/* Balancer */}
            </div>

            {/* Main Immersive Content */}
            <div className="fs-content">
                <div className="fs-art-container">
                    {currentTrack.source === 'youtube' ? (
                        <div className="yt-mode-wrapper" style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                            <div className="yt-embed-container" style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 1,
                                opacity: viewMode === 'video' ? 1 : 0,
                                pointerEvents: viewMode === 'video' ? 'auto' : 'none',
                                transition: 'opacity 0.5s ease'
                            }}>
                                <YouTube
                                    videoId={getVideoId(currentTrack.url || '') || ''}
                                    style={{ width: '100%', height: '100%' }}
                                    opts={opts}
                                    onReady={(event) => {
                                        console.log('FS: react-youtube onReady. Target:', event.target);
                                        playerRef.current = event.target;
                                        event.target.setVolume(volume);
                                        if (progress > 0) {
                                            event.target.seekTo(progress, true);
                                        }
                                        if (isPlaying) {
                                            event.target.playVideo();
                                        }
                                    }}
                                    onStateChange={(e) => {
                                        if (e.data === 0) {
                                            console.log('FS: YouTube Ended, playing next');
                                            playNext('FS: YouTube Ended');
                                        }
                                    }}
                                    onError={(e) => {
                                        console.error('FS: YouTube Error', e.data);
                                        playNext(`FS: YouTube Error: ${e.data}`);
                                    }}
                                />
                            </div>

                            {/* Artwork Overlay (for Thumbnail Mode) */}
                            <motion.div
                                className="fs-artwork-wrapper"
                                animate={{
                                    opacity: viewMode === 'thumbnail' ? 1 : 0,
                                    scale: viewMode === 'thumbnail' ? 1 : 0.95
                                }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    pointerEvents: viewMode === 'thumbnail' ? 'auto' : 'none'
                                }}
                            >
                                {artError ? (
                                    <div className="fs-art-placeholder" style={{ width: '100%', height: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Play size={64} fill="rgba(255,255,255,0.1)" stroke="none" />
                                    </div>
                                ) : (
                                    <img
                                        src={currentTrack.artwork}
                                        alt={currentTrack.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '12px'
                                        }}
                                        onError={() => setArtError(true)}
                                    />
                                )}
                            </motion.div>
                        </div>
                    ) : (
                        <div className="fs-artwork-hero">
                            {artError ? (
                                <div className="fs-art-placeholder-hero">
                                    <Play size={120} fill="rgba(255,255,255,0.1)" stroke="none" />
                                </div>
                            ) : (
                                <img
                                    src={currentTrack.artwork}
                                    alt={currentTrack.title}
                                    onError={() => setArtError(true)}
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="fs-right-section">
                    <motion.div
                        className="fs-track-info"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ marginBottom: '2rem' }}
                    >
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                            {DisplayTransformer.cleanTitle(currentTrack.title)}
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', margin: '0.5rem 0 0' }}>
                            {DisplayTransformer.cleanArtist(currentTrack.artist)}
                        </p>
                    </motion.div>

                    <div
                        className="fs-lyrics-column"
                        ref={lyricsRef}
                        onMouseEnter={() => setIsHoveringLyrics(true)}
                        onMouseLeave={() => setIsHoveringLyrics(false)}
                    >
                        {lyrics.length > 0 ? (
                            lyrics.map((line, index) => (
                                <motion.p
                                    key={index}
                                    className={`fs-lyric-line ${index === activeLyricIndex ? 'active' : ''}`}
                                    animate={{
                                        opacity: index === activeLyricIndex ? 1 : 0.5,
                                        scale: index === activeLyricIndex ? 1.05 : 1,
                                        y: 0
                                    }}
                                >
                                    {line.text}
                                </motion.p>
                            ))
                        ) : (
                            <div className="fs-no-lyrics">
                                <p>Enjoy the vibe 🎵</p>
                            </div>
                        )}
                    </div>

                    <div className="fs-controls-container">
                        <div className="fs-progress-bar">
                            <span className="time-text">{formatTime(progress)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={progress}
                                onChange={handleSeek}
                                onMouseUp={handleSeekEnd}
                                onTouchEnd={handleSeekEnd}
                                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                            />
                            <span className="time-text">{formatTime(duration)}</span>
                        </div>

                        <div className="fs-controls-buttons" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                            <button
                                className="fs-control-action-btn"
                                onClick={() => toggleDislike(currentTrack.id)}
                                style={{ opacity: dislikedTracks.includes(currentTrack.id) ? 1 : 0.5, color: dislikedTracks.includes(currentTrack.id) ? '#ef4444' : 'currentColor' }}
                                title="Dislike & Skip"
                            >
                                <Ban size={24} />
                            </button>
                            <button className="fs-control-action-btn" onClick={playPrevious}>
                                <SkipBack size={32} fill="currentColor" />
                            </button>
                            <button className="fs-play-circle-btn" onClick={() => togglePlay()}>
                                {isPlaying ? <Pause size={40} fill="black" /> : <Play size={40} fill="black" style={{ marginLeft: 4 }} />}
                            </button>
                            <button className="fs-control-action-btn" onClick={() => playNext('FS: Manual Skip')}>
                                <SkipForward size={32} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default MusicPlayerFullScreen;
