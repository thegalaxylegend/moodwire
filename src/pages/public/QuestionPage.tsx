import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Loader2, CheckCircle, Brain, Download } from 'lucide-react';
import { slugify } from '../../lib/utils';
import { SYLLABUS_DB } from '../../lib/constants';
import { KeyTakeaways } from '../../components/KeyTakeaways';
import { AuthorBio } from '../../components/AuthorBio';
import { SocialShare } from '../../components/SocialShare';
import { blogs } from '../../data/blogs';
import { SITE_URL } from '../../lib/siteConfig';
import { examDates } from '../../config/examDates';
import { NotFoundPage } from './NotFoundPage';
import { motion } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceProvider';


// Type definition for safe global access
declare global {
    var SEO_QUESTION_DATA: any;
}

export const QuestionPage = () => {
    const { exam, slug } = useParams();
    const { tier } = usePerformance();
    const isLow = tier === 'low';
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';

    // 1. SSG Hydration Strategy
    const ssrData = (typeof globalThis !== 'undefined' && globalThis.SEO_QUESTION_DATA)
        ? globalThis.SEO_QUESTION_DATA
        : null;

    // 2. State
    const [question] = useState<any>(ssrData);
    const [loading, setLoading] = useState(!ssrData);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
            // For questions, we generate a cheat sheet of the topic
            const content = await generateCheatSheetContent(question?.topic || 'General Topic', question?.subject || 'General Subject');
            if (content) await downloadCheatSheetPDF(content);
        } catch (e) {
            console.error("PDF download failed", e);
        } finally {
            setGeneratingPdf(false);
        }
    };

    // 3. Client-Side Fallback (Simplified for SSG-first)
    useEffect(() => {
        if (!question && slug && !ssrData) {
            console.warn("Question not found in initial state (CSR fallback missing in strict mode).");
            setLoading(false);
        }
    }, [question, slug, ssrData]);

    if (loading && !ssrData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={48} />
            </div>
        );
    }

    if (!question) {
        return <NotFoundPage />;
    }

    // 4. SEO & Metadata Construction (Strict 60-char limit for Bing)
    const targetYear = examDates.getExamYear(exam || '');
    const topicText = question.topic ? (question.topic.length > 20 ? `${question.topic.substring(0, 20)}...` : question.topic) : 'Practice';
    const pageTitle = `Q: ${topicText} | ${formattedExam} ${targetYear} PDF Solution`;
    const description = `Practice this ${question.topic || 'important'} question for ${formattedExam}. Step-by-step solution with concept explanation, exam tip, and free PDF download for ${targetYear} prep.`;

    // SEO Penalty Protection: Noindex thin questions (disabled)

    // CANONICAL FIX: Use the canonical exam (first exam to claim this question) to prevent duplicate content
    const canonicalExam = question.canonicalExam || exam;
    const canonicalUrl = `${SITE_URL}/${canonicalExam}/q/${slug}`;

    const correctAnswerText = question.options?.[question.correctAnswer] || 'See Solution';

    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Quiz",
                "name": pageTitle,
                "educationLevel": "High School",
                "hasPart": {
                    "@type": "Question",
                    "name": question.text,
                    "educationLevel": "High School",
                    "suggestedAnswer": {
                        "@type": "Answer",
                        "text": `Answer: ${correctAnswerText}. ${question.explanation}`
                    },
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": correctAnswerText
                    }
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": question.text,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `The correct answer is ${correctAnswerText}. ${question.explanation}`
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `Which chapter does this ${formattedExam} question belong to?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `This question is from the chapter "${question.topic || 'General'}" in ${question.subject || 'the syllabus'} for ${formattedExam}.`
                        }
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `${SITE_URL}/${exam}` },
                    ...(question.subject ? [{
                        "@type": "ListItem",
                        "position": 3,
                        "name": question.subject,
                        "item": `${SITE_URL}/${exam}/${slugify(question.subject)}`
                    }] : []),
                    {
                        "@type": "ListItem",
                        "position": question.subject ? 4 : 3,
                        "name": "Question",
                        "item": canonicalUrl
                    }
                ]
            }
        ]
    };

    return (
        <div className={`min-h-screen bg-black text-white selection:bg-purple-500/30 perf-tier-${tier}`}>
            <SEO
                title={pageTitle}
                description={description}
                canonical={canonicalUrl}
                schema={schemaData}
            />
            <Navbar />

            <motion.main 
                initial={isLow ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="pt-20 md:pt-28 pb-20 px-6 max-w-4xl mx-auto will-change-transform"
            >
                <nav className="flex gap-2 text-sm text-gray-300 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link>
                    {question.subject && (
                        <>
                            <span>/</span>
                            <Link to={`/${exam}/${slugify(question.subject)}`} className="hover:text-white transition-colors">{question.subject}</Link>
                        </>
                    )}
                </nav>

                <article className="glass-card bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Brain size={150} />
                    </div>

                    <header className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex gap-3 flex-wrap">
                                {question.subject && (
                                    <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30 font-medium">
                                        {question.subject}
                                    </span>
                                )}
                                {question.topic && (
                                    <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30 font-medium">
                                        {question.topic}
                                    </span>
                                )}
                                {question.sourceYear && (
                                    <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30 font-bold tracking-wide">
                                        PYQ {question.sourceYear}
                                    </span>
                                )}
                            </div>
                            <SocialShare title={`Solve this ${formattedExam} Question on ${question.topic || 'Exam Compass'}`} />
                        </div>


                        <div className="prose prose-invert mb-6 max-w-none">
                            <p className="text-gray-300 text-sm uppercase tracking-wider mb-2 font-semibold">Question Context — {question.topic || 'Concept'}</p>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                This question is from <strong className="text-white">{question.topic || 'core concepts'}</strong> in {question.subject || 'the syllabus'}.
                                {question.sourceYear ? ` It appeared in the ${formattedExam} ${question.sourceYear} paper.` : ` It mirrors the pattern commonly seen in ${formattedExam} papers.`}
                                Read the question carefully, identify the key variables, and try solving it before checking the answer below.
                            </p>
                        </div>

                        <KeyTakeaways 
                            points={[
                                `Chapter: ${question.topic || 'General'} → ${question.subject || 'Syllabus'}`,
                                `Correct Answer: Option ${String.fromCharCode(65 + (question.correctAnswer || 0))}`,
                                question.sourceYear ? `Source: ${formattedExam} ${question.sourceYear} PYQ` : `Pattern: ${formattedExam} style question`,
                                `Difficulty: ${question.difficulty || 'Medium'}`
                            ]} 
                        />
                    </header>


                    <h1 className="text-xl md:text-3xl font-bold mb-8 leading-relaxed">
                        {question.text}
                    </h1>

                    <h2 className="sr-only">Multiple Choice Options</h2>
                    <div className="grid gap-4 mb-8">
                        {(Array.isArray(question.options) ? question.options : Object.values(question.options || {})).map((opt: string, i: number) => (
                            <div key={i} className={`p-4 rounded-xl border transition-all ${i === question.correctAnswer
                                ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold'
                                : 'bg-black/20 border-white/10 text-gray-300'
                                }`}>
                                <span className="mr-4 text-white/50">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                                {i === question.correctAnswer && <CheckCircle size={20} className="inline float-right" />}
                            </div>
                        ))}
                    </div>

                    {/* Phase 3: Structured Content Depth for Questions */}
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8">
                        <div className="p-4 bg-purple-500/10 border-b border-white/10 flex items-center gap-2">
                            <Brain size={20} className="text-purple-400" />
                            <h2 className="font-bold text-lg text-purple-300">
                                Detailed Solution & Analysis
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Step-by-Step Solution */}
                            <div>
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-purple-500 text-[10px] flex items-center justify-center font-bold">1</span>
                                    Explanation
                                </h3>
                                <div className="text-gray-300 leading-relaxed pl-7">
                                    {question.explanation}
                                </div>
                            </div>
                            
                            {/* Concept Applied */}
                            {question.topic && (
                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-blue-500 text-[10px] flex items-center justify-center font-bold">2</span>
                                        Concept Applied
                                    </h3>
                                    <div className="text-gray-300 leading-relaxed pl-7 text-sm">
                                        This question tests your fundamental understanding of <strong className="text-blue-300">{question.topic}</strong>. Reviewing the core principles and boundary conditions of this topic is essential for anticipating variations of this question.
                                    </div>
                                </div>
                            )}

                            {/* Exam Tip */}
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-pink-500 text-[10px] flex items-center justify-center font-bold">3</span>
                                    Exam Strategy
                                </h3>
                                <div className="text-gray-300 leading-relaxed pl-7 text-sm">
                                    Always identify the known variables and target variable first. In typical {(exam || 'competitive').toUpperCase()} problems from {question.subject || 'this section'}, eliminating mathematically impossible options (like dimensional mismatches) can often skip the calculation step entirely, saving you 30-40 seconds.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phase 6: Blog Cross-Link — match question topic to blog notes */}
                    {(() => {
                        const topicSlug = slugify(question.topic || '');
                        const matchedBlog = blogs.find(b => {
                            const blogId = b.id.toLowerCase();
                            return blogId.includes(topicSlug) || topicSlug.includes(blogId.replace(/-revision-notes$/, ''));
                        });
                        if (!matchedBlog) return null;
                        return (
                            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <Link
                                    to={`/blog/${matchedBlog.id}`}
                                    className="flex items-center gap-3 text-blue-300 hover:text-white transition-colors font-medium text-sm"
                                >
                                    <span className="text-lg">📖</span>
                                    Read Full Chapter Notes: {matchedBlog.title}
                                </Link>
                            </div>
                        );
                    })()}

                    <div className="mt-10 flex flex-col md:flex-row items-center gap-4">
                        {question.subject && question.topic ? (
                            <Link to={`/${exam}/${slugify(question.subject)}/${slugify(question.topic)}/top-50-pyqs`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex-1 justify-center text-center">
                                View Top 50 PYQs for {question.topic}
                            </Link>
                        ) : (
                            <Link to={`/dashboard/mock?exam=${exam}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex-1 justify-center text-center">
                                Practice More Questions
                            </Link>
                        )}
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={generatingPdf}
                            className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex-1 justify-center disabled:opacity-50 group"
                        >
                            {generatingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />}
                            {generatingPdf ? 'Generating...' : 'Download Solution PDF'}
                        </button>
                    </div>

                    <AuthorBio 
                        name="Ayush Kumar"
                        role="Founder, ExamCompass"
                        bio="Class 12 student at KV Darbhanga, Bihar. Built ExamCompass as a personal study tool after analyzing 50+ past papers. All solutions are cross-verified against NCERT and coaching institute answer keys."
                        credentials={["KV Darbhanga, Bihar", "50+ PYQ Papers Analyzed", "NCERT-Verified Solutions"]}
                        linkedin="https://www.linkedin.com/in/ayush-kumar-a23260401"
                        twitter="https://x.com/Ayush_thelegend"
                        instagram="https://www.instagram.com/mr._.ayush_kr"
                    />


                    <div className="mt-16 pt-10 border-t border-white/10">
                        <h2 className="text-xl font-bold mb-6 text-gray-400 uppercase tracking-tighter">Continue Your Journey</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {SYLLABUS_DB[question.subject]?.filter((t: any) => t.topic !== question.topic).slice(0, 4).map((t: any, i: number) => (
                                <Link
                                    key={i}
                                    to={`/${exam}/${slugify(question.subject)}/${slugify(t.topic)}`}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all text-sm group"
                                >
                                    <span className="text-gray-500 block mb-1">Chapter {i + 1}</span>
                                    <span className="font-medium group-hover:text-purple-400">{t.topic}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 text-center text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed italic">
                        Disclaimer: This question is part of the Exam Compass AI-curated practice set for {formattedExam} 2026. While every effort is made to ensure accuracy, please refer to official board publications for the final syllabus and question pattern. Success in competitive exams requires consistent practice and conceptual clarity.
                    </div>
                </article>
            </motion.main>
            <Footer />
        </div>
    );
};
