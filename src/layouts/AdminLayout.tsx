import { Suspense, useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { 
  ShieldCheck, Database, CheckCircle, Home, Brain, 
  Users, Search, Activity, Menu, X, Settings
} from 'lucide-react';
import { SidebarItem } from './DashboardLayout'; // Reusing for consistency
import { AppShellSkeleton } from '../components/skeletons/AppShellSkeleton';
import { ADMIN_EMAILS } from '../lib/securityConfig';
import { AdminBottomNav } from '../components/AdminBottomNav';
import { auth } from '../lib/firebase';

export const AdminLayout = () => {
    const { user, isLoading } = useUserStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Verify admin status against the live Firebase Auth token — not the localStorage cache.
    // auth.currentUser?.email is sourced from the signed JWT, not from localStorage,
    // so it cannot be spoofed by editing DevTools.
    const [verifiedAdmin, setVerifiedAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const liveEmail = auth.currentUser?.email?.toLowerCase() ?? null;
        if (liveEmail && ADMIN_EMAILS.includes(liveEmail)) {
            setVerifiedAdmin(true);
        } else {
            // Force-reload the token from Firebase to ensure it's fresh
            auth.currentUser?.getIdToken(true).then(() => {
                const email = auth.currentUser?.email?.toLowerCase() ?? null;
                setVerifiedAdmin(email ? ADMIN_EMAILS.includes(email) : false);
            }).catch(() => setVerifiedAdmin(false));
        }
    }, [user]);

    if (isLoading || verifiedAdmin === null) return <AppShellSkeleton />;

    // Block access if not a verified admin via live Firebase token
    if (!user || !verifiedAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex h-screen bg-background text-text-main overflow-hidden font-sans relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside 
                className={`
                    fixed md:sticky top-0 h-screen bg-surface/90 border-r border-white/5 flex flex-col backdrop-blur-2xl z-[70] transition-all duration-300
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                Admin <span className="text-red-500">Panel</span>
                            </h1>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">System Control</p>
                        </div>
                    </div>
                    <button type="button" 
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors text-text-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div 
                    className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar"
                    data-lenis-prevent
                >
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Command Center</div>
                    <SidebarItem to="/admin/overview" icon={<Home size={20} />} label="Overview" active={location.pathname === '/admin/overview'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem to="/admin/traffic" icon={<Activity size={20} />} label="Traffic" active={location.pathname === '/admin/traffic'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem to="/admin/search" icon={<Search size={20} />} label="Search Intelligence" active={location.pathname === '/admin/search'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem to="/admin/jules" icon={<Brain size={20} />} label="Jules AI" active={location.pathname === '/admin/jules'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />

                    <div className="my-4 border-t border-white/5"></div>
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Data & Quality</div>
                    <SidebarItem to="/admin/question-review" icon={<CheckCircle size={20} />} label="Question Review" active={location.pathname === '/admin/question-review'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem to="/admin/upload-syllabus" icon={<Database size={20} />} label="Syllabus DB" active={location.pathname === '/admin/upload-syllabus'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    <SidebarItem to="/admin/users" icon={<Users size={20} />} label="User Management" active={location.pathname === '/admin/users'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />
                    
                    <div className="my-4 border-t border-white/5"></div>
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50">System & Config</div>
                    <SidebarItem to="/admin/system" icon={<Settings size={20} />} label="System Control" active={location.pathname === '/admin/system'} isSidebarOpen={true} onClick={() => setIsSidebarOpen(false)} />

                    <div className="my-4 border-t border-white/5"></div>

                    <SidebarItem to="/dashboard" icon={<Home size={20} />} label="Student View" active={false} isSidebarOpen={true} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative flex flex-col scroll-smooth custom-scrollbar">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                            <ShieldCheck className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Admin <span className="text-red-500">Panel</span></span>
                    </div>
                    <button type="button" 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-lg bg-surface border border-white/5 text-text-muted hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-4 md:p-8 pb-32 md:pb-20 w-full">
                    <Suspense fallback={<div className="h-96 flex items-center justify-center text-text-muted">Loading Admin Tool…</div>}>
                        <Outlet />
                    </Suspense>
                </div>
            </main>

            {/* Admin Bottom Navigation (Mobile Only) */}
            <AdminBottomNav />
        </div>
    );
};
