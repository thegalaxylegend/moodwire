import { NavLink } from 'react-router-dom';
import { Home, Brain, TrendingUp, Calendar, Bookmark } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTestMode } from '../hooks/useTestMode';

export const BottomNav = () => {
    const location = useLocation();
    const isTestMode = useTestMode();

    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: Brain, label: 'Test Center', path: '/dashboard/test-center' },
        { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
        { icon: Calendar, label: 'Plan', path: '/dashboard/study-plan' },
        { icon: Bookmark, label: 'Saved', path: '/dashboard/saved-lectures' },
    ];

    // Hide bottom nav during active exams to prevent distraction & navigation away
    if (isTestMode) return null;

    return (
        <div className="fixed bottom-8 left-0 right-0 z-[60] lg:hidden pointer-events-none px-6">
            {/* Soft gradient shadow for contrast */}
            <div className="pointer-events-auto max-w-sm mx-auto">
                <nav className="liquid-glass flex items-center justify-between px-4 py-3 rounded-full shadow-[0_45px_100px_-20px_rgba(0,0,0,0.7)]">
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
                                <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/5 translate-y-[-6px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'group-active:scale-90'}`}>
                                    <item.icon size={24} strokeWidth={1.5} className={`${isActive ? 'text-primary' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-semibold tracking-tight transition-all duration-300 absolute bottom-1.5 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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

