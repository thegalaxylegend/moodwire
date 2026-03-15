import React from 'react';
import { Helmet } from 'react-helmet-async';

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
    imageUrl = 'https://examcompass.web.app/exa-logo.png'
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
            "url": "https://examcompass.web.app/about"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Exam Compass",
            "logo": {
                "@type": "ImageObject",
                "url": "https://examcompass.web.app/exa-logo.png"
            }
        },
        "datePublished": new Date(publishDate).toISOString(),
        "dateModified": modifiedDate ? new Date(modifiedDate).toISOString() : new Date(publishDate).toISOString(),
    };

    return (
        <Helmet>
            <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
    );
};
