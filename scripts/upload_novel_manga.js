/**
 * upload_novel_manga.js
 *
 * Uploads novels and manga to 26 test accounts using the IlluWrl API.
 * Each account receives 1 novel + 1 manga (= 2 uploads), cycling through
 * 5 original short stories and 5 single-page manga.
 *
 * Usage: cd backend && node ../scripts/upload_novel_manga.js
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

// ---------------------------------------------------------------------------
// Account list (26 remaining after the initial 4 illustration uploads)
// ---------------------------------------------------------------------------
const REMAINING_ACCOUNTS = [
  { username: 'mateo.hernandez', email: 'mateo.hernandez@gmail.com' },
  { username: 'priya.sharma', email: 'priya.sharma@gmail.com' },
  { username: 'yuki.sato', email: 'yuki.sato@gmail.com' },
  { username: 'amina.elami', email: 'amina.elami@gmail.com' },
  { username: 'luca.romano', email: 'luca.romano@gmail.com' },
  { username: 'noura.haddad', email: 'noura.haddad@gmail.com' },
  { username: 'sofia.novak', email: 'sofia.novak@gmail.com' },
  { username: 'raj.patel', email: 'raj.patel@gmail.com' },
  { username: 'emilia.kowalski', email: 'emilia.kowalski@gmail.com' },
  { username: 'kai.kurosawa', email: 'kai.kurosawa@gmail.com' },
  { username: 'diego.fuentes', email: 'diego.fuentes@gmail.com' },
  { username: 'hana.ali', email: 'hana.ali@gmail.com' },
  { username: 'thiago.costa', email: 'thiago.costa@gmail.com' },
  { username: 'leila.benali', email: 'leila.benali@gmail.com' },
  { username: 'noah.schmidt', email: 'noah.schmidt@gmail.com' },
  { username: 'mei.lin', email: 'mei.lin@gmail.com' },
  { username: 'omar.ibrahim', email: 'omar.ibrahim@gmail.com' },
  { username: 'anya.petrov', email: 'anya.petrov@gmail.com' },
  { username: 'lucas.martin', email: 'lucas.martin@gmail.com' },
  { username: 'fatima.zahra', email: 'fatima.zahra@gmail.com' },
  { username: 'hugo.fernandez', email: 'hugo.fernandez@gmail.com' },
  { username: 'ananya.iyer', email: 'ananya.iyer@gmail.com' },
  { username: 'mina.nakamura', email: 'mina.nakamura@gmail.com' },
  { username: 'daniel.owusu', email: 'daniel.owusu@gmail.com' },
  { username: 'sofia.andersen', email: 'sofia.andersen@gmail.com' },
  { username: 'igor.volkov', email: 'igor.volkov@gmail.com' },
];

// ---------------------------------------------------------------------------
// Content data
// ---------------------------------------------------------------------------

const NOVELS = [
  {
    title: 'The Last Sketch',
    file: 'furina_145287702.png',
    description:
      'In the quiet hours of the evening, an artist sat by the window, ' +
      'watching the last rays of sunlight dance across the canvas. The sketch ' +
      'was almost complete — a portrait of someone long forgotten, yet deeply ' +
      'cherished. Each stroke of the pencil carried memories that words could ' +
      'never capture. The room grew dim, but the artist continued, guided not ' +
      'by light but by the heart. When the final line was drawn, a single tear ' +
      'fell upon the paper, merging with the art, becoming part of the story. ' +
      'Some masterpieces are never meant to be seen — only felt.',
    tags: 'original,short-story,art,sketch,drama',
  },
  {
    title: 'A Hat Full of Dreams',
    file: '包子口味貝雷帽_145125142.png',
    description:
      'Momo always wore the same beret — a soft, cream-colored one that her ' +
      'grandmother had knitted years ago. To others, it was just a hat. But to ' +
      'Momo, it was a vessel of dreams. Every night, she would place it under ' +
      'her pillow, and in her sleep, she would visit worlds made of clouds and ' +
      'candy. One morning, she woke up to find a tiny star tucked inside the ' +
      'beret. From that day on, she knew: magic does not live in fairy tales. ' +
      'It lives in the things we love.',
    tags: 'original,short-story,dreams,magic,wholesome',
  },
  {
    title: 'Beyond the Mask',
    file: 'I_Am_Batman_145120740.png',
    description:
      'The city never sleeps, and neither does he. But behind the mask, ' +
      'behind the legend, there is a person who still remembers what it feels ' +
      'like to laugh. Every night, he stands on the rooftop, looking at the ' +
      'lights of the city he swore to protect. The fight never ends — crime ' +
      'evolves, shadows grow deeper. Yet he remains, because someone has to. ' +
      'Not for glory, not for recognition, but because every city deserves a ' +
      'guardian. And every guardian needs something to believe in.',
    tags: 'original,short-story,hero,action,drama',
  },
  {
    title: 'Rudco: Origins',
    file: 'Rudco_144497473.png',
    description:
      'In a world where colors had faded to gray, a small creature named ' +
      'Rudco discovered a single vibrant seed. It glowed with an intensity ' +
      'that defied the monochrome landscape. Rudco carried the seed across ' +
      'mountains and rivers, protecting it from the shadows that sought to ' +
      'consume its light. When finally planted in the heart of the desolate ' +
      'land, the seed sprouted into a tree of pure radiance, restoring color ' +
      'to the world. Rudco learned that even the smallest being can carry the ' +
      'brightest light.',
    tags: 'original,short-story,fantasy,adventure,Rudco',
  },
  {
    title: 'First Lines',
    file: '第一次画画_144012071.png',
    description:
      'The blank page stared back at her, intimidating and vast. She had ' +
      'never drawn before — not seriously, not like this. But something inside ' +
      'her urged her to try. Her hand trembled as the pencil touched the ' +
      'paper, leaving a shaky line. Then another. And another. The lines ' +
      'became shapes, the shapes became forms, and the forms became a world. ' +
      'It was not perfect. It was messy and raw and real. And it was hers. ' +
      'Sometimes the hardest step is the first one, but it is also the most ' +
      'beautiful.',
    tags: 'original,short-story,art,beginner,inspiration',
  },
];

const MANGAS = [
  {
    title: 'Furina — Oneshot',
    file: 'furina_145287702.png',
    description:
      'A short comic featuring Furina from Genshin Impact in a whimsical ' +
      'adventure through Fontaine.',
    tags: 'fanart,manga,GenshinImpact,Furina,comic',
  },
  {
    title: 'Beret Tales Ch.1',
    file: '包子口味貝雷帽_145125142.png',
    description:
      'A slice-of-life manga about a girl and her magical beret that leads ' +
      'to extraordinary adventures.',
    tags: 'original,manga,slice-of-life,magic,comic',
  },
  {
    title: 'Gotham Shadows',
    file: 'I_Am_Batman_145120740.png',
    description:
      'A dark and gritty Batman manga oneshot exploring a night in Gotham ' +
      'City.',
    tags: 'fanart,manga,Batman,action,comic',
  },
  {
    title: 'Rudco Adventures #1',
    file: 'Rudco_144497473.png',
    description:
      'The debut chapter of Rudco, a tiny hero on a big journey through a ' +
      'vibrant fantasy world.',
    tags: 'original,manga,fantasy,Rudco,comic',
  },
  {
    title: 'First Step',
    file: '第一次画画_144012071.png',
    description:
      'A heartwarming manga about a young artist discovering her passion ' +
      'for drawing.',
    tags: 'original,manga,art,slice-of-life,comic',
  },
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
 * Build the full path to a file in the pixiv_downloads directory.
 * @param {string} fileName
 * @returns {string}
 */
function pixivFilePath(fileName) {
  return path.join(PIXIV_DIR, fileName);
}

/**
 * Verify every referenced image file exists on disk.
 * @param {string[]} fileNames
 * @returns {{ ok: boolean, missing: string[] }}
 */
function validateImageFiles(fileNames) {
  const unique = [...new Set(fileNames)];
  const missing = [];

  for (const name of unique) {
    if (!fs.existsSync(pixivFilePath(name))) {
      missing.push(name);
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
 * Upload a single artwork (novel or manga) to the API.
 * @param {string} token   JWT bearer token
 * @param {string} type    'novel' | 'manga'
 * @param {object} metadata  { title, file, description, tags }
 * @returns {Promise<object>}  Upload response data
 */
async function uploadArtwork(token, type, metadata) {
  const url = `${API_BASE}/artworks`;
  const filePath = pixivFilePath(metadata.file);

  const form = new FormData();

  // Attach image file using the field name 'images' (multer .array('images', 10))
  form.append('images', fs.createReadStream(filePath), {
    filename: metadata.file,
    contentType: 'image/png',
  });

  // Metadata fields
  form.append('title', metadata.title);
  form.append('description', metadata.description);
  form.append('type', type);
  form.append('tags', metadata.tags);
  form.append('ageRating', 'all');

  const response = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    },
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
  console.log(' Novel & Manga Uploader');
  console.log('='.repeat(60));
  console.log();

  // ---- Collect all referenced file names ----------------------------------
  const novelFiles = NOVELS.map((n) => n.file);
  const mangaFiles = MANGAS.map((m) => m.file);
  const allFiles = [...novelFiles, ...mangaFiles];

  // ---- Validate input files -----------------------------------------------
  const validation = validateImageFiles(allFiles);

  if (!validation.ok) {
    console.error('ERROR: The following image files are missing on disk:\n');
    for (const line of validation.missing) {
      console.error(`  • ${line}`);
    }
    console.error('\nUpload aborted.');
    process.exitCode = 1;
    return;
  }

  console.log(
    `\u2713 All ${allFiles.length} image files found on disk (5 unique).`
  );
  console.log(
    `\u2713 ${REMAINING_ACCOUNTS.length} accounts, each receiving 1 novel + 1 manga.`
  );
  console.log(`  Total uploads: ${REMAINING_ACCOUNTS.length * 2}`);
  console.log();

  // ---- Track results ------------------------------------------------------
  const results = {
    total: REMAINING_ACCOUNTS.length * 2,
    succeeded: 0,
    failed: 0,
    details: [],
  };

  // ---- Upload loop --------------------------------------------------------
  for (let ai = 0; ai < REMAINING_ACCOUNTS.length; ai++) {
    const account = REMAINING_ACCOUNTS[ai];
    const accountLabel = `[${ai + 1}/${REMAINING_ACCOUNTS.length}] ${account.username}`;

    // Cycle through the 5 works so they are spread evenly
    const novelIdx = ai % NOVELS.length;
    const mangaIdx = ai % MANGAS.length;

    const novel = NOVELS[novelIdx];
    const manga = MANGAS[mangaIdx];

    const uploads = [
      { type: 'novel', label: `Novel: "${novel.title}"`, metadata: novel },
      { type: 'manga', label: `Manga: "${manga.title}"`, metadata: manga },
    ];

    console.log(`\n${'-'.repeat(50)}`);
    console.log(` ${accountLabel}  (${account.email})`);
    console.log(`${'-'.repeat(50)}`);

    // ---------- Login -------------------------------------------------------
    let token;
    try {
      token = await login(account.email, PASSWORD);
      console.log('  \u2713 Login successful');
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      console.error(`  \u2717 Login FAILED: ${message}`);

      for (const up of uploads) {
        results.failed++;
        results.details.push({
          account: account.username,
          type: up.type,
          title: up.metadata.title,
          status: 'login_failed',
          error: message,
        });
      }
      continue;
    }

    // ---------- Upload novel + manga ---------------------------------------
    for (const up of uploads) {
      const artLabel = `${up.label}  (${up.metadata.file})`;

      let lastError = null;
      let uploaded = false;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`    \u21BB Retry ${attempt}/${MAX_RETRIES}...`);
          await sleep(DELAY_MS);
        }

        try {
          const data = await uploadArtwork(
            token,
            up.type,
            up.metadata
          );
          results.succeeded++;
          results.details.push({
            account: account.username,
            type: up.type,
            title: up.metadata.title,
            status: 'success',
            artworkApiId:
              data.artwork?._id || data._id || 'unknown',
          });
          console.log(
            `  \u2713 ${artLabel} \u2014 Uploaded (id: ${
              results.details[results.details.length - 1].artworkApiId
            })`
          );
          uploaded = true;
          break;
        } catch (err) {
          lastError =
            err.response?.data?.message || err.message;
        }
      }

      if (!uploaded) {
        results.failed++;
        results.details.push({
          account: account.username,
          type: up.type,
          title: up.metadata.title,
          status: 'upload_failed',
          error: lastError,
        });
        console.error(`  \u2717 ${artLabel} \u2014 FAILED: ${lastError}`);
      }

      // Brief delay between uploads
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
    console.log('\u2713 All uploads completed successfully.');
  } else {
    console.log('Failed uploads:');
    for (const d of results.details) {
      if (d.status !== 'success') {
        console.log(
          `  \u2022 ${d.account} / "${d.title}" (${d.type}) [${d.status}]: ${d.error}`
        );
      }
    }
    process.exitCode = 1;
  }

  console.log();
}

main();
