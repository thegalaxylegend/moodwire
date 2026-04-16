import React from 'react';
import { Loader2, Brain, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface MockLoadingProps {
    progress: number;
    message: string;
    step: 'loading' | 'config';
    onCancel: () => void;
}

export const MockLoading: React.FC<MockLoadingProps> = ({ progress, message, step, onCancel }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-md mx-auto px-4">
            <div className="relative">
                <Loader2 size={64} className="text-primary animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center text-primary font-bold">
                    {progress}%
                </div>
            </div>

            <div className="space-y-2 text-center w-full">
                <h2 className="text-xl font-bold text-text-main">Building Your Exam</h2>
                <p className="text-text-muted text-sm h-5">{message}</p>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-surface border border-border h-3 rounded-full overflow-hidden shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                />
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted mt-4">
                <Brain size={14} /> Only sourcing last 10 years PYQ-style
            </div>

            <div className="pt-8 w-full max-w-xs">
                <button
                    onClick={onCancel}
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
};
