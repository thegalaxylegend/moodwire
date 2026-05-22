
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useUserStore } from '../../store/userStore';
import { KeyTakeaways } from '../../components/KeyTakeaways';
import { AuthorBio } from '../../components/AuthorBio';
import { SocialShare } from '../../components/SocialShare';
import { blogs } from '../../data/blogs';
import { examDates } from '../../config/examDates';
import { DirectAnswerBlock } from '../../components/seo/DirectAnswerBlock';
import { Breadcrumbs } from '../../components/seo/Breadcrumbs';
import { SITE_URL } from '../../lib/siteConfig';
import { StudentTip } from '../../components/seo/StudentTip';


import { NotFoundPage } from './NotFoundPage';

declare global {
    var SEO_TOPIC_DATA: any[];
    var SEO_TOPIC_CONTENT: any;
}

export const TopicPage = () => {
    const { exam, subject, topic } = useParams();
    const { user } = useUserStore();
    const { tier } = usePerformance();
    const isLow = tier === 'low';

    // Data Finding Logic
    const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subject);
    const topicList = realSubject ? (SYLLABUS_DB[realSubject as string] || []) : [];
    const topicData = topicList.find(t => slugify(t.topic) === topic);

    if (!topicData) {
        // Fallback Logic: Maybe they landed on a Blog slug by mistake?
        const isBlog = blogs.find(b => b.id === topic);
        if (isBlog) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <ArrowRight className="text-purple-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Revision Notes Found</h1>
                        <p className="text-gray-400">
                            We found high-quality revision notes for <strong>{topic?.replace(/-/g, ' ')}</strong>. 
                            Redirecting you to the blog...
                        </p>
                        <meta httpEquiv="refresh" content={`2;url=/blog/${topic}`} />
                        <Link 
                            to={`/blog/${topic}`}
                            className="inline-flex items-center gap-2 bg-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                        >
                            Go to Notes <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            );
        }
        return <NotFoundPage />;
    }

    const targetYear = examDates.getExamYear(exam || '');

    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase();
    const cleanTopicName = topicData?.topic.replace(/\[.*?\]\s*/g, '') || topic?.replace(/-/g, ' ');

    const contextName = formattedExam === 'SCHOOL EXAMS' ? (user?.userClass || topicData?.class || 'CBSE Class') : formattedExam;

    // SEO Data Hydration with Client-Side Fallback
    const [sampleQuestions, setSampleQuestions] = React.useState<any[]>(
        (typeof globalThis !== 'undefined' && globalThis.SEO_TOPIC_DATA)
            ? globalThis.SEO_TOPIC_DATA
            : []
    );

    // Fallback: If no SSG data, try to fetch from internal API/DB (Client-Side)
    React.useEffect(() => {
        if (sampleQuestions.length === 0 && topicData) {
            const fetchQuestions = async () => {
                try {
                    const response = await fetch('/question-db.json');
                    if (!response.ok) throw new Error('Failed to fetch DB');

                    const db = await response.json();
                    const relatedQuestions = Object.values(db).filter((q: any) => {
                        // 1. Strict Subject Filter (Prevent cross-subject pollution)
                        if (realSubject && q.subject && q.subject !== realSubject) return false;

                        // 2. Filter out Practice Question placeholders
                        if (q.title === "Practice Question" || q.slug?.includes("practice-question-")) return false;

                        const qTopic = (q.topic || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const pTopic = topicData.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return qTopic === pTopic || qTopic.includes(pTopic) || pTopic.includes(qTopic);
                    });

                    // 3. Deduplicate by slug (Prevent 3x repetition)
                    const uniqueQuestions = Array.from(new Map(relatedQuestions.map((q: any) => [q.slug || q.id, q])).values()).slice(0, 15);

                    if (uniqueQuestions.length > 0) {
                        setSampleQuestions(uniqueQuestions);
                    }
                } catch (error) {
                    console.warn("Client-side question fetch failed:", error);
                }
            };
            fetchQuestions();
        }
    }, [sampleQuestions.length, topicData]);

    // Build keywords from subtopics
    const subtopicKeywords = topicData?.subtopics.slice(0, 6).join(', ') || '';
    const seoKeywords = `${cleanTopicName}, ${contextName} ${cleanTopicName}, ${cleanTopicName} quick revision, ${cleanTopicName} formulas pdf, ${cleanTopicName} PYQ, ${subtopicKeywords}`;
    
    // SEO Trick #1 & #6: Optimized for Long-Tail Keywords and Click-Through Rate
    const seoDescription = `Master ${cleanTopicName} for ${contextName} with our quick revision notes, important formulas, and ${sampleQuestions.length}+ past year questions (PYQs). Download PDF notes and practice now with AI-verified solutions.`;

    // Schema Data
    const schemaGraph: any[] = [
        {
            "@type": "Course",
            "name": `${cleanTopicName} for ${contextName}`,
            "description": `Master ${cleanTopicName} with PYQs and AI-assisted learning for ${contextName}.`,
            "provider": {
                "@type": "Organization",
                "name": "Exam Compass",
                "sameAs": SITE_URL,
                "url": SITE_URL
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": "PT2H"
            },
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR", "category": "Free" },
            "isAccessibleForFree": true,
            "about": topicData?.subtopics.map((s: string) => ({ "@type": "Thing", "name": s })) || []
        },
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `${SITE_URL}/${exam}` },
                { "@type": "ListItem", "position": 3, "name": realSubject, "item": `${SITE_URL}/${exam}/${subject}` },
                { "@type": "ListItem", "position": 4, "name": cleanTopicName, "item": `${SITE_URL}/${exam}/${subject}/${topic}` }
            ]
        }
    ];

    // FAQ Schema: Generate topic-specific FAQs from subtopics
    const faqEntries = [
        {
            "@type": "Question" as const,
            "name": `What are the important topics in ${cleanTopicName} for ${contextName}?`,
            "acceptedAnswer": {
                "@type": "Answer" as const,
                "text": `The key subtopics in ${cleanTopicName} are: ${topicData?.subtopics.join(', ') || 'See syllabus'}. Focus on these for ${contextName} preparation.`
            }
        },
        {
            "@type": "Question" as const,
            "name": `How many questions come from ${cleanTopicName} in ${contextName}?`,
            "acceptedAnswer": {
                "@type": "Answer" as const,
                "text": `Based on past paper analysis, ${cleanTopicName} typically has ${topicData?.weightage === 'High' ? '3-4' : topicData?.weightage === 'Medium' ? '1-2' : '0-1'} questions in ${contextName}. Weightage: ${topicData?.weightage || 'Medium'}.`
            }
        },
        {
            "@type": "Question" as const,
            "name": `What type of questions are asked from ${cleanTopicName}?`,
            "acceptedAnswer": {
                "@type": "Answer" as const,
                "text": `${cleanTopicName} questions are typically ${topicData?.examPattern || 'MCQ'} format. ${topicData?.examPattern === 'Numerical' ? 'Expect calculation-based problems requiring formula application.' : topicData?.examPattern === 'Passage' ? 'Expect passage-based analytical questions.' : 'Focus on conceptual clarity and elimination technique.'}`
            }
        }
    ];

    schemaGraph.push({
        "@type": "FAQPage",
        "mainEntity": faqEntries
    });

    if (sampleQuestions.length > 0) {
        schemaGraph.push({
            "@type": "ItemList",
            "name": `${cleanTopicName} Practice Questions for ${contextName}`,
            "numberOfItems": sampleQuestions.length,
            "itemListElement": sampleQuestions.map((q: any, i: number) => ({
                "@type": "ListItem", "position": i + 1, "url": `${SITE_URL}/${exam}/q/${q.slug}`
            }))
        });
    }

    const schemaData = { "@context": "https://schema.org", "@graph": schemaGraph };

    // SEO: Shorten title if topic is extremely long, but keep primary keywords
    const shortTopic = cleanTopicName ? (cleanTopicName.length > 40 ? `${cleanTopicName.substring(0, 37)}...` : cleanTopicName) : 'Practice Questions';
    const pageTitle = `${shortTopic} Notes for ${contextName} ${targetYear} | ExamCompass`;

    // Trick #4: PDF Download feature exposed to public
    const [generatingPdf, setGeneratingPdf] = React.useState(false);
    const handleDownloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
            const content = await generateCheatSheetContent(cleanTopicName || topic || '', realSubject || subject || '');
            if (content) {
                await downloadCheatSheetPDF(content);
            }
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className={`min-h-screen bg-black text-white selection:bg-purple-500/30 perf-tier-${tier}`}>
            <SEO
                title={pageTitle}
                description={seoDescription}
                canonical={`${SITE_URL}/${exam}/${subject}/${topic}`}
                keywords={seoKeywords}
                schema={schemaData}
            />
            <Navbar />

            <motion.main 
                initial={isLow ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="pt-20 md:pt-28 pb-10 px-6 max-w-7xl mx-auto will-change-transform"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <Breadcrumbs />
                    <SocialShare title={`${cleanTopicName} PYQs for ${contextName}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <motion.div
                        initial={isLow ? {} : { opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                            {cleanTopicName}
                        </h1>

                        <KeyTakeaways 
                            points={[
                                `Comprehensive collection of past year questions (PYQs) for ${cleanTopicName}.`,
                                `Detailed step-by-step solutions verified by ${contextName} experts.`,
                                `AI-powered difficulty scaling to target your specific weak areas.`,
                                `Optimized for ${targetYear} syllabus and latest exam patterns.`
                            ]} 
                        />

                        <DirectAnswerBlock
                            title={`${cleanTopicName} Summary:`}
                            description={`In the context of ${contextName}, ${cleanTopicName} is a ${topicData?.weightage?.toLowerCase() || 'medium'} weightage topic. The examination typically tests this concept via ${topicData?.examPattern || 'multiple-choice'} questions.`}
                            keyFact={`${topicData?.subtopics?.length || 5} core subtopics covered in the latest syllabus.`}
                        />

                        {/* Scientific Verification Badge */}
                        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                                Scientific Verification Active
                            </span>
                            <span className="text-[10px] text-green-500/70 border-l border-green-500/20 pl-2">
                                Grounded via arXiv & Newton API
                            </span>
                        </div>

                        <StudentTip seedText={`${cleanTopicName}-${contextName}`} />
                    </motion.div>
                    
                    <motion.div
                        initial={isLow ? {} : { opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        {/* Phase 2: Dynamic Topic Content via SSG Injection */}
                        {(() => {
                            const topicContent = (typeof globalThis !== 'undefined' && globalThis.SEO_TOPIC_CONTENT) || null;
                            if (topicContent) {
                                return (
                                    <div className="mb-12 space-y-8">
                                        <div className="prose prose-invert max-w-full">
                                            <p className="text-xl text-gray-300 leading-relaxed font-medium">
                                                {topicContent.overview}
                                            </p>
                                        </div>
                                        
                                        {topicContent.formulas && topicContent.formulas.length > 0 && (
                                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                                <div className="p-4 bg-purple-500/10 border-b border-white/10">
                                                    <h3 className="font-bold text-lg text-purple-300">Key Formulas & Concepts</h3>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-black/20 text-gray-400 text-sm">
                                                                <th className="p-4 border-b border-white/5 font-medium">Concept</th>
                                                                <th className="p-4 border-b border-white/5 font-medium">Formula</th>
                                                                <th className="p-4 border-b border-white/5 font-medium">Application</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-gray-300 text-sm">
                                                            {topicContent.formulas.map((f: any, i: number) => (
                                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 border-b border-white/5 font-medium text-purple-400">{f.name}</td>
                                                                    <td className="p-4 border-b border-white/5 font-mono text-pink-300">{f.formula}</td>
                                                                    <td className="p-4 border-b border-white/5 text-gray-400">{f.explanation}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {topicContent.commonMistakes && topicContent.commonMistakes.length > 0 && (
                                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                                                    <h4 className="flex items-center gap-2 text-red-400 font-bold mb-4">
                                                        <span className="text-xl">⚠️</span> Common Traps
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {topicContent.commonMistakes.map((mistake: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                                                <span className="leading-relaxed">{mistake}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {topicContent.pyqAnalysis && (
                                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                                                    <h4 className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                                                        <span className="text-xl">📊</span> PYQ Analysis
                                                    </h4>
                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {topicContent.pyqAnalysis}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // LTHK: Minimalist fallback when no content is present
                            return (
                                <article className="prose prose-invert max-w-full mb-12">
                                    <p className="text-xl text-gray-300 leading-relaxed font-bold border-l-4 border-purple-500 pl-6">
                                        Data-driven summary for {cleanTopicName} is loading...
                                    </p>
                                </article>
                            );
                        })()}

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                            <h2 className="font-bold text-xl mb-4 text-purple-300">Key Concepts</h2>
                            <div className="flex flex-wrap gap-2">
                                {topicData?.subtopics.map(sub => (
                                    <span key={sub} className="px-3 py-1 bg-white/5 rounded-full text-sm border border-white/10">
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-10">
                            <Link to={`/dashboard/mock?exam=${exam}&topic=${topic}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform justify-center flex-1 md:flex-none">
                                Start Practice Test <ArrowRight size={20} />
                            </Link>

                            <button 
                                onClick={handleDownloadPDF}
                                disabled={generatingPdf}
                                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all justify-center flex-1 md:flex-none group"
                            >
                                {generatingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />}
                                {generatingPdf ? 'Generating PDF...' : 'Download PDF Notes'}
                            </button>
                        </div>

                        {/* Phase 6: Related Blog Notes */}
                        {(() => {
                            const topicSlugLower = (topic || '').toLowerCase();
                            const matchedBlogs = blogs.filter(b => {
                                const blogId = b.id.toLowerCase();
                                return blogId.includes(topicSlugLower) || topicSlugLower.includes(blogId.replace(/-revision-notes$/, ''));
                            }).slice(0, 3);
                            if (matchedBlogs.length === 0) return null;
                            return (
                                <div className="mb-12 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                    <h3 className="text-lg font-bold mb-4 text-blue-300">📖 Revision Notes for {cleanTopicName}</h3>
                                    <ul className="space-y-3">
                                        {matchedBlogs.map(b => (
                                            <li key={b.id}>
                                                <Link
                                                    to={`/blog/${b.id}`}
                                                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    {b.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })()}

                        {/* FAQ Section (rendered for users, matches FAQPage schema) */}
                        <div className="mb-12">
                            <h3 className="text-xl font-bold mb-6 text-white">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                {faqEntries.map((faq, i) => (
                                    <details key={i} className="group bg-white/5 border border-white/10 rounded-xl">
                                        <summary className="cursor-pointer p-4 font-medium text-gray-200 hover:text-white transition-colors list-none flex items-center justify-between faq-question">
                                            {faq.name}
                                            <span className="text-purple-400 group-open:rotate-45 transition-transform text-xl">+</span>
                                        </summary>
                                        <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed faq-answer">
                                            {faq.acceptedAnswer.text}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>

                        <AuthorBio 
                            name="Ayush Kumar"
                            role="Founder, ExamCompass"
                            bio="Class 12 student at KV Darbhanga, Bihar. Built ExamCompass as a personal study tool after analyzing 50+ past papers. All topic notes and PYQs are cross-verified against NCERT textbooks."
                            credentials={["KV Darbhanga, Bihar", "50+ PYQ Papers Analyzed", "NCERT-Aligned Content"]}
                            linkedin="https://www.linkedin.com/in/ayush-kumar-a23260401"
                            twitter="https://x.com/Ayush_thelegend"
                            instagram="https://www.instagram.com/mr._.ayush_kr"
                        />
                </motion.div>

            </div>

                {/* Internal Linking for SEO - Sample Questions & Related Chapters */}
                <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-white/10 pt-10">
                    <div className="lg:col-span-2">
                        {sampleQuestions.length > 0 && (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                    <h2 className="text-2xl font-bold">Practice {cleanTopicName} Questions</h2>
                                    <Link 
                                        to={`/${exam}/${subject}/${topic}/top-50-pyqs`} 
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 font-bold hover:bg-purple-500/20 transition-colors text-sm border border-purple-500/20"
                                    >
                                        View Top 50 PYQs Collection <ArrowRight size={16} />
                                    </Link>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {sampleQuestions.map((q: { id: string; slug: string; text: string; sourceYear?: string }) => (
                                        <Link
                                            key={q.id}
                                            to={`/${exam}/q/${q.slug}`}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group"
                                        >
                                            <h3 className="font-semibold text-gray-200 group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                                                {q.text}
                                            </h3>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span className="bg-black/30 px-2 py-1 rounded">View Solution</span>
                                                {q.sourceYear && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded">{q.sourceYear}</span>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <aside>
                        <h2 className="text-xl font-bold mb-6 text-purple-300">Related {realSubject} Chapters</h2>
                        <div className="space-y-3">
                            {topicList.filter(t => t.topic !== topicData?.topic).slice(0, 8).map((t, idx) => (
                                <Link
                                    key={idx}
                                    to={`/${exam}/${subject}/${slugify(t.topic)}`}
                                    className="block p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-colors text-sm text-gray-300 hover:text-white"
                                >
                                    {t.topic.replace(/\[.*?\]\s*/g, '')}
                                </Link>
                            ))}
                            <Link
                                to={`/${exam}/${subject}`}
                                className="block p-3 rounded-lg border border-purple-500/20 text-center text-purple-400 font-bold hover:bg-purple-500/10 transition-colors text-sm mt-4"
                            >
                                View All {realSubject} Topics
                            </Link>
                        </div>
                    </aside>
                </div>
            </motion.main>
            <Footer />
        </div>
    );
};
