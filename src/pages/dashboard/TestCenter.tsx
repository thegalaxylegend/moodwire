import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { Brain, Clock, Zap, AlertTriangle, TrendingUp, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { AuthGate } from '../../components/auth/AuthGate';

export const TestCenter = () => {
    const { user, authResolved } = useUserStore();
    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);
    const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'warning' | 'info' }>({ 
        open: false, title: "", message: "", type: 'info' 
    });
    const [mode, setMode] = useState<'Quick_Test' | 'Full_Mock'>('Quick_Test');
    const [difficulty, setDifficulty] = useState<'Exam_Level' | 'Slightly_Harder' | 'Mains' | 'Advanced'>('Exam_Level');
    // Default to TRUE (unlocked). Only lock for genuinely brand-new users.
    const [isDiagnosticDone, setIsDiagnosticDone] = useState<boolean | null>(true);

    useEffect(() => {
        const checkDiagnostic = async () => {
            if (!user || !authResolved) return;

            // ── FAST PATH: Any sign of prior activity = established user ──
            const localHistoryRaw = localStorage.getItem('exam_compass_local_history');
            const hasLocalHistory = localHistoryRaw ? (JSON.parse(localHistoryRaw) || []).length > 0 : false;
            const hasAnyXP = (user.xp ?? 0) > 0;
            const hasStreak = (user.streak ?? 0) > 0;
            const hasLevel = (user.lifetimeXp ?? 0) > 0;

            if (hasAnyXP || hasLocalHistory || hasStreak || hasLevel || user.isGuest) {
                console.log("[TestCenter] Established user detected. Diagnostic bypassed.");
                setIsDiagnosticDone(true);
                return;
            }

            // ── SLOW PATH: Only for brand-new users (XP=0, no history) ──
            try {
                const q = query(
                    collection(db, 'diagnostic_results'),
                    where('user_id', '==', user.id),
                    limit(1)
                );
                const snap = await getDocs(q);
                setIsDiagnosticDone(!snap.empty);
            } catch (err) {
                console.warn("[TestCenter] Diagnostic check failed, allowing access:", err);
                // On ANY error, default to allowing access
                setIsDiagnosticDone(true);
            }
        };
        checkDiagnostic();
    }, [user, authResolved]);

    const handleStartTest = async () => {
        if (!user?.targetExam) {
            setError("Please update your profile with a target exam first.");
            return;
        }

        if (mode === 'Full_Mock') {
            setError("Full Mock is temporarily under maintenance. Please use Quick Test!");
            return;
        }

        // Navigate to MockGenerator with the selected config
        navigate(`/dashboard/mock?mode=${mode}&difficulty=${difficulty}`);

    };

    const alertModalComponent = (
        <AnimatePresence>
            {alertModal.open && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-surface border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center space-y-6 relative overflow-hidden"
                    >
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${alertModal.type === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}>
                            {alertModal.type === 'warning' ? <AlertTriangle size={40} /> : <Clock size={40} />}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-text-main">{alertModal.title}</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                {alertModal.message}
                            </p>
                        </div>

                        <button
                            onClick={() => setAlertModal(prev => ({ ...prev, open: false }))}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Got it
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <AuthGate
            mode="modal"
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                        <Brain size={40} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Unlock the Test Center</h2>
                        <p className="text-text-muted max-w-md mt-2">
                            Login to access AI-powered mock tests, real-exam simulations, and detailed performance analysis.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="space-y-8 animate-fade-in">
                {alertModalComponent}
                <header>
                    <h1 className="text-3xl font-bold text-text-main">Test Center</h1>
                    <p className="text-text-muted">Real-Exam Simulation Engine</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Configuration Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 oxygen-card">
                        <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
                            <Zap className="text-primary" /> Configure Test
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Target Exam</label>
                                <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-text-main font-bold">
                                    {user?.targetExam || "Not Configured"}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMode('Quick_Test')}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${mode === 'Quick_Test' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-1"><Zap size={16} /> Quick Test</div>
                                        <div className="text-[10px] opacity-70">10 Questions • 30 Mins</div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMode('Full_Mock');
                                            setAlertModal({
                                                open: true,
                                                title: "Under Maintenance",
                                                message: "Full Mock simulations are currently undergoing system upgrades. Please use Quick Test instead!",
                                                type: 'info'
                                            });
                                        }}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all relative ${mode === 'Full_Mock' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Clock size={16} /> Full Mock
                                        </div>
                                        <div className="text-[10px] opacity-70">Under Maintenance</div>
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-600 text-[8px] font-bold text-white rounded-full uppercase tracking-tighter shadow-lg">Soon</div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Difficulty Bias</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '') ? (
                                        <div className="col-span-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center gap-2 text-primary font-bold cursor-default">
                                            <Brain size={18} /> CBSE Pattern (School Level)
                                        </div>
                                    ) : user?.targetExam?.toUpperCase().includes('JEE') ? (
                                        <>
                                            <button
                                                onClick={() => setDifficulty('Mains')}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === 'Mains' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-surface border-border text-text-muted hover:bg-white/5'}`}
                                            >
                                                JEE Mains
                                            </button>
                                            <button
                                                onClick={() => setDifficulty('Advanced')}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === 'Advanced' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-surface border-border text-text-muted hover:bg-white/5'}`}
                                            >
                                                JEE Advanced
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setDifficulty('Exam_Level')}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === 'Exam_Level' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-surface border-border text-text-muted hover:bg-white/5'}`}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                onClick={() => setDifficulty('Slightly_Harder')}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === 'Slightly_Harder' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-surface border-border text-text-muted hover:bg-white/5'}`}
                                            >
                                                Challenge (+20%)
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isDiagnosticDone === false && (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex flex-col gap-3">
                                    <div className="flex items-center gap-2 text-orange-200 text-sm font-bold">
                                        <AlertTriangle size={18} /> Diagnostic Test Missing
                                    </div>
                                    <p className="text-xs text-text-muted">You must complete a diagnostic test to unlock specialized mock simulations.</p>
                                    <button
                                        onClick={() => navigate('/dashboard/diagnostic')}
                                        className="w-full py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all"
                                    >
                                        Take Diagnostic Now
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            )}

                            <button
                                onClick={handleStartTest}
                                disabled={isDiagnosticDone === false}
                                className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isDiagnosticDone === false
                                    ? 'bg-white/5 border border-white/10 text-text-muted cursor-not-allowed opacity-50'
                                    : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                            >
                                {isDiagnosticDone === false ? <Lock size={20} /> : <Brain />}
                                {isDiagnosticDone === false ? 'Locked: Complete Diagnostic' : 'Start Simulation'}
                            </button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-xl p-6 oxygen-card">
                            <h2 className="text-xl font-bold text-text-main mb-4">Exam Isolation Rules</h2>
                            <ul className="space-y-4 text-sm text-text-muted">
                                <li className="flex gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                                    <span>
                                        <strong className="text-text-main">
                                            {['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '')
                                                ? 'School Syllabus Matching:'
                                                : 'Strict Syllabus matching:'}
                                        </strong> {['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '')
                                            ? 'We follow the official NCERT curriculum for your grade.'
                                            : "We only generate questions that are exactly in your exam's syllabus."}
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                                    <span>
                                        <strong className="text-text-main">Pattern Adherence:</strong> {['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '')
                                            ? 'Tests include school-style MCQs, Fill in the Blanks, and True/False questions.'
                                            : 'JEE tests will include numericals. NEET tests will be MCQ only.'}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Unified Features Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/dashboard/peer-benchmarking')}
                                className="p-5 rounded-xl border border-border bg-surface oxygen-card text-left flex items-center gap-4 group hover:bg-white/5 transition-all"
                            >
                                <TrendingUp size={24} className="text-green-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-text-main">Global Rankings</h3>
                                    <p className="text-[10px] text-text-muted">Check your standing among peers.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/dashboard/mock?history=true')}
                                className="p-5 rounded-xl border border-border bg-surface oxygen-card text-left flex items-center gap-4 group hover:bg-white/5 transition-all"
                            >
                                <CheckCircle size={24} className="text-accent" />
                                <div>
                                    <h3 className="text-sm font-bold text-text-main">Attempt History</h3>
                                    <p className="text-[10px] text-text-muted">Review past results.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
};
