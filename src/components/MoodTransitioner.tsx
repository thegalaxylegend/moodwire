import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useVibeStore } from '../store/vibeStore';
import { audiusService } from '../services/audiusService';
import { voiceService } from '../services/voiceService';

const moods = [
    { label: 'Energized', emoji: '⚡', query: 'phonk' },
    { label: 'Relaxed', emoji: '🌊', query: 'ambient' },
    { label: 'Focused', emoji: '🧠', query: 'classical' },
    { label: 'Melancholy', emoji: '🌧️', query: 'slowed reverb' },
    { label: 'Euphoric', emoji: '✨', query: 'future bass' },
];

const MoodTransitioner: React.FC = () => {
    const { setTrack, setIsPlaying } = useVibeStore();
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Shake to switch vibe logic
    useEffect(() => {
        let lastShake = 0;
        const handleMotion = (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const totalAcc = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
            if (totalAcc > 25 && Date.now() - lastShake > 2000) {
                lastShake = Date.now();
                const randomMood = moods[Math.floor(Math.random() * moods.length)];
                handleMoodSelect(randomMood);
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, []);

    const handleMoodSelect = async (mood: typeof moods[0]) => {
        setIsTransitioning(true);
        // Announce the mood change
        voiceService.announceMood(mood.label);

        try {
            const tracks = await audiusService.searchTracks(mood.query);
            if (tracks.length > 0) {
                setTrack(tracks[0]);
                setIsPlaying(true);
            }
        } catch (e) {
            console.error('Mood select error:', e);
        } finally {
            setIsTransitioning(false);
        }
    };

    return (
        <div className="mood-transitioner glass">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                <Sparkles size={20} className="text-gradient" />
                <span>AI Mood Transitioner</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Select your vibe or <b>shake your phone</b> to find a new flow.
            </p>

            <div className="mood-grid">
                {moods.map(mood => (
                    <button
                        key={mood.label}
                        className="mood-btn"
                        onClick={() => handleMoodSelect(mood)}
                    >
                        <span className="mood-emoji">{mood.emoji}</span>
                        <span className="mood-label">{mood.label}</span>
                    </button>
                ))}
            </div>

            {isTransitioning && (
                <div className="loading-bar">
                    <div className="loading-fill"></div>
                </div>
            )}
        </div>
    );
};

export default MoodTransitioner;
