import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, Clock } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

const EXAMS = ['JEE', 'NEET', 'Boards', 'Other'];

export const ExamReconfirmationModal = () => {
    const { user, updateProfile } = useUserStore();
    const [selectedExam, setSelectedExam] = React.useState(user?.targetExam || '');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Only show if prompt is pending and not snoozed
    const isPending = user?.pendingPrompts?.includes('exam_reconfirmation');
    const isSnoozed = user?.promptSnoozedUntil && new Date(user.promptSnoozedUntil) > new Date();
    const isVisible = !!(isPending && !isSnoozed);

    useScrollLock(isVisible);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const newPrompts = (user?.pendingPrompts || []).filter(p => p !== 'exam_reconfirmation');
            await updateProfile({
                targetExam: selectedExam,
                pendingPrompts: newPrompts
            });
            console.log("✅ [Modal] Exam confirmed:", selectedExam);
        } catch (e) {
            console.error("❌ [Modal] Confirm failed:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSnooze = async () => {
        setIsSubmitting(true);
        try {
            // Snooze for 24 hours
            const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await updateProfile({
                promptSnoozedUntil: snoozeUntil
            });
            console.log("😴 [Modal] Snoozed until:", snoozeUntil);
        } catch (e) {
            console.error("❌ [Modal] Snooze failed:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="exam-reconfirm-title">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
                            <Target size={32} />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-text-main">Welcome to {user?.userClass}!</h2>
                            <p className="text-text-muted">
                                Since you've moved to a new class, let's re-confirm your target exam to tailor your preparation.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {EXAMS.map(exam => (
                                <button
                                    key={exam}
                                    onClick={() => setSelectedExam(exam)}
                                    className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                                        selectedExam === exam 
                                        ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                                        : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {exam}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedExam || isSubmitting}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 group active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Confirm & Continue
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={handleSnooze}
                                disabled={isSubmitting}
                                className="w-full py-3 text-text-muted text-sm font-medium hover:text-text-main flex items-center justify-center gap-2 transition-colors"
                            >
                                <Clock size={16} />
                                Remind me tomorrow
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
