import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => {
            const type = msg.type();
            if(type === 'error' || type === 'warning' || type === 'log') {
                console.log(`[${type.toUpperCase()}] ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => console.log('PAGE ERROR STR:', error.message));

        console.log("Navigating...");
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });
        console.log("Navigation done.");

        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (e) {
        console.error("Script Error:", e.message);
        process.exit(1);
    }
})();
