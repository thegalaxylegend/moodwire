import { Helmet } from 'react-helmet-async';

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
        "name": "Ayush",
        "url": "https://examcompass.web.app/about",
        "jobTitle": "Founder & Student Developer",
        "worksFor": {
            "@type": "Organization",
            "name": "Exam Compass",
            "url": "https://examcompass.web.app"
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
        "description": "Class 11 student at KV Darbhanga who built Exam Compass — an AI-powered exam prep platform — while preparing for JEE. Every feature was designed from real study experience.",
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
                    className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400"
                    itemScope
                    itemType="https://schema.org/Person"
                >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                    <span>
                        Built by{' '}
                        <span itemProp="name" className="text-white font-medium">
                            Ayush
                        </span>
                        {' '}— Class 11, KV Darbhanga
                    </span>
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
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white">
                            A
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1">
                                Made by{' '}
                                <span itemProp="name">Ayush</span>
                            </h3>
                            <p
                                className="text-sm text-purple-400 mb-4"
                                itemProp="jobTitle"
                            >
                                Class 11 Student & Founder — KV Darbhanga
                            </p>
                            <p
                                className="text-gray-400 leading-relaxed text-sm"
                                itemProp="description"
                            >
                                I'm a Class 11 student at Kendriya Vidyalaya Darbhanga, building
                                Exam Compass while preparing for JEE myself. Every feature — from
                                the AI mock test generator to the fatigue-aware study planner —
                                exists because I needed it. This isn't a corporate product; it's
                                a tool built by a student who's in the trenches, designed to give
                                every student honest data about their preparation.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {['Student-Built', 'Open Analytics', 'Real PYQs', 'AI-Powered'].map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hidden structured data for crawlers */}
                <meta itemProp="url" content="https://examcompass.web.app/about" />
                <span itemProp="worksFor" itemScope itemType="https://schema.org/Organization" style={{ display: 'none' }}>
                    <meta itemProp="name" content="Exam Compass" />
                    <meta itemProp="url" content="https://examcompass.web.app" />
                </span>
            </section>
        </>
    );
};
