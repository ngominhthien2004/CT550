#!/usr/bin/env node

/**
 * batch-upload-artworks.mjs
 *
 * Logs into multiple IlluWrl accounts and uploads artwork images from
 * crawled_images/ for each account, setting title, caption, and tags.
 *
 * Usage:
 *   node scripts/batch-upload-artworks.mjs
 *
 * Requirements:
 *   - Playwright installed (npm install playwright)
 *   - Chromium browser installed (npx playwright install chromium)
 *   - Backend running on http://localhost:5000
 *   - Frontend running on http://localhost:5173
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ────────────────────────────────────────
// Configuration
// ────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';
const CRAWLED_DIR = path.resolve(__dirname, '..', 'crawled_images');
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'test-artifacts');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/** All test accounts and their credentials */
const accounts = [
  {
    username: 'yuki.sato',
    email: 'yuki.sato@gmail.com',
    password: 'Test12345!',
    artworks: [
      {
        id: '115631510',
        pageCount: 7,
        title: '1870 - Gallagher / 加拉赫',
        tags: ['hsr', 'gallagher', 'fanart'],
      },
      {
        id: '115608675',
        pageCount: 8,
        title: '1868 - Aventurine / 砂金',
        tags: ['hsr', 'aventurine', 'fanart'],
      },
    ],
  },
  {
    username: 'mariana.silva',
    email: 'mariana.silva@gmail.com',
    password: 'Test12345!',
    artworks: [
      {
        id: '115072306',
        pageCount: 2,
        title: '犬まみれポリ',
        tags: ['NIKKE', 'poli', 'fanart'],
      },
      {
        id: '118324104',
        pageCount: 2,
        title: '波利啦啦隊',
        tags: ['NIKKE', 'poli', 'fanart'],
      },
    ],
  },
  {
    username: 'raj.patel',
    email: 'raj.patel@gmail.com',
    password: 'Test12345!',
    artworks: [
      {
        id: '118324106',
        pageCount: 2,
        title: '夜勤マスカーニャ5',
        tags: ['pokemon', 'meowscarada', 'fanart'],
      },
      {
        id: '118322787',
        pageCount: 2,
        title: 'ニャローテ好き',
        tags: ['pokemon', 'nyalothe', 'fanart'],
      },
    ],
  },
  {
    username: 'emilia.kowalski',
    email: 'emilia.kowalski@gmail.com',
    password: 'Test12345!',
    artworks: [
      {
        id: '117697812',
        pageCount: 6,
        title: '假面喵與利歐路們',
        tags: ['pokemon', 'riolu', 'meowscarada', 'fanart'],
      },
    ],
  },
  {
    username: 'hugo.fernandez',
    email: 'hugo.fernandez@gmail.com',
    password: 'Test12345!',
    artworks: [
      {
        id: '118324107',
        pageCount: 6,
        title: '身内ネタてんこ盛り',
        tags: ['splatoon', 'inkling', 'fanart'],
      },
    ],
  },
];

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/**
 * Build file paths for a given artwork ID and page count.
 * Returns an array of absolute paths to image files.
 * Throws if any file is missing (Fail Fast).
 */
function resolveArtworkFiles(artworkId, pageCount) {
  const files = [];
  for (let i = 0; i < pageCount; i++) {
    const fp = path.join(CRAWLED_DIR, `pixiv_${artworkId}_p${i}.jpg`);
    if (!fs.existsSync(fp)) {
      throw new Error(`Missing image file for artwork ${artworkId}: ${fp}`);
    }
    files.push(fp);
  }
  return files;
}

/**
 * Login via the backend API.
 * Returns the parsed user object with { _id, username, email, role, token }.
 * Throws on non-200 response (Fail Fast).
 */
async function loginViaApi(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Login failed (HTTP ${response.status}) for ${email}: ${body}`
    );
  }

  const user = await response.json();

  // Guard: verify we got the expected fields (Parse, Don't Validate)
  if (!user._id || !user.token) {
    throw new Error(
      `Login response missing _id or token for ${email}: ${JSON.stringify(user)}`
    );
  }

  return user;
}

/**
 * Submit one artwork for a logged-in account using the browser page.
 * Returns the created artwork URL on success.
 */
async function uploadArtwork(page, user, artwork, result) {
  const screenshotBase = path.join(
    SCREENSHOT_DIR,
    `${user.username}-${artwork.id}`
  );

  console.log(`\n  ── Uploading artwork ${artwork.id}: "${artwork.title}" ──`);

  // Resolve and verify files
  let filePaths;
  try {
    filePaths = resolveArtworkFiles(artwork.id, artwork.pageCount);
    console.log(`  ✓ Found ${filePaths.length} image file(s)`);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    result.errors.push({ account: user.username, artwork: artwork.id, error: err.message });
    return null;
  }

  try {
    // Navigate to upload page
    console.log('  Navigating to /upload/illust ...');
    await page.goto(`${FRONTEND_URL}/upload/illust`, {
      waitUntil: 'networkidle',
    });

    // Wait for the file input
    await page.waitForSelector('#upload-media', {
      state: 'visible',
      timeout: 15000,
    });
    console.log('  ✓ Upload page loaded');

    // Upload files
    console.log('  Uploading files ...');
    await page.locator('#upload-media').setInputFiles(filePaths);

    // Wait for previews
    try {
      await page.waitForSelector('.upload-preview', {
        state: 'visible',
        timeout: 10000,
      });
      console.log('  ✓ Previews rendered');
    } catch {
      console.log('  ⚠ Preview section did not appear (continuing)');
    }
    await page.waitForTimeout(1500);

    // Fill title
    console.log(`  Setting title...`);
    await page.locator('#upload-title').fill(artwork.title);
    console.log(`  ✓ Title set: "${artwork.title}"`);

    // Fill caption
    console.log('  Setting caption...');
    await page.locator('#upload-caption').fill(
      'A multi-page illustration from Pixiv.'
    );
    console.log('  ✓ Caption set');

    // Add tags
    console.log('  Adding tags...');
    for (const tag of artwork.tags) {
      await page.locator('#upload-tags').fill(tag);
      await page.locator('#upload-tags').press('Enter');
      await page.waitForTimeout(400);
      console.log(`    ✓ Tag: ${tag}`);
    }
    console.log('  ✓ All tags added');

    // Click Post button
    console.log('  Clicking Post...');
    await page.locator('button[type="submit"]').click();
    console.log('  ✓ Post submitted, waiting for result...');

    // Wait for redirect to /artworks/:id (poll up to 30s)
    let currentUrl = page.url();
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      currentUrl = page.url();
      if (currentUrl.includes('/artworks/')) {
        break;
      }
      // Check for error alert
      const hasError = await page.locator('.alert-danger').count();
      if (hasError > 0 && i > 5) {
        // Allow a few cycles for the page to submit first
        break;
      }
    }

    // Parse result
    const artworkMatch = currentUrl.match(/\/artworks\/([a-f0-9]+)/);
    if (artworkMatch) {
      const artworkUrl = currentUrl;
      console.log(`  ✓ SUCCESS: Artwork created → ${artworkUrl}`);
      result.successes.push({
        account: user.username,
        artwork: artwork.id,
        title: artwork.title,
        url: artworkUrl,
      });
      await page.screenshot({
        path: `${screenshotBase}-success.png`,
        fullPage: false,
      });
      return artworkUrl;
    }

    // Check for errors if still on upload page
    if (currentUrl.includes('/upload/')) {
      const errorEls = page.locator('.alert-danger');
      const errorCount = await errorEls.count();
      let errorText = '';
      for (let i = 0; i < errorCount; i++) {
        const text = await errorEls.nth(i).textContent();
        errorText += `[${i}]: ${text.trim()} `;
      }
      console.error(`  ✗ Upload error: ${errorText || 'Unknown error'}`);
      result.errors.push({
        account: user.username,
        artwork: artwork.id,
        error: errorText || 'Upload failed without specific error message',
      });
    } else {
      console.error(`  ⚠ Navigated to unexpected URL: ${currentUrl}`);
      result.errors.push({
        account: user.username,
        artwork: artwork.id,
        error: `Unexpected navigation to: ${currentUrl}`,
      });
    }

    await page.screenshot({
      path: `${screenshotBase}-error.png`,
      fullPage: false,
    });
    return null;
  } catch (err) {
    console.error(`  ✗ Exception during upload: ${err.message}`);
    result.errors.push({
      account: user.username,
      artwork: artwork.id,
      error: err.message,
    });
    // Take error screenshot
    try {
      await page.screenshot({
        path: `${screenshotBase}-exception.png`,
        fullPage: false,
      });
    } catch {
      // ignore screenshot errors
    }
    return null;
  }
}

// ────────────────────────────────────────
// Main
// ────────────────────────────────────────

async function main() {
  console.log('═'.repeat(68));
  console.log('  IlluWrl Batch Artwork Uploader');
  console.log('═'.repeat(68));
  console.log(`  API base:      ${API_BASE}`);
  console.log(`  Frontend:      ${FRONTEND_URL}`);
  console.log(`  Images dir:    ${CRAWLED_DIR}`);
  console.log(`  Accounts:      ${accounts.length}`);
  const totalArtworks = accounts.reduce((sum, a) => sum + a.artworks.length, 0);
  console.log(`  Artworks:      ${totalArtworks}`);
  console.log('');

  // ── Launch browser ──
  console.log('Launching Chromium (headed mode)...');
  const browser = await chromium.launch({ headless: false });

  // Use a single browser context — we clear state between accounts via localStorage
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });

  const result = {
    successes: [],
    errors: [],
  };

  try {
    for (const account of accounts) {
      console.log(
        `\n${'─'.repeat(58)}`
      );
      console.log(
        `  Account: ${account.username} (${account.email}) — ${account.artworks.length} artwork(s)`
      );
      console.log(`${'─'.repeat(58)}`);

      // ── Step A: Login via API ──
      console.log(`\n  Logging in via API...`);
      let user;
      try {
        user = await loginViaApi(account.email, account.password);
        console.log(
          `  ✓ Logged in as "${user.username}" (ID: ${user._id}, role: ${user.role})`
        );
      } catch (err) {
        console.error(`  ✗ ${err.message}`);
        console.error('  Skipping remaining artworks for this account.\n');
        // Record errors for all artworks of this account
        for (const artwork of account.artworks) {
          result.errors.push({
            account: account.username,
            artwork: artwork.id,
            error: `Login failed: ${err.message}`,
          });
        }
        continue;
      }

      // ── Step B: Open a page and set auth state ──
      const page = await context.newPage();

      try {
        // Navigate to frontend to establish origin
        await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

        // Set localStorage auth
        await page.evaluate(
          ({ token, authUser }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('authUser', JSON.stringify(authUser));
          },
          {
            token: user.token,
            authUser: {
              _id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              avatar: '',
              displayName: '',
              location: '',
            },
          }
        );
        console.log('  ✓ Auth credentials set in localStorage');

        // Small wait for localStorage to settle
        await page.waitForTimeout(500);

        // ── Step C: Upload each artwork ──
        for (const artwork of account.artworks) {
          await uploadArtwork(page, user, artwork, result);

          // Wait 5 seconds between artworks for visual confirmation
          console.log('  Waiting 5 seconds before next artwork...');
          await page.waitForTimeout(5000);
        }
      } catch (err) {
        console.error(`\n  ✗ Unexpected error for account ${account.username}: ${err.message}`);
        for (const artwork of account.artworks) {
          result.errors.push({
            account: account.username,
            artwork: artwork.id,
            error: err.message,
          });
        }
      } finally {
        // Close the account's page
        await page.close();
      }
    }
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }

  // ── Report ──
  console.log('\n' + '═'.repeat(68));
  console.log('  RESULTS');
  console.log('═'.repeat(68));

  const successCount = result.successes.length;
  const errorCount = result.errors.length;

  console.log(`\n  Successful uploads: ${successCount}`);
  console.log(`  Failed uploads:     ${errorCount}`);

  if (result.successes.length > 0) {
    console.log('\n  ── Uploaded Artworks ──');
    for (const s of result.successes) {
      console.log(`  ✓ [${s.account}] "${s.title}" → ${s.url}`);
    }
  }

  if (result.errors.length > 0) {
    console.log('\n  ── Errors ──');
    for (const e of result.errors) {
      console.log(`  ✗ [${e.account}] Artwork ${e.artwork}: ${e.error}`);
    }
  }

  console.log('\n' + '═'.repeat(68));
  console.log('  Done.');
  console.log('═'.repeat(68));
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
