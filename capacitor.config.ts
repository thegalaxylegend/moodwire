import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'app.web.examcompass',
    appName: 'Exam Compass',
    webDir: 'dist',
    server: {
        // This allows the app to automatically update when the website is deployed
        url: 'https://examcompass.pages.dev',
        cleartext: true
    },
    plugins: {
        CapacitorUpdater: {
            autoUpdate: false
        },
        FirebaseAuthentication: {
            providers: ["google.com"]
        }
    }
};

export default config;
