import { useState, useEffect } from 'react';
import { Youtube, Globe, BookOpen, Loader2, ExternalLink, CloudUpload, X } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { SEO } from '../../components/SEO';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Resources = () => {
    const { user } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<any[]>([]);
    
    // Community PYQ State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadTopic, setUploadTopic] = useState('');
    const [uploadExam, setUploadExam] = useState('');
    const [uploadContent, setUploadContent] = useState('');
    const [uploadAnswer, setUploadAnswer] = useState('');
    const [uploading, setUploading] = useState(false);

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
                description="Access AI-curated video lectures, Previous Year Questions (PYQs), and study notes for JEE and NEET. Updated for 2026 syllabus."
            />
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-text-main">Study Resources & The Vault</h1>
                    <p className="text-text-muted mt-1">AI-curated content and Community-Verified PYQs.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg transition-all"
                >
                    <CloudUpload size={18} />
                    Contribute PYQ
                </button>
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

            {/* Upload PYQ Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={20} />
                        </button>
                        
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                            <BookOpen className="text-primary" /> Contribute to The Vault
                        </h2>
                        
                        <p className="text-sm text-text-muted mb-6">
                            Submit a Previous Year Question (PYQ) to the community vault. Our AI will verify its accuracy before it becomes public.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Target Exam</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. JEE Mains 2023"
                                        value={uploadExam}
                                        onChange={e => setUploadExam(e.target.value)}
                                        className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Topic</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Kinematics"
                                        value={uploadTopic}
                                        onChange={e => setUploadTopic(e.target.value)}
                                        className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Question Content</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Type the full question here..."
                                    value={uploadContent}
                                    onChange={e => setUploadContent(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-white outline-none focus:border-primary resize-none custom-scrollbar"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Correct Answer / Explanation</label>
                                <textarea 
                                    rows={2}
                                    placeholder="Provide the correct options and brief logic..."
                                    value={uploadAnswer}
                                    onChange={e => setUploadAnswer(e.target.value)}
                                    className="w-full bg-black/50 border border-border rounded-lg px-3 py-2 text-white outline-none focus:border-primary resize-none custom-scrollbar"
                                />
                            </div>
                            
                            <button
                                onClick={async () => {
                                    if(!uploadTopic || !uploadExam || !uploadContent) return;
                                    setUploading(true);
                                    try {
                                        await addDoc(collection(db, 'community_pyqs'), {
                                            exam: uploadExam,
                                            topic: uploadTopic,
                                            question: uploadContent,
                                            answer: uploadAnswer,
                                            submittedBy: user?.id || 'guest',
                                            status: 'pending_ai_verification',
                                            createdAt: serverTimestamp()
                                        });
                                        setShowUpload(false);
                                        setUploadExam('');
                                        setUploadTopic('');
                                        setUploadContent('');
                                        setUploadAnswer('');
                                        alert("Submitted successfully! The AI will verify this question shortly.");
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                disabled={uploading || !uploadTopic || !uploadExam || !uploadContent}
                                className="w-full py-3 mt-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : "Submit for Initial Verification"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
