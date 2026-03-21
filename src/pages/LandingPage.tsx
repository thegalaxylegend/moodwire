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
                title="Exam Compass | AI Mock Tests for JEE, NEET, UPSC"
                description="The ultimate AI study partner for Class 6-12 board exams, JEE, NEET, and UPSC. Get personalized mock tests, PYQ analytics, and honest roadmaps for Indian aspirants."
                canonical={`${SITE_URL}/`}
                image={SITE_OG_IMAGE}
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebSite",
                            "name": "Exam Compass",
                            "url": SITE_URL,
                            "description": "AI-powered exam preparation platform for JEE, NEET, UPSC, and CBSE Class 6-12.",
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
                                "jobTitle": "Founder & Student Developer",
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

            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
                <article className="prose prose-invert max-w-4xl mx-auto text-center space-y-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">The Future of Exam Preparation</h2>
                    <p className="text-lg text-gray-300 leading-relaxed text-left md:text-center">
                        Exam Compass is an advanced, AI-powered learning ecosystem designed specifically for Indian students preparing for highly competitive entrance examinations such as JEE Mains, JEE Advanced, NEET UG, CLAT, GATE, and UPSC CSE, as well as foundational CBSE Class 6 to Class 12 board exams. We believe that hard work alone is no longer sufficient; success requires data-driven strategy and targeted preparation.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed text-left md:text-center">
                        Our platform completely eliminates the guesswork from your study routine. Unlike traditional test series that offer generic questions to every student, our adaptive Mock Exam Generator analyzes your individual performance, identifying your specific weaknesses down to the sub-topic level. By exclusively tracking your historical data, the AI curates customized mock tests composed of over 9,000 verified Previous Year Questions (PYQs), ensuring every minute you spend practicing directly contributes to improving your final rank.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed text-left md:text-center">
                        Stop wasting time on low-yield chapters. With Exam Compass, you gain access to comprehensive syllabus breakdowns, exact weightage analytics, real-time probability scores, and dynamic learning roadmaps. Practice smarter, overcome your exam anxiety, and secure your admission into India's premier colleges and universities with the power of artificial intelligence.
                    </p>
                </article>
            </section>

            <AboutAuthor compact />
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
            <Footer />
        </div >
    );
};
