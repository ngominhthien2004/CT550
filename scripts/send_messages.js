/**
 * send_messages.js
 *
 * Injects realistic art/drawing and daily life conversations between
 * human-style accounts. Each message is sent sequentially with a
 * human-like delay between sends.
 *
 * Usage:  cd backend && node ../scripts/send_messages.js
 */

const { createRequire } = require('module');
const path = require('path');

// ---------------------------------------------------------------------------
// 1.  Resolve dependencies from the backend's node_modules so we don't need
//     a separate npm install in /scripts.
// ---------------------------------------------------------------------------
const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const requireFromBackend = createRequire(BACKEND_NM);

const axios = requireFromBackend('axios');
const FormData = requireFromBackend('form-data');

// ---------------------------------------------------------------------------
// 2.  Configuration
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:5000';
const PASSWORD = 'Test12345!';

// ---------------------------------------------------------------------------
// 3.  Accounts (all password: Test12345!)
// ---------------------------------------------------------------------------
const ACCOUNTS = [
  { username: 'johnny.brooks', email: 'johnny.brooks@gmail.com' },
  { username: 'xiangxia.chen', email: 'xiangxia.chen@gmail.com' },
  { username: 'goku.tanaka', email: 'goku.tanaka@gmail.com' },
  { username: 'mariana.silva', email: 'mariana.silva@gmail.com' },
  { username: 'mateo.hernandez', email: 'mateo.hernandez@gmail.com' },
  { username: 'priya.sharma', email: 'priya.sharma@gmail.com' },
  { username: 'yuki.sato', email: 'yuki.sato@gmail.com' },
  { username: 'amina.elami', email: 'amina.elami@gmail.com' },
];

// ---------------------------------------------------------------------------
// 4.  Conversation pairs
// ---------------------------------------------------------------------------
const CONVERSATIONS = [
  // -- Pair 1:  johnny.brooks ↔ xiangxia.chen  (Art discussion) --
  { from: 'johnny.brooks', to: 'xiangxia.chen', content: 'Hey! I just saw your new illustration, the color palette is amazing. How do you pick your colors?' },
  { from: 'xiangxia.chen', to: 'johnny.brooks', content: 'Thanks! I usually start with a base color from a reference photo, then use Adobe Color to find complementary shades. What software do you use?' },
  { from: 'johnny.brooks', to: 'xiangxia.chen', content: 'I mostly use Clip Studio Paint. Been trying to get better at digital watercolor effects lately.' },
  { from: 'xiangxia.chen', to: 'johnny.brooks', content: 'Oh nice! Clip Studio has great brush engines. Have you tried the watercolor brushes by "Frenden"? They feel really natural.' },

  // -- Pair 2:  goku.tanaka ↔ mariana.silva  (Daily life + art) --
  { from: 'goku.tanaka', to: 'mariana.silva', content: 'Long day at work today. Finally got home and managed to sketch for 30 minutes. Felt great to unwind with some drawing.' },
  { from: 'mariana.silva', to: 'goku.tanaka', content: 'I know the feeling! Drawing after work is my therapy too. What did you sketch?' },
  { from: 'goku.tanaka', to: 'mariana.silva', content: 'Just some quick figure sketches from reference. Trying to improve my anatomy. My hands still look like bananas sometimes lol' },
  { from: 'mariana.silva', to: 'goku.tanaka', content: 'Haha hands are the worst! Pro tip: try drawing them as simple geometric shapes first before adding details. It helped me a lot.' },

  // -- Pair 3:  mateo.hernandez ↔ priya.sharma  (Art tips) --
  { from: 'mateo.hernandez', to: 'priya.sharma', content: 'Hey, I saw your manga oneshot! The panel flow is really smooth. Any tips for a beginner trying to make manga?' },
  { from: 'priya.sharma', to: 'mateo.hernandez', content: 'Thanks! My biggest tip is to plan your page layout before drawing. Use rough thumbnails first to figure out the flow. Also, leave breathing room between panels!' },
  { from: 'mateo.hernandez', to: 'priya.sharma', content: 'Thanks! I usually just jump straight into drawing. I\'ll try thumbnails next time. Do you use any specific template for page layouts?' },

  // -- Pair 4:  yuki.sato ↔ amina.elami  (Daily life) --
  { from: 'yuki.sato', to: 'amina.elami', content: 'Morning! Just had the best coffee and now ready to paint. What are you working on today?' },
  { from: 'amina.elami', to: 'yuki.sato', content: 'Good morning! I\'m working on a commission piece — a fantasy landscape with a castle. The client wants lots of detail in the background.' },
  { from: 'yuki.sato', to: 'amina.elami', content: 'Sounds epic! Fantasy landscapes are my favorite to paint. Are you adding any magical elements like floating islands or glowing effects?' },
  { from: 'amina.elami', to: 'yuki.sato', content: 'Yes! There\'s going to be a glowing crystal at the center of the castle. I\'m experimenting with layer blend modes to get that ethereal glow.' },

  // -- Pair 5:  johnny.brooks ↔ goku.tanaka  (Art community) --
  { from: 'johnny.brooks', to: 'goku.tanaka', content: 'Are you going to the virtual art meetup this weekend? I heard they\'re doing a live figure drawing session.' },
  { from: 'goku.tanaka', to: 'johnny.brooks', content: 'I didn\'t know about that! Sounds fun. What time is it? I\'d love to join and practice some quick sketches.' },
  { from: 'johnny.brooks', to: 'goku.tanaka', content: 'It\'s at 3 PM Saturday on Discord. I\'ll send you the invite link. Should be a good chance to get feedback too!' },

  // -- Pair 6:  xiangxia.chen ↔ mariana.silva  (Equipment chat) --
  { from: 'xiangxia.chen', to: 'mariana.silva', content: 'Thinking of upgrading my drawing tablet. Are you using screen or screenless? I can\'t decide which is better.' },
  { from: 'mariana.silva', to: 'xiangxia.chen', content: 'I use a screen tablet (Huion Kamvas). It took some getting used to but now I can\'t go back. The direct eye-hand coordination feels much more natural.' },
  { from: 'xiangxia.chen', to: 'mariana.silva', content: 'Good to know! I\'ve been eyeing the XP-Pen Artist Pro. Might treat myself for my birthday next month.' },

  // -- Pair 7:  mateo.hernandez ↔ amina.elami  (Creative block) --
  { from: 'mateo.hernandez', to: 'amina.elami', content: 'Hitting a creative block hard this week. Nothing I draw looks right. How do you deal with art block?' },
  { from: 'amina.elami', to: 'mateo.hernandez', content: 'I feel you! What helps me is switching mediums — if I\'m stuck digitally, I grab a pen and paper and just doodle nonsense. No pressure, just play.' },
  { from: 'mateo.hernandez', to: 'amina.elami', content: 'That\'s actually a great idea. Sometimes I forget art is supposed to be fun. I\'ll try just doodling tonight, thanks!' },

  // -- Pair 8:  priya.sharma ↔ yuki.sato  (Inspiration) --
  { from: 'priya.sharma', to: 'yuki.sato', content: 'Your novel "The Last Sketch" really moved me! The part about the artist drawing from memory was beautifully written.' },
  { from: 'yuki.sato', to: 'priya.sharma', content: 'Thank you so much! That story is actually loosely based on my own experience. I used to draw portraits of my grandmother from memory after she passed.' },
  { from: 'priya.sharma', to: 'yuki.sato', content: 'That\'s so touching. Art really is a way to keep memories alive. You\'ve inspired me to write something more personal in my next novel.' },
];

// ---------------------------------------------------------------------------
// 5.  Helpers
// ---------------------------------------------------------------------------

/**
 * Creates an axios client pre-configured for a given base URL.
 */
function createClient() {
  return axios.create({ baseURL: API_BASE });
}

/**
 * Logs in a user and returns their profile + auth token.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} email
 * @returns {Promise<{ _id: string, username: string, token: string }>}
 */
async function login(client, email) {
  const { data } = await client.post('/api/auth/login', {
    email,
    password: PASSWORD,
  });
  return data; // { _id, username, email, role, token }
}

/**
 * Resolves a username to its user _id.
 * Uses a shared cache to avoid redundant API calls.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {Map<string, string>} cache   username → _id
 * @param {string} username
 * @returns {Promise<string>}
 */
async function resolveUserId(client, cache, username) {
  // Guard: return cached value immediately if present
  const cached = cache.get(username);
  if (cached !== undefined) {
    return cached;
  }

  // Parse boundary: search the API
  const { data } = await client.get('/api/users/search', {
    params: { q: username },
  });

  // Fail fast: ensure we found the user
  const user = data.users.find((u) => u.username === username);
  if (!user) {
    throw new Error(`User "${username}" not found via search API`);
  }

  cache.set(username, user._id);
  return user._id;
}

/**
 * Sends a single message from sender → recipient.
 *
 * @param {import('axios').AxiosInstance} client
 * @param {string} senderToken
 * @param {string} recipientId
 * @param {string} content
 * @returns {Promise<void>}
 */
async function sendMessage(client, senderToken, recipientId, content) {
  const form = new FormData();
  form.append('recipientId', recipientId);
  form.append('content', content);

  const res = await client.post('/api/messages', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${senderToken}`,
    },
  });

  // Fail fast: 201 is the only expected success status
  if (res.status !== 201) {
    throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
  }
}

/**
 * Pauses execution for a random duration between min–max milliseconds.
 *
 * @param {number} min
 * @param {number} max
 * @returns {Promise<void>}
 */
function sleep(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// 6.  Main orchestrator
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== send_messages.js – Art Chat Seeder ===\n');

  // -- Phase A: Login every account and build the user-id cache --
  console.log('--- Phase A: Logging in all accounts ---');
  const client = createClient();
  /** @type {Map<string, { _id: string, token: string }>} */
  const sessionCache = new Map();

  for (const account of ACCOUNTS) {
    try {
      const profile = await login(client, account.email);
      sessionCache.set(account.username, {
        _id: profile._id,
        token: profile.token,
      });
      console.log(`  ✓ ${account.username.padEnd(18)} → _id: ${profile._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error(`  ✗ ${account.username.padEnd(18)} → login FAILED: ${msg}`);
      throw err; // fail fast — no point continuing if we can't authenticate
    }
  }

  console.log(`\n--- Phase B: Sending ${CONVERSATIONS.length} messages ---`);

  // -- Phase B: Send every conversation message sequentially --
  for (let i = 0; i < CONVERSATIONS.length; i++) {
    const msg = CONVERSATIONS[i];
    const label = `[${i + 1}/${CONVERSATIONS.length}]`;

    try {
      const sender = sessionCache.get(msg.from);
      const recipientId = sessionCache.get(msg.to)?._id;

      // Guard: ensure we have session data for both sender and recipient
      if (!sender) {
        throw new Error(`Sender "${msg.from}" not logged in — skipping`);
      }
      if (!recipientId) {
        throw new Error(`Recipient "${msg.to}" not resolved — skipping`);
      }

      await sendMessage(client, sender.token, recipientId, msg.content);
      console.log(`  ${label} ${msg.from.padEnd(18)} → ${msg.to.padEnd(18)}  "${truncate(msg.content, 60)}"`);
    } catch (err) {
      const detail = err.response?.data?.message || err.message;
      console.error(`  ${label} ${msg.from.padEnd(18)} → ${msg.to.padEnd(18)}  FAILED: ${detail}`);
      // Continue with the next message — a single failure shouldn't halt the
      // whole seed.
    }

    // Human-like pacing: 1–2 seconds between messages
    if (i < CONVERSATIONS.length - 1) {
      await sleep(1000, 2000);
    }
  }

  console.log('\n=== All done! ===');
}

// ---------------------------------------------------------------------------
// 7.  Utilities
// ---------------------------------------------------------------------------

/**
 * Truncates a string to `maxLen` characters, appending "…" if it was cut.
 *
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ---------------------------------------------------------------------------
// 8.  Run
// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exitCode = 1;
});
