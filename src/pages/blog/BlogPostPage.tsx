import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { ArrowLeft, Loader2, Calendar, Download, BookOpen } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { BlogSchema } from '../../components/blog/BlogSchema';
import { BlogCTA } from '../../components/blog/BlogCTA';
import { Footer } from '../../components/Footer';
import { blogs } from '../../data/blogs'; // Re-use the metadata block
import { SocialShare } from '../../components/SocialShare';
import { AboutAuthor } from '../../components/seo/AboutAuthor';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { Navbar } from '../../components/Navbar';
import { SITE_URL } from '../../lib/siteConfig';



export const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const ssrMeta = typeof globalThis !== 'undefined' ? (globalThis as any).SEO_BLOG_DATA : null;
    const meta = ssrMeta && ssrMeta.id === slug ? ssrMeta : blogs.find(b => b.id === slug);

    // SSG HYDRATION: Use pre-rendered markdown content if available (critical for SEO)
    const ssrContent = (typeof globalThis !== 'undefined' && (globalThis as any).SEO_BLOG_CONTENT) || '';
    const [content, setContent] = useState<string>(ssrContent);
    const [loading, setLoading] = useState(!meta || (!ssrMeta && !ssrContent));
    const [error, setError] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const { downloadBlogPDF } = await import('../../services/cheatSheetService');
            await downloadBlogPDF({
                title: meta.title,
                category: meta.category,
                date: meta.date,
                markdown: content,
            });
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = (window.scrollY / totalHeight) * 100;
                    setReadingProgress(progress);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error || !meta) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
                <Link to="/blog" className="px-6 py-2 bg-purple-600 rounded-xl font-bold flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Back to Blog
                </Link>
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

            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 pointer-events-none">
                <div 
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-100 origin-left"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            <article className="pt-32 pb-20 px-6 max-w-4xl mx-auto" style={{ contentVisibility: 'auto' }}>
                <div className="mb-6">
                    <Breadcrumbs />
                </div>
                <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors font-medium group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to all articles
                </Link>

                <header className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs tracking-widest uppercase border border-purple-500/30">
                            {meta.category}
                        </span>
                        <div className="flex items-center gap-4">
                            <a href={`https://wa.me/?text=Check out this interactive quick recap for ${meta.title}: ${SITE_URL}/blog/${slug}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold text-xs tracking-widest uppercase border border-[#25D366]/30 hover:bg-[#25D366]/30 transition-colors">
                                Share on WhatsApp 📲
                            </a>
                            <SocialShare title={meta.title} />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold mb-10 leading-tight">
                        {meta.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 mb-12 p-6 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex flex-wrap items-center gap-6 text-gray-400 font-medium">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">A</div>
                                <div>
                                    <p className="text-white text-sm font-bold">Ayush (Founder)</p>
                                    <p className="text-[10px] uppercase tracking-wider">Exam Strategist</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 py-1.5 px-3 rounded-lg text-xs border border-white/5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Last Updated: <time dateTime={new Date(meta.date).toISOString()}>{meta.date}</time></span>
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadPDF}
                            disabled={generatingPdf}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 group"
                        >
                            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                            {generatingPdf ? 'Generating...' : 'Download Revision PDF'}
                        </button>
                    </div>

                    {/* Phase 6: Topic Cluster Link (Dynamic for all subjects) */}
                    {(() => {
                        // Map category like "Class 11 Physics" to exam path (e.g. jee-mains/physics)
                        let examBase = 'jee-mains';
                        let subjectSlug = '';
                        const catLower = meta.category.toLowerCase();
                        
                        if (catLower.includes('neet') || catLower.includes('biology')) examBase = 'neet';
                        
                        if (catLower.includes('physics')) subjectSlug = 'physics';
                        else if (catLower.includes('math')) subjectSlug = 'math';
                        else if (catLower.includes('chemistry')) subjectSlug = 'chemistry';
                        else if (catLower.includes('biology')) subjectSlug = 'biology';
                        else if (catLower.includes('science')) subjectSlug = 'science';
                        
                        // Extract plain slug from something like "laws-of-motion-revision-notes"
                        const pureSlug = slug?.replace(/-revision-notes|-short-notes|-formulas/g, '') || '';
                        
                        if (subjectSlug && pureSlug) {
                            return (
                                <div className="mb-10">
                                    <Link 
                                        to={`/${examBase}/${subjectSlug}/${pureSlug}`}
                                        className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold text-sm bg-purple-500/5 px-4 py-2 rounded-lg border border-purple-500/10 transition-colors"
                                    >
                                        <BookOpen className="w-4 h-4" /> Practice Questions for this chapter →
                                    </Link>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </header>

                <div className="prose prose-invert prose-purple max-w-none 
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-8
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-6
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:pb-4 prose-h2:border-b prose-h2:border-white/10
                    prose-strong:text-white
                    prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                    prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{
                            h1: 'h2',
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
                                    className="rounded-3xl shadow-2xl border border-white/10 my-12" 
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
            </article>

            <Footer />
        </div>
    );
};

