import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../../lib/siteConfig';
import { SOCIAL_LINKS } from '../../lib/constants';

/**
 * AboutAuthor — E-E-A-T Signal Component
 * 
 * Renders structured author information with schema.org/Person markup
 * to signal Experience, Expertise, Authority, and Trustworthiness to Google.
 * 
 * Usage: Place on the LandingPage, About page, or in the footer.
 */

interface AboutAuthorProps {
    /** If true, renders as a compact inline badge instead of a full card */
    compact?: boolean;
}

export const AboutAuthor = ({ compact = false }: AboutAuthorProps) => {
    const authorSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Ayush Kumar",
        "url": `${SITE_URL}/founder`,
        "sameAs": [
            SOCIAL_LINKS.twitter.url,
            SOCIAL_LINKS.threads.url,
            SOCIAL_LINKS.linkedin.url
        ],
        "jobTitle": "Founder & Student Developer",
        "worksFor": {
            "@type": "Organization",
            "name": "Exam Compass",
            "url": SITE_URL
        },
        "alumniOf": {
            "@type": "EducationalOrganization",
            "name": "Kendriya Vidyalaya Darbhanga",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Darbhanga",
                "addressRegion": "Bihar",
                "addressCountry": "IN"
            }
        },
        "description": "Class 12 student at KV Darbhanga who built Exam Compass — an AI-powered exam prep platform — while preparing for JEE. Every feature was designed from real study experience.",
        "knowsAbout": [
            "JEE Mains Preparation",
            "NEET Preparation",
            "CBSE Board Exams",
            "AI-Powered Education",
            "EdTech",
            "Web Development"
        ],
        "homeLocation": {
            "@type": "Place",
            "name": "Darbhanga, Bihar, India"
        }
    };

    if (compact) {
        return (
            <>
                <Helmet>
                    <script type="application/ld+json">
                        {JSON.stringify(authorSchema)}
                    </script>
                </Helmet>
                <div
                    className="flex items-center gap-3 py-2 px-4 group transition-opacity"
                    itemScope
                    itemType="https://schema.org/Person"
                >
                    {/* Vertical Accent Line */}
                    <div className="w-px h-6 bg-gradient-to-b from-primary to-accent opacity-30 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col leading-none">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Built by</span>
                            <span itemProp="name" className="text-text-main font-heading font-bold text-sm tracking-tight">
                                Ayush Kumar
                            </span>
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-primary/60 font-bold mt-0.5">
                            Architect of the Neural Engine
                        </span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(authorSchema)}
                </script>
            </Helmet>
            <section
                className="py-16 px-6 max-w-4xl mx-auto"
                itemScope
                itemType="https://schema.org/Person"
            >
                <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        {/* Avatar */}
                        <div className="size-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                            A
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                                Made by{' '}
                                <span itemProp="name">Ayush Kumar</span>
                            </h3>
                            <p
                                className="text-sm text-primary mb-4 font-bold"
                                itemProp="jobTitle"
                            >
                                JEE Aspirant & Founder — KV Darbhanga
                            </p>
                            <p
                                className="text-gray-300 leading-relaxed text-sm md:text-base"
                                itemProp="description"
                            >
                                I'm a JEE Aspirant building Exam Compass to solve the "Black Box" problem of exam preparation. 
                                Every feature—from the Neural Mock Engine to the Cognitive Decay Maps—exists because I needed a way to verify my readiness with mathematical certainty. 
                                This isn't just a platform; it's the infrastructure I built to win, and now it's open to every student in the trenches.
                            </p>

                            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
                                {['Student-Built', 'Open Analytics', 'Real PYQs', 'AI-Powered'].map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden structured data for crawlers */}
                <meta itemProp="url" content={`${SITE_URL}/founder`} />
                <span itemProp="worksFor" itemScope itemType="https://schema.org/Organization" style={{ display: 'none' }}>
                    <meta itemProp="name" content="Exam Compass" />
                    <meta itemProp="url" content={SITE_URL} />
                </span>
            </section>
        </>
    );
};
