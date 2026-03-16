import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = () => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    if (segments.length === 0 || ['login', 'dashboard', 'admin', 'onboarding'].includes(segments[0])) {
        return null;
    }

    const crumbs = segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = seg
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        return { label, path };
    });

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1" aria-label="Home">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                    {i === crumbs.length - 1 ? (
                        <span className="text-gray-200 font-medium" aria-current="page">{crumb.label}</span>
                    ) : (
                        <Link to={crumb.path} className="hover:text-white transition-colors">{crumb.label}</Link>
                    )}
                </span>
            ))}
        </nav>
    );
};
