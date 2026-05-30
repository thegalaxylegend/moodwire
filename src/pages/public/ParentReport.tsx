import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert, Download, Brain, Target, TrendingUp, Clock, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getWeakTopics, getStrongTopics } from '../../services/topicStrengthService';

export const ParentReport = () => {
    const { userId } = useParams<{ userId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [weakTopics, setWeakTopics] = useState<any[]>([]);
    const [strongTopics, setStrongTopics] = useState<any[]>([]);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!userId) {
                setError("No user ID provided.");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch User Base Data
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) {
                    setError("User not found.");
                    setLoading(false);
                    return;
                }
                const data = userDoc.data();
                setUserData(data);

                // 2. Fetch Topics
                const weak = await getWeakTopics(userId, 5, data.userClass, data.targetExam);
                const strong = await getStrongTopics(userId, 5, data.userClass, data.targetExam);
                
                setWeakTopics(weak);
                setStrongTopics(strong);

            } catch (err) {
                console.error("Report Fetch Error:", err);
                setError("Failed to load report. Ensure you have the correct link.");
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [userId]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('report-content');
            if (!element) throw new Error("Report element not found");
            const opt = {
                margin: 0.5,
                filename: `${userData?.name || 'Student'}_ExamCompass_Report.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0b10] flex flex-col items-center justify-center space-y-4">
                <Brain className="animate-pulse text-purple-500" size={48} />
                <h2 className="text-xl font-manrope text-white">Compiling Confidential Report…</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0b10] flex flex-col items-center justify-center space-y-4 p-8">
                <ShieldAlert className="text-red-500" size={64} />
                <h2 className="text-2xl font-bold text-white text-center">{error}</h2>
                <Link to="/" className="text-purple-400 hover:text-purple-300 underline">Return Home</Link>
            </div>
        );
    }

    const daysUntilExam = userData?.examDate 
        ? Math.max(0, Math.ceil((new Date(userData.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
        : null;

    return (
        <div className="min-h-screen bg-[#0a0b10] py-12 px-4 font-manrope text-white overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Action */}
                <div className="flex justify-between items-center bg-[#1a1b23] p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <Target className="text-purple-500" size={24} />
                        <h1 className="text-xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            ExamCompass Parent Portal
                        </h1>
                    </div>
                    <button type="button" 
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-bold"
                    >
                        {downloading ? <Brain className="animate-spin" size={16} /> : <Download size={16} />}
                        Export PDF
                    </button>
                </div>

                {/* Main Printable Content */}
                <div id="report-content" className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-200">
                    
                    {/* Student Info */}
                    <div className="border-b border-slate-200 pb-8 mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 mb-2">{userData.name}</h2>
                            <p className="text-lg text-slate-600 font-medium">
                                Class: {userData.userClass} | Target: <span className="font-bold text-purple-700">{userData.targetExam}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-1">Generated On</p>
                            <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* High Level Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                            <TrendingUp className="text-emerald-500 mb-2" size={28} />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total XP</h3>
                            <p className="text-2xl font-black text-slate-800">{userData.lifetimeXp?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                            <Clock className="text-blue-500 mb-2" size={28} />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Study Streak</h3>
                            <p className="text-2xl font-black text-slate-800">{userData.streak || 0} Days</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                            <BookOpen className="text-purple-500 mb-2" size={28} />
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Topics Mastered</h3>
                            <p className="text-2xl font-black text-slate-800">{strongTopics.length * 3}</p>
                        </div>
                        {daysUntilExam !== null && (
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center text-center">
                                <AlertTriangle className="text-red-500 mb-2" size={28} />
                                <h3 className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">Days to Exam</h3>
                                <p className="text-2xl font-black text-red-700">{daysUntilExam}</p>
                            </div>
                        )}
                    </div>

                    {/* Topic Analysis */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        
                        {/* Strengths */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 className="text-emerald-500" size={24} />
                                <h3 className="text-xl font-bold text-slate-800">Top Strengths</h3>
                            </div>
                            {strongTopics.length > 0 ? (
                                <ul className="space-y-3">
                                    {strongTopics.map((t, idx) => (
                                        <li key={idx} className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex justify-between items-center">
                                            <span className="font-semibold text-emerald-900">{t.topic}</span>
                                            <span className="text-sm font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                                                {Math.round(t.winRate * 100)}% Win
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 italic">Not enough data to determine strengths.</p>
                            )}
                        </div>

                        {/* Weaknesses */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="text-red-500" size={24} />
                                <h3 className="text-xl font-bold text-slate-800">Critical Weaknesses</h3>
                            </div>
                            {weakTopics.length > 0 ? (
                                <ul className="space-y-3">
                                    {weakTopics.map((t, idx) => (
                                        <li key={idx} className="bg-red-50 border border-red-100 p-3 rounded-lg flex justify-between items-center">
                                            <span className="font-semibold text-red-900">{t.topic}</span>
                                            <span className="text-sm font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded">
                                                {Math.round((1 - t.winRate) * 100)}% Error
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 italic">All topics look solid right now or not enough data.</p>
                            )}
                        </div>
                    </div>

                    {weakTopics.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                            <h4 className="text-blue-800 font-bold mb-2">Automated Next Steps</h4>
                            <p className="text-blue-900 leading-relaxed">
                                The ExamCompass AI has automatically injected targeted revision missions for <strong>{weakTopics[0]?.topic}</strong> into {userData.name}'s daily study plan. The Spaced Repetition engine will present these concepts in increasingly spaced intervals until a 100% mastery threshold is restored.
                            </p>
                        </div>
                    )}
                    
                    <div className="mt-16 text-center text-slate-400 text-xs border-t border-slate-100 pt-6">
                        Automatically generated by ExamCompass AI Core.
                        Confidential Academic Report.
                    </div>
                </div>
            </div>
        </div>
    );
};
