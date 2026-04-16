import React from 'react';
import { Brain, PauseCircle, Timer, AlertTriangle, Coffee, ArrowLeft, TrendingUp, PlayCircle, Loader2, X, Send, Volume2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ttsManager } from '../../../lib/tts/TTSManager';
import { EloService } from '../../../services/eloService';

export type MockEngineQuestion = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    topic: string;
    imageUrl?: string;
};

export type MockMessage = {
    role: 'user' | 'ai';
    content: string;
};

export interface MockExamEngineProps {
    state: {
        questions: MockEngineQuestion[];
        answers: Record<number, number>;
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
        handleAnswer: (idx: number) => void;
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

export const MockExamEngine: React.FC<MockExamEngineProps> = ({ state, actions }) => {
    const { questions, currentQ, answers, step, fatigueNotice, isTimedExam, timeRemaining, currentAbility, mode, aiModalOpen, isVerifying, aiExplanation, isSpeaking, aiChatHistory, aiInput, isAiThinking } = state;
    const { setFatigueNotice, handlePause, handleSubmitExam, setStep, handleAnswer, handleAskAI, setIsSpeaking, setCurrentQ, handlePrevQ, handleNextQ, setAiModalOpen, setAiInput, handleSendAiMessage } = actions;

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
                                    <TrendingUp size={14} />
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
                                <div className="flex items-center gap-2">
                                    <button
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
                                        <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} /> {isSpeaking ? 'Stop' : 'Listen'}
                                    </button>
                                    <button
                                        onClick={() => handleAskAI(q)}
                                        className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Brain size={14} /> Ask AI
                                    </button>
                                </div>
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
                                        <Brain size={20} className={isVerifying ? "animate-pulse text-secondary" : ""} /> {isVerifying ? "Exa Verification" : "AI Tutor"}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {isVerifying && <Loader2 size={18} className="animate-spin text-secondary" />}
                                        <button
                                            onClick={() => setAiModalOpen(false)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    <div className={`whitespace-pre-wrap text-text-muted mb-6 text-sm leading-relaxed ${isVerifying ? 'opacity-50 grayscale transition-all' : 'opacity-100 transition-all'}`}>
                                        <div className="prose prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {aiExplanation}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

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
};

const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);
