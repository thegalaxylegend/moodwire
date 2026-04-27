import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(new URLSearchParams(location.search).get('q') || '');
    const filterRef = useRef<HTMLDivElement>(null);
    const examsRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sync search query when url changes
    useEffect(() => {
        const q = new URLSearchParams(location.search).get('q');
        if (q !== null) {
            setSearchQuery(q);
        }
    }, [location.search]);

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
        setIsMobileSearchOpen(false);
    }, [location]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);

    // Lock body scroll when mobile menu is open — viewport aware
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobileMenuOpen && isMobile) {
            document.documentElement.classList.add('menu-open');
        } else {
            document.documentElement.classList.remove('menu-open');
        }
    }, [isMobileMenuOpen]);

    return (
        <nav 
            className={`fixed top-0 left-0 w-full z-50 border-b border-white/5 transition-colors duration-300 ${
                scrolled 
                    ? 'bg-black/95 backdrop-blur-md' 
                    : 'bg-black/80 backdrop-blur-sm'
            } h-16 md:h-20`}
        >
            <div 
                className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-full"
            >
                {/* Logo */}
                <Link 
                    to="/" 
                    className="text-xl md:text-2xl font-bold text-white tracking-tighter shrink-0 mr-4"
                >
                    Exam<span className="text-[#a855f7]">Compass</span>
                </Link>

                {/* Mobile Actions */}
                <div className="flex items-center gap-1 md:hidden z-[60]">
                    <button
                        onClick={() => {
                            setIsMobileSearchOpen(true);
                            setIsMobileMenuOpen(false);
                            setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-full"
                        aria-label="Open mobile search"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform active:scale-95">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    <button 
                        onClick={() => {
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                            if (!isMobileMenuOpen) setIsMobileSearchOpen(false);
                        }}
                        className="flex flex-col gap-1.5 p-2 focus:outline-none"
                    >
                        <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                        <div className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>

                {/* Mobile Inline Search Form (Absolute Overlay) */}
                <AnimatePresence>
                    {isMobileSearchOpen && (
                        <motion.form 
                            initial={{ opacity: 0, x: 15, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute inset-0 flex items-center w-full gap-2 px-4 bg-black/95 backdrop-blur-md z-[70] md:hidden"
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (searchQuery.trim()) {
                                    navigate(`/blog?q=${encodeURIComponent(searchQuery.trim())}`);
                                    setIsMobileSearchOpen(false);
                                }
                            }}
                        >
                            <div className="relative w-full">
                                <input
                                    ref={mobileSearchInputRef}
                                    type="search"
                                    enterKeyHint="search"
                                    placeholder="Search blogs..."
                                    className="w-full bg-white/10 border border-white/20 rounded-full px-4 pl-10 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none"
                                    aria-label="Submit search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-full shrink-0"
                                aria-label="Close search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform hover:scale-110 active:scale-95">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-3 md:gap-6">
                    {/* Search Bar */}
                    <div className="flex items-center">
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.form
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 210, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="overflow-hidden p-1 mr-1 flex items-center"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (searchQuery.trim()) {
                                            navigate(`/blog?q=${encodeURIComponent(searchQuery.trim())}`);
                                        }
                                    }}
                                >
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        enterKeyHint="search"
                                        placeholder="Search blogs..."
                                        className="w-[190px] bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </motion.form>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={() => {
                                setIsSearchOpen(!isSearchOpen);
                                if (!isSearchOpen) {
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }
                            }}
                            className="p-1.5 md:p-2 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-full hover:bg-white/5"
                            aria-label="Search blogs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform hover:scale-110 active:scale-95">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>

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
                                className="absolute top-full left-0 mt-4 w-52 glass-card bg-[#0a0a0a]/95 border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                            >
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/95 border-t border-l border-white/5 rotate-45" />
                                <div 
                                    className="p-2 max-h-[400px] overflow-y-auto relative z-10"
                                    data-lenis-prevent
                                >
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
                                className="absolute top-full left-0 mt-4 w-64 glass-card bg-[#0a0a0a]/95 border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-[100]"
                            >
                                {/* Dropdown Arrow */}
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/95 border-t border-l border-white/5 rotate-45" />
                                
                                <div 
                                    className="p-2 max-h-[400px] overflow-y-auto relative z-10"
                                    data-lenis-prevent
                                >
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
                        className="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-xl"
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
                className="md:hidden bg-[#050505] border-b border-white/[0.03] overflow-y-auto max-h-[calc(100vh-4rem)]"
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
                    <div className="flex flex-col gap-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Categories</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Link to="/blog" className={`text-sm p-3 rounded-xl transition-colors font-medium ${!location.search ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                                All Articles
                            </Link>
                            {CATEGORIES.map(category => (
                                <Link 
                                    key={category} 
                                    to={`/blog?category=${encodeURIComponent(category)}`} 
                                    className={`text-sm p-3 rounded-xl transition-colors font-medium ${location.search.includes(category) ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}
                                >
                                    {category}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link 
                        to="/login" 
                        className="w-full py-4 text-center rounded-2xl bg-white text-black font-extrabold text-lg shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-[0.98] transition-transform mt-2"
                    >
                        Login
                    </Link>
                </div>
            </motion.div>
        </nav>
    );
};

