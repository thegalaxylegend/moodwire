import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';


interface SEOProps {
    title: string;
    description: string;
    canonical?: string;
    type?: string;
    name?: string;
    image?: string;
    url?: string;
    schema?: Record<string, any>;
    noindex?: boolean;
    keywords?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

export const SEO = (props: SEOProps) => {
    const { title, description, canonical, type, name, image, schema, noindex, keywords, publishedTime, modifiedTime } = props;
    const location = useLocation();

    // SSR-safe canonical: use explicit prop > useLocation (works in SSR via StaticRouter) > window fallback
    const canonicalUrl = canonical
        || `https://examcompass.web.app${location.pathname.replace(/\/$/, '') || '/'}`;
    const imageUrl = image || 'https://examcompass.web.app/exa-logo.png';
    const fullTitle = title.includes('|') ? title : `${title} | Exam Compass`;

    return (
        <Helmet defer={false}>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {/* Keywords (still used by some engines) */}
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Locale */}
            <meta httpEquiv="content-language" content="en-IN" />

            {/* Open Graph */}
            <meta property="og:type" content={type || 'website'} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={fullTitle} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content={name || 'Exam Compass'} />
            <meta property="og:locale" content="en_IN" />

            {/* Article timestamps (for content pages) */}
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@examcompass_ai" />
            <meta name="twitter:creator" content="@ayush_founder" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={imageUrl} />
            <meta name="twitter:image:alt" content={fullTitle} />

            {/* SEO Status Marker (dev checker) */}
            <meta name="seo-status" content="active" />

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};
