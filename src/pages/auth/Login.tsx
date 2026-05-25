import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useUserStore } from '../../store/userStore';
import { SEO } from '../../components/SEO';

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [guestLoginAttempt, setGuestLoginAttempt] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ email: '', password: '' });

    // Redirect if already authenticated
    useEffect(() => {
        // Capture Referral Code
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            sessionStorage.setItem('referral_code', refCode);
        }

        const isGuest = user?.email?.startsWith('guest_');
        // Normal user redirect OR Guest attempting login redirect
        if (isAuthenticated && user?.email && (!isGuest || (isGuest && guestLoginAttempt))) {
            const from = (location.state as any)?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, user, guestLoginAttempt, location]);

    const persistIntentBeforeAuth = () => {
        // No longer capturing intent here as it's handled in onboarding
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            persistIntentBeforeAuth();
            await setPersistence(auth, browserLocalPersistence);

            // Detect if running inside native Capacitor wrapper (Android/iOS app)
            const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

            if (isCapacitor) {
                // Use the native Google Sign-in flow — stays inside the app, no Chrome redirect!
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                const result = await FirebaseAuthentication.signInWithGoogle();
                // Sync the native auth result with the web Firebase SDK
                if (result.credential?.idToken) {
                    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                    const credential = GoogleAuthProvider.credential(result.credential.idToken);
                    await signInWithCredential(auth, credential);
                }
            } else if (
                window.matchMedia('(display-mode: standalone)').matches || 
                (navigator as any).standalone ||
                (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) ||
                window.innerWidth < 768
            ) {
                // PWA mode, mobile browser, or small screen emulation
                const { signInWithRedirect } = await import('firebase/auth');
                await signInWithRedirect(auth, googleProvider);
            } else {
                // Standard desktop web browser popup
                await signInWithPopup(auth, googleProvider);
            }
            // DO NOT navigate here. The useUserStore initialize()
            // will pick up the new auth state and handle the profile.
        } catch (err: any) {
            console.error('Google Auth Error:', err);
            setError(err.message || 'Failed to sign in with Google.');
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Force local persistence before sign in
            await setPersistence(auth, browserLocalPersistence);

            if (isSignUp) {
                persistIntentBeforeAuth();
                await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                // Profile will be created by userStore.initialize()
                setIsSignUp(false);
                navigate('/dashboard');
            } else {
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('Auth Error:', err);
            let message = 'Authentication failed';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = 'Invalid email or password.';
            } else if (err.code === 'auth/email-already-in-use') {
                message = 'Email is already in use.';
            } else if (err.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else {
                message = err.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <SEO
                title="Login"
                description="Login to Exam Compass to access AI-powered mock tests and analytics."
                canonical="https://examcompass.pages.dev/login/"
                noindex={true}
            />
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-background" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="glass-card relative z-10 w-full max-w-md p-8 animate-fade-in-up">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                        {isSignUp ? 'Join the Revolution' : 'Welcome Back'}
                    </h1>
                    <p className="text-text-muted mt-2 text-sm font-bold uppercase tracking-widest opacity-60">
                        {isSignUp ? 'Choose your entrance' : 'Enter the portal'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Primary Action: Google */}
                <div className="space-y-4 mb-8">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="relative z-50 w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-70 shadow-lg"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                if (isAuthenticated && user?.email?.startsWith('guest_')) {
                                    navigate('/dashboard');
                                    return;
                                }
                                const { setPersistence: setP, browserLocalPersistence: blp } = await import('firebase/auth');
                                await setP(auth, blp);
                                setGuestLoginAttempt(true);
                                await useUserStore.getState().loginAsGuest();
                            } catch (e: any) {
                                console.error(e);
                                setError('Guest login failed.');
                                setGuestLoginAttempt(false);
                                setLoading(false);
                            }
                        }}
                        className="relative z-50 w-full bg-transparent border border-white/10 text-text-muted hover:text-white hover:border-white/30 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                        Continue as Guest
                    </button>
                </div>

                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                        <span className="bg-[#0a0a0f] px-4 text-text-muted">Or use email</span>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1.5">
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
                    </div>

                    <div className="space-y-1.5">
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
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative z-50 w-full bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 text-sm mt-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-text-muted mt-4 relative z-50">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary hover:underline font-semibold"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};
