import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

import {
    LayoutDashboard,
    Calendar,
    FileText,
    Menu,
    X,
    Brain,
    Scale,
    Bookmark,
    Flame,
    BarChart3,
    ListChecks,
    TrendingUp,
    Library
} from 'lucide-react';
import { useState } from 'react';

import { BottomNav } from '../components/BottomNav';
// import { supabase } from '../lib/supabase'; // REMOVED
// import { supabase } from '../lib/supabase'; // REMOVED
import { useUserStore } from '../store/userStore';
import { useEffect } from 'react';
import { SEO } from '../components/SEO';
import { GuestBanner } from '../components/GuestBanner';

import { RankBadge } from '../components/gamification/RankBadge';


// ... imports ...

const UserProfileWidget = ({ isSidebarOpen, onClick, onRankClick }: { isSidebarOpen: boolean; onClick: () => void; onRankClick: () => void }) => {
    const { user, fetchSyllabusProgress } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchSyllabusProgress();
        }
    }, [fetchSyllabusProgress, user]);

    // Guest / Preview Mode
    if (!user) {
        return (
            <div className={`p-4 border-t border-border space-y-3 ${!isSidebarOpen && 'lg:p-2'}`}>
                <button
                    onClick={() => navigate('/login')}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left group ${!isSidebarOpen && 'lg:justify-center lg:p-0 lg:border-0 lg:bg-transparent'}`}
                >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                        G
                    </div>

                    <div className={`flex-1 overflow-hidden transition-all duration-300 ${!isSidebarOpen && 'lg:hidden'}`}>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-text-main truncate group-hover:text-primary transition-colors">Guest User</p>
                        </div>
                        <p className="text-xs text-text-muted truncate">Sign In to Save</p>
                    </div>
                </button>
            </div>
        );
    }

    // Use stored progress or default to 0
    const progress = user?.syllabusProgress || 0;

    return (
        <div className={`p-4 border-t border-border space-y-3 ${!isSidebarOpen && 'lg:p-2'}`}>
            <button
                onClick={onClick}
                className={`w-full flex items-center gap-3 p-2 rounded-xl bg-surface/50 border border-white/5 hover:bg-white/10 transition-all text-left group ${!isSidebarOpen && 'lg:justify-center lg:p-0 lg:border-0 lg:bg-transparent'}`}
            >
                {/* Profile Pic Placeholder */}
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 overflow-hidden relative">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user?.name?.[0] || 'U'}</span>
                        )}
                    </div>
                    {/* Mini Rank Badge - Absolute */}
                    <div className="absolute -bottom-1 -right-1 scale-75">
                        <RankBadge
                            xp={user?.xp || 0}
                            size="sm"
                            showLabel={false}
                            onClick={(e) => {
                                e?.stopPropagation(); // Prevent navigation to profile
                                onRankClick();
                            }}
                        />
                    </div>
                </div>

                <div className={`flex-1 overflow-hidden transition-all duration-300 ${!isSidebarOpen && 'lg:hidden'}`}>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-text-main truncate group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                    </div>
                    <p className="text-xs text-text-muted truncate">{user?.targetExam}</p>
                </div>
            </button>

            <div className={`space-y-1 transition-all duration-300 ${!isSidebarOpen && 'lg:hidden'}`}>
                <div className="flex justify-between text-xs text-text-muted">
                    <span>Syllabus</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>


        </div>
    );
};

// Reusable Sidebar Item Component
export const SidebarItem = ({ to, icon, label, active, isSidebarOpen, onClick }: { to: string; icon: React.ReactNode; label: string; active: boolean; isSidebarOpen: boolean; onClick?: () => void }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap overflow-hidden
                ${active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-muted hover:text-text-main hover:bg-white/5 border border-transparent'
                }
                ${!isSidebarOpen && 'lg:px-3 lg:justify-center'}
            `}
        >
            <div className={`shrink-0 transition-transform duration-300 ${!isSidebarOpen && 'lg:scale-110'}`}>{icon}</div>
            <span className={`font-medium whitespace-nowrap transition-all duration-300 ${!isSidebarOpen && 'lg:hidden opacity-0 w-0'}`}>
                {label}
            </span>
        </NavLink>
    );
};

export const DashboardLayout = () => {
    const { user } = useUserStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    const navigate = useNavigate();
    const location = useLocation();

    const isJunior = ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { icon: Brain, label: 'Test Center', path: '/dashboard/test-center' },
        { icon: Calendar, label: 'Study Plan', path: '/dashboard/study-plan' },
        { icon: BarChart3, label: 'Benchmarking', path: '/dashboard/peer-benchmarking' },
        { icon: Scale, label: 'Decision Simulator', path: '/dashboard/decision-simulator' },
        { icon: ListChecks, label: 'Syllabus', path: '/dashboard/syllabus' },
        { icon: Bookmark, label: 'Saved Lectures', path: '/dashboard/saved-lectures' },
        { icon: Library, label: 'Timeline', path: '/dashboard/timeline' },
        { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
    ].filter(item => {
        if (isJunior && item.label === 'Timeline') return false;
        return true;
    });

    return (
        <div className="min-h-screen flex text-text-main">
            <SEO
                title="Dashboard"
                description="Your personal exam preparation dashboard."
                type="noindex"
            />
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 h-screen bg-surface/95 backdrop-blur-md border-r border-border transition-all duration-300 z-[70] 
                ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} 
                flex flex-col overflow-hidden`}
            >
                <div className="p-6 flex items-center justify-between shrink-0">
                    {(isSidebarOpen || window.innerWidth < 1024) && (
                        <span className={`text-xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary whitespace-nowrap ${!isSidebarOpen && 'lg:hidden'}`}>
                            Exam-Compass
                        </span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            to={item.path}
                            icon={<item.icon size={22} />}
                            label={item.label}
                            active={location.pathname === item.path}
                            isSidebarOpen={isSidebarOpen}
                            onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                        />
                    ))}
                </nav>



                <UserProfileWidget isSidebarOpen={isSidebarOpen} onClick={() => {
                    navigate('/dashboard/profile');
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                    onRankClick={() => navigate('/dashboard/ranks')}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-10 overflow-x-hidden relative w-full pb-24 lg:pb-10 flex flex-col">
                <div className="lg:hidden mb-6 flex items-center justify-between shrink-0">
                    <span className="text-xl font-heading font-bold text-text-main">Exam-Compass</span>
                    <div className="flex items-center gap-3">
                        {/* Streak Display (Mobile) */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-primary font-bold text-sm">
                            <Flame size={16} className="fill-primary" />
                            <span>{user?.streak || 0}</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-surface border border-border">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full">
                    <GuestBanner />
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation for Mobile */}
            <BottomNav />
        </div>
    );
};
