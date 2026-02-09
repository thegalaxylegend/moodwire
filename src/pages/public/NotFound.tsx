
import { useLocation, Link } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { Brain, Home, Search } from 'lucide-react';

export const NotFound = () => {
    const location = useLocation();
    const brokenPath = location.pathname.split('/').pop()?.replace(/-/g, ' ') || '';

    // Smart Recovery Logic
    // Search the DB for any topic that contains parts of the broken slug
    const suggestions: { topic: string, url: string, subject: string }[] = [];
    const searchTerms = brokenPath.split(' ').filter(w => w.length > 3); // Filter small words

    if (searchTerms.length > 0) {
        Object.entries(SYLLABUS_DB).forEach(([subject, topics]) => {
            topics.forEach(t => {
                const topicLower = t.topic.toLowerCase();
                const isMatch = searchTerms.some(term => topicLower.includes(term.toLowerCase()));

                if (isMatch) {
                    // Start with JEE Mains as default exam context if unknown
                    suggestions.push({
                        topic: t.topic,
                        subject: subject,
                        url: `/jee-mains/${slugify(subject)}/${slugify(t.topic)}`
                    });
                }
            });
        });
    }

    // Limit suggestions
    const topSuggestions = suggestions.slice(0, 3);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-20">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Search size={48} className="text-red-400" />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-4">Page Not Found</h1>
                <p className="text-gray-400 max-w-lg mb-10">
                    We couldn't find the page <strong>"{location.pathname}"</strong>.
                    It might have been moved or deleted.
                </p>

                {topSuggestions.length > 0 && (
                    <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 text-left">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Brain size={18} className="text-purple-400" />
                            Were you looking for this?
                        </h3>
                        <div className="space-y-3">
                            {topSuggestions.map((s, i) => (
                                <Link key={i} to={s.url} className="block p-3 rounded-xl bg-black/20 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all">
                                    <div className="font-bold text-purple-200">{s.topic}</div>
                                    <div className="text-xs text-gray-500">{s.subject}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <Link to="/" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                        <Home size={18} /> Go Home
                    </Link>
                    <Link to="/jee-mains" className="px-6 py-3 bg-white/10 border border-white/10 rounded-full hover:bg-white/20 transition-all">
                        Browse Syllabus
                    </Link>
                </div>
            </div>
        </div>
    );
};
