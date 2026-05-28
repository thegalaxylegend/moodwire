import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Timer } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { askAI } from '../../lib/ai';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '../../store/userStore';
import { SYLLABUS_DB } from '../../lib/constants';
import { markTopicsAsCompletedFromResults } from '../../services/dataSyncService';
import { batchUpdateTopicStrength } from '../../services/topicStrengthService';
import { trackQuestionTime, trackOptionSwitch } from '../../lib/analytics';
import { storageService } from '../../services/storageService';
import { FatigueService } from '../../services/fatigueService';
import type { SessionMetric } from '../../services/fatigueService';
import { EloService, DEFAULT_CALIBRATION } from '../../services/eloService';
import { SpacedRepetitionService } from '../../services/spacedRepetitionService';
import { MistakeNotebookService } from '../../services/mistakeNotebookService';

// Extract components
import { MockLoading } from './mock/MockLoading';
import { MockPreview } from './mock/MockPreview';
import { MockResults } from './mock/MockResults';
import { MockExamEngine } from './mock/MockExamEngine';
import { MockHistory } from './mock/MockHistory';
import { mockPrefetchService } from '../../services/mockPrefetchService';

type Question = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: any;
    explanation: string;
    topic: string;
    subject: string;
    difficulty_score: number;
    imageUrl?: string;
    concept_tags?: string[];
    type?: string;
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
    const isTestingUntimed = false;

    const [mode, setMode] = useState<'quick' | 'topic' | 'full' | 'diagnostic' | 'remediation' | 'learned'>('quick');
    const [difficulty, setDifficulty] = useState<'Exam_Level' | 'Slightly_Harder' | 'Mains' | 'Advanced'>('Exam_Level');
    const [step, setStep] = useState<'config' | 'loading' | 'preview' | 'exam' | 'result' | 'history' | 'review'>('config');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiExplanation, setAiExplanation] = useState("");
    const [aiChatHistory, setAiChatHistory] = useState<Message[]>([]);
    const [aiInput, setAiInput] = useState("");
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [qStartTime, setQStartTime] = useState(Date.now());
    const [generationProgress, setGenerationProgress] = useState(0);
    const [hints, setHints] = useState<Record<number, number>>({});
    const [firstActionTimes, setFirstActionTimes] = useState<Record<number, number>>({});
    const [switchCounts, setSwitchCounts] = useState<Record<number, number>>({});

    const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'warning' | 'info' }>({ 
        open: false, title: "", message: "", type: 'info' 
    });

    const [showComfortModal, setShowComfortModal] = useState(false);
    const [comfortModalData, setComfortModalData] = useState<{ topic: string; subject: string } | null>(null);

    const [sessionHistory, setSessionHistory] = useState<SessionMetric[]>([]);
    const [fatigueNotice, setFatigueNotice] = useState<{ fatigued: boolean; reason?: string }>({ fatigued: false });

    const [currentAbility, setCurrentAbility] = useState<number>(user?.abilityScore || 1000);
    const isTimedExam = false;

    const globalFetchedRef = useRef(0);


    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const cached = sessionStorage.getItem('active_test_session');
        if (cached) {
            try {
                const data = JSON.parse(cached);
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
                    if (data.step === 'loading') {
                        sessionStorage.removeItem('active_test_session');
                        navigate('/dashboard/test-center', { replace: true });
                    }
                } else {
                    sessionStorage.removeItem('active_test_session');
                }
            } catch (e) {
                sessionStorage.removeItem('active_test_session');
            }
        }
    }, [user?.id, isTestingUntimed]);

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
            if (step === 'result') sessionStorage.removeItem('active_test_session');
        }
    }, [questions, answers, currentQ, step, mode, difficulty, timeRemaining, user?.id]);

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        const historyParam = searchParams.get('history');
        if (!urlTopic && !modeParam && historyParam !== 'true') {
            navigate('/dashboard/test-center', { replace: true });
        }
    }, [urlTopic, searchParams, navigate]);

    useEffect(() => {
        const clearBrokenCaches = () => {
             for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('ai_cache_') || key.startsWith('q_engine_cache_'))) {
                    localStorage.removeItem(key);
                }
            }
        };
        if (user && authResolved && step === 'config' && questions.length === 0) {
            clearBrokenCaches();
            checkPrerequisites();
        }
    }, [user, authResolved, urlTopic, searchParams, step, questions.length]);

    const checkPrerequisites = async () => {
        if (!user || step !== 'config' || questions.length > 0) return;
        const modeParam = searchParams.get('mode');
        if (modeParam === 'diagnostic') {
            setMode('diagnostic');
            generateExam('diagnostic');
            return;
        } else if (modeParam === 'remediation') {
            setMode('topic'); // Treat as a specialized topic test
            const focus = searchParams.get('focus') as any;
            generateExam('remediation', undefined, focus);
            return;
        }
        const localHistoryRaw = localStorage.getItem('exam_compass_local_history');
        const hasLocalHistory = localHistoryRaw ? (JSON.parse(localHistoryRaw) || []).length > 0 : false;
        const isEstablishedUser = user.xp > 0 || hasLocalHistory;

        if (!isEstablishedUser) {
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
                    navigate('/dashboard/test-center', { replace: true });
                    return;
                }
            } catch (err) {
                navigate('/dashboard/test-center', { replace: true });
                return;
            }
        }
        if (urlTopic) {
            setMode('topic');
            generateExam('topic', urlTopic);
        } else {
            const diffParam = searchParams.get('difficulty');
            const historyParam = searchParams.get('history');
            if (historyParam === 'true') {
                setStep('history');
            } else if (modeParam) {
                const standardizedMode = 
                    modeParam === 'Quick_Test' ? 'quick' : 
                    modeParam === 'Full_Mock' ? 'full' : 
                    (modeParam === 'learned' || modeParam === 'Learned_Chapters') ? 'learned' : 'quick';
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
            handleSubmitExam(true);
        }
    }, [step, timeRemaining, isTimedExam]);

    const handleExit = () => {
        if (questions.length > 0 && step === 'exam') {
            if (!window.confirm("Are you sure you want to exit? Your progress will be saved in history.")) return;
        }
        sessionStorage.removeItem('active_test_session');
        navigate('/dashboard/test-center');
    };

    const saveProgress = async (status: 'paused' | 'completed') => {
        if (!user) return;
        const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
        let currentScore = 0;
        if (status === 'completed') {
            (Array.isArray(questions) ? questions : []).forEach((q, idx) => {
                const ans = answers[idx];
                const isInteger = (q as any).type === 'Integer' || (q as any).type === 'Numerical';
                let isCorrect = false;
                if (Array.isArray(ans) && Array.isArray((q as any).correctAnswer)) {
                    isCorrect = ans.length === (q as any).correctAnswer.length && [...ans].sort().every((v, i) => v === [...(q as any).correctAnswer].sort()[i]);
                } else if (isInteger) {
                    isCorrect = String(ans).trim() === String((q as any).correctAnswer).trim();
                } else {
                    isCorrect = ans === (q as any).correctAnswer;
                }
                if (isCorrect) {
                    currentScore += 4;
                } else if (ans !== undefined) {
                    currentScore -= isJunior ? 0 : 1;
                }
            });
            setScore(currentScore);
        }
        try {
            const correctCount = questions.filter((q, i) => {
                const ans = answers[i];
                const isInteger = (q as any).type === 'Integer' || (q as any).type === 'Numerical';
                if (Array.isArray(ans) && Array.isArray(q.correctAnswer)) {
                    return ans.length === (q.correctAnswer as any).length && [...ans].sort().every((v: any, j: number) => v === [...(q.correctAnswer as any)].sort()[j]);
                } else if (isInteger) {
                    return String(ans).trim() === String(q.correctAnswer).trim();
                }
                return ans === q.correctAnswer;
            }).length;
            const attemptedCount = Object.keys(answers).length;
            const mockAttemptData = {
                user_id: user.id,
                exam_name: user?.targetExam || 'General',
                type: mode,
                topic_focus: mode === 'topic' ? urlTopic : null,
                score: status === 'completed' ? currentScore : 0,
                total_questions: questions.length,
                status: status,
                current_ability: currentAbility,
                created_at: serverTimestamp(),
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
            let syncError = false;
            try {
                await addDoc(collection(db, 'mock_attempts'), mockAttemptData);
            } catch (err) {
                syncError = true;
            }
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
                wrongCount: attemptedCount - correctCount,
                totalQuestions: questions.length,
                pendingSync: syncError,
                topic: mode === 'topic' ? (urlTopic || 'Topic') : (mode === 'quick' ? 'Quick Test' : (mode === 'learned' ? 'Learned Chapters' : 'Full Mock')),
                user_class: user.userClass || 'General',
                weakTopics: questions.filter((q, i) => {
                    const ans = answers[i];
                    if (ans === undefined) return false;
                    const isInteger = (q as any).type === 'Integer' || (q as any).type === 'Numerical';
                    if (Array.isArray(ans) && Array.isArray(q.correctAnswer)) {
                        return !(ans.length === (q.correctAnswer as any).length && [...ans].sort().every((v: any, j: number) => v === [...(q.correctAnswer as any)].sort()[j]));
                    } else if (isInteger) {
                        return String(ans).trim() !== String(q.correctAnswer).trim();
                    }
                    return ans !== q.correctAnswer;
                }).map(q => q.topic)
            }, user.id);

            if (status === 'completed') {
                const questionResults = questions.map((q, i) => {
                    const ans = answers[i];
                    const isInteger = (q as any).type === 'Integer' || (q as any).type === 'Numerical';
                    let isCorrect = false;
                    if (Array.isArray(ans) && Array.isArray(q.correctAnswer)) {
                        isCorrect = ans.length === (q.correctAnswer as any).length && [...ans].sort().every((v: any, j: number) => v === [...(q.correctAnswer as any)].sort()[j]);
                    } else if (isInteger) {
                        isCorrect = String(ans).trim() === String(q.correctAnswer).trim();
                    } else {
                        isCorrect = ans === q.correctAnswer;
                    }
                    return { topic: q.topic, isCorrect };
                });
                addGains({ xp: currentScore * 10, pts: currentScore }).catch(() => {});
                updateProfile({ 
                    lastTestDate: new Date().toISOString().split('T')[0],
                    abilityScore: currentAbility 
                }).catch(() => {});
                markTopicsAsCompletedFromResults(user.id, questionResults).catch(() => {});
                const topicStrengthResults = questions.map((q, i) => {
                    const ans = answers[i];
                    const isInteger = (q as any).type === 'Integer' || (q as any).type === 'Numerical';
                    let isCorrect = false;
                    if (Array.isArray(ans) && Array.isArray(q.correctAnswer)) {
                        isCorrect = ans.length === (q.correctAnswer as any).length && [...ans].sort().every((v: any, j: number) => v === [...(q.correctAnswer as any)].sort()[j]);
                    } else if (isInteger) {
                        isCorrect = String(ans).trim() === String(q.correctAnswer).trim();
                    } else {
                        isCorrect = ans === q.correctAnswer;
                    }
                    return { topic: q.topic || 'General', subject: q.subject || 'General', isCorrect };
                });
                batchUpdateTopicStrength(user.id, topicStrengthResults, user.userClass, user.targetExam).catch(() => {});
                const wrongQuestions = questions.map((q, i) => ({ question: q, index: i })).filter(({ index: i }) => answers[i] !== undefined && answers[i] !== questions[i].correctAnswer).map(({ question: q, index: i }) => {
                    const simpleHash = Array.from(q.text).reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0).toString(36);
                    return {
                        question_hash: `qh_${simpleHash}`,
                        question_text: q.text,
                        options: q.options,
                        correct_answer: q.options[q.correctAnswer] || String(q.correctAnswer),
                        explanation: q.explanation || '',
                        topic: q.topic || 'General',
                        topic_id: (q.topic || 'general').toLowerCase().replace(/[\s]+/g, '_'),
                        subject: q.topic || 'General',
                        difficulty: 'Medium' as const,
                        student_answer: q.options[answers[i]] || String(answers[i]),
                    };
                });
                if (wrongQuestions.length > 0) {
                    SpacedRepetitionService.createCardsFromTestResults(user.id, wrongQuestions, user.userClass, user.targetExam).catch(() => {});
                    MistakeNotebookService.recordTestMistakes(user.id, wrongQuestions, mode, user.userClass, user.targetExam).catch(() => {});
                }
            }
        } catch (e) { console.error(e); }
    };

    const handlePause = async () => {
        if (!window.confirm("Are you sure you want to pause?")) return;
        try {
            setLoadingMessage("Saving progress...");
            setStep('loading');
            await saveProgress('paused');
            setStep('config');
        } catch (e) { setStep('exam'); }
    };

    const handleResume = (attempt: any, mode: 'resume' | 'review' = 'resume') => {
        if (!attempt.details) return;
        setQuestions(attempt.details.questions);
        setAnswers(attempt.details.answers || {});
        setCurrentQ(attempt.current_q_index || 0);
        setTimeRemaining(attempt.time_left || 0);
        setMode(attempt.type);
        if (mode === 'review') { setStep('review'); setCurrentQ(0); } else { setStep('exam'); }
    };

    const generateExam = async (examMode: 'quick' | 'topic' | 'full' | 'diagnostic' | 'remediation' | 'learned', topic?: string, focus?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD') => {
        setStep('loading');
        setQuestions([]);
        setAnswers({});
        setCurrentQ(0);
        setGenerationProgress(0);
        globalFetchedRef.current = 0;
        setLoadingMessage("Analyzing Syllabus & Patterns...");

        try {
            const targetExam = user?.targetExam || 'General';
            const { getAdaptiveQuestionBatch, mapStoredToUIQuestion } = await import('../../services/questionEngine');

            let needs: Array<{ subject: string; topic: string; count: number; remediationFocus?: any }> = [];

            if (examMode === 'quick') {
                setTimeRemaining(30 * 60);

                const prefetched = mockPrefetchService.consumePrefetch(targetExam, currentAbility);
                if (prefetched && prefetched.length > 0) {
                    console.log("⚡ [MockGenerator] Instant Start: Using pre-fetched questions.");
                    setQuestions(mapStoredToUIQuestion(prefetched));
                    setStep('preview');
                    return;
                }

                const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
                const target = user?.targetExam?.toUpperCase() || '';
                const isNeet = target.includes('NEET');
                const isFoundation = target.includes('FOUNDATION');

                if (isJunior || isFoundation) {
                    needs = [
                        { subject: 'Mathematics', topic: 'Mathematics', count: 3 },
                        { subject: 'Science', topic: 'Science', count: 3 },
                        { subject: 'Social Science', topic: 'Social Science', count: 2 },
                        { subject: 'English', topic: 'English', count: 2 }
                    ];
                } else if (isNeet) {
                    needs = [
                        { subject: 'Biology', topic: 'Biology', count: 4 },
                        { subject: 'Physics', topic: 'Physics', count: 3 },
                        { subject: 'Chemistry', topic: 'Chemistry', count: 3 }
                    ];
                } else {
                    needs = [
                        { subject: 'Mathematics', topic: 'Mathematics', count: 4 },
                        { subject: 'Physics', topic: 'Physics', count: 3 },
                        { subject: 'Chemistry', topic: 'Chemistry', count: 3 }
                    ];
                }
            } else if (examMode === 'diagnostic') {
                setTimeRemaining(0);
                const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');
                const subject = isJunior ? "Math, Science, English" : "Physics, Chemistry, Mathematics";
                needs = [{ subject, topic: subject, count: 10 }];
            } else if (examMode === 'topic') {
                setTimeRemaining(45 * 60);
                needs = [{ subject: topic || 'General', topic: topic || 'General', count: 15 }];
            } else if (examMode === 'full') {
                 setAlertModal({
                    open: true,
                    title: "Under Maintenance",
                    message: "Full Mock simulations are currently undergoing system upgrades. Please use Quick Test instead.",
                    type: 'info'
                });
                return;
            } else if (examMode === 'remediation') {
                setTimeRemaining(30 * 60);
                setLoadingMessage("Calibrating Remediation Session...");
                const { getWeakTopics } = await import('../../services/topicStrengthService');
                const weakTopics = await getWeakTopics(user!.id, 2, user?.userClass, targetExam);
                
                if (weakTopics.length === 0) {
                    needs = [{ subject: 'General', topic: 'General', count: 5 }];
                } else {
                    needs = weakTopics.map(wt => ({
                        subject: wt.subject || wt.topic,
                        topic: wt.topic,
                        count: 4,
                        difficulty: 'Medium' as const,
                        remediationFocus: focus || 'CONCEPTUAL'
                    }));
                }
            } else if (examMode === 'learned') {
                setTimeRemaining(30 * 60);
                setLoadingMessage("Calibrating Test from Learned Chapters...");
                
                const { SubtopicProgressService } = await import('../../services/subtopicProgressService');
                const progress = SubtopicProgressService.getAllProgress(user!.id);
                
                // Chapters that have been started or mastered
                const learnedChapters = Object.values(progress).filter(
                    p => p.state === 'in_progress' || p.state === 'mastered'
                );

                if (learnedChapters.length === 0) {
                    setStep('config');
                    setAlertModal({
                        open: true,
                        title: "No Learned Chapters Yet",
                        message: "You haven't started or mastered any chapters. Study a chapter first in the Lectures timeline to take this test!",
                        type: 'info'
                    });
                    return;
                }

                // Map chapters back to SYLLABUS_DB to get topic name and subject
                const findTopicById = (topicId: string) => {
                    for (const subject in SYLLABUS_DB) {
                        const found = SYLLABUS_DB[subject].find(t => t.id === topicId);
                        if (found) return { topic: found.topic, subject };
                    }
                    return null;
                };

                const topicsToTest = learnedChapters
                    .map(lc => findTopicById(lc.topicId))
                    .filter((t): t is { topic: string; subject: string } => t !== null);

                if (topicsToTest.length === 0) {
                    setStep('config');
                    setAlertModal({
                        open: true,
                        title: "No Active Topics Found",
                        message: "We couldn't match your active chapters to the syllabus. Please start studying other chapters.",
                        type: 'warning'
                    });
                    return;
                }

                // Distribute question counts (e.g. 10 questions total)
                const totalQuestionsToGenerate = 10;
                const baseCount = Math.floor(totalQuestionsToGenerate / topicsToTest.length);
                let remainder = totalQuestionsToGenerate % topicsToTest.length;

                needs = topicsToTest.map((t) => {
                    const count = baseCount + (remainder > 0 ? 1 : 0);
                    if (remainder > 0) remainder--;
                    return {
                        subject: t.subject,
                        topic: t.topic,
                        count: count > 0 ? count : 1
                    };
                }).filter(n => n.count > 0);
            }

            setLoadingMessage("Fetching Hybrid Questions...");
            let rawQuestions = await getAdaptiveQuestionBatch(
                needs,
                targetExam,
                currentAbility,
                (p) => setGenerationProgress(p)
            );

            // Auto-retry once — AI generation may need a warm-up on first call
            if (!rawQuestions || rawQuestions.length === 0) {
                console.warn("[MockGenerator] First attempt returned 0 questions. Retrying AI generation...");
                setLoadingMessage("AI is generating questions… please wait.");
                setGenerationProgress(30);
                rawQuestions = await getAdaptiveQuestionBatch(
                    needs,
                    targetExam,
                    currentAbility,
                    (p) => setGenerationProgress(50 + Math.round(p / 2))
                );
            }

            if (!rawQuestions || rawQuestions.length === 0) {
                throw new Error("No questions were generated successfully.");
            }

            const mappedQs = mapStoredToUIQuestion(rawQuestions);
            if (mappedQs.length === 0) {
                throw new Error("All generated questions were invalid (missing options or bad format).");
            }
            setQuestions(mappedQs);
            setStep('preview');

        } catch (e: any) {
            console.error(e);
            setStep('config');
            setAlertModal({
                open: true,
                title: "Question Generation Failed",
                message: "We couldn't generate questions right now. This can happen if the AI service is busy. Please try again in a moment.",
                type: 'warning'
            });
        }
    };

    const handleAnswer = (optionIdx: any) => {
        const q = questions[currentQ];
        if (q) {
            const prevAnswer = answers[currentQ];
            if (prevAnswer !== undefined && prevAnswer !== optionIdx) {
                trackOptionSwitch(q.id.toString(), prevAnswer.toString(), optionIdx.toString());
                setSwitchCounts(prev => ({ ...prev, [currentQ]: (prev[currentQ] || 0) + 1 }));
            }
            if (firstActionTimes[currentQ] === undefined) {
                setFirstActionTimes(prev => ({ ...prev, [currentQ]: Date.now() }));
            }
        }
        setAnswers(prev => ({ ...prev, [currentQ]: optionIdx }));
    };

    const handleNextQ = () => {
        const q = questions[currentQ];
        if (q) {
            const duration = Math.floor((Date.now() - qStartTime) / 1000);
            trackQuestionTime(q.id.toString(), duration, q.topic || 'General');
            const isCorrect = answers[currentQ] === q.correctAnswer;
            const newMetric: SessionMetric = {
                questionIndex: currentQ,
                isCorrect: isCorrect,
                timeSpent: duration,
                timestamp: Date.now()
            };
            const newHistory = [...sessionHistory, newMetric];
            setSessionHistory(newHistory);
            
            const qRating = q.difficulty_score || 1000;
            const expectedTimeS = Math.max(60, Math.min(240, Math.round((qRating / 1000) * 60)));

            const hesitationS = firstActionTimes[currentQ] 
                ? Math.floor((firstActionTimes[currentQ] - qStartTime) / 1000) 
                : duration;

            const outcome = {
                isCorrect: isCorrect,
                solveTimeS: duration,
                hintsUsed: hints[currentQ] || 0,
                expectedTimeS: expectedTimeS,
                hesitationS: hesitationS,
                switchCount: switchCounts[currentQ] || 0,
                attemptId: q.id
            };

            const newAbility = EloService.calculateNewAbility(
                currentAbility, 
                qRating, 
                outcome
            );
            
            setCurrentAbility(newAbility);

            // Dynamic Mid-Test Cognitive Load Tracking & Comfort Shifts
            let consecutiveWrongs = 0;
            for (let i = newHistory.length - 1; i >= 0; i--) {
                if (!newHistory[i].isCorrect) {
                    consecutiveWrongs++;
                } else {
                    break;
                }
            }

            const cli = EloService.calculateCognitiveLoad({
                hesitationS,
                switchCount: switchCounts[currentQ] || 0,
                timeSpentS: duration,
                expectedTimeS,
                consecutiveWrongs
            });

            const branding = EloService.recommendDifficultyBanding(cli);
            if (branding.mix === 'Comfort') {
                console.log("[MockGenerator] Cognitive load > 0.68. Switching to comfort band to rebuild confidence.");
                const targetExam = user?.targetExam || 'General';
                const comfortNeeds = [
                    {
                        subject: q.subject || 'General',
                        topic: q.topic || 'General',
                        count: 2,
                        difficulty: 'Easy' as const
                    }
                ];

                import('../../services/questionEngine').then(({ getAdaptiveQuestionBatch, mapStoredToUIQuestion }) => {
                    getAdaptiveQuestionBatch(comfortNeeds, targetExam, newAbility - 150)
                        .then(rawQs => {
                            if (rawQs && rawQs.length > 0) {
                                const uiQs = mapStoredToUIQuestion(rawQs);
                                setQuestions(prev => {
                                    const nextQuestions = [...prev];
                                    nextQuestions.splice(currentQ + 1, 0, ...uiQs);
                                    return nextQuestions;
                                });
                            }
                        })
                        .catch(err => console.error("Failed to load comfort questions mid-test:", err));
                });

                setComfortModalData({
                    topic: q.topic || 'General',
                    subject: q.subject || 'General'
                });
                setShowComfortModal(true);
            }

            // Update granular calibration profile (fixed parameters order: subject first, topic second)
            if (user) {
                const updatedProfile = EloService.updateCalibration(
                    user.calibrationProfile || DEFAULT_CALIBRATION,
                    q.subject || 'General',
                    q.topic || 'General',
                    qRating,
                    outcome,
                    q.concept_tags
                );

                updateProfile({
                    abilityScore: newAbility,
                    calibrationProfile: updatedProfile
                }).catch(() => {});
            }

            if (newHistory.length % 3 === 0) {
                const result = FatigueService.detectFatigue(newHistory);
                if (result.fatigued) setFatigueNotice(result);
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
        setHints(prev => ({ ...prev, [currentQ]: (prev[currentQ] || 0) + 1 }));
        setAiModalOpen(true);
        setIsVerifying(true);
        setAiExplanation("Exa is re-solving this problem...");
        setAiChatHistory([{ role: 'ai', content: "Exa is re-solving this problem..." }]);
        const verificationPrompt = `Solve Blindly: ${q.text}\nOptions: ${q.options.join(', ')}\nReturn JSON: { "solved_index": number, "step_by_step": string, "is_official_wrong": boolean }`;
        try {
            const response = await askAI("Science Tutor", verificationPrompt, 'groq', [], { stream: false });
            const { extractJSON } = await import('../../lib/utils');
            const result = extractJSON(response);
            if (result && typeof result.solved_index === 'number') {
                const solvedIdx = result.solved_index;
                const userChoice = answers[currentQ];
                if (userChoice === solvedIdx && q.correctAnswer !== solvedIdx) {
                    setScore(prev => prev + 4);
                }
                const finalMsg = `Verified Correct Answer: **Option ${String.fromCharCode(65 + solvedIdx)}**\n\n${result.step_by_step}`;
                setAiExplanation(finalMsg);
                setAiChatHistory([{ role: 'ai', content: finalMsg }]);
            }
        } catch (err) {
            setAiExplanation(q.explanation);
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
            const q = questions[currentQ];
            const context = `Q: ${q.text}\nOptions: ${q.options.join(', ')}\nAns: ${q.options[q.correctAnswer]}\nExp: ${q.explanation}\nUser: ${userMsg}`;
            const response = await askAI('Helpful Tutor', context, 'groq', [], { stream: false });
            if (response) setAiChatHistory(prev => [...prev, { role: 'ai', content: response }]);
        } finally { setIsAiThinking(false); }
    };

    const handleSubmitExam = async (force: boolean = false) => {
        if (!force && !window.confirm("End exam?")) return;
        try {
            setLoadingMessage("Submitting...");
            setStep('loading');
            await saveProgress('completed');
            setStep('result');
        } catch (e) { setStep('exam'); }
    };

    if (!user) return <div>Login Required</div>;

    if (step === 'loading' || step === 'config') {
        return (
            <>
                <AnimatePresence>
                    {alertModal.open && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-surface border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl text-center space-y-6">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${alertModal.type === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}>
                                    {alertModal.type === 'warning' ? <AlertTriangle size={40} /> : <Timer size={40} />}
                                </div>
                                <h3 className="text-2xl font-bold">{alertModal.title}</h3>
                                <p className="text-sm text-text-muted">{alertModal.message}</p>
                                <button onClick={() => { setAlertModal(prev => ({ ...prev, open: false })); navigate('/dashboard/test-center'); }} className="w-full py-4 bg-primary text-white font-bold rounded-2xl">Got it</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <MockLoading progress={generationProgress} message={loadingMessage} step={step} onCancel={handleExit} />
            </>
        );
    }

    if (step === 'result') return (
        <MockResults 
            score={score} 
            questions={questions as any} 
            answers={answers} 
            mode={mode as any} 
            topicOrExam={urlTopic || (mode === 'quick' ? 'Quick Test' : (mode === 'learned' ? 'Learned Chapters' : 'Full Mock'))}
            userName={user.name || 'Student'}
            targetExam={user.targetExam || 'General'}
            onReview={() => setStep('review')}
            onDashboard={() => navigate('/dashboard')}
            onRetake={() => {
                setQuestions([]);
                setAnswers({});
                setCurrentQ(0);
                setStep('config');
            }}
        />
    );
    if (step === 'preview') return (
        <MockPreview 
            mode={mode as any} 
            questionsCount={questions.length}
            timeRemaining={timeRemaining}
            isTimedExam={isTimedExam}
            topicOrExam={urlTopic || (mode === 'quick' ? 'Quick Test' : (mode === 'learned' ? 'Learned Chapters' : 'Full Mock'))}
            onStart={() => setStep('exam')} 
            onCancel={handleExit} 
        />
    );
    if (step === 'history') return <MockHistory user={user} onResume={handleResume} onBack={() => setStep('config')} />;
    
    return (
        <>
            <AnimatePresence>
                {showComfortModal && comfortModalData && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
                            transition={{ type: 'spring', damping: 20 }}
                            className="relative overflow-hidden bg-[#0d0f1a] border border-[#81ecff]/25 p-8 rounded-[2.5rem] max-w-sm w-full shadow-[0_0_50px_rgba(129,236,255,0.15)] text-center space-y-6"
                        >
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(129,236,255,0.3)] animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#81ecff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            </div>

                            <div className="space-y-2">
                                <span className="inline-block px-3 py-1 bg-[#81ecff]/10 text-[#81ecff] text-[10px] font-extrabold tracking-wider uppercase rounded-full">
                                    Concept Rebuilding Shift
                                </span>
                                <h3 className="text-xl font-black text-text-main tracking-tight">Reinforcing Fundamentals</h3>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed">
                                We noticed some of the recent questions on <span className="text-[#81ecff] font-semibold">{comfortModalData.topic}</span> were quite challenging. 
                                <br/><br/>
                                To keep you in your flow state and strengthen your base, we are temporarily switching to <span className="text-[#81ecff] font-semibold">Concept Rebuilding questions</span>. Let's master the basics together! 🚀
                            </p>

                            <button 
                                onClick={() => setShowComfortModal(false)} 
                                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:brightness-110 active:scale-95 text-white font-extrabold rounded-2xl shadow-[0_0_20px_rgba(129,236,255,0.3)] transition-all uppercase tracking-wider text-xs"
                            >
                                Let's Do This!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <MockExamEngine
                state={{ questions: questions as any, answers, currentQ, step, fatigueNotice, isTimedExam, timeRemaining, currentAbility, aiModalOpen, isVerifying, aiExplanation, isSpeaking, aiChatHistory: aiChatHistory as any, aiInput, isAiThinking, mode }}
                actions={{ setFatigueNotice, handlePause, handleSubmitExam, setStep, handleAnswer, handleAskAI, setIsSpeaking, setCurrentQ, handlePrevQ, handleNextQ, setAiModalOpen, setAiInput, handleSendAiMessage }}
            />
        </>
    );
};
