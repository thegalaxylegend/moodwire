import React from 'react';

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
            "name": authorName
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    );
};
