import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_URL, SITE_NAME, SITE_LOGO } from '../lib/siteConfig';


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
    robots?: string;
    keywords?: string;
    publishedTime?: string;
    modifiedTime?: string;
}

export const SEO = (props: SEOProps) => {
    const { title, description, canonical, type, name, image, schema, noindex, robots, keywords, publishedTime, modifiedTime } = props;
    const location = useLocation();

    // SSR-safe canonical: use explicit prop > useLocation (works in SSR via StaticRouter) > window fallback
    const canonicalUrl = canonical
        || `${SITE_URL}${location.pathname.replace(/\/$/, '') || '/'}`;
    const imageUrl = image || SITE_LOGO;
    const siteTitle = name || SITE_NAME;
    
    // Smart Title Suffix Logic (Bing 60-char limit optimization)
    let fullTitle = title;
    if (!title.includes('|') && !title.includes('-')) {
        // Only append if it fits reasonably
        if (title.length < 45) {
            fullTitle = `${title} | ${siteTitle}`;
        } else if (title.length < 55) {
            fullTitle = `${title} - EC`;
        }
    }

    return (
        <Helmet defer={false}>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            <link rel="canonical" href={canonicalUrl} />
            <link rel="alternate" hrefLang="en-IN" href={canonicalUrl} />
            <link rel="alternate" hrefLang="en" href={canonicalUrl} />

            {/* Robots */}
            {robots ? (
                <meta name="robots" content={robots} />
            ) : noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <>
                    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                    <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
                </>
            )}

            {/* Geographic Targeting (Bing/Yahoo) */}
            <meta name="geo.region" content="IN" />
            <meta name="geo.placename" content="India" />

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
