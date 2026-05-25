import { ArrowRight, Play, Brain, ShieldCheck, Globe, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HeroProps {
    onOpenDemo: () => void;
}

export const Hero = ({ onOpenDemo }: HeroProps) => {
    // Removed unused navigate and user
    // Use innerWidth for instant performance decision (SSR safe with window check)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { 
                staggerChildren: isMobile ? 0 : 0.06, 
                delayChildren: 0 
            }
        }
    };

    const itemVariants: Variants = {
        hidden: isMobile ? { opacity: 0 } : { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { 
                duration: isMobile ? 0.35 : 0.5, 
                ease: [0.16, 1, 0.3, 1]
            }
        }
    };

    return (
        <div className="relative min-h-[100svh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 pb-12 sm:pt-20 sm:pb-0">
            {/* Ambient Background — High performance radial gradients (no blur filters) */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(139,92,246,0.1),transparent_70%)] animate-breathing will-change-[opacity]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(79,70,229,0.06),transparent_70%)] animate-breathing will-change-[opacity]" style={{ animationDelay: '3s' }} />
                
                {/* Minimal orbs */}
                <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-primary/40 rounded-full animate-float-1" />
                <div className="absolute bottom-[25%] left-[35%] w-2 h-2 bg-cyan-400/20 rounded-full animate-float-5" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-8 text-center lg:text-left"
                >
                    {/* Main heading with animated gradient */}
                    <motion.h1 
                        variants={itemVariants}
                        className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold text-text-main leading-[1.1]" id="main-content"
                    >
                        Stop Guessing What to <br />
                        <span className="animate-gradient-text bg-gradient-to-r from-primary via-secondary to-accent">
                            Study Next Start Scoring
                        </span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p 
                        variants={itemVariants}
                        className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                    >
                        Experience the only <span className="text-primary font-bold">Neural Performance Engine</span> that identifies your "Growth Gaps" and predicts your rank with data-backed precision. Stop wasting time on random mocks—train like your selection depends on it
                        <span className="text-text-main font-semibold block mt-2">The ultimate analytics companion for your selection journey</span>
                    </motion.p>

                    {/* CTA buttons — simplified for performance */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center lg:justify-start w-full sm:w-auto">
                        <Link
                            to="/login"
                            className="px-6 sm:px-8 py-3.5 sm:py-4 bg-primary w-full sm:w-auto justify-center hover:bg-primary/90 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_10px_40px_-10px_rgba(139,92,246,0.5)] flex items-center gap-2 group"
                        >
                            Launch Dashboard <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                        </Link>
                        <button
                            onClick={onOpenDemo}
                            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border w-full sm:w-auto justify-center border-white/10 hover:bg-white/5 font-bold transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] flex items-center gap-2 group hover:border-primary/30"
                        >
                            <Play size={20} className="group-hover:text-primary transition-colors" />
                            Watch Demo
                        </button>
                    </div>

                    {/* Direct Android APK download helper */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex justify-center lg:justify-start pt-2"
                    >
                        <Link 
                            to="/download" 
                            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 hover:border-white/10"
                        >
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                            <span>Get the official Android App (.apk) &amp; iOS App</span>
                        </Link>
                    </motion.div>

                    {/* Trust badges — wrap gracefully on small screens */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-8 pt-4"
                    >
                        <div className="flex items-center gap-2 text-text-muted/70 text-sm">
                            <ShieldCheck size={16} />
                            <span>Classes 8–12 Foundation</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted/70 text-sm">
                            <Globe size={16} />
                            <span>JEE (Main &amp; Adv) &amp; NEET</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Showcase card with animated entrance */}
                <motion.div 
                    initial={{ opacity: 0, x: 40, rotate: -5 }}
                    animate={{ opacity: 1, x: 0, rotate: -2 }}
                    transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ rotate: 0, scale: 1.02, y: -5 }}
                    className="hidden lg:block relative"
                >
                    <div className="glass-card p-6 border-zinc-800/50 bg-black/40 backdrop-blur-xl max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div className="space-y-1">
                                <h2 className="font-bold text-text-main text-base">Syllabus Mastery</h2>
                                <p className="text-xs text-text-muted">Based on NTA PYQ accuracy</p>
                            </div>
                            <BarChart2 className="text-primary" />
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'JEE Mains', value: 82, color: 'bg-green-500', textColor: 'text-green-400', status: 'Mastered' },
                                { label: 'JEE Advanced', value: 45, color: 'bg-yellow-500', textColor: 'text-yellow-400', status: 'Review Needed' },
                                { label: 'School Exams', value: 91, color: 'bg-blue-500', textColor: 'text-blue-400', status: 'Mastered' },
                            ].map((item, i) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">{item.label}</span>
                                        <span className={item.textColor}>{item.status} ({item.value}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mt-1">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            transition={{ delay: 1.2 + i * 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
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

                    {/* Floating Badge with glow */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 2, duration: 0.6, type: 'spring' }}
                        className="absolute -right-4 top-10 glass-card p-3 flex items-center gap-3 animate-gentle-float animate-glow-pulse"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">High Error Rate</p>
                            <p className="font-bold text-sm text-text-main">Wave Optics (PYQ Avg: 40%)</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
