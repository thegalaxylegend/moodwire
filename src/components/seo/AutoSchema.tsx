import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SYLLABUS_DB } from '../../lib/constants';
import { SITE_URL, SITE_LOGO } from '../../lib/siteConfig';
import { slugify } from '../../lib/utils';
import { useMemo } from 'react';

import { examDates } from '../../config/examDates';

// Exam metadata for EducationEvent schema
const EXAM_DATES: Record<string, { name: string; startDate: string; endDate: string; level: string }> = {
    'jee-mains': { name: 'JEE Mains', startDate: '-01-20', endDate: '-04-15', level: 'Undergraduate' },
    'jee-advanced': { name: 'JEE Advanced', startDate: '-06-01', endDate: '-06-30', level: 'Undergraduate' },
    'neet': { name: 'NEET UG', startDate: '-05-01', endDate: '-05-31', level: 'Undergraduate' }
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
        const canonicalUrl = `${SITE_URL}${location.pathname.replace(/\/$/, '') || '/'}`;

        // Root-level entity declarations for the homepage / brand root
        if (!exam || location.pathname === '/') {
            // 1. WebSite Schema with Sitelinks Searchbox
            schemas.push({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "name": "Exam Compass",
                "url": SITE_URL,
                "description": "AI-powered exam preparation platform for JEE, NEET, and CBSE Class 8-12 students.",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${SITE_URL}/search?q={search_term_string}`,
                    "query-input": "required name=search_term_string"
                }
            });

            // 2. Organization Schema
            schemas.push({
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "Exam Compass",
                "url": SITE_URL,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${SITE_URL}/exa-logo.png`,
                    "width": "112",
                    "height": "112"
                },
                "sameAs": [
                    "https://twitter.com/examcompass_ai",
                    "https://www.youtube.com/@moodwire",
                    "https://github.com/thegalaxylegend/examcompass"
                ],
                "founder": {
                    "@type": "Person",
                    "@id": `${SITE_URL}/founder/#person`,
                    "name": "Ayush Kumar"
                }
            });

            // 3. Person Schema (Founder Entity Resolution)
            schemas.push({
                "@context": "https://schema.org",
                "@type": "Person",
                "@id": `${SITE_URL}/founder/#person`,
                "name": "Ayush Kumar",
                "url": `${SITE_URL}/founder`,
                "jobTitle": "Founder & Student Developer",
                "worksFor": {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`
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
                "sameAs": [
                    "https://github.com/thegalaxylegend",
                    "https://twitter.com/examcompass_ai"
                ]
            });
        }

        // Skip BreadcrumbList on pages that generate their own (ExamLanding, BlogPostPage, QuestionPage)
        const pageHasOwnBreadcrumb =
            (exam && !subjectSlug && !topicSlug) || // /:exam pages (ExamLanding)
            exam === 'blog' || // /blog and /blog/:slug
            (subjectSlug === 'q'); // /:exam/q/:slug (QuestionPage)

        // 1. Breadcrumb Schema (only on pages without their own)
        if (!pageHasOwnBreadcrumb && exam) {
            const breadcrumbSchema: Record<string, any> = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": SITE_URL
                    }
                ]
            };

            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 2,
                "name": exam.toUpperCase().replace(/-/g, ' '),
                "item": `${SITE_URL}/${exam}`
            });

            if (subjectSlug && !subjectSlug.startsWith('q')) {
                const subjectName = subjectSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                breadcrumbSchema.itemListElement.push({
                    "@type": "ListItem",
                    "position": 3,
                    "name": subjectName,
                    "item": `${SITE_URL}/${exam}/${subjectSlug}`
                });
            }

            if (topicSlug) {
                const topicName = topicSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                breadcrumbSchema.itemListElement.push({
                    "@type": "ListItem",
                    "position": 4,
                    "name": topicName,
                    "item": `${SITE_URL}/${exam}/${subjectSlug}/${topicSlug}`
                });
            }

            schemas.push(breadcrumbSchema);
        }

        // 2. EducationEvent & Speakable Schema (for exam landing pages: /:exam)
        if (exam && exam !== 'blog' && !subjectSlug && !topicSlug) {
            const examMeta = exam ? EXAM_DATES[exam] : null;
            const isClassPage = exam ? exam.startsWith('class-') : false;
            const targetYear = exam ? examDates.getExamYear(exam) : new Date().getFullYear();

            if (examMeta) {
                schemas.push({
                    "@context": "https://schema.org",
                    "@type": "EducationEvent",
                    "name": `${examMeta.name} ${targetYear} Preparation`,
                    "description": `Comprehensive preparation course for ${examMeta.name} ${targetYear} with AI-generated mock tests, previous year questions, and personalized study plans.`,
                    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                    "eventStatus": "https://schema.org/EventScheduled",
                    "startDate": `${targetYear}${examMeta.startDate}`,
                    "endDate": `${targetYear}${examMeta.endDate}`,
                    "location": {
                        "@type": "VirtualLocation",
                        "url": `${SITE_URL}/${exam}`
                    },
                    "organizer": {
                        "@type": "Organization",
                        "name": "Exam Compass",
                        "url": SITE_URL,
                        "logo": SITE_LOGO,
                        "sameAs": [
                            "https://www.youtube.com/@moodwire",
                            "https://twitter.com/examcompass_ai"
                        ]
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
                        "url": SITE_URL,
                        "logo": SITE_LOGO
                    },
                    "isAccessibleForFree": true
                });
            }

            // Speakable Schema for Voice Search on Exam pages
            schemas.push({
                "@context": "https://schema.org/",
                "@type": "WebPage",
                "name": `${(examMeta?.name ? `${examMeta.name} ${targetYear}` : exam.toUpperCase().replace(/-/g, ' '))} Complete Guide`,
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": [".quick-summary", ".faq-answer", "h1"]
                },
                "url": canonicalUrl
            });
        }

        // 3. Course + Quiz + Speakable Schema (for topic pages: /:exam/:subject/:topic)
        if (exam !== 'blog' && subjectSlug && topicSlug) {
            const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subjectSlug);
            if (realSubject) {
                const topicData = SYLLABUS_DB[realSubject].find(t => slugify(t.topic) === topicSlug);

                if (topicData) {
                    // Course schema with expert reviewedBy tag
                    schemas.push({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": `${topicData.topic} for ${(exam || '').toUpperCase().replace(/-/g, ' ')}`,
                        "description": `Master ${topicData.topic} for ${(exam || '').toUpperCase().replace(/-/g, ' ')}. Includes ${topicData.subtopics.length} key concepts like ${topicData.subtopics.slice(0, 3).join(', ')}.`,
                        "provider": {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "sameAs": SITE_URL,
                            "url": SITE_URL,
                            "logo": SITE_LOGO
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
                        "reviewedBy": {
                            "@type": "Person",
                            "@id": `${SITE_URL}/founder/#person`,
                            "name": "Ayush Kumar"
                        }
                    });

                    // Quiz schema for topic practice with expert reviewedBy tag
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
                            "url": SITE_URL,
                            "logo": SITE_LOGO
                        },
                        "isAccessibleForFree": true,
                        "reviewedBy": {
                            "@type": "Person",
                            "@id": `${SITE_URL}/founder/#person`,
                            "name": "Ayush Kumar"
                        }
                    });

                    // Speakable Schema for Topic Pages
                    schemas.push({
                        "@context": "https://schema.org/",
                        "@type": "WebPage",
                        "name": `${topicData.topic} Guide for ${exam.toUpperCase().replace(/-/g, ' ')}`,
                        "speakable": {
                            "@type": "SpeakableSpecification",
                            "cssSelector": [".quick-summary", ".faq-answer", "h1"]
                        },
                        "url": canonicalUrl
                    });
                }
            }
        }

        // Blog Posting Schema - REMOVED: BlogSchema.tsx component handles this with correct dates
        // AutoSchema was generating duplicate BlogPosting with wrong dates (new Date())

        // 4. SoftwareApplication schema (supports star ratings in Google Search)
        if (!subjectSlug && !topicSlug && exam !== 'blog') {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Exam Compass",
                "url": SITE_URL,
                "description": "AI-powered exam preparation platform for JEE, NEET, and CBSE Class 8-12 students.",
                "image": SITE_LOGO,
                "screenshot": `${SITE_URL}/og-image.png`,
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
                    "@id": `${SITE_URL}/founder/#person`,
                    "name": "Ayush Kumar"
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
