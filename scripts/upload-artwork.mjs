import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const USER_ID = '6a19710c0c310e3af198ef64';
const JWT_SECRET = 'REPLACED';
const FRONTEND_URL = 'http://localhost:5173';

async function main() {
  console.log('=== IlluWrl Artwork Upload Script ===\n');

  // --- Generate fresh JWT token ---
  console.log('Generating fresh JWT token...');
  const token = jwt.sign({ id: USER_ID }, JWT_SECRET, { expiresIn: '30d' });
  console.log(`✓ Token generated for user: ${USER_ID}\n`);

  // --- Verify source files exist ---
  const filePaths = [];
  for (let i = 0; i < 8; i++) {
    const fp = path.resolve(__dirname, '..', 'crawled_images', `pixiv_115614280_p${i}.jpg`);
    if (!fs.existsSync(fp)) {
      console.error(`ERROR: File not found: ${fp}`);
      process.exit(1);
    }
    filePaths.push(fp);
  }
  console.log(`✓ Found ${filePaths.length} image files\n`);

  // --- Launch browser ---
  console.log('Launching Chromium (headed mode)...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // --- Step 1: Visit the app to establish origin (required for localStorage) ---
    console.log('Navigating to FRONTEND_URL ...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    console.log('✓ Page loaded\n');

    // --- Step 2: Inject auth credentials into localStorage ---
    console.log('Setting auth credentials in localStorage...');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          _id: '6a19710c0c310e3af198ef64',
          username: 'johnny.brooks',
          email: 'johnny.brooks@gmail.com',
          role: 'user',
          avatar: '',
          displayName: '',
          location: '',
        })
      );
    }, token);
    console.log('✓ Auth credentials set\n');

    // --- Step 3: Navigate to upload page ---
    console.log('Navigating to /upload/illust ...');
    await page.goto(`${FRONTEND_URL}/upload/illust`, { waitUntil: 'networkidle' });

    // Wait for the Vue app to render the file input
    await page.waitForSelector('#upload-media', { state: 'visible', timeout: 15000 });
    console.log('✓ Upload page loaded\n');

    // --- Step 4: Upload image files ---
    console.log(`Uploading ${filePaths.length} files...`);
    await page.locator('#upload-media').setInputFiles(filePaths);
    console.log('✓ Files uploaded via input\n');

    // Wait for previews to render (the .upload-preview section appears)
    try {
      await page.waitForSelector('.upload-preview', { state: 'visible', timeout: 10000 });
      console.log('✓ Previews rendered');
    } catch {
      console.log('⚠ Preview section did not appear (may still be processing)');
    }
    // Give a moment for thumbnails to generate
    await page.waitForTimeout(1500);

    // --- Step 5: Fill in title ---
    console.log('Filling in title...');
    await page.locator('#upload-title').fill('1869 - Privaty: Unkind Maid');
    console.log('✓ Title set\n');

    // --- Step 6: Fill in caption ---
    console.log('Filling in caption...');
    await page.locator('#upload-caption').fill(
      'A multi-page illustration from Pixiv featuring Privaty in an unkind maid outfit.'
    );
    console.log('✓ Caption set\n');

    // --- Step 7: Add tags ---
    console.log('Adding tags...');
    const tags = ['Azur_Lane', 'Privaty', 'maid', 'unkind_maid', 'fanart'];
    for (const tag of tags) {
      await page.locator('#upload-tags').fill(tag);
      // Press Enter to commit the tag (Vue handler calls commitTag on Enter)
      await page.locator('#upload-tags').press('Enter');
      await page.waitForTimeout(350);
      console.log(`  ✓ Added tag: ${tag}`);
    }
    console.log('✓ All tags added\n');

    // --- Step 8: Age restriction and visibility are defaults (All ages + Make public) ---
    console.log('Using default settings: All ages, Make public\n');

    // --- Step 9: Click Post ---
    console.log('Clicking Post button...');
    await page.locator('button[type="submit"]').click();
    console.log('✓ Post clicked, waiting for result...\n');

    // --- Step 10: Wait and capture result ---
    // Wait for navigation (success redirects to /artworks/:id) or up to 15s timeout
    let currentUrl = page.url();
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(500);
      currentUrl = page.url();
      if (currentUrl !== `${FRONTEND_URL}/upload/illust`) {
        break;
      }
      // Check for error message
      const hasError = await page.locator('.alert-danger').count();
      if (hasError > 0) {
        break;
      }
    }

    console.log('=== RESULT ===');
    console.log(`Current URL: ${currentUrl}`);

    // Check if we were redirected to an artwork page (success)
    const artworkMatch = currentUrl.match(/\/artworks\/([a-f0-9]+)/);
    if (artworkMatch) {
      console.log(`✓ SUCCESS: Artwork created with ID: ${artworkMatch[1]}`);
      console.log(`  View at: ${currentUrl}`);
    } else if (currentUrl.includes('/upload/illust')) {
      console.log('⚠ Still on upload page — may have validation errors or upload issues');

      // Check for error messages
      const errorEls = await page.locator('.alert-danger');
      const errorCount = await errorEls.count();
      for (let i = 0; i < errorCount; i++) {
        const text = await errorEls.nth(i).textContent();
        console.log(`  Error [${i}]: ${text.trim()}`);
      }
    } else {
      console.log(`⚠ Navigated to: ${currentUrl}`);
    }

    // Take screenshot for reference
    const screenshotPath = path.resolve(__dirname, '..', 'crawled_images', 'upload-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n✓ Screenshot saved to: ${screenshotPath}`);

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    // Take error screenshot
    try {
      const screenshotPath = path.resolve(__dirname, '..', 'crawled_images', 'upload-error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  Error screenshot saved to: ${screenshotPath}`);
    } catch {
      // ignore screenshot error
    }
  } finally {
    // Keep browser open for 5 seconds so user can see the result
    console.log('\nWaiting 5 seconds before closing...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('Browser closed.');
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
