import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { useVibeStore } from '../store/vibeStore';
import { audiusService } from '../services/audiusService';
import { voiceService } from '../services/voiceService';

const ExamMode: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const { setTrack, setIsPlaying } = useVibeStore();

    const switchMode = useCallback(() => {
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        setMode(nextMode);
        setTimeLeft(nextMode === 'focus' ? 25 * 60 : 5 * 60);
        setIsActive(false);

        // Announce mode switch
        voiceService.speak(nextMode === 'focus' ? "Time to focus. Let's get to work." : "Great job. Take a five minute break.");

        // Auto-play focus vibe
        if (nextMode === 'focus') {
            audiusService.searchTracks('lofi study').then(tracks => {
                if (tracks.length > 0) {
                    setTrack(tracks[0]);
                    setIsPlaying(true);
                }
            });
        }
    }, [mode, setTrack, setIsPlaying]);

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            switchMode();
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, timeLeft, switchMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    return (
        <div className={`exam-mode-page ${mode}`}>
            <div className="focus-bg"></div>

            <header className="exam-header glass">
                <div className="mode-indicator">
                    {mode === 'focus' ? <Zap size={18} fill="currentColor" /> : <Coffee size={18} />}
                    <span>{mode === 'focus' ? 'Focus Session' : 'Quick Break'}</span>
                </div>
                <h1 className="exam-title">Exam Mode</h1>
            </header>

            <main className="timer-container glass">
                <div className="timer-display">
                    {formatTime(timeLeft)}
                </div>

                <div className="timer-controls">
                    <button className="timer-btn primary" onClick={toggleTimer}>
                        {isActive ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="timer-btn secondary" onClick={resetTimer}>
                        <RotateCcw size={24} />
                    </button>
                </div>

                <div className="timer-presets">
                    <button
                        className={`preset-btn ${mode === 'focus' ? 'active' : ''}`}
                        onClick={() => { setMode('focus'); setTimeLeft(25 * 60); setIsActive(false); }}
                    >
                        25:00
                    </button>
                    <button
                        className={`preset-btn ${mode === 'break' ? 'active' : ''}`}
                        onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
                    >
                        05:00
                    </button>
                </div>
            </main>

            <section className="suggested-vibes">
                <h3 className="section-title">Focus Enhancers</h3>
                <div className="preset-vibes">
                    {['Lofi Study', 'Ambient Jazz', 'Deep Focus'].map(vibe => (
                        <button
                            key={vibe}
                            className="vibe-capsule glass glass-hover"
                            onClick={() => audiusService.searchTracks(vibe).then(t => { if (t[0]) setTrack(t[0]); setIsPlaying(true); })}
                        >
                            {vibe}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ExamMode;
