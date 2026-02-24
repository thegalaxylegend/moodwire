import { useState, useEffect } from 'react';

export const usePWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Standalone check
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator.standalone;
        setIsStandalone(!!checkStandalone);

        // iOS check
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Install prompt event
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log('✅ PWA: Deferred Prompt Cached');
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
            return outcome;
        }
        return 'no-prompt';
    };

    return {
        deferredPrompt,
        isStandalone,
        isIOS,
        installApp,
        canInstall: !!deferredPrompt || isIOS
    };
};
