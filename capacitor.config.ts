import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'app.web.examcompass',
    appName: 'Exam Compass',
    webDir: 'dist',
    server: {
        // This allows the app to automatically update when the website is deployed
        url: 'https://examcompass.web.app',
        cleartext: true
    }
};

export default config;
