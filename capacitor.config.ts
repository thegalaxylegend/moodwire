import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'app.web.examcompass',
    appName: 'Exam Compass',
    webDir: 'dist',

    /**
     * LIVE UPDATE MODE
     * ─────────────────────────────────────────────────────────────────────────
     * The app loads directly from the live Cloudflare Pages URL.
     * This means content updates automatically whenever the website is deployed
     * — no new APK required.
     *
     * cleartext: true  → allows HTTP in addition to HTTPS (required for
     *                    development; harmless in production since we use HTTPS)
     *
     * androidScheme: 'https' → ensures the WebView treats the content as
     *                         HTTPS origin, which is required for:
     *                         - Firebase Auth (needs secure context)
     *                         - Service Workers
     *                         - Secure cookies
     */
    server: {
        url: 'https://examcompass.pages.dev',
        cleartext: true,
        androidScheme: 'https',
    },

    plugins: {
        /**
         * CapacitorUpdater
         * autoUpdate: false → we use the server.url live-load strategy instead
         *                     of OTA bundle updates. The two approaches are
         *                     mutually exclusive.
         */
        CapacitorUpdater: {
            autoUpdate: false,
        },

        /**
         * FirebaseAuthentication
         * ─────────────────────────────────────────────────────────────────────
         * providers must list every OAuth provider you want to use.
         * 'google.com' enables the native Google Sign-In picker on Android/iOS.
         *
         * skipNativeAuth: false (default) → ensures the Firebase Web SDK
         *                                   session is synced after native sign-in.
         *                                   DO NOT set this to true.
         */
        FirebaseAuthentication: {
            skipNativeAuth: false,
            providers: ['google.com'],
        },

        /**
         * SplashScreen
         * ─────────────────────────────────────────────────────────────────────
         * Keep splash visible until the app calls SplashScreen.hide() or for
         * a maximum of 3 seconds. The live-URL load may take a moment on first
         * boot if the user's network is slow.
         */
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: true,
            backgroundColor: '#0a0a0f',
            showSpinner: false,
        },
    },
};

export default config;
