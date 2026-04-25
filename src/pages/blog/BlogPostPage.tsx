import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Loader2, Calendar, Download, BookOpen } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { BlogSchema } from '../../components/blog/BlogSchema';
import { BlogCTA } from '../../components/blog/BlogCTA';
import { Footer } from '../../components/Footer';
import { blogs } from '../../data/blogs'; // Re-use the metadata block
import { AboutAuthor } from '../../components/seo/AboutAuthor';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { Navbar } from '../../components/Navbar';
import { SITE_URL } from '../../lib/siteConfig';
import { BlogSkeleton } from '../../components/skeletons/BlogSkeleton';
import { motion, useScroll, useSpring } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';
import { useUserStore } from '../../store/userStore';



export const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const ssrMeta = typeof globalThis !== 'undefined' ? (globalThis as any).SEO_BLOG_DATA : null;
    const meta = ssrMeta && ssrMeta.id === slug ? ssrMeta : blogs.find(b => b.id === slug);

    // SSG HYDRATION: Use pre-rendered markdown content if available (critical for SEO)
    const ssrContent = (typeof globalThis !== 'undefined' && (globalThis as any).SEO_BLOG_CONTENT) || '';
    const [content, setContent] = useState<string>(ssrContent);
    const [loading, setLoading] = useState(!meta || (!ssrMeta && !ssrContent));
    const [error, setError] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { user } = useUserStore();
    const shadowPrintRef = useRef<HTMLDivElement>(null);

    const { tier } = usePerformance();
    const isLow = tier === 'low';

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });


    const handleDownloadPDF = async () => {
        if (!shadowPrintRef.current) return;
        setGeneratingPdf(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!shadowPrintRef.current) return;

            const { downloadBlogPDF } = await import('../../services/cheatSheetService');
            await downloadBlogPDF({
                title: meta.title,
                category: meta.category,
                date: meta.date,
                markdown: content,
                contentHtml: shadowPrintRef.current.innerHTML.replace(/<h1[^>]*>.*?<\/h1>/i, ''),
                userName: user?.name || 'Scholar',
                userClass: user?.userClass || 'Class 12th',
                targetYear: user?.targetYear || new Date().getFullYear()
            });
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };



    useEffect(() => {
        // Skip client-side loading if we already have SSG content
        if (ssrContent) {
            setLoading(false);
            return;
        }

        const loadContent = async () => {
            if (!slug) return;
            try {
                const modules = import.meta.glob('../../content/blogs/*.md', { query: '?raw', import: 'default' });
                const matchingPath = Object.keys(modules).find(path => path.includes(slug));

                if (matchingPath) {
                    const rawContent = await modules[matchingPath]() as string;
                    const bodyMatch = rawContent.match(/---[\s\S]*?---([\s\S]*)/);
                    let cleanContent = bodyMatch ? bodyMatch[1].trim() : rawContent.trim();
                    
                    // Strip HTML comments (e.g., <!-- [AD BREAK SUGGESTION] -->)
                    cleanContent = cleanContent.replace(/<!--[\s\S]*?-->/g, '');
                    
                    cleanContent = cleanContent.replace(/^#[^\n]*\n+/m, '');
                    setContent(cleanContent);
                } else {
                    throw new Error("File not found");
                }
            } catch (e) {
                console.error("Failed to load blog:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black">
                <Navbar />
                <div className="pt-6 pb-20 px-4 sm:px-6 max-w-4xl mx-auto overflow-x-hidden will-change-transform relative z-10">
                    <BlogSkeleton />
                </div>
            </div>
        );
    }

    if (error || !meta) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <SEO
                title={meta.title}
                description={meta.description}
                type="article"
                canonical={`${SITE_URL}/blog/${slug}`}
                image={meta.image ? `${SITE_URL}${meta.image}` : undefined}
                publishedTime={new Date(meta.date).toISOString()}
                modifiedTime={new Date(meta.date).toISOString()}
            />
            <BlogSchema
                title={meta.title}
                description={meta.description}
                authorName="Ayush Kumar"
                publishDate={meta.date}
                url={`${SITE_URL}/blog/${slug}`}
                imageUrl={meta.image ? `${SITE_URL}${meta.image}` : undefined}
            />
            <Navbar />

            {/* Premium Scroll Progress Bar */}
            <motion.div 
                className="fixed top-0 left-0 right-0 h-1.5 bg-primary z-[100] origin-left shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                style={{ scaleX }}
            />

            {/* Dynamic Neural Pulse Line */}
            <motion.div 
                className="fixed left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent z-40 hidden lg:block opacity-20"
                style={{ scaleY: scrollYProgress, originY: 0 }}
            />

            <motion.article 
                initial={isLow ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pt-24 pb-20 px-4 sm:px-6 max-w-4xl mx-auto overflow-x-hidden will-change-transform relative z-10"
            >
                <div className="mb-2">
                    <Breadcrumbs />
                </div>

                <header className="mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs tracking-widest uppercase border border-purple-500/30 whitespace-nowrap">
                            {meta.category || 'Revision'}
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight text-white bg-clip-text">
                        {meta.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex flex-wrap items-center gap-6 text-gray-400 font-medium">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold border border-white/20 shadow-lg">A</div>
                                <div>
                                    <p className="text-white text-base font-bold">Ayush (Founder)</p>
                                    <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold opacity-80">Exam Strategist</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 py-2 px-4 rounded-xl text-xs border border-white/10 font-bold tracking-wide">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span>Last Updated: {meta.date}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadPDF}
                            disabled={generatingPdf}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_auto] animate-gradient-x rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-purple-500/25 disabled:opacity-50 group border border-white/20"
                        >
                            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform text-white" />}
                            <span className="text-white drop-shadow-md">{generatingPdf ? 'Generating...' : 'Download Revision PDF'}</span>
                        </button>
                    </div>

                    {meta.practice_link && (
                        <Link 
                            to={meta.practice_link}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold text-sm hover:bg-purple-500/20 transition-all mb-8 group"
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>Practice Questions for this chapter</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    )}

                    {meta.image && (
                        <div className="relative aspect-[21/9] w-full mt-4 rounded-[40px] overflow-hidden border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] group">
                            <img 
                                src={meta.image} 
                                alt={meta.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                loading="eager"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2000&auto=format&fit=crop'; // Scientific abstract fallback
                                    target.onerror = null; // Prevent infinite loop
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        </div>
                    )}
                </header>

                <div className="blog-content prose prose-invert prose-purple max-w-none
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-base prose-p:mb-4
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-4
                    prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:md:text-3xl prose-h2:mt-10 prose-h2:pb-3 prose-h2:border-b prose-h2:border-white/10
                    prose-h3:text-base prose-h3:sm:text-lg prose-h3:font-semibold prose-h3:text-purple-300 prose-h3:mt-6 prose-h3:mb-2
                    prose-li:text-gray-300 prose-li:my-1
                    prose-ul:my-3 prose-ol:my-3
                    prose-strong:text-white
                    prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
                    prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{
                            h2: ({node, children, ...props}) => (
                                <h2 {...props} className="text-xl sm:text-2xl font-bold text-white mt-12 mb-6 break-words">
                                    {children}
                                </h2>
                            ),
                            h3: ({node, children, ...props}) => (
                                <h3 {...props} className="text-base sm:text-lg font-semibold text-purple-300 mt-6 mb-2 border-l-2 border-purple-500 pl-3 break-words">
                                    {children}
                                </h3>
                            ),
                            ul: ({node, children, ...props}) => (
                                <ul {...props} className="list-disc list-outside pl-4 space-y-1 my-3">
                                    {children}
                                </ul>
                            ),
                            li: ({node, children, ...props}) => (
                                <li {...props} className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    {children}
                                </li>
                            ),
                            table: ({node, children, ...props}) => (
                                <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
                                    <table {...props} className="w-full text-sm text-left">{children}</table>
                                </div>
                            ),
                            a: ({node, href, children, ...props}) => {
                                const isExternal = href?.startsWith('http') && !href.includes(SITE_URL);
                                return (
                                    <a 
                                        {...props} 
                                        href={href} 
                                        target={isExternal ? "_blank" : undefined}
                                        rel={isExternal ? "noopener external" : undefined}
                                        className={isExternal ? "text-purple-400 hover:text-purple-300 underline underline-offset-4" : ""}
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            img: ({node, alt, src, ...props}) => (
                                <img 
                                    {...props}
                                    src={src}
                                    alt={alt || meta.title}
                                    loading="lazy" 
                                    decoding="async" 
                                    className="rounded-2xl shadow-2xl border border-white/10 my-8 w-full" 
                                />
                            )
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>

                <footer className="mt-20 pt-10 border-t border-white/10">
                    <AboutAuthor />
                    <div className="mt-12">
                        <BlogCTA />
                    </div>
                </footer>
            </motion.article>

            <Footer />

            {/* HIGH-QUALITY SHADOW RENDERER (DNA FROM NOTES) */}
            <div 
                ref={shadowPrintRef}
                className="absolute top-0 left-0 w-[800px] bg-white text-black p-16 -z-10 pointer-events-none opacity-0"
                style={{ visibility: 'hidden' }}
            >
                <div style={{ backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px', paddingBottom: '20px', borderBottom: '3px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '15pt', fontWeight: 900, color: '#4338ca', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                                Exam Compass
                            </div>
                            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Premium Article • blog.examcompass.dev
                            </div>
                            <div style={{ fontSize: '8pt', fontWeight: 600, color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                                Empowering Students with AI-Driven Engineering.
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                            <div style={{ fontSize: '11pt', fontWeight: 800, color: '#1e293b' }}>
                                Prepared for {user?.name || 'Scholar'}
                            </div>
                            <div style={{ fontSize: '9pt', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                                Date: {meta.date}
                            </div>
                            <div style={{ fontSize: '8pt', fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>
                                CATEGORY: {meta.category}
                            </div>
                        </div>
                    </div>
                    <div className="prose-print" style={{ backgroundColor: '#ffffff' }}>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]} 
                            rehypePlugins={[rehypeRaw, rehypeKatex]}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

