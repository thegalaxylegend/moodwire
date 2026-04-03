import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { ShieldCheck, Database, CheckCircle, Home, Brain, Users, Search, Activity } from 'lucide-react';
import { SidebarItem } from './DashboardLayout'; // Reusing for consistency
import { Suspense } from 'react';
import { AppShellSkeleton } from '../components/skeletons/AppShellSkeleton';

export const AdminLayout = () => {
    const { user, isLoading } = useUserStore();
    const location = useLocation();

    if (isLoading) return <AppShellSkeleton />;

    // Global Admin Access Control
    const isAdmin = user?.role === 'admin' || user?.email === 'thegalaxylegend2007@gmail.com';

    if (!user || !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex h-screen bg-background text-text-main overflow-hidden font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-surface/50 border-r border-white/5 flex-col hidden md:flex backdrop-blur-xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Admin <span className="text-red-500">Panel</span>
                        </h1>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">System Control</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Command Center</div>
                    <SidebarItem to="/admin/overview" icon={<Home size={20} />} label="Overview" active={location.pathname === '/admin/overview'} isSidebarOpen={true} />
                    <SidebarItem to="/admin/traffic" icon={<Activity size={20} />} label="Traffic" active={location.pathname === '/admin/traffic'} isSidebarOpen={true} />
                    <SidebarItem to="/admin/search" icon={<Search size={20} />} label="Search Intelligence" active={location.pathname === '/admin/search'} isSidebarOpen={true} />
                    <SidebarItem to="/admin/jules" icon={<Brain size={20} />} label="Jules AI" active={location.pathname === '/admin/jules'} isSidebarOpen={true} />

                    <div className="my-4 border-t border-white/5"></div>
                    <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Data & Quality</div>
                    <SidebarItem to="/admin/question-review" icon={<CheckCircle size={20} />} label="Question Review" active={location.pathname === '/admin/question-review'} isSidebarOpen={true} />
                    <SidebarItem to="/admin/upload-syllabus" icon={<Database size={20} />} label="Syllabus DB" active={location.pathname === '/admin/upload-syllabus'} isSidebarOpen={true} />
                    <SidebarItem to="/admin/users" icon={<Users size={20} />} label="User Management" active={location.pathname === '/admin/users'} isSidebarOpen={true} />

                    <div className="my-4 border-t border-white/5"></div>

                    <SidebarItem to="/dashboard" icon={<Home size={20} />} label="Student View" active={false} isSidebarOpen={true} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative p-4 md:p-8 scroll-smooth custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
                    <Suspense fallback={<div className="h-96 flex items-center justify-center text-text-muted">Loading Admin Tool...</div>}>
                        <Outlet />
                    </Suspense>
                </div>
            </main>
        </div>
    );
};
