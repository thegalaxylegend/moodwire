import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Loader2, Calendar, User } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { BlogSchema } from '../../components/blog/BlogSchema';
import { BlogCTA } from '../../components/blog/BlogCTA';
import { Footer } from '../../components/Footer';
import { blogs } from './BlogIndex'; // Re-use the metadata block

export const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    // Look up meta by slug
    // During SSR, we use the injected global data
    const ssrMeta = typeof globalThis !== 'undefined' ? (globalThis as any).SEO_BLOG_DATA : null;
    const meta = ssrMeta && ssrMeta.id === slug ? ssrMeta : blogs.find(b => b.id === slug);

    const [content, setContent] = useState<string>('');
    const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
    const [loading, setLoading] = useState(!meta || !ssrMeta); // If we have SSR meta, we don't need to wait for client-side load
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            if (!slug) return;
            try {
                // In Vite, we can dynamically import raw files if configured,
                // but for static SSG we can fetch the markdown file directly.
                // Since this is in src, we might need a dynamic import map:
                const modules = import.meta.glob('../../content/blogs/*.md', { query: '?raw', import: 'default' });
                const matchingPath = Object.keys(modules).find(path => path.includes(slug));

                if (matchingPath) {
                    const rawContent = await modules[matchingPath]() as string;
                    // Strip the YAML frontmatter
                    const bodyMatch = rawContent.match(/---[\s\S]*?---([\s\S]*)/);
                    let cleanContent = bodyMatch ? bodyMatch[1].trim() : rawContent.trim();

                    // Strip the first markdown H1 (# Heading) to prevent duplicate titles 
                    // since we already render it in the React header.
                    cleanContent = cleanContent.replace(/^#[^\n]*\n+/m, '');

                    // Extract Table of Contents
                    const headerRegex = /^(##|###) (.*$)/gm;
                    const matches = Array.from(cleanContent.matchAll(headerRegex));
                    const tocItems = matches.map(match => ({
                        level: match[1].length,
                        text: match[2],
                        id: match[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
                    }));
                    setToc(tocItems);

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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !meta) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
                <p className="text-text-muted mb-8">The article you're looking for doesn't exist or has been moved.</p>
                <Link to="/blog" className="px-6 py-2 bg-primary rounded-xl font-bold flex items-center gap-2">
                    <ArrowLeft className="w-5 h-5" /> Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text-main pt-20 pb-20 px-6">
            <SEO
                title={meta.title}
                description={meta.description}
                type="article"
                publishedTime={new Date(meta.date).toISOString()}
            />
            <BlogSchema
                title={meta.title}
                description={meta.description}
                authorName="Exam Compass Tutors"
                publishDate={meta.date}
                url={`https://examcompass.web.app/blog/${slug}`}
                imageUrl={meta.image}
            />

            <article className="max-w-7xl mx-auto">
                <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" /> Back to all articles
                </Link>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <header className="mb-10 p-6 md:p-10 rounded-3xl bg-surface/50 border border-white/5 relative overflow-hidden group">
                            {/* Background glow effects */}
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-4 py-1.5 rounded-full bg-primary/20 text-primary font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-primary/20">
                                        {meta.category}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-heading mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60">
                                    {meta.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-text-muted font-medium">
                                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                                        <User className="w-4 h-4 text-primary" />
                                        <span className="text-sm md:text-base">Exam Compass Tutors</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                                        <Calendar className="w-4 h-4 text-accent" />
                                        <span className="text-sm md:text-base">{meta.date}</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Markdown Body */}
                        <div className="prose prose-invert prose-purple md:prose-lg max-w-none 
                            prose-img:rounded-2xl prose-img:shadow-2xl prose-img:border prose-img:border-border
                            prose-a:text-primary hover:prose-a:text-primary/80 prose-a:transition-colors
                            prose-headings:font-heading prose-headings:font-bold prose-headings:text-white
                            prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-3
                            prose-h3:mt-8 prose-h3:text-xl md:prose-h3:text-2xl
                            prose-p:text-text-muted prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base md:prose-p:text-lg
                            prose-ul:text-text-muted prose-li:my-1
                            prose-strong:text-white prose-strong:font-bold
                            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                            prose-code:text-accent prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h2: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                        return <h2 id={id} {...props}>{children}</h2>;
                                    },
                                    h3: ({ node, children, ...props }) => {
                                        const text = String(children);
                                        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                                        return <h3 id={id} {...props}>{children}</h3>;
                                    }
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>

                        {/* Converting CTA Footer */}
                        <footer className="mt-16 border-t border-border pt-8">
                            <BlogCTA />
                        </footer>
                    </div>

                    {/* Sidebar */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-28 space-y-8">
                            {/* TOC */}
                            {toc.length > 0 && (
                                <div className="p-6 rounded-3xl bg-surface/30 border border-white/5 backdrop-blur-sm">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <div className="w-1 h-6 bg-primary rounded-full" />
                                        Quick Navigation
                                    </h3>
                                    <nav className="space-y-1">
                                        {toc.map((item, i) => (
                                            <a
                                                key={i}
                                                href={`#${item.id}`}
                                                className={`block py-2 text-sm transition-all hover:text-primary ${item.level === 3 ? 'pl-6 text-text-muted' : 'font-medium text-text-main'
                                                    }`}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            {/* Promotional Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />
                                <h3 className="text-xl font-bold mb-3 relative z-10">Ace Your Exams with AI</h3>
                                <p className="text-text-muted text-sm mb-6 relative z-10">Get personalized mock tests and performance trackingpowered by AI.</p>
                                <Link
                                    to="/dashboard/mock"
                                    className="block w-full py-3 bg-white text-black font-bold rounded-xl text-center hover:bg-white/90 transition-colors relative z-10"
                                >
                                    Start Free Test
                                </Link>
                            </div>

                            {/* Related Links */}
                            <div className="p-6 rounded-3xl bg-surface/30 border border-white/5">
                                <h3 className="text-lg font-bold mb-4 text-white">Browse Categories</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['JEE Prep', 'NEET', 'Class 10', 'Class 12', 'Study Hacks', 'UPSC'].map(cat => (
                                        <button key={cat} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors">
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </article>
            <Footer />
        </div>
    );
};
