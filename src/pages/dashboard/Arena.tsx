import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shield, Zap, Loader2, Skull, BookOpen, Users } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { battleService, type BattleSession } from '../../services/battleService';
import { getAdaptiveQuestionBatch } from '../../services/questionEngine';
import { batchUpdateTopicStrength } from '../../services/topicStrengthService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../../components/CustomSelect';

const SUBJECT_OPTIONS = [
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Biology', label: 'Biology' },
];

export const Arena = () => {
    const { user, addGains } = useUserStore();
    const navigate = useNavigate();
    
    // UI State
    const [status, setStatus] = useState<'lobby' | 'searching' | 'battle' | 'results'>('lobby');
    const [subject, setSubject] = useState('Physics');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    
    // Battle State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [session, setSession] = useState<BattleSession | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [localScore, setLocalScore] = useState(0);
    const [battleResults, setBattleResults] = useState<Array<{ topic: string; subject?: string; isCorrect: boolean }>>([]);
    const xpAwarded = useRef(false);
    const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPlayer1 = session?.player1.id === user?.id;
    const opponent = isPlayer1 ? session?.player2 : session?.player1;
    const me = isPlayer1 ? session?.player1 : session?.player2;

    useEffect(() => {
        if (!sessionId) return;
        
        const unsubscribe = battleService.subscribeToSession(sessionId, (sess) => {
            if (!sess) {
                // Session deleted / opponent left violently
                if (status === 'searching') {
                    setStatus('lobby');
                    setSessionId(null);
                }
                return;
            }
            
            setSession(sess);
            
            if (sess.status === 'starting' && status === 'searching') {
                // If I am player 1, I should generate and attach questions
                if (sess.player1.id === user?.id && !sess.questions) {
                    generateBattleQuestions(sess.subject).then(qs => {
                        updateDoc(doc(db, 'battle_sessions', sess.id!), {
                            questions: qs,
                            status: 'active'
                        });
                    });
                }
            }

            if (sess.status === 'active' && status !== 'battle' && sess.questions) {
                setQuestions(sess.questions);
                setStatus('battle');
            }

            if (sess.status === 'completed') {
                setStatus('results');
            }
        });

        return () => unsubscribe();
    }, [sessionId, status, user]);

    const generateBattleQuestions = async (subj: string) => {
        try {
            console.log(`[Arena] Generating battle batch for subject: ${subj}`);
            // 2. Fetch fresh Battle Questions based on user category
            const needs = [{ subject: subj, topic: 'Random', count: 10, difficulty: 'Medium' as const }];
            const questionData = await getAdaptiveQuestionBatch(user?.id || 'guest', needs, user?.targetExam || 'JEE Mains');

            if (!questionData || questionData.length < 3) {
                console.error('[Arena] Not enough questions generated for battle');
                return [];
            }

            const qs = questionData.map(q => {
                const optionsArray: string[] = Array.isArray(q.options) ? q.options : Object.values(q.options);
                let correctAnswerIndex = 0;
                
                if (typeof q.correct_answer === 'string') {
                    const foundIndex = optionsArray.indexOf(q.correct_answer);
                    if (foundIndex !== -1) correctAnswerIndex = foundIndex;
                }

                return {
                    id: q.id,
                    text: q.question,
                    options: optionsArray,
                    correctAnswer: correctAnswerIndex,
                    topic: q.topic,
                    subject: q.subject
                };
            });

            return qs;
        } catch (e) {
            console.error('[Arena] Battle generation failed:', e);
            return [];
        }
    };

    const handleJoinQueue = async () => {
        if (!user) return;
        setStatus('searching');
        xpAwarded.current = false;
        try {
            const id = await battleService.joinQueue(user.id, user.name || 'Anonymous', subject);
            setSessionId(id);
            // BUG-11 FIX: Auto-cancel after 60 seconds if no match
            queueTimerRef.current = setTimeout(() => {
                if (id) battleService.leaveQueue(id);
                setSessionId(null);
                setStatus('lobby');
                alert('No opponents found. Try again later!');
            }, 60000);
        } catch (e) {
            setStatus('lobby');
            console.error(e);
        }
    };

    const handleLeaveQueue = () => {
        if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
        if (sessionId) {
            battleService.leaveQueue(sessionId);
            setSessionId(null);
        }
        setStatus('lobby');
    };

    const handleAnswer = async (idx: number) => {
        const q = questions[currentQIndex];
        const isCorrect = q.correctAnswer === idx;
        
        let newScore = localScore;
        if (isCorrect) {
            newScore += 10;
            setLocalScore(newScore);
            if (sessionId) {
                await battleService.updateScore(sessionId, user!.id, !!isPlayer1, newScore);
            }
        }

        // Track for analytics
        setBattleResults(prev => [...prev, {
            topic: q.topic,
            subject: q.subject,
            isCorrect
        }]);

        // Delay for visual feedback or just go next instantly for speed?
        setTimeout(async () => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(currentQIndex + 1);
            } else {
                // Match Over
                if (sessionId) {
                    await battleService.markCompleted(sessionId, !!isPlayer1);
                    
                    // Check if both completed
                    const sessSnapshot = await (await import('firebase/firestore')).getDoc(doc(db, 'battle_sessions', sessionId));
                    const latestSess = sessSnapshot.data() as BattleSession;
                    
                    if (latestSess.player1.completed && latestSess.player2?.completed) {
                        await updateDoc(doc(db, 'battle_sessions', sessionId), { status: 'completed' });
                    } else {
                        setStatus('results'); // Show waiting for opponent screen
                    }
                }
            }
        }, 300);
    };

    // Calculate final outcome
    const didWin = session?.status === 'completed' && (
        (isPlayer1 && session.player1.score > (session.player2?.score || 0)) ||
        (!isPlayer1 && (session.player2?.score || 0) > session.player1.score)
    );
    
    const isTie = session?.status === 'completed' && (session.player1.score === session.player2?.score);

    useEffect(() => {
        // BUG-03 FIX: Guard with ref to prevent duplicate XP awards
        if (session?.status === 'completed' && status === 'results' && !xpAwarded.current) {
            xpAwarded.current = true;
            if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
            if (didWin) {
                addGains({ xp: 50, pts: 50 });
            } else if (!isTie) {
                addGains({ xp: 10, pts: 10 });
            }

            // Phase C: Sync to analytics
            if (battleResults.length > 0 && user?.id) {
                console.log(`[Arena] Syncing ${battleResults.length} battle results to Mastery Engine...`);
                batchUpdateTopicStrength(user.id, battleResults, user.userClass, user.targetExam);
            }
        }
    }, [session?.status, status]);

    return (
        <div className="max-w-4xl mx-auto py-4 px-4 relative overflow-hidden">
            <AnimatePresence mode="wait">
                {status === 'lobby' && (
                    <motion.div 
                        key="lobby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
                    >
                        <div className="relative">
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-24 h-24 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.2)]"
                            >
                                <Shield size={48} />
                            </motion.div>
                            <motion.div 
                                className="absolute inset-0 rounded-full border-2 border-red-500/30"
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        
                        <div className="text-center space-y-2 relative">
                            <h1 className="text-4xl font-black text-white uppercase tracking-widest mt-4">The Arena</h1>
                            <p className="text-text-muted max-w-md">Real-time 1v1 battles. Prove your mastery against other students. Winner takes all.</p>
                        </div>

                        <div className="w-full max-w-sm space-y-4">
                            <CustomSelect
                                value={subject}
                                onChange={setSubject}
                                options={SUBJECT_OPTIONS}
                                icon={<BookOpen size={20} />}
                            />
                            
                            <button 
                                onClick={handleJoinQueue}
                                className="w-full py-3.5 md:py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black tracking-[2px] md:tracking-[4px] uppercase shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                Find Opponent
                            </button>

                            <div className="flex items-center gap-4 text-text-muted text-xs uppercase font-bold py-2">
                                <div className="h-px flex-1 bg-border"></div>
                                <span>OR</span>
                                <div className="h-px flex-1 bg-border"></div>
                            </div>

                            <button 
                                onClick={() => navigate('/dashboard/arena/group')}
                                className="w-full py-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all active:scale-95"
                            >
                                <Users size={20} />
                                Create Room
                            </button>

                            <button 
                                onClick={() => setShowJoinModal(true)}
                                className="w-full py-4 rounded-xl border border-border bg-surface/30 text-text-muted font-black uppercase tracking-[2px] hover:border-white/20 hover:text-white transition-all text-[10px] md:text-xs"
                            >
                                Join with Code
                            </button>
                        </div>

                        <AnimatePresence>
                            {showJoinModal && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[100] flex items-center justify-center px-4"
                                >
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="w-full max-w-sm glass-card p-8 space-y-6 relative border-indigo-500/30"
                                    >
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-wider">Enter Invite Code</h3>
                                            <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Compete with friends</p>
                                        </div>

                                        <input 
                                            autoFocus
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.trim().toUpperCase())}
                                            placeholder="XXXXXX"
                                            className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-center font-mono text-2xl tracking-[4px] md:tracking-[8px] text-white focus:border-indigo-500 outline-none transition-all placeholder:tracking-normal placeholder:text-text-muted/20"
                                        />

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setShowJoinModal(false)}
                                                className="flex-1 py-3 rounded-xl border border-border text-text-muted hover:text-white transition-all font-bold uppercase text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                disabled={!joinCode}
                                                onClick={() => navigate(`/dashboard/arena/group?code=${joinCode}`)}
                                                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-700 transition-all text-xs disabled:opacity-50"
                                            >
                                                Join Room
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {status === 'searching' && (
                    <motion.div 
                        key="searching"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] space-y-12"
                    >
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Sonar Rings */}
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute inset-0 border-2 border-red-500/30 rounded-full"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ 
                                        scale: [0.5, 2],
                                        opacity: [0, 0.5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 1,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}
                            
                            {/* Scanning Line */}
                            <motion.div 
                                className="absolute inset-0 rounded-full border-t-2 border-red-500 shadow-[0_-10px_20px_-5px_rgba(239,68,68,0.5)]"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />

                            <div className="relative z-10 bg-[#11131c] p-5 rounded-full border border-red-500/50 shadow-2xl shadow-red-500/20">
                                <Shield size={48} className="text-red-500" />
                            </div>
                        </div>

                        <div className="text-center space-y-4">
                            <div className="flex flex-col items-center gap-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-widest">Searching</h3>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-red-500 rounded-full"
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-red-400 font-mono text-sm px-4 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                Subject: {subject}
                            </p>
                        </div>

                        <button 
                            onClick={handleLeaveQueue}
                            className="px-8 py-3 rounded-xl border border-white/10 text-text-muted hover:bg-white/5 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
                        >
                            Cancel Search
                        </button>
                    </motion.div>
                )}

                {status === 'battle' && session && (
                    <motion.div 
                        key="battle"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex flex-col min-h-[65vh] space-y-6"
                    >
                        {/* Battle Header */}
                        <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-3xl relative overflow-hidden">
                            
                            {/* VS Divider */}
                            <motion.div 
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#11131c] px-4 py-2 rounded-full border border-red-500/30 z-10 flex items-center gap-2"
                            >
                                <Zap size={14} className="text-red-500" />
                                <span className="font-black text-white italic">VS</span>
                            </motion.div>
                            
                            {/* Player 1 (Me) */}
                            <div className="flex items-center gap-4 flex-1">
                                <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center font-bold text-blue-400"
                                >
                                    {me?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                </motion.div>
                                <div>
                                    <p className="text-xs font-bold text-text-muted uppercase">You</p>
                                    <motion.p 
                                        key={me?.score}
                                        initial={{ scale: 1.5, color: "#3b82f6" }}
                                        animate={{ scale: 1, color: "#ffffff" }}
                                        className="text-xl font-black"
                                    >
                                        {me?.score ?? 0}
                                    </motion.p>
                                </div>
                            </div>

                            {/* Player 2 (Opponent) */}
                            <div className="flex items-center gap-4 flex-1 justify-end text-right">
                                <div>
                                    <p className="text-xs font-bold text-text-muted uppercase">{opponent?.name ?? 'Opponent'}</p>
                                    <motion.p 
                                        key={opponent?.score}
                                        initial={{ scale: 1.5, color: "#ef4444" }}
                                        animate={{ scale: 1, color: "#ffffff" }}
                                        className="text-xl font-black"
                                    >
                                        {opponent?.score ?? 0}
                                    </motion.p>
                                </div>
                                <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center font-bold text-red-500"
                                >
                                    {opponent?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                </motion.div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <AnimatePresence mode="wait">
                            {questions.length > 0 && (
                                <motion.div 
                                    key={currentQIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex-1 glass-card p-6 md:p-10 flex flex-col justify-center"
                                >
                                    <div className="mb-8 flex justify-between items-center text-sm font-bold text-text-muted uppercase tracking-widest">
                                        <span>Question {currentQIndex + 1} of 5</span>
                                        <span className="text-red-400">{questions[currentQIndex].topic}</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-medium text-white mb-8">
                                        {questions[currentQIndex].text}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {questions[currentQIndex].options.map((opt: string, idx: number) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleAnswer(idx)}
                                                className="p-5 text-left rounded-2xl bg-surface border border-border text-white hover:border-red-500/50 transition-colors font-medium text-lg flex items-start gap-4"
                                            >
                                                <span className="opacity-40 font-black">{String.fromCharCode(65 + idx)}</span> 
                                                {opt}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {status === 'results' && session && (
                    <motion.div 
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center"
                    >
                        {session.status !== 'completed' ? (
                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="p-4 rounded-full border-2 border-dashed border-red-500/30"
                                    >
                                        <Loader2 size={48} className="text-red-500 animate-spin" />
                                    </motion.div>
                                    <motion.div 
                                        className="absolute inset-0 rounded-full bg-red-500/10"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">Waiting for {opponent?.name}...</h2>
                                    <p className="text-text-muted">They are still finishing their battle.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <motion.div 
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${didWin ? 'bg-green-500/20 text-green-500 shadow-green-500/20' : isTie ? 'bg-yellow-500/20 text-yellow-500 shadow-yellow-500/20' : 'bg-red-500/20 text-red-500 shadow-red-500/20'}`}
                                >
                                    {didWin ? <Trophy size={64} /> : isTie ? <Shield size={64} /> : <Skull size={64} />}
                                </motion.div>
                                
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                                        {didWin ? 'VICTORY' : isTie ? 'DRAW' : 'DEFEAT'}
                                    </h1>
                                    <div className="flex items-center justify-center gap-6 py-4 bg-surface/50 rounded-3xl border border-white/5 px-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-text-muted uppercase">Your Score</p>
                                            <p className="text-3xl font-black text-white">{me?.score}</p>
                                        </div>
                                        <div className="w-px h-10 bg-border"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-text-muted uppercase">Opponent</p>
                                            <p className="text-3xl font-black text-text-muted">{opponent?.score}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-4"
                                >
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="px-8 py-3 rounded-xl bg-surface border border-border text-white font-bold hover:bg-white/5 transition-all"
                                    >
                                        Back to Dashboard
                                    </button>
                                    <button
                                        onClick={() => { setSessionId(null); setSession(null); setStatus('lobby'); setQuestions([]); setCurrentQIndex(0); setLocalScore(0); setBattleResults([]); xpAwarded.current = false; }}
                                        className="px-8 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                    >
                                        New Battle
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
