import { NavLink } from 'react-router-dom';
import { Home, Brain, CheckCircle, Users, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const AdminBottomNav = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Overview', path: '/admin/overview' },
        { icon: Brain, label: 'Jules AI', path: '/admin/jules' },
        { icon: CheckCircle, label: 'Questions', path: '/admin/question-review' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Settings, label: 'System', path: '/admin/system' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
            {/* Gradient fade to prevent content cutoff looking abrupt */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

            <div className="pointer-events-auto px-4 pb-4 pt-2">
                <nav className="glass-card flex items-center justify-between px-2 py-2 shadow-2xl bg-surface/90 backdrop-blur-xl border-t border-white/5 rounded-2xl">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                aria-label={item.label}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative group flex-1 ${isActive ? 'text-red-500' : 'text-text-muted hover:text-text-main'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-red-500/10 translate-y-[-4px]' : 'group-active:scale-90'}`}>
                                    <item.icon size={22} className={`${isActive ? 'text-red-500' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-medium transition-all duration-300 absolute -bottom-1 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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
