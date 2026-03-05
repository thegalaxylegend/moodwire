import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BlogCTA: React.FC = () => {
    return (
        <div className="my-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-primary/20 via-surface to-accent/10 border border-primary/20 relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-colors" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        <span className="text-sm font-bold text-primary tracking-wider uppercase">Turn Reading Into Practice</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to test your knowledge?</h3>
                    <p className="text-text-muted">
                        Stop studying blindly. Generate a personalized, AI-powered mock test focusing exactly on your weak areas right now.
                    </p>
                </div>

                <Link
                    to="/"
                    className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1 w-full md:w-auto justify-center"
                >
                    Try Exam Compass Free
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
};
