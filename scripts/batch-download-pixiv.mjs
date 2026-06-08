#!/usr/bin/env node

/**
 * batch-download-pixiv.mjs
 *
 * Downloads all images from multiple Pixiv artworks at master1200 resolution.
 *
 * Usage:
 *   node scripts/batch-download-pixiv.mjs
 *
 * The config is inline below — modify the `artworks` array for your needs.
 *
 * Requirements:
 *   - Playwright installed in the project root (npm install playwright)
 *   - Chromium browser installed (npx playwright install chromium)
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ────────────────────────────────────────
// Config
// ────────────────────────────────────────

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'crawled_images'
);

const artworks = [
  { id: '115631510', title: '1870 - Gallagher', pages: 7 },
  { id: '115608675', title: '1868 - Aventurine', pages: 8 },
  { id: '115072306', title: '犬まみれポリ', pages: 2 },
  { id: '118324104', title: '波利啦啦隊', pages: 2 },
  { id: '118324106', title: '夜勤マスカーニャ5', pages: 2 },
  { id: '118322787', title: 'ニャローテ好き', pages: 2 },
  { id: '117697812', title: '假面喵與利歐路們', pages: 6 },
  { id: '118324107', title: '身内ネタてんこ盛り', pages: 6 },
];

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/**
 * Build the master1200 image URL from a Pixiv page regular URL.
 *
 * The regular URL looks like:
 *   https://i.pximg.net/c/600x600/img-master/img/.../xxx_p0_master1200.jpg
 *
 * We swap the size segment to 1200x1200.
 */
function toMaster1200Url(regularUrl) {
  // Guard: only process valid i.pximg.net URLs
  if (!regularUrl || !regularUrl.startsWith('https://i.pximg.net/')) {
    return null;
  }
  return regularUrl.replace('/c/600x600/', '/c/1200x1200/');
}

/**
 * Fetch the AJAX /ajax/illust/{id}/pages endpoint from Pixiv and return
 * the page info array.
 */
async function fetchPageInfos(page, artworkId) {
  const url = `https://www.pixiv.net/ajax/illust/${artworkId}/pages`;
  const result = await page.evaluate(async (fetchUrl) => {
    const res = await fetch(fetchUrl, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${fetchUrl}`);
    }
    const json = await res.json();
    if (json.error) {
      throw new Error(`Pixiv API error: ${json.message || 'unknown'}`);
    }
    // Return only the data we need: regular URL for each page
    return json.body.map((page, idx) => ({
      page: idx,
      regularUrl: page.urls?.regular ?? null,
      originalUrl: page.urls?.original ?? null,
    }));
  }, url);
  return result;
}

/**
 * Download a single image using the Playwright context's built-in request API,
 * with the required Referer header for Pixiv CDN.
 */
async function downloadImage(context, imageUrl, outputPath) {
  // Ensure the output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const response = await context.request.get(imageUrl, {
    headers: {
      'Referer': 'https://www.pixiv.net/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok()) {
    throw new Error(`Download failed: HTTP ${response.status()} for ${imageUrl}`);
  }

  const buffer = await response.body();
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

// ────────────────────────────────────────
// Main
// ────────────────────────────────────────

async function main() {
  console.log('═'.repeat(58));
  console.log('  Pixiv Batch Image Downloader');
  console.log('═'.repeat(58));
  console.log(`  Output directory: ${OUTPUT_DIR}`);
  console.log(`  Artworks to process: ${artworks.length}`);
  console.log('');

  // Guard: ensure output dir exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ── Launch browser ──
  console.log('Launching headless Chromium...');
  const browser = await chromium.launch({ headless: true });

  // Use a persistent context so cookies / session carry across pages
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Asia/Tokyo',
  });

  let totalDownloaded = 0;
  let totalFailed = 0;

  try {
    for (const artwork of artworks) {
      console.log(`» [${artwork.id}] ${artwork.title}`);
      console.log(`  → ${artwork.pages} page(s)`);

      const page = await context.newPage();

      try {
        // ── Step 1: Navigate to the artwork page ──
        const artworkUrl = `https://www.pixiv.net/en/artworks/${artwork.id}`;
        console.log(`  Navigating to ${artworkUrl} …`);

        await page.goto(artworkUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });

        // Wait briefly so AJAX calls settle
        await page.waitForTimeout(2000);

        // ── Step 2: Fetch page URLs from AJAX endpoint ──
        console.log('  Fetching page image URLs via AJAX …');
        let pageInfos;
        try {
          pageInfos = await fetchPageInfos(page, artwork.id);
        } catch (fetchErr) {
          console.error(`  ✗ AJAX fetch failed: ${fetchErr.message}`);
          // Try to salvage by extracting from the page itself
          pageInfos = await page.evaluate(() => {
            const imgs = document.querySelectorAll('img[src*="pximg.net"]');
            return Array.from(imgs)
              .filter(img => img.src.includes('/img-master/'))
              .map((img, idx) => ({
                page: idx,
                regularUrl: img.src,
                originalUrl: null,
              }));
          }).catch(() => []);
        }

        if (!pageInfos || pageInfos.length === 0) {
          console.error('  ✗ No image URLs found — skipping artwork');
          totalFailed++;
          await page.close();
          continue;
        }

        console.log(`  Found ${pageInfos.length} image(s)`);

        // ── Step 3: Download each page ──
        let artworkSuccessCount = 0;
        let artworkFailCount = 0;

        for (let i = 0; i < pageInfos.length; i++) {
          const regularUrl = pageInfos[i].regularUrl;
          const master1200Url = toMaster1200Url(regularUrl);

          if (!master1200Url) {
            console.error(`  ✗ Page ${i}: Invalid image URL`);
            artworkFailCount++;
            continue;
          }

          const outputPath = path.join(
            OUTPUT_DIR,
            `pixiv_${artwork.id}_p${i}.jpg`
          );

          // Skip if already downloaded
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`  · Page ${i}: already exists (${(stats.size / 1024).toFixed(1)} KB)`);
            artworkSuccessCount++;
            continue;
          }

          try {
            // Retry logic for transient failures
            let lastError = null;
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                const bytes = await downloadImage(context, master1200Url, outputPath);
                console.log(
                  `  ✓ Page ${i}: ${(bytes / 1024).toFixed(1)} KB saved`
                );
                artworkSuccessCount++;
                lastError = null;
                break;
              } catch (dlErr) {
                lastError = dlErr;
                if (attempt < 2) {
                  console.log(`  ⚡ Page ${i}: attempt ${attempt + 1} failed, retrying …`);
                  await page.waitForTimeout(1000 * (attempt + 1));
                }
              }
            }
            if (lastError) {
              throw lastError;
            }
          } catch (dlErr) {
            console.error(`  ✗ Page ${i}: ${dlErr.message}`);
            artworkFailCount++;
          }

          // Throttle between images to avoid rate-limiting
          await page.waitForTimeout(500);
        }

        console.log(
          `  ── Result: ${artworkSuccessCount} OK, ${artworkFailCount} failed ──`
        );
        totalDownloaded += artworkSuccessCount;
        totalFailed += artworkFailCount;
      } catch (artworkErr) {
        console.error(`  ✗ Artwork error: ${artworkErr.message}`);
        totalFailed++;
      } finally {
        await page.close();
      }

      console.log(''); // blank line between artworks
    }
  } finally {
    await browser.close();
  }

  // ── Summary ──
  console.log('═'.repeat(58));
  console.log('  DONE!');
  console.log(`  Total images downloaded: ${totalDownloaded}`);
  console.log(`  Total failures:          ${totalFailed}`);
  console.log(`  Output directory:        ${OUTPUT_DIR}`);
  console.log('═'.repeat(58));
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
