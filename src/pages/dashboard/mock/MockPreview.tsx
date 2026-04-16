import React from 'react';
import { Brain, ArrowLeft, CheckCircle } from 'lucide-react';

interface MockPreviewProps {
    questionsCount: number;
    timeRemaining: number;
    topicOrExam?: string;
    isTimedExam: boolean;
    mode?: 'full' | 'quick' | 'topic' | 'diagnostic';
    onStart: () => void;
    onCancel: () => void;
}

export const MockPreview: React.FC<MockPreviewProps> = ({ 
    questionsCount, 
    timeRemaining, 
    topicOrExam = 'General Proficiency', 
    isTimedExam, 
    onStart, 
    onCancel 
}) => {
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
                    <span className="text-2xl font-bold text-text-main">{questionsCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Time Limit</span>
                    <span className="text-2xl font-bold text-text-main">{isTimedExam && timeLimit > 0 ? `${timeLimit} Min` : 'Untimed'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-border col-span-2 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Subjects</span>
                    <span className="text-lg font-bold text-primary">
                        {topicOrExam}
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
                    <li>{isTimedExam ? 'Timer starts as soon as you click the button below.' : 'Timer is disabled for this practice session.'}</li>
                    <li>You can pause the test at any time.</li>
                </ul>
            </div>

            <button
                onClick={onStart}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg"
            >
                Start Test Now
            </button>

            <div className="w-full max-w-xs pt-4">
                <button
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all font-medium group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Menu
                </button>
            </div>
        </div>
    );
};
