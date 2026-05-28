import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useInView, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Hero } from '../components/Hero';

import { ExamGrid } from '../components/ExamGrid';
import { DemoModal } from '../components/DemoModal';
import { Zap, Target, Brain, Award, ArrowRight, Rocket, ChevronDown } from 'lucide-react';
import { SEO } from '../components/SEO';
import { AboutAuthor } from '../components/seo/AboutAuthor';
import { SITE_URL, SITE_OG_IMAGE, SITE_LOGO } from '../lib/siteConfig';
import { usePerformance } from '../context/PerformanceProvider';
import { Footer } from '../components/Footer';

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
            viewport={{ once: true, margin: isMobile ? '-2px' : '-20px' }}
            transition={isMobile ? { delay: 0, duration: 0.2 } : { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-block ${className}`}
        >
            {children}
        </motion.span>
    );
};

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user } = useUserStore();
    const [showDemo, setShowDemo] = useState(false);
    const { tier } = usePerformance();
    
    // Performance detection
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isServer = typeof window === 'undefined' || (typeof window !== 'undefined' && (window as any).__PRERENDER__);

    useEffect(() => {
        // CRITICAL SEO FIX: Only redirect to dashboard when:
        // 1. Not SSR (Googlebot/crawlers must see the landing page)
        // 2. Auth is fully resolved (not still loading)
        // 3. User is genuinely authenticated (not anonymous/guest)
        if (!isServer && !isLoading && isAuthenticated && user && !user.isGuest) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, user, navigate, isServer]);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Counter hooks for stats
    const pyqs = useCountUp(9000);
    const coverage = useCountUp(100);

    // We no longer block the Landing Page with a loader. 
    // This allows the page to hit LCP/FCP immediately.
    // Auth-based redirects happen silently in the background.

    return (
        <div className={`min-h-screen bg-black text-white relative overflow-hidden perf-tier-${tier}`}>
            {/* Premium Scroll Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[45] origin-left shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                style={{ scaleX }}
            />

            {/* Dynamic Neural Pulse Line */}
            <motion.div 
                className="fixed left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent z-40 hidden lg:block opacity-20"
                style={{ scaleY: scrollYProgress, originY: 0 }}
            />

            {/* Global ParallaxBackground is now managed in App.tsx */}

            <SEO
                title="Exam Compass | Free AI-Powered JEE, NEET & Board Exam Prep"
                description="India's free AI exam preparation platform. Practice 9,000+ verified NTA PYQs, take unlimited AI mock tests, and get personalized study plans for JEE Main, JEE Advanced, NEET, and CBSE Classes 8-12."
                canonical={`${SITE_URL}/`}
                image={SITE_OG_IMAGE}
                keywords="JEE preparation, NEET preparation, CBSE board exam, AI mock test, free exam prep India, JEE Mains 2026, NEET 2026"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "logo": SITE_LOGO,
                            "description": "India's free AI-powered exam preparation platform for JEE, NEET, and CBSE students.",
                            "founder": {
                                "@type": "Person",
                                "name": "Ayush Kumar",
                                "url": `${SITE_URL}/founder`
                            },
                            "foundingDate": "2025",
                            "sameAs": [
                                "https://twitter.com/Ayush_thelegend",
                                "https://threads.net/@examcompass"
                            ]
                        },
                        {
                            "@type": "WebSite",
                            "url": SITE_URL,
                            "name": "Exam Compass",
                            "description": "Free AI-powered exam preparation for JEE, NEET & CBSE",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": `${SITE_URL}/blog?q={search_term_string}`,
                                "query-input": "required name=search_term_string"
                            }
                        },
                        {
                            "@type": "FAQPage",
                            "mainEntity": [
                                {
                                    "@type": "Question",
                                    "name": "Is Exam Compass really free?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes, Exam Compass is 100% free. You get unlimited access to 9,000+ verified NTA PYQs, AI-generated mock tests, personalized study plans, and chapter-wise revision notes. No credit card required, no hidden fees."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Which exams does Exam Compass support?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Exam Compass supports JEE Main, JEE Advanced, NEET UG, and CBSE Board Exams for Classes 8, 9, 10, 11, and 12. All questions follow the latest NTA and CBSE syllabus patterns."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "How does AI help in exam preparation?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Our AI engine generates unlimited practice questions calibrated to your difficulty level, identifies weak topics through performance analytics, creates personalized study plans, and provides instant step-by-step solutions — all aligned with the latest exam patterns."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Are the questions based on the latest syllabus?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Yes. All 9,000+ questions are verified NTA Previous Year Questions from official JEE and NEET papers. AI-generated questions follow the exact latest CBSE/NTA syllabus and marking scheme."
                                    }
                                },
                                {
                                    "@type": "Question",
                                    "name": "Is Exam Compass better than coaching classes?",
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": "Exam Compass complements coaching by providing unlimited AI-powered practice that adapts to your weaknesses. Unlike coaching, you can practice anytime, get instant analytics on your performance, and focus on exactly the topics where you need improvement."
                                    }
                                }
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
                initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ duration: isMobile ? 0.3 : 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent origin-left"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                    {[
                        { label: "Verified NTA PYQs", value: "9,000+", numValue: 9000, suffix: "+", color: "from-primary to-purple-400", ref: pyqs },
                        { label: "AI Mock Tests", value: "Unlimited", isText: true, color: "from-cyan-400 to-blue-400" },
                        { label: "Syllabus Coverage", value: "100%", numValue: 100, suffix: "%", color: "from-emerald-400 to-teal-400", ref: coverage },
                        { label: "Price", value: "Always Free", isText: true, color: "from-orange-400 to-yellow-400" }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: isMobile ? 0 : i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-2 text-center md:text-left"
                        >
                            <div ref={stat.ref?.ref}>
                                <p className={`text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
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
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
                        className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight"
                    >
                        <TextReveal>The Science of Your Selection.</TextReveal>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        viewport={{ once: true }}
                        className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        <TextReveal delay={0.3}>We didn't build another quiz app. We built a Neural Framework that understands how you think, how you forget, and how you win.</TextReveal>
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        {
                            icon: <Target className="text-primary" size={32} />,
                            title: "Elo-Rank Calibration",
                            desc: "In Chess, your rank depends on who you beat. In Exam Compass, your rank depends on the Concept Difficulty. Calibrate your mastery in real-time.",
                            gradient: "from-primary/10 via-transparent to-transparent"
                        },
                        {
                            icon: <Brain className="text-secondary" size={32} />,
                            title: "Stochastic Diagnosis",
                            desc: "Failing Torque? We don't just say 'study more.' We trace your concept graph back to prerequisites like Vectors or Cross-Products to find the root-cause.",
                            gradient: "from-secondary/10 via-transparent to-transparent"
                        },
                        {
                            icon: <Zap className="text-cyan-400" size={32} />,
                            title: "Neural Decay Tracking",
                            desc: "Uses the SM-2 algorithm to predict when you'll forget a topic. We force-recirculate questions exactly when your neural pathways begin to fade.",
                            gradient: "from-cyan-400/10 via-transparent to-transparent"
                        }
                    ].map((feature, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 50, rotate: 1 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ delay: isMobile ? 0 : i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={isMobile ? {} : { y: -8, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
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
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent origin-center"
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-breathing" />
                
                <div className="text-center mb-24 relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6"
                    >
                        <TextReveal>Neural Infrastructure, Not Guesswork.</TextReveal>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-lg sm:text-xl text-gray-400"
                    >
                        <TextReveal delay={0.2}>While others give you scores, we give you a Strategy Engine. Experience the most technically sound prep in India.</TextReveal>
                    </motion.p>
                </div>
                
                <div className="space-y-8 relative z-10">
                    {/* Connecting line */}
                    <div className="absolute left-10 top-10 bottom-10 w-px bg-gradient-to-b from-primary/30 via-secondary/30 to-accent/30 hidden md:block" />
                    
                    {[
                        {
                            title: "Stochastic Calibration",
                            desc: "Our engine utilizes a Dynamic Elo-Rating system to tailor every session to your precise skill level. No generic banks—just precision-targeted challenges.",
                            icon: <Target className="text-primary" />,
                            step: "01"
                        },
                        {
                            title: "Neural Root-Cause Diagnosis",
                            desc: "Our Concept Graph maps mistakes to their deepest cognitive prerequisites. We identify if the foundation is cracked before you build higher.",
                            icon: <Brain className="text-secondary" />,
                            step: "02"
                        },
                        {
                            title: "Predictive Mastery Analytics",
                            desc: "Verify your readiness with NTA-pattern alignment and logarithmic rank forecasts. Stop guessing your rank—start measuring your neural data.",
                            icon: <Award className="text-accent" />,
                            step: "03"
                        }
                    ].map((step, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
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
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{step.title}</h3>
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
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
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
                    
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6">
                        <TextReveal>Ready to dominate your exams?</TextReveal>
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                        <TextReveal delay={0.3}>Join thousands of aspirants who chose precision over guesswork.</TextReveal>
                    </p>
                    
                    <motion.button
                        onClick={() => navigate(user && !user.isGuest ? '/dashboard' : '/login')}
                        whileHover={{ scale: 1.05, y: -4, boxShadow: "0px 10px 30px rgba(139, 92, 246, 0.4)" }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="px-6 sm:px-10 py-3 sm:py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg sm:text-xl animate-glow-pulse transition-all inline-flex items-center gap-3 group"
                    >
                        Start for Free <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </motion.button>
                    
                    <p className="text-sm text-gray-500 mt-6">No credit card required. Forever free tier.</p>
                </motion.div>
            </section>

            {/* ═══════════ FAQ SECTION — SEO Rich Results ═══════════ */}
            <section className="py-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl sm:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <p className="text-gray-400 text-lg">Everything students ask before starting their journey</p>
                </motion.div>
                <div className="space-y-3">
                    {[
                        { q: "Is Exam Compass really free?", a: "Yes, Exam Compass is 100% free. You get unlimited access to 9,000+ verified NTA PYQs, AI-generated mock tests, personalized study plans, and chapter-wise revision notes. No credit card required, no hidden fees." },
                        { q: "Which exams does Exam Compass support?", a: "Exam Compass supports JEE Main, JEE Advanced, NEET UG, and CBSE Board Exams for Classes 8, 9, 10, 11, and 12. All questions follow the latest NTA and CBSE syllabus patterns." },
                        { q: "How does AI help in exam preparation?", a: "Our AI engine generates unlimited practice questions calibrated to your difficulty level, identifies weak topics through performance analytics, creates personalized study plans, and provides instant step-by-step solutions — all aligned with the latest exam patterns." },
                        { q: "Are the questions based on the latest syllabus?", a: "Yes. All 9,000+ questions are verified NTA Previous Year Questions from official JEE and NEET papers. AI-generated questions follow the exact latest CBSE/NTA syllabus and marking scheme." },
                        { q: "Is Exam Compass better than coaching classes?", a: "Exam Compass complements coaching by providing unlimited AI-powered practice that adapts to your weaknesses. Unlike coaching, you can practice anytime, get instant analytics on your performance, and focus on exactly the topics where you need improvement." }
                    ].map((faq, i) => (
                        <details key={i} className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-purple-500/30 transition-colors">
                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-white text-lg select-none">
                                <span>{faq.q}</span>
                                <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform duration-300 shrink-0 ml-4" />
                            </summary>
                            <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                                {faq.a}
                            </div>
                        </details>
                    ))}
                </div>
            </section>

            <div className="flex justify-center pb-16">
                <AboutAuthor compact />
            </div>
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
            <Footer />
        </div>
    );
};
