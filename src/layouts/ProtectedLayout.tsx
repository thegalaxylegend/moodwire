import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { ExamReconfirmationModal } from '../components/dashboard/ExamReconfirmationModal';

export const ProtectedLayout = () => {
    const { user, isLoading, authResolved, checkAbandonment } = useUserStore();
    const location = useLocation();

    useEffect(() => {
        const handler = () => {
            if (document.visibilityState === 'visible') {
                console.log("📑 [Refocus] Tab visibility changed. Checking abandonment.");
                checkAbandonment();
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [checkAbandonment]);

    if (isLoading || !authResolved) {
        return <DashboardSkeleton />;
    }

    // Redirect unauthenticated users trying to access onboarding
    if (!user && location.pathname.includes('/onboarding')) {
        return <Navigate to="/login" replace />;
    }

    // Keep Onboarding check: If user IS logged in but hasn't finished onboarding, force them there.
    if (user && !user.onboardingCompleted && !location.pathname.includes('/onboarding')) {
        return <Navigate to="/onboarding" replace />;
    }

    return (
        <>
            <ExamReconfirmationModal />
            <Outlet />
        </>
    );
};
