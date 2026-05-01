import { useLocation } from 'react-router-dom';

/**
 * Detects whether the user is in an active test/exam mode.
 * Used to suppress distracting UI elements (Chatbot, BottomNav, CookieConsent, etc.)
 * during exam sessions to prevent cheating and minimize distraction.
 *
 * Test mode routes:
 * - /dashboard/mock?mode=* (when step=exam/preview/loading — handled by the mock param presence)
 * - /dashboard/test-active (legacy, redirects but still checked)
 * - /dashboard/arena/group/:sessionId (active group battle)
 * - /dashboard/diagnostic (diagnostic test)
 */
export const useTestMode = (): boolean => {
    const location = useLocation();
    const path = location.pathname;

    // Active mock exam (has a mode query param = test is initiated)
    if (path === '/dashboard/mock' || path === '/dashboard/mock/') {
        const params = new URLSearchParams(location.search);
        if (params.has('mode') || params.has('topic')) {
            return true;
        }
    }

    // Legacy active test route
    if (path === '/dashboard/test-active') {
        return true;
    }

    // Group battle with active session
    if (path.startsWith('/dashboard/arena/group/')) {
        return true;
    }

    // Diagnostic test
    if (path === '/dashboard/diagnostic') {
        return true;
    }

    return false;
};
