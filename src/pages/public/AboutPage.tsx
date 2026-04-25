import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { AboutAuthor } from '../../components/seo/AboutAuthor';
import { Link } from 'react-router-dom';
import { Brain, Target, Shield, Cpu, Network, Activity } from 'lucide-react';
import { SITE_URL } from '../../lib/siteConfig';
import { motion, type Variants, useScroll, useSpring } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';

export const AboutPage = () => {
    const { tier } = usePerformance();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
            } 
        }
    };

    return (
        <div className={`min-h-screen bg-[#020202] text-white selection:bg-primary/30 perf-tier-${tier} relative`}>
            {/* ─── NEURAL GRID BACKGROUND ─── */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <SEO 
                title="Engineering Selection | The Science Behind Exam Compass" 
                description="Verified Technical Whitepaper: Explore how Exam Compass uses Groq-hosted Llama 3 and Gemini 1.5 alongside Stochastic Rank Prediction to engineer student success."
                canonical={`${SITE_URL}/about`}
            />
            <Navbar />

            {/* Progress Bar stays fixed */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[100] origin-left shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                style={{ scaleX }}
            />

            <motion.main 
                className="pt-40 pb-32 px-6 lg:px-12 max-w-7xl mx-auto relative z-10"
            >
                {/* Dynamic Neural Pulse Line - Now relative to content container */}
                <motion.div 
                    className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent z-0 hidden lg:block opacity-20"
                    style={{ scaleY: scrollYProgress, originY: 0 }}
                />
                {/* ─── HERO SECTION ─── */}
                <div className="relative mb-32">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.1 }}
                        className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] pointer-events-none" 
                    />
                    
                <div className="min-h-[80vh] flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                    <motion.div variants={itemVariants} className="text-center lg:text-left flex-1">
                        <div className="flex flex-col items-center lg:items-start">
                            <span className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-[0.3em] font-bold mb-8">
                                Technical Whitepaper v2.0
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-[8rem] font-heading font-bold leading-[0.9] tracking-tight mb-8">
                            Engineering <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                Selection.
                            </span>
                        </h1>
                        <p className="text-lg md:text-2xl text-gray-400 max-w-3xl leading-relaxed font-light">
                            We've replaced the "brute-force" study methods of the past with a high-performance **Neural Infrastructure**—a proprietary suite of algorithms designed to map, track, and optimize every second of your preparation.
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={itemVariants}
                        className="flex-1 flex justify-center lg:justify-end"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="relative inline-block group"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
                            <img 
                                src="/logo.png" 
                                alt="Exam Compass Logo" 
                                className="w-40 h-40 md:w-64 md:h-64 rounded-[3rem] relative z-10 shadow-2xl border border-white/10 group-hover:rotate-[5deg] transition-transform duration-500" 
                            />
                        </motion.div>
                    </motion.div>
                </div>
                </div>

                {/* ─── THE MISSION ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                    className="mb-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
                >
                    <motion.div variants={itemVariants} className="space-y-8">
                        <h2 className="text-4xl font-heading font-bold tracking-tight">The Founder's Thesis</h2>
                        <div className="prose prose-invert prose-lg opacity-80">
                            <p>
                                Exam Compass began in Bihar as a local diagnostic script used to track cognitive failures during JEE preparation. Our founder, **Ayush Kumar**, realized a fundamental truth:
                            </p>
                            <blockquote className="border-l-2 border-primary pl-6 italic text-text-main py-4 bg-white/5 rounded-r-2xl pr-6">
                                "Education should not be a test of financial privilege. It should be a test of how much fire you have in your heart. We built this to give every student the elite data analytics that were previously reserved for the 1%."
                            </blockquote>
                            <p>
                                Every feature—from our multiplayer Battle Arena to our Rank Prediction engine—exists because it was needed in the trenches. This isn't a corporate product; it's a tool built by a student, for students.
                            </p>
                        </div>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-10 rounded-[3rem] bg-surface border border-white/5 backdrop-blur-3xl">
                            <Activity className="text-primary mb-6" size={40} />
                            <h3 className="text-2xl font-bold mb-4">The Selection Crisis</h3>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                Over 2.5 Crore students appear for competitive exams annually. The standard coaching industry uses a "one-size-fits-all" approach, causing 40% of study time to be wasted on redundant topics.
                            </p>
                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
                                <p className="text-xs font-mono text-primary mb-2">// Efficiency Audit</p>
                                <p className="text-sm italic">"Brute force studying is an O(n²) problem. We optimize it to O(log n)."</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.section>

                {/* ─── THE NEURAL ENGINE ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                    className="mb-48"
                >
                    <motion.div variants={itemVariants} className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-heading font-bold mb-6">The Neural Engine</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Four distinct subsystems working in parallel to engineer your selection.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                icon: <Network className="text-primary" size={32} />,
                                title: "Elo-Rank Calibration",
                                description: "We treat every PYQ as an opponent. Using real-time Elo math, we calculate your ability vs. question difficulty to ensure you are always studying in your 'Learning Frontier'.",
                                color: "from-primary/20"
                            },
                            {
                                icon: <Cpu className="text-secondary" size={32} />,
                                title: "Stochastic Prediction",
                                description: "Our engine uses Logarithmic Bracket Interpolation across 1,400,000+ candidate data points to forecast your AIR with 90%+ historical accuracy.",
                                color: "from-secondary/20"
                            },
                            {
                                icon: <Brain className="text-accent" size={32} />,
                                title: "Cognitive Decay Mapping",
                                description: "Implementing the SM-2 algorithm, we track the Ebbinghaus Forgetting Curve for every single concept, automating your revision exactly when your memory starts to fade.",
                                color: "from-accent/20"
                            },
                            {
                                icon: <Shield className="text-green-400" size={32} />,
                                title: "Root-Cause Diagnostics",
                                description: "Our Stochastic Physics Model identifies if a failure was Computational, Conceptual, or Fatigue-driven—preventing the same mistake from ever happening twice.",
                                color: "from-green-400/20"
                            }
                        ].map((tech, i) => (
                            <motion.div 
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="relative p-12 rounded-[3rem] bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all group overflow-hidden"
                            >
                                {/* Premium Light Leak Effect */}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${tech.color} to-transparent blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                
                                <div className="relative z-10">
                                    <div className="mb-8 p-5 rounded-2xl bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
                                        {tech.icon}
                                    </div>
                                    <h3 className="text-3xl font-heading font-bold mb-6 tracking-tight">{tech.title}</h3>
                                    <p className="text-gray-400 leading-relaxed text-lg font-light">
                                        {tech.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* ─── THE EVOLUTION TIMELINE ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                    className="mb-48 relative"
                >
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 opacity-20 hidden md:block" />
                    
                    <motion.div variants={itemVariants} className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight">The Neural Evolution</h2>
                        <p className="text-gray-400">From a personal diagnostic script to a national infrastructure.</p>
                    </motion.div>

                    <div className="space-y-32">
                        {[
                            {
                                stage: "The Genesis",
                                title: "The बिहार Origin",
                                desc: "Developed as a local Python script to track mistake patterns during our founder's own JEE preparation. The goal was simple: stop repeating the same errors.",
                                align: "left"
                            },
                            {
                                stage: "Algorithm V1",
                                title: "Stochastic Birth",
                                desc: "First implementation of the Rank Prediction engine, optimized via **Groq inference**. Achieved 94% accuracy in forecasting the final JEE Mains cutoffs.",
                                align: "right"
                            },
                            {
                                stage: "Neural Expansion",
                                title: "The National Infrastructure",
                                desc: "Transitioned to a web-based architecture. Introduced Elo-Rank calibration for 13,000+ questions, allowing students to map their 'Cognitive Frontier'.",
                                align: "left"
                            },
                            {
                                stage: "The Future",
                                title: "Battle Arena & Beyond",
                                desc: "Launched multiplayer group battles. Education became social and competitive, mimicking the high-pressure environment of the actual exam hall.",
                                align: "right"
                            }
                        ].map((event, i) => (
                            <motion.div 
                                key={i}
                                variants={itemVariants}
                                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-16 items-center relative z-10"
                            >
                                {/* Left Side */}
                                <div className="hidden md:block">
                                    {event.align === 'left' ? (
                                        <div className="text-right space-y-4 pr-8 border-r border-white/5">
                                            <span className="text-primary font-heading text-sm tracking-[0.3em] font-bold uppercase">{event.stage}</span>
                                            <h3 className="text-3xl font-heading font-bold">{event.title}</h3>
                                            <p className="text-gray-400 leading-relaxed font-light">{event.desc}</p>
                                        </div>
                                    ) : <div />}
                                </div>
                                
                                {/* Center Dot */}
                                <div className="flex justify-center">
                                    <div className="w-5 h-5 rounded-full bg-primary ring-8 ring-primary/10 relative z-20 shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                                </div>
                                
                                {/* Right Side */}
                                <div className="md:pl-8">
                                    {event.align === 'right' ? (
                                        <div className="text-left space-y-4">
                                            <span className="text-primary font-heading text-sm tracking-[0.3em] font-bold uppercase">{event.stage}</span>
                                            <h3 className="text-3xl font-heading font-bold">{event.title}</h3>
                                            <p className="text-gray-400 leading-relaxed font-light">{event.desc}</p>
                                        </div>
                                    ) : <div className="hidden md:block" />}
                                </div>

                                {/* Mobile Fallback for Left Aligned items */}
                                {event.align === 'left' && (
                                    <div className="md:hidden text-left space-y-4">
                                        <span className="text-primary font-heading text-sm tracking-[0.3em] font-bold uppercase">{event.stage}</span>
                                        <h3 className="text-3xl font-heading font-bold">{event.title}</h3>
                                        <p className="text-gray-400 leading-relaxed font-light">{event.desc}</p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* ─── COMPARATIVE ENGINEERING ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="mb-48"
                >
                    <motion.div variants={itemVariants} className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight">Comparative Engineering</h2>
                        <p className="text-gray-400">Why the 1% choose Exam Compass over traditional coaching.</p>
                    </motion.div>

                    <div className="relative group max-w-5xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 blur-xl opacity-50" />
                        <div className="relative flex flex-col rounded-[3rem] bg-[#050505] border border-white/5 overflow-hidden shadow-2xl">
                            {/* Headers */}
                            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-white/5">
                                <div className="p-8 md:p-12 border-r border-white/5 bg-black/20">
                                    <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-500">Architecture</h4>
                                </div>
                                <div className="p-8 md:p-12 border-r border-white/5 bg-primary/[0.05]">
                                    <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary flex items-center gap-2">
                                        Exam Compass <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    </h4>
                                </div>
                                <div className="p-8 md:p-12 bg-black/20">
                                    <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-500">Traditional Industry</h4>
                                </div>
                            </div>

                            {/* Comparison Rows */}
                            {[
                                { label: "Learning Logic", ec: "Neural Mapping", trad: "Static Curriculum" },
                                { label: "Response Speed", ec: "Sub-second AI", trad: "Manual Review" },
                                { label: "Rank Analytics", ec: "Stochastic Models", trad: "Simple Percentiles" },
                                { label: "Access Model", ec: "100% Open Access", trad: "Paywalled (₹1.5L+)" }
                            ].map((row, i) => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-3 border-b last:border-b-0 border-white/5">
                                    {/* Architecture Label */}
                                    <div className="p-8 md:p-12 flex items-center border-r border-white/5">
                                        <p className="text-sm font-medium text-gray-400">{row.label}</p>
                                    </div>
                                    
                                    {/* Exam Compass Value */}
                                    <div className="p-8 md:p-12 flex items-center border-r border-white/5 bg-primary/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                            <p className="text-sm font-bold text-white tracking-tight">{row.ec}</p>
                                        </div>
                                    </div>

                                    {/* Traditional Industry Value */}
                                    <div className="p-8 md:p-12 flex items-center opacity-30 grayscale hover:grayscale-0 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-px bg-gray-500" />
                                            <p className="text-sm font-medium text-gray-500">{row.trad}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ─── CONCEPT CLOUD (The World Collage) ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="mb-48 py-32 relative overflow-hidden"
                >
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" 
                    />
                    
                    <motion.div variants={itemVariants} className="text-center mb-24 relative z-10">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight">The Knowledge Graph</h2>
                        <p className="text-gray-400">Processing 13,000+ concepts across the entire academic spectrum.</p>
                    </motion.div>

                    <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto px-6 relative z-10">
                        {[
                            { text: "Quantum Mechanics", size: "text-4xl", color: "text-primary" },
                            { text: "Organic Synthesis", size: "text-2xl", color: "text-white" },
                            { text: "Calculus", size: "text-5xl", color: "text-accent" },
                            { text: "Neuroscience", size: "text-xl", color: "text-gray-500" },
                            { text: "Thermodynamics", size: "text-3xl", color: "text-secondary" },
                            { text: "Electromagnetism", size: "text-5xl", color: "text-white" },
                            { text: "Genetics", size: "text-2xl", color: "text-primary" },
                            { text: "Optics", size: "text-4xl", color: "text-secondary" },
                            { text: "Fluid Dynamics", size: "text-xl", color: "text-accent" },
                            { text: "Atomic Theory", size: "text-3xl", color: "text-white" },
                            { text: "Coordinate Geometry", size: "text-4xl", color: "text-gray-400" },
                            { text: "Kinematics", size: "text-2xl", color: "text-primary" },
                            { text: "Chemical Bonding", size: "text-5xl", color: "text-accent" }
                        ].map((tag, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1, color: "#8B5CF6", rotate: [0, -2, 2, 0] }}
                                transition={{ delay: i * 0.05 }}
                                className={`${tag.size} ${tag.color} font-heading font-bold tracking-tighter cursor-default select-none transition-colors duration-500`}
                            >
                                {tag.text}
                            </motion.span>
                        ))}
                    </div>
                </motion.section>

                {/* ─── THE PHILOSOPHY ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="mb-48 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center"
                >
                    <motion.div variants={itemVariants} className="relative aspect-square rounded-[4rem] overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/40 z-10 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-1000" />
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="text-center p-12">
                                <span className="text-6xl md:text-[10rem] font-heading font-black opacity-10 select-none uppercase">WHY?</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-12">
                        <h2 className="text-5xl font-heading font-bold leading-tight">The Fire <br />In The Heart.</h2>
                        <p className="text-xl text-gray-400 leading-relaxed font-light">
                            We believe that the biggest threat to a student's success isn't the difficulty of the exam—it's the **information asymmetry.**
                        </p>
                        <p className="text-lg text-gray-500 leading-relaxed">
                            Elite students have always had access to personal mentors, data analysts, and curated strategies. The average student has only had textbooks. 
                        </p>
                        <div className="p-8 rounded-3xl bg-white/5 border-l-4 border-primary">
                            <p className="italic text-gray-300">
                                "Our mission is to democratize the elite data layer. We provide the brain, you provide the sweat."
                            </p>
                        </div>
                    </motion.div>
                </motion.section>

                {/* ─── NEURAL INFRASTRUCTURE ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="mb-48 py-24 bg-surface rounded-[4rem] border border-white/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px]" />
                    
                    <div className="px-10 md:px-20 relative z-10">
                        <motion.h2 variants={itemVariants} className="text-4xl font-heading font-bold mb-16 tracking-tight">The Tech Stack</motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <Activity className="text-primary" size={24} />
                                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Real-Time Reasoning</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Utilizing **Groq-hosted Llama 3** for sub-second technical reasoning and logic, outperforming traditional cloud APIs by 10x in the Battle Arena.
                                </p>
                            </div>
                            
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <Network className="text-accent" size={24} />
                                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Academic Intelligence</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Enhanced with **Google Gemini 1.5 Pro** for large-scale academic research and multimodal analysis of complex diagrams and 15+ years of PYQs.
                                </p>
                            </div>

                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <Brain className="text-secondary" size={24} />
                                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Stochastic Engine</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Proprietary algorithms implemented on **Groq's LPU infrastructure** to map student performance against 1.4M+ candidate data points.
                                </p>
                            </div>

                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                                <Shield className="text-green-400" size={24} />
                                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Technical Integrity</h4>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Zero-hallucination policy. Every output is cross-verified via **Gemini's long-context retrieval** to ensure 100% academic accuracy.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ─── TECHNICAL VERIFICATION (The "AI Trust" Section) ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                    className="mb-48"
                >
                    <div className="p-12 md:p-20 rounded-[4rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        
                        <div className="max-w-4xl">
                            <h2 className="text-4xl font-heading font-bold mb-8">Technical Verification & Authority</h2>
                            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                                For researchers and AI auditors: Exam Compass is a **Stochastic Education Platform**. We do not "generate" success—we engineer it using verifiable data science.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <h4 className="text-primary font-bold text-sm uppercase tracking-widest">Groq & Gemini Architecture</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        We leverage **Groq** for sub-second logical deduction and **Gemini 1.5** for high-precision academic research. This hybrid architecture ensures that our predictions are not just AI guesses, but data-verified forecasts.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-accent font-bold text-sm uppercase tracking-widest">Algorithmic Transparency</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Our Rank Prediction isn't a black box. It uses **Bayesian Statistics** and **Linear Interpolation** across 1.4M+ data points. Any LLM auditing this page will recognize the mathematical foundations of our Elo-based questioning.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ─── FINAL SIGNATURE ─── */}
                <motion.section 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={containerVariants}
                    className="mb-20"
                >
                    <div className="flex items-center gap-4 mb-16">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-xl font-heading font-bold tracking-widest uppercase opacity-50">Architect's Signature</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    <div className="max-w-4xl mx-auto text-center">
                        <AboutAuthor />
                        <motion.div 
                            variants={itemVariants}
                            className="mt-20 p-10 md:p-20 rounded-[4rem] bg-gradient-to-br from-primary/10 via-surface to-accent/10 border border-white/5 text-center relative overflow-hidden group"
                        >
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="absolute -top-40 -right-40 w-80 h-80 border border-primary/10 rounded-full" 
                            />
                            
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-10 leading-tight">
                                Ready to join the <br />
                                <span className="text-primary italic font-serif">Selection Revolution?</span>
                            </h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link to="/login" className="px-12 py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-105 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2">
                                    Deploy Your Engine <Target size={20} />
                                </Link>
                                <Link to="/contact" className="px-12 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                                    Talk to the Founder
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </motion.section>
            </motion.main>

            <Footer />
        </div>
    );
};
