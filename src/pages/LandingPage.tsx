import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Hero } from '../components/Hero';

import { ExamGrid } from '../components/ExamGrid';
import { DemoModal } from '../components/DemoModal';
import { Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { AboutAuthor } from '../components/seo/AboutAuthor';
import { Footer } from '../components/Footer';
import { SITE_URL, SITE_OG_IMAGE } from '../lib/siteConfig';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useUserStore();
    const [showDemo, setShowDemo] = useState(false);

    // SSR/SSG guard: on the server, never redirect or show spinner
    const isServer = typeof window === 'undefined';

    useEffect(() => {
        // Redirection logic:
        // 1. If we are authenticated (from cache or listener) AND not loading -> Redirect.
        // 2. OR if we are authenticated (optimistic snapshot) -> Redirect immediately to avoid flicker.
        if (isAuthenticated && (!isLoading || !isServer)) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate, isServer]);

    // Show loader while checking auth state to prevent flashing
    // But NEVER during SSG — always render full content for crawlers
    if (!isServer && (isLoading || isAuthenticated)) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-transparent text-text-main relative overflow-hidden">
            <SEO
                title="Exam Compass | AI Mock Tests for JEE & NEET"
                description="The ultimate AI study partner for Class 8-12 board exams, JEE, and NEET. Get personalized mock tests, PYQ analytics, and honest roadmaps for Indian aspirants."
                canonical={`${SITE_URL}/`}
                image={SITE_OG_IMAGE}
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebSite",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "description": "AI-powered exam preparation platform for JEE, NEET, and CBSE Class 8-12.",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": `${SITE_URL}/{search_term_string}`,
                                "query-input": "required name=search_term_string"
                            }
                        },
                        {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "logo": `${SITE_URL}/logo.jpg`,
                            "founder": {
                                "@type": "Person",
                                "name": "Ayush Kumar",
                                "jobTitle": "Founder",
                                "sameAs": [
                                    "https://github.com/thegalaxylegend",
                                    `${SITE_URL}/about`
                                ]
                            },
                            "sameAs": [
                                `${SITE_URL}/blog`,
                                `${SITE_URL}/about`
                            ]
                        }
                    ]
                }}
            />

            < Hero onOpenDemo={() => setShowDemo(true)} />
            < ExamGrid />

            {/* Social Proof Stats Bar */}
            <section className="py-12 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div className="space-y-1">
                        <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">9,000+</p>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold">PYQs Mapped</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">15+</p>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Subjects Covered</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Class 8–12</p>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Complete Syllabus</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">100%</p>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Free Forever</p>
                    </div>
                </div>
            </section>

            {/* Why Exam Compass — Feature Proof */}
            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Why Exam Compass?</h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">Not another quiz app. Here's what makes us technically different.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1: Elo Rating */}
                    <div className="group relative p-8 rounded-2xl bg-surface border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Adaptive Elo Rating</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Every question has a difficulty score. Every student has a skill score. Our Elo algorithm matches them in real-time — so you're always challenged at YOUR level, never wasting time on questions too easy or too hard.</p>
                        </div>
                    </div>

                    {/* Card 2: Root-Cause AI */}
                    <div className="group relative p-8 rounded-2xl bg-surface border border-white/5 hover:border-secondary/30 transition-all duration-500 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Root-Cause Analysis</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Failing Torque problems? Our Concept Graph engine traces backwards to find the real gap — maybe it's Cross Products, not Torque. We fix the ROOT of your weakness, not just the symptom.</p>
                        </div>
                    </div>

                    {/* Card 3: PYQ Intelligence */}
                    <div className="group relative p-8 rounded-2xl bg-surface border border-white/5 hover:border-accent/30 transition-all duration-500 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">PYQ Intelligence Engine</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">We mapped 9,000+ Previous Year Questions (2015–2025). Our engine identifies which chapters NTA repeats, which concepts carry maximum weightage, and predicts high-probability topics for 2026.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How Our AI Works — 3-Step Explainer */}
            <section className="py-20 px-6 max-w-5xl mx-auto border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Actually Works</h2>
                    <p className="text-lg text-gray-400">No vague "AI-powered" claims. Here are the 3 real steps.</p>
                </div>
                <div className="space-y-0 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-8 top-12 bottom-12 w-px bg-gradient-to-b from-primary via-secondary to-accent hidden md:block" />

                    {/* Step 1 */}
                    <div className="flex gap-6 items-start p-6 rounded-2xl hover:bg-white/[0.02] transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-2xl font-black text-primary">1</div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Take a Mock Test</h3>
                            <p className="text-gray-400 leading-relaxed">AI generates questions matching YOUR current Elo rating. No generic question banks — every test is calibrated to push you just beyond your comfort zone.</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-6 items-start p-6 rounded-2xl hover:bg-white/[0.02] transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 text-2xl font-black text-secondary">2</div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Get Root-Cause Diagnosis</h3>
                            <p className="text-gray-400 leading-relaxed">Our Concept Graph maps your mistakes to their deepest prerequisites. Instead of "study Physics more," you get "revise Vector Cross Products → then retry Torque."</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-6 items-start p-6 rounded-2xl hover:bg-white/[0.02] transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-2xl font-black text-accent">3</div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Watch Your Rank Climb</h3>
                            <p className="text-gray-400 leading-relaxed">Track real-time selection probability, subject-wise heatmaps, and a predicted All India Rank. The system learns from every attempt and adjusts your preparation roadmap automatically.</p>
                        </div>
                    </div>
                </div>
            </section>

            <AboutAuthor compact />
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
            <Footer />
        </div >
    );
};
