import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, MotionValue, AnimatePresence, useMotionValue } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';
import { SITE_URL } from '../../lib/siteConfig';
import { useRef, useState, useEffect } from 'react';

import { 
    Terminal, 
    Instagram, 
    Twitter, 
    Linkedin, 
    BookOpen, 
    Flame, 
    Sparkles, 
    CornerDownLeft, 
    Share2, 
    ArrowUpRight, 
    ChevronRight,
    Github,
    Activity,
    Target,
    Heart,
    Lightbulb,
    Gamepad2,
    Smartphone,
    TrendingUp,
    Globe,
    Award
} from 'lucide-react';



// ─── RETRO CLI TERMINAL EMULATOR ───
interface TerminalLine {
    text: string;
    type: 'input' | 'output' | 'error' | 'success';
}

const CliTerminal = () => {
    const [lines, setLines] = useState<TerminalLine[]>([
        { text: 'initializing ayush-neural-shell v1.0.4...', type: 'output' },
        { text: 'credentials loaded: Ayush Kumar [Founder]', type: 'success' },
        { text: 'type "help" to list branding endpoints.', type: 'output' },
    ]);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: Record<string, string[]> = {
        help: [
            'Available system endpoints:',
            '  about     - Core biographical intelligence',
            '  stack     - Tech infrastructure running ExamCompass',
            '  vision    - The Bihar selection thesis',
            '  social    - Founder connection links',
            '  clear     - Wipe buffer logs'
        ],
        about: [
            'Name: Ayush Kumar',
            'Role: Founder & Lead Student Developer',
            'Origin: Darbhanga, Bihar, India',
            'Bio: A Class 12 student at KV Darbhanga who got tired of the lack of elite prep metrics in',
            '     traditional coaching. Built ExamCompass to democratize stochastic analytics for JEE/NEET.'
        ],
        stack: [
            'ExamCompass Neural Architecture:',
            '  - Language: TypeScript / JSX',
            '  - UI Engine: React 19 / TailwindCSS / Framer Motion',
            '  - 3D Layer: Three.js / React Three Fiber',
            '  - Inference: Groq LPU (Llama 3 sub-second logic)',
            '  - Context Layer: Google Gemini 1.5 Pro API',
            '  - Backend: Cloudflare Workers / Firebase'
        ],
        vision: [
            '"Education should not be a test of financial privilege. It should be a test of how much fire',
            ' you have in your heart. We built this to give every student the elite data analytics that',
            ' were previously reserved for the 1%."'
        ],
        social: [
            'Social handles mapped successfully:',
            '  - Instagram: @mr._.ayush_kr (Click Instagram card below)',
            '  - Twitter (X): @Ayush_thelegend (Click X card below)'
        ]
    };

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = inputValue.trim().toLowerCase();
        if (!cmd) return;

        const newLines = [...lines, { text: `ayush@examcompass:~$ ${inputValue}`, type: 'input' as const }];

        if (cmd === 'clear') {
            setLines([]);
            setInputValue('');
            return;
        }

        if (commands[cmd]) {
            commands[cmd].forEach(lineText => {
                newLines.push({
                    text: lineText,
                    type: lineText.startsWith('  -') ? 'success' : 'output'
                });
            });
        } else {
            newLines.push({
                text: `shell: command not found: "${inputValue}". Try typing "help".`,
                type: 'error'
            });
        }

        setLines(newLines);
        setInputValue('');
    };

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [lines]);

    const handleContainerClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="w-full rounded-2xl bg-black/85 border border-purple-500/20 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono text-xs md:text-sm">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10 select-none">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors" />
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <Terminal size={12} className="text-purple-400" /> CLI Terminal v1.0.4
                </div>
                <div className="flex items-center gap-2 select-none">
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                    </span>
                    <span className="text-[9px] text-purple-400 font-bold tracking-wider font-mono">ONLINE</span>
                </div>
            </div>

            {/* Content area */}
            <div 
                ref={containerRef}
                onClick={handleContainerClick}
                className="p-6 h-64 overflow-y-auto space-y-2 text-left cursor-text bg-black/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-500/40 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
                {lines.map((line, idx) => (
                    <div 
                        key={idx} 
                        className="leading-relaxed text-xs md:text-sm font-mono"
                    >
                        {line.type === 'input' ? (
                            <div className="flex items-center gap-2">
                                <span className="text-purple-400 font-bold shrink-0 select-none">ayush@examcompass:~$</span>
                                <span className="text-white font-bold">{line.text.replace(/^ayush@examcompass:~\$\s*/, '')}</span>
                            </div>
                        ) : (
                            <div className={
                                line.type === 'success' ? 'text-green-400' :
                                line.type === 'error' ? 'text-red-400 animate-pulse' : 'text-purple-200/90'
                            }>
                                {line.text}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input form - Enhanced visual boundaries */}
            <form onSubmit={handleCommandSubmit} className="flex flex-col gap-2 px-6 py-4 bg-white/[0.01] border-t border-white/5">
                <div className="text-[10px] text-purple-400/50 uppercase tracking-wider font-bold select-none px-1">
                    Terminal Command Input
                </div>
                <div 
                    onClick={handleContainerClick}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-950/20 border border-purple-500/50 hover:border-purple-400/80 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/35 shadow-[0_0_15px_rgba(168,85,247,0.08)] focus-within:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all duration-300 cursor-text"
                >
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs md:text-sm font-bold font-mono select-none shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                        ayush@examcompass:~$
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 bg-transparent text-white outline-none border-none caret-purple-400 py-1 text-xs md:text-sm placeholder-purple-400/30 font-mono"
                        placeholder="Enter command (e.g. 'help')"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-purple-400/40 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 font-sans tracking-wide select-none md:inline-block hidden">
                            Enter ↵
                        </span>
                        <button 
                            type="submit" 
                            className="text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500 border border-purple-500/20 hover:border-purple-400 rounded-lg p-1.5 transition-all duration-200 flex items-center justify-center hover:shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                            title="Run command"
                        >
                            <CornerDownLeft size={14} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// ─── SCROLL TENSION ANCHORED SECTION ───
const ScrollLinkedSection = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
    return (
        <motion.section
            id={id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.02, margin: "0px 0px -50px 0px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { 
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                        staggerChildren: 0.12, 
                        delayChildren: 0.1 
                    }
                }
            }}
            className={`w-full relative ${className}`}
        >
            {children}
        </motion.section>
    );
};

// ─── HERO CINEMATIC PARALLAX SECTION ───
const HeroScrollSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });
    
    const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
    
    const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
    const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

    return (
        <section ref={ref} className="w-full relative" style={{ position: 'relative' }}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
                    }
                }}
                style={{
                    opacity: smoothOpacity,
                    scale: smoothScale
                }}
                className={`w-full h-full ${className}`}
            >
                {children}
            </motion.div>
        </section>
    );
};


// ─── FOUNDER PROFILE PORTRAIT WIDGET ───
// ─── FOUNDER PROFILE PORTRAIT WIDGET ───
const PortraitCard = ({ onClick }: { scrollYProgress?: MotionValue<number>; onClick?: () => void }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const rectRef = useRef<DOMRect | null>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Smooth spring parameters for 3D tilt
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 150, damping: 20 });
    const imgScale = useSpring(1, { stiffness: 150, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        let rect = rectRef.current;
        if (!rect) {
            if (!cardRef.current) return;
            rect = cardRef.current.getBoundingClientRect();
            rectRef.current = rect;
        }
        
        // Calculate mouse coordinates relative to center (-0.5 to 0.5)
        const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
        const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
        
        x.set(mouseX);
        y.set(mouseY);
    };

    const handleMouseEnter = () => {
        if (cardRef.current) {
            rectRef.current = cardRef.current.getBoundingClientRect();
        }
        imgScale.set(1.05);
    };

    const handleMouseLeave = () => {
        rectRef.current = null;
        x.set(0);
        y.set(0);
        imgScale.set(1);
    };

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ perspective: '1200px' }}
            className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square relative cursor-pointer"
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                className="w-full h-full rounded-[2.5rem] bg-gradient-to-b from-purple-500/15 via-white/[0.02] to-transparent border border-white/10 backdrop-blur-md overflow-hidden relative group shadow-[0_30px_60px_-15px_rgba(168,85,247,0.15)]"
            >
                {/* Photo rendering (Pristine, 100% natural full-color) */}
                <div className="absolute inset-0 z-0" style={{ transform: "translateZ(0px)" }}>
                    <motion.img 
                        src="/founder.jpg" 
                        alt="Ayush Kumar - Founder" 
                        style={{ scale: imgScale }}
                        className="w-full h-full object-cover object-[center_15%]"
                    />
                    
                    {/* Glowing highlight tracking hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-white/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                    
                    {/* Subtle outer glow effect inside the border */}
                    <div className="absolute inset-0 border-[3px] border-transparent group-hover:border-purple-500/20 rounded-[2.5rem] transition-colors duration-500 pointer-events-none z-20" />
                </div>
            </motion.div>
        </div>
    );
};
interface FaqItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
    {
        question: "Who is the founder of ExamCompass?",
        answer: "ExamCompass was founded by Ayush Kumar, a self-taught Class 12 student developer at Kendriya Vidyalaya (KV) Darbhanga, Bihar. Ayush designed and coded the entire platform to empower JEE and NEET aspirants with elite, data-driven diagnostic tools."
    },
    {
        question: "What inspired Ayush Kumar to build ExamCompass?",
        answer: "While preparing for JEE himself, Ayush struggled to balance 7-8 hours of school at KV Darbhanga with hours of online lectures (formerly Byju's and YouTube self-study, later Physics Wallah). He realized that traditional coaching platforms lacked precise, personalized diagnostics and honest feedback, which led him to engineer a tool built by a student, for students."
    },
    {
        question: "What is the origin story of ExamCompass?",
        answer: "The concept originated at the AI Vidya Setu Hackathon at IIT Delhi (IHFC), where Ayush and his team secured Zonal 5th / National Finalist. However, they lost in the Nationals due to presentation skills. Refusing to let the idea die, this setback fueled Ayush to build and launch the platform independently, turning his vision of EdTech democratization into reality."
    },
    {
        question: "What is the mission of ExamCompass?",
        answer: "The mission of ExamCompass is to democratize the elite data layer of competitive exam preparation. By offering top-tier diagnostic tests, predictive syllabus analytics, and fatigue-aware scheduling entirely for free, ExamCompass levels the academic playing field for every student, regardless of financial privilege."
    }
];

// ─── MAIN PORTFOLIO PAGE ───
export const FounderPage = () => {
    const { tier } = usePerformance();
    const { scrollYProgress } = useScroll();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isFounderModalOpen, setIsFounderModalOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [selectedSkill, setSelectedSkill] = useState<{
        icon: React.ReactNode;
        modalIcon: React.ReactNode;
        title: string;
        desc: string;
        longDesc: string;
        color: string;
        glowColor: string;
        stats: { label: string; value: string }[];
    } | null>(null);

    useEffect(() => {
        // Force scroll to top on page mount / refresh
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        // Clear hash so reload doesn't trigger scroll to element
        if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    const skillsData = [
        {
            icon: <Gamepad2 className="text-purple-400" size={24} />,
            modalIcon: <Gamepad2 className="text-purple-400" size={40} />,
            title: "Gaming Enthusiast",
            desc: "6.5+ years of Free Fire. Active in Genshin Impact and Wuthering Waves.",
            longDesc: "For over six years, gaming has been my primary method of tactical decompression and cognitive conditioning. Competing in high-pressure matches in Free Fire has sharpened my rapid decision-making, reflexes, and strategic positioning. Now, exploring the vast open worlds of Genshin Impact and Wuthering Waves, I appreciate the intricate mechanics, detailed game design, and backend scaling that make these massive virtual environments run smoothly. I treat gaming not as a distraction, but as a mental gymnasium for engineering analytical strategies.",
            color: "text-purple-400",
            glowColor: "from-purple-500/20 to-purple-500/0 border-purple-500/30 shadow-purple-500/20",
            stats: [
                { label: "Experience", value: "6.5+ Years" },
                { label: "Active Titles", value: "Genshin, WuWa, Free Fire" },
                { label: "Cognitive Skill", value: "Real-time Tactics" }
            ]
        },
        {
            icon: <Globe className="text-sky-400" size={24} />,
            modalIcon: <Globe className="text-sky-400" size={40} />,
            title: "Web Developer",
            desc: "Built ExamCompass and recently built thedarbhangatable.pages.dev in a 16-hour sprint for a friend.",
            longDesc: "Coding is my superpower. I engineered the entire frontend, responsive design, state management, and real-time multiplayer features of ExamCompass using TypeScript, React 19, TailwindCSS, and Firebase. Recently, when a close friend needed a professional web presence for a local business, I pulled a relentless 16-hour coding sprint to build and deploy thedarbhangatable.pages.dev from scratch. I build clean, performance-optimized, and beautiful software architectures that deliver delightful user experiences on any device.",
            color: "text-sky-400",
            glowColor: "from-sky-500/20 to-sky-500/0 border-sky-500/30 shadow-sky-500/20",
            stats: [
                { label: "Main Stack", value: "React, Vite, TS, Tailwind" },
                { label: "Sprint Record", value: "16-Hr Project Launch" },
                { label: "Live Platforms", value: "ExamCompass & others" }
            ]
        },
        {
            icon: <TrendingUp className="text-green-400" size={24} />,
            modalIcon: <TrendingUp className="text-green-400" size={40} />,
            title: "Market Trader",
            desc: "Active trading and analyzing trends in both Forex and the Indian Stock Market.",
            longDesc: "Finance and mathematics intersect beautifully in the markets. I am an active technical trader who studies price action, chart patterns, and liquidity cycles. Whether analyzing currency pairs in the high-leverage Foreign Exchange (Forex) market or analyzing index trends in the Indian Stock Market (NSE/BSE), I rely strictly on stochastic indicators, Fibonacci levels, and solid risk management. This data-driven, probabilistic mindset is the exact foundation I used when structuring the adaptive scoring system and rank predictive graphs for ExamCompass.",
            color: "text-green-400",
            glowColor: "from-green-500/20 to-green-500/0 border-green-500/30 shadow-green-500/20",
            stats: [
                { label: "Markets", value: "Forex & Indian Equities" },
                { label: "Strategy", value: "Stochastic & Price Action" },
                { label: "Overlap", value: "Predictive Analytics" }
            ]
        },
        {
            icon: <Smartphone className="text-pink-400" size={24} />,
            modalIcon: <Smartphone className="text-pink-400" size={40} />,
            title: "Tech & Media",
            desc: "Deep knowledge of the smartphone industry and video editing via CapCut.",
            longDesc: "I have had a deep fascination with tech hardware since 2019, when I started investigating the internal specs, custom ROMs, and processor designs on my father's old smartphone. I follow mobile hardware engineering, silicon chips, and software optimization closely. To share my insights and convey complex ideas, I master advanced mobile video editing using CapCut. I focus on high-fidelity pacing, dynamic sound design, keyframe transitions, and professional color correction to create high-impact, visual-first storytelling.",
            color: "text-pink-400",
            glowColor: "from-pink-500/20 to-pink-500/0 border-pink-500/30 shadow-pink-500/20",
            stats: [
                { label: "Hardware Focus", value: "SoCs, Thermals, Display Tech" },
                { label: "Editing Tool", value: "CapCut (Advanced)" },
                { label: "Content Goal", value: "High-Impact Videos" }
            ]
        }
    ];
    
    // Scale & translation animations for ambient gradient blobs mapped to scroll
    const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 250]);
    const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -250]);
    const blob3Y = useTransform(scrollYProgress, [0, 1], [0, 100]);
    
    const blob1Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.25, 0.85]);
    const blob2Scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 1.2]);

    // Scale animations mapped to scroll for progress bar
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });



    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
            } 
        }
    };

    const timelineVariantsEven = {
        hidden: { 
            opacity: 0, 
            x: typeof window !== 'undefined' && window.innerWidth < 640 ? -30 : -80, 
            scale: 0.97,
            rotate: -0.5
        },
        visible: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotate: 0,
            transition: { 
                type: "spring" as const,
                stiffness: 90,
                damping: 22,
                mass: 0.7
            } 
        }
    };

    const timelineVariantsOdd = {
        hidden: { 
            opacity: 0, 
            x: typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 80, 
            scale: 0.97,
            rotate: 0.5
        },
        visible: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotate: 0,
            transition: { 
                type: "spring" as const,
                stiffness: 90,
                damping: 22,
                mass: 0.7
            } 
        }
    };

    const storyVariantsLeft = {
        hidden: { 
            opacity: 0, 
            x: typeof window !== 'undefined' && window.innerWidth < 640 ? -30 : -100, 
            scale: 0.97,
            rotate: -0.5
        },
        visible: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotate: 0,
            transition: { 
                type: "spring" as const,
                stiffness: 75,
                damping: 20,
                mass: 0.7
            } 
        }
    };

    const storyVariantsRight = {
        hidden: { 
            opacity: 0, 
            x: typeof window !== 'undefined' && window.innerWidth < 640 ? 30 : 100, 
            scale: 0.97,
            rotate: 0.5
        },
        visible: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotate: 0,
            transition: { 
                type: "spring" as const,
                stiffness: 75,
                damping: 20,
                mass: 0.7
            } 
        }
    };

    return (
        <div className={`min-h-screen bg-[#030206] text-white selection:bg-purple-500/30 perf-tier-${tier} relative overflow-hidden`}>
            
            {/* ─── SEO HEADERS ─── */}
            <SEO 
                title="Ayush Kumar | Founder of ExamCompass" 
                description="Meet Ayush Kumar, the student developer who built ExamCompass — a state-of-the-art AI-powered JEE/NEET diagnostics platform from Darbhanga, Bihar."
                canonical={`${SITE_URL}/founder`}
            />

            {/* Person structured E-E-A-T Schema for Google search visibility */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": "Ayush Kumar",
                    "url": `${SITE_URL}/founder`,
                    "jobTitle": "Founder & Lead Student Developer",
                    "gender": "Male",
                    "nationality": "Indian",
                    "knowsLanguage": ["Hindi", "English"],
                    "sameAs": [
                        "https://x.com/Ayush_thelegend",
                        "https://www.instagram.com/mr._.ayush_kr",
                        "https://www.linkedin.com/in/ayush-kumar-a23260401",
                        "https://github.com/thegalaxylegend"
                    ],
                    "birthPlace": {
                        "@type": "Place",
                        "name": "Bihar, India"
                    },
                    "alumniOf": {
                        "@type": "EducationalOrganization",
                        "name": "Kendriya Vidyalaya Darbhanga",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": "Darbhanga",
                            "addressRegion": "Bihar",
                            "addressCountry": "IN"
                        }
                    },
                    "worksFor": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": SITE_URL
                    },
                    "homeLocation": {
                        "@type": "Place",
                        "name": "Darbhanga, Bihar, India"
                    },
                    "description": "Student developer from Bihar who engineered ExamCompass - a revolutionary AI-powered diagnostic exam engine to level the academic playing field.",
                    "knowsAbout": [
                        "JEE Mains & Advanced Prep",
                        "NEET Prep",
                        "AI EdTech Platforms",
                        "TypeScript React Engineering",
                        "Performance-Adaptive Web Design",
                        "Stochastic Preparation Analytics",
                        "Educational Technology",
                        "Machine Learning & LLMs"
                    ]
                })}
            </script>

            <Navbar />

            {/* Smooth Top Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-sky-400 z-[45] origin-left shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                style={{ scaleX }}
            />

            {/* ─── AMBIENT BACKGROUND GLOW BLOBS (Scroll Linked) ─── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Purple Blob */}
                <motion.div 
                    style={{ y: blob1Y, scale: blob1Scale }}
                    className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] rounded-full bg-purple-500/10 blur-[120px]"
                />
                {/* Sky Blue Blob */}
                <motion.div 
                    style={{ y: blob2Y, scale: blob2Scale }}
                    className="absolute top-[40%] right-[-10%] w-[35vw] h-[35vw] min-w-[350px] min-h-[350px] rounded-full bg-sky-500/10 blur-[130px]"
                />
                {/* Pink/Magenta Blob */}
                <motion.div 
                    style={{ y: blob3Y }}
                    className="absolute top-[75%] left-[15%] w-[25vw] h-[25vw] min-w-[250px] min-h-[250px] rounded-full bg-pink-500/5 blur-[100px]"
                />
            </div>



            {/* Subtle grid pattern overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:32px_32px] animate-grid-pan" />

            {/* ─── PAGE MAIN CONTENT ─── */}
            <motion.main 
                className="pt-24 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto relative z-10 space-y-20 md:space-y-40"
            >
                {/* ─── HERO HEADER SECTION (1:1 Ratio Strict Grid with Parallax Floating Badges) ─── */}
                <HeroScrollSection className="min-h-[80vh] md:min-h-[85vh] grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-center pt-6 md:pt-8 relative">

                    <motion.div 
                        variants={itemVariants} 
                        className="order-1 md:order-1 text-center md:text-left space-y-5 md:space-y-8"
                    >
                        <div className="flex flex-col items-center md:items-start">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-black mb-3 md:mb-4">
                                <Flame size={11} className="text-purple-400 animate-pulse" /> The Selection Revolution
                            </span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[6.5rem] font-heading font-black tracking-tight leading-[0.9] md:leading-[0.88] text-white">
                            A Student's <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400">
                                Code to Win.
                            </span>
                        </h1>
                        
                        <p className="text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl leading-relaxed font-light">
                            My name is <strong className="text-white">Ayush Kumar</strong>. I am a JEE Aspirant from Darbhanga, Bihar. 
                            I got tired of high-fee coaching models and built <strong className="text-white">ExamCompass</strong> to democratize elite-level algorithmic testing. 
                            This isn't a corporate EdTech product—it's an infrastructure designed in the trenches, built for students, by a student.
                        </p>

                        {/* Buttons — desktop only; on mobile they appear BELOW the portrait card as order-3 */}
                        <div className="hidden md:flex flex-row items-center justify-start gap-3 pt-2 md:pt-4">
                            <a href="#terminal" className="px-6 md:px-8 py-3.5 md:py-4 bg-purple-600 text-white rounded-2xl font-bold text-sm hover:scale-[1.03] hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2">
                                Launch Shell <Terminal size={16} />
                            </a>
                            <a href="#timeline" className="px-6 md:px-8 py-3.5 md:py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                                Discover the Journey <ChevronRight size={16} />
                            </a>
                        </div>
                    </motion.div>

                    {/* Staggered Portrait Widget & Separate Details Card */}
                    <motion.div 
                        variants={itemVariants} 
                        className="order-2 md:order-2 flex flex-col items-center md:items-end gap-4 md:gap-6 w-full max-w-xs sm:max-w-sm md:max-w-none mx-auto md:mx-0"
                    >
                        <PortraitCard scrollYProgress={scrollYProgress} onClick={() => setIsFounderModalOpen(true)} />
                        
                        {/* Separated pristine branding box */}
                        <div 
                            className="w-full max-w-md group cursor-pointer"
                        >
                            <div
                                className="w-full rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4 shadow-2xl relative overflow-hidden text-left transition-all duration-300 ease-out group-hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {/* Ambient background glow inside the detail box */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-sky-500/10 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                                
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[9px] uppercase tracking-widest font-extrabold text-purple-300">
                                            Founder & Architect
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Online" />
                                            <span className="text-[9px] text-green-400 font-mono tracking-wider font-bold">SYSTEM ONLINE</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 leading-none">
                                            AYUSH KUMAR
                                        </h3>
                                        <p className="text-xs font-semibold text-white/70">
                                            Student Architect of the Neural Engine
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[9px] uppercase font-mono tracking-wider text-gray-400">
                                        <span>Loc: Darbhanga, BR</span>
                                        <span className="flex items-center gap-1 text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                                            Verified Profile <Sparkles size={12} className="text-purple-400 animate-pulse" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile-only buttons — appear BELOW portrait+name card, ABOVE next section */}
                    <motion.div
                        variants={itemVariants}
                        className="order-3 md:hidden flex flex-col sm:flex-row items-center justify-center gap-3 w-full"
                    >
                        <a href="#terminal" className="w-full sm:w-auto px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-bold text-sm hover:scale-[1.03] hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-2">
                            Launch Shell <Terminal size={16} />
                        </a>
                        <a href="#timeline" className="w-full sm:w-auto px-6 py-3.5 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            Discover the Journey <ChevronRight size={16} />
                        </a>
                    </motion.div>

                </HeroScrollSection>

                {/* ─── THE VISION THESIS ─── */}
                <ScrollLinkedSection className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        variants={itemVariants}
                        className="space-y-6 lg:order-2"
                    >
                        <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            The Stochastic <br />Founder's Thesis
                        </h2>
                        
                        <div className="prose prose-invert opacity-80 leading-relaxed space-y-6 text-gray-300">
                            <p>
                                Preparing for the joint entrance exam is one of the most high-stakes environments in the world. 
                                Standard coachings sell thousands of lectures but completely fail to diagnose a student's cognitive blind spots.
                            </p>
                            <blockquote className="border-l-4 border-purple-500 pl-6 italic text-white py-2 bg-purple-500/5 rounded-r-2xl pr-4">
                                "High-fee coaching institutions shouldn't be the gatekeeper to premium analytics. I designed the stochastic rank predictive module so a child from the most remote block of Bihar has the same data-caliber preparation as the wealthiest 1%."
                            </blockquote>
                            <p>
                                We mapped every past-year question as an active opponent using real-time Elo calibrations. 
                                We treat learning as an adaptive search graph.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        variants={itemVariants}
                        className="relative group lg:order-1"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-sky-500/20 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                        <div className="relative p-8 md:p-12 rounded-[2.5rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl space-y-8">
                            <div className="p-4 rounded-xl bg-purple-500/10 w-fit">
                                <BookOpen className="text-purple-400" size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Optimizing the Learning Graph</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Standard education systems run on a brute force O(n) lecture delivery model. 
                                ExamCompass tracks memory decay and cognitive errors stochastically to provide an **O(log n) algorithmic frontier**.
                            </p>
                            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-[11px] text-purple-300">
                                <span className="text-gray-500">// Diagnostic Log V1.0</span>
                                <p className="mt-1">"Efficiency is not about hours studied; it is about cognitive failures corrected per cycle."</p>
                            </div>
                        </div>
                    </motion.div>
                </ScrollLinkedSection>

                {/* ─── INTERACTIVE SHELL SECTION ─── */}
                <ScrollLinkedSection id="terminal" className="space-y-12">
                    <motion.div variants={itemVariants} className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            System Terminal
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Interact directly with the branding database of the developer shell.
                        </p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
                        <CliTerminal />
                    </motion.div>
                </ScrollLinkedSection>

                {/* ─── SYSTEM COMMIT LOG (EVOLUTION TIMELINE) ─── */}
                <ScrollLinkedSection id="timeline" className="space-y-16">
                    <motion.div variants={itemVariants} className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-[10px] uppercase tracking-[0.3em] font-black mb-2">
                            <Terminal size={12} className="text-purple-400" /> System Changelog
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            The Neural Evolution
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            From a local diagnostic script to a high-capacity algorithmic engine.
                        </p>
                    </motion.div>

                    <div className="space-y-6 max-w-4xl mx-auto">
                        {[
                            {
                                version: "v0.1.0-alpha",
                                module: "Genesis_Core",
                                title: "Darbhanga Script Genesis",
                                date: "Mid 2025",
                                desc: "Struggling with JEE preparation formulas and error frequency, Ayush designs a local Python command-line utility to record and catalog computational vs. conceptual errors.",
                                logs: [
                                    "> initializing python local env... OK",
                                    "> cataloging computational errors... DONE",
                                    "> rendering local terminal output... SUCCESS"
                                ]
                            },
                            {
                                version: "v0.8.0-beta",
                                module: "Stochastic_Logic",
                                title: "Model Calibration",
                                date: "Late 2025",
                                desc: "Integrates Groq LPU inference processing and Llama 3 APIs to evaluate mathematical steps in real-time, providing immediate cognitive diagnostic logs.",
                                logs: [
                                    "> booting Groq LPU inference pipeline... 9ms latency",
                                    "> authenticating Llama 3 API keys... AUTHORIZED",
                                    "> running stochastic evaluation test... PASS"
                                ]
                            },
                            {
                                version: "v1.0.0-rc",
                                module: "Web_Deployment",
                                title: "Going Public on pages.dev",
                                date: "Early 2026",
                                desc: "Deploys custom high-end UI dashboards with state management, active performance scaling tiers, and multiplayer cognitive gaming nodes (Battle Arena).",
                                logs: [
                                    "> compiling React 19 + Vite bundle... 450ms",
                                    "> deploying to Cloudflare edge network... LIVE",
                                    "> connecting multiplayer Firebase nodes... SECURED"
                                ]
                            },
                            {
                                version: "v2.0.0-live",
                                module: "National_Scale",
                                title: "Empowering 25,000+ Students",
                                date: "Ongoing",
                                desc: "Scaling modular custom syllabus trackers, Ebbinghaus active revision frameworks, and robust SEO infrastructure to maximize student reach nationwide.",
                                logs: [
                                    "> scaling database clusters for high load... ACTIVE",
                                    "> monitoring Ebbinghaus curve algorithms... OPTIMAL",
                                    "> establishing continuous integration... STANDBY"
                                ]
                            }
                        ].map((node, idx) => {
                            const isEven = idx % 2 === 0;
                            return (
                                <motion.div 
                                    key={idx}
                                    variants={isEven ? timelineVariantsEven : timelineVariantsOdd}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                                    whileHover={tier === 'low' ? undefined : "hover"}
                                    className="w-full relative group bg-transparent"
                                    style={{ willChange: "transform, opacity" }}
                                >
                                    <motion.div
                                        variants={{
                                            initial: { 
                                                scale: 1, 
                                                borderColor: "rgba(255, 255, 255, 0.05)", 
                                                backgroundColor: "rgba(10, 10, 12, 1)" 
                                            },
                                            visible: { 
                                                scale: 1, 
                                                borderColor: "rgba(255, 255, 255, 0.05)", 
                                                backgroundColor: "rgba(10, 10, 12, 1)" 
                                            },
                                            hover: { 
                                                scale: 1.01, 
                                                borderColor: "rgba(168, 85, 247, 0.3)", 
                                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                                                transition: { type: "spring", stiffness: 400, damping: 25 }
                                            }
                                        }}
                                        initial="initial"
                                        className="relative p-5 md:p-8 rounded-[1.5rem] border flex flex-col md:flex-row gap-5 md:gap-10 overflow-hidden shadow-2xl w-full"
                                    >
                                        {/* Left Accent Bar */}
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-white/5 group-hover:bg-gradient-to-b group-hover:from-purple-400 group-hover:to-sky-400 transition-all duration-500" />
                                        
                                        {/* Ambient Background Glow */}
                                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/0 group-hover:bg-purple-500/5 rounded-full blur-3xl transition-all duration-700 pointer-events-none" />

                                        {/* Metadata / Left Column */}
                                        <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-start gap-3 md:gap-2 md:space-y-4 font-mono select-none">
                                            <div className="inline-block px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] md:text-[11px] font-bold tracking-widest border border-purple-500/20 shrink-0">
                                                {node.version}
                                            </div>
                                            <div className="flex flex-row md:flex-col gap-1 md:gap-1">
                                                <div className="text-gray-600 text-[9px] md:text-[10px] tracking-wider uppercase">DATE: {node.date}</div>
                                                <div className="text-gray-600 text-[9px] md:text-[10px] tracking-wider uppercase hidden sm:block">MOD: {node.module}</div>
                                            </div>
                                        </div>

                                        {/* Content / Right Column */}
                                        <div className="flex-1 space-y-3 md:space-y-4 relative z-10">
                                            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{node.title}</h3>
                                            <p className="text-sm text-gray-400 leading-relaxed font-light">
                                                {node.desc}
                                            </p>
                                            
                                            {/* Terminal Execution Block */}
                                            <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-gray-400 space-y-1.5 shadow-inner">
                                                {node.logs.map((log, lIdx) => (
                                                    <div key={lIdx} className="flex gap-2 items-start">
                                                        <span className="text-purple-500/50 mt-0.5"><ChevronRight size={12} /></span>
                                                        <span>
                                                            {log.split('...')[0]}... 
                                                            {log.split('...')[1] && (
                                                                <span className={log.includes('OK') || log.includes('SUCCESS') || log.includes('PASS') || log.includes('LIVE') || log.includes('SECURED') || log.includes('ACTIVE') || log.includes('OPTIMAL') ? 'text-green-400 font-bold ml-2' : 'text-purple-400 font-bold ml-2'}>
                                                                    {log.split('...')[1]}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ScrollLinkedSection>

                {/* ─── ABOUT THE FOUNDER / THE ORIGIN STORY ─── */}
                <ScrollLinkedSection className="space-y-16">
                    <motion.div variants={itemVariants} className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-300 text-[10px] uppercase tracking-[0.3em] font-black mb-2">
                            <Activity size={12} className="text-sky-400" /> About Ayush Kumar
                        </div>
                        <h2 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            The Student Behind ExamCompass
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            My journey didn't start in Silicon Valley. It started in Darbhanga, Bihar, navigating the intense pressure of the Indian education system.
                        </p>
                    </motion.div>

                    {/* STORY BLOCK 1: The Spark & The Struggle */}
                    <motion.div 
                        variants={storyVariantsLeft} 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.05, margin: "0px 0px -50px 0px" }}
                        whileHover={tier === 'low' ? undefined : "hover"}
                        className="max-w-5xl mx-auto w-full mb-6 md:mb-8 group relative bg-transparent"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <motion.div
                            variants={{
                                initial: { scale: 1, borderColor: "rgba(255, 255, 255, 0.05)" },
                                visible: { scale: 1, borderColor: "rgba(255, 255, 255, 0.05)" },
                                hover: { 
                                    scale: 1.01, 
                                    borderColor: "rgba(14, 165, 233, 0.3)",
                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                }
                            }}
                            initial="initial"
                            className="p-6 md:p-12 rounded-[2rem] bg-white/[0.02] border relative overflow-hidden w-full"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-sky-500/10 transition-colors duration-700" />
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Sparkles className="text-sky-400" /> The Struggle & The Shift
                                </h3>
                                <div className="text-gray-400 leading-relaxed font-light text-sm md:text-base space-y-4">
                                    <p>
                                        I am currently a Class 12 student at Kendriya Vidyalaya (KV) and studying for the JEE at Physics Wallah (PW). My educational journey took a sharp turn in the middle of Class 10. After studying at Byju's from 6th to 10th grade, their centers abruptly closed down. Losing trust in massive coaching institutes, I took matters into my own hands and self-studied the entirety of my 10th grade via YouTube.
                                    </p>
                                    <p>
                                        By the end of Class 11, the pressure peaked. I couldn't manage 7-8 hours of school followed by 4-5 hours of PW lectures. The gap between 10th and 11th grade is massive, and balancing it all was a nightmare. I realized I needed a smarter way to track my syllabus, manage my time, and analyze my mock tests. That struggle was the original spark.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* STORY BLOCK 2: The Tech Journey & Hackathon */}
                    <motion.div 
                        variants={storyVariantsRight} 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.05, margin: "0px 0px -50px 0px" }}
                        whileHover={tier === 'low' ? undefined : "hover"}
                        className="max-w-5xl mx-auto w-full mb-6 md:mb-8 group relative bg-transparent"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <motion.div
                            variants={{
                                initial: { scale: 1, borderColor: "rgba(255, 255, 255, 0.05)" },
                                visible: { scale: 1, borderColor: "rgba(255, 255, 255, 0.05)" },
                                hover: { 
                                    scale: 1.01, 
                                    borderColor: "rgba(168, 85, 247, 0.3)",
                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                }
                            }}
                            initial="initial"
                            className="p-6 md:p-12 rounded-[2rem] bg-white/[0.02] border relative overflow-hidden w-full"
                        >
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Award className="text-purple-400" /> The Hackathon Heartbreak
                                </h3>
                                <div className="text-gray-400 leading-relaxed font-light text-sm md:text-base space-y-4">
                                    <p>
                                        My interest in tech started in 2019, experimenting with my father's 2017 smartphone and watching YouTube videos about RAM, ROM, and tech internals. I learned the basics of coding in 9th and 10th grade, and in 11th, I officially chose CS over Hindi.
                                    </p>
                                    <p>
                                        The real turning point came when I participated in the <strong className="text-white">AI Vidya Setu Hackathon</strong> organized by IHFC IIT Delhi. We secured the 5th position in the Guwahati Zonal round and advanced to the Nationals. I was prepared to code as a UI/UX designer for 6 straight hours, but I realized AI tools were allowed. I recognized instantly that AI wasn't cheating—it was a massive productivity multiplier.
                                    </p>
                                    <p>
                                        In the National Round, my 5-member team split our efforts (2-2-1) to build three different websites. The project we got was named <strong>ExamCompass</strong>. We built it and submitted it to the officials, but unfortunately, we lost out on the Top 3 due to a lack of public speaking and presentation skills. But losing only fueled me. I decided right then to take the ExamCompass concept and build it into something massive on my own.
                                    </p>
                                </div>
                                
                                {/* Certification & Medals Image Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5">
                                    {/* National Certificate Scanned */}
                                    <div className="relative aspect-[4/3] cursor-pointer">
                                        <motion.div
                                            whileHover={tier === 'low' ? undefined : { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                                            onClick={() => setSelectedImage('/images/certificate-flat.jpg')}
                                            className="rounded-xl overflow-hidden border border-white/10 shadow-2xl w-full h-full relative"
                                        >
                                            <img src="/images/certificate-flat.jpg" alt="AI Vidya Setu National Certificate Scanned" className="w-full h-full object-contain bg-black/40 p-2" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider relative z-10">National Finalist Certificate</span>
                                            </div>
                                        </motion.div>
                                    </div>
                                    
                                    {/* National Finalist Held */}
                                    <div className="relative aspect-[4/3] cursor-pointer">
                                        <motion.div
                                            whileHover={tier === 'low' ? undefined : { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                                            onClick={() => setSelectedImage('/images/certificate-held.jpg')}
                                            className="rounded-xl overflow-hidden border border-white/10 shadow-2xl w-full h-full relative"
                                        >
                                            <img src="/images/certificate-held.jpg" alt="AI Vidya Setu National Certificate Ceremony" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider">National Finalist (Ceremony)</span>
                                            </div>
                                        </motion.div>
                                    </div>
                                    
                                    {/* National Medals */}
                                    <div className="relative aspect-[4/3] cursor-pointer">
                                        <motion.div
                                            whileHover={tier === 'low' ? undefined : { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                                            onClick={() => setSelectedImage('/images/medals.jpg')}
                                            className="rounded-xl overflow-hidden border border-white/10 shadow-2xl w-full h-full relative"
                                        >
                                            <img src="/images/medals.jpg" alt="IHFC IIT Delhi Bronze Medals" className="w-full h-full object-cover object-[center_20%]" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider">National Medals</span>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </ScrollLinkedSection>

                {/* ─── HOBBIES & SKILLS SECTION ─── */}
                <ScrollLinkedSection className="space-y-10 md:space-y-16">
                    <motion.div variants={itemVariants} className="text-center space-y-3 md:space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-pink-300 text-[10px] uppercase tracking-[0.3em] font-black mb-2">
                            <Flame size={12} className="text-pink-400" /> Beyond Textbooks
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            Skills & Ventures
                        </h2>
                        <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
                            I strongly believe in learning useful, real-life skills—not just book knowledge. My day is fully packed with school and JEE prep, but from 8 PM to 10 PM, I grind on my passions.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {skillsData.map((hobby, idx) => (
                            <motion.div 
                                key={idx}
                                variants={itemVariants}
                                whileHover={tier === 'low' ? undefined : "hover"}
                                onClick={() => setSelectedSkill(hobby)}
                                className="relative cursor-pointer group bg-transparent h-full"
                                style={{ willChange: "transform" }}
                            >
                                <motion.div
                                    variants={{
                                        initial: { y: 0, scale: 1, borderColor: "rgba(255, 255, 255, 0.05)", backgroundColor: "rgba(255, 255, 255, 0.02)" },
                                        visible: { y: 0, scale: 1, borderColor: "rgba(255, 255, 255, 0.05)", backgroundColor: "rgba(255, 255, 255, 0.02)" },
                                        hover: { 
                                            y: -8, 
                                            scale: 1.02, 
                                            borderColor: "rgba(168, 85, 247, 0.2)", 
                                            backgroundColor: "rgba(168, 85, 247, 0.02)",
                                            transition: { type: "spring", stiffness: 400, damping: 25 }
                                        }
                                    }}
                                    initial="initial"
                                    className="p-6 rounded-[1.5rem] border relative text-left h-full w-full"
                                >
                                    <div className="p-3 rounded-xl bg-white/5 w-fit mb-4 text-white group-hover:bg-purple-500/10 transition-colors">
                                        {hobby.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{hobby.title}</h3>
                                    <p className="text-gray-400 text-xs leading-relaxed font-light">{hobby.desc}</p>
                                    <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-purple-400/80 group-hover:text-purple-400 transition-colors">
                                        <span>Explore Details</span>
                                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollLinkedSection>

                {/* ─── THE MANIFESTO / CORE BELIEFS ─── */}
                <ScrollLinkedSection className="space-y-10 md:space-y-16">
                    <motion.div variants={itemVariants} className="text-center space-y-3 md:space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-[10px] uppercase tracking-[0.3em] font-black mb-2">
                            <Target size={12} className="text-purple-400" /> The Manifesto
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            Core Beliefs & Vision
                        </h2>
                        <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto">
                            ExamCompass wasn't built to be a tech showcase. It was built because I deeply believe that world-class education infrastructure should not be guarded by exorbitant coaching fees.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Heart className="text-pink-400" size={24} />,
                                title: "Democratizing Access",
                                desc: "No student should fail to reach their potential simply because they couldn't afford a premium coaching institute's personalized feedback mechanism."
                            },
                            {
                                icon: <Lightbulb className="text-yellow-400" size={24} />,
                                title: "Data Over Intuition",
                                desc: "Guessing where you are weak is a luxury we can't afford. Hard data, stochastic modeling, and relentless error-tracking are the only ways to guarantee success."
                            },
                            {
                                icon: <BookOpen className="text-sky-400" size={24} />,
                                title: "Student-First Design",
                                desc: "Built from the perspective of an actual aspirant in the trenches. No corporate fluff, just the exact tools needed to track syllabus progress and crush the JEE."
                            }
                        ].map((belief, idx) => (
                            <motion.div 
                                key={idx}
                                variants={itemVariants}
                                whileHover={tier === 'low' ? undefined : "hover"}
                                className="relative group bg-transparent h-full"
                                style={{ willChange: "transform" }}
                            >
                                <motion.div
                                    variants={{
                                        initial: { y: 0, scale: 1, borderColor: "rgba(255, 255, 255, 0.05)", backgroundColor: "rgba(255, 255, 255, 0.02)" },
                                        visible: { y: 0, scale: 1, borderColor: "rgba(255, 255, 255, 0.05)", backgroundColor: "rgba(255, 255, 255, 0.02)" },
                                        hover: { 
                                            y: -8, 
                                            scale: 1.02, 
                                            borderColor: "rgba(168, 85, 247, 0.2)", 
                                            backgroundColor: "rgba(168, 85, 247, 0.02)",
                                            transition: { type: "spring", stiffness: 400, damping: 25 }
                                        }
                                    }}
                                    initial="initial"
                                    className="p-8 rounded-[2rem] border overflow-hidden relative text-left h-full w-full"
                                >
                                    <div className="absolute -right-16 -top-16 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                                    <div className="p-4 rounded-xl bg-white/5 w-fit mb-6 text-white group-hover:bg-purple-500/10 transition-colors">
                                        {belief.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{belief.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed font-light">{belief.desc}</p>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </ScrollLinkedSection>

                {/* ─── VIRAL SOCIAL HANDLES SECTION ─── */}
                <ScrollLinkedSection className="space-y-10 md:space-y-16">
                    <motion.div variants={itemVariants} className="text-center space-y-3 md:space-y-4">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black tracking-tight text-white">
                            Connect & Collaborate
                        </h2>
                        <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto">
                            Follow my coding outputs and personal branding handles. Let's build the future together.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: <Instagram size={28} className="text-pink-400" />,
                                name: "Instagram",
                                handle: "@mr._.ayush_kr",
                                url: "https://www.instagram.com/mr._.ayush_kr",
                                border: "group-hover:border-pink-500/30",
                                shadow: "shadow-pink-500/5",
                                bg: "bg-gradient-to-br from-pink-500/5 to-transparent",
                                hoverGlow: "rgba(236, 72, 153, 0.15)"
                            },
                            {
                                icon: <Twitter size={28} className="text-sky-400" />,
                                name: "Twitter (X)",
                                handle: "@Ayush_thelegend",
                                url: "https://x.com/Ayush_thelegend",
                                border: "group-hover:border-sky-500/30",
                                shadow: "shadow-sky-500/5",
                                bg: "bg-gradient-to-br from-sky-500/5 to-transparent",
                                hoverGlow: "rgba(14, 165, 233, 0.15)"
                            },
                            {
                                icon: <Linkedin size={28} className="text-teal-400" />,
                                name: "LinkedIn",
                                handle: "Ayush Kumar",
                                url: "https://www.linkedin.com/in/ayush-kumar-a23260401?utm_source=share_via&utm_content=profile&utm_medium=member_android",
                                border: "group-hover:border-teal-500/30",
                                shadow: "shadow-teal-500/5",
                                bg: "bg-gradient-to-br from-teal-500/5 to-transparent",
                                hoverGlow: "rgba(20, 184, 166, 0.15)"
                            },
                            {
                                icon: <Github size={28} className="text-purple-400" />,
                                name: "GitHub",
                                handle: "thegalaxylegend",
                                url: "https://github.com/thegalaxylegend",
                                border: "group-hover:border-purple-500/30",
                                shadow: "shadow-purple-500/5",
                                bg: "bg-gradient-to-br from-purple-500/5 to-transparent",
                                hoverGlow: "rgba(168, 85, 247, 0.15)"
                            }
                        ].map((social, idx) => (
                            <motion.a 
                                key={idx}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variants={itemVariants}
                                whileHover={tier === 'low' ? undefined : "hover"}
                                className="relative block h-40 md:h-48 group bg-transparent"
                            >
                                <motion.div
                                    variants={{
                                        initial: { 
                                            y: 0, 
                                            scale: 1, 
                                            borderColor: "rgba(255, 255, 255, 0.05)", 
                                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                                            boxShadow: "0 0 0 rgba(0,0,0,0)"
                                        },
                                        visible: { 
                                            y: 0, 
                                            scale: 1, 
                                            borderColor: "rgba(255, 255, 255, 0.05)", 
                                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                                            boxShadow: "0 0 0 rgba(0,0,0,0)"
                                        },
                                        hover: { 
                                            y: -8, 
                                            scale: 1.02, 
                                            borderColor: social.name === "Instagram" ? "rgba(236, 72, 153, 0.3)" : 
                                                         social.name === "Twitter (X)" ? "rgba(14, 165, 233, 0.3)" : 
                                                         social.name === "LinkedIn" ? "rgba(20, 184, 166, 0.3)" : 
                                                         "rgba(168, 85, 247, 0.3)",
                                            backgroundColor: social.name === "Instagram" ? "rgba(236, 72, 153, 0.05)" : 
                                                             social.name === "Twitter (X)" ? "rgba(14, 165, 233, 0.05)" : 
                                                             social.name === "LinkedIn" ? "rgba(20, 184, 166, 0.05)" : 
                                                             "rgba(168, 85, 247, 0.05)",
                                            boxShadow: `0 20px 40px -15px ${social.hoverGlow}`,
                                            transition: { type: "spring", stiffness: 400, damping: 25 }
                                        }
                                    }}
                                    initial="initial"
                                    className="p-4 md:p-8 rounded-[2rem] relative overflow-hidden border flex flex-col justify-between h-full text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="p-2.5 md:p-3.5 rounded-2xl bg-white/5 text-white group-hover:bg-white/10 transition-colors">
                                            {social.icon}
                                        </div>
                                        <ArrowUpRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest">{social.name}</h4>
                                        <p className="text-sm md:text-lg font-bold text-white group-hover:text-purple-300 transition-colors break-all md:break-normal">{social.handle}</p>
                                    </div>
                                </motion.div>
                            </motion.a>
                        ))}
                    </div>
                </ScrollLinkedSection>
                {/* ─── QUICK FACTS & FAQ SECTION (AEO/SEO Powerhouse) ─── */}
                <ScrollLinkedSection className="space-y-12">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-[10px] uppercase tracking-[0.2em] font-black">
                            <Lightbulb size={11} className="text-yellow-400 animate-pulse" /> Answer Engine Optimization (AEO)
                        </span>
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-white leading-tight">
                            FAQ & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">Neural Index</span>
                        </h2>
                        <p className="text-sm md:text-base text-gray-400 font-light">
                            Quick intelligence reports compiled for search engines, LLM crawlers, and curious minds.
                        </p>
                    </div>

                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            "mainEntity": FAQ_ITEMS.map(item => ({
                                "@type": "Question",
                                "name": item.question,
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": item.answer
                                }
                            }))
                        })}
                    </script>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {FAQ_ITEMS.map((item, index) => {
                            const isOpen = openFaqIndex === index;
                            return (
                                <div 
                                    key={index}
                                    className="rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md overflow-hidden hover:border-purple-500/20 transition-colors"
                                >
                                    <button
                                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                    >
                                        <span className="text-sm md:text-lg font-bold text-white hover:text-purple-300 transition-colors">
                                            {item.question}
                                        </span>
                                        <motion.span
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="text-purple-400 ml-4 shrink-0"
                                        >
                                            <ChevronRight size={20} />
                                        </motion.span>
                                    </button>
                                    
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                            >
                                                <div className="px-6 pb-6 pt-1 text-xs md:text-sm text-gray-400 leading-relaxed font-light border-t border-white/5 bg-white/[0.005]">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </ScrollLinkedSection>

                {/* ─── BOTTOM CTA WRAPPER ─── */}
                <ScrollLinkedSection className="p-7 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-sky-500/10 border border-purple-500/20 text-center relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[250px] md:h-[350px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <motion.div 
                        variants={itemVariants}
                        className="relative z-10 max-w-2xl mx-auto space-y-6 md:space-y-8"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black text-white leading-tight">
                            Democratize the Elite <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
                                Data Layer.
                            </span>
                        </h2>
                        
                        <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light">
                            Want to examine the algorithms or join the selection community? Let's connect and win. 
                            Education belongs to the learners.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                            <Link to="/login" className="w-full sm:w-auto px-7 md:px-10 py-3.5 md:py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm md:text-base rounded-2xl shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.03] flex items-center justify-center gap-2">
                                Launch Platform <CornerDownLeft size={16} />
                            </Link>
                            <Link to="/contact" className="w-full sm:w-auto px-7 md:px-10 py-3.5 md:py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm md:text-base rounded-2xl transition-all flex items-center justify-center gap-2">
                                Get In Touch <Share2 size={16} />
                            </Link>
                        </div>
                    </motion.div>
                </ScrollLinkedSection>

            </motion.main>

            <Footer />

            {/* LIGHTBOX MODAL */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-12"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedImage} 
                            alt="Full screen certificate" 
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-md rounded-full p-3 transition-all"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FOUNDER DETAIL MODAL */}
            <AnimatePresence>
                {isFounderModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 md:p-8"
                        onClick={() => setIsFounderModalOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-4xl bg-[#09070f]/95 border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-[0_0_80px_rgba(168,85,247,0.2)] flex flex-col md:flex-row text-left max-h-[90vh] md:max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-500/20 [&::-webkit-scrollbar-thumb]:rounded-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Glow accent */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-sky-500/5 to-transparent opacity-40 pointer-events-none" />

                            {/* Left Image Area */}
                            <div className="w-full md:w-2/5 shrink-0 bg-black/40 relative aspect-square md:aspect-auto border-b md:border-b-0 md:border-r border-white/5 overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center p-6 md:p-8">
                                    <div className="w-full h-full rounded-[2rem] border border-white/10 overflow-hidden relative bg-black/50 shadow-2xl">
                                        <img 
                                            src="/founder.jpg" 
                                            alt="Ayush Kumar" 
                                            className="w-full h-full object-cover scale-105"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Information Area */}
                            <div className="flex-1 p-8 md:p-10 relative z-10 flex flex-col justify-between gap-6 overflow-y-auto">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[9px] uppercase tracking-widest font-extrabold text-purple-300">
                                            Verified System Architect
                                        </span>
                                        <button 
                                            className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full p-2 transition-all border border-white/10"
                                            onClick={() => setIsFounderModalOpen(false)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-sky-400 leading-none">
                                            AYUSH KUMAR
                                        </h3>
                                        <p className="text-xs font-semibold text-white/60">
                                            Founder of ExamCompass | Lead Developer
                                        </p>
                                    </div>
                                </div>

                                {/* Story/Bio */}
                                <div className="space-y-4 font-sans text-gray-300 leading-relaxed font-light text-sm">
                                    <p>
                                        From Darbhanga, Bihar, Ayush is a Class 12 student at KV school who simultaneously manages full-stack TypeScript engineering and intense JEE preparation. 
                                    </p>
                                    <p>
                                        In Class 10, when his coaching center closed due to bankruptcy, he self-studied the entire syllabus via YouTube. That self-reliance sparked a passion for building platforms. He went on to lead his team to the Nationals at the IIT Delhi AI Vidya Setu Hackathon and created ExamCompass to make elite diagnostics free for all.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 font-sans border-t border-white/5 pt-6">
                                    {[
                                        { label: "ACADEMICS", value: "Class 12 (KV & PW)" },
                                        { label: "ORIGIN", value: "Darbhanga, Bihar" },
                                        { label: "CORE SKILLS", value: "React, TS, Vite, Firebase" },
                                        { label: "IMPACT", value: "25,000+ Students Reached" }
                                    ].map((stat, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold font-mono">{stat.label}</div>
                                            <div className="text-xs font-bold text-white leading-tight">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SKILL DETAIL MODAL */}
            <AnimatePresence>
                {selectedSkill && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-8"
                        onClick={() => setSelectedSkill(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-2xl bg-black/90 border border-white/10 rounded-[2rem] backdrop-blur-2xl overflow-hidden relative shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative background glow based on skill color */}
                            <div className={`absolute inset-0 bg-gradient-to-b ${selectedSkill.glowColor} opacity-20 pointer-events-none`} />

                            <div className="p-8 md:p-10 relative z-10 flex flex-col justify-between h-full gap-6">
                                {/* Top bar with Icon and Close Button */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-fit text-white">
                                            {selectedSkill.modalIcon}
                                        </div>
                                        <div>
                                            <span className="px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] uppercase tracking-[0.2em] font-black text-purple-300">
                                                Skill Profile
                                            </span>
                                            <h3 className="text-2xl md:text-3xl font-heading font-black text-white mt-1">
                                                {selectedSkill.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <button 
                                        className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full p-2.5 transition-all border border-white/10"
                                        onClick={() => setSelectedSkill(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                {/* Detailed Description */}
                                <div className="space-y-4">
                                    <p className="text-gray-300 leading-relaxed font-light text-sm md:text-base">
                                        {selectedSkill.longDesc}
                                    </p>
                                </div>

                                {/* Key Highlights Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 font-sans">
                                    {selectedSkill.stats.map((stat, sIdx) => (
                                        <div key={sIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-mono">{stat.label}</div>
                                            <div className="text-xs font-bold text-white leading-tight">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FounderPage;

