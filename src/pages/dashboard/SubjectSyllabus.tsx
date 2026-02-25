import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Youtube, Globe, BookOpen, GraduationCap, ArrowLeft, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { SYLLABUS_DB } from '../../lib/constants';
import { SEO } from '../../components/SEO';

type SyllabusItem = {
    id: string;
    subject: string;
    topic: string;
    subtopics: string[];
    is_completed: boolean;
    mastery_score: number;
    resources: { youtube?: string, pyq?: string, web?: string } | null;
    classLevel: 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12';
    weightage: 'High' | 'Medium' | 'Low';
    examPattern: 'Passage' | 'MCQ' | 'Numerical';
};

export const SubjectSyllabus = () => {
    const { subject } = useParams<{ subject: string }>();
    const { user } = useUserStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [topics, setTopics] = useState<SyllabusItem[]>([]);

    useEffect(() => {
        if (user && subject) loadSubjectSyllabus();
    }, [user, subject]);

    const loadSubjectSyllabus = async () => {
        setLoading(true);
        try {
            if (!subject) return;

            // 1. Fetch User Progress from DB
            const progressMap = new Map<string, any>();
            try {
                const q = query(collection(db, 'syllabus'), where('user_id', '==', user?.id), where('subject', '==', subject));
                const snap = await getDocs(q);
                snap.forEach(d => {
                    const data = d.data();
                    progressMap.set(data.topic, data);
                });
            } catch (err) {
                console.warn("Could not fetch progress", err);
            }

            // 2. Filter Topics from Constants
            const rawTopics = SYLLABUS_DB[subject] || [];

            // Apply User Class Filters (same logic as main Syllabus)
            const userClass = user?.userClass;
            const showClass11 = userClass === 'Class 11th' || userClass === 'Dropper' || !userClass;
            const showClass12 = userClass === 'Class 12th' || userClass === 'Dropper' || !userClass;

            const filtered = rawTopics.filter(t => {
                if (t.class === 'Class 11' && !showClass11) return false;
                if (t.class === 'Class 12' && !showClass12) return false;
                return true;
            });

            const finalTopics = filtered.map(t => {
                const saved = progressMap.get(t.topic);
                return {
                    id: saved?.id || `${subject}-${t.topic}`.replace(/\s+/g, '-').toLowerCase(),
                    subject: subject,
                    topic: t.topic,
                    subtopics: t.subtopics,
                    is_completed: saved?.is_completed || false,
                    mastery_score: saved?.mastery_score || 0,
                    resources: saved?.resources || null,
                    classLevel: t.class,
                    weightage: t.weightage,
                    examPattern: t.examPattern
                };
            });

            setTopics(finalTopics);
        } catch (e) {
            console.error("Failed to load subject syllabus", e);
        } finally {
            setLoading(false);
        }
    };

    const generateResources = async (item: SyllabusItem) => {
        const tempResources = {
            youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.subject + " " + item.topic + " one shot " + user?.targetExam)}`,
            web: `https://www.google.com/search?q=${encodeURIComponent(item.subject + " " + item.topic + " notes pdf " + user?.targetExam)}`,
            pyq: `https://www.google.com/search?q=${encodeURIComponent(item.subject + " " + item.topic + " previous year questions " + user?.targetExam)}`
        };

        const updatedTopics = topics.map(t => t.topic === item.topic ? { ...t, resources: tempResources } : t);
        setTopics(updatedTopics);

        try {
            const q = query(collection(db, 'syllabus'), where('user_id', '==', user?.id), where('topic', '==', item.topic));
            const snap = await getDocs(q);

            let docRef;
            if (!snap.empty) {
                docRef = doc(db, 'syllabus', snap.docs[0].id);
                await updateDoc(docRef, { resources: tempResources });
            } else {
                docRef = doc(collection(db, 'syllabus'));
                await setDoc(docRef, {
                    user_id: user?.id,
                    subject: item.subject,
                    topic: item.topic,
                    subtopics: item.subtopics,
                    is_completed: false,
                    mastery_score: 0,
                    resources: tempResources
                });
            }
        } catch (e) {
            console.error("Failed to save resources", e);
        }
    };

    const renderTopicCard = (topic: SyllabusItem) => (
        <div
            key={topic.topic}
            className={`p-4 rounded-xl border oxygen-card ${topic.is_completed ? 'bg-green-500/10 border-green-500/30' : 'bg-surface border-border'
                }`}
        >
            <div className="flex justify-between items-start mb-3 gap-2">
                <div className="space-y-1">
                    <div className="flex gap-2 flex-wrap">
                        {topic.weightage === 'High' && <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold uppercase rounded border border-red-500/30">High Weightage</span>}
                        {topic.weightage === 'Medium' && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold uppercase rounded border border-yellow-500/30">Medium Weightage</span>}
                        {topic.weightage === 'Low' && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase rounded border border-blue-500/30">Low Weightage</span>}

                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase rounded border border-purple-500/30">
                            {topic.examPattern}
                        </span>

                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-700">
                            {topic.classLevel}
                        </span>
                    </div>
                    <h4 className={`font-bold ${topic.is_completed ? 'text-green-400' : 'text-text-main'}`}>
                        {topic.topic}
                    </h4>
                </div>
                {topic.is_completed ? (
                    <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                ) : (
                    <Circle className="text-text-muted shrink-0" size={20} />
                )}
            </div>

            <div className="space-y-1 mb-4">
                {topic.subtopics.map((sub, i) => (
                    <div key={i} className="text-xs text-text-muted flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-text-muted" /> {sub}
                    </div>
                ))}
            </div>

            <div className="pt-3 border-t border-white/5">
                {/* Dynamic Progress Bar */}
                {(() => {
                    const cleanSlug = topic.topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
                    const saved = localStorage.getItem(`syllabus-progress-${cleanSlug}`);
                    const progressPercent = saved ? parseInt(saved) : 0;

                    return (
                        <div className="mb-3">
                            <div className="flex justify-end mb-1">
                                <span className="text-[10px] font-bold text-primary">{progressPercent}% Completed</span>
                            </div>
                            <div className="w-full h-1 bg-surface border border-white/5 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}

                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
                            const content = await generateCheatSheetContent(topic.topic, topic.subject);
                            if (content) await downloadCheatSheetPDF(content);
                        }}
                        className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-transparent hover:border-primary/30 group/sparkle"
                        title="Generate AI Revision Cheat Sheet"
                    >
                        <Sparkles size={16} className="group-hover/sparkle:animate-pulse" />
                    </button>
                    {topic.resources ? (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanSlug = topic.topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim();
                                    navigate(`/dashboard/lectures/${cleanSlug}`);
                                }}
                                className="p-2 hover:bg-red-500/20 text-text-muted hover:text-red-400 rounded-lg transition-colors"
                                title="Watch Video Lecture"
                            >
                                <Youtube size={16} />
                            </button>
                            <a href={topic.resources.web} target="_blank" rel="noreferrer" className="p-2 hover:bg-blue-500/20 text-text-muted hover:text-blue-400 rounded-lg transition-colors" title="Notes & Articles">
                                <Globe size={16} />
                            </a>
                            <a href={topic.resources.pyq} target="_blank" rel="noreferrer" className="p-2 hover:bg-yellow-500/20 text-text-muted hover:text-yellow-400 rounded-lg transition-colors" title="Previous Year Questions">
                                <BookOpen size={16} />
                            </a>
                        </div>
                    ) : (
                        <button
                            onClick={() => generateResources(topic)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <RefreshCw size={12} /> Fetch Resources
                        </button>
                    )}

                    <div className="flex-1" />

                    <button
                        onClick={() => navigate(`/dashboard/mock?topic=${encodeURIComponent(topic.topic)}`)}
                        className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded oxygen-button flex items-center gap-1"
                    >
                        <GraduationCap size={14} /> Test
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <h2 className="text-xl font-bold text-text-main">Loading {subject} Syllabus...</h2>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <SEO
                title={`${subject} Full Syllabus | Exam Compass`}
                description={`Access all chapters and topics for ${subject} for ${user?.targetExam}. Track your progress and access study resources.`}
            />

            <button
                onClick={() => navigate('/dashboard/syllabus')}
                className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group mb-4"
            >
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center group-hover:border-primary/50">
                    <ArrowLeft size={18} />
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">Back to Syllabus</span>
            </button>

            <header className="space-y-2">
                <h1 className="text-4xl font-heading font-bold text-text-main">{subject} Full Syllabus</h1>
                <p className="text-text-muted">Displaying all {topics.length} chapters found in the curriculum.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {topics.map(renderTopicCard)}
            </div>
        </div>
    );
};
