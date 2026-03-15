import { useState, useEffect, useRef } from 'react';
import { Brain, Loader2, ArrowLeft, PlayCircle, Trophy, CheckCircle, Youtube, Timer, PauseCircle, X, Send, Coffee, AlertTriangle, TrendingUp as DynamicTrending } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { askAI } from '../../lib/ai';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '../../store/userStore';
import { getWeakTopics } from '../../services/topicStrengthService';
import { getAdaptiveQuestion } from '../../services/questionEngine';
import { extractJSON } from '../../lib/utils';
import { ViralShareCard } from '../../components/ViralShareCard';
import { AuthGate } from '../../components/auth/AuthGate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { calculatePredictedRank, updateLeaderboard } from '../../services/leaderboardService';
import { markTopicsAsCompletedFromResults, syncTopicStatsFromMocks } from '../../services/dataSyncService';
import { trackQuestionTime, trackOptionSwitch } from '../../lib/analytics';
import { storageService } from '../../services/storageService';
import { FatigueService } from '../../services/fatigueService';
import type { SessionMetric } from '../../services/fatigueService';
import { EloService } from '../../services/eloService';


type Question = {
    id: number;
    text: string;
    options: string[];
    /*
    ### Phase 7: AI Robustness & Build Stability
    - [x] Resolve Production Build Errors (unused imports/states)
    - [x] Implement detection for AI "Service Busy" messages in `extractJSON`
    - [x] Add exponential backoff / delay to AI retries in `MockGenerator`
    - [x] Verify production build success
    */
    correctAnswer: number;
    explanation: string;
    topic: string;
    imageUrl?: string;
};

type Message = {
    role: 'user' | 'ai';
    content: string;
};

export const MockGenerator = () => {
    const { user, authResolved, addGains, updateProfile } = useUserStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlTopic = searchParams.get('topic');
    const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1'
    );
    const isTestingUntimed = import.meta.env.DEV || isLocalhost;

    const [mode, setMode] = useState<'quick' | 'topic' | 'full' | 'diagnostic'>('quick');
    const [difficulty, setDifficulty] = useState<'Exam_Level' | 'Slightly_Harder' | 'Mains' | 'Advanced'>('Exam_Level');
    const [step, setStep] = useState<'config' | 'loading' | 'preview' | 'exam' | 'result' | 'history' | 'review'>('config');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");
    // const [attemptId, setAttemptId] = useState<string | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiExplanation, setAiExplanation] = useState("");
    const [aiChatHistory, setAiChatHistory] = useState<Message[]>([]);
    const [aiInput, setAiInput] = useState("");
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [qStartTime, setQStartTime] = useState(Date.now());
    const [generationProgress, setGenerationProgress] = useState(0);

    // Beautiful Alert State
    const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'warning' | 'info' }>({ 
        open: false, title: "", message: "", type: 'info' 
    });

    // AI 2.0: Fatigue State
    const [sessionHistory, setSessionHistory] = useState<SessionMetric[]>([]);
    const [fatigueNotice, setFatigueNotice] = useState<{ fatigued: boolean; reason?: string }>({ fatigued: false });

    // AI 2.0: Adaptive Elo State
    const [currentAbility, setCurrentAbility] = useState<number>(user?.abilityScore || 1000);
    const isTimedExam = false; // mode !== 'diagnostic' && !isTestingUntimed;

    // Refs for global progress tracking to prevent jitter in parallel batches
    const globalFetchedRef = useRef(0);
    const globalTargetRef = useRef(0);

    // --- HYDRATION: Restore state on refresh ---
    useEffect(() => {
        const cached = sessionStorage.getItem('active_test_session');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                // Ensure the cached session matches the current user
                if (data.userId === user?.id) {
                    setQuestions(data.questions);
                    setAnswers(data.answers || {});
                    setCurrentQ(data.currentQ || 0);
                    setStep(data.step);
                    setMode(data.mode);
                    setDifficulty(data.difficulty);
                    setTimeRemaining(isTestingUntimed ? 0 : (data.timeRemaining || 0));
                    setSessionHistory(data.sessionHistory || []);
                    setFatigueNotice(data.fatigueNotice || { fatigued: false });
                    setCurrentAbility(data.currentAbility || user?.abilityScore || 1000);
                    console.log("[MockGenerator] Restored session from cache.");

                    // IF we refreshed while loading, stop and return to menu
                    if (data.step === 'loading') {
                        sessionStorage.removeItem('active_test_session');
                        navigate('/dashboard/test-center', { replace: true });
                    }
                } else {
                    sessionStorage.removeItem('active_test_session');
                }
            } catch (e) {
                console.error("Failed to restore session", e);
                sessionStorage.removeItem('active_test_session');
            }
        }
    }, [user?.id, isTestingUntimed]);

    // --- PERSISTENCE: Save state on change ---
    useEffect(() => {
        if (questions.length > 0 && (step === 'exam' || step === 'preview' || step === 'loading')) {
            const session = {
                userId: user?.id,
                questions,
                answers,
                currentQ,
                step,
                mode,
                difficulty,
                timeRemaining,
                sessionHistory,
                fatigueNotice,
                currentAbility,
                timestamp: Date.now()
            };
            sessionStorage.setItem('active_test_session', JSON.stringify(session));
        } else if (step === 'result' || step === 'config') {
            // Clear cache when finished or back at menu
            if (step === 'result') sessionStorage.removeItem('active_test_session');
        }
    }, [questions, answers, currentQ, step, mode, difficulty, timeRemaining, user?.id]);

    useEffect(() => {
        // Immediate redirect if no active test config is detected in URL.
        const modeParam = searchParams.get('mode');
        const historyParam = searchParams.get('history');

        if (!urlTopic && !modeParam && historyParam !== 'true') {
            navigate('/dashboard/test-center', { replace: true });
        }
    }, [urlTopic, searchParams, navigate]);

    useEffect(() => {
        // 0. Force clear any "Deadlock Caches" that might be sticking from previous failures
        const clearBrokenCaches = () => {
             for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('ai_cache_') || key.startsWith('q_engine_cache_'))) {
                    localStorage.removeItem(key);
                }
            }
            console.log("[MockGenerator] 🧹 Flushed all generation caches to ensure fresh batch.");
        };
        
        if (user && authResolved && step === 'config' && questions.length === 0) {
            clearBrokenCaches();
            checkPrerequisites();
        }
    }, [user, authResolved, urlTopic, searchParams, step, questions.length]);

    const checkPrerequisites = async () => {
        if (!user || step !== 'config' || questions.length > 0) return;

        const modeParam = searchParams.get('mode');

        // SKIP check if already in diagnostic mode
        if (modeParam === 'diagnostic') {
            setMode('diagnostic');
            generateExam('diagnostic');
            return;
        }

        // PRIORITY: If user has XP or local history, they are established. Skip Firestore diagnostic check.
        const localHistoryRaw = localStorage.getItem('exam_compass_local_history');
        const hasLocalHistory = localHistoryRaw ? (JSON.parse(localHistoryRaw) || []).length > 0 : false;
        const isEstablishedUser = user.xp > 0 || hasLocalHistory;

        if (!isEstablishedUser) {
            // Only verify diagnostic for brand-new users (XP === 0)
            try {
                const q = query(
                    collection(db, 'diagnostic_results'),
                    where('user_id', '==', user.id),
                    where('class', '==', user.userClass || 'General'),
                    where('exam', '==', user.targetExam || 'General'),
                    limit(1)
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    // Hard Gate: Redirect back if no diagnostic for new users
                    navigate('/dashboard/test-center', { replace: true });
                    return;
                }
            } catch (err) {
                console.error("Prerequisite check failed:", err);
                // On permission error for new users, redirect to test center
                navigate('/dashboard/test-center', { replace: true });
                return;
            }
        }

        // Proceed with test generation
        if (urlTopic) {
            setMode('topic');
            generateExam('topic', urlTopic);
        } else {
            const diffParam = searchParams.get('difficulty');
            const historyParam = searchParams.get('history');

            if (historyParam === 'true') {
                setStep('history');
            } else if (modeParam) {
                const standardizedMode = modeParam === 'Quick_Test' ? 'quick' : (modeParam === 'Full_Mock' ? 'full' : 'quick');
                setMode(standardizedMode as any);
                if (diffParam) setDifficulty(diffParam as any);
                generateExam(standardizedMode as any);
            }
        }
    };

    useEffect(() => {
        if (step === 'exam' && isTimedExam && timeRemaining > 0) {
            const timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (isTimedExam && timeRemaining === 0 && step === 'exam') {
            // Only auto-submit for timed tests
            handleSubmitExam(true);
        }
    }, [step, timeRemaining, isTimedExam]);

    const handleExit = () => {
        if (questions.length > 0 && step === 'exam') {
            if (!window.confirm("Are you sure you want to exit? Your progress will be saved in history but this session will end.")) return;
        }
        sessionStorage.removeItem('active_test_session');
        navigate('/dashboard/test-center');
    };

    const saveProgress = async (status: 'paused' | 'completed') => {
        if (!user) return;

        const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');

        // Calculate score if completing
        let currentScore = 0;
        if (status === 'completed') {
            (Array.isArray(questions) ? questions : []).forEach((q, idx) => {
                if (answers[idx] === (q as any).correctAnswer) {
                    currentScore += 4;
                } else if (answers[idx] !== undefined) {
                    // No negative marking for juniors
                    currentScore -= isJunior ? 0 : 1;
                }
            });
            setScore(currentScore);
        }

        try {
            // 1. Data Aggregation for Backend Trigger
            const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
            const attemptedCount = Object.keys(answers).length;
            const wrongCount = attemptedCount - correctCount;

            const mockAttemptData = {
                user_id: user.id,
                exam_name: user?.targetExam || 'General',
                type: mode,
                topic_focus: mode === 'topic' ? urlTopic : null,
                score: status === 'completed' ? currentScore : 0,
                total_questions: questions.length,
                status: status,
                current_ability: currentAbility,
                created_at: serverTimestamp(), // Use serverTimestamp for backend-ordered consistency
                details: {
                    questions: questions.map(q => ({
                        id: q.id,
                        topic: q.topic,
                        correctAnswer: q.correctAnswer,
                        text: q.text
                    })),
                    answers
                }
            };

            // 2. Primary Record - Triggers Backend Worker
            let attemptRef = null;
            let syncError = false;
            try {
                attemptRef = await addDoc(collection(db, 'mock_attempts'), mockAttemptData);
                console.log("✅ Mock attempt recorded. Backend worker triggered.", attemptRef.id);
            } catch (err) {
                console.error("❌ Firestore sync failed. Marking for retry.", err);
                syncError = true;
            }

            // 3. Critical Path: Diagnostic Results (Mandatory for progression)
            if (mode === 'diagnostic' && status === 'completed') {
                await addDoc(collection(db, 'diagnostic_results'), {
                    user_id: user.id,
                    score: currentScore,
                    total_questions: questions.length,
                    date: new Date().toISOString(),
                    exam: user.targetExam || 'General',
                    class: user.userClass || 'General'
                });
            }

            // 4. Local Feedback: Save for Offline History
            await storageService.saveTestAttempt({
                id: Date.now(),
                score: currentScore,
                total: questions.length * 4,
                type: mode,
                exam: user?.targetExam || 'Generic Exam',
                date: new Date().toISOString(),
                status: status,
                details: { questions, answers },
                percentage: Math.max(0, Math.round((correctCount / questions.length) * 100)),
                correctCount,
                wrongCount,
                totalQuestions: questions.length,
                pendingSync: syncError, // STORE FAIL STATUS
                topic: mode === 'topic' ? (urlTopic || 'Specific Topic') : (mode === 'quick' ? 'Quick Test' : 'Full Mock'),
                user_class: user.userClass || 'General',
                weakTopics: questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctAnswer).map(q => q.topic)
            }, user.id);

            // 5. Perceived Speed: Immediate Syllabus Update (Optional but nice)
            if (status === 'completed') {
                const questionResults = questions.map((q, i) => ({
                    topic: q.topic,
                    isCorrect: answers[i] === q.correctAnswer
                }));

                // --- FRONTEND WORKER: REPLACING BLOCKED FIREBASE FUNCTIONS ---
                // Update Leaderboard via Client SDK (Transaction)
                updateLeaderboard(
                    user.id,
                    {
                        displayName: user.name || 'Anonymous Student',
                        avatar: user.avatarUrl,
                        xp: user.xp + (currentScore * 10),
                        rankName: user.prepLevel || 'Aspirant'
                    },
                    currentScore,
                    user.targetExam || 'General'
                ).catch(err => console.warn("[FrontendWorker] Leaderboard sync failed:", err));

                // Update Local XP and Level (Instant UI Feedback)
                addGains({
                    xp: currentScore * 10,
                    pts: currentScore // 1 point per mark
                }).catch(() => { });

                // Update Last Test Date
                updateProfile({
                    lastTestDate: new Date().toISOString().split('T')[0]
                }).catch(() => { });

                // Fire and forget updating operations
                markTopicsAsCompletedFromResults(user.id, questionResults).catch(() => { });
                syncTopicStatsFromMocks(user.id, user.userClass, user.targetExam).catch(() => { });
            }

        } catch (e) {
            console.error("Failed to save progress", e);
        }
    };

    const handlePause = async () => {
        // Optimistic UI update could go here, but for safety we'll use a loading state if needed.
        // For now, let's just show a "saving" indicator or similar if it's slow.
        // Actually, let's just do fire-and-forget for the UI transition if safe, 
        // OR better: show a saving toast/overlay.
        // Given the user wants speed, we'll use a local loading state for the button.
        const confirm = window.confirm("Are you sure you want to pause?");
        if (!confirm) return;

        try {
            setLoadingMessage("Saving progress...");
            setStep('loading'); // Show loading screen immediately
            await saveProgress('paused');
            setStep('config');
        } catch (e) {
            console.error(e);
            setStep('exam'); // Go back if failed
        }
    };

    const handleResume = (attempt: any, mode: 'resume' | 'review' = 'resume') => {
        if (!attempt.details) return;

        setQuestions(attempt.details.questions);
        setAnswers(attempt.details.answers || {});
        setCurrentQ(attempt.current_q_index || 0);
        setTimeRemaining(attempt.time_left || 0);
        setMode(attempt.type);

        if (mode === 'review') {
            setStep('review');
            setCurrentQ(0);
        } else {
            setStep('exam');
        }
    };

    const generateQuestionsBatch = async (subject: string, count: number, _context: string, startId: number): Promise<Question[]> => {
        let collected: Question[] = [];
        const targetExam = user?.targetExam || "JEE Mains";
        const seenQuestions = new Set<string>();

        // 1. Get User Stats
        let weaknessScore = 0.5;
        if (user) {
            try {
                const stats = await getWeakTopics(user.id, 10, user.userClass, targetExam);
                const relevantStat = stats.find(s => s.subject === subject || s.topic === subject);
                if (relevantStat) {
                    weaknessScore = relevantStat.weakness_score || 0.6;
                }
            } catch (e) {
                console.warn("Failed to fetch weakness for generation", e);
            }
        }

        // 2. Parallel Generation Loop
        let attempts = 0;
        const MAX_TOTAL_ATTEMPTS = count * 5; // Increased safety break for better reliability

        while (collected.length < count && attempts < MAX_TOTAL_ATTEMPTS) {
            const needed = count - collected.length;
            // Increased batch size to 5 for faster generation
            const batchSize = Math.min(needed, 5);

            // Create a batch of promises
            const promises = Array(batchSize).fill(0).map(async (_, idx) => {
                // Reduced stagger delay significantly for speed (500ms instead of 2500ms)
                await new Promise(r => setTimeout(r, idx * 500));
                
                // Add a local timeout for each question request
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Generation Timeout")), 45000)
                );
                
                return Promise.race([
                    getAdaptiveQuestion(
                        user?.id || 'guest',
                        urlTopic || subject,
                        targetExam,
                        weaknessScore,
                        subject,
                        currentAbility
                    ),
                    timeoutPromise
                ]);
            });

            try {
                const totalTarget = globalTargetRef.current || count;
                const startProgress = Math.min(Math.round((globalFetchedRef.current / totalTarget) * 100), 100);
                setGenerationProgress(startProgress);
                setLoadingMessage(`Generating ${subject}... ${startProgress}%`);

                const results = await Promise.allSettled(promises);

                for (const res of results) {
                    attempts++;
                    if (res.status === 'fulfilled' && res.value) {
                        const q = res.value as any;
                        const qId = q.id || q.question;

                        if (seenQuestions.has(qId)) continue;
                        seenQuestions.add(qId);

                        // Normalize
                        let correctAnswerIndex = 0;
                        const optionsArray: string[] = Array.isArray(q.options)
                            ? q.options
                            : Object.values(q.options);

                        // Hard check for placeholder options (AI laziness)
                        const isPlaceholder = optionsArray.every(opt => 
                            opt?.trim().length <= 1 || 
                            /^(Option|Opt|Choice)\s?[1-4]$/i.test(opt) ||
                            /^[A-D]$/i.test(opt)
                        );
                        if (isPlaceholder) {
                            console.warn("Discarding question with placeholder options:", q.question);
                            continue;
                        }

                        if (typeof q.correct_answer === 'string') {
                            if (q.correct_answer.length === 1 && /[A-D]/.test(q.correct_answer)) {
                                correctAnswerIndex = q.correct_answer.charCodeAt(0) - 65;
                            } else {
                                const foundIndex = optionsArray.indexOf(q.correct_answer);
                                if (foundIndex !== -1) correctAnswerIndex = foundIndex;
                            }
                        }

                        collected.push({
                            id: startId + collected.length,
                            text: q.question,
                            options: optionsArray,
                            correctAnswer: correctAnswerIndex,
                            explanation: q.explanation,
                            topic: q.topic || subject,
                            imageUrl: undefined
                        });

                        // GLOBAL PROGRESS UPDATE
                        globalFetchedRef.current += 1;
                        const totalTargetCount = globalTargetRef.current || count;
                        const currentProgress = Math.min(Math.round((globalFetchedRef.current / totalTargetCount) * 100), 100);

                        setGenerationProgress(currentProgress);
                        setLoadingMessage(`Generating ${subject}... ${currentProgress}%`);
                    }
                }
            } catch (e) {
                console.error("Batch generation failed", e);
                attempts += batchSize;
                // Stop retrying if rate-limited
                if (e instanceof Error && (e.message.includes('rate limit') || e.message.includes('429') || e.message.includes('Groq rate limited'))) {
                    console.warn("Rate limited - stopping generation retries.");
                    break;
                }
            }

            // Minimal pause between batches (reduced for speed)
            if (collected.length < count) await new Promise(r => setTimeout(r, 100));
        }

        return collected;
    };

    const generateExam = async (examMode: 'quick' | 'topic' | 'full' | 'diagnostic', topic?: string) => {
        setStep('loading');
        setQuestions([]);
        setAnswers({});
        setCurrentQ(0);
        setGenerationProgress(0);
        globalFetchedRef.current = 0;
        setLoadingMessage("Analyzing Syllabus & Patterns...");

        let classContext = "Standard Syllabus.";
        if (user?.userClass === 'Class 11th') {
            classContext = "Syllabus: Class 11 Chapters ONLY. EXPLICITLY EXCLUDE Class 12 topics (e.g., Electrostatics, Calculus, Vector 3D, Probability, Optics, Modern Physics).";
        } else if (user?.userClass === 'Class 12th' || user?.userClass === 'Dropper') {
            classContext = "Syllabus: Class 11 & 12 (Full Syllabus).";
        }

        const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
        if (isJunior) {
            const grade = user?.userClass?.replace(/\D/g, '') || '';
            const nextGrade = parseInt(grade) + 1;
            classContext = `Syllabus: Class ${grade} NCERT Syllabus ONLY. STRICTLY EXCLUDE topics from Class ${nextGrade} and higher (e.g. no Trigonometry/Calculus if not in syllabus). Questions can be Olympiad level challenging but MUST stay within Class ${grade} curriculum boundaries.`;
        }

        try {
            if (examMode === 'quick') {
                const qCount = 10;
                globalTargetRef.current = qCount;
                setTimeRemaining(30 * 60);
                
                const target = user?.targetExam?.toUpperCase() || '';
                const isNeet = target.includes('NEET');
                
                let q: any[] = [];
                console.log("[QuickTest] Starting Sequential Generation...");
                
                if (isJunior) {
                    q = await generateQuestionsBatch("Mathematics and Science", 10, `${classContext} Mixed topics.`, 1);
                } else if (isNeet) {
                    setLoadingMessage("Generating Biology (4/10)...");
                    const b = await generateQuestionsBatch("Biology", 4, classContext, 1);
                    setLoadingMessage("Generating Physics (7/10)...");
                    const p = await generateQuestionsBatch("Physics", 3, classContext, 5);
                    setLoadingMessage("Generating Chemistry (10/10)...");
                    const c = await generateQuestionsBatch("Chemistry", 3, classContext, 8);
                    q = [...b, ...p, ...c];
                } else {
                    // JEE Pattern Sequential
                    setLoadingMessage("Generating Mathematics (4/10)...");
                    const m = await generateQuestionsBatch("Mathematics", 4, classContext, 1);
                    setLoadingMessage("Generating Physics (7/10)...");
                    const p = await generateQuestionsBatch("Physics", 3, classContext, 5);
                    setLoadingMessage("Generating Chemistry (10/10)...");
                    const c = await generateQuestionsBatch("Chemistry", 3, classContext, 8);
                    q = [...m, ...p, ...c];
                }
                
                // Final Check and Minimal Recovery
                if (q.length < qCount) {
                    console.warn(`[QuickTest] Final fallthrough recovery for ${qCount - q.length} Qs.`);
                    const extra = await generateQuestionsBatch("General Science/Maths", qCount - q.length, classContext, q.length + 1);
                    q = [...q, ...extra];
                }
                
                setQuestions(q);
                console.log("[QuickTest] Successfully generated questions:", q.length);
                
                // Force transition to preview to ensure we don't stall
                setStep('preview');
                return; // Guarded return for QuickTest only

            } else if (examMode === 'diagnostic') {
                const qCount = 10;
                globalTargetRef.current = qCount;
                setTimeRemaining(0);
                setLoadingMessage("Calibrating...");
                const subject = isJunior ? "Math, Science, English" : "Physics, Chemistry, Maths/Bio";
                const q = await generateQuestionsBatch(subject, qCount, `Diagnostic. ${classContext}`, 1);
                setQuestions(q);
            } else if (examMode === 'topic') {
                const qCount = 15;
                globalTargetRef.current = qCount;
                setTimeRemaining(45 * 60);
                setLoadingMessage(`Generating Topic Test for ${topic}...`);
                const q = await generateQuestionsBatch(user?.targetExam || "General", qCount, `Topic: ${topic}. ${classContext}`, 1);
                setQuestions(q);
            } else if (examMode === 'full') {
                // TEMPORARY LOCK: Maintenance
                setAlertModal({
                    open: true,
                    title: "Under Maintenance",
                    message: "Full Mock simulations are currently undergoing system upgrades for better accuracy. Please use Quick Test instead.",
                    type: 'info'
                });
                return;
                
                const target = user?.targetExam?.toUpperCase() || '';
                const isNeet = target.includes('NEET');
                // const isJee = target.includes('JEE'); // Unused

                // 1. JUNIOR PATTERN (25 Qs, 4 Marks each -> 100 Marks)
                if (isJunior) {
                    const qCount = 25;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(60 * 60); // 1 Hour
                    setLoadingMessage(`Generating Class Test (${qCount} Qs)...`);

                    // Distribution: Math(7), Sci(7), SST(6), Eng(5)
                    const [p1, p2, p3, p4] = await Promise.all([
                        generateQuestionsBatch("Mathematics", 7, classContext, 1),
                        generateQuestionsBatch("Science", 7, classContext, 8),
                        generateQuestionsBatch("Social Science", 6, classContext, 15),
                        generateQuestionsBatch("English", 5, classContext, 21)
                    ]);
                    const allQs = [...p1, ...p2, ...p3, ...p4];
                    if (allQs.length < qCount) {
                        alert(`Unable to generate the full ${qCount} questions (got ${allQs.length}). Please try again.`);
                        navigate('/dashboard/test-center');
                        return;
                    }
                    setQuestions(allQs);
                } else if (isNeet) {
                    const qCount = 180;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(180 * 60);
                    setLoadingMessage(`Generating Full Mock (${qCount} Questions)...`);
                    const [p1, p2, p3] = await Promise.all([
                        generateQuestionsBatch("Physics", 45, classContext, 1),
                        generateQuestionsBatch("Chemistry", 45, classContext, 46),
                        generateQuestionsBatch("Biology", 90, classContext, 91)
                    ]);
                    const allQs = [...p1, ...p2, ...p3];
                    if (allQs.length < qCount) {
                        alert(`Unable to generate the full ${qCount} questions (got ${allQs.length}). Please try again.`);
                        navigate('/dashboard/test-center');
                        return;
                    }
                    setQuestions(allQs);
                } else if (target.includes('BITSAT')) {
                    const qCount = 130;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(180 * 60); // 3 Hours
                    setLoadingMessage(`Generating BITSAT Mock (${qCount} Qs)...`);
                    const [p1, p2, p3, p4, p5] = await Promise.all([
                        generateQuestionsBatch("Physics", 30, classContext, 1),
                        generateQuestionsBatch("Chemistry", 30, classContext, 31),
                        generateQuestionsBatch("Mathematics", 40, classContext, 61),
                        generateQuestionsBatch("English Proficiency", 10, classContext, 101),
                        generateQuestionsBatch("Logical Reasoning", 20, classContext, 111)
                    ]);
                    setQuestions([...p1, ...p2, ...p3, ...p4, ...p5]);
                } else if (target.includes('CLAT')) {
                    const qCount = 120;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(120 * 60); // 2 Hours
                    setLoadingMessage(`Generating CLAT Mock (${qCount} Qs)...`);
                    const [p1, p2, p3, p4, p5] = await Promise.all([
                        generateQuestionsBatch("English Language", 24, "CLAT pattern.", 1),
                        generateQuestionsBatch("Current Affairs & GK", 28, "CLAT pattern.", 25),
                        generateQuestionsBatch("Legal Reasoning", 28, "CLAT pattern.", 53),
                        generateQuestionsBatch("Logical Reasoning", 28, "CLAT pattern.", 81),
                        generateQuestionsBatch("Quantitative Techniques", 12, "CLAT pattern.", 109)
                    ]);
                    setQuestions([...p1, ...p2, ...p3, ...p4, ...p5]);
                } else if (target.includes('UPSC')) {
                    const qCount = 100;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(120 * 60); // 2 Hours
                    setLoadingMessage(`Generating UPSC CSE Prelims Mock (${qCount} Qs)...`);
                    const q = await generateQuestionsBatch("General Studies (History, Geography, Polity, Economy, Science, Env)", 100, "UPSC CSE Prelims Standard.", 1);
                    setQuestions(q);
                } else if (target.includes('GATE')) {
                    const qCount = 65;
                    globalTargetRef.current = qCount;
                    setTimeRemaining(180 * 60); // 3 Hours
                    setLoadingMessage(`Generating GATE Mock (${qCount} Qs)...`);
                    const [p1, p2] = await Promise.all([
                        generateQuestionsBatch("General Aptitude", 10, "GATE standards.", 1),
                        generateQuestionsBatch(user?.targetExam || "Core Engineering Subject", 55, "GATE technical standards.", 11)
                    ]);
                    setQuestions([...p1, ...p2]);
                } else {
                    const qCount = 75;
                    globalTargetRef.current = qCount; // CRITICAL FIX: Set total target for progress bar
                    setTimeRemaining(180 * 60);
                    setLoadingMessage(`Generating Full Mock (${qCount} Questions)...`);
                    const [p1, p2, p3] = await Promise.all([
                        generateQuestionsBatch("Physics", 25, classContext, 1),
                        generateQuestionsBatch("Chemistry", 25, classContext, 26),
                        generateQuestionsBatch("Mathematics", 25, classContext, 51)
                    ]);
                    const allQs = [...p1, ...p2, ...p3];
                    if (allQs.length < qCount) {
                        alert(`Unable to generate the full ${qCount} questions (got ${allQs.length}). Please try again.`);
                        navigate('/dashboard/test-center');
                        return;
                    }
                    setQuestions(allQs);
                }
            }

            // Verify we actually generated questions before proceeding
            // Rather than checking the async state (which isn't updated yet), we just rely on `questions` remaining empty if a block failed without throwing. Wait, we can't do that.
            // A better way: check if the global target was met, or check if we progressed successfully.
            if (globalFetchedRef.current === 0) {
                throw new Error("No questions were generated successfully.");
            }

            if (isTestingUntimed) {
                setTimeRemaining(0);
            }

            setStep('preview');
        } catch (e: any) {
            console.error(e);
            if (e.code === 'permission-denied' || e.message?.includes('Missing or insufficient permissions')) {
                alert("Creation Failed: Firestore Logic Rules are not deployed. Please run 'firebase deploy --only firestore' in your terminal.");
            } else {
                alert("Failed to generate exam. Please try again.");
            }
            navigate('/dashboard/test-center');
        }
    };

    const alertModalComponent = (
        <AnimatePresence>
            {alertModal.open && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-surface border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center space-y-6 relative overflow-hidden"
                    >
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${alertModal.type === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}>
                            {alertModal.type === 'warning' ? <AlertTriangle size={40} /> : <Timer size={40} />}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-text-main">{alertModal.title}</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                {alertModal.message}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setAlertModal(prev => ({ ...prev, open: false }));
                                navigate('/dashboard/test-center');
                            }}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Got it
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const handleAnswer = (optionIdx: number) => {
        const q = questions[currentQ];
        if (q) {
            const prevAnswer = answers[currentQ];
            if (prevAnswer !== undefined && prevAnswer !== optionIdx) {
                trackOptionSwitch(q.id.toString(), prevAnswer.toString(), optionIdx.toString());
            }
        }
        setAnswers(prev => ({ ...prev, [currentQ]: optionIdx }));
    };

    const handleNextQ = () => {
        const q = questions[currentQ];
        if (q) {
            const duration = Math.floor((Date.now() - qStartTime) / 1000);
            trackQuestionTime(q.id.toString(), duration, q.topic || 'General');

            // AI 2.0: Update Fatigue History
            const isCorrect = answers[currentQ] === q.correctAnswer;
            const newMetric: SessionMetric = {
                questionIndex: currentQ,
                isCorrect: isCorrect,
                timeSpent: duration,
                timestamp: Date.now()
            };

            const newHistory = [...sessionHistory, newMetric];
            setSessionHistory(newHistory);

            // AI 2.0: Update Elo Rating in Real-time
            const newAbility = EloService.calculateNewAbility(
                currentAbility,
                (q as any).difficulty || 'Medium',
                isCorrect
            );
            setCurrentAbility(newAbility);

            // Periodically check for fatigue
            if (newHistory.length % 3 === 0) {
                const result = FatigueService.detectFatigue(newHistory);
                if (result.fatigued) {
                    setFatigueNotice(result);
                }
            }
        }
        setCurrentQ(p => p + 1);
        setQStartTime(Date.now());
    };

    const handlePrevQ = () => {
        setCurrentQ(p => Math.max(0, p - 1));
        setQStartTime(Date.now());
    };

    const handleAskAI = async (q: Question) => {
        if (!user) return;
        setAiModalOpen(true);
        setIsVerifying(true);
        setAiExplanation("Exa is re-solving this problem from scratch to verify correctness...");
        setAiChatHistory([{ role: 'ai', content: "Exa is re-solving this problem from scratch to verify correctness..." }]);

        const verificationPrompt = `
            CRITICAL TASK: Solve this question blindly from first principles. 
            Do NOT trust the provided 'official' answer if it contradicts logic.
            
            Question: ${q.text}
            Options:
            A) ${q.options[0]}
            B) ${q.options[1]}
            C) ${q.options[2]}
            D) ${q.options[3]}

            Return ONLY a JSON object:
            {
              "solved_index": number (0-3),
              "step_by_step": "Detailed explanation of your derivation...",
              "is_official_wrong": boolean
            }
        `;

        try {
            const response = await askAI("Brilliant Science Tutor", verificationPrompt, 'groq', [], { stream: false });
            const result = extractJSON(response);

            if (result && typeof result.solved_index === 'number') {
                const solvedIdx = result.solved_index;
                const userChoice = answers[currentQ];
                let notice = "";

                // SCORE CORRECTION LOGIC
                // If user was marked wrong, but AI re-solve says user was actually right
                if (userChoice === solvedIdx && q.correctAnswer !== solvedIdx) {
                    notice = "\n\n🎉 **FAIR PLAY DETECTED!** My initial key was wrong, and you were right. I have corrected your score and updated your records. +4 Marks added!";

                    // 1. Update Local Score
                    setScore(prev => prev + 4);

                    // 2. Update Firestore (Diagnostic)
                    if (mode === 'diagnostic') {
                        const diagQuery = query(
                            collection(db, 'diagnostic_results'),
                            where('user_id', '==', user.id),
                            where('class', '==', user.userClass || 'General'),
                            where('exam', '==', user.targetExam || 'General'),
                            limit(1)
                        );
                        const diagSnap = await getDocs(diagQuery);
                        if (!diagSnap.empty) {
                            const diagDoc = diagSnap.docs[0];
                            await updateDoc(diagDoc.ref, {
                                score: increment(4)
                            });
                            console.log("✅ Remote score corrected (+4)");
                        }
                    }
                }

                const finalMsg = `**AI Verification Complete**\n\nVerified Correct Answer: **Option ${String.fromCharCode(65 + solvedIdx)}** (${q.options[solvedIdx]})\n\n**Derivation:**\n${result.step_by_step}${notice}`;
                setAiExplanation(finalMsg);
                setAiChatHistory([{ role: 'ai', content: finalMsg }]);
            } else {
                throw new Error("Invalid verification response");
            }
        } catch (err) {
            console.error("Verification failed", err);
            const fallback = `AI Analysis for Question ${q.id}:\n\nCorrect Answer: ${q.options[q.correctAnswer]}\n\nRationale:\n${q.explanation}`;
            setAiExplanation(fallback);
            setAiChatHistory([{ role: 'ai', content: fallback }]);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSendAiMessage = async () => {
        if (!aiInput.trim()) return;

        const userMsg = aiInput.trim();
        setAiChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setAiInput("");
        setIsAiThinking(true);

        try {
            // Context needs to include the question and previous explanation
            const q = questions[currentQ];
            const context = `
                Question: ${q.text}
                Options: ${q.options.join(', ')}
                Correct Answer: ${q.options[q.correctAnswer]}
                Explanation: ${q.explanation}
                
                Chat History:
                ${aiChatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
                USER: ${userMsg}
            `;

            const response = await askAI('Helpful Tutor', context, 'groq', [], { stream: false });
            if (response) {
                setAiChatHistory(prev => [...prev, { role: 'ai', content: response }]);
            }
        } catch (e) {
            console.error(e);
            setAiChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSubmitExam = async (force: boolean = false) => {
        if (!force && !window.confirm("Are you sure you want to end the exam?")) return;

        try {
            setLoadingMessage("Submitting exam...");
            setStep('loading'); // Show loading immediately
            await saveProgress('completed');
            setStep('result');
            // Update mastery logic if topic test
            if (mode === 'topic' && urlTopic) {
                // ... existing mastery update logic ...
            }
        } catch (e) {
            console.error(e);
            setStep('exam');
        }
    };

    if (!user) {
        return (
            <AuthGate
                mode="modal"
                fallback={
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                            <Brain size={40} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-main">Login to Take Tests</h2>
                            <p className="text-text-muted max-w-md mt-2">
                                Start your exam preparation journey with AI-generated mocks.
                            </p>
                        </div>
                    </div>
                }
            >
                <div></div>
            </AuthGate>
        );
    }

    if (step === 'loading' || step === 'config') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-md mx-auto px-4">
                {alertModalComponent}
                <div className="relative">
                    <Loader2 size={64} className="text-primary animate-spin opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center text-primary font-bold">
                        {generationProgress}%
                    </div>
                </div>

                <div className="space-y-2 text-center w-full">
                    <h2 className="text-xl font-bold text-text-main">Building Your Exam</h2>
                    <p className="text-text-muted text-sm h-5">{loadingMessage}</p>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-surface border border-border h-3 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted mt-4">
                    <Brain size={14} /> Only sourcing last 10 years PYQ-style
                </div>

                <div className="pt-8 w-full max-w-xs">
                    <button
                        onClick={handleExit}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all font-medium group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Cancel & Return
                    </button>
                    {step === 'config' && (
                         <p className="text-[10px] text-text-muted/30 text-center mt-4">Verifying Credentials & Pattern Isolation...</p>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'result') {
        return (
            <div className="glass-card oxygen-card p-8 text-center space-y-6 max-w-4xl mx-auto animate-fade-in-up relative">
                <CheckCircle size={64} className="text-green-500 mx-auto" />
                <h2 className="text-3xl font-bold text-text-main">Test Submitted!</h2>
                <div className="text-5xl font-bold text-primary">{score} / {questions.length * 4}</div>
                <p className="text-text-muted">Accuracy: {Math.round((score / (questions.length * 4)) * 100)}%</p>

                <div className="flex justify-center my-8 scale-90 md:scale-100 origin-center">
                    <ViralShareCard
                        score={score}
                        total={questions.length * 4}
                        topic={mode === 'topic' ? (urlTopic || 'Specific Topic') : (user?.targetExam || 'General')}
                        rank={calculatePredictedRank(Math.round((score / (questions.length * 4)) * 100), user?.targetExam || 'General')}
                        username={user?.name || 'Anonymous'}
                    />
                </div>

                {/* AI Rank Prediction Card */}
                <div className="max-w-lg mx-auto mt-6 p-6 rounded-2xl bg-gradient-to-br from-surface to-primary/10 border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={100} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-text-muted uppercase tracking-widest mb-2">Predicted AIR</h3>
                        <div className="text-4xl font-heading font-bold text-primary mb-1">
                            #{calculatePredictedRank((score / (questions.length * 4)) * 100, user?.targetExam || 'JEE Mains').toLocaleString()}
                        </div>
                        <p className="text-xs text-text-muted">Based on this test performance</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full max-w-lg mx-auto mt-8">
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center">
                        <span className="text-3xl font-bold text-green-500">
                            {questions.filter((q, i) => answers[i] === q.correctAnswer).length}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-green-400 font-bold mt-1">Correct</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center">
                        <span className="text-3xl font-bold text-red-500">
                            {questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctAnswer).length}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-red-400 font-bold mt-1">Wrong</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                        <span className="text-3xl font-bold text-text-muted">
                            {questions.filter((_, i) => answers[i] === undefined).length}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-text-muted font-bold mt-1">Skipped</span>
                    </div>
                </div>

                {/* Video Recommendations for Weak Topics */}
                {(() => {
                    const wrongTopics = questions
                        .filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctAnswer)
                        .map(q => q.topic)
                        .filter((topic, index, self) => self.indexOf(topic) === index) // unique topics
                        .slice(0, 3);

                    if (wrongTopics.length === 0) return null;

                    return (
                        <div className="max-w-2xl mx-auto mt-8 p-6 rounded-2xl bg-surface border border-border">
                            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                <Youtube size={20} className="text-red-400" /> Focus Areas - Watch These Lectures
                            </h3>
                            <div className="space-y-3">
                                {wrongTopics.map((topic, idx) => {
                                    const cleanSlug = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => navigate(`/dashboard/lectures/${cleanSlug}`)}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                    <Youtube size={18} className="text-red-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">{topic}</h4>
                                                    <p className="text-xs text-text-muted">Curated video lessons</p>
                                                </div>
                                            </div>
                                            <ArrowLeft size={18} className="text-text-muted group-hover:text-primary transition-colors rotate-180" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                <button
                    onClick={() => {
                        setStep('review');
                        setCurrentQ(0);
                    }}
                    className="mt-8 px-6 py-3 bg-secondary/10 text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/20 transition-all font-bold flex items-center gap-2 mx-auto"
                >
                    <Brain size={18} /> Review Questions
                </button>


                <div className="flex flex-wrap gap-4 justify-center mt-8 pt-4 border-t border-white/10">
                    <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-surface border border-border rounded-lg oxygen-button hover:bg-white/5 transition-all">
                        <ArrowLeft size={18} className="inline mr-2" /> Back to Dashboard
                    </button>
                    <button
                        onClick={async () => {
                            const text = `I just scored ${score} on my ${mode === 'topic' ? urlTopic : (user?.targetExam || 'Exam')} Mock Test on Exam Compass! 🚀\n\nJoin me and crack your exams with AI: https://examcompass.web.app`;
                            if (navigator.share) {
                                try {
                                    await navigator.share({
                                        title: 'My Exam Compass Score',
                                        text: text,
                                        url: 'https://examcompass.web.app'
                                    });
                                } catch (err) {
                                    console.error("Error sharing:", err);
                                }
                            } else {
                                navigator.clipboard.writeText(text);
                                alert("Result copied to clipboard! Share it with your friends.");
                            }
                        }}
                        className="px-6 py-3 bg-primary text-white rounded-lg oxygen-button flex items-center gap-2"
                    >
                        <Trophy size={18} /> Share My Score
                    </button>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/5 border border-border text-text-muted rounded-lg oxygen-button hover:bg-white/10 transition-all">Retake Test</button>
                </div>



                {/* Simple AI Modal Overlay */}
                {
                    aiModalOpen && (
                        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 oxygen-modal-backdrop open">
                            <div className="glass-card max-w-lg w-full p-6 oxygen-modal open">
                                <h3 className="text-xl font-bold text-primary flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Brain size={24} className={isVerifying ? "animate-pulse text-secondary" : ""} />
                                        {isVerifying ? "Exa Verification" : "AI Tutor"}
                                    </div>
                                    {isVerifying && <Loader2 size={18} className="animate-spin text-secondary" />}
                                </h3>
                                <div className={`whitespace-pre-wrap text-text-muted mb-6 text-sm leading-relaxed ${isVerifying ? 'opacity-50 grayscale transition-all' : 'opacity-100 transition-all'}`}>
                                    <div className="prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {aiExplanation}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiModalOpen(false)}
                                    className="w-full py-2 bg-surface border border-border rounded-lg hover:bg-white/5"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    if (step === 'preview') {
        const timeLimit = Math.floor(timeRemaining / 60);
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-2xl mx-auto text-center animate-fade-in-up py-10">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain size={48} className="text-primary" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-text-main">Your Exam is Ready</h2>
                    <p className="text-text-muted">Review the details below before starting your session.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Questions</span>
                        <span className="text-2xl font-bold text-text-main">{questions.length}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Time Limit</span>
                        <span className="text-2xl font-bold text-text-main">{isTimedExam && timeLimit > 0 ? `${timeLimit} Min` : 'Untimed'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface border border-border col-span-2 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Subjects</span>
                        <span className="text-lg font-bold text-primary">
                            {mode === 'topic' ? urlTopic : (user?.targetExam || 'General Proficiency')}
                        </span>
                    </div>
                </div>

                <div className="w-full p-6 rounded-2xl bg-primary/5 border border-primary/10 text-left space-y-3">
                    <h4 className="font-bold text-text-main flex items-center gap-2">
                        <CheckCircle size={16} className="text-primary" /> Instructions:
                    </h4>
                    <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                        <li>Each question carries +4 marks.</li>
                        <li>-1 mark for incorrect answers (JEE/NEET Pattern).</li>
                        <li>{isTimedExam ? 'Timer starts as soon as you click the button below.' : 'Timer is disabled on localhost for testing.'}</li>
                        <li>You can pause the test at any time.</li>
                    </ul>
                </div>

                <button
                    onClick={() => {
                        if (isTestingUntimed) {
                            setTimeRemaining(0);
                        }
                        setStep('exam');
                        setQStartTime(Date.now());
                    }}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
                >
                    Start Test Now
                </button>

                <div className="w-full max-w-xs pt-4">
                    <button
                        onClick={handleExit}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all font-medium group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'exam' || step === 'review') {
        const q = questions[currentQ];
        if (!q) return <div>Error loading question. <button onClick={() => window.location.reload()}>Retry</button></div>;
        return (
            <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8 animate-fade-in-up">
                    {/* Fatigue Warning Notification */}
                    <AnimatePresence>
                        {fatigueNotice.fatigued && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="overflow-hidden mb-4"
                            >
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-4 text-yellow-500 relative">
                                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                                        <Coffee size={20} className="animate-bounce" />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                            <AlertTriangle size={14} /> Low Mental Battery Detected
                                        </h5>
                                        <p className="text-xs opacity-80 mt-1">{fatigueNotice.reason}</p>
                                    </div>
                                    <button
                                        onClick={() => setFatigueNotice({ fatigued: false })}
                                        className="text-xs font-bold px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <header className="flex flex-row justify-between items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-border shadow-lg">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="font-bold text-text-main text-sm">Question {currentQ + 1} of {questions.length}</h2>
                                <span className="text-[10px] text-text-muted tracking-widest">{mode === 'full' ? 'FULL MOCK' : 'QUICK TEST'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {step === 'exam' ? (
                                !isTimedExam ? (
                                    <div className="text-secondary font-bold flex items-center gap-2 text-sm">
                                        <Timer size={18} /> UNTIMED
                                    </div>
                                ) : (
                                    <div className={`flex items-center gap-2 text-lg font-mono font-bold ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                        <Timer size={18} />
                                        {Math.floor(timeRemaining / 3600)}:
                                        {String(Math.floor((timeRemaining % 3600) / 60)).padStart(2, '0')}:
                                        {String(timeRemaining % 60).padStart(2, '0')}
                                    </div>
                                )
                            ) : (
                                <div className="text-primary font-bold flex items-center gap-2 text-sm">
                                    <CheckCircle size={16} /> REVIEW MODE
                                </div>
                            )}

                            {/* AI 2.0: Ability Pulse */}
                            {mode !== 'diagnostic' && (
                                <div className="hidden md:flex flex-col items-end px-4 border-l border-border">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Ability Est.</span>
                                    <div className="flex items-center gap-1.5 text-secondary font-bold text-sm">
                                        <DynamicTrending size={14} />
                                        {EloService.calculatePercentile(currentAbility)}th %ile
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {step === 'exam' ? (
                                    <>
                                        <button
                                            onClick={handlePause}
                                            className="p-2 rounded-lg bg-surface border border-border hover:bg-white/5 text-text-muted hover:text-text-main transition-colors"
                                            title="Pause"
                                        >
                                            <PauseCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleSubmitExam(false)}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                                        >
                                            End
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setStep('result')}
                                        className="p-2 rounded-lg bg-surface border border-border hover:bg-white/5 text-text-main transition-colors"
                                        title="Back to Result"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="glass-card p-8 min-h-[400px]">
                        <div className="flex justify-between mb-4">
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{q.topic || 'General'}</span>
                        </div>
                        <h3 className="text-xl font-medium text-text-main mb-8 leading-relaxed">
                            {q.imageUrl && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-border bg-black/50 flex justify-center">
                                    <img
                                        src={q.imageUrl}
                                        alt="Diagram"
                                        className="max-h-[300px] w-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            {q.text}
                        </h3>
                        <div className="space-y-3">
                            {q.options.map((opt, idx) => {
                                const isSelected = answers[currentQ] === idx;
                                const isCorrect = q.correctAnswer === idx;
                                let btnClass = 'bg-surface border-border text-text-muted hover:bg-white/5 hover:border-primary/30';

                                if (step === 'exam') {
                                    if (isSelected) btnClass = 'bg-primary/20 border-primary text-primary shadow-inner';
                                } else {
                                    // Review Mode Styling
                                    if (isCorrect) btnClass = 'bg-green-500/20 border-green-500 text-green-500 font-bold';
                                    else if (isSelected) btnClass = 'bg-red-500/20 border-red-500 text-red-500 line-through opacity-70';
                                    else btnClass = 'bg-surface border-border text-text-muted opacity-50';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => step === 'exam' && handleAnswer(idx)}
                                        disabled={step === 'review'}
                                        className={`w-full p-4 text-left rounded-xl border transition-all ${btnClass}`}
                                    >
                                        <span className="font-bold mr-3 opacity-50">{String.fromCharCode(65 + idx)}.</span> {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {step === 'review' && (answers[currentQ] !== q.correctAnswer) && (
                            <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in-up">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <Brain size={18} /> Explanation
                                    </div>
                                    <button
                                        onClick={() => handleAskAI(q)}
                                        className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Brain size={14} /> Ask AI
                                    </button>
                                </div>
                                <p className="text-text-muted text-sm leading-relaxed italic">
                                    {q.explanation}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4 bg-surface p-4 rounded-xl border border-border">
                        {/* Scrollable Question Bubbles with Animation */}
                        <div className="w-full overflow-x-auto pb-4 pt-2 px-1 custom-scrollbar flex gap-3 snap-x">
                            <AnimatePresence>
                                {questions.map((_, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ duration: 0.2, delay: idx < 10 ? idx * 0.05 : 0 }}
                                        onClick={() => setCurrentQ(idx)}
                                        className={`shrink-0 w-10 h-10 snap-center rounded-full border flex items-center justify-center font-bold text-sm relative transition-colors duration-200 ${currentQ === idx
                                            ? 'bg-primary text-white border-primary shadow-lg scale-110 z-10'
                                            : answers[idx] !== undefined
                                                ? 'bg-primary/10 text-primary border-primary/30'
                                                : 'bg-surface text-text-muted border-border hover:bg-white/5'
                                            }`}

                                    >
                                        {idx + 1}
                                        {currentQ === idx && (
                                            <motion.div
                                                layoutId="active-ring"
                                                className="absolute inset-0 rounded-full border-2 border-white/20"
                                                transition={{ duration: 0.3 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="flex justify-between items-center w-full">
                            <button
                                onClick={handlePrevQ}
                                disabled={currentQ === 0}
                                className="px-6 py-2 bg-surface border border-border rounded-lg disabled:opacity-50 hover:bg-white/5"
                            >
                                Previous
                            </button>
                            <div className="flex gap-2">
                                <span className="text-sm text-text-muted self-center">
                                    {step === 'exam' ? `${Object.keys(answers).length} Attempted` : 'Review Mode'}
                                </span>
                            </div>
                            {currentQ < questions.length - 1 ? (
                                <button
                                    onClick={handleNextQ}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Next
                                </button>
                            ) : (
                                step === 'exam' ? (
                                    <button
                                        onClick={() => handleSubmitExam(false)}
                                        className="px-8 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 animate-pulse"
                                    >
                                        Submit Exam
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setStep('result')}
                                        className="px-8 py-2 bg-surface border border-border rounded-lg hover:bg-white/5"
                                    >
                                        Back to Result
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* AI Side Panel */}
                    <AnimatePresence>
                        {aiModalOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setAiModalOpen(false)}
                                    className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed top-2 bottom-2 right-2 md:top-4 md:bottom-4 md:right-4 w-[calc(100%-1rem)] md:w-[480px] z-[200] bg-surface border border-white/10 shadow-2xl flex flex-col rounded-3xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                            <Brain size={20} /> AI Tutor
                                        </h3>
                                        <button
                                            onClick={() => setAiModalOpen(false)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {(Array.isArray(aiChatHistory) ? aiChatHistory : []).map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-white rounded-tr-none'
                                                    : 'bg-surface border border-border text-text-muted rounded-tl-none'
                                                    }`}>
                                                    {msg.role === 'ai' && (
                                                        <div className="flex items-center gap-2 text-xs font-bold mb-2 opacity-70">
                                                            <Brain size={12} /> AI Tutor
                                                        </div>
                                                    )}
                                                    <div className="prose prose-invert max-w-none break-words">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                code: ({ node, className, children, ...props }: any) => (
                                                                    <code className={`${className} bg-black/30 rounded px-1 font-mono`} {...props}>{children}</code>
                                                                )
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isAiThinking && (
                                            <div className="flex justify-start">
                                                <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-text-muted text-sm">
                                                    <Loader2 size={14} className="animate-spin" /> Thinking...
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-white/10 bg-surface">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={aiInput}
                                                onChange={(e) => setAiInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                                                placeholder="Ask a follow-up question..."
                                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary/50"
                                            />
                                            <button
                                                onClick={handleSendAiMessage}
                                                disabled={!aiInput.trim() || isAiThinking}
                                                className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div >
            </div >
        );
    }

    if (step === 'history') {
        return <MockHistoryView user={user} onBack={() => {
            sessionStorage.removeItem('active_test_session');
            setStep('config');
        }} onResume={handleResume} />;
    }

    // This fallback is only reached if state-consistency is lost or in transition
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-text-muted animate-pulse">Synchronizing Session...</p>
        </div>
    );
};

const MockHistoryView = ({ user, onBack, onResume }: { user: any, onBack: () => void, onResume: (attempt: any, mode?: 'resume' | 'review') => void }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loadingH, setLoadingH] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                // Read from Local Storage (Primary Source for Detailed Review)
                const localData = JSON.parse(localStorage.getItem('exam_compass_local_history') || '[]');

                // Sort client-side
                localData.sort((a: any, b: any) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());

                setHistory(localData);
            } catch (e) {
                console.error("History fetch error:", e);
            } finally {
                setLoadingH(false);
            }
        };
        fetchHistory();
    }, [user]);

    return (
        <div className="w-full space-y-6 animate-fade-in-up">
            <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
                <ArrowLeft size={18} /> Back to Menu
            </button>
            <h2 className="text-2xl font-bold text-text-main">Attempt History</h2>

            {loadingH ? (
                <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></div>
            ) : history.length === 0 ? (
                <div className="p-8 text-center text-text-muted bg-surface rounded-xl border border-border">
                    No attempts yet. Start a mock test!
                </div>
            ) : (
                <div className="space-y-4">
                    {(Array.isArray(history) ? history : []).map((attempt) => (
                        <div key={attempt.id} className="p-4 bg-surface rounded-xl border border-border flex flex-col md:flex-row md:justify-between md:items-center gap-4 group hover:border-primary/30 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-text-main capitalize text-lg">{attempt.type} Test</h4>
                                    {attempt.user_class && user.userClass !== attempt.user_class && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded border border-primary/20">
                                            {attempt.user_class}
                                        </span>
                                    )}
                                    {attempt.status === 'paused' && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold uppercase rounded border border-yellow-500/30">Paused</span>
                                    )}
                                </div>
                                <p className="text-sm text-text-muted">{attempt.created_at ? new Date(attempt.created_at).toLocaleString() : attempt.date ? new Date(attempt.date).toLocaleString() : 'Date unavailable'}</p>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                                {attempt.status === 'paused' ? (
                                    <button
                                        onClick={() => onResume(attempt, 'resume')}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-sm w-full md:w-auto justify-center"
                                    >
                                        <PlayCircle size={16} /> Resume
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-primary leading-none">{attempt.score} <span className="text-xs text-text-muted font-normal">/ {(attempt.totalQuestions || 1) * 4}</span></div>
                                            <p className="text-xs text-text-muted">{attempt.percentage}% Score</p>
                                        </div>
                                        {attempt.details && (
                                            <button
                                                onClick={() => onResume(attempt, 'review')}
                                                className="px-6 py-2.5 bg-surface border border-border hover:bg-white/5 text-text-main rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Brain size={16} /> Review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
