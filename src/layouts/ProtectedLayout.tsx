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

    // Redirect unauthenticated users to login
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Guest users must complete onboarding before entering the dashboard.
    // Note: guests are anonymous Firebase users with isGuest=true.
    // We allow the /onboarding path itself so the page can render.
    const needsOnboarding = !user.onboardingCompleted && !location.pathname.includes('/onboarding');
    if (needsOnboarding) {
        return <Navigate to="/onboarding" replace />;
    }

    return (
        <>
            <ExamReconfirmationModal />
            <Outlet />
        </>
    );
};
