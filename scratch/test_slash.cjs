const https = require('https');

const urls = [
    'https://examcompass.pages.dev',
    'https://examcompass.pages.dev/',
    'https://examcompass.pages.dev/blog',
    'https://examcompass.pages.dev/blog/',
    'https://examcompass.pages.dev/jee',
    'https://examcompass.pages.dev/jee/',
    'https://examcompass.pages.dev/jee/physics',
    'https://examcompass.pages.dev/jee/physics/',
    'https://examcompass.pages.dev/login',
    'https://examcompass.pages.dev/login/'
];

function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            const redirect = res.headers.location || '';
            resolve({
                url,
                status: res.statusCode,
                redirect
            });
        }).on('error', (e) => {
            resolve({
                url,
                status: 'ERROR',
                error: e.message
            });
        });
    });
}

async function run() {
    console.log('Testing URLs for redirects...');
    for (const url of urls) {
        const result = await checkUrl(url);
        console.log(`URL: ${result.url.padEnd(50)} => Status: ${result.status} ${result.redirect ? '(Redirects to: ' + result.redirect + ')' : ''}`);
    }
}

run();
