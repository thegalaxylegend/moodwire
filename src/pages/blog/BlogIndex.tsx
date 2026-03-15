import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Suspense, lazy } from 'react';
import { blogs } from '../../data/blogs';

const Footer = lazy(() => import('../../components/Footer').then(module => ({ default: module.Footer })));

export const BlogIndex: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');

    const filteredBlogs = useMemo(() => {
        if (!categoryFilter) return blogs;
        return blogs.filter(blog => blog.category === categoryFilter);
    }, [categoryFilter]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={categoryFilter ? `${categoryFilter} | Exam Compass Blog` : "Exam Compass Blog | AI Exam Prep Tips & Strategies"}
                description={`Expert strategies, syllabus breakdowns, and exam preparation tips for ${categoryFilter || 'JEE, NEET, UPSC, and CBSE Class 10-12'} students.`}
            />
            <Navbar />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-fade-in">
                <header className="mb-20 text-center max-w-3xl mx-auto">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in">
                        {categoryFilter || 'Insights & Strategies'}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                        {categoryFilter ? (
                            <>
                                Focus on <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{categoryFilter}</span>
                            </>
                        ) : (
                            <>
                                Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Future</span> of Learning
                            </>
                        )}
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        {categoryFilter 
                            ? `Explore our latest guides and notes specifically for ${categoryFilter}.`
                            : "Data-driven preparation guides, syllabus deep-dives, and AI-powered study hacks to give you the competitive edge."
                        }
                    </p>
                    {categoryFilter && (
                        <Link to="/blog" className="inline-block mt-8 text-purple-400 hover:text-purple-300 font-bold text-sm">
                            ← View all categories
                        </Link>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" style={{ contentVisibility: 'auto' }}>
                    {filteredBlogs.map((blog, index) => (
                        <Link
                            to={`/blog/${blog.id}`}
                            key={blog.id}
                            className="group relative flex flex-col h-full bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-700 hover:scale-[1.01] hover:shadow-[0_45px_100px_-20px_rgba(168,85,247,0.15)]"
                        >
                            {/* Visual Glow Behind Card */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            {/* Top Image Section */}
                            <div className="relative aspect-[16/11] w-full overflow-hidden">
                                <img 
                                    src={blog.image} 
                                    alt={blog.title}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    {...(index === 0 ? { fetchPriority: "high" } : {})}
                                    decoding="async"
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                                
                                {/* Badge */}
                                <div className="absolute top-5 left-5">
                                    <div className="px-4 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black tracking-[0.15em] uppercase text-white shadow-2xl">
                                        {blog.category}
                                    </div>
                                </div>

                                {/* Floating Reading Time */}
                                <div className="absolute bottom-5 left-5 flex items-center gap-2 text-white/60 text-[10px] font-medium tracking-wide">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    {blog.readTime}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative z-10">
                                <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors duration-500 leading-tight line-clamp-2">
                                    {blog.title}
                                </h2>
                                
                                <p className="text-gray-400 text-sm leading-relaxed mb-8 line-clamp-3 font-medium opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                                    {blog.description}
                                </p>

                                {/* Footer Section - Sticks to Bottom */}
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Published</span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {(() => {
                                                const postDate = new Date(blog.date);
                                                const now = new Date();
                                                const diffDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
                                                
                                                if (diffDays === 0) return 'Today';
                                                if (diffDays === 1) return 'Yesterday';
                                                if (diffDays > 0 && diffDays < 14) return `${diffDays} days ago`;
                                                return blog.date;
                                            })()}
                                        </span>
                                    </div>

                                    <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-purple-500 group-hover:border-purple-400 transition-all duration-500 overflow-hidden">
                                        <span className="text-xs font-black text-white uppercase tracking-wider relative z-10">Explore</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 group-hover:translate-x-1 transition-transform duration-500"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Corner Accent Detail */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full" />
                        </Link>
                    ))}
                </div>
                {filteredBlogs.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No articles found in this category.</p>
                        <Link to="/blog" className="inline-block mt-4 text-purple-400 font-bold">View all articles</Link>
                    </div>
                )}
            </main>

            <Suspense fallback={<div className="h-[400px] border-t border-white/10 bg-black" />}>
                <Footer />
            </Suspense>
        </div>
    );
};

