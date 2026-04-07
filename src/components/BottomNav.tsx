import { NavLink } from 'react-router-dom';
import { Home, Brain, TrendingUp, Calendar, Bookmark } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: Brain, label: 'Test Center', path: '/dashboard/test-center' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: Calendar, label: 'Plan', path: '/dashboard/study-plan' },
        { icon: Bookmark, label: 'Saved', path: '/dashboard/saved-lectures' },
    ];

    return (
        <div className="fixed bottom-8 left-0 right-0 z-[60] lg:hidden pointer-events-none px-6">
            {/* Soft gradient shadow for contrast */}
            <div className="absolute bottom-[-2rem] left-0 right-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

            <div className="pointer-events-auto max-w-sm mx-auto">
                <nav className="glass-card flex items-center justify-between px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-surface/95 backdrop-blur-3xl border border-white/10 rounded-full">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                aria-label={item.label}
                                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 relative group flex-1 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
                                    }`}
                            >
                                <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary/10 translate-y-[-6px]' : 'group-active:scale-90'}`}>
                                    <item.icon size={24} className={`oxygen-icon ${isActive ? 'fill-primary/20 scale-110' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 absolute bottom-1.5 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                    }`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};
