import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Hero } from '../components/Hero';

import { ExamGrid } from '../components/ExamGrid';
import { DemoModal } from '../components/DemoModal';
import { Zap, Target, Brain, Award, ArrowRight, Rocket } from 'lucide-react';
import { SEO } from '../components/SEO';
import { AboutAuthor } from '../components/seo/AboutAuthor';
import { Footer } from '../components/Footer';
import { SITE_URL, SITE_OG_IMAGE } from '../lib/siteConfig';

// Animated Counter Hook — optimized for mobile
const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [count, setCount] = useState(isMobile ? end : 0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const hasStarted = useRef(isMobile); // Skip animation tracking on mobile

    useEffect(() => {
        if (isMobile || !startOnView || !isInView || hasStarted.current) return;
        hasStarted.current = true;

        let startTime: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isInView, end, duration, startOnView, isMobile]);

    return { count, ref };
};

// Clean parent-level reveal — simplified for mobile
const TextReveal = ({ children, className = '', delay = 0 }: { children: string; className?: string; delay?: number }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    return (
        <motion.span
            initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 15 }}
            whileInView={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: isMobile ? '-2px' : '-40px' }}
            transition={isMobile ? { delay: 0, duration: 0.3 } : { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`inline-block ${className}`}
        >
            {children}
        </motion.span>
    );
};

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useUserStore();
    const [showDemo, setShowDemo] = useState(false);

    const isServer = typeof window === 'undefined';

    useEffect(() => {
        if (isAuthenticated && (!isLoading || !isServer)) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, isServer]);

    const { scrollYProgress } = useScroll();

    // Counter hooks for stats
    const pyqs = useCountUp(9000);
    const coverage = useCountUp(100);

    // We no longer block the Landing Page with a loader. 
    // This allows the page to hit LCP/FCP immediately.
    // Auth-based redirects happen silently in the background.

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Scroll Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent z-[100] origin-left will-change-transform"
                style={{ scaleX: scrollYProgress }}
            />

            {/* Ambient Background — reduced for mobile performance */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_50%_30%,#1e1b4b_0%,#0a0118_40%,#000000_100%)]">
                {/* Single Primary Orb on mobile, multiple on desktop */}
                <div className="absolute top-[5%] right-[5%] w-[55%] h-[45%] bg-[radial-gradient(circle,rgba(139,92,246,0.08),transparent_70%)] animate-breathing will-change-[opacity]" />
                
                {/* Secondary orbs — desktop only to preserve premium look on PC */}
                <div className="hidden md:block absolute top-[45%] left-[5%] w-[40%] h-[35%] bg-[radial-gradient(circle,rgba(49,46,129,0.12),transparent_70%)] animate-breathing will-change-[opacity]" style={{ animationDelay: '3s' }} />
                <div className="hidden md:block absolute bottom-[10%] right-[15%] w-[30%] h-[25%] bg-[radial-gradient(circle,rgba(168,85,247,0.05),transparent_70%)] animate-breathing will-change-[opacity]" style={{ animationDelay: '5s' }} />
            </div>

            <SEO
                title="Exam Compass | Elite AI-Powered Prep for JEE & NEET"
                description="Experience the future of competitive exam prep. Adaptive Elo-rated mocks, root-cause AI diagnosis, and predictive analytics for JEE & NEET aspirants."
                canonical={`${SITE_URL}/`}
                image={SITE_OG_IMAGE}
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebSite",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "description": "AI-powered exam preparation platform for JEE and NEET.",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": `${SITE_URL}/{search_term_string}`,
                                "query-input": "required name=search_term_string"
                            }
                        },
                        {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "logo": `${SITE_URL}/logo.jpg`,
                            "founder": {
                                "@type": "Person",
                                "name": "Ayush Kumar",
                                "jobTitle": "Founder",
                                "sameAs": [
                                    "https://github.com/thegalaxylegend",
                                    `${SITE_URL}/about`
                                ]
                            },
                            "sameAs": [
                                `${SITE_URL}/blog`,
                                `${SITE_URL}/about`
                            ]
                        }
                    ]
                }}
            />

            {/* Hero */}
            <div className="relative z-10">
                <Hero onOpenDemo={() => setShowDemo(true)} />
            </div>
            
            {/* ExamGrid with slide-up reveal */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
                <ExamGrid />
            </motion.div>

            {/* ═══════════ SOCIAL PROOF STATS — Animated Counters ═══════════ */}
            <section className="py-28 px-6 relative overflow-hidden">
                {/* Animated gradient divider */}
                <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent origin-left"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                    {[
                        { label: "PYQs Mapped", value: "9,000+", numValue: 9000, suffix: "+", color: "from-primary to-purple-400", ref: pyqs },
                        { label: "AI Mock Tests", value: "Unlimited", isText: true, color: "from-cyan-400 to-blue-400" },
                        { label: "Syllabus Coverage", value: "100%", numValue: 100, suffix: "%", color: "from-emerald-400 to-teal-400", ref: coverage },
                        { label: "Price", value: "Free", isText: true, color: "from-orange-400 to-yellow-400" }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-2 text-center md:text-left"
                        >
                            <div ref={stat.ref?.ref}>
                                <p className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                                    {stat.isText ? stat.value : `${stat.ref?.count.toLocaleString()}${stat.suffix}`}
                                </p>
                            </div>
                            <p className="text-xs text-text-muted uppercase tracking-widest font-bold opacity-70">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom divider */}
                <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent origin-right"
                />
            </section>

            {/* ═══════════ FEATURE PROOF — Parallax Cards ═══════════ */}
            <section className="py-32 px-6 max-w-7xl mx-auto relative">
                <div className="text-center mb-24">
                    <motion.h2 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
                    >
                        <TextReveal>Master the Machine.</TextReveal>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        viewport={{ once: true }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        <TextReveal delay={0.3}>Not another quiz app. We've built a high-end digital sanctuary for elite aspirants.</TextReveal>
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        {
                            icon: <Target className="text-primary" size={32} />,
                            title: "Adaptive Elo Rating",
                            desc: "Our matches question difficulty to your skill in real-time. No more wasting time on 'obvious' or 'impossible' questions.",
                            gradient: "from-primary/10 via-transparent to-transparent"
                        },
                        {
                            icon: <Brain className="text-secondary" size={32} />,
                            title: "Root-Cause Analysis",
                            desc: "Failing Torque? Our AI traces back to find the real gap — usually prerequisites like Vectors or Cross Products. We fix the source.",
                            gradient: "from-secondary/10 via-transparent to-transparent"
                        },
                        {
                            icon: <Zap className="text-cyan-400" size={32} />,
                            title: "PYQ Intelligence",
                            desc: "Mapped 9,000+ Previous Year Questions (2015–2025). We predict high-probability topics for 2026 based on NTA's shifting patterns.",
                            gradient: "from-cyan-400/10 via-transparent to-transparent"
                        }
                    ].map((feature, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 50, rotate: 1 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -12, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                            className="glass-card group relative p-10 overflow-hidden"
                        >
                            {/* Hover glow overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[var(--card-radius)]`} />
                            <div className="relative z-10">
                                <motion.div 
                                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                                    className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors duration-300"
                                >
                                    {feature.icon}
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════ HOW IT WORKS — Step Explainer ═══════════ */}
            <section className="py-32 px-6 max-w-6xl mx-auto relative">
                {/* Animated divider */}
                <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent origin-center"
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-breathing" />
                
                <div className="text-center mb-24 relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold text-white mb-6"
                    >
                        <TextReveal>Built to Last.</TextReveal>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-xl text-gray-400"
                    >
                        <TextReveal delay={0.2}>No vague "AI-powered" claims. Here is the architecture of your victory.</TextReveal>
                    </motion.p>
                </div>
                
                <div className="space-y-8 relative z-10">
                    {/* Connecting line */}
                    <div className="absolute left-10 top-10 bottom-10 w-px bg-gradient-to-b from-primary/30 via-secondary/30 to-accent/30 hidden md:block" />
                    
                    {[
                        {
                            title: "Calibrated Practice",
                            desc: "AI generates questions matching YOUR current Elo rating. No generic question banks — every test is a precision-strike at your skill level.",
                            icon: <Target className="text-primary" />,
                            step: "01"
                        },
                        {
                            title: "Root-Cause Diagnosis",
                            desc: "Our Concept Graph maps mistakes to their deepest prerequisites. Instead of 'study more,' we tell you exactly which foundation is cracked.",
                            icon: <Brain className="text-secondary" />,
                            step: "02"
                        },
                        {
                            title: "The Victory Roadmap",
                            desc: "Track real-time selection probability and dynamic rank predictions. The system learns from every click, carving your path to a dream college.",
                            icon: <Award className="text-accent" />,
                            step: "03"
                        }
                    ].map((step, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ x: 10, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                            className="glass-card flex flex-col md:flex-row gap-8 items-center md:items-start p-10 group relative overflow-hidden"
                        >
                            {/* Step number watermark */}
                            <div className="absolute top-4 right-6 text-[80px] font-black text-white/[0.03] leading-none select-none">
                                {step.step}
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 text-3xl font-black group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                                {step.icon}
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-xl max-w-3xl">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════ FINAL CTA — Conversion Section ═══════════ */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px] animate-breathing" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-3xl mx-auto text-center relative z-10"
                >
                    <motion.div 
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-8"
                    >
                        <Rocket size={36} className="text-primary" />
                    </motion.div>
                    
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        <TextReveal>Ready to dominate your exams?</TextReveal>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                        <TextReveal delay={0.3}>Join thousands of aspirants who chose precision over guesswork.</TextReveal>
                    </p>
                    
                    <motion.button
                        onClick={() => navigate('/dashboard')}
                        whileHover={{ scale: 1.05, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-xl animate-glow-pulse transition-all inline-flex items-center gap-3 group"
                    >
                        Start for Free <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </motion.button>
                    
                    <p className="text-sm text-gray-500 mt-6">No credit card required. Forever free tier.</p>
                </motion.div>
            </section>

            <AboutAuthor compact />
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
            <Footer />
        </div>
    );
};
