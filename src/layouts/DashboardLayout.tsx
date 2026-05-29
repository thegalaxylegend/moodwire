import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
    Library,
    Download,
    ShieldCheck,
    Swords
} from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

import { BottomNav } from '../components/BottomNav';
import { useUserStore } from '../store/userStore';
import { useEffect } from 'react';
import { SEO } from '../components/SEO';
import { GuestBanner } from '../components/GuestBanner';

import { RankBadge } from '../components/gamification/RankBadge';
import { usePWAStore } from '../store/pwaStore';
import { ADMIN_EMAILS } from '../lib/securityConfig';
import { useChatStore } from '../store/chatStore';
import { useTestMode } from '../hooks/useTestMode';

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
                            <img
                                src={user.avatarUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
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
                relative flex items-center gap-3 px-4 py-3 rounded-xl group whitespace-nowrap overflow-hidden
                ${active
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-main border border-transparent hover:border-white/[0.05]'
                }
                ${!isSidebarOpen && 'lg:px-3 lg:justify-center'}
            `}
            style={{ transition: 'color 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
            {/* Animated active background pill — slides between nav items */}
            {active && (
                <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
            )}
            <div
                className={`relative shrink-0 ${!isSidebarOpen && 'lg:scale-110'}`}
                style={{ transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            >{icon}</div>
            <span
                className={`relative font-medium whitespace-nowrap ${!isSidebarOpen && 'lg:hidden opacity-0 w-0'}`}
                style={{ transition: 'opacity 280ms cubic-bezier(0.16, 1, 0.3, 1), width 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {label}
            </span>
        </NavLink>
    );
};

export const DashboardLayout = () => {
    const { user } = useUserStore();
    const pwa = usePWA();
    const { setShowInstallModal } = usePWAStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const location = useLocation();
    const navigate = useNavigate();
    const { isOpen: isChatOpen } = useChatStore();
    const isTestMode = useTestMode();

    const handleDownloadClick = async () => {
        if (pwa.isIOS && !pwa.isStandalone) {
            setShowInstallModal(true);
            return;
        }

        const outcome = await pwa.installApp();
        if (outcome === 'no-prompt') {
            setShowInstallModal(true);
        }
    };

    const isJunior = ['Class 8th', 'Class 9th', 'Class 10th'].includes(user?.userClass || '');

    const isAdmin = user?.role === 'admin' || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' }] : []),
        { icon: Swords, label: 'The Arena', path: '/dashboard/arena' },
        { icon: Brain, label: 'Test Center', path: '/dashboard/test-center' },
        { icon: Calendar, label: 'Study Plan', path: '/dashboard/study-plan' },
        { icon: BarChart3, label: 'Benchmarking', path: '/dashboard/peer-benchmarking' },
        { icon: Scale, label: 'Decision Simulator', path: '/dashboard/decision-simulator' },
        { icon: ListChecks, label: 'Syllabus', path: '/dashboard/syllabus' },
        { icon: Bookmark, label: 'Saved Lectures', path: '/dashboard/saved-lectures' },
        { icon: Library, label: 'Timeline', path: '/dashboard/timeline' },
        { icon: FileText, label: 'Notes', path: '/dashboard/notes' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
    ].filter(item => {
        if (isJunior && item.label === 'Timeline') return false;
        return true;
    });

    return (
        <div className="h-screen flex text-text-main overflow-hidden bg-background">
            <SEO
                title="Dashboard"
                description="Your personal exam preparation dashboard."
                noindex={true}
            />
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 h-screen bg-surface lg:bg-surface/95 backdrop-blur-md border-r border-border z-[120] 
                ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'} 
                ${(isChatOpen || isTestMode) ? 'lg:hidden' : 'flex'} flex-col overflow-hidden`}
                style={{ 
                    transition: 'width 380ms cubic-bezier(0.16, 1, 0.3, 1), transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                    paddingTop: 'env(safe-area-inset-top, 0px)'
                }}
            >
                <div className="p-6 flex items-center justify-between shrink-0">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tighter whitespace-nowrap transition-all duration-300">
                                Exam<span className="text-[#a855f7]">Compass</span>
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="w-9 h-9 mx-auto rounded-xl bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 shrink-0 flex items-center justify-center text-lg font-black text-white tracking-tighter"
                            aria-label="Open sidebar"
                        >
                            E<span className="text-[#a855f7]">C</span>
                        </button>
                    )}
                    {isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav
                    className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden no-scrollbar"
                    data-lenis-prevent
                >
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

                    {/* PWA Install Option */}
                    {!pwa.isStandalone && pwa.canInstall && (
                        <button
                            onClick={handleDownloadClick}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap overflow-hidden
                                text-primary/70 hover:text-primary hover:bg-primary/10 border border-primary/20 mt-4
                                ${!isSidebarOpen && 'lg:px-3 lg:justify-center'}
                            `}
                        >
                            <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                                <Download size={22} />
                            </div>
                            <span className={`font-bold transition-all duration-300 ${!isSidebarOpen && 'lg:hidden opacity-0 w-0'}`}>
                                Download App
                            </span>
                        </button>
                    )}
                </nav>



                <UserProfileWidget isSidebarOpen={isSidebarOpen} onClick={() => {
                    navigate('/dashboard/profile');
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                    onRankClick={() => navigate('/dashboard/ranks')}
                />
            </aside>

            {/* Mobile Header - Truly Fixed at Top */}
            <div 
                className="lg:hidden fixed left-0 right-0 flex items-center justify-between px-4 bg-background/90 backdrop-blur-xl border-b border-white/5 z-30"
                style={{ 
                    top: 0,
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0px)',
                    height: 'calc(env(safe-area-inset-top, 0px) + 56px)'
                }}
            >
                {/* Logo + Brand */}
                <div className="flex items-center gap-2.5">
                    <span className="text-lg sm:text-xl font-bold text-white tracking-tighter">Exam<span className="text-[#a855f7]">Compass</span></span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Streak Display (Mobile) */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-primary font-bold text-sm">
                        <Flame size={15} className="fill-primary" />
                        <span>{user?.streak || 0}</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="p-2 rounded-lg bg-surface border border-border touch-manipulation" 
                        aria-label="Open navigation menu"
                        style={{ minWidth: 44, minHeight: 44 }}
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </div>

            {/* Main Content — with page fade-slide transition */}
            <main
                data-lenis-prevent
                className="flex-1 overflow-x-hidden overflow-y-auto relative w-full flex flex-col scrollbar-thin min-h-screen"
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 flex flex-col p-4 lg:p-10 lg:pt-10 max-w-6xl mx-auto w-full"
                        style={{
                            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)',
                            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)'
                        }}
                    >
                        <GuestBanner />
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Navigation for Mobile */}
            <BottomNav />
        </div>
    );
};
