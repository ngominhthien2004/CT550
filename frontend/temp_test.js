const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Opening login page...');
    await page.goto('http://localhost:5173/login');

    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'qa_auth_20260405_a@example.com');
    await page.fill('input[type="password"]', 'QaAuth!2026A');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); 

    console.log('3. Navigating to messages...');
    await page.goto('http://localhost:5173/messages');
    await page.waitForLoadState('networkidle');

    console.log('4. Checking for conversations...');
    const thread = page.locator('.thread-item').first();
    await thread.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        throw new Error('FAIL: No conversations found in thread list.');
    });
    await thread.click();

    console.log('5. Clearing message input...');
    const input = page.locator('textarea[placeholder="Type a message"], input[placeholder="Type a message"]');
    await input.waitFor();
    await input.fill('');

    console.log('6. Attaching image...');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.image-picker');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('E:\\HocTap\\CT550\\test-artifacts\\upload-fixtures\\valid.png');

    console.log('7. Clicking send...');
    await page.click('.compose-send');

    console.log('8. Verifying no error message...');
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=recipientId and content are required');
    if (await errorMessage.isVisible()) {
      throw new Error('FAIL: Found error message "recipientId and content are required"');
    }

    console.log('9. Verifying success evidence...');
    const successEvidence = page.locator('text=[Image]').first();
    await successEvidence.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        throw new Error('FAIL: Could not find "[Image]" in the page after sending.');
    });

    console.log('10. Capturing screenshot...');
    await page.screenshot({ path: 'E:\\HocTap\\CT550\\test-artifacts\\screenshots\\messages\\messages-auth-image-send-2026-04-26.png' });

    console.log('PASS: Image sent successfully and verified.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
