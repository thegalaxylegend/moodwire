import { NavLink } from 'react-router-dom';
import { Home, Brain, TrendingUp, Calendar, Bookmark } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTestMode } from '../hooks/useTestMode';

export const BottomNav = () => {
    const location = useLocation();
    const isTestMode = useTestMode();

    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: Brain, label: 'Test', path: '/dashboard/test-center' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: Calendar, label: 'Plan', path: '/dashboard/study-plan' },
        { icon: Bookmark, label: 'Saved', path: '/dashboard/saved-lectures' },
    ];

    // Hide bottom nav during active exams to prevent distraction & navigation away
    if (isTestMode) return null;

    return (
        <div
            className="fixed left-0 right-0 z-30 lg:hidden pointer-events-none px-4"
            style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        >
            <div className="pointer-events-auto max-w-md mx-auto">
                <nav className="liquid-glass flex items-center justify-between px-2 py-2 rounded-full shadow-[0_45px_100px_-20px_rgba(0,0,0,0.7)]">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                aria-label={item.label}
                                className={`flex flex-col items-center justify-center rounded-2xl transition-all duration-300 relative group flex-1 min-h-[48px] min-w-[48px] ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
                                    }`}
                            >
                                <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/5 translate-y-[-4px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'group-active:scale-90'}`}>
                                    <item.icon size={22} strokeWidth={1.5} className={`${isActive ? 'text-primary' : ''}`} />
                                </div>
                                <span className={`text-[9px] font-semibold tracking-tight transition-all duration-300 absolute bottom-1 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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

