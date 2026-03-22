import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../data/blogs';

const EXAM_LINKS = [
    { label: 'JEE Mains', to: '/jee-mains' },
    { label: 'NEET', to: '/neet' },
    { label: 'Class 10', to: '/class-10' },
    { label: 'Class 11', to: '/class-11' },
    { label: 'Class 12', to: '/class-12' },
];

export const Navbar = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isExamsOpen, setIsExamsOpen] = useState(false);
    const location = useLocation();
    const filterRef = useRef<HTMLDivElement>(null);
    const examsRef = useRef<HTMLDivElement>(null);

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
    }, [location]);

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black/60 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                <Link to="/" className="text-xl md:text-2xl font-bold text-white tracking-tighter shrink-0 mr-4">
                    Exam<span className="text-[#a855f7]">Compass</span>
                </Link>

                <div className="flex items-center gap-3 md:gap-6">
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
                            <div className="absolute top-full left-0 mt-4 w-52 glass-card bg-[#0a0a0a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/90 border-t border-l border-white/10 rotate-45" />
                                <div className="p-2 relative z-10">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Popular Exams
                                    </div>
                                    {EXAM_LINKS.map(exam => (
                                        <Link
                                            key={exam.to}
                                            to={exam.to}
                                            className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                        >
                                            {exam.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
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
                            <div className="absolute top-full left-0 mt-4 w-64 glass-card bg-[#0a0a0a]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                                {/* Dropdown Arrow */}
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-[#0a0a0a]/90 border-t border-l border-white/10 rotate-45" />
                                
                                <div className="p-2 max-h-[400px] overflow-y-auto relative z-10 transition-all duration-300">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        Categories
                                    </div>
                                    <Link
                                        to="/blog"
                                        className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                    >
                                        All Articles
                                    </Link>
                                    {CATEGORIES.map(category => (
                                        <Link
                                            key={category}
                                            to={`/blog?category=${encodeURIComponent(category)}`}
                                            className="block px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 transform hover:translate-x-1"
                                        >
                                            {category}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link to="/blog" className="text-sm md:text-base text-gray-300 hover:text-white font-medium transition-colors">
                        Blog
                    </Link>
                    <Link to="/login" rel="nofollow" className="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 shadow-lg shadow-white/5">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
};
