import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Navbar } from '../../components/Navbar';
import { Loader2, Brain, CheckCircle } from 'lucide-react';
import { slugify } from '../../lib/utils';

// Type definition for safe global access
declare global {
    var SEO_COLLECTION_DATA: any;
}

export const PyqCollectionPage = () => {
    const { exam, subject, topic } = useParams();
    const formattedExam = exam?.replace(/-/g, ' ').toUpperCase() || 'EXAM';
    const formattedTopic = topic?.replace(/-/g, ' ').toUpperCase() || 'TOPIC';

    // 1. SSG Hydration Strategy
    const ssrData = (typeof globalThis !== 'undefined' && globalThis.SEO_COLLECTION_DATA)
        ? globalThis.SEO_COLLECTION_DATA
        : null;

    const [collectionData, setCollectionData] = useState<any>(ssrData);
    const [loading, setLoading] = useState(!ssrData);

    useEffect(() => {
        // Fallback for CSR if needed, though this is primarily SSG driven.
        if (!collectionData && !ssrData) {
            fetch('/question-db.json').then(res => res.json()).then(db => {
                
                // Fetch the matching questions
                const matched = Object.values(db).filter((q: any) => 
                    q.canonicalExam === exam && slugify(q.subject || '') === subject && slugify(q.topic || '') === topic
                );
                
                // Sort by year (descending) and take top 50
                const sorted = matched.sort((a: any, b: any) => (parseInt(b.sourceYear) || 0) - (parseInt(a.sourceYear) || 0));
                const top50 = sorted.slice(0, 50);

                setCollectionData({ questions: top50 });
                setLoading(false);
            }).catch(e => {
                console.error("Failed to load question db", e);
                setLoading(false);
            });
        }
    }, [collectionData, ssrData, exam, subject, topic]);

    if (loading && !ssrData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={48} />
            </div>
        );
    }

    if (!collectionData || !collectionData.questions || collectionData.questions.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white p-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Collection Not Found</h1>
                <Link to={`/${exam}`} className="text-purple-400 hover:underline">Return to {formattedExam}</Link>
            </div>
        );
    }

    const { questions } = collectionData;
    const pageTitle = `Top 50 Most Repeated ${formattedTopic} PYQs | ${formattedExam}`;
    const description = `A curated collection of the most important questions from ${formattedTopic}, fully solved with step-by-step concepts to prepare for ${formattedExam}.`;
    const canonicalUrl = `https://examcompass.pages.dev/${exam}/${subject}/${topic}/top-50-pyqs`;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <SEO
                title={pageTitle}
                description={description}
                canonical={canonicalUrl}
                type="collection"
            />
            <Navbar />

            <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <nav className="flex gap-2 text-sm text-gray-300 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={`/${exam}`} className="hover:text-white transition-colors">{formattedExam}</Link>
                    <span>/</span>
                    <Link to={`/${exam}/${subject}`} className="hover:text-white transition-colors capitalize">{subject?.replace(/-/g, ' ')}</Link>
                    <span>/</span>
                    <Link to={`/${exam}/${subject}/${topic}`} className="hover:text-white transition-colors capitalize">{topic?.replace(/-/g, ' ')}</Link>
                </nav>

                <article className="glass-card bg-white/5 border border-white/10 p-8 rounded-2xl relative overflow-hidden mb-12">
                     <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Brain size={150} />
                    </div>
                    <header className="mb-6 relative z-10">
                        <span className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm border border-yellow-500/30 font-bold tracking-wide mb-4 inline-block">
                            Curated PYQ Collection
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                            {pageTitle}
                        </h1>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            {description}
                        </p>
                    </header>
                </article>

                <div className="space-y-12">
                    {questions.map((q: any, index: number) => (
                        <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                                <h2 className="font-bold text-gray-300">Question #{index + 1}</h2>
                                {q.sourceYear && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">PYQ {q.sourceYear}</span>}
                            </div>
                            
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-6 leading-relaxed text-white">
                                    <Link to={`/${exam}/q/${q.slug}`} className="hover:text-purple-400 transition-colors">
                                        {q.text}
                                    </Link>
                                </h3>
                                
                                <div className="grid gap-3 mb-6">
                                    {(Array.isArray(q.options) ? q.options : Object.values(q.options || {})).map((opt: any, i: number) => (
                                        <div key={i} className={`p-3 rounded-xl border text-sm ${i === q.correctAnswer
                                            ? 'bg-green-500/10 border-green-500/50 text-green-400 font-bold'
                                            : 'bg-black/20 border-white/10 text-gray-400'
                                        }`}>
                                            <span className="mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>
                                            {opt}
                                            {i === q.correctAnswer && <CheckCircle size={16} className="inline-block ml-2 mb-0.5" />}
                                        </div>
                                    ))}
                                </div>
                                
                                {q.explanation && (
                                     <div className="mt-4 p-4 bg-purple-500/10 rounded border border-purple-500/20">
                                         <h4 className="font-bold text-purple-300 text-sm mb-2 text-uppercase flex items-center gap-2">
                                            <Brain size={16} /> Concept Applied
                                         </h4>
                                         <p className="text-gray-300 text-sm leading-relaxed">
                                             {q.explanation.substring(0, 150)}...
                                         </p>
                                         <Link to={`/${exam}/q/${q.slug}`} className="text-purple-400 text-sm mt-3 inline-block font-semibold hover:underline">
                                             Read Full Step-by-Step Solution →
                                         </Link>
                                     </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
