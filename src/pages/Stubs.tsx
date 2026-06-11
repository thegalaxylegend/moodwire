import React from 'react';
import { useVibeStore } from '../store/vibeStore';
import { Heart, History, Play, Trash2, Library as LibraryIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
    exit: { opacity: 0, scale: 0.95 }
};

export const Library: React.FC = () => {
    const { history, favorites, setTrack, setIsPlaying, clearHistory, currentTrack, isPlaying } = useVibeStore();

    const handleTrackClick = (track: any) => {
        if (currentTrack?.id === track.id) {
            setIsPlaying(!isPlaying);
        } else {
            setTrack(track);
            setIsPlaying(true);
        }
    };

    const renderTrackList = (tracks: any[], title: string, icon: React.ReactNode, emptyMsg: string, showClear = false) => (
        <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {icon}
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h2>
                </div>
                {showClear && tracks.length > 0 && (
                    <button className="control-btn" onClick={clearHistory} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <Trash2 size={16} /> Clear History
                    </button>
                )}
            </div>

            {tracks.length === 0 ? (
                <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                        {icon}
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{emptyMsg}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <AnimatePresence mode="popLayout">
                        {tracks.map((track) => (
                            <motion.div
                                key={track.id}
                                variants={itemVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                layout
                                className={`glass glass-hover ${currentTrack?.id === track.id ? 'playing' : ''}`}
                                style={{
                                    padding: '0.75rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleTrackClick(track)}
                            >
                                <img
                                    src={track.artwork}
                                    alt={track.title}
                                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{track.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{track.artist}</p>
                                </div>
                                <button className="card-play-btn" style={{ position: 'static', opacity: 1, transform: 'none' }}>
                                    {currentTrack?.id === track.id && isPlaying ? <div className="playing-bars"><span></span><span></span><span></span></div> : <Play size={16} fill="white" />}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );

    return (
        <div className="library-page" style={{ padding: '1.5rem', height: '100vh', overflowY: 'auto', paddingBottom: '140px' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="glass" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: 'var(--accent-primary)' }}>
                    <LibraryIcon size={32} color="white" />
                </div>
                <div>
                    <h1 className="hero-title" style={{ margin: 0 }}>Your Library</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your collection of moods and memories.</p>
                </div>
            </header>

            {renderTrackList(favorites, "Favorites", <Heart size={24} color="#ef4444" fill="#ef4444" />, "No favorites yet. Heart a song to save it here!")}
            {renderTrackList(history, "Recent Vibes", <History size={24} />, "You haven't played anything yet.", true)}
        </div>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const Settings: React.FC = () => {
    const {
        preferences, updatePreferences,
    } = useVibeStore();
    const { user, logout } = useAuth();

    const trendingArtists = [
        // Bollywood & Melodic
        'Arijit Singh', 'Atif Aslam', 'Shreya Ghoshal', 'Armaan Malik', 'Jubin Nautiyal',
        'Darshan Raval', 'KK', 'Sonu Nigam', 'Alka Yagnik', 'Kumar Sanu',
        'Neha Kakkar', 'Sunidhi Chauhan', 'Mohit Chauhan', 'Lucky Ali', 'Udit Narayan',
        'Pritam', 'A.R. Rahman', 'Vishal-Shekhar', 'Amit Trivedi', 'Kishore Kumar', 'Mohammad Rafi',
        'Lata Mangeshkar', 'Asha Bhosle', 'Jagjit Singh', 'Pankaj Udhas',

        // Punjabi & Urban
        'Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla', 'AP Dhillon', 'Badshah',
        'Guru Randhawa', 'Shubh', 'Amrit Maan', 'Jassie Gill', 'Hardy Sandhu',
        'Yo Yo Honey Singh', 'Raftaar', 'Divine', 'Emiway Bantai', 'KR$NA',
        'MC Stan', 'King', 'Prabh Deep', 'PropheC', 'Tumbi Beats', 'Garry Sandhu',
        'Ammy Virk', 'Nimrat Khaira', 'Sunanda Sharma', 'B Praak', 'Jaani',

        // Global Pop & Hip-Hop
        'The Weeknd', 'Taylor Swift', 'Justin Bieber', 'Drake', 'Ariana Grande',
        'Post Malone', 'Ed Sheeran', 'Dua Lipa', 'Billie Eilish', 'Bruno Mars',
        'Kanye West', 'Eminem', 'BTS', 'Blackpink', 'Coldplay', 'Imagine Dragons',

        // Indie & Emerging
        'Anuv Jain', 'Prateek Kuhad', 'Ritviz', 'The Local Train', 'Sanam',
        'Seedhe Maut', 'When Chai Met Toast', 'Yellow Diary', 'Zaeden', 'Aditya Rikhari'
    ].sort();

    return (
        <motion.div
            className="settings-page"
            style={{ padding: '0 1.5rem 140px 1.5rem', maxWidth: '1000px', margin: '0 auto', height: '100vh', overflowY: 'auto' }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.h1 variants={sectionVariants} className="hero-title" style={{ marginBottom: '3rem', paddingTop: '2rem' }}>Settings</motion.h1>

            {/* Profile Section */}
            <motion.section variants={sectionVariants} style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>Account Profile</h2>
                <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div className="profile-large-avatar" style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), #000)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 0 30px rgba(255, 0, 0, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {user?.email?.[0].toUpperCase() || 'V'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{user?.displayName || 'Vibe Master'}</h3>
                        <p style={{ margin: '0.5rem 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            {user?.email || 'vibe.master@moodwire.app'}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <motion.button whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} whileTap={{ scale: 0.95 }} className="glass" onClick={() => logout()} style={{ padding: '0.6rem 2rem', fontSize: '0.9rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: 'white' }}>Log Out</motion.button>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Music Personalization */}
            <motion.section variants={sectionVariants} style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', opacity: 0.8 }}>Music Personalization</h2>
                <div className="glass" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '2rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>

                    {/* Discovery Level */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Discovery Level</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>How much new music should we introduce?</p>
                            </div>
                            <div className="glass" style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
                                {(['low', 'balanced', 'high'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => updatePreferences({ discoveryLevel: level })}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: preferences.discoveryLevel === level ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                                            background: preferences.discoveryLevel === level ? 'var(--accent-primary)' : 'transparent',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                    {/* Preferred Languages */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Preferred Music Languages</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {['English', 'Hindi', 'Punjabi', 'Telugu', 'Tamil', 'K-Pop', 'Instrumental'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        const languages = preferences.languages.includes(lang)
                                            ? preferences.languages.filter(l => l !== lang)
                                            : [...preferences.languages, lang];
                                        updatePreferences({ languages });
                                    }}
                                    className={`filter-chip ${preferences.languages.includes(lang) ? 'active' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                    {/* Favorite Artists */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Artist Preferences</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Search to add more artists..."
                                className="search-input"
                                style={{ flex: 1, margin: 0, padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val && !preferences.favoriteArtists.includes(val)) {
                                            updatePreferences({ favoriteArtists: [...preferences.favoriteArtists, val] });
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Trending Artists (Tap to add)</p>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '0.6rem',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                paddingRight: '12px',
                                paddingBottom: '10px'
                            }}>
                                {trendingArtists.map(artist => (
                                    <button
                                        key={artist}
                                        onClick={() => {
                                            if (!preferences.favoriteArtists.includes(artist)) {
                                                updatePreferences({ favoriteArtists: [...preferences.favoriteArtists, artist] });
                                            } else {
                                                updatePreferences({ favoriteArtists: preferences.favoriteArtists.filter(a => a !== artist) });
                                            }
                                        }}
                                        className={`artist-pill ${preferences.favoriteArtists.includes(artist) ? 'active' : ''}`}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            textAlign: 'left',
                                            border: preferences.favoriteArtists.includes(artist) ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                                            background: preferences.favoriteArtists.includes(artist) ? 'rgba(255, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            color: preferences.favoriteArtists.includes(artist) ? 'white' : 'rgba(255,255,255,0.7)',
                                            fontWeight: preferences.favoriteArtists.includes(artist) ? '600' : '400'
                                        }}
                                    >
                                        {artist}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {preferences.favoriteArtists.map(artist => (
                                <div key={artist} className="glass" style={{
                                    padding: '6px 14px',
                                    borderRadius: '100px',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'rgba(255, 68, 68, 0.2)',
                                    border: '1px solid rgba(255, 68, 68, 0.4)',
                                    color: 'white'
                                }}>
                                    {artist}
                                    <button
                                        onClick={() => updatePreferences({ favoriteArtists: preferences.favoriteArtists.filter(a => a !== artist) })}
                                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', padding: 0, display: 'flex', alignItems: 'center' }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                    {/* Vibe Types */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Your Favorite Vibes</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {['Chill', 'Pop', 'Sad', 'Party', 'Workout', 'Rap', 'Focus', 'Electronic', 'Jazz', 'Classical'].map(vibe => (
                                <button
                                    key={vibe}
                                    onClick={() => {
                                        const vibeTypes = preferences.vibeTypes.includes(vibe)
                                            ? preferences.vibeTypes.filter(v => v !== vibe)
                                            : [...preferences.vibeTypes, vibe];
                                        updatePreferences({ vibeTypes });
                                    }}
                                    className={`filter-chip ${preferences.vibeTypes.includes(vibe) ? 'active' : ''}`}
                                    style={{ cursor: 'pointer', padding: '0.6rem 1.25rem' }}
                                >
                                    {vibe}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                        <button
                            className="glass"
                            style={{ padding: '1rem 2.5rem', borderRadius: '14px', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(255,68,68,0.05)' }}
                            onClick={() => {
                                if (window.confirm('Reset all personalized music data? This improves recommendations but clears your history.')) {
                                    updatePreferences({
                                        languages: ['English', 'Hindi'],
                                        favoriteArtists: [],
                                        vibeTypes: ['Pop', 'Chill'],
                                        discoveryLevel: 'balanced',
                                        explicitFilter: false,
                                        isOnboarded: false
                                    });
                                    window.location.reload();
                                }
                            }}
                        >
                            Reset My Experience
                        </button>
                    </div>
                </div>
            </motion.section>
        </motion.div>
    );
};
