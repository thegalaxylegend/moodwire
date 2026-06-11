import { useVibeStore } from '../store/vibeStore';
import { DisplayTransformer } from '../utils/DisplayTransformer';
import { audiusService } from '../services/audiusService';
import { youtubeService } from '../services/youtubeService';

class AudioEngine {
    private context: AudioContext | null = null;
    private audio: HTMLAudioElement | null = null;
    private source: MediaElementAudioSourceNode | null = null;
    private gainNode: GainNode | null = null;
    private wakeLock: any = null;
    private progressInterval: number | null = null;
    private preloadAudio: HTMLAudioElement | null = null;
    private lastTrackId: string | null = null;
    private isInitializing: boolean = false;
    private active: boolean = false;
    private pendingTrackId: string | null = null;

    constructor() {
        // Create audio element immediately for reuse
        if (typeof window !== 'undefined') {
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";

            this.audio.addEventListener('durationchange', () => {
                const { currentTrack, setDuration } = useVibeStore.getState();
                if (this.audio && this.active && currentTrack?.id === this.lastTrackId) {
                    setDuration(this.audio.duration);
                }
            });

            this.audio.addEventListener('ended', () => {
                if (this.active) {
                    useVibeStore.getState().playNext('Audius Ended');
                }
            });

            this.audio.addEventListener('error', (e) => {
                if (!this.active) return;

                const mediaError = (e.target as HTMLAudioElement)?.error;
                if (mediaError?.code === MediaError.MEDIA_ERR_ABORTED) return;

                console.error(`Audio link broken (${this.lastTrackId}). Attempting recovery...`, e);
                this.attemptRecovery(mediaError);
            });

            this.preloadAudio = new Audio();
            this.preloadAudio.crossOrigin = "anonymous";
            this.preloadAudio.preload = "auto";
        }
    }

    private async initContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.context.destination);

            if (this.audio) {
                this.source = this.context.createMediaElementSource(this.audio);
                this.source.connect(this.gainNode);
            }
        }

        if (this.context.state === 'suspended') {
            await this.context.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }

        this.requestWakeLock();
        this.updateMediaSession();
    }

    private async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await (navigator as any).wakeLock.request('screen');
            } catch (err) {
                console.warn('Wake Lock error:', err);
            }
        }
    }

    private updateMediaSession() {
        if ('mediaSession' in navigator) {
            const { currentTrack } = useVibeStore.getState();

            const cleanTitle = DisplayTransformer.cleanTitle(currentTrack?.title || 'MoodWire');
            const cleanArtist = DisplayTransformer.cleanArtist(currentTrack?.artist || 'MoodWire Live');

            navigator.mediaSession.metadata = new MediaMetadata({
                title: cleanTitle,
                artist: cleanArtist,
                album: 'MoodWire Universe',
                artwork: currentTrack?.artwork ? [
                    { src: currentTrack.artwork, sizes: '512x512', type: 'image/jpeg' }
                ] : []
            });

            navigator.mediaSession.setActionHandler('play', () => useVibeStore.getState().setIsPlaying(true));
            navigator.mediaSession.setActionHandler('pause', () => useVibeStore.getState().setIsPlaying(false));
            navigator.mediaSession.setActionHandler('stop', () => this.stop());
        }
    }

    private applyGainAndRamp() {
        if (!this.gainNode || !this.context) return;

        const state = useVibeStore.getState();
        const track = state.currentTrack;
        const baseVolume = state.volume / 100;

        // --- SOURCE LOUDNESS NORMALIZATION ---
        let sourceOffset = 1.0;
        if (track?.source === 'audius') sourceOffset = 1.10;
        if (track?.trustTier === 1.0) sourceOffset = 0.95;
        if (track?.trustTier === 0.4) sourceOffset = 0.85;

        const targetGain = baseVolume * sourceOffset;

        // --- CHAOS-PROOF RAMP (setTargetAtTime) ---
        const now = this.context.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        // 0.1 time constant leads to ~400ms to reach 95% of target
        this.gainNode.gain.setTargetAtTime(targetGain, now, 0.1);
    }

    public async play(url: string) {
        const { currentTrack } = useVibeStore.getState();
        const trackId = currentTrack?.id || url;

        // Track the LATEST requested URL/Track
        this.pendingTrackId = trackId;

        // Don't try to play YouTube URLs through audioEngine
        if (currentTrack?.source === 'youtube') {
            console.log('🔇 AudioEngine: YouTube source detected. Silencing Audius engine.');
            this.active = false;
            this.stop(); // Use stop() instead of partial cleanup
            return;
        }

        console.log(`🎵 AudioEngine: Playing ${currentTrack?.title} (${url})`);
        this.active = true;

        // If it's already the active playing track, just ensure it's playing
        if (this.lastTrackId === trackId && this.audio && this.audio.src) {
            if (this.audio.paused) {
                await this.initContext();
                this.applyGainAndRamp();
                this.audio.play().catch(() => { });
                this.startProgressTracker();
            }
            return;
        }

        // AGGRESSIVE RESET: Stop current playback BEFORE anything else
        if (this.audio) {
            this.audio.pause();
            this.stopProgressTracker();
        }

        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            await this.initContext();

            // CRITICAL RACE CHECK: Did the user skip or pause while we were initializing context?
            if (this.pendingTrackId !== trackId || !this.active) {
                console.log('🛑 Play cancelled: Track superseded or paused during initialization');
                this.isInitializing = false;
                if (this.active) {
                    const latestTrack = useVibeStore.getState().currentTrack;
                    if (latestTrack && latestTrack.url && latestTrack.id !== trackId) {
                        this.play(latestTrack.url);
                    }
                }
                return;
            }

            if (!this.audio) return;

            this.lastTrackId = trackId;
            this.audio.src = url;
            this.audio.load();
            this.applyGainAndRamp();

            const playPromise = this.audio.play();
            if (playPromise) {
                await playPromise;
            }

            // FINAL RACE CHECK
            if (this.pendingTrackId !== trackId || !this.active) {
                console.log('🛑 Play cancelled: Track superseded or paused after play started');
                this.audio.pause();
                this.isInitializing = false;
                return;
            }

            this.startProgressTracker();
            setTimeout(() => this.prefetchNext(), 2000);

            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                console.warn('Playback initialization failed:', e);
            }
        } finally {
            this.isInitializing = false;
        }
    }

    public pause() {
        this.active = false;
        if (this.audio) {
            this.audio.pause();
            this.stopProgressTracker();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        }
    }

    public resume() {
        if (this.audio && this.audio.paused) {
            this.applyGainAndRamp();
            this.audio.play().catch(() => { });
            this.startProgressTracker();
        }
    }

    public stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.src = "";
        }
        if (this.wakeLock) {
            this.wakeLock.release().then(() => {
                this.wakeLock = null;
            });
        }
        this.stopProgressTracker();
    }

    public setVolume(_volume: number) {
        this.applyGainAndRamp();
    }

    public seekTo(time: number) {
        if (this.audio) {
            this.audio.currentTime = time;
            this.updateMediaSessionPosition();
        }
    }

    private updateMediaSessionPosition() {
        if ('mediaSession' in navigator && this.audio && this.audio.duration > 0 && !isNaN(this.audio.duration)) {
            try {
                const position = Math.min(this.audio.currentTime, this.audio.duration);
                navigator.mediaSession.setPositionState({
                    duration: this.audio.duration,
                    playbackRate: this.audio.playbackRate,
                    position: position
                });
            } catch (e) {
                console.warn('Failed to update MediaSession position:', e);
            }
        }
    }

    private startProgressTracker() {
        this.stopProgressTracker();
        this.progressInterval = window.setInterval(() => {
            if (this.audio && !this.audio.paused) {
                useVibeStore.getState().setProgress(this.audio.currentTime);
            }
        }, 500) as unknown as number;
    }

    private prefetchNext() {
        if (!this.preloadAudio) return;
        const state = useVibeStore.getState();
        const { queue, currentTrack } = state;
        if (queue.length === 0) return;

        const currentIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
        const nextTrack = queue[(currentIndex + 1) % queue.length];

        if (nextTrack && nextTrack.url && nextTrack.source !== 'youtube') {
            console.log('⏳ Preloading next track:', nextTrack.title);
            this.preloadAudio.src = nextTrack.url;
            this.preloadAudio.load();
        }
    }

    private async attemptRecovery(error: MediaError | null) {
        const { currentTrack, replaceCurrentTrack, playNext } = useVibeStore.getState();
        if (!currentTrack) return;

        // 1. Try Audius Gateway Rotation
        if (currentTrack.source === 'audius') {
            console.log('🔄 Recovery: Rotating Audius Gateway...');
            audiusService.refreshHost();
            try {
                const newUrl = await audiusService.getStreamUrl(currentTrack.id);
                console.log(`♻️ Recovery: New Stream URL generated: ${newUrl}`);
                if (this.audio) {
                    this.audio.src = newUrl;
                    this.audio.load();
                    this.audio.play().catch(e => console.warn('Recovery Play failed:', e));
                    return; // Recovery successful
                }
            } catch (e) {
                console.warn('❌ Recovery: Gateway rotation failed.', e);
            }
        }

        // 2. YouTube Fallback
        console.log('📺 Recovery: Attempting YouTube Fallback...');
        const query = `${currentTrack.artist} - ${currentTrack.title} official audio`;
        try {
            const results = await youtubeService.searchVideos(query);
            if (results && results.length > 0) {
                const fallbackTrack = results[0];
                // Preserve metadata if possible, but trust YouTube for ID/URL
                const newTrack = {
                    ...currentTrack,
                    id: fallbackTrack.id, // YouTube ID
                    url: fallbackTrack.url, // YouTube URL
                    source: 'youtube' as const,
                    artwork: fallbackTrack.artwork || currentTrack.artwork,
                    duration: fallbackTrack.duration || currentTrack.duration
                };

                console.log(`✅ Recovery: Found YouTube fallback: ${newTrack.title}`);
                replaceCurrentTrack(newTrack);
                return;
            }
        } catch (e) {
            console.error('❌ Recovery: YouTube fallback failed', e);
        }

        // 3. Give up and Skip
        console.warn('☠️ Recovery failed. Skipping track.');
        playNext(`Playback Error: ${error?.code || 'Unknown'}`);
    }

    private stopProgressTracker() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }
}

export const audioEngine = new AudioEngine();
