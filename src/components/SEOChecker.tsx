import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const SEOChecker = () => {
    const loc = useLocation();
    const [warnings, setWarnings] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear warnings on navigation
    useEffect(() => {
        if (import.meta.env.PROD) return;
        setWarnings([]);
    }, [loc]);

    useEffect(() => {
        if (import.meta.env.PROD) return;
        const verifySEO = () => {
            // Debounce checks to avoid rapid flickering
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }

            checkTimeoutRef.current = setTimeout(() => {
                const newWarnings: string[] = [];

                // Debug: Scan exactly what is in the head
                const title = document.title;
                const metaStatus = document.querySelector('meta[name="seo-status"]');
                const descTag = document.querySelector('meta[name="description"]');
                const canonicalTag = document.querySelector('link[rel="canonical"]');
                const ogImageTag = document.querySelector('meta[property="og:image"]');
                const twitterImageTag = document.querySelector('meta[name="twitter:image"]');

                // Strict Checks
                if (!title || title.includes('Vite') || title.includes('React')) {
                    newWarnings.push(`Title invalid: "${title}"`);
                }
                if (!descTag || !descTag.getAttribute('content')) {
                    newWarnings.push('Meta Description missing');
                }
                if (!canonicalTag) {
                    newWarnings.push('Canonical URL missing');
                }
                if (!ogImageTag) {
                    newWarnings.push('OG Image missing');
                }
                if (!twitterImageTag) {
                    newWarnings.push('Twitter Image missing');
                }

                // If we have warnings, append the debug report for the user to see
                if (newWarnings.length > 0) {
                    newWarnings.push('--- DEBUG INFO ---');
                    newWarnings.push(`Title: ${title.substring(0, 30)}...`);
                    newWarnings.push(`SEO Status Tag: ${metaStatus ? '✅ Found' : '❌ Missing'}`);
                    newWarnings.push(`Head Children: ${document.head.children.length}`);
                }

                setWarnings(newWarnings);
            }, 500); // Check after 500ms debounce
        };

        // Initial check
        const initialTimer = setTimeout(verifySEO, 1000);

        // MutationObserver to watch for Head changes (Helmet activity)
        const observer = new MutationObserver(() => {
            verifySEO();
        });

        observer.observe(document.head, { childList: true, subtree: true, attributes: true });

        return () => {
            clearTimeout(initialTimer);
            if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
            observer.disconnect();
        };
    }, [loc]); // Re-bind observer on location change just in case

    if (import.meta.env.PROD) return null;
    if (warnings.length === 0 || !isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-red-900/90 text-white p-4 rounded-lg shadow-lg max-w-sm border border-red-500 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    ⚠️ SEO Issues Found
                </h3>
                <button type="button"
                    onClick={() => setIsVisible(false)}
                    className="text-xs hover:bg-red-800 p-1 rounded"
                >
                    Dismiss
                </button>
            </div>
            <ul className="text-xs space-y-1 list-disc pl-4">
                {warnings.map((warning, idx) => (
                    <li key={idx} className="break-words">{warning}</li>
                ))}
            </ul>
        </div>
    );
};
