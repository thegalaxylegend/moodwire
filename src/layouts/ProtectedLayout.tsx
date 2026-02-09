import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { AppShellSkeleton } from '../components/skeletons/AppShellSkeleton';

export const ProtectedLayout = () => {
    const { user, isLoading } = useUserStore();
    const location = useLocation();

    if (isLoading) {
        return <AppShellSkeleton />;
    }

    // ALLOW GUEST ACCESS:
    // We no longer redirect to /login immediately.
    // The DashboardLayout and its children will handle the "Guest View" vs "User View".

    // However, if we are on a truly protected route (like /onboarding), we might still want to check.
    // For now, we assume this layout wraps /dashboard/* which should be open.

    // Keep Onboarding check: If user IS logged in but hasn't finished onboarding, force them there.
    // But if (user) check first ensures we don't send guests to onboarding.
    if (user && !user.onboardingCompleted && !location.pathname.includes('/onboarding')) {
        return <Navigate to="/onboarding" replace />;
    }

    return <Outlet />;
};
