import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVibeStore } from '../store/vibeStore';
import { Check, ChevronRight, Music, Mic, Globe } from 'lucide-react';

const LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Malayalam'];
const VIBES = ['Pop', 'Chill', 'Lo-Fi', 'EDM', 'Acoustic', 'Hip-Hop', 'Bollywood', 'Classical'];
const ARTISTS = [
    // Bollywood & Melodic
    'Arijit Singh', 'Atif Aslam', 'Shreya Ghoshal', 'Armaan Malik', 'Jubin Nautiyal',
    'Darshan Raval', 'KK', 'Sonu Nigam', 'Alka Yagnik', 'Kumar Sanu',
    'Neha Kakkar', 'Sunidhi Chauhan', 'Mohit Chauhan', 'Lucky Ali', 'Udit Narayan',
    'Pritam', 'A.R. Rahman', 'Vishal-Shekhar', 'Amit Trivedi',

    // Punjabi & Urban
    'Diljit Dosanjh', 'Sidhu Moose Wala', 'Karan Aujla', 'AP Dhillon', 'Badshah',
    'Guru Randhawa', 'Shubh', 'Amrit Maan', 'Jassie Gill', 'Hardy Sandhu',
    'Yo Yo Honey Singh', 'Raftaar', 'Divine', 'Emiway Bantai', 'KR$NA',
    'MC Stan', 'King', 'Krsna', 'Prabh Deep',

    // Global Pop & Hip-Hop
    'The Weeknd', 'Taylor Swift', 'Justin Bieber', 'Drake', 'Ariana Grande',
    'Post Malone', 'Ed Sheeran', 'Dua Lipa', 'Billie Eilish', 'Bruno Mars',
    'Kanye West', 'Kendrick Lamar', 'Travis Scott', 'Rihanna', 'Beyoncé',
    'Coldplay', 'Imagine Dragons', 'Maroon 5', 'Eminem', 'BTS', 'Blackpink',

    // Indie & Emerging
    'Anuv Jain', 'Prateek Kuhad', 'Ritviz', 'The Local Train', 'Sanam',
    'Seedhe Maut', 'When Chai Met Toast', 'Yellow Diary'
].sort();

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);

    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
    const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

    const updatePreferences = useVibeStore(state => state.updatePreferences);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish
            updatePreferences({
                languages: selectedLanguages.length > 0 ? selectedLanguages : ['Hindi', 'English'],
                vibeTypes: selectedVibes.length > 0 ? selectedVibes : ['Pop', 'Chill'],
                favoriteArtists: selectedArtists,
                isOnboarded: true
            });
            onComplete();
        }
    };

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Globe size={32} color="var(--accent-primary)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Which languages do you listen to?</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Pick at least one to get started.</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                            {LANGUAGES.map(lang => {
                                const isSelected = selectedLanguages.includes(lang);
                                return (
                                    <button
                                        key={lang}
                                        onClick={() => toggleSelection(lang, selectedLanguages, setSelectedLanguages)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '24px',
                                            border: isSelected ? '2px solid var(--accent-primary)' : '2px solid rgba(255,255,255,0.1)',
                                            background: isSelected ? 'rgba(255,68,68,0.1)' : 'transparent',
                                            color: isSelected ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {isSelected && <Check size={16} color="var(--accent-primary)" />}
                                        {lang}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Music size={32} color="var(--accent-primary)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>What's your vibe?</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select a few genres you enjoy.</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                            {VIBES.map(vibe => {
                                const isSelected = selectedVibes.includes(vibe);
                                return (
                                    <button
                                        key={vibe}
                                        onClick={() => toggleSelection(vibe, selectedVibes, setSelectedVibes)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '24px',
                                            border: isSelected ? '2px solid var(--accent-primary)' : '2px solid rgba(255,255,255,0.1)',
                                            background: isSelected ? 'rgba(255,68,68,0.1)' : 'transparent',
                                            color: isSelected ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {isSelected && <Check size={16} color="var(--accent-primary)" />}
                                        {vibe}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mic size={32} color="var(--accent-primary)" />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Pick your favorite artists</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>We'll use these to kickstart your recommendations.</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem', maxHeight: '30vh', overflowY: 'auto' }}>
                            {ARTISTS.map(artist => {
                                const isSelected = selectedArtists.includes(artist);
                                return (
                                    <button
                                        key={artist}
                                        onClick={() => toggleSelection(artist, selectedArtists, setSelectedArtists)}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '24px',
                                            border: isSelected ? '2px solid var(--accent-primary)' : '2px solid rgba(255,255,255,0.1)',
                                            background: isSelected ? 'rgba(255,68,68,0.1)' : 'transparent',
                                            color: isSelected ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {isSelected && <Check size={16} color="var(--accent-primary)" />}
                                        {artist}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        if (step === 1 && selectedLanguages.length === 0) return true;
        if (step === 2 && selectedVibes.length === 0) return true;
        return false;
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            background: 'radial-gradient(circle at center, #1a0505 0%, #000000 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '800px', width: '100%', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: '4px',
                            width: '40px',
                            borderRadius: '2px',
                            background: i <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            transition: 'background 0.3s ease'
                        }} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {renderStepContent()}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
                    <button
                        onClick={handleNext}
                        disabled={isNextDisabled()}
                        className="primary-btn glow-on-hover"
                        style={{
                            padding: '1rem 3rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: isNextDisabled() ? 0.5 : 1,
                            cursor: isNextDisabled() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {step === 3 ? 'Start Listening' : 'Continue'}
                        <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => {
                            // Skip onboarding with sensible defaults
                            updatePreferences({
                                languages: selectedLanguages.length > 0 ? selectedLanguages : ['Hindi', 'English'],
                                vibeTypes: selectedVibes.length > 0 ? selectedVibes : ['Pop', 'Chill'],
                                favoriteArtists: selectedArtists,
                                isOnboarded: true
                            });
                            onComplete();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0.5rem 1rem',
                            textDecoration: 'underline',
                            textUnderlineOffset: '4px',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                        Skip for now — I'll explore on my own
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
