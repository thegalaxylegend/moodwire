import { useState, useEffect } from 'react';
import { Youtube, Globe, BookOpen, Loader2, ExternalLink } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
// import { supabase } from '../../lib/supabase'; // REMOVED
import { SEO } from '../../components/SEO';

export const Resources = () => {
    const { user } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<any[]>([]);

    useEffect(() => {
        if (user) fetchResources();
    }, [user]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const { db } = await import('../../lib/firebase');
            const { collection, query, where, getDocs } = await import('firebase/firestore');

            // Fetch topics that have resources generated
            const q = query(collection(db, 'syllabus'), where('user_id', '==', user?.id));
            const snap = await getDocs(q);

            const data = snap.docs
                .map(d => d.data())
                .filter((d: any) => d.resources !== null);

            if (data.length > 0) setResources(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <SEO
                title="Free JEE & NEET Study Materials | Exam Compass Resources"
                description="Access AI-curated video lectures, Previous Year Questions (PYQs), and study notes for JEE, NEET, and UPSC. Updated for 2026 syllabus."
            />
            <header>
                <h1 className="text-3xl font-heading font-bold text-text-main">Study Resources</h1>
                <p className="text-text-muted">AI-curated content for your syllabus topics.</p>
            </header>

            {resources.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <BookOpen size={48} className="mx-auto text-text-muted mb-4" />
                    <h3 className="text-xl font-bold text-text-main">No Resources Yet</h3>
                    <p className="text-text-muted mt-2">Go to the Syllabus page and click "Fetch Resources" on any topic to populate this library.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((item) => (
                        <div key={item.id} className="glass-card p-6 space-y-4">
                            <div>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{item.subject}</span>
                                <h3 className="text-xl font-bold text-text-main mt-2">{item.topic}</h3>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <a
                                    href={item.resources.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-red-500/10 hover:border-red-500/50 border border-transparent transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                        <Youtube size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-text-main group-hover:text-red-400">Video Lectures</p>
                                        <p className="text-xs text-text-muted">YouTube Crash Courses</p>
                                    </div>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>

                                <a
                                    href={item.resources.pyq}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-yellow-500/10 hover:border-yellow-500/50 border border-transparent transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-text-main group-hover:text-yellow-400">PYQs</p>
                                        <p className="text-xs text-text-muted">Previous Year Papers</p>
                                    </div>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>

                                <a
                                    href={item.resources.web}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-blue-500/10 hover:border-blue-500/50 border border-transparent transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <Globe size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-text-main group-hover:text-blue-400">Web Notes</p>
                                        <p className="text-xs text-text-muted">Articles & PDFs</p>
                                    </div>
                                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
