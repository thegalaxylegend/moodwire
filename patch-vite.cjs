const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

// Adding define to process.env for vite environment during build
if (!content.includes("define: {")) {
    const defineBlock = `
    define: {
        'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY'),
        'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || 'legendstech001.firebaseapp.com'),
        'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || 'legendstech001'),
        'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || 'legendstech001.firebasestorage.app'),
        'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '749589426436'),
        'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID || '1:749589426436:web:64b0455b7f90a7849c6051'),
        'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-7MWNJDZ5D0')
    },
    plugins: [
`;
    content = content.replace('plugins: [', defineBlock);
    fs.writeFileSync('vite.config.ts', content);
}
