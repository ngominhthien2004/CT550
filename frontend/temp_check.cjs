
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const urls = ["http://localhost:5175", "http://127.0.0.1:5173", "http://localhost:5174"];
    let success = false;
    
    for (const url of urls) {
        try {
            console.log(`Trying ${url}...`);
            await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
            success = true;
            console.log(`Connected to ${url}`);
            break;
        } catch (e) {
            console.log(`Failed to connect to ${url}`);
        }
    }

    if (!success) {
        console.log("FAIL: Could not connect to any dev server URL");
        await browser.close();
        process.exit(1);
    }

    try {
        // Step 2: click search input in top bar
        // Assuming search input has a placeholder like "Search..." or is identifiable
        const searchInput = await page.locator("input[placeholder*=\"Search\"], .search-input, input[type=\"search\"]").first();
        await searchInput.click();
        
        // Step 3: assert ".history-panel" is visible
        const historyPanel = page.locator(".history-panel");
        await historyPanel.waitFor({ state: "visible", timeout: 5000 });
        
        const isVisible = await historyPanel.isVisible();
        console.log(`History panel visible: ${isVisible}`);

        // Step 4: capture screenshot
        const screenshotPath = "E:\\HocTap\\CT550\\test-artifacts\\screenshots\\messages\\search-dropdown-visible-fix2-2026-04-27.png";
        const dir = path.dirname(screenshotPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);

        if (isVisible) {
            console.log("PASS: History panel is visible after clicking search input.");
        } else {
            console.log("FAIL: History panel is not visible.");
        }
    } catch (e) {
        console.log(`FAIL: ${e.message}`);
    } finally {
        await browser.close();
    }
})();