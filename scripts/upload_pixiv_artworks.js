/**
 * upload_pixiv_artworks.js
 *
 * Uploads downloaded Pixiv artwork images to the IlluWrl API
 * across multiple test accounts.
 *
 * Usage: cd backend && node ../scripts/upload_pixiv_artworks.js
 *
 * NOTE: Since this script lives outside backend/, we use createRequire
 * to resolve npm modules (axios, form-data) from the backend's node_modules
 * (the cwd when this script is run).
 */

// ---------------------------------------------------------------------------
// Module imports
// ---------------------------------------------------------------------------
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

// Resolve modules from the backend directory (cwd) where axios and form-data
// are installed as dependencies.
const backendRequire = createRequire(path.join(process.cwd(), 'package.json'));

const axios = backendRequire('axios');
const FormData = backendRequire('form-data');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:5000/api';
const PASSWORD = 'Test12345!';
const PIXIV_DIR = path.resolve(__dirname, '..', 'pixiv_downloads');
const MAX_RETRIES = 1;
const DELAY_MS = 1500;

const ACCOUNTS = [
  { username: 'johnny.brooks', email: 'johnny.brooks@gmail.com' },
  { username: 'xiangxia.chen', email: 'xiangxia.chen@gmail.com' },
  { username: 'goku.tanaka', email: 'goku.tanaka@gmail.com' },
  { username: 'mariana.silva', email: 'mariana.silva@gmail.com' },
];

const ALL_ARTWORKS = [
  { id: '145287702', title: 'Furina', file: 'furina_145287702.png', tags: ['anime', 'art', 'fanart', 'Furina', 'GenshinImpact', 'Genshin'], desc: 'Fanart of Furina from Genshin Impact by Richard // Rio' },
  { id: '145125142', title: '包子口味貝雷帽', file: '包子口味貝雷帽_145125142.png', tags: ['oc', 'new', 'illustration'], desc: 'Original character artwork by 驚蟄' },
  { id: '145120740', title: 'I Am Batman', file: 'I_Am_Batman_145120740.png', tags: ['analog', 'Noob', 'Paper', 'Batman'], desc: 'Batman fanart by Asha_Arts' },
  { id: '144497473', title: 'Rudco', file: 'Rudco_144497473.png', tags: ['new', 'artwork', 'Rudco'], desc: 'Artwork by Rudco pins' },
  { id: '144012071', title: '第一次画画', file: '第一次画画_144012071.png', tags: ['new', 'aria', 'art'], desc: 'First drawing by 盒艾' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the full path to a downloaded artwork file.
 * @param {string} fileName
 * @returns {string}
 */
function artworkFilePath(fileName) {
  return path.join(PIXIV_DIR, fileName);
}

/**
 * Verify every artwork file exists on disk before uploading.
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateArtworkFiles() {
  const missing = [];

  for (const artwork of ALL_ARTWORKS) {
    const filePath = artworkFilePath(artwork.file);
    if (!fs.existsSync(filePath)) {
      missing.push(`  • ${artwork.file} (id=${artwork.id})`);
    }
  }

  return { ok: missing.length === 0, missing };
}

/**
 * Log in to the API and return a JWT token.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>}
 */
async function login(email, password) {
  const url = `${API_BASE}/auth/login`;

  const response = await axios.post(url, { email, password });

  const { token } = response.data;

  if (!token) {
    throw new Error(`Login succeeded but no token returned for ${email}`);
  }

  return token;
}

/**
 * Upload a single artwork to the API.
 * @param {string} token  JWT bearer token
 * @param {object} artwork  Artwork metadata (from ALL_ARTWORKS)
 * @param {string} accountLabel  Display label for logging
 * @returns {Promise<object>}  Upload response data
 */
async function uploadArtwork(token, artwork, accountLabel) {
  const url = `${API_BASE}/artworks`;
  const filePath = artworkFilePath(artwork.file);

  const form = new FormData();

  // Attach file using the field name 'images' (multer .array('images', 10))
  form.append('images', fs.createReadStream(filePath), {
    filename: artwork.file,
    contentType: 'image/png',
  });

  // Metadata fields
  form.append('title', artwork.title);

  if (artwork.desc) {
    form.append('description', artwork.desc);
  }

  // Append each tag individually — multer's append-field collects duplicates
  // into an array which the controller passes straight through.
  for (const tag of artwork.tags) {
    form.append('tags', tag);
  }

  form.append('type', 'illust');
  form.append('ageRating', 'all');

  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
    // Allow axios to follow redirects / handle large payloads
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(60));
  console.log(' Pixiv Artwork Uploader');
  console.log('='.repeat(60));
  console.log();

  // ---- Validate input files -----------------------------------------------
  const validation = validateArtworkFiles();

  if (!validation.ok) {
    console.error('ERROR: The following artwork files are missing on disk:\n');
    for (const line of validation.missing) {
      console.error(line);
    }
    console.error('\nUpload aborted.');
    process.exitCode = 1;
    return;
  }

  console.log(`✓ All ${ALL_ARTWORKS.length} artwork files found on disk.`);
  console.log(`✓ ${ACCOUNTS.length} accounts will each upload ${ALL_ARTWORKS.length} artworks.`);
  console.log(`  Total uploads: ${ACCOUNTS.length * ALL_ARTWORKS.length}`);
  console.log();

  // ---- Track results ------------------------------------------------------
  const results = {
    total: ACCOUNTS.length * ALL_ARTWORKS.length,
    succeeded: 0,
    failed: 0,
    details: [],
  };

  // ---- Upload loop --------------------------------------------------------
  for (let ai = 0; ai < ACCOUNTS.length; ai++) {
    const account = ACCOUNTS[ai];
    const accountLabel = `[${ai + 1}/${ACCOUNTS.length}] ${account.username} (${account.email})`;

    console.log(`\n${'-'.repeat(50)}`);
    console.log(` ${accountLabel}`);
    console.log(`${'-'.repeat(50)}`);

    // ---------- Login -------------------------------------------------------
    let token;
    try {
      token = await login(account.email, PASSWORD);
      console.log(`  ✓ Login successful`);
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error(`  ✗ Login FAILED: ${message}`);

      for (const artwork of ALL_ARTWORKS) {
        results.failed++;
        results.details.push({
          account: account.username,
          artworkId: artwork.id,
          title: artwork.title,
          status: 'login_failed',
          error: message,
        });
      }
      continue;
    }

    // ---------- Upload each artwork -----------------------------------------
    for (let wi = 0; wi < ALL_ARTWORKS.length; wi++) {
      const artwork = ALL_ARTWORKS[wi];
      const artLabel = `[${wi + 1}/${ALL_ARTWORKS.length}] "${artwork.title}" (${artwork.file})`;

      let lastError = null;
      let uploaded = false;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`    ↻ Retry ${attempt}/${MAX_RETRIES}...`);
          await sleep(DELAY_MS);
        }

        try {
          const data = await uploadArtwork(token, artwork, accountLabel);
          results.succeeded++;
          results.details.push({
            account: account.username,
            artworkId: artwork.id,
            title: artwork.title,
            status: 'success',
            artworkApiId: data.artwork?._id || data._id || 'unknown',
          });
          console.log(`  ✓ ${artLabel} — Uploaded (id: ${results.details[results.details.length - 1].artworkApiId})`);
          uploaded = true;
          break; // success → exit retry loop
        } catch (err) {
          lastError = err.response?.data?.message || err.message;
        }
      }

      if (!uploaded) {
        results.failed++;
        results.details.push({
          account: account.username,
          artworkId: artwork.id,
          title: artwork.title,
          status: 'upload_failed',
          error: lastError,
        });
        console.error(`  ✗ ${artLabel} — FAILED: ${lastError}`);
      }

      // Brief delay between artworks to avoid overwhelming the server
      await sleep(DELAY_MS);
    }
  }

  // ---- Summary ------------------------------------------------------------
  console.log();
  console.log('='.repeat(60));
  console.log(' UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total attempts : ${results.total}`);
  console.log(`  Succeeded      : ${results.succeeded}`);
  console.log(`  Failed         : ${results.failed}`);
  console.log();

  if (results.failed === 0) {
    console.log('✓ All uploads completed successfully.');
  } else {
    console.log('Failed uploads:');
    for (const d of results.details) {
      if (d.status !== 'success') {
        console.log(`  • ${d.account} / "${d.title}" [${d.status}]: ${d.error}`);
      }
    }
    process.exitCode = 1;
  }

  console.log();
}

main();
