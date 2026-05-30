import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Users, 
    Share2, 
    Play, 
    Clock, 
    Trophy, 
    Loader2, 
    ChevronRight, 
    LogOut,
    Copy,
    List,
    X,
    Check
} from 'lucide-react';
import { SYLLABUS_DB } from '../../lib/constants';
import { useUserStore } from '../../store/userStore';
import { groupBattleService, type GroupBattleSession } from '../../services/groupBattleService';
import { getAdaptiveQuestionBatch, mapStoredToUIQuestion } from '../../services/questionEngine';
import { storageService } from '../../services/storageService';
import { batchUpdateTopicStrength } from '../../services/topicStrengthService';
import { CustomSelect } from '../../components/CustomSelect';

const SUBJECT_OPTIONS = [
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Biology', label: 'Biology' },
];

const TEST_SIZE_OPTIONS = [
    { value: '5_15', label: '5 Questions / 15 Min', qs: 5, time: 15 },
    { value: '10_30', label: '10 Questions / 30 Min', qs: 10, time: 30 },
    { value: '15_45', label: '15 Questions / 45 Min', qs: 15, time: 45 },
    { value: '20_60', label: '20 Questions / 60 Min', qs: 20, time: 60 },
];

export const GroupBattle = () => {
    const { user, addGains } = useUserStore();
    const { sessionId: urlSessionId } = useParams();
    const [searchParams] = useSearchParams();
    const inviteCodeParam = searchParams.get('code');
    const navigate = useNavigate();

    // UI States: 'init' | 'lobby' | 'battle' | 'results'
    const [view, setView] = useState<'init' | 'lobby' | 'battle' | 'results'>('init');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Session Data
    const [sessionId, setSessionId] = useState<string | null>(urlSessionId || null);
    const [session, setSession] = useState<GroupBattleSession | null>(null);
    const [inviteCode, setInviteCode] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Physics']);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    useEffect(() => {
        // Remove topics that are not in the selected subjects
        setSelectedTopics(prev => prev.filter(t => {
            return selectedSubjects.some(s => SYLLABUS_DB[s]?.some(item => item.topic === t));
        }));
    }, [selectedSubjects]);

    const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy'|'Medium'|'Hard'>('Medium');
    const [selectedTestSize, setSelectedTestSize] = useState('5_15');
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    
    const battleTrapRef = useFocusTrap(view === 'battle');

    // Battle State
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
    const [isSubmitting, setIsSubmitting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resultsSynced = useRef(false);

    // --- initialization & Real-time Subscription ---
    useEffect(() => {
        if (!sessionId) {
            if (inviteCodeParam) {
                handleJoinByCode(inviteCodeParam);
            }
            return;
        }

        setView('lobby');
        const unsubscribe = groupBattleService.subscribeToSession(sessionId, (sess) => {
            if (!sess) {
                setError('Room not found or host closed it.');
                setView('init');
                setSessionId(null);
                return;
            }
            setSession(sess);

            if (sess.status === 'active' && view !== 'battle') {
                setView('battle');
                if (sess.startedAt) {
                    const startedTime = sess.startedAt.toMillis ? sess.startedAt.toMillis() : new Date(sess.startedAt).getTime();
                    const now = Date.now();
                    const elapsed = Math.floor((now - startedTime) / 1000);
                    const remaining = Math.max(0, sess.timeLimit - elapsed);
                    startTimer(remaining);
                } else {
                    startTimer(sess.timeLimit);
                }
            }

            if (sess.status === 'completed' && view !== 'results') {
                setView('results');
                stopTimer();
            }
        });

        return () => {
            unsubscribe();
            stopTimer();
        };
    }, [sessionId]);

    // --- Actions ---

    const handleCreateRoom = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { sessionId: newId } = await groupBattleService.createRoom(
                user.id,
                user.name || 'Anonymous',
                selectedSubjects.join(', '),
                10, // Always 10 players
                selectedTopics.length > 0 ? selectedTopics.join(', ') : selectedSubjects.join(', '),
                selectedDifficulty
            );
            
            // Update question count and time limit for the room
            const config = TEST_SIZE_OPTIONS.find(o => o.value === selectedTestSize) || TEST_SIZE_OPTIONS[0];
            await groupBattleService.updateRoomConfig(newId, config.qs, config.time * 60);

            setSessionId(newId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinByCode = async (codeOverride?: string) => {
        if (!user) return;
        const code = codeOverride || inviteCode;
        if (!code) return;
        setLoading(true);
        setError(null);
        try {
            const id = await groupBattleService.joinByCode(code, user.id, user.name || 'Anonymous');
            setSessionId(id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartBattle = async () => {
        if (!sessionId || !session || session.hostId !== user?.id) return;
        setLoading(true);
        try {
            let formattedQs: any[];
            const topics = session.topic?.split(', ') || [];
            const subjects = session.subject?.split(', ') || [];

            if (topics.length > 0 && topics[0] !== subjects[0]) {
                const needs = topics.map(t => {
                    // Find which subject this topic belongs to
                    const subject = subjects.find(s => SYLLABUS_DB[s]?.some(item => item.topic === t)) || subjects[0];
                    return { 
                        subject, 
                        topic: t, 
                        count: Math.ceil((session.questionCount || 5) / topics.length), 
                        difficulty: session.difficulty || 'Medium' 
                    };
                });
                const rawQs = await getAdaptiveQuestionBatch(needs, user.targetExam || 'JEE Mains', user.abilityScore);
                formattedQs = mapStoredToUIQuestion(rawQs).slice(0, session.questionCount || 5);
            } else {
                const { generateStandardBatch } = await import('../../services/questionEngine');
                formattedQs = await generateStandardBatch(
                    user.targetExam || 'JEE Mains',
                    user.userClass || 'General',
                    subjects[0],
                    session.questionCount || 5,
                    user.abilityScore || 1000
                );
            }

            await groupBattleService.startBattle(sessionId, formattedQs);
        } catch (err: any) {
            setError('Failed to start: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (qIdx: number, oIdx: number) => {
        if (isSubmitting) return;
        setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
    };

    const handleSubmit = async () => {
        if (!sessionId || !user || isSubmitting) return;
        setIsSubmitting(true);
        stopTimer();

        // Calculate Score
        let score = 0;
        session?.questions?.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) {
                score += 4;
            } else if (answers[i] !== undefined) {
                score -= 1;
            }
        });

        try {
            await groupBattleService.updatePlayerScore(sessionId, user.id, score, answers);
            await groupBattleService.markPlayerCompleted(sessionId, user.id, score);
        } catch (err) {
            console.error("Submission failed", err);
        }
    };

    const handleExit = async () => {
        if (!sessionId || !user) return;
        if (view === 'lobby') {
            await groupBattleService.leaveRoom(sessionId, user.id, session?.hostId === user.id);
            setSessionId(null);
            setView('init');
        } else {
            if (window.confirm("Abandoning the battle will result in 0 score. Are you sure?")) {
                await groupBattleService.markPlayerCompleted(sessionId, user.id, 0);
            }
        }
    };

    // --- Timer ---
    const startTimer = (limit: number) => {
        setTimeLeft(limit);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer();
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- Results Logic ---
    useEffect(() => {
        if (view === 'results' && session?.status === 'completed' && !resultsSynced.current && user) {
            resultsSynced.current = true;
            
            const myResult = session.players[user.id];
            if (!myResult) return;

            // 1. Award XP
            const players = Object.values(session.players);
            const sorted = [...players].sort((a, b) => b.score - a.score);
            const rank = sorted.findIndex(p => p.id === user.id) + 1;
            
            let gains = { xp: 10, pts: 10 };
            if (rank === 1) gains = { xp: 100, pts: 100 };
            else if (rank === 2) gains = { xp: 50, pts: 50 };
            
            addGains(gains);

            // 2. Save to Local History
            const historyEntry = {
                id: Date.now(),
                score: myResult.score,
                total: (session.questionCount || 5) * 4,
                type: 'Group Battle',
                exam: user.targetExam || 'Mock',
                date: new Date().toISOString(),
                status: rank === 1 ? 'Winner' : 'Played',
                topic: `Group Battle: ${session.subject}`,
                user_class: user.userClass || 'General',
                percentage: Math.round((myResult.score / ((session.questionCount || 5) * 4)) * 100),
                details: {
                    players: session.players,
                    subject: session.subject
                }
            };
            storageService.saveTestAttempt(historyEntry, user.id);

            // 3. Sync Topic Mastery
            if (session.questions) {
                const topicResults = session.questions.map((q, i) => ({
                    topic: q.topic,
                    subject: q.subject,
                    isCorrect: answers[i] === q.correctAnswer
                }));
                batchUpdateTopicStrength(user.id, topicResults, user.userClass, user.targetExam);
            }
        }
    }, [view, session?.status]);

    return (
        <div className="min-h-screen bg-background p-3 md:p-8 flex flex-col items-center">
            {view === 'init' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center min-h-[80vh] py-6 md:py-12 space-y-6 md:space-y-10 w-full"
                >
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-md bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-center text-sm font-bold mb-6"
                        >
                            {error}
                        </motion.div>
                    )}
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="size-24 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center"
                        >
                            <Users size={48} />
                        </motion.div>
                        <motion.div 
                            className="absolute inset-0 rounded-full border-2 border-indigo-500/20"
                            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    
                    <div className="text-center space-y-2 md:space-y-4">
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest px-4">Group Battle</h1>
                        <p className="text-text-muted text-sm md:text-lg max-w-xs md:max-w-md mx-auto">Invite friends and compete in real-time. Up to 10 players.</p>
                    </div>

                    <div className="w-full max-w-sm md:max-w-2xl lg:max-w-5xl space-y-8 md:space-y-12">
                        <div className="glass-card border-indigo-500/20 overflow-hidden shadow-2xl">
                            {/* Header Section */}
                            <div className="p-4 md:p-6 bg-indigo-500/5 border-b border-border flex items-center justify-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-500/20 hidden md:block" />
                                <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[4px] md:tracking-[8px]">Arena Configuration</p>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-500/20 hidden md:block" />
                            </div>
                            
                            {/* Main Setup Grid */}
                            <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
                                {/* Left Side: Curriculum Selection */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <List size={18} />
                                            </div>
                                            <label className="text-xs uppercase font-black text-white tracking-widest">Select Subjects</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SUBJECT_OPTIONS.map(opt => {
                                                const isSelected = selectedSubjects.includes(opt.value);
                                                return (
                                                    <button type="button"
                                                        key={opt.value}
                                                        onClick={() => {
                                                            setSelectedSubjects(prev => 
                                                                isSelected 
                                                                    ? (prev.length > 1 ? prev.filter(s => s !== opt.value) : prev)
                                                                    : [...prev, opt.value]
                                                            );
                                                        }}
                                                        className={`py-4 rounded-2xl border font-black text-xs md:text-sm transition-all ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-[1.02]' : 'bg-surface border-border text-text-muted hover:border-indigo-500/50 hover:text-white'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-[10]">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Trophy size={18} />
                                            </div>
                                            <label className="text-xs uppercase font-black text-white tracking-widest">Chapters ({selectedTopics.length})</label>
                                        </div>
                                        <button type="button" 
                                            onClick={() => setIsChapterModalOpen(true)}
                                            className="w-full bg-surface/50 border border-border rounded-2xl px-6 py-5 text-left flex items-center justify-between group hover:border-indigo-500/50 transition-all hover:bg-white/5"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-black uppercase tracking-tight">
                                                    {selectedTopics.length > 0 ? `${selectedTopics.length} Selected` : "Choose Chapters"}
                                                </span>
                                                <span className="text-[10px] text-text-muted uppercase font-bold">
                                                    {selectedTopics.length > 0 ? "Click to modify selection" : "Select specific topics to battle on"}
                                                </span>
                                            </div>
                                            <ChevronRight size={20} className="text-text-muted group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Rules & Launch */}
                                <div className="space-y-8 flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                    <Play size={18} />
                                                </div>
                                                <label className="text-xs uppercase font-black text-white tracking-widest">Battle Rules</label>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest">Difficulty</label>
                                                    <div className="flex bg-surface rounded-2xl p-1.5 border border-border">
                                                        {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                                                            <button type="button"
                                                                key={d}
                                                                onClick={() => setSelectedDifficulty(d)}
                                                                className={`flex-1 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${selectedDifficulty === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                                                            >
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest">Duration & Size</label>
                                                    <CustomSelect 
                                                        value={selectedTestSize}
                                                        onChange={setSelectedTestSize}
                                                        options={TEST_SIZE_OPTIONS}
                                                        placement="top"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="button" 
                                        onClick={handleCreateRoom}
                                        disabled={loading}
                                        className="w-full py-4 md:py-8 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[2px] md:tracking-[8px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-indigo-500/30 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {loading ? <Loader2 className="animate-spin" /> : <Play size={24} fill="currentColor" />}
                                        Launch Battle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Join Section */}
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 px-4 md:px-0">
                            <div className="flex-1 space-y-1 text-center md:text-left">
                                <h3 className="text-xl font-black text-white uppercase tracking-wider">Join a Battle</h3>
                                <p className="text-text-muted text-sm uppercase font-bold">Have an invite code? Enter it below</p>
                            </div>
                            
                            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                <input 
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                                    placeholder="PASTE CODE"
                                    className="w-full md:w-64 bg-surface/50 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 md:px-6 md:py-4 text-center font-mono text-lg md:text-2xl tracking-[2px] md:tracking-[10px] text-white focus:border-indigo-500 outline-none transition-all placeholder:text-text-muted/30 placeholder:tracking-normal shadow-inner"
                                />
                                <button type="button" 
                                    onClick={() => handleJoinByCode()}
                                    disabled={loading || !inviteCode}
                                    className="px-6 py-3 md:px-10 md:py-5 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-widest hover:bg-indigo-50 transition-all text-sm shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {view === 'lobby' && session && (
                <div className="max-w-2xl w-full mx-auto space-y-8 py-8">
                    <header className="flex justify-between items-start px-2">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">Battle Lobby</h2>
                            <p className="text-indigo-400 font-bold animate-pulse text-sm md:text-base">Waiting for challengers…</p>
                        </div>
                        <button type="button" onClick={handleExit} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                            <LogOut size={24} />
                        </button>
                    </header>

                    <div className="glass-card p-5 md:p-8 flex flex-col md:flex-row items-center gap-6 border-indigo-500/20">
                        <div className="flex-1 text-center md:text-left">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-2 tracking-widest">Invite Code</p>
                            <div className="text-3xl md:text-5xl font-black text-white tracking-[8px] md:tracking-[12px] font-mono">{session.inviteCode}</div>
                        </div>
                        <div className="flex w-full md:w-auto gap-3">
                            <button type="button" 
                                onClick={() => { navigator.clipboard.writeText(session.inviteCode); alert('Copied!'); }}
                                className="flex-1 md:flex-none p-4 rounded-xl bg-surface border border-border text-white hover:bg-white/5 transition-all flex items-center justify-center"
                            >
                                <Copy size={20} />
                            </button>
                            <button type="button" 
                                onClick={() => { 
                                    const url = `${window.location.origin}/dashboard/arena/group?code=${session.inviteCode}`;
                                    navigator.clipboard.writeText(url); 
                                    alert('Link copied!'); 
                                }}
                                className="flex-[2] md:flex-none px-6 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <Share2 size={20} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                            const player = Object.values(session.players)[i];
                            return (
                                <div key={i} className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all ${player ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-surface/30 border-dashed border-border'}`}>
                                    {player ? (
                                        <>
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xl md:text-2xl font-black text-indigo-400">
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="font-black text-white text-[10px] md:text-sm truncate w-full text-center px-2 uppercase tracking-tighter">{player.name}</p>
                                        </>
                                    ) : (
                                        <div className="text-text-muted/20"><Users size={32} /></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {session.hostId === user?.id && (
                        <div className="flex justify-center">
                            <button type="button" 
                                onClick={handleStartBattle}
                                disabled={Object.keys(session.players).length < 2 || loading}
                                className="w-full max-w-sm py-4 rounded-2xl bg-indigo-600 text-white font-black tracking-[4px] uppercase shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'START BATTLE'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'battle' && session && session.questions && (
                <div ref={battleTrapRef} tabIndex={-1} className="max-w-4xl w-full mx-auto space-y-6 py-4 px-4" style={{ outline: 'none' }}>
                    {session.players[user?.id || '']?.completed ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                            <Loader2 size={48} className="text-indigo-500 animate-spin" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Submitted!</h2>
                            <p className="text-text-muted">Waiting for others…</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-3xl">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <Clock size={20} className="text-red-500 animate-pulse" />
                                    <div className="text-lg md:text-2xl font-mono font-black text-white">{formatTime(timeLeft)}</div>
                                </div>
                                <div className="flex -space-x-2">
                                    {Object.values(session.players).map(p => (
                                        <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold ${p.completed ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'}`}>
                                            {p.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={handleExit} className="text-red-500 font-bold text-sm">EXIT</button>
                            </div>

                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((currentQIndex + 1) / (session.questionCount || 5)) * 100}%` }} />
                            </div>

                            <div className="glass-card p-6 md:p-10 min-h-[400px] flex flex-col">
                                <div className="mb-6 flex justify-between items-center text-xs font-bold text-text-muted uppercase">
                                    <span>Question {currentQIndex + 1} of {session.questionCount || 5}</span>
                                    <span className="text-indigo-400">{session.questions[currentQIndex].topic}</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-medium text-white mb-10 leading-snug">{session.questions[currentQIndex].text}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                                    {session.questions[currentQIndex].options.map((opt: string, idx: number) => (
                                        <button type="button"
                                            key={idx}
                                            onClick={() => handleSelectOption(currentQIndex, idx)}
                                            className={`p-5 text-left rounded-2xl border transition-all font-medium text-lg flex items-start gap-4 active:scale-95 ${answers[currentQIndex] === idx ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-surface border-border text-white hover:border-indigo-500/50'}`}
                                        >
                                            <span className="opacity-40">{String.fromCharCode(65 + idx)}</span> {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button type="button" onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))} disabled={currentQIndex === 0} className="font-black text-[10px] md:text-sm tracking-widest text-text-muted hover:text-white disabled:opacity-0 transition-all uppercase">PREVIOUS</button>
                                {currentQIndex < (session.questionCount || 5) - 1 ? (
                                    <button type="button" onClick={() => setCurrentQIndex(prev => prev + 1)} className="px-6 md:px-10 py-3 md:py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">NEXT <ChevronRight size={20} /></button>
                                ) : (
                                    <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 md:px-10 py-3 md:py-4 rounded-xl bg-green-600 text-white font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition-all">{isSubmitting ? <Loader2 className="animate-spin" /> : 'FINISH'}</button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {view === 'results' && session && (
                <div className="max-w-2xl w-full mx-auto space-y-8 py-8 text-center">
                    <div className="space-y-4">
                        <Trophy className="text-indigo-500 mx-auto w-16 h-16 md:w-24 md:h-24" />
                        <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight uppercase">Battle Results</h1>
                        <p className="text-text-muted text-sm md:text-xl">Battle Finished • Winner takes it all!</p>
                    </div>

                    <div className="glass-card overflow-hidden">
                        {Object.values(session.players).sort((a, b) => {
                            if (b.score !== a.score) return b.score - a.score;
                            return (a.completedAt || Infinity) - (b.completedAt || Infinity);
                        }).map((p, i) => (
                            <div key={p.id} className={`flex items-center justify-between p-5 border-b border-border last:border-0 ${p.id === user?.id ? 'bg-indigo-600/10' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <span className="w-8 font-black text-text-muted">{i + 1}</span>
                                    <div className="text-left">
                                        <p className="font-bold text-white">{p.name}</p>
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{p.completed ? 'Finished' : 'DNF'}</p>
                                    </div>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <p className="text-2xl font-black text-white">{p.score}</p>
                                    <p className="text-[10px] text-text-muted uppercase">Points</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                        <button type="button" onClick={() => navigate('/dashboard/test-center')} className="w-full sm:w-auto px-10 py-4 rounded-xl bg-surface border border-border text-white font-black uppercase tracking-widest hover:bg-white/5 transition-all text-sm">History</button>
                        <button type="button" onClick={() => { setView('init'); setSessionId(null); setSession(null); setAnswers({}); setCurrentQIndex(0); resultsSynced.current = false; }} className="w-full sm:w-auto px-10 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 text-sm">Play Again</button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isChapterModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsChapterModalOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase">Select Chapters</h3>
                                    <p className="text-xs text-text-muted uppercase font-bold tracking-widest">
                                        From: {selectedSubjects.join(' & ')}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setIsChapterModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={24} className="text-text-muted" />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
                            {(() => {
                                const allItems = selectedSubjects.flatMap(subj => SYLLABUS_DB[subj] || []);
                                
                                const normalize = (c: string) => c?.toLowerCase().replace(/class|th|st|nd|rd/g, '').trim();
                                const userClassNorm = normalize(user?.userClass || '');

                                const isPrimary = (itemClass: string) => {
                                    const itemClassNorm = normalize(itemClass);
                                    if (itemClassNorm === userClassNorm) return true;
                                    if (['dropper', 'jee', 'neet'].includes(userClassNorm)) {
                                        return itemClassNorm === '11' || itemClassNorm === '12';
                                    }
                                    return false;
                                };

                                const primaryItems = allItems.filter(item => isPrimary(item.class));
                                const otherItems = allItems.filter(item => !isPrimary(item.class))
                                    .sort((a, b) => {
                                        const numA = parseInt(a.class.match(/\d+/)?.[0] || '0');
                                        const numB = parseInt(b.class.match(/\d+/)?.[0] || '0');
                                        return numB - numA;
                                    });
                                
                                const renderItem = (item: any) => {
                                    const isSelected = selectedTopics.includes(item.topic);
                                    return (
                                        <button type="button"
                                            key={`${item.id}-${item.topic}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedTopics(prev => {
                                                    const exists = prev.includes(item.topic);
                                                    if (exists) return prev.filter(t => t !== item.topic);
                                                    return [...prev, item.topic];
                                                });
                                            }}
                                            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all group cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-surface border-border text-white hover:border-indigo-500/50'}`}
                                        >
                                            <div className="flex-1">
                                                <p className="font-bold text-sm leading-tight mb-1">{item.topic}</p>
                                                <p className={`text-[10px] uppercase font-black ${isSelected ? 'text-indigo-200' : 'text-text-muted'}`}>{item.class}</p>
                                            </div>
                                            {isSelected && <Check size={18} />}
                                        </button>
                                    );
                                };

                                return (
                                    <>
                                        {primaryItems.length > 0 && (
                                            <div className="col-span-full mb-4 px-2">
                                                <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-[2px] mb-1">Recommended For {user?.userClass}</h4>
                                                <div className="h-px w-full bg-indigo-500/20" />
                                            </div>
                                        )}
                                        {primaryItems.map(renderItem)}
                                        
                                        {otherItems.length > 0 && (
                                            <div className="col-span-full mt-8 mb-4 px-2">
                                                <h4 className="text-text-muted text-[10px] font-black uppercase tracking-[2px] mb-1">Other Classes</h4>
                                                <div className="h-px w-full bg-border" />
                                            </div>
                                        )}
                                        {otherItems.map(renderItem)}
                                    </>
                                );
                            })()}
                            </div>

                            <div className="p-4 bg-indigo-500/5 border-t border-border flex gap-3">
                                <button type="button" 
                                    onClick={() => setSelectedTopics([])}
                                    className="flex-1 py-3 rounded-xl border border-dashed border-border text-text-muted font-bold hover:text-white transition-all text-sm"
                                >
                                    Clear All
                                </button>
                                <button type="button" 
                                    onClick={() => setIsChapterModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
