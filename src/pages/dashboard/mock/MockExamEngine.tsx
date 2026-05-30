import React, { useState } from 'react';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { useDebounce } from '../../../hooks/useDebounce';
import { Brain, PauseCircle, Timer, AlertTriangle, Coffee, ArrowLeft, TrendingUp, Loader2, X, Send, Volume2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ttsManager } from '../../../lib/tts/TTSManager';
import { preprocessQuestionText, preprocessOption, stripLatex } from '../../../lib/preprocessLatex';
import { EloService } from '../../../services/eloService';

export type MockEngineQuestion = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: any;
    explanation: string;
    topic: string;
    subject: string;
    difficulty_score: number;
    imageUrl?: string;
    type?: string;
};

export type MockMessage = {
    role: 'user' | 'ai';
    content: string;
};

export interface MockExamEngineProps {
    state: {
        questions: MockEngineQuestion[];
        answers: Record<number, any>;
        currentQ: number;
        step: 'exam' | 'review';
        fatigueNotice: { fatigued: boolean; reason?: string };
        isTimedExam: boolean;
        timeRemaining: number;
        currentAbility: number;
        aiModalOpen: boolean;
        isVerifying: boolean;
        aiExplanation: string;
        isSpeaking: boolean;
        aiChatHistory: MockMessage[];
        aiInput: string;
        isAiThinking: boolean;
        mode: string;
    };
    actions: {
        setFatigueNotice: (n: any) => void;
        handlePause: () => void;
        handleSubmitExam: (force: boolean) => void;
        setStep: (s: any) => void;
        handleAnswer: (val: any) => void;
        handleAskAI: (q: MockEngineQuestion) => void;
        setIsSpeaking: (s: boolean) => void;
        setCurrentQ: (idx: number) => void;
        handlePrevQ: () => void;
        handleNextQ: () => void;
        setAiModalOpen: (o: boolean) => void;
        setAiInput: (s: string) => void;
        handleSendAiMessage: () => void;
    };
}

// ─── Markdown/LaTeX renderer shared config ───────────────────────────────────
const katexOptions = {
    strict: 'ignore' as const,   // suppress non-standard LaTeX warnings
    throwOnError: false,          // show errors as text, never throw
    errorColor: '#888',           // muted colour so errors are not alarming
    trust: true,                  // allow \href etc.
};
const mdPlugins = {
    remark: [remarkGfm, remarkMath],
    rehype: [[rehypeKatex, katexOptions]]
};

/**
 * MathText — renders a string through ReactMarkdown + KaTeX.
 * Replaces the bare <p> that ReactMarkdown adds with an inline <span>.
 */
const MathText: React.FC<{ children: string; className?: string }> = ({ children, className }) => (
    <span className={className}>
        <MathErrorBoundary rawText={children}>
            <ReactMarkdown
                remarkPlugins={mdPlugins.remark as any}
                rehypePlugins={mdPlugins.rehype as any}
                components={{ p: ({ node: _n, ...p }) => <span {...p} /> }}
            >
                {children}
            </ReactMarkdown>
        </MathErrorBoundary>
    </span>
);

/**
 * MathErrorBoundary — catches any remaining KaTeX / ReactMarkdown render errors
 * and falls back to a sanitised plain-text representation.
 */
class MathErrorBoundary extends React.Component<
    { children: React.ReactNode; rawText: string },
    { hasError: boolean }
> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidUpdate(prevProps: { rawText: string }) {
        // Reset when the content changes so the new question can try again
        if (prevProps.rawText !== this.props.rawText && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <span className="text-text-main" title="Math rendering fallback">
                    {stripLatex(this.props.rawText)}
                </span>
            );
        }
        return this.props.children;
    }
}

// ─── Strip leading "A. / B) / C: " prefixes LLMs sometimes add ─────────────
const stripOptionPrefix = (opt: string) => opt.replace(/^[A-Da-d][.):\s]\s*/u, '').trim();

// ─── Detect integer / numerical question types ────────────────────────────────
const isIntegerType = (q: MockEngineQuestion) =>
    q.type === 'Integer' ||
    q.type === 'Numerical' ||
    (!q.options || q.options.length === 0);

// ─── Multi-Correct answer comparison ─────────────────────────────────────────
const arraysMatch = (a: any, b: any): boolean => {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
    }
    return a === b;
};

// ─── Integer Answer Input component ──────────────────────────────────────────
const IntegerInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
    correctAnswer: any;
    step: string;
}> = ({ value, onChange, disabled, correctAnswer, step }) => {
    const isCorrect = step === 'review' && String(value).trim() === String(correctAnswer).trim();
    const isWrong = step === 'review' && value !== '' && !isCorrect;
    return (
        <div className="mt-4">
            <label className="block text-sm text-text-muted mb-2 font-semibold">Enter your numerical answer:</label>
            <div className="flex flex-col gap-3">
                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder="Type your answer here…"
                    className={`w-full max-w-xs px-4 py-3 rounded-xl border text-text-main bg-surface text-lg font-mono transition-colors focus:outline-none focus:border-primary/70
                        ${isCorrect ? 'border-green-500 bg-green-500/10 text-green-400' : ''}
                        ${isWrong   ? 'border-red-500 bg-red-500/10 text-red-400' : ''}
                        ${!isCorrect && !isWrong ? 'border-border hover:border-primary/40' : ''}
                    `}
                />
                {step === 'review' && (
                    <div className={`text-sm font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? '✅ Correct!' : `❌ Correct answer: ${correctAnswer}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export const MockExamEngine: React.FC<MockExamEngineProps> = ({ state, actions }) => {
    const {
        questions, currentQ, answers, step, fatigueNotice, isTimedExam,
        timeRemaining, currentAbility, mode, aiModalOpen, isVerifying,
        aiExplanation, isSpeaking, aiChatHistory, aiInput, isAiThinking
    } = state;
    const {
        setFatigueNotice, handlePause, handleSubmitExam, setStep,
        handleAnswer, handleAskAI, setIsSpeaking, setCurrentQ,
        handlePrevQ, handleNextQ, setAiModalOpen, setAiInput, handleSendAiMessage
    } = actions;

    // Local state for integer-type answers (to support typing before submitting)
    const [integerDraft, setIntegerDraft] = useState<Record<number, string>>({});

    const q = questions[currentQ];
    const examTrapRef = useFocusTrap(true);
    const debouncedSendAiMessage = useDebounce(handleSendAiMessage, 500);

    if (!q) return (
        <div className="flex items-center justify-center min-h-screen text-text-muted">
            <div className="text-center space-y-4">
                <p className="text-lg">Error loading question.</p>
                <button type="button"
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    const isMultiCorrect = q.type === 'Multi-Correct';
    const isInteger = isIntegerType(q);

    // ── answer helpers ────────────────────────────────────────────────────────
    const handleMCQAnswer = (idx: number) => {
        if (step !== 'exam') return;
        if (isMultiCorrect) {
            const current: number[] = Array.isArray(answers[currentQ]) ? answers[currentQ] : [];
            const next = current.includes(idx)
                ? current.filter(a => a !== idx)
                : [...current, idx].sort((a, b) => a - b);
            handleAnswer(next);
        } else {
            handleAnswer(idx);
        }
    };

    const handleIntegerChange = (val: string) => {
        setIntegerDraft(d => ({ ...d, [currentQ]: val }));
        handleAnswer(val); // sync to parent immediately
    };

    const integerValue = integerDraft[currentQ] !== undefined
        ? integerDraft[currentQ]
        : (answers[currentQ] !== undefined ? String(answers[currentQ]) : '');

    // ── option styling ─────────────────────────────────────────────────────────
    const getOptionClass = (idx: number): string => {
        const isSelected = isMultiCorrect
            ? (Array.isArray(answers[currentQ]) ? answers[currentQ] : []).includes(idx)
            : answers[currentQ] === idx;
        const isCorrect = isMultiCorrect
            ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : []).includes(idx)
            : q.correctAnswer === idx;

        if (step === 'exam') {
            return isSelected
                ? 'bg-primary/20 border-primary text-primary shadow-inner'
                : 'bg-surface border-border text-text-muted hover:bg-white/5 hover:border-primary/30';
        }
        // Review mode
        if (isCorrect) return 'bg-green-500/20 border-green-500 text-green-400 font-bold';
        if (isSelected) return 'bg-red-500/20 border-red-500 text-red-400 line-through opacity-70';
        return 'bg-surface border-border text-text-muted opacity-40';
    };

    // ── review: show explanation? ────────────────────────────────────────────
    const showExplanation = step === 'review' && !arraysMatch(answers[currentQ], q.correctAnswer);

    return (
        <div ref={examTrapRef} tabIndex={-1} className="fixed inset-0 z-[100] bg-background overflow-y-auto" style={{ outline: 'none' }}>
            <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8 animate-fade-in-up">

                {/* ── Fatigue Notice ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {fatigueNotice.fatigued && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-4 text-yellow-500 relative">
                                <div className="size-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <Coffee size={20} />
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle size={14} /> Low Mental Battery Detected
                                    </h5>
                                    <p className="text-xs opacity-80 mt-1">{fatigueNotice.reason}</p>
                                </div>
                                <button type="button"
                                    onClick={() => setFatigueNotice({ fatigued: false })}
                                    className="text-xs font-bold px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Header ──────────────────────────────────────────────────── */}
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

                        {mode !== 'diagnostic' && (
                            <div className="hidden md:flex flex-col items-end px-4 border-l border-border">
                                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Ability Est.</span>
                                <div className="flex items-center gap-1.5 text-secondary font-bold text-sm">
                                    <TrendingUp size={14} />
                                    {EloService.calculatePercentile(currentAbility)}th %ile
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {step === 'exam' ? (
                                <>
                                    <button type="button"
                                        onClick={handlePause}
                                        className="p-2 rounded-lg bg-surface border border-border hover:bg-white/5 text-text-muted hover:text-text-main transition-colors"
                                        title="Pause"
                                    >
                                        <PauseCircle size={18} />
                                    </button>
                                    <button type="button"
                                        onClick={() => handleSubmitExam(false)}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                                    >
                                        End
                                    </button>
                                </>
                            ) : (
                                <button type="button"
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

                {/* ── Question Card ─────────────────────────────────────────── */}
                <div className="glass-card p-8 min-h-[400px]">
                    <div className="flex justify-between mb-4">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {q.topic || 'General'}
                        </span>
                        {(isInteger || isMultiCorrect) && (
                            <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full">
                                {isInteger ? '🔢 Integer Type' : '✅ Multi-Correct'}
                            </span>
                        )}
                    </div>

                    {/* Question Image */}
                    {q.imageUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-border bg-black/50 flex justify-center">
                            <img
                                src={q.imageUrl}
                                alt="Diagram"
                                className="max-h-[300px] w-auto object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* Question Text — preprocessed then KaTeX-rendered with error boundary */}
                    <div className="text-xl font-medium text-text-main mb-8 leading-relaxed prose prose-invert max-w-none">
                        <MathErrorBoundary rawText={q.text}>
                            <ReactMarkdown
                                remarkPlugins={mdPlugins.remark as any}
                                rehypePlugins={mdPlugins.rehype as any}
                            >
                                {preprocessQuestionText(q.text)}
                            </ReactMarkdown>
                        </MathErrorBoundary>
                    </div>

                    {/* ── Options / Input ──────────────────────────────────── */}
                    {isInteger ? (
                        /* Integer / Numerical — show text input */
                        <IntegerInput
                            value={integerValue}
                            onChange={handleIntegerChange}
                            disabled={step === 'review'}
                            correctAnswer={q.correctAnswer}
                            step={step}
                        />
                    ) : (
                        /* MCQ / Multi-Correct — show option buttons */
                        <div className="space-y-3">
                            {isMultiCorrect && step === 'exam' && (
                                <p className="text-xs text-text-muted italic mb-1">
                                    Select all that apply. You may select multiple options.
                                </p>
                            )}
                            {(q.options || []).map((opt, idx) => {
                                // Strip A./B./C. prefixes then preprocess LaTeX
                                const sanitized = preprocessOption(stripOptionPrefix(opt));
                                const isSelected = isMultiCorrect
                                    ? (Array.isArray(answers[currentQ]) ? answers[currentQ] : []).includes(idx)
                                    : answers[currentQ] === idx;

                                return (
                                    <button type="button"
                                        key={idx}
                                        onClick={() => handleMCQAnswer(idx)}
                                        disabled={step === 'review'}
                                        className={`w-full p-4 text-left rounded-xl border transition-all flex items-start gap-3 ${getOptionClass(idx)}`}
                                    >
                                        <span className="font-bold opacity-50 mt-0.5 shrink-0 text-sm">
                                            {isMultiCorrect
                                                ? (isSelected ? '☑' : '☐')
                                                : String.fromCharCode(65 + idx) + '.'}
                                        </span>
                                        <div className="flex-1 prose prose-invert max-w-none text-sm leading-relaxed">
                                            <MathText>{sanitized}</MathText>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Explanation panel (review mode) ─────────────────── */}
                    {showExplanation && (
                        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in-up">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Brain size={18} /> Explanation
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button"
                                        onClick={async () => {
                                            if (isSpeaking) {
                                                ttsManager.stop();
                                                window.speechSynthesis.cancel();
                                                setIsSpeaking(false);
                                                return;
                                            }
                                            setIsSpeaking(true);
                                            ttsManager.stop();
                                            setTimeout(() => {
                                                ttsManager.speak(q.explanation)
                                                    .then(() => setIsSpeaking(false))
                                                    .catch(() => {
                                                        const utterance = new SpeechSynthesisUtterance(q.explanation);
                                                        utterance.onend = () => setIsSpeaking(false);
                                                        window.speechSynthesis.speak(utterance);
                                                    });
                                            }, 100);
                                        }}
                                        className={`text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                                            isSpeaking
                                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                                                : 'bg-[#81ecff]/10 hover:bg-[#81ecff]/20 text-[#81ecff] border border-[#81ecff]/20'
                                        }`}
                                    >
                                        <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                                        {isSpeaking ? 'Stop' : 'Listen'}
                                    </button>
                                    <button type="button"
                                        onClick={() => handleAskAI(q)}
                                        className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Brain size={14} /> Ask AI
                                    </button>
                                </div>
                            </div>
                            <div className="text-text-muted text-sm leading-relaxed prose prose-invert max-w-none">
                                <MathErrorBoundary rawText={q.explanation}>
                                    <ReactMarkdown
                                        remarkPlugins={mdPlugins.remark as any}
                                        rehypePlugins={mdPlugins.rehype as any}
                                    >
                                        {preprocessQuestionText(q.explanation)}
                                    </ReactMarkdown>
                                </MathErrorBoundary>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Question Navigation Bubbles ───────────────────────────── */}
                <div className="flex flex-col gap-4 bg-surface p-4 rounded-xl border border-border">
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
                                    className={`shrink-0 w-10 h-10 snap-center rounded-full border flex items-center justify-center font-bold text-sm relative transition-colors duration-200 ${
                                        currentQ === idx
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
                        <button type="button"
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
                            <button type="button"
                                onClick={handleNextQ}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                Next
                            </button>
                        ) : (
                            step === 'exam' ? (
                                <button type="button"
                                    onClick={() => handleSubmitExam(false)}
                                    className="px-8 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 animate-pulse"
                                >
                                    Submit Exam
                                </button>
                            ) : (
                                <button type="button"
                                    onClick={() => setStep('result')}
                                    className="px-8 py-2 bg-surface border border-border rounded-lg hover:bg-white/5"
                                >
                                    Back to Result
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* ── AI Side Panel ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {aiModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setAiModalOpen(false)}
                                className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed top-2 bottom-2 right-2 md:top-4 md:bottom-4 md:right-4 w-[calc(100%-1rem)] md:w-[480px] z-[120] bg-surface border border-white/10 shadow-2xl flex flex-col rounded-3xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <Brain size={20} className={isVerifying ? 'animate-pulse text-secondary' : ''} />
                                        {isVerifying ? 'Exa Verification' : 'AI Tutor'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isVerifying && <Loader2 size={18} className="animate-spin text-secondary" />}
                                        <button type="button"
                                            onClick={() => setAiModalOpen(false)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className={`text-text-muted mb-6 text-sm leading-relaxed ${isVerifying ? 'opacity-50 grayscale transition-all' : 'opacity-100 transition-all'}`}>
                                        <div className="prose prose-invert max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={mdPlugins.remark as any}
                                                rehypePlugins={mdPlugins.rehype as any}
                                            >
                                                {aiExplanation}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {(Array.isArray(aiChatHistory) ? aiChatHistory : []).map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                msg.role === 'user'
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
                                                        remarkPlugins={mdPlugins.remark as any}
                                                        rehypePlugins={mdPlugins.rehype as any}
                                                        components={{
                                                            code: ({ node: _node, className, children, ...props }: any) => (
                                                                <code className={`${className} bg-black/30 rounded px-1 font-mono`} {...props}>
                                                                    {children}
                                                                </code>
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
                                                <Loader2 size={14} className="animate-spin" /> Thinking…
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/10 bg-surface">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && debouncedSendAiMessage()}
                                            placeholder="Ask a follow-up question…"
                                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary/50"
                                        />
                                        <button type="button"
                                            onClick={debouncedSendAiMessage}
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
            </div>
        </div>
    );
};
