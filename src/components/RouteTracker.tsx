
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../lib/analytics';

export const RouteTracker = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top on every route change
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Instant scroll for better UX during transition
        });
        
        logPageView();
    }, [pathname]);

    return null;
};
