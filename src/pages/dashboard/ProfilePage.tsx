import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, LogOut, Loader2, Award, BookOpen, TrendingUp, Check } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { CustomSelect } from '../../components/CustomSelect';
import { RankBadge } from '../../components/gamification/RankBadge';
import { XPProgress } from '../../components/gamification/XPProgress';
import { ReferralModal } from '../../components/ReferralModal';

export const ProfilePage = () => {
    const { user, updateProfile, logout } = useUserStore();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [userClass, setUserClass] = useState(user?.userClass || '');
    const [targetExam, setTargetExam] = useState(user?.targetExam || '');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ completed: 0, total: 0, mockAvg: 0, mockCount: 0 });
    const [referralOpen, setReferralOpen] = useState(false);

    useEffect(() => {
        console.log("[Profile] Loaded. Current State Class:", userClass);
    }, []);

    useEffect(() => {
        console.log("[Profile] Class changed to:", userClass);
    }, [userClass]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUserClass(user.userClass || '');
            setTargetExam(user.targetExam || '');
            fetchStats();
        }
    }, [user]);

    // Handle Class Change Logic
    useEffect(() => {
        const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(userClass);
        if (isJunior) {
            if (targetExam !== 'School Exams') setTargetExam('School Exams');
        } else {
            // If switching TO senior class FROM junior/school exams, clear it or keep existing if valid
            if (targetExam === 'School Exams') setTargetExam('');
        }
    }, [userClass]);

    const fetchStats = async () => {
        if (!user) return;

        const { db } = await import('../../lib/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');

        let completed = 0;
        let total = 0;
        try {
            const sylQuery = query(collection(db, 'syllabus'), where('user_id', '==', user.id));
            const sylSnap = await getDocs(sylQuery);
            const syl = sylSnap.docs.map(doc => doc.data());

            if (syl) {
                completed = syl.filter((s: any) => s.is_completed).length;
                total = syl.length;
                setProgress(syl.length > 0 ? Math.round((completed / syl.length) * 100) : 0);
            }
        } catch (e) {
            console.error("Error fetching syllabus:", e);
        }

        let mockAvg = 0;
        let mockCount = 0;
        try {
            const mockQuery = query(collection(db, 'mock_attempts'), where('user_id', '==', user.id));
            const mockSnap = await getDocs(mockQuery);
            const mocks = mockSnap.docs.map(doc => doc.data());

            if (mocks && mocks.length > 0) {
                const totalScore = mocks.reduce((sum: number, m: any) => sum + m.score, 0);
                const totalMax = mocks.reduce((sum: number, m: any) => sum + (m.total_questions * 4), 0);
                mockAvg = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
                mockCount = mocks.length;
            }
        } catch (e) {
            console.error("Error fetching mocks:", e);
        }

        setStats({ completed, total, mockAvg, mockCount });
    };

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);
        try {
            await updateProfile({ name, userClass, targetExam });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-text-main">My Profile</h1>

            <div className="bg-surface border border-border rounded-3xl w-full shadow-lg flex flex-col md:flex-row overflow-visible min-h-[500px]">

                {/* LEFT PANEL: Identity (Gradient) - ADDED ROUNDING TO PREVENT SPILL */}
                <div className="w-full md:w-1/3 bg-gradient-to-br from-primary/10 via-surface to-accent/10 border-b md:border-b-0 md:border-r border-border p-8 flex flex-col items-center justify-center text-center relative shrink-0 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">

                    <div className="relative group mb-6">
                        {/* Rank Badge Integration */}
                        <div className="scale-150 mb-4">
                            <RankBadge
                                xp={user?.xp || 0}
                                size="lg"
                                showLabel={false}
                                onClick={() => navigate('/dashboard/ranks')}
                            />
                        </div>

                        <div className="w-32 h-32 rounded-full border-4 border-surface bg-surface shadow-xl overflow-hidden flex items-center justify-center relative z-10">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white">
                                    {user?.name?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-text-main mb-1">{user?.name || 'User'}</h2>
                    <p className="text-sm text-text-muted mb-4">{user?.email}</p>

                    {/* XP Progress Bar */}
                    <div className="w-full max-w-[200px] mb-6">
                        <XPProgress xp={user?.xp || 0} />
                    </div>

                    <button
                        onClick={() => setReferralOpen(true)}
                        className="w-full max-w-[200px] py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <Award size={18} /> Refer & Earn
                    </button>
                </div>

                {/* RIGHT PANEL: Stats & Forms */}
                <div className="w-full md:w-2/3 p-8">
                    <div className="space-y-8">
                        {/* Highlights Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm">
                                <Award className="text-accent mb-2" size={20} />
                                <span className="text-xl font-bold text-text-main">{user?.streak || 0}</span>
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Streak</span>
                            </div>
                            <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm">
                                <TrendingUp className="text-primary mb-2" size={20} />
                                <span className="text-xl font-bold text-text-main">{(user?.lifetimeXp || 0) + (user?.xp || 0)}</span>
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Lifetime XP</span>
                            </div>
                            <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm">
                                <BookOpen className="text-primary mb-2" size={20} />
                                <span className="text-xl font-bold text-text-main">{progress}%</span>
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Syllabus</span>
                            </div>
                            <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm">
                                <TrendingUp className="text-secondary mb-2" size={20} />
                                <span className="text-xl font-bold text-text-main">{stats.mockAvg}%</span>
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Accuracy</span>
                            </div>
                            <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm">
                                <Award className="text-emerald-400 mb-2" size={20} />
                                <span className="text-xl font-bold text-text-main">{stats.mockCount}</span>
                                <span className="text-[10px] uppercase tracking-wider text-text-muted">Tests</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-medium text-text-muted">Topic Mastery</label>
                                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{stats.completed}/{stats.total}</span>
                            </div>
                            <div className="w-full h-3 bg-surface rounded-full overflow-hidden border border-border/50">
                                <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        {/* Theme & Name Form */}
                        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-border">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-muted">Theme</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { id: 'glass', icon: '🎨' },
                                        { id: 'zen', icon: '🧘' },
                                        { id: 'gamified', icon: '🎮' },
                                        { id: 'glass-white', icon: '☁️' },
                                        { id: 'full-glass', icon: '🔮' }
                                    ].map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => {
                                                const root = document.documentElement;
                                                theme.id === 'glass' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', theme.id);
                                                localStorage.setItem('theme', theme.id);
                                            }}
                                            className="aspect-square rounded-xl border border-border bg-surface hover:bg-white/5 flex items-center justify-center text-lg transition-all focus:ring-2 focus:ring-primary"
                                        >
                                            {theme.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-muted">Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2.5 bg-surface border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text-main text-sm"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        label="Grade / Class"
                                        value={userClass}
                                        onChange={setUserClass}
                                        options={[
                                            { value: 'Class 6th', label: 'Class 6th' },
                                            { value: 'Class 7th', label: 'Class 7th' },
                                            { value: 'Class 8th', label: 'Class 8th' },
                                            { value: 'Class 9th', label: 'Class 9th' },
                                            { value: 'Class 10th', label: 'Class 10th' },
                                            { value: 'Class 11th', label: 'Class 11th' },
                                            { value: 'Class 12th', label: 'Class 12th' },
                                            { value: 'Dropper', label: 'Dropper' }
                                        ]}
                                        placeholder="Select Class"
                                    />

                                    {/* Conditional Exam Selection */}
                                    {!['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(userClass) && (
                                        <CustomSelect
                                            label="Target Exam"
                                            value={targetExam}
                                            onChange={setTargetExam}
                                            options={[
                                                { value: 'JEE Mains', label: 'JEE Mains' },
                                                { value: 'NEET UG', label: 'NEET UG' },
                                                { value: 'UPSC CSE', label: 'UPSC CSE' },
                                                { value: 'BITSAT', label: 'BITSAT' },
                                                { value: 'CLAT', label: 'CLAT' },
                                                { value: 'GATE', label: 'GATE' }
                                            ]}
                                            placeholder="Select Exam"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-transparent select-none">Account</label>
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to delete your account?")) {
                                            if (window.confirm("FINAL WARNING: This action cannot be undone. All your data will be permanently lost. Are you absolutely sure?")) {
                                                const { useUserStore } = await import('../../store/userStore');
                                                try {
                                                    await useUserStore.getState().deleteAccount();
                                                    // No onClose needed - user logged out
                                                } catch (e: any) {
                                                    alert("Delete failed: " + e.message);
                                                }
                                            }
                                        }
                                    }}
                                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                                >
                                    Delete Account
                                </button>

                                {(user?.xp || 0) > 10000000 && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("DEV TOOL: Are you sure you want to reset your XP to 0?")) {
                                                await updateProfile({ xp: 0, lifetimeXp: 0, totalPoints: 0 });
                                                alert("XP Reset Successful. Please refresh.");
                                            }
                                        }}
                                        className="w-full mt-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2"
                                    >
                                        ⚠️ Reset XP (Dev Fix)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to logout?")) {
                                        logout();
                                    }
                                }}
                                className="flex-1 py-3 px-4 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || saved}
                                className={`flex-[2] py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg ${saved
                                    ? 'bg-green-500 text-white shadow-green-500/20'
                                    : 'bg-primary text-[color:var(--btn-text)] hover:bg-primary/90 shadow-primary/20 disabled:opacity-50'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : saved ? (
                                    <Check size={16} />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saved ? 'Saved!' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <ReferralModal isOpen={referralOpen} onClose={() => setReferralOpen(false)} />
        </div>
    );
};
