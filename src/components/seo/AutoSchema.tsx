
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SYLLABUS_DB } from '../../lib/constants';
import { slugify } from '../../lib/utils';
import { useMemo } from 'react';

export const AutoSchema = () => {
    const location = useLocation();

    // We use window.location.pathname because useParams might be empty outside of a specific route component
    // But to get params easily, we might need to parse the path manually if this is a global component.
    // However, if we place this inside <Routes>, we can use useParams.
    // Let's assume this is placed inside the Router context.

    // Parsing logic for /:exam/:subject/:topic
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const exam = pathSegments[0];
    const subjectSlug = pathSegments[1];
    const topicSlug = pathSegments[2];

    const schemaData = useMemo(() => {
        if (!exam || ['login', 'signup', 'dashboard'].includes(exam)) return null;

        // 1. Breadcrumb Schema (Always useful)
        const breadcrumbSchema = {
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
                    "name": exam.toUpperCase(),
                    "item": `https://examcompass.web.app/${exam}`
                }
            ]
        };

        if (subjectSlug) {
            // @ts-ignore
            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 3,
                "name": subjectSlug.replace(/-/g, ' '), // Approximate name
                "item": `https://examcompass.web.app/${exam}/${subjectSlug}`
            });
        }

        if (topicSlug) {
            // @ts-ignore
            breadcrumbSchema.itemListElement.push({
                "@type": "ListItem",
                "position": 4,
                "name": topicSlug.replace(/-/g, ' '),
                "item": `https://examcompass.web.app/${exam}/${subjectSlug}/${topicSlug}`
            });
        }

        // 2. Topic/Course Schema
        let courseSchema = null;
        if (subjectSlug && topicSlug) {
            // Find real data
            const realSubject = Object.keys(SYLLABUS_DB).find(k => slugify(k) === subjectSlug);
            if (realSubject) {
                const topicData = SYLLABUS_DB[realSubject].find(t => slugify(t.topic) === topicSlug);

                if (topicData) {
                    courseSchema = {
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": `${topicData.topic} for ${exam.toUpperCase()}`,
                        "description": `Master ${topicData.topic} for ${exam.toUpperCase()}. Includes ${topicData.subtopics.length} key concepts like ${topicData.subtopics.slice(0, 3).join(', ')}.`,
                        "provider": {
                            "@type": "Organization",
                            "name": "Exam Compass",
                            "sameAs": "https://examcompass.web.app"
                        },
                        "hasCourseInstance": {
                            "@type": "CourseInstance",
                            "courseMode": "online",
                            "courseWorkload": "PT2H"
                        }
                    };
                }
            }
        }

        return [breadcrumbSchema, courseSchema].filter(Boolean);
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
