const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const results = [];

    try {
        console.log('🚀 Starting Sidebar Audit...');
        await page.goto('http://localhost:5173/dashboard');
        await page.waitForLoadState('networkidle');

        // List of sidebar links to check
        const links = [
            { name: 'Overview', path: '/dashboard' },
            { name: 'Test Center', path: '/dashboard/test-center' },
            { name: 'Analytics', path: '/dashboard/analytics' },
            { name: 'Syllabus', path: '/dashboard/syllabus' }
        ];

        for (const link of links) {
            console.log(`Checking link: ${link.name}...`);
            const selector = `a[href="${link.path}"]`;
            const element = await page.$(selector);

            if (element) {
                await element.click();
                await page.waitForTimeout(1000); // Wait for navigation
                const currentUrl = page.url();
                const success = currentUrl.includes(link.path);
                results.push({ name: link.name, success, url: currentUrl });
                console.log(`Result: ${success ? '✅' : '❌'} (${currentUrl})`);

                // Screenshot for visual check
                await page.screenshot({ path: `audit_${link.name.toLowerCase().replace(' ', '_')}.png` });
            } else {
                console.log(`Error: Link ${link.name} not found!`);
                results.push({ name: link.name, success: false, error: 'Not found' });
            }
        }

    } catch (err) {
        console.error('❌ Audit Failed:', err.message);
    } finally {
        await browser.close();
        console.log('📊 FINAL RESULTS:', JSON.stringify(results, null, 2));
    }
})();
