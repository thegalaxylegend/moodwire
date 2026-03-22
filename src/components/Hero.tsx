import { ArrowRight } from 'lucide-react';
import { Play } from 'lucide-react';
import { Brain } from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import { Globe } from 'lucide-react';
import { BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroProps {
    onOpenDemo: () => void;
}

export const Hero = ({ onOpenDemo }: HeroProps) => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
            {/* Abstract Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 text-center lg:text-left animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-white/10 text-xs font-medium text-text-muted">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        System Operating Normally
                    </div>

                    <h1 className="text-5xl md:text-7xl font-heading font-bold text-text-main leading-tight" id="main-content">
                        Master Your Exams with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI-Powered Preparation</span> <br />
                    </h1>

                    <p className="text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Adaptive Elo-rated mocks that match YOUR level. Root-cause AI that finds WHY you fail, not just where. Real-time success probability based on 9,000+ PYQs.
                        <span className="text-text-main font-semibold block mt-2">Not a quiz app. A competitive exam weapon.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2 group"
                        >
                            Launch Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onOpenDemo}
                            className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all flex items-center gap-2 group"
                        >
                            <Play size={20} className="group-hover:text-primary transition-colors" />
                            View Demo
                        </button>
                    </div>

                    <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 opacity-70">
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                            <ShieldCheck size={16} /> Verified Data
                        </div>
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Globe size={16} /> Class 8-12 & JEE/NEET
                        </div>
                    </div>
                </div>

                {/* Dynamic Visual Element (Simulated Graph) */}
                <div className="hidden lg:block relative animate-float">
                    <div className="glass-card p-6 border-zinc-800/50 bg-black/40 backdrop-blur-xl max-w-md mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div className="space-y-1">
                                <h2 className="font-bold text-text-main text-base">Success Probability</h2>
                                <p className="text-xs text-text-muted">Based on your last 5 mocks</p>
                            </div>
                            <BarChart2 className="text-primary" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">JEE Mains</span>
                                <span className="text-green-400">High (82%)</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[82%] animate-pulse-slow"></div>
                            </div>

                            <div className="flex justify-between text-sm pt-2">
                                <span className="text-text-muted">JEE Advanced</span>
                                <span className="text-yellow-400">Moderate (45%)</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[45%]"></div>
                            </div>

                            <div className="flex justify-between text-sm pt-2">
                                <span className="text-text-muted">School Exams</span>
                                <span className="text-blue-400">Very High (91%)</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[91%]"></div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 text-xs text-text-muted">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div> Improving
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Stable
                            </div>
                        </div>
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -right-4 top-10 glass-card p-3 flex items-center gap-3 animate-bounce-slow delay-700">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">AI Insight</p>
                            <p className="font-bold text-sm text-text-main">Focus on Optics</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
