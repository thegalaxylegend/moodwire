import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { useUserStore } from '../../store/userStore';
import { SEO } from '../../components/SEO';
import { Capacitor } from '@capacitor/core';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if we are running inside the native Android/iOS Capacitor shell. */
const isNative = () => Capacitor.isNativePlatform();

/** Returns true if the web app is installed as a PWA (standalone mode). */
const isPwa = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true);

/**
 * Maps Firebase error codes to human-readable messages.
 * Add more codes here if you encounter them in the future.
 */
const friendlyError = (err: any): string => {
    const map: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'Invalid email or password.',
        'auth/wrong-password': 'Invalid email or password.',
        'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/popup-blocked': 'Popup was blocked by the browser. Please allow popups and try again.',
        'auth/network-request-failed': 'No internet connection. Please check your network.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
        'auth/cancelled-popup-request': '', // silently ignore
        'auth/operation-not-allowed': 'Google Sign-In is not enabled. Contact support.',
    };
    return map[err?.code] ?? err?.message ?? 'An unexpected error occurred. Please try again.';
};

/** Returns true if the error indicates the user simply dismissed the native picker. */
const isUserCancellation = (err: any): boolean => {
    const msg = (err?.message ?? '').toLowerCase();
    const code = (err?.code ?? '').toLowerCase();
    return (
        code === 'cancelled' ||
        code === 'sign_in_cancelled' ||
        msg.includes('cancel') ||
        msg.includes('12501') || // Google Play Services cancel code
        msg.includes('user cancelled') ||
        msg.includes('user denied')
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useUserStore();

    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // ── Handle OAuth redirect result (PWA / web redirect flow) ──────────────
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                // getRedirectResult() resolves immediately with null if no pending redirect.
                // If there was a redirect, it returns the credential and user.
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    // Auth state change fires → userStore picks it up → redirects via next effect
                    console.log('[Login] Redirect sign-in complete:', result.user.email);
                }
            } catch (err: any) {
                // Show error only if it's a real failure, not just "no redirect pending"
                const msg = friendlyError(err);
                if (msg) setError(msg);
                console.error('[Login] getRedirectResult error:', err);
            }
        };

        // Only run on web (not needed in native)
        if (!isNative()) {
            handleRedirectResult();
        }
    }, []);

    // ── Capture referral code from URL ───────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) sessionStorage.setItem('referral_code', refCode);
    }, []);

    // ── Redirect if already authenticated ────────────────────────────────────
    useEffect(() => {
        if (isAuthenticated && user?.email) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, user, location]);

    // ── Auth loading guard ────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // ── Google Sign-In ────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            await setPersistence(auth, browserLocalPersistence);

            if (isNative()) {
                /**
                 * NATIVE ANDROID/iOS PATH
                 * ─────────────────────────────────────────────────────────────
                 * Uses @capacitor-firebase/authentication which triggers the
                 * NATIVE Google account picker — NOT Chrome, NOT a WebView popup.
                 * This is the correct approach for Capacitor apps.
                 *
                 * The idToken from the native result is exchanged for a Firebase
                 * Web SDK credential so that the existing onAuthStateChanged
                 * listener in userStore.initialize() can pick it up normally.
                 */
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                const result = await FirebaseAuthentication.signInWithGoogle({
                    useCredentialManager: false,
                });

                if (!result.credential?.idToken) {
                    throw new Error('Google Sign-In did not return a valid credential. Please try again.');
                }

                const credential = GoogleAuthProvider.credential(result.credential.idToken);
                await signInWithCredential(auth, credential);

                // ✅ SUCCESS: onAuthStateChanged fires → userStore updates → redirect useEffect runs
                // Loading stays true until we redirect, preventing UI flash.
                return;
            }

            /**
             * WEB PATH
             * ─────────────────────────────────────────────────────────────────
             * - PWA mode: use redirect (popup often blocked in standalone PWA)
             * - Desktop browser: use popup (best UX, no page reload)
             * - Mobile browser: use redirect (popup UX is poor on mobile browsers)
             */
            const isMobileBrowser =
                /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !isPwa();

            if (isPwa() || isMobileBrowser) {
                // Redirect flow: page will reload after auth, getRedirectResult() handles it
                await signInWithRedirect(auth, googleProvider);
                // Note: execution doesn't continue here — the page navigates away
            } else {
                // Popup flow for desktop browsers
                await signInWithPopup(auth, googleProvider);
                // onAuthStateChanged → userStore → redirect
            }
        } catch (err: any) {
            if (isUserCancellation(err)) {
                // User dismissed the picker — not an error, just reset loading
                setLoading(false);
                return;
            }
            console.error('[Login] Google sign-in error:', err);
            const msg = friendlyError(err);
            if (msg) setError(msg);
            setLoading(false);
        }
    };

    // ── Email / Password Sign-In or Sign-Up ───────────────────────────────────
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await setPersistence(auth, browserLocalPersistence);

            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                // Profile created by userStore.initialize() via onAuthStateChanged
            } else {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            console.error('[Login] Email auth error:', err);
            setError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Guest Sign-In ─────────────────────────────────────────────────────────
    const handleGuestLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            // If already a guest, just navigate
            if (isAuthenticated && user?.email?.startsWith('guest_')) {
                navigate('/dashboard');
                return;
            }
            await useUserStore.getState().loginAsGuest();
            // Redirect handled by the isAuthenticated useEffect above
        } catch (err: any) {
            console.error('[Login] Guest login error:', err);
            setError('Guest login failed. Please try again.');
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <SEO
                title="Login"
                description="Login to Exam Compass to access AI-powered mock tests and analytics."
                canonical="https://examcompass.pages.dev/login"
                noindex={true}
            />

            {/* Background */}
            <div className="absolute inset-0 -z-10 bg-background" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="glass-card relative z-10 w-full max-w-md p-8 animate-fade-in-up">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                        {isSignUp ? 'Join the Revolution' : 'Welcome Back'}
                    </h1>
                    <p className="text-text-muted mt-2 text-sm font-bold uppercase tracking-widest opacity-60">
                        {isSignUp ? 'Choose your entrance' : 'Enter the portal'}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-start gap-2 text-sm">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Primary Actions */}
                <div className="space-y-3 mb-8">
                    {/* Google Sign-In */}
                    <button
                        id="btn-google-signin"
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="size-5"
                            />
                        )}
                        {loading ? 'Signing in…' : 'Continue with Google'}
                    </button>

                    {/* Guest */}
                    <button
                        id="btn-guest-signin"
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="w-full bg-transparent border border-white/10 text-text-muted hover:text-white hover:border-white/30 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    >
                        Continue as Guest
                    </button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="bg-[#0a0a0f] px-4 text-text-muted">Or use email</span>
                    </div>
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleAuth} className="space-y-3">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" size={16} />
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="email"
                            placeholder="Email Address"
                            className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary transition-colors text-sm"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none" size={16} />
                        <input
                            type="password"
                            id="password"
                            name="password"
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            placeholder="Password"
                            className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary transition-colors text-sm"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        id="btn-email-signin"
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 text-sm"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                {isSignUp ? 'Create Account' : 'Sign In'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Sign-Up / Sign-In */}
                <p className="text-center text-sm text-text-muted mt-4">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button type="button"
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="text-primary hover:underline font-semibold"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};
