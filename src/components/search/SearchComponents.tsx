import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Music } from 'lucide-react';

export interface TrackCardProps {
    track: any;
    currentTrackId?: string;
    isPlaying: boolean;
    onPlay: (track: any) => void;
    size?: 'small' | 'medium' | 'large';
}

export const TrackCard: React.FC<TrackCardProps> = memo(({ track, currentTrackId, isPlaying, onPlay, size = 'medium' }) => {
    const isCurrent = currentTrackId === track.id;
    const [hasError, setHasError] = useState(false);

    if (hasError) return null;

    return (
        <motion.div
            className={`track-card glass glass-hover ${size} ${isCurrent ? 'playing' : ''}`}
            onClick={() => onPlay(track)}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="card-art">
                {track.artwork && (
                    <img
                        src={track.artwork}
                        alt={track.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setHasError(true)}
                    />
                )}
                <button className="card-play-overlay">
                    {isCurrent && isPlaying ? (
                        <div className="playing-bars-mini"><span></span><span></span><span></span></div>
                    ) : (
                        <Play size={24} fill="currentColor" />
                    )}
                </button>
            </div>
            <div className="card-info">
                <h4 className="card-name">{track.title}</h4>
                <p className="card-artist">{track.artist}</p>
            </div>
        </motion.div>
    );
});

export interface VibeCardProps {
    genre: string;
    color: string;
    onSelect: (genre: string) => void;
}

export const VibeCard: React.FC<VibeCardProps> = memo(({ genre, color, onSelect }) => (
    <motion.div
        className="vibe-category-card"
        style={{ background: color }}
        onClick={() => onSelect(genre)}
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <h3>{genre}</h3>
        <div className="vibe-icon-bg"><Music size={64} /></div>
    </motion.div>
));

export interface TrackSkeletonProps {
    count?: number;
    size?: string;
}

export const TrackSkeleton: React.FC<TrackSkeletonProps> = memo(({ count = 6, size = 'medium' }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={`skel-${i}`} className={`skeleton-card ${size}`}>
                <div className="skeleton skeleton-image" style={{ borderRadius: '12px' }} />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
        ))}
    </>
));
