import React, { memo } from 'react';
import { Play, Pause, Home, Search, Library, Crown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniPlayerProps {
    songTitle: string;
    artist: string;
    coverUrl: string;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onExpand: () => void;
    visible: boolean;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = memo(({
    songTitle,
    artist,
    coverUrl,
    isPlaying,
    onTogglePlay,
    onExpand,
    visible
}) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                className="mini-player"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={onExpand}
            >
                <img src={coverUrl} alt={songTitle} />
                <div className="info">
                    <div className="title">{songTitle}</div>
                    <div className="artist">
                        <span style={{ color: '#1DB954', fontWeight: 'bold' }}>E</span> {artist}
                    </div>
                </div>
                <div className="controls" onClick={(e) => e.stopPropagation()}>
                    <Plus size={20} color="#B3B3B3" />
                    <button
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        onClick={onTogglePlay}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                </div>
                <div className="progress">
                    <div className="progress-fill" style={{ width: '45%' }}></div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));

interface BottomNavItemProps {
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ label, icon, active, onClick }) => (
    <div className={`bottom-nav-item ${active ? 'active' : ''}`} onClick={onClick}>
        {icon}
        <span>{label}</span>
    </div>
);

export const BottomNavigation: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = memo(({
    activeTab,
    onTabChange
}) => (
    <nav className="bottom-nav">
        <BottomNavItem
            label="Home"
            icon={<Home size={24} fill={activeTab === 'home' ? "currentColor" : "none"} />}
            active={activeTab === 'home'}
            onClick={() => onTabChange('home')}
        />
        <BottomNavItem
            label="Search"
            icon={<Search size={24} />}
            active={activeTab === 'search'}
            onClick={() => onTabChange('search')}
        />
        <BottomNavItem
            label="Your Library"
            icon={<Library size={24} />}
            active={activeTab === 'library'}
            onClick={() => onTabChange('library')}
        />
        <BottomNavItem
            label="Premium"
            icon={<Crown size={24} />}
            active={activeTab === 'premium'}
            onClick={() => onTabChange('premium')}
        />
    </nav>
));
