import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_LOGO } from '../../lib/siteConfig';

interface BlogSchemaProps {
    title: string;
    description: string;
    publishDate: string;
    modifiedDate?: string;
    authorName: string;
    url: string;
    imageUrl?: string;
}

export const BlogSchema: React.FC<BlogSchemaProps> = ({
    title,
    description,
    publishDate,
    modifiedDate,
    authorName,
    url,
    imageUrl = SITE_LOGO
}) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        },
        "headline": title,
        "description": description,
        "image": imageUrl,
        "author": {
            "@type": "Person",
            "name": authorName,
            "url": `${SITE_URL}/about`
        },
        "publisher": {
            "@type": "Organization",
            "name": "Exam Compass",
            "logo": {
                "@type": "ImageObject",
                "url": SITE_LOGO
            }
        },
        "datePublished": new Date(publishDate).toISOString(),
        "dateModified": modifiedDate ? new Date(modifiedDate).toISOString() : new Date(publishDate).toISOString(),
    };

    const isStrategy = title.toLowerCase().includes('strategy') || title.toLowerCase().includes('guide') || title.toLowerCase().includes('timetable') || title.toLowerCase().includes('hack');
    
    const howToSchema = isStrategy ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "description": description,
        "image": imageUrl,
        "step": [
            {
                "@type": "HowToStep",
                "name": "Understand the Basics",
                "text": "Review the core concepts and syllabus requirements outlined in the guide."
            },
            {
                "@type": "HowToStep",
                "name": "Analyze Patterns",
                "text": "Identify high-weightage topics and previous year questions trends."
            },
            {
                "@type": "HowToStep",
                "name": "Execute Plan",
                "text": "Follow the structured timetable and practice methodology consistently."
            }
        ]
    } : null;

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(schema)}</script>
            {howToSchema && (
                <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
            )}
        </Helmet>
    );
};
