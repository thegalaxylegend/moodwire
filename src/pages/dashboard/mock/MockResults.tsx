import React from 'react';
import { Trophy, CheckCircle, Brain, ArrowLeft, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ViralShareCard } from '../../../components/ViralShareCard';
import { calculatePredictedRank } from '../../../services/leaderboardService';

// Assuming Question is structured like this based on MockGenerator
export type ResultQuestion = {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    topic: string;
};

interface MockResultsProps {
    score: number;
    questions: ResultQuestion[];
    answers: Record<number, number>;
    topicOrExam?: string;
    userName?: string;
    targetExam?: string;
    mode?: 'full' | 'quick' | 'topic' | 'diagnostic' | 'remediation';
    onReview: () => void;
    onDashboard: () => void;
    onRetake: () => void;
}

export const MockResults: React.FC<MockResultsProps> = ({
    score,
    questions,
    answers,
    topicOrExam = 'Specific Topic',
    userName = 'Anonymous',
    targetExam = 'General',
    onReview,
    onDashboard,
    onRetake
}) => {
    const navigate = useNavigate();
    const totalPossibleScore = questions.length * 4;
    const accuracy = totalPossibleScore > 0 ? Math.round((score / totalPossibleScore) * 100) : 0;
    const rank = calculatePredictedRank(accuracy, targetExam);

    const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const wrongCount = questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctAnswer).length;
    const skippedCount = questions.filter((_, i) => answers[i] === undefined).length;

    const wrongTopics = questions
        .filter((q, i) => answers[i] !== undefined && answers[i] !== q.correctAnswer)
        .map(q => q.topic)
        .filter((topic, index, self) => self.indexOf(topic) === index) // unique topics
        .slice(0, 3);

    const handleShare = async () => {
        const text = `I just scored ${score} on my ${topicOrExam} Mock Test on Exam Compass! 🚀\n\nJoin me and crack your exams with AI: https://examcompass.pages.dev`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Exam Compass Score',
                    text: text,
                    url: 'https://examcompass.pages.dev'
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            navigator.clipboard.writeText(text);
            alert("Result copied to clipboard! Share it with your friends.");
        }
    };

    return (
        <div className="glass-card oxygen-card p-8 text-center space-y-6 max-w-4xl mx-auto animate-fade-in-up relative">
            <CheckCircle size={64} className="text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold text-text-main">Test Submitted!</h2>
            <div className="text-5xl font-bold text-primary">{score} / {totalPossibleScore}</div>
            <p className="text-text-muted">Accuracy: {accuracy}%</p>

            <div className="flex justify-center my-8 scale-90 md:scale-100 origin-center">
                <ViralShareCard
                    score={score}
                    total={totalPossibleScore}
                    topic={topicOrExam}
                    rank={rank}
                    username={userName}
                />
            </div>

            <div className="max-w-lg mx-auto mt-6 p-6 rounded-2xl bg-gradient-to-br from-surface to-primary/10 border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy size={100} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-bold text-text-muted uppercase tracking-widest mb-2">Predicted AIR</h3>
                    <div className="text-4xl font-heading font-bold text-primary mb-1">
                        #{rank.toLocaleString()}
                    </div>
                    <p className="text-xs text-text-muted">Based on this test performance</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-lg mx-auto mt-8">
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col items-center">
                    <span className="text-3xl font-bold text-green-500">{correctCount}</span>
                    <span className="text-xs uppercase tracking-wider text-green-400 font-bold mt-1">Correct</span>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center">
                    <span className="text-3xl font-bold text-red-500">{wrongCount}</span>
                    <span className="text-xs uppercase tracking-wider text-red-400 font-bold mt-1">Wrong</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
                    <span className="text-3xl font-bold text-text-muted">{skippedCount}</span>
                    <span className="text-xs uppercase tracking-wider text-text-muted font-bold mt-1">Skipped</span>
                </div>
            </div>

            {/* Video Recommendations for Weak Topics */}
            {wrongTopics.length > 0 && (
                <div className="max-w-2xl mx-auto mt-8 p-6 rounded-2xl bg-surface border border-border">
                    <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                        <Youtube size={20} className="text-red-400" /> Focus Areas - Watch These Lectures
                    </h3>
                    <div className="space-y-3">
                        {wrongTopics.map((topic, idx) => {
                            const cleanSlug = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
                            return (
                                <button type="button"
                                    key={idx}
                                    onClick={() => navigate(`/dashboard/lectures/${cleanSlug}`)}
                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                            <Youtube size={18} className="text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">{topic}</h4>
                                            <p className="text-xs text-text-muted">Curated video lessons</p>
                                        </div>
                                    </div>
                                    <ArrowLeft size={18} className="text-text-muted group-hover:text-primary transition-colors rotate-180" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <button type="button"
                onClick={onReview}
                className="mt-8 px-6 py-3 bg-secondary/10 text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/20 transition-all font-bold flex items-center gap-2 mx-auto"
            >
                <Brain size={18} /> Review Questions
            </button>


            <div className="flex flex-wrap gap-4 justify-center mt-8 pt-4 border-t border-white/10">
                <button type="button" onClick={onDashboard} className="px-6 py-3 bg-surface border border-border rounded-lg oxygen-button hover:bg-white/5 transition-all">
                    <ArrowLeft size={18} className="inline mr-2" /> Back to Dashboard
                </button>
                <button type="button"
                    onClick={handleShare}
                    className="px-6 py-3 bg-primary text-white rounded-lg oxygen-button flex items-center gap-2"
                >
                    <Trophy size={18} /> Share My Score
                </button>
                <button type="button" onClick={onRetake} className="px-6 py-3 bg-white/5 border border-border text-text-muted rounded-lg oxygen-button hover:bg-white/10 transition-all">
                    Retake Test
                </button>
            </div>
        </div>
    );
};
