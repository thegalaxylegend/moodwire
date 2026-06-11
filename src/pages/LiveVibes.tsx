import React, { useEffect, useState, memo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Users, Radio, Zap } from 'lucide-react';
import { useVibeStore } from '../store/vibeStore';
import { audiusService } from '../services/audiusService';
import { motion, AnimatePresence } from 'framer-motion';

const VibeTrackCard: React.FC<{
    track: any,
    currentTrackId?: string,
    onPlay: (track: any) => void,
    index: number
}> = memo(({ track, currentTrackId, onPlay, index }) => {
    const [hasError, setHasError] = useState(false);
    if (hasError) return null;

    return (
        <motion.div
            className={`track-card glass glass-hover ${currentTrackId === track.id ? 'playing' : ''}`}
            onClick={() => onPlay(track)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            <div className="card-art">
                {track.artwork && (
                    <img
                        src={track.artwork}
                        alt={track.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setHasError(true)}
                    />
                )}
            </div>
            <div className="card-info">
                <h4 className="card-name">{track.title}</h4>
                <p className="card-artist">{track.artist}</p>
            </div>
            <button className="card-play-btn">
                <Play size={16} fill="white" />
            </button>
        </motion.div>
    );
});

const LiveVibes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const {
        joinVibe, setTrack, setIsPlaying, currentTrack,
        isPlaying: _isPlaying, setIsMaster, isMaster, sendReaction,
        onReaction, setQueue
    } = useVibeStore();
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [localReactions, setLocalReactions] = useState<{ id: string, emoji: string, left: number }[]>([]);

    useEffect(() => {
        if (id) {
            joinVibe(id);
            setIsMaster(true);
        }
    }, [id, joinVibe, setIsMaster]);

    useEffect(() => {
        const unsubscribe = onReaction((reaction: { id: string, emoji: string }) => {
            const newReaction = {
                ...reaction,
                left: Math.random() * 80 + 10 // Random horizontal position
            };
            setLocalReactions(prev => [...prev.slice(-20), newReaction]);

            // Cleanup after animation
            setTimeout(() => {
                setLocalReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, 3000);
        });
        return () => unsubscribe();
    }, [onReaction]);

    const fetchVibeTracks = useCallback(async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        const vibeMap: Record<string, string[]> = {
            'love': ['bollywood romantic love hits', 'arijit singh romantic', 'hindi love songs', 'romance bollywood'],
            'sad': ['sad hindi songs', 'heartbroken bollywood', 'emotional arijit singh', 'dard bhare geet', 'bewafa songs'],
            'party': ['bollywood party dance hits', 'punjabi dance hits', 'badshah party songs', 'shubh punjabi'],
            'chill': ['lofi hindi', 'chill hindi relaxing', 'indian lofi beats', 'nusrat relax'],
            'gym': ['workout motivation hindi', 'punjabi gym songs', 'hard bass bollywood', 'sidhu moose wala pump'],
            'focus': ['indian classical focus', 'ambient hindi', 'meditation indian lofi', 'binaural beats indian'],
            'retro': ['kishore kumar hits', '70s bollywood hits', 'r d burman classics', 'lata mangeshkar golden'],
            'pop': ['punjabi pop hits', 'bollywood billboard', 'indian pop artists', 'ap dhillon'],
            'lofi': ['desi lofi', 'arijit singh lofi', 'lofi hindi songs', 'lofi punjabi']
        };

        const terms = vibeMap[id?.toLowerCase() || ''] || [`${id} vibes`, `${id} songs`, `indian ${id} music`];

        try {
            // Fetch multiple keywords in parallel for variety and robustness
            const searchPromises = terms.slice(0, 3).map(term => audiusService.searchTracks(term));
            const results = await Promise.all(searchPromises);
            const data = results.flat();

            // Filter for artwork and deduplicate by ID
            const seenIds = new Set();
            const validTracks = data.filter((t: any) => {
                if (!t.artwork || seenIds.has(t.id)) return false;
                seenIds.add(t.id);
                return true;
            });

            setTracks(prev => {
                if (!isMore) return validTracks.slice(0, 40);
                const existingIds = new Set(prev.map((t: any) => t.id));
                const newTracks = validTracks.filter((t: any) => !existingIds.has(t.id));
                return [...prev, ...newTracks.slice(0, 20)];
            });
        } catch (e) {
            console.error("Vibe fetch failed", e);
        }

        setLoading(false);
        setLoadingMore(false);
    }, [id]);

    useEffect(() => {
        fetchVibeTracks();
    }, [fetchVibeTracks]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        if (scrollBottom < 400 && !loading && !loadingMore && tracks.length > 0) {
            fetchVibeTracks(true);
        }
    };

    const handlePlayVibe = (track: any) => {
        setQueue(tracks);
        setTrack(track);
        setIsPlaying(true);
    };

    const emojis = ['🔥', '❤️', '👏', '⚡', '🤯'];
    const TrackSkeleton = ({ count = 12 }: { count?: number }) => (
        <>
            {Array.from({ length: count }).map((_, i: number) => (
                <div key={`skel-${i}`} className="skeleton-card medium">
                    <div className="skeleton skeleton-image" style={{ borderRadius: '12px' }} />
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                </div>
            ))}
        </>
    );

    return (
        <motion.div
            className="live-vibes-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onScroll={handleScroll}
            style={{ height: '100vh', overflowY: 'auto', paddingBottom: '140px' }}
        >
            <div className="reactions-container">
                <AnimatePresence>
                    {localReactions.map(r => (
                        <motion.div
                            key={r.id}
                            className="reaction-bubble"
                            style={{ left: `${r.left}%` }}
                            initial={{ bottom: '10%', opacity: 0, scale: 0.5 }}
                            animate={{ bottom: '80%', opacity: 1, scale: 1.2 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <header className="vibe-hero glass">
                <div className="vibe-meta">
                    <motion.div
                        className="vibe-badge"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Radio size={16} />
                        <span>Live Now</span>
                    </motion.div>
                    {isMaster ? (
                        <div className="sync-badge master">
                            <Zap size={14} fill="currentColor" />
                            <span>Hosting</span>
                        </div>
                    ) : (
                        <div className="sync-badge listener">
                            <Radio size={14} className="pulse" />
                            <span>Synced</span>
                        </div>
                    )}
                </div>
                <motion.h1
                    className="vibe-title"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {id?.toUpperCase()} Vibe
                </motion.h1>
                <div className="vibe-stats">
                    <div className="stat-item">
                        <Users size={18} />
                        <span>1.2k Vibesyncing</span>
                    </div>
                </div>
            </header>

            <section className="feed-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Vibe Selection</h2>
                    <div className="reaction-bar glass">
                        {emojis.map(e => (
                            <motion.button
                                key={e}
                                className="reaction-btn"
                                onClick={() => id && sendReaction(id, e)}
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.8 }}
                            >
                                {e}
                            </motion.button>
                        ))}
                    </div>
                </div>
                <div className="grid-container">
                    {loading ? (
                        <TrackSkeleton count={12} />
                    ) : tracks.length > 0 ? (
                        tracks.map((track, i) => (
                            <VibeTrackCard
                                key={track.id}
                                track={track}
                                currentTrackId={currentTrack?.id}
                                onPlay={handlePlayVibe}
                                index={i}
                            />
                        ))
                    ) : (
                        <div style={{ placeSelf: 'center', gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#888' }}>
                            <h3>No vibes found for "{id}"</h3>
                            <p>Try exploring other vibes or searching for music.</p>
                        </div>
                    )}
                    {loadingMore && <TrackSkeleton count={4} />}
                </div>
            </section>
        </motion.div>
    );
};

export default LiveVibes;
