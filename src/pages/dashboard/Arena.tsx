import { useState, useEffect, useRef } from 'react';
import { Trophy, Shield, Zap, Loader2, Skull } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { battleService, type BattleSession } from '../../services/battleService';
import { getAdaptiveQuestion } from '../../services/questionEngine';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export const Arena = () => {
    const { user, addGains } = useUserStore();
    const navigate = useNavigate();
    
    // UI State
    const [status, setStatus] = useState<'lobby' | 'searching' | 'battle' | 'results'>('lobby');
    const [subject, setSubject] = useState('Physics'); // default
    
    // Battle State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [session, setSession] = useState<BattleSession | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [localScore, setLocalScore] = useState(0);
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
            const qs = [];
            for (let i = 0; i < 5; i++) {
                try {
                    const q: any = await getAdaptiveQuestion(user?.id || 'guest', subj, 'Exam_Level', 5, undefined, subj, 1000);
                    if (!q || !q.question) continue;
                    
                    let correctAnswerIndex = 0;
                    const optionsArray: string[] = Array.isArray(q.options) ? q.options : Object.values(q.options);
                    if (typeof q.correct_answer === 'string') {
                        if (q.correct_answer.length === 1 && /[A-D]/.test(q.correct_answer)) {
                            correctAnswerIndex = q.correct_answer.charCodeAt(0) - 65;
                        } else {
                            const foundIndex = optionsArray.indexOf(q.correct_answer);
                            if (foundIndex !== -1) correctAnswerIndex = foundIndex;
                        }
                    }
                    
                    qs.push({
                        text: q.question,
                        options: optionsArray,
                        correctAnswer: correctAnswerIndex,
                        topic: q.topic
                    });
                } catch {
                    // Individual question fetch failed, continue to next
                }
            }
            // BUG-05 FIX: Require at least 3 questions for a valid battle
            if (qs.length < 3) {
                console.error('[Arena] Not enough questions generated for battle');
                return [];
            }
            return qs;
        } catch (e) {
            console.error(e);
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
        }
    }, [session?.status, status]);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up py-4 px-4 overflow-hidden relative">
            {status === 'lobby' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                    <div className="w-24 h-24 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <Shield size={48} />
                    </div>
                    
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-black text-white uppercase tracking-widest">The Arena</h1>
                        <p className="text-text-muted max-w-md">Real-time 1v1 battles. Prove your mastery against other students. Winner takes all.</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                        <select 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
                        >
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Biology">Biology</option>
                        </select>
                        
                        <button 
                            onClick={handleJoinQueue}
                            className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black tracking-[4px] uppercase shadow-lg shadow-red-500/20 transition-transform active:scale-95"
                        >
                            Find Opponent
                        </button>
                    </div>
                </div>
            )}

            {status === 'searching' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                    <div className="relative">
                        <Loader2 size={64} className="text-red-500 animate-spin opacity-50" />
                        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">Searching for Opponent</h3>
                        <p className="text-red-400 font-mono">Subject: {subject}</p>
                    </div>
                    <button 
                        onClick={handleLeaveQueue}
                        className="px-6 py-2 rounded-lg border border-white/10 text-text-muted hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {status === 'battle' && session && (
                <div className="flex flex-col min-h-[65vh] space-y-6">
                    {/* Battle Header */}
                    <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-3xl relative overflow-hidden">
                        
                        {/* VS Divider */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#11131c] px-4 py-2 rounded-full border border-red-500/30 z-10 flex items-center gap-2">
                            <Zap size={14} className="text-red-500" />
                            <span className="font-black text-white italic">VS</span>
                        </div>
                        
                        {/* Player 1 (Me) */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center font-bold text-blue-400">
                                {me?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-muted uppercase">You</p>
                                <p className="text-xl font-black text-white">{me?.score ?? 0}</p>
                            </div>
                        </div>

                        {/* Player 2 (Opponent) */}
                        <div className="flex items-center gap-4 flex-1 justify-end text-right">
                            <div>
                                <p className="text-xs font-bold text-text-muted uppercase">{opponent?.name ?? 'Opponent'}</p>
                                <p className="text-xl font-black text-white">{opponent?.score ?? 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center font-bold text-red-500">
                                {opponent?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                        </div>
                    </div>

                    {/* Question Card */}
                    {questions.length > 0 && (
                        <div className="flex-1 glass-card p-6 md:p-10 flex flex-col justify-center">
                            <div className="mb-8 flex justify-between items-center text-sm font-bold text-text-muted uppercase tracking-widest">
                                <span>Question {currentQIndex + 1} of 5</span>
                                <span className="text-red-400">{questions[currentQIndex].topic}</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-medium text-white mb-8">
                                {questions[currentQIndex].text}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {questions[currentQIndex].options.map((opt: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        className="p-5 text-left rounded-2xl bg-surface border border-border text-white hover:bg-red-500/10 hover:border-red-500/50 transition-all font-medium text-lg flex items-start gap-4 active:scale-95"
                                    >
                                        <span className="opacity-40 font-black">{String.fromCharCode(65 + idx)}</span> 
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {status === 'results' && session && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center animate-fade-in-up">
                    {session.status !== 'completed' ? (
                        <>
                            <Loader2 size={48} className="text-red-500 animate-spin" />
                            <h2 className="text-2xl font-bold text-white">Waiting for {opponent?.name}...</h2>
                        </>
                    ) : (
                        <>
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${didWin ? 'bg-green-500/20 text-green-500 shadow-green-500/20' : isTie ? 'bg-yellow-500/20 text-yellow-500 shadow-yellow-500/20' : 'bg-red-500/20 text-red-500 shadow-red-500/20'}`}>
                                {didWin ? <Trophy size={64} /> : isTie ? <Shield size={64} /> : <Skull size={64} />}
                            </div>
                            
                            <div className="space-y-4">
                                <h1 className="text-5xl font-black text-white tracking-tight">
                                    {didWin ? 'VICTORY' : isTie ? 'DRAW' : 'DEFEAT'}
                                </h1>
                                <p className="text-text-muted text-lg">
                                    Final Score: You <span className="text-white font-bold">{me?.score}</span> - <span className="text-white font-bold">{opponent?.score}</span> {opponent?.name}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-8 py-3 rounded-xl bg-surface border border-border text-white font-bold hover:bg-white/5 transition-all"
                                >
                                    Leave
                                </button>
                                <button
                                    onClick={() => { setSessionId(null); setSession(null); setStatus('lobby'); setQuestions([]); setCurrentQIndex(0); setLocalScore(0); xpAwarded.current = false; }}
                                    className="px-8 py-3 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Play Again
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
