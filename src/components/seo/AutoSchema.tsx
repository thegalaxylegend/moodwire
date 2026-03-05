
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useMemo } from 'react';

// Exam metadata for EducationEvent schema
const EXAM_DATES: Record<string, { name: string; startDate: string; endDate: string; level: string }> = {
    'jee-mains': { name: 'JEE Mains 2026', startDate: '2026-01-20', endDate: '2026-04-15', level: 'Undergraduate' },
    'jee-advanced': { name: 'JEE Advanced 2026', startDate: '2026-06-01', endDate: '2026-06-30', level: 'Undergraduate' },
    'neet': { name: 'NEET UG 2026', startDate: '2026-05-01', endDate: '2026-05-31', level: 'Undergraduate' },
    'upsc': { name: 'UPSC CSE 2026', startDate: '2026-05-25', endDate: '2026-10-15', level: 'Postgraduate' },
    'clat': { name: 'CLAT 2026', startDate: '2026-12-01', endDate: '2026-12-31', level: 'Undergraduate' },
    'gate': { name: 'GATE 2026', startDate: '2026-02-01', endDate: '2026-02-28', level: 'Postgraduate' },
    'bitsat': { name: 'BITSAT 2026', startDate: '2026-05-15', endDate: '2026-06-15', level: 'Undergraduate' },
};

export const AutoSchema = () => {
    const location = useLocation();

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const exam = pathSegments[0];
    const subjectSlug = pathSegments[1];
    const topicSlug = pathSegments[2];

    const schemaData = useMemo(() => {
        if (['login', 'signup', 'dashboard', 'admin', 'onboarding'].includes(exam || '')) return null;

        const schemas: Record<string, any>[] = [];

        // 1. Breadcrumb Schema (Always useful on public pages)
        const breadcrumbSchema: Record<string, any> = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://examcompass.web.app"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": (exam || '').toUpperCase().replace(/-/g, ' '),
                    "item": `https://examcompass.web.app/${exam}`
                }
            ]
        };

        if (subjectSlug && !subjectSlug.startsWith('q')) {
            const subjectName = subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 3,
                "name": subjectName,
                "item": `https://examcompass.web.app/${exam}/${subjectSlug}`
            });
        }

        if (topicSlug) {
            const topicName = topicSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 4,
                "name": topicName,
                "item": `https://examcompass.web.app/${exam}/${subjectSlug}/${topicSlug}`
            });
        }

        schemas.push(breadcrumbSchema);

        // 2. EducationEvent Schema (for exam landing pages: /:exam)
        if (!subjectSlug && !topicSlug) {
            const examMeta = exam ? EXAM_DATES[exam] : null;
            const isClassPage = exam ? exam.startsWith('class-') : false;

            if (examMeta) {
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "EducationEvent",
                    "name": `${examMeta.name} Preparation`,
                    "description": `Comprehensive preparation course for ${examMeta.name} with AI-generated mock tests, previous year questions, and personalized study plans.`,
                    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                    "eventStatus": "https://schema.org/EventScheduled",
                    "startDate": examMeta.startDate,
                    "endDate": examMeta.endDate,
                    "location": {
                        "@type": "VirtualLocation",
                        "url": `https://examcompass.web.app/${exam}`
                    },
                    "organizer": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": "https://examcompass.web.app",
                        "logo": "https://examcompass.web.app/logo.jpg"
                    },
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "INR",
                        "availability": "https://schema.org/InStock"
                    }
                });
            }

            if (isClassPage) {
                const classNum = exam.replace('class-', '');
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "LearningResource",
                    "name": `Class ${classNum} CBSE Preparation`,
                    "description": `AI-powered study material, mock tests, and practice questions for CBSE Class ${classNum}.`,
                    "educationalLevel": `Class ${classNum}`,
                    "provider": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": "https://examcompass.web.app",
                        "logo": "https://examcompass.web.app/logo.jpg"
                    },
                    "isAccessibleForFree": true
                });
            }
        }

        // 3. Course + Quiz Schema (for topic pages: /:exam/:subject/:topic)
        if (subjectSlug && topicSlug) {
            const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subjectSlug);
            if (realSubject) {
                const topicData = SYLLABUS_DB[realSubject].find(t => slugify(t.topic) === topicSlug);

                if (topicData) {
                    // Course schema
                    schemas.push({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": `${topicData.topic} for ${(exam || '').toUpperCase().replace(/-/g, ' ')}`,
                        "description": `Master ${topicData.topic} for ${(exam || '').toUpperCase().replace(/-/g, ' ')}. Includes ${topicData.subtopics.length} key concepts like ${topicData.subtopics.slice(0, 3).join(', ')}.`,
                        "provider": {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "sameAs": "https://examcompass.web.app",
                            "url": "https://examcompass.web.app",
                            "logo": "https://examcompass.web.app/logo.jpg"
                        },
                        "hasCourseInstance": {
                            "@type": "CourseInstance",
                            "courseMode": "Online",
                            "courseWorkload": "PT2H"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "INR",
                            "category": "Free"
                        },
                        "isAccessibleForFree": true,
                    });

                    // Quiz schema for topic practice
                    schemas.push({
                        "@context": "https://schema.org",
                        "@type": "Quiz",
                        "name": `${topicData.topic} Practice Test — ${exam.toUpperCase().replace(/-/g, ' ')}`,
                        "about": {
                            "@type": "DefinedTerm",
                            "name": topicData.topic,
                            "inDefinedTermSet": `${(exam || '').toUpperCase().replace(/-/g, ' ')} ${realSubject} Syllabus`
                        },
                        "educationalLevel": "High School",
                        "numberOfQuestions": 15,
                        "provider": {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "url": "https://examcompass.web.app",
                            "logo": "https://examcompass.web.app/logo.jpg"
                        },
                        "isAccessibleForFree": true
                    });
                }
            }
        }

        // 4. WebApplication schema (global — helps Google understand this is an interactive tool)
        if (!subjectSlug && !topicSlug) {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Exam Compass",
                "url": "https://examcompass.web.app",
                "description": "AI-powered exam preparation platform for JEE, NEET, UPSC, and CBSE Class 6-12 students.",
                "image": "https://examcompass.web.app/exa-logo.png",
                "screenshot": "https://examcompass.web.app/og-image.png",
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "Web Browser",
                "featureList": "AI-Generated Mock Tests, Personalized Learning Roadmaps, Chapter-wise PYQs, Real-time Performance Analytics, Adaptive Practice Modules",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "INR",
                    "category": "Free"
                },
                "author": {
                    "@type": "Person",
                    "name": "Ayush",
                    "url": "https://examcompass.web.app/about"
                }
            });
        }

        return schemas.length > 0 ? schemas : null;
    }, [location.pathname]);

    if (!schemaData) return null;

    return (
        <Helmet>
            {schemaData.map((schema, idx) => (
                <script key={idx} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
};
