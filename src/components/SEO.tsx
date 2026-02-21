import { Helmet } from 'react-helmet-async';


interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    type?: string;
    name?: string;
    image?: string;
    url?: string;
    schema?: Record<string, any>;
}

export const SEO = (props: SEOProps) => {
    const { title, description, canonical, type, name, image, schema } = props;

    return (
        <Helmet defer={false}>
            {/* Standard Metadata */}
            <title>{title.includes('|') ? title : `${title} | Exam Compass`}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname.replace(/\/$/, '') : 'https://examcompass.web.app/')} />

            {/* Open Graph */}
            <meta property="og:type" content={type || 'website'} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image || 'https://examcompass.web.app/exa-logo.png'} />
            <meta property="og:url" content={canonical || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://examcompass.web.app')} />
            <meta property="og:site_name" content={name || 'Exam Compass'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@examcompass" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image || 'https://examcompass.web.app/exa-logo.png'} />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};
