import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User as UserIcon, LogIn, Sparkles, Chrome } from 'lucide-react';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsGuest } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google sign-in failed');
            }
        }
    };

    const handleGuestSignIn = async () => {
        setError('');
        try {
            await signInAsGuest();
        } catch (err: any) {
            setError(err.message || 'Guest sign-in failed');
        }
    };

    return (
        <div className="auth-container" style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1a0505 0%, #000000 100%)',
            padding: '1.5rem',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000
        }}>
            {/* Animated Background Elements */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'var(--accent-primary)', filter: 'blur(150px)' }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.1, 0.15, 0.1],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: '#3a0000', filter: 'blur(120px)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '3rem',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'var(--accent-primary)',
                        borderRadius: '20px',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 30px rgba(255, 0, 0, 0.4)'
                    }}>
                        <Sparkles size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                        {isLogin ? 'Welcome Back' : 'Join MoodWire'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {isLogin ? 'Your synchronized vibe awaits you.' : 'Start your journey into high-res audio.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <AnimatePresence mode="popLayout">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="search-input-container"
                                style={{ margin: 0 }}
                            >
                                <UserIcon size={18} className="search-icon" style={{ opacity: 0.5 }} />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="search-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="search-input-container" style={{ margin: 0 }}>
                        <Mail size={18} className="search-icon" style={{ opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Username or Email"
                            className="search-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="search-input-container" style={{ margin: 0 }}>
                        <Lock size={18} className="search-icon" style={{ opacity: 0.5 }} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="search-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="primary-btn glow-on-hover"
                        style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        <LogIn size={18} style={{ marginLeft: '10px' }} />
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        onClick={handleGoogleSignIn}
                        className="glass glass-hover"
                        style={{
                            padding: '0.75rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: 'white'
                        }}
                    >
                        <Chrome size={18} /> Google
                    </button>
                    <button
                        onClick={handleGuestSignIn}
                        className="glass glass-hover"
                        style={{
                            padding: '0.75rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            color: 'white'
                        }}
                    >
                        Guest
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
