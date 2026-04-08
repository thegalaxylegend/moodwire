import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { Calendar, CheckCircle2, ArrowRight, GraduationCap, Loader2 } from 'lucide-react';

export const Onboarding = () => {
    const navigate = useNavigate();
    const updateProfile = useUserStore((state) => state.updateProfile);
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        targetExam: '',
        userClass: '',
        targetYear: new Date().getFullYear(),
        prepLevel: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced'
    });

    // Safety: If already onboarded (from stored session), go to dashboard
    const { user } = useUserStore();
    useEffect(() => {
        if (user?.onboardingCompleted) {
            navigate('/dashboard');
        }
    }, [user?.onboardingCompleted, navigate]);

    if (user?.onboardingCompleted) {
        return null;
    }

    const handleNext = () => {
        if (step === 1) {
            // Check for Junior Classes
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(formData.userClass);
            if (isJunior) {
                setFormData({ ...formData, targetExam: 'School Exams', targetYear: new Date().getFullYear() });
                setStep(4); // Skip Exam Selection (2) AND Attempt Year (3)
            } else {
                setStep(2);
            }
        }
        else if (step < 4) setStep(step + 1);
        else handleComplete();
    };

    const handleComplete = async () => {
        if (isSaving) return; // Prevent double-click
        setIsSaving(true);
        try {
            // Save to store & DB
            await updateProfile({
                ...formData,
                onboardingCompleted: true,
                streak: 1 // Start streak on day 1
            });

            navigate('/dashboard');
        } catch (err: any) {
            console.error("Onboarding failed", err);
            setIsSaving(false);
            alert("Failed to save profile. Please try again. Error: " + (err.message || "Unknown error"));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-full -z-10">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-2xl px-4 animate-fade-in-up">
                {/* Progress Bar */}
                <div className="flex justify-between mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-surface -z-10" />
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary -z-10 transition-all duration-500"
                        style={{ width: `${((step - 1) / 3) * 100}%` }}
                    />

                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${step >= s
                            ? 'bg-primary border-background text-white'
                            : 'bg-surface border-background text-text-muted'
                            }`}>
                            {step > s ? <CheckCircle2 size={18} /> : s}
                        </div>
                    ))}
                </div>

                <div className="glass-card p-8 md:p-12">
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h2 className="text-3xl font-heading font-bold text-text-main text-center">
                                Which <span className="text-secondary">Class</span> are you in?
                            </h2>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                {['Class 8th', 'Class 9th', 'Class 10th', 'Class 11th', 'Class 12th', 'Dropper'].map((cls) => (
                                    <button
                                        key={cls}
                                        onClick={() => setFormData({ ...formData, userClass: cls })}
                                        className={`p-4 rounded-xl border text-center transition-all ${formData.userClass === cls
                                            ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_20px_rgba(14,165,233,0.2)]'
                                            : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <GraduationCap className="mx-auto mb-2" size={20} />
                                        <span className="font-bold text-md block">{cls === 'Dropper' ? 'Dropper' : cls.replace('Class ', '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h2 className="text-3xl font-heading font-bold text-text-main text-center">
                                What is your <span className="text-primary">Target Exam?</span>
                            </h2>
                            <p className="text-center text-text-muted">Select the mountain you want to conquer.</p>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {['JEE Mains', 'NEET UG', 'School Exams'].map((exam) => (
                                    <button
                                        key={exam}
                                        onClick={() => setFormData({ ...formData, targetExam: exam })}
                                        className={`p-6 rounded-xl border text-left transition-all ${formData.targetExam === exam
                                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                                            : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="font-bold text-lg block">{exam}</span>
                                        <span className="text-xs opacity-70">{exam === 'School Exams' ? 'Board/School Level' : 'National Level'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h2 className="text-3xl font-heading font-bold text-text-main text-center">
                                When is your <span className="text-accent">Attempt?</span>
                            </h2>

                            <div className="grid grid-cols-3 gap-4 mt-8">
                                {[0, 1, 2, 3, 4].map((offset) => {
                                    const year = new Date().getFullYear() + offset;
                                    return (
                                        <button
                                            key={year}
                                            onClick={() => setFormData({ ...formData, targetYear: year })}
                                            className={`p-6 rounded-xl border text-center transition-all ${formData.targetYear === year
                                                ? 'bg-accent/20 border-accent text-accent shadow-[0_0_20px_rgba(236,72,153,0.2)]'
                                                : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                                }`}
                                        >
                                            <Calendar className="mx-auto mb-3" />
                                            <span className="font-bold text-xl">{year}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h2 className="text-3xl font-heading font-bold text-text-main text-center">
                                Current <span className="text-primary">Preparation Level</span>
                            </h2>

                            <div className="space-y-4 mt-6">
                                {[
                                    { id: 'Beginner', label: 'Just Starting', desc: 'I need to clear basics first.' },
                                    { id: 'Intermediate', label: 'In Progress', desc: 'I have covered 40-50% syllabus.' },
                                    { id: 'Advanced', label: 'Exam Ready', desc: 'Focusing on mock tests and revision.' }
                                ].map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setFormData({ ...formData, prepLevel: level.id as 'Beginner' | 'Intermediate' | 'Advanced' })}
                                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${formData.prepLevel === level.id
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-surface border-border text-text-muted hover:bg-white/5'
                                            }`}
                                    >
                                        <div>
                                            <span className="font-bold block">{level.label}</span>
                                            <span className="text-sm opacity-70">{level.desc}</span>
                                        </div>
                                        {formData.prepLevel === level.id && <CheckCircle2 />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={
                                isSaving ||
                                (step === 1 && !formData.userClass) ||
                                (step === 2 && !formData.targetExam) ||
                                (step === 3 && !formData.targetYear) ||
                                (step === 4 && !formData.prepLevel)
                            }
                            className="px-8 py-4 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 hover:bg-primary/90 transition-all"
                        >
                            {isSaving ? (
                                <><Loader2 size={18} className="animate-spin" /> Saving...</>
                            ) : (
                                <>{step === 4 ? 'Generate My Dashboard' : 'Next Step'} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
