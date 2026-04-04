const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://www.pixiv.net/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'pixiv-home.png', fullPage: true });

  const loginLinkCount = await page.locator('a[href*="login" i], a[href*="/login.php" i]').count();
  const hasLoginLink = loginLinkCount > 0;

  const hasUserLikeElement = await page.locator('[data-gtm-user-id], a[href^="/users/"], img[alt*="avatar" i], [aria-label*="account" i], [aria-label*="profile" i]').first().isVisible().catch(() => false);

  console.log('hasLoginLink=' + hasLoginLink);
  console.log('hasUserLikeElement=' + hasUserLikeElement);
  console.log('screenshot=pixiv-home.png');

  await browser.close();
})();
