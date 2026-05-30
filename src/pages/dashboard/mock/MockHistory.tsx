import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Brain, PlayCircle } from 'lucide-react';

interface MockHistoryProps {
    user: any;
    onBack: () => void;
    onResume: (attempt: any, mode?: 'resume' | 'review') => void;
}

export const MockHistory: React.FC<MockHistoryProps> = ({ user, onBack, onResume }) => {
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
            <button type="button" onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
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
                                    <button type="button"
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
                                            <button type="button"
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
