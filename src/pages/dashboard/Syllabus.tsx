import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw, BookOpen, Youtube, Globe, GraduationCap, Download, Sparkles } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { SYLLABUS_DB } from '../../lib/constants';
import { AuthGate } from '../../components/auth/AuthGate';

type SyllabusItem = {
    id: string; // generated from slug
    subject: string;
    topic: string;
    subtopics: string[];
    is_completed: boolean;
    mastery_score: number;
    resources: { youtube?: string, pyq?: string, web?: string } | null;
    classLevel: 'Class 8' | 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12';
    weightage: 'High' | 'Medium' | 'Low';
    examPattern: 'Passage' | 'MCQ' | 'Numerical';
};

export const Syllabus = () => {
    const { user } = useUserStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [syllabusData, setSyllabusData] = useState<Record<string, SyllabusItem[]>>({});
    const [selectedTopic, setSelectedTopic] = useState<SyllabusItem | null>(null);


    const [intent, setIntent] = useState<{ class?: string; exam?: string } | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('exam_compass_intent');
        if (stored) {
            try { setIntent(JSON.parse(stored)); } catch (e) { }
        }
    }, []);

    const displayUser = user || {
        id: 'guest',
        name: 'Guest',
        userClass: intent?.class || 'Class 12th',
        targetExam: intent?.exam || 'JEE Mains',
        isGuest: true
    };

    useEffect(() => {
        // Load syllabus if we have a user OR a displayUser (guest)
        if (displayUser) loadSyllabus();
    }, [user, intent]); // Re-run if real user logs in or intent loads

    const loadSyllabus = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const cacheKey = `syllabus_cache_${displayUser?.targetExam}_${displayUser?.userClass}_${user?.id || 'guest'}`;

            if (!forceRefresh) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const { data, timestamp } = JSON.parse(cached);
                        const fiveMinutes = 5 * 60 * 1000;
                        if (Date.now() - timestamp < fiveMinutes) {
                            console.log("🚀 Loading syllabus from cache");
                            setSyllabusData(data);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.warn("Cache parse failed", e);
                    }
                }
            }

            // ... Determine Subjects, Class Filter, and Progress Map (logic remains same)
            const exam = displayUser?.targetExam?.toLowerCase() || '';
            const userClass = displayUser?.userClass || '';
            const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);

            const isJEE = exam.includes('jee');
            const isNEET = exam.includes('neet');

            let relevantSubjects: string[] = [];
            
            if (isJunior || exam === 'school exams') {
                relevantSubjects = ['Mathematics', 'Science', 'Social Science', 'English'];
            } else {
                relevantSubjects = ['Physics', 'Chemistry'];
                if (isJEE) relevantSubjects.push('Mathematics');
                else if (isNEET) relevantSubjects.push('Biology');
                else {
                    relevantSubjects.push('Mathematics');
                    relevantSubjects.push('Biology');
                }
            }

            let allowedClasses: string[] = ['Class 11', 'Class 12'];
            if (isJunior) {
                const match = userClass.match(/Class (\d+)/);
                if (match) allowedClasses = [`Class ${match[1]}`];
            } else if (userClass === 'Class 11th') allowedClasses = ['Class 11'];
            else if (userClass === 'Class 12th') allowedClasses = ['Class 12'];
            else if (userClass === 'Dropper') allowedClasses = ['Class 11', 'Class 12'];

            const progressMap = new Map<string, any>();
            if (user && !user.isGuest) {
                try {
                    const q = query(collection(db, 'syllabus'), where('user_id', '==', user.id));
                    const snap = await getDocs(q);
                    snap.forEach(d => progressMap.set(d.data().topic, d.data()));
                } catch (err) {
                    console.warn("Could not fetch progress", err);
                }
            }

            const finalData: Record<string, SyllabusItem[]> = {};
            relevantSubjects.forEach(subject => {
                const rawTopics = SYLLABUS_DB[subject] || [];
                const filteredTopics = rawTopics.filter(t => allowedClasses.includes(t.class));
                if (filteredTopics.length > 0) {
                    finalData[subject] = filteredTopics.map(t => {
                        const saved = progressMap.get(t.topic);
                        return {
                            id: t.id, // Using deterministic ID from constants.ts
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
                }
            });

            // Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                data: finalData,
                timestamp: Date.now()
            }));

            setSyllabusData(finalData);

        } catch (e) {
            console.error("Failed to load syllabus", e);
        } finally {
            setLoading(false);
        }
    };

    const generateResources = async (item: SyllabusItem) => {
        const isEnglish = item.subject.toLowerCase() === 'english';
        const searchQuery = isEnglish
            ? `${item.classLevel} English ${item.topic} full chapter explanation`
            : `${item.subject} ${item.topic} one shot ${user?.targetExam}`;

        const tempResources = {
            youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
            web: `https://www.google.com/search?q=${encodeURIComponent(item.subject + " " + item.topic + " notes pdf " + (isEnglish ? item.classLevel : user?.targetExam))}`,
            pyq: `https://www.google.com/search?q=${encodeURIComponent(item.subject + " " + item.topic + " previous year questions " + (isEnglish ? item.classLevel : user?.targetExam))}`
        };

        const newSyllabus = { ...syllabusData };
        const topicList = newSyllabus[item.subject];
        const index = topicList.findIndex(t => t.topic === item.topic);
        if (index !== -1) {
            topicList[index].resources = tempResources;
            setSyllabusData(newSyllabus);
        }

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
            key={`${topic.topic}-${topic.classLevel}`}
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
                {topic.subtopics.slice(0, 3).map((sub, i) => (
                    <div key={i} className="text-xs text-text-muted flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-text-muted" /> {sub}
                    </div>
                ))}
                {topic.subtopics.length > 3 && (
                    <button
                        onClick={() => setSelectedTopic(topic)}
                        className="text-xs text-primary hover:underline mt-2"
                    >
                        + {topic.subtopics.length - 3} more subtopics
                    </button>
                )}
            </div>

            {/* Progress Bar & Actions */}
            <div className="pt-3">
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
                    <AuthGate mode="modal">
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const { generateCheatSheetContent, downloadCheatSheetPDF } = await import('../../services/cheatSheetService');
                                const content = await generateCheatSheetContent(topic.topic, topic.subject);
                                if (content) await downloadCheatSheetPDF(content);
                            }}
                            className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-transparent hover:border-primary/30 group/sparkle"
                            title="Generate AI Revision Cheat Sheet"
                        >
                            <Sparkles size={16} className="group-hover/sparkle:animate-pulse" />
                        </button>
                    </AuthGate>
                    {topic.resources ? (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Create a clean slug from topic name only
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
                        <AuthGate mode="modal">
                            <button
                                onClick={() => generateResources(topic)}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <RefreshCw size={12} /> Fetch Resources
                            </button>
                        </AuthGate>
                    )}

                    <div className="flex-1" />

                    <AuthGate mode="modal">
                        <button
                            onClick={() => navigate(`/dashboard/mock?topic=${encodeURIComponent(topic.topic)}`)}
                            className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded oxygen-button flex items-center gap-1"
                        >
                            <GraduationCap size={14} /> Test
                        </button>
                    </AuthGate>
                </div>
            </div>
        </div>
    );

    const handleDownloadPDF = async () => {
        setDownloadingPdf(true);
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);

            const doc = new jsPDF();

            // Title
            doc.setFontSize(20);
            doc.text(`ExmPass - Full Syllabus (${user?.targetExam})`, 14, 22);

            doc.setFontSize(11);
            doc.text(`Class: ${user?.userClass || 'N/A'} | Date: ${new Date().toLocaleDateString()}`, 14, 30);

            let finalY = 35;

            // Iterate through subjects
            Object.entries(syllabusData).forEach(([subject, topics]) => {
                // Subject Header
                doc.setFontSize(14);
                doc.setTextColor(100, 100, 255); // Light Blue-ish
                doc.text(subject, 14, finalY + 10);

                // Prepare table data
                const tableData = topics.map(t => {
                    return [t.topic, `${t.weightage} | ${t.examPattern}`, t.classLevel, t.is_completed ? 'Done' : 'Pending'];
                });

                autoTable(doc, {
                    startY: finalY + 15,
                    head: [['Chapter', 'Info', 'Class', 'Status']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 40, 50] },
                    styles: { fontSize: 10 },
                });

                // Update Y for next table (autotable attaches to doc key)
                finalY = (doc as any).lastAutoTable.finalY + 10;
            });

            doc.save(`${user?.targetExam}_Syllabus_ExamCompass.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <div className="space-y-8">
            <SEO
                title={`Full Syllabus & Progress Tracker (${user?.targetExam || 'General'}) | Exam Compass`}
                description="Track your exam preparation progress. View detailed syllabus, weightage analysis, and completion status for JEE, NEET, and more."
            />
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-heading font-bold text-text-main">Syllabus Tracker</h1>
                        <button
                            onClick={() => loadSyllabus(true)}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-primary"
                            title="Force Refresh Syllabus"
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
                        </button>
                    </div>
                    <p className="text-text-muted">Comprehensive curriculum for <strong>{displayUser?.targetExam}</strong> ({displayUser?.userClass})</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all disabled:opacity-50"
                >
                    {downloadingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    Download Syllabus PDF
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <Loader2 size={48} className="text-primary animate-spin" />
                    <h2 className="text-xl font-bold text-text-main">Loading Full Syllabus...</h2>
                    <p className="text-text-muted">Filtering for {displayUser?.targetExam} ({displayUser?.userClass})</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 animate-fade-in-up">
                    {Object.keys(syllabusData).length === 0 && (
                        <div className="p-8 text-center bg-surface border border-border rounded-xl">
                            <p className="text-text-muted">No syllabus data found for your specific configuration. Please check your profile settings.</p>
                        </div>
                    )}

                    {Object.entries(syllabusData).map(([subject, topics]) => {
                        const visibleTopics = topics.slice(0, 5);
                        const remainingCount = topics.length - 5;

                        return (
                            <div key={subject} className="glass-card p-6 space-y-6">
                                <div className="flex justify-between items-center border-b border-border pb-4">
                                    <h3 className="text-2xl font-bold text-text-main">{subject}</h3>
                                    <span className="text-sm font-mono text-text-muted">
                                        {topics.filter(t => t.is_completed).length} / {topics.length} Mastered
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visibleTopics.map(renderTopicCard)}

                                    {remainingCount > 0 && (
                                        <div
                                            onClick={() => navigate(`/dashboard/syllabus/${subject}`)}
                                            className="p-4 rounded-xl border border-dashed border-border bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group min-h-[200px]"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                                <BookOpen className="text-primary" size={24} />
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">View All {topics.length} Chapters</h4>
                                                <p className="text-xs text-text-muted mt-1">Access full {subject} syllabus</p>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-surface border border-border rounded text-text-muted">
                                                +{remainingCount} More Chapters
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {selectedTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm oxygen-modal-backdrop open">
                    <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6 oxygen-modal open">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-text-main mt-2">{selectedTopic.topic}</h3>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{selectedTopic.weightage} Weightage</span>
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{selectedTopic.examPattern}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTopic(null)} className="text-text-muted hover:text-text-main">
                                <span className="sr-only">Close</span>
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Full Topic Breakdown</h4>
                            {selectedTopic.subtopics.map((sub, i) => (
                                <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5 text-sm text-text-main">
                                    {sub}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/10">
                            <button
                                onClick={() => setSelectedTopic(null)}
                                className="px-4 py-2 bg-surface hover:bg-white/5 border border-border rounded-lg text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};
