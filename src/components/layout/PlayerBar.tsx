import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Repeat, Shuffle, Heart, Headphones, Ban } from 'lucide-react';
import { useVibeStore } from '../../store/vibeStore';
import { audioEngine } from '../../lib/audioEngine';
import { DisplayTransformer } from '../../utils/DisplayTransformer';

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
}

const PlayerBar: React.FC = () => {
    const {
        currentTrack, isPlaying, volume, progress, duration,
        togglePlay, setVolume, ghostDataMode, favorites, toggleFavorite,
        playNext, playPrevious, seekTo, toggleFullScreen, setIsPlaying,
        setProgress, setDuration, seekRequest, isFullScreen,
        dislikedTracks, toggleDislike // New Actions
    } = useVibeStore();

    const ytPlayerRef = useRef<any>(null);
    const ytIntervalRef = useRef<number | null>(null);
    const lastYtTrackId = useRef<string | null>(null);

    const isFavorite = currentTrack ? favorites.some((t: any) => t.id === currentTrack.id) : false;

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    // Load YouTube IFrame API once
    useEffect(() => {
        if ((window as any).YT) return;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }, []);

    // Create/destroy YT player when YouTube track changes
    useEffect(() => {
        // AGGRESSIVE CLEANUP: If full screen is active, THIS player instance must die
        if (isFullScreen || currentTrack?.source !== 'youtube') {
            if (ytPlayerRef.current) {
                console.log('PlayerBar: Fullscreen active or non-YT track, destroying background player. isFS:', isFullScreen);
                try {
                    if (typeof ytPlayerRef.current.destroy === 'function') {
                        ytPlayerRef.current.destroy();
                    }
                } catch (e) {
                    console.warn('PlayerBar: Cleanup fail', e);
                }
                ytPlayerRef.current = null;
                lastYtTrackId.current = null;
            }
            if (ytIntervalRef.current) {
                clearInterval(ytIntervalRef.current);
                ytIntervalRef.current = null;
            }
            return;
        }

        const videoId = currentTrack?.url ? getYouTubeId(currentTrack.url) : null;
        if (!videoId) return;

        // Skip if same track
        if (lastYtTrackId.current === currentTrack.id) return;
        lastYtTrackId.current = currentTrack.id;

        // Stop audio engine for YouTube tracks
        audioEngine.pause();

        const createPlayer = () => {
            // Destroy old player
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch (_) { }
                ytPlayerRef.current = null;
            }
            if (ytIntervalRef.current) {
                clearInterval(ytIntervalRef.current);
                ytIntervalRef.current = null;
            }

            const container = document.getElementById('yt-player-container');
            if (!container) {
                // Container not yet in DOM, retry shortly
                setTimeout(createPlayer, 200);
                return;
            }

            ytPlayerRef.current = new (window as any).YT.Player('yt-player-container', {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event: any) => {
                        console.log(`YT Player Ready for ${videoId} — playing (Data Saver Mode)`);
                        event.target.setVolume(useVibeStore.getState().volume);
                        event.target.setPlaybackQuality('tiny'); // Force 144p for data saving

                        // RESUME FIX: Seek to current progress before playing
                        const currentProgress = useVibeStore.getState().progress;
                        if (currentProgress > 0) {
                            event.target.seekTo(currentProgress, true);
                        }

                        // Use a slight delay to ensure browser acknowledges the user-intent-driven playback
                        setTimeout(() => {
                            try { event.target.playVideo(); } catch (e) { console.warn('Autoplay block?', e); }
                        }, 100);

                        const dur = event.target.getDuration();
                        if (dur) setDuration(dur);
                        setProgress(0);
                    },
                    onStateChange: (event: any) => {
                        const YT = (window as any).YT;
                        if (event.data === YT.PlayerState.PLAYING) {
                            if (!useVibeStore.getState().isPlaying) setIsPlaying(true);
                            // Start progress tracking
                            if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                            ytIntervalRef.current = window.setInterval(() => {
                                if (ytPlayerRef.current?.getCurrentTime) {
                                    setProgress(ytPlayerRef.current.getCurrentTime());
                                }
                                if (ytPlayerRef.current?.getDuration) {
                                    const d = ytPlayerRef.current.getDuration();
                                    if (d && d !== useVibeStore.getState().duration) {
                                        setDuration(d);
                                    }
                                }
                            }, 500);
                        } else if (event.data === YT.PlayerState.PAUSED) {
                            console.log('PlayerBar: YT Event PAUSED. Global isPlaying:', useVibeStore.getState().isPlaying, 'isFS:', useVibeStore.getState().isFullScreen);
                            // Only update state if NOT expecting full screen handover
                            if (useVibeStore.getState().isPlaying && !useVibeStore.getState().isFullScreen) {
                                console.log('PlayerBar: YouTube Paused, updating partial state');
                                setIsPlaying(false);
                            } else if (useVibeStore.getState().isFullScreen) {
                                console.log('PlayerBar: YouTube Paused but FullScreen active — IGNORING to prevent handover pause');
                            }
                            if (ytIntervalRef.current) {
                                clearInterval(ytIntervalRef.current);
                                ytIntervalRef.current = null;
                            }
                        } else if (event.data === YT.PlayerState.ENDED) {
                            if (ytIntervalRef.current) {
                                clearInterval(ytIntervalRef.current);
                                ytIntervalRef.current = null;
                            }
                            console.log('PlayerBar: YouTube Ended, playing next');
                            playNext('YouTube Ended');
                        }
                    },
                    onError: (event: any) => {
                        console.error(`YT Player Error (${event.data}) for ${videoId}. Skipping...`);
                        // Errors like 101/150 mean the video can't be played in embedded players
                        playNext(`YouTube Error: ${event.data}`);
                    }
                }
            });
        };

        // Wait for YT API to be ready
        if ((window as any).YT?.Player) {
            createPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            if (ytIntervalRef.current) {
                clearInterval(ytIntervalRef.current);
                ytIntervalRef.current = null;
            }
        };
    }, [currentTrack?.id, currentTrack?.source, isFullScreen]); // Re-run when fullscreen changes

    // Sync play/pause from UI to YouTube player
    useEffect(() => {
        if (currentTrack?.source !== 'youtube' || !ytPlayerRef.current) return;
        try {
            if (isPlaying) {
                ytPlayerRef.current.playVideo?.();
            } else {
                ytPlayerRef.current.pauseVideo?.();
            }
        } catch (_) { }
    }, [isPlaying]);

    // Sync volume to YT player
    useEffect(() => {
        if (currentTrack?.source !== 'youtube' || !ytPlayerRef.current) return;
        try {
            // Mute background player if full screen is open (MusicPlayerFullScreen takes over)
            ytPlayerRef.current.setVolume?.(isFullScreen ? 0 : volume);
        } catch (_) { }
    }, [volume, isFullScreen]);

    // Handle centralized seek requests
    useEffect(() => {
        if (seekRequest && seekRequest.ts > 0) {
            if (currentTrack?.source === 'youtube' && ytPlayerRef.current) {
                try { ytPlayerRef.current.seekTo?.(seekRequest.time, true); } catch (_) { }
            } else {
                audioEngine.seekTo(seekRequest.time);
            }
        }
    }, [seekRequest, currentTrack]);

    // Audius playback via audioEngine
    useEffect(() => {
        if (currentTrack?.source === 'youtube') {
            audioEngine.pause();
        } else if (isPlaying && currentTrack?.url) {
            audioEngine.play(currentTrack.url);
        } else {
            audioEngine.pause();
        }
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        audioEngine.setVolume(volume);
    }, [volume]);

    const handlePlayPause = () => {
        togglePlay();
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        seekTo(time);
    };

    // Failsafe: Sync isPlaying with audio state (Audius only)
    useEffect(() => {
        if (currentTrack?.source === 'youtube') return;
        const interval = setInterval(() => {
            const actualPlaying = !audioEngine['audio']?.paused && audioEngine['audio']?.src;
            if (actualPlaying && !isPlaying && currentTrack) {
                setIsPlaying(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, currentTrack, setIsPlaying]);

    const [artError, setArtError] = React.useState(false);

    useEffect(() => {
        setArtError(false);
    }, [currentTrack?.id]);

    return (
        <>
            <div className="player-bar glass">
                <div className="current-track">
                    <div className="album-art glow-on-hover">
                        {currentTrack?.artwork && !ghostDataMode && !artError ? (
                            <img
                                src={currentTrack.artwork}
                                alt={currentTrack.title}
                                className="art-img"
                                onError={() => setArtError(true)}
                            />
                        ) : (
                            <div className="art-placeholder" />
                        )}
                    </div>
                    <div className="track-info">
                        <h4 className="track-name">{currentTrack ? DisplayTransformer.cleanTitle(currentTrack.title) : 'Select a Vibe'}</h4>
                        <p className="artist-name">{currentTrack ? DisplayTransformer.cleanArtist(currentTrack.artist) : 'MoodWire Live'}</p>
                    </div>
                    <button
                        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                        onClick={() => currentTrack && toggleFavorite(currentTrack)}
                        style={{ color: isFavorite ? '#ef4444' : 'inherit' }}
                        title="Like"
                    >
                        <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
                    </button>
                    <button
                        className={`dislike-btn ${dislikedTracks.includes(currentTrack?.id || '') ? 'active' : ''}`}
                        onClick={() => currentTrack && toggleDislike(currentTrack.id)}
                        style={{ marginLeft: '8px', color: dislikedTracks.includes(currentTrack?.id || '') ? '#ef4444' : 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Dislike & Skip"
                    >
                        <Ban size={18} />
                    </button>
                </div>

                <div className="player-controls">
                    <div className="control-buttons">
                        <button className="control-btn secondary"><Shuffle size={18} /></button>
                        <button className="control-btn secondary" onClick={playPrevious}>
                            <SkipBack size={20} fill="currentColor" />
                        </button>
                        <button
                            className="play-btn"
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" style={{ marginLeft: '4px' }} />}
                        </button>
                        <button className="control-btn secondary" onClick={() => playNext('Manual Skip')}>
                            <SkipForward size={20} fill="currentColor" />
                        </button>
                        <button className="control-btn secondary"><Repeat size={18} /></button>
                    </div>
                    <div className="progress-container">
                        <span className="time-text">{formatTime(progress)}</span>
                        <div className="progress-bar-bg">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={progress}
                                onChange={handleSeek}
                                className="seek-slider"
                                style={{
                                    width: '100%',
                                    height: '24px',
                                    position: 'absolute',
                                    left: 0,
                                    top: '-9px',
                                    zIndex: 2,
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}>
                                <div className="progress-knob" />
                            </div>
                        </div>
                        <span className="time-text">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="extra-controls">
                    <button className="control-btn secondary"><Headphones size={18} /></button>
                    <div className="volume-control">
                        <Volume2 size={18} />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="volume-slider"
                            style={{ height: '24px', top: '-9px' }}
                        />
                        <div className="volume-bar-bg progress-bar-bg" style={{ width: '100px' }}>
                            <div className="volume-bar-fill progress-bar-fill" style={{ width: `${volume}%` }} />
                        </div>
                    </div>
                    <button
                        className="control-btn secondary"
                        onClick={toggleFullScreen}
                        title="Full Screen"
                    >
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>

            {/* YouTube player — Kept 'visible' but hidden to avoid browser throttling of audio */}
            {currentTrack?.source === 'youtube' && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '200px',
                    height: '200px',
                    opacity: 0.01,
                    pointerEvents: 'none',
                    zIndex: -1,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    background: '#000'
                }}>
                    <div id="yt-player-container" style={{ width: '100%', height: '100%' }} />
                </div>
            )}
        </>
    );
};

export default PlayerBar;
