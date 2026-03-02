import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Hero } from '../components/Hero';

import { ExamGrid } from '../components/ExamGrid';
import { DemoModal } from '../components/DemoModal';
import { Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useUserStore();
    const [showDemo, setShowDemo] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    // Show loader while checking auth state to prevent flashing
    if (isLoading || isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-transparent text-text-main relative overflow-hidden">
            <SEO
                title="Exam Compass | AI-Powered Learning for Class 6-12 & Competitive Exams"
                description="The ultimate study partner for Class 6-12 school exams, JEE, NEET, and UPSC. Get AI-generated mocks, personalized roadmaps, and honest data."
                canonical="https://examcompass.web.app/"
                schema={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebSite",
                            "name": "Exam Compass",
                            "url": "https://examcompass.web.app",
                            "description": "AI-powered exam preparation platform for JEE, NEET, UPSC, and CBSE Class 6-12.",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": "https://examcompass.web.app/{search_term_string}",
                                "query-input": "required name=search_term_string"
                            }
                        },
                        {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "url": "https://examcompass.web.app",
                            "logo": "https://examcompass.web.app/exa-logo.png",
                            "sameAs": []
                        }
                    ]
                }}
            />

            <Hero onOpenDemo={() => setShowDemo(true)} />
            <ExamGrid />
            <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
        </div>
    );
};
