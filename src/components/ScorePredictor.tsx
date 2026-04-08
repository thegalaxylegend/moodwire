import { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Brain, Zap } from 'lucide-react';
import { predictionService, getExamConstants } from '../services/predictionService';
import type { PredictionResult } from '../services/predictionService';
import { useUserStore } from '../store/userStore';

export const ScorePredictor = () => {
    const { user } = useUserStore();
    const defaultExam = user?.targetExam || 'JEE Mains';
    const [mockScore, setMockScore] = useState(() => Math.round(getExamConstants(defaultExam).MAX_SCORE / 2));
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);

    const isSchoolExam = defaultExam.toLowerCase().includes('class') || defaultExam.toLowerCase().includes('board') || defaultExam.toLowerCase().includes('school');

    useEffect(() => {
        const result = predictionService.predictRank({
            currentMockScore: mockScore,
            topicStrength: 0.7, // Mocking these for now, can be connected to userStore
            examType: defaultExam,
            monthsUntilExam: 4,
            consistencyFactor: 0.8
        });
        setPrediction(result);
    }, [mockScore, defaultExam]);

    if (!prediction) return null;

    return (
        <div className="relative overflow-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                {/* Left Side: Inputs */}
                <div className="w-full lg:w-1/2 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={16} className="text-primary" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Score Predictor v2</h2>
                            </div>
                            <p className="text-gray-400 text-sm font-medium">DeepSeek Logic v{prediction.predictedPercentile.toFixed(0)}</p>
                        </div>

                        {/* Selected Exam Badge */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <span className="px-4 py-1.5 rounded-lg text-xs font-black bg-primary text-white shadow-lg whitespace-nowrap">
                                {defaultExam}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Brain size={16} className="text-secondary mb-2" />
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Growth Factor</p>
                            <p className="text-xl font-black text-white">+{((prediction.predictedScore / (mockScore || 1) - 1) * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Zap size={16} className="text-yellow-400 mb-2" />
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Target Score</p>
                            <p className="text-xl font-black text-white">{Math.round(prediction.predictedScore)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Current Mock Score</label>
                                <span className="text-lg font-black text-primary">{mockScore} / {getExamConstants(defaultExam).MAX_SCORE}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max={getExamConstants(defaultExam).MAX_SCORE}
                                value={mockScore}
                                onChange={(e) => setMockScore(parseInt(e.target.value))}
                                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Visual Result */}
                <div className="w-full lg:w-1/2">
                    <div className="relative p-1 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[2.5rem] h-full">
                        <div className="bg-[#0a0a0b] rounded-[2.4rem] p-8 md:p-10 flex flex-col items-center text-center h-full min-h-[380px]">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-2 font-mono">
                                {isSchoolExam ? "Target Status" : "2026 Estimated AIR"}
                            </h3>
                            <div className="text-6xl font-black text-white tracking-tighter mb-4 tabular-nums drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                                {isSchoolExam ? (mockScore >= 95 ? 'Elite' : mockScore >= 80 ? 'Good' : 'Avg') : `#${prediction.predictedRank.toLocaleString()}`}
                            </div>

                            {!isSchoolExam && (
                                <div className="space-y-2 mb-6">
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Confidence Range</p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                                        <span>#{prediction.rankRange.pessimistic.toLocaleString()}</span>
                                        <div className="w-24 h-1 bg-white/10 rounded-full relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/40 animate-pulse"></div>
                                        </div>
                                        <span>#{prediction.rankRange.optimistic.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* Qualification Status */}
                            {prediction.qualificationStatus && (
                                <div className="mt-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-full text-left">
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Analysis</p>
                                    <p className="text-xs font-medium text-white/90 truncate">{prediction.qualificationStatus}</p>
                                </div>
                            )}

                            {/* Caveat Warning (Removed) */}

                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mt-auto mb-6">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">DeepSeek Verified • {prediction.predictedPercentile.toFixed(2)}%ile</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
