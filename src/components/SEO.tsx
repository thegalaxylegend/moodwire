import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_URL, SITE_NAME } from '../lib/siteConfig';
import { SOCIAL_LINKS } from '../lib/constants';


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

    // Standardized canonical: always end with a trailing slash (except root) for Cloudflare Pages directory compatibility
    let canonicalUrl = canonical;
    if (!canonicalUrl) {
        let path = location.pathname;
        if (path !== '/' && !path.endsWith('/')) {
            path += '/';
        }
        canonicalUrl = `${SITE_URL}${path}`;
    } else {
        try {
            // If passed manually, ensure it ends with a trailing slash (except root or if it's a file)
            const parsedUrl = new URL(canonicalUrl);
            if (parsedUrl.pathname !== '/' && !parsedUrl.pathname.endsWith('/') && !parsedUrl.pathname.includes('.')) {
                parsedUrl.pathname += '/';
            }
            canonicalUrl = parsedUrl.toString();
        } catch (e) {
            // Fallback in case of invalid URL string
            if (!canonicalUrl.endsWith('/') && !canonicalUrl.includes('.')) {
                canonicalUrl += '/';
            }
        }
    }
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

    const encodedTitle = encodeURIComponent(fullTitle);
    const encodedSub = encodeURIComponent(SITE_URL.replace('https://', ''));
    const imageUrl = image || `${SITE_URL}/api/og?title=${encodedTitle}&sub=${encodedSub}`;

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
            <meta name="twitter:site" content={SOCIAL_LINKS.twitter.handle} />
            <meta name="twitter:creator" content={SOCIAL_LINKS.twitter.creator} />
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
