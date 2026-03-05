import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { CheckCircle } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { slugify } from '../../lib/utils';
import { SYLLABUS_DB } from '../../lib/constants';

// Type definition for safe global access
declare global {
    var SEO_QUESTION_DATA: any;
}

export const QuestionPage = () => {
    const { exam, slug } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';

    // 1. SSG Hydration Strategy
    const ssrData = (typeof globalThis !== 'undefined' && globalThis.SEO_QUESTION_DATA)
        ? globalThis.SEO_QUESTION_DATA
        : null;

    // 2. State
    const [question] = useState<any>(ssrData);
    const [loading, setLoading] = useState(!ssrData);

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
        return (
            <div className="min-h-screen bg-black text-white p-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Question Not Found</h1>
                <Link to={`/${exam}`} className="text-purple-400 hover:underline">Return to {formattedExam}</Link>
            </div>
        );
    }

    // 4. SEO & Metadata Construction
    const pageTitle = question.text
        ? `${question.text.substring(0, 45)}... | ${formattedExam}`
        : `${formattedExam} Practice Question`;

    const description = question.explanation
        ? `Detailed solution: ${question.explanation.substring(0, 150)}... Practice now.`
        : `Practice this ${formattedExam} question on ${question.topic}.`;

    const canonicalUrl = `https://examcompass.web.app/${exam}/q/${slug}`;

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
                        "text": `Answer: ${question.options?.[question.correctAnswer] || 'See Solution'}. ${question.explanation}`
                    },
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": question.options?.[question.correctAnswer] || "Check Solution"
                    }
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://examcompass.web.app/" },
                    { "@type": "ListItem", "position": 2, "name": formattedExam, "item": `https://examcompass.web.app/${exam}` },
                    ...(question.subject ? [{
                        "@type": "ListItem",
                        "position": 3,
                        "name": question.subject,
                        "item": `https://examcompass.web.app/${exam}/${slugify(question.subject)}`
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
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={pageTitle}
                description={description}
                canonical={canonicalUrl}
                schema={schemaData}
            />
            <Navbar />

            <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
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
                        <div className="flex gap-3 mb-6 flex-wrap">
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

                        <div className="prose prose-invert mb-6 max-w-none">
                            <p className="text-gray-300 text-sm uppercase tracking-wider mb-2 font-semibold">Detailed Question Analysis</p>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                This challenging question tests your deep understanding of <strong className="text-white">{question.topic || 'core concepts'}</strong> within the broader context of {question.subject || 'the syllabus'}.
                                Solving problems of this complexity is crucial for the {formattedExam} examination 2026, as it requires a blend of precise theoretical knowledge and agile practical application skills.
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                                Review the question text carefully, paying close attention to any given constraints or specific units. Attempting to solve it independently before looking at the solution is an effective way to identify your conceptual blind spots.
                                Our AI-driven adaptive engine analyzes your performance on questions like this to help build your success probability profile for the {formattedExam}.
                            </p>
                        </div>
                    </header>

                    <h1 className="text-xl md:text-3xl font-bold mb-8 leading-relaxed">
                        {question.text}
                    </h1>

                    <div className="grid gap-4 mb-8">
                        {question.options?.map((opt: string, i: number) => (
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

                    <div className="bg-white/5 rounded-xl p-6 border-l-4 border-purple-500">
                        <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Brain size={20} className="text-purple-400" />
                            AI Explanation
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            {question.explanation}
                        </p>
                    </div>

                    <div className="mt-10 text-center">
                        <Link to={`/dashboard/mock?exam=${exam}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                            Practice More Questions Like This
                        </Link>
                    </div>

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
            </section>
        </div>
    );
};
