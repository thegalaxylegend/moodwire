import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../data/blogs';

const EXAM_LINKS = [
    { label: 'JEE Main & Advanced', to: '/jee-mains' },
    { label: 'NEET UG', to: '/neet' },
    { label: 'Class 12 Boards', to: '/class-12' },
    { label: 'Class 11 Boards', to: '/class-11' },
    { label: 'Class 10 Boards', to: '/class-10' },
    { label: 'Class 9 Foundation', to: '/class-9' },
    { label: 'Class 8 Foundation', to: '/class-8' },
];

export const Navbar = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isExamsOpen, setIsExamsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const filterRef = useRef<HTMLDivElement>(null);
    const examsRef = useRef<HTMLDivElement>(null);

    // Simple scroll listener — no per-frame GPU work
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
            if (examsRef.current && !examsRef.current.contains(event.target as Node)) {
                setIsExamsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdowns when location changes
    useEffect(() => {
        setIsFilterOpen(false);
        setIsExamsOpen(false);
        setIsMobileMenuOpen(false);
    }, [location]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav 
            className={`fixed top-0 left-0 w-full z-50 border-b border-white/10 transition-colors duration-300 ${
                scrolled 
                    ? 'bg-black/95 backdrop-blur-md' 
                    : 'bg-black/80 backdrop-blur-sm'
            } h-16 md:h-20`}
        >
            <div 
                className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-full"
            >
                <Link to="/" className="text-xl md:text-2xl font-bold text-white tracking-tighter shrink-0 mr-4">
                    Exam<span className="text-[#a855f7]">Compass</span>
                </Link>

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden flex flex-col gap-1.5 p-2 focus:outline-none z-[60]"
                >
                    <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                    <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-3 md:gap-6">
                    {/* Exams Dropdown */}
                    <div className="relative" ref={examsRef}>
                        <button
                            onClick={() => setIsExamsOpen(!isExamsOpen)}
                            className="flex items-center gap-1 md:gap-2 text-sm md:text-base text-gray-400 hover:text-white font-medium transition-colors group focus:outline-none"
                        >
                            <span>Exams</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16" height="16"
                                viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isExamsOpen ? 'rotate-180' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isExamsOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute top-full left-0 mt-4 w-52 glass-card bg-[#0a0a0a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                            >
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/90 border-t border-l border-white/10 rotate-45" />
                                <div className="p-2 relative z-10">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Popular Exams
                                    </div>
                                    {EXAM_LINKS.map((exam, i) => (
                                        <motion.div
                                            key={exam.to}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                to={exam.to}
                                                className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                            >
                                                {exam.label}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-1 md:gap-2 text-sm md:text-base text-gray-400 hover:text-white font-medium transition-colors group focus:outline-none"
                        >
                            <span>Filter</span>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" height="16" 
                                viewBox="0 0 24 24" fill="none" 
                                stroke="currentColor" strokeWidth="2" 
                                strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isFilterOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute top-full left-0 mt-4 w-64 glass-card bg-[#0a0a0a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                            >
                                {/* Dropdown Arrow */}
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/90 border-t border-l border-white/10 rotate-45" />
                                
                                <div className="p-2 max-h-[400px] overflow-y-auto relative z-10">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Categories
                                    </div>
                                    <Link
                                        to="/blog"
                                        className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                    >
                                        All Articles
                                    </Link>
                                    {CATEGORIES.map((category, i) => (
                                        <motion.div
                                            key={category}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <Link
                                                to={`/blog?category=${encodeURIComponent(category)}`}
                                                className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                            >
                                                {category}
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <Link to="/blog" className="text-sm md:text-base text-gray-300 hover:text-white font-medium transition-colors">
                        Blog
                    </Link>
                    <Link 
                        to="/login" 
                        rel="nofollow" 
                        className="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-lg shadow-white/5"
                    >
                        Login
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ 
                    opacity: isMobileMenuOpen ? 1 : 0,
                    height: isMobileMenuOpen ? 'auto' : 0 
                }}
                className="md:hidden bg-[#050505] border-b border-white/5 overflow-hidden"
            >
                <div className="px-6 py-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Exams</p>
                        <div className="grid grid-cols-1 gap-2">
                            {EXAM_LINKS.slice(0, 4).map(exam => (
                                <Link key={exam.to} to={exam.to} className="text-gray-300 hover:text-white p-2 rounded-xl bg-white/5 transition-colors">
                                    {exam.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <Link to="/blog" className="text-lg font-bold text-white px-2">Blog</Link>
                    <Link 
                        to="/login" 
                        className="w-full py-4 text-center rounded-2xl bg-white text-black font-extrabold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-transform"
                    >
                        Login
                    </Link>
                </div>
            </motion.div>
        </nav>
    );
};

