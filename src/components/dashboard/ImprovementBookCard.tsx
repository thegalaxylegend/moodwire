import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, ArrowRight, Sparkles, CheckCircle2, XCircle, Brain, X } from 'lucide-react';
import { MistakeNotebookService, type MistakeEntry } from '../../services/mistakeNotebookService';
import { useScrollLock } from '../../hooks/useScrollLock';

interface ImprovementBookCardProps {
    userId: string;
    isGuest?: boolean;
    onStartTest?: () => void;
}

const SAMPLE_MISTAKES: MistakeEntry[] = [
    {
        id: 'sample_physics_1',
        user_id: 'sample',
        question_hash: 'qh_physics_1',
        question_text: 'A body of mass 2 kg is moving with a velocity of 10 m/s. If a constant force of 5 N is applied opposite to its motion, how long will it take to come to rest?',
        options: ['2 seconds', '4 seconds', '5 seconds', '8 seconds'],
        correct_answer: '4 seconds',
        explanation: "Using Newton's Second Law, the deceleration a = F / m = -5 / 2 = -2.5 m/s². Using the first equation of motion v = u + at: 0 = 10 - 2.5t => 2.5t = 10 => t = 4 seconds.",
        topic: 'Laws of Motion',
        topic_id: 'laws_of_motion',
        subject: 'Physics',
        difficulty: 'Medium',
        exam_mode: 'quick',
        student_answer: '2 seconds',
        retry_count: 0,
        last_retry_correct: false,
        is_mastered: false,
        first_wrong_date: new Date().toISOString(),
        last_attempt_date: new Date().toISOString()
    },
    {
        id: 'sample_chemistry_1',
        user_id: 'sample',
        question_hash: 'qh_chemistry_1',
        question_text: 'Which of the following molecules has a net dipole moment?',
        options: ['CO₂', 'BF₃', 'NF₃', 'CCl₄'],
        correct_answer: 'NF₃',
        explanation: 'NF₃ has a trigonal pyramidal shape with a lone pair on the nitrogen atom, which does not cancel out the N-F bond dipoles. In contrast, CO₂ (linear), BF₃ (trigonal planar), and CCl₄ (tetrahedral) are highly symmetric and have zero net dipole moment.',
        topic: 'Chemical Bonding',
        topic_id: 'chemical_bonding',
        subject: 'Chemistry',
        difficulty: 'Medium',
        exam_mode: 'quick',
        student_answer: 'CO₂',
        retry_count: 0,
        last_retry_correct: false,
        is_mastered: false,
        first_wrong_date: new Date().toISOString(),
        last_attempt_date: new Date().toISOString()
    },
    {
        id: 'sample_math_1',
        user_id: 'sample',
        question_hash: 'qh_math_1',
        question_text: 'What is the value of the limit: lim (x -> 0) [sin(3x) / sin(5x)]?',
        options: ['3/5', '5/3', '1', '0'],
        correct_answer: '3/5',
        explanation: "Using L'Hopital's Rule or standard limit formula lim (x->0) [sin(kx)/x] = k: lim (x->0) [sin(3x) / sin(5x)] = lim (x->0) [(sin(3x)/3x)*3 / ((sin(5x)/5x)*5)] = 3/5.",
        topic: 'Limits',
        topic_id: 'limits',
        subject: 'Math',
        difficulty: 'Easy',
        exam_mode: 'quick',
        student_answer: '1',
        retry_count: 0,
        last_retry_correct: false,
        is_mastered: false,
        first_wrong_date: new Date().toISOString(),
        last_attempt_date: new Date().toISOString()
    }
];

const applyConceptualMutation = (entry: MistakeEntry): MistakeEntry => {
    if (entry.id === 'sample_physics_1') {
        return {
            ...entry,
            question_text: 'A body of mass 4 kg is moving with a velocity of 12 m/s. If a constant force of 8 N is applied opposite to its motion, how long will it take to come to rest?',
            options: ['3 seconds', '6 seconds', '8 seconds', '12 seconds'],
            correct_answer: '6 seconds',
            explanation: "Using Newton's Second Law, the deceleration a = F / m = -8 / 4 = -2 m/s². Using the first equation of motion v = u + at: 0 = 12 - 2t => 2t = 12 => t = 6 seconds. (Concept Mutated for deep verification)",
        };
    }
    if (entry.id === 'sample_math_1') {
        return {
            ...entry,
            question_text: 'What is the value of the limit: lim (x -> 0) [sin(4x) / sin(7x)]?',
            options: ['4/7', '7/4', '1', '0'],
            correct_answer: '4/7',
            explanation: "Using L'Hopital's Rule or standard limit formula lim (x->0) [sin(kx)/x] = k: lim (x->0) [sin(4x) / sin(7x)] = 4/7. (Concept Mutated for deep verification)",
        };
    }
    return entry;
};

export const ImprovementBookCard: React.FC<ImprovementBookCardProps> = ({ userId, isGuest = false, onStartTest }) => {
    const [entries, setEntries] = useState<MistakeEntry[]>([]);
    const [stats, setStats] = useState({
        totalMistakes: 0,
        masteredCount: 0,
        unresolvedCount: 0,
        masteryRate: 0
    });
    const [selectedEntry, setSelectedEntry] = useState<MistakeEntry | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasChecked, setHasChecked] = useState(false);
    const [isCorrectAttempt, setIsCorrectAttempt] = useState<boolean | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useScrollLock(!!selectedEntry);

    const loadMistakes = () => {
        if (isGuest || userId === 'guest') {
            setEntries(SAMPLE_MISTAKES);
            setStats({
                totalMistakes: SAMPLE_MISTAKES.length,
                masteredCount: 0,
                unresolvedCount: SAMPLE_MISTAKES.length,
                masteryRate: 0
            });
            setIsPreviewMode(true);
            return;
        }

        const realEntries = MistakeNotebookService.getMistakes(userId, { limit: 3, showMastered: false });
        const realStats = MistakeNotebookService.getStats(userId);

        if (realEntries.length === 0) {
            // Fallback to samples if no real mistakes yet
            setEntries(SAMPLE_MISTAKES);
            setStats({
                totalMistakes: SAMPLE_MISTAKES.length,
                masteredCount: 0,
                unresolvedCount: SAMPLE_MISTAKES.length,
                masteryRate: 0
            });
            setIsPreviewMode(true);
        } else {
            setEntries(realEntries);
            setStats({
                totalMistakes: realStats.totalMistakes,
                masteredCount: realStats.masteredCount,
                unresolvedCount: realStats.unresolvedCount,
                masteryRate: realStats.masteryRate
            });
            setIsPreviewMode(false);
        }
    };

    useEffect(() => {
        loadMistakes();
    }, [userId, isGuest]);

    const handleSolveStart = (entry: MistakeEntry) => {
        const mutated = applyConceptualMutation(entry);
        setSelectedEntry(mutated);
        setSelectedOption(null);
        setHasChecked(false);
        setIsCorrectAttempt(null);
    };

    const handleOptionSelect = (option: string) => {
        if (hasChecked) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = async () => {
        if (!selectedEntry || !selectedOption || hasChecked) return;

        const isCorrect = selectedOption === selectedEntry.correct_answer;
        setIsCorrectAttempt(isCorrect);
        setHasChecked(true);

        if (!isPreviewMode && userId !== 'guest') {
            await MistakeNotebookService.recordRetry(userId, selectedEntry.id, isCorrect);
            loadMistakes();
        } else {
            // For preview mode, simulate mastery removal locally
            if (isCorrect) {
                setTimeout(() => {
                    setEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
                    setStats(prev => {
                        const total = prev.totalMistakes;
                        const mastered = prev.masteredCount + 1;
                        return {
                            totalMistakes: total,
                            masteredCount: mastered,
                            unresolvedCount: Math.max(0, total - mastered),
                            masteryRate: Math.round((mastered / total) * 100)
                        };
                    });
                }, 1200);
            }
        }
    };

    const handleCloseModal = () => {
        setSelectedEntry(null);
        setSelectedOption(null);
        setHasChecked(false);
        setIsCorrectAttempt(null);
    };

    const getSubjectColor = (subject: string) => {
        switch (subject.toLowerCase()) {
            case 'physics': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'chemistry': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'math':
            case 'mathematics': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }
    };

    return (
        <>
            <div className="glass-card premium-border active-glow oxygen-card p-6 space-y-5 relative overflow-hidden group">
                {/* Background glow */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />

                {/* Header */}
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                                Improvement Book
                                {isPreviewMode && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                                        Practice
                                    </span>
                                )}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Targeted Revision</p>
                        </div>
                    </div>

                </div>

                {/* Mastery Rate Gauge */}
                <div className="space-y-2 bg-black/20 p-3.5 rounded-xl border border-white/5 relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <Award size={12} className="text-amber-400" />
                            Mastery Rate
                        </span>
                        <span className="font-mono text-slate-200">{stats.masteryRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/[0.02]">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.masteryRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                        />
                    </div>
                </div>

                {/* Mistakes List */}
                <div className="space-y-3 relative z-10">
                    {entries.length === 0 ? (
                        <div className="text-center py-6 px-4 space-y-3 bg-black/10 rounded-xl border border-white/5">
                            <CheckCircle2 className="mx-auto text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" size={28} />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-200">All Caught Up!</p>
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                                    No logged mistakes. Take a quick mock test to find areas to master.
                                </p>
                            </div>
                            {onStartTest && (
                                <button
                                    onClick={onStartTest}
                                    className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full"
                                >
                                    Take Mock Test
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: multiple cards */}
                            <div className="hidden md:flex flex-col gap-3">
                                {entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl flex items-center justify-between gap-4 transition-all duration-200 hover:border-white/10 group/item"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getSubjectColor(entry.subject)}`}>
                                                    {entry.subject}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                                    {entry.topic}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                                                {entry.question_text}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSolveStart(entry)}
                                            className="shrink-0 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 transition-all duration-200 shadow-sm active:scale-95 group-hover/item:translate-x-0.5"
                                            title="Solve Mistake"
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Mobile View: single premium CTA button */}
                            <div className="flex md:hidden flex-col">
                                <button
                                    onClick={() => handleSolveStart(entries[0])}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/15 hover:to-indigo-500/15 text-purple-300 border border-purple-500/20 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider active:scale-[0.98]"
                                >
                                    <Brain size={14} className="text-purple-400 shrink-0" />
                                    <span>Solve Next Mistake ({entries.length} Pending)</span>
                                    <ArrowRight size={12} className="text-purple-400 shrink-0 ml-1" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Solve Quiz Modal */}
            {isMounted && createPortal(
                <AnimatePresence>
                    {selectedEntry && (
                        <div 
                            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 backdrop-blur-md p-4 flex justify-center items-start md:items-center animate-fade-in" 
                            role="dialog" 
                            aria-modal="true"
                            onClick={handleCloseModal}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-[#0b0d16] border border-purple-500/20 p-6 md:p-8 rounded-2xl max-w-xl w-full shadow-2xl relative overflow-hidden my-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Cosmic backdrop light */}
                                <div className="absolute -right-24 -top-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                                {/* Close Button */}
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors z-20"
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>

                                <div className="space-y-6">
                                    {/* Modal Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 animate-pulse">
                                            <Brain size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-black text-slate-100 text-lg">Improvement Attempt</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getSubjectColor(selectedEntry.subject)}`}>
                                                    {selectedEntry.subject}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">{selectedEntry.topic}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Concept Mutation Badge */}
                                    {selectedEntry.id.startsWith('sample_') && (
                                        <div className="flex items-center gap-2.5 p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs animate-pulse">
                                            <Sparkles size={16} className="text-indigo-400 shrink-0" />
                                            <span>
                                                <strong className="text-indigo-200">SM-2 Concept Mutation Active:</strong> Variables have been mathematically mutated to verify your conceptual mastery, not rote memory!
                                            </span>
                                        </div>
                                    )}

                                    {/* Question Text */}
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                                            {selectedEntry.question_text}
                                        </p>
                                    </div>

                                    {/* Options */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedEntry.options.map((option, idx) => {
                                            const isSelected = selectedOption === option;
                                            const isCorrectOpt = option === selectedEntry.correct_answer;
                                            const isWrongSelected = isSelected && !isCorrectOpt;

                                            let btnStyle = 'border-white/5 hover:border-purple-500/30 hover:bg-white/[0.02] text-slate-300';
                                            if (hasChecked) {
                                                if (isCorrectOpt) {
                                                    btnStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold';
                                                } else if (isWrongSelected) {
                                                    btnStyle = 'border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold';
                                                } else {
                                                    btnStyle = 'border-white/5 text-slate-500 opacity-60';
                                                }
                                            } else if (isSelected) {
                                                btnStyle = 'border-purple-500/50 bg-purple-500/10 text-purple-300 font-bold';
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(option)}
                                                    disabled={hasChecked}
                                                    className={`p-4 rounded-xl border text-left text-xs md:text-sm font-medium transition-all duration-200 flex items-center justify-between ${btnStyle}`}
                                                >
                                                    <span>{option}</span>
                                                    {hasChecked && isCorrectOpt && (
                                                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 ml-2" />
                                                    )}
                                                    {hasChecked && isWrongSelected && (
                                                        <XCircle size={16} className="text-rose-400 shrink-0 ml-2" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Result Feedback / Explanation */}
                                    {hasChecked && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4 pt-2 border-t border-white/5"
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCorrectAttempt ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                                        <CheckCircle2 size={16} /> Concept Mastered!
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                                        <XCircle size={16} /> incorrect attempt. Review explanation below.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 bg-purple-500/[0.02] border border-purple-500/10 rounded-xl space-y-1.5">
                                                <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                                                    <Sparkles size={11} /> Detailed Explanation
                                                </h4>
                                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                    {selectedEntry.explanation}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Modal Actions */}
                                    <div className="flex justify-end gap-3 pt-2">
                                        {!hasChecked ? (
                                            <>
                                                <button
                                                    onClick={handleCloseModal}
                                                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleCheckAnswer}
                                                    disabled={!selectedOption}
                                                    className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                                                >
                                                    Verify Concept
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleCloseModal}
                                                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                                            >
                                                Done
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
