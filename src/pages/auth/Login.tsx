import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, GraduationCap, Target, Calendar } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { CustomSelect } from '../../components/CustomSelect';
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
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [targetExam, setTargetExam] = useState<string>('');
    const [targetYear, setTargetYear] = useState<string>('');

    const handleClassChange = (val: string) => {
        setSelectedClass(val);
        const currentYear = new Date().getFullYear();
        let detectedYear = currentYear;
        
        // Auto-detect target year based on class
        if (val === 'Class 8th') detectedYear = currentYear + 4;
        else if (val === 'Class 9th') detectedYear = currentYear + 3;
        else if (val === 'Class 10th') detectedYear = currentYear + 2;
        else if (val === 'Class 11th') detectedYear = currentYear + 1;
        else if (val === 'Class 12th') detectedYear = currentYear;
        else if (val === 'Dropper') detectedYear = currentYear;
        
        setTargetYear(detectedYear.toString());
        
        // Auto-select exam if empty (optional, but good UX)
        if (!targetExam) {
            setTargetExam('JEE');
        }
    };

    const currentYearNum = new Date().getFullYear();
    const yearOptions = [0, 1, 2, 3, 4, 5].map(offset => ({
        value: (currentYearNum + offset).toString(),
        label: (currentYearNum + offset).toString()
    }));

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
        if (isSignUp && selectedClass) {
            try {
                const existing = localStorage.getItem('exam_compass_intent');
                const intent = existing ? JSON.parse(existing) : { savedAt: Date.now() };
                
                // Only overwrite if it matches reality
                intent.class = selectedClass;
                intent.exam = targetExam;
                intent.year = parseInt(targetYear);
                intent.savedAt = Date.now();
                
                localStorage.setItem('exam_compass_intent', JSON.stringify(intent));
                console.log("📝 [Auth] Persisted signup intent:", intent);
            } catch (e) {
                console.error("Failed to persist intent:", e);
            }
        }
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
            await signInWithPopup(auth, googleProvider);
            // DO NOT navigate here. The useUserStore initialize() 
            // will pick up the new auth state and handle the profile.
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError("Failed to sign in with Google.");
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
            console.error("Auth Error:", err);
            // Map Firebase error codes to user-friendly messages
            let message = "Authentication failed";
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                message = "Invalid email or password.";
            } else if (err.code === 'auth/email-already-in-use') {
                message = "Email is already in use.";
            } else if (err.code === 'auth/weak-password') {
                message = "Password should be at least 6 characters.";
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
                canonical="https://examcompass.pages.dev/login"
                noindex={true}
            />
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-background" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="glass-card relative z-10 w-full max-w-md p-8 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        {isSignUp ? 'Join the Revolution' : 'Welcome Back'}
                    </h1>
                    <p className="text-text-muted mt-2">
                        {isSignUp ? 'Start your data-driven preparation.' : 'Enter the portal to your dream college.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                            <input
                                type="email"
                                placeholder="aspirant@example.com"
                                className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary transition-colors"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {isSignUp && (
                        <div className="space-y-4">
                            <CustomSelect
                                label="Grade / Class"
                                value={selectedClass}
                                onChange={handleClassChange}
                                options={[
                                    { value: 'Class 8th', label: 'Class 8th' },
                                    { value: 'Class 9th', label: 'Class 9th' },
                                    { value: 'Class 10th', label: 'Class 10th' },
                                    { value: 'Class 11th', label: 'Class 11th' },
                                    { value: 'Class 12th', label: 'Class 12th' },
                                    { value: 'Dropper', label: 'Dropper' }
                                ]}
                                placeholder="Select your class"
                                icon={<GraduationCap size={18} />}
                                required={isSignUp}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <CustomSelect
                                    label="Target Exam"
                                    value={targetExam}
                                    onChange={setTargetExam}
                                    options={[
                                        { value: 'JEE', label: 'JEE' },
                                        { value: 'NEET', label: 'NEET' }
                                    ]}
                                    placeholder="Exam"
                                    icon={<Target size={18} />}
                                    required={isSignUp}
                                />
                                <CustomSelect
                                    label="Target Year"
                                    value={targetYear}
                                    onChange={setTargetYear}
                                    options={yearOptions}
                                    placeholder="Year"
                                    icon={<Calendar size={18} />}
                                    required={isSignUp}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative z-50 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                {isSignUp ? 'Create Account' : 'Enter Dashboard'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-surface px-2 text-text-muted">Or continue with</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="relative z-50 w-full bg-white text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-all disabled:opacity-70"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    // Resume if already guest
                                    if (isAuthenticated && user?.email?.startsWith('guest_')) {
                                        navigate('/dashboard');
                                        return;
                                    }

                                    const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
                                    await setPersistence(auth, browserLocalPersistence);
                                    const { useUserStore } = await import('../../store/userStore');
                                    setGuestLoginAttempt(true);
                                    await useUserStore.getState().loginAsGuest();
                                    // Navigation handled by useEffect when auth state updates
                                } catch (e: any) {
                                    console.error(e);
                                    setError("Guest login failed.");
                                    setGuestLoginAttempt(false);
                                    setLoading(false);
                                }
                            }}
                            className="relative z-50 w-full bg-transparent border border-white/20 text-text-muted hover:text-white hover:border-white/40 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Continue as Guest
                        </button>
                        <p className="text-[10px] text-center text-text-muted/60 mt-2">
                            Login only to save progress & rank
                        </p>
                    </div>
                </div>

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
