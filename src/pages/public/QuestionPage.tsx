import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { CheckCircle, Brain, Loader2 } from 'lucide-react';
import { slugify } from '../../lib/utils';

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
        ? `Q: ${question.text.substring(0, 60)}... | ${formattedExam} Prep`
        : `${formattedExam} Practice Question`;

    const description = question.explanation
        ? `Detailed solution: ${question.explanation.substring(0, 150)}... Practice now.`
        : `Practice this ${formattedExam} question on ${question.topic}.`;

    const canonicalUrl = `https://examcompass.web.app/${exam}/q/${slug}`;

    const schemaData = {
        "@context": "https://schema.org",
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
                <nav className="flex gap-2 text-sm text-gray-400 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-white">Home</Link>
                    <span>/</span>
                    <Link to={`/${exam}`} className="hover:text-white">{formattedExam}</Link>
                    {question.subject && (
                        <>
                            <span>/</span>
                            <Link to={`/${exam}/${slugify(question.subject)}`} className="hover:text-white">{question.subject}</Link>
                        </>
                    )}
                </nav>

                <div className="glass-card bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Brain size={150} />
                    </div>

                    <div className="flex gap-3 mb-6 flex-wrap">
                        {question.subject && (
                            <span className="px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                                {question.subject}
                            </span>
                        )}
                        {question.topic && (
                            <span className="px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                                {question.topic}
                            </span>
                        )}
                        {question.sourceYear && (
                            <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30">
                                PYQ {question.sourceYear}
                            </span>
                        )}
                    </div>

                    <h1 className="text-xl md:text-3xl font-bold mb-8 leading-relaxed">
                        {question.text}
                    </h1>

                    <div className="grid gap-4 mb-8">
                        {question.options?.map((opt: string, i: number) => (
                            <div key={i} className={`p-4 rounded-xl border transition-all ${i === question.correctAnswer
                                ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold'
                                : 'bg-black/20 border-white/10 text-gray-400'
                                }`}>
                                <span className="mr-4 text-white/50">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                                {i === question.correctAnswer && <CheckCircle size={20} className="inline float-right" />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border-l-4 border-purple-500">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Brain size={20} className="text-purple-400" />
                            AI Explanation
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                            {question.explanation}
                        </p>
                    </div>

                    <div className="mt-10 text-center">
                        <Link to={`/dashboard/mock?exam=${exam}`} className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                            Practice More Questions Like This
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
