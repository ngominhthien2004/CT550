/**
 * post_comments_atlas.js
 *
 * Posts 37 cross-account comments on artworks using dynamic artwork ID resolution
 * from the API. Works with MongoDB Atlas (new ObjectIds).
 *
 * Usage: cd backend && node ../scripts/post_comments_atlas.js
 */

// ---------------------------------------------------------------------------
// Module imports
// ---------------------------------------------------------------------------
const { createRequire } = require('module');
const path = require('path');

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const requireFromBackend = createRequire(BACKEND_NM);
const axios = requireFromBackend('axios');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API = 'http://localhost:5000/api';
const PASSWORD = 'Test12345!';

// All 30 usernames for building the artwork map
const ALL_USERNAMES = [
  'johnny.brooks', 'xiangxia.chen', 'goku.tanaka', 'mariana.silva',
  'mateo.hernandez', 'priya.sharma', 'yuki.sato', 'amina.elami',
  'luca.romano', 'noura.haddad', 'sofia.novak', 'raj.patel',
  'emilia.kowalski', 'kai.kurosawa', 'diego.fuentes', 'hana.ali',
  'thiago.costa', 'leila.benali', 'noah.schmidt', 'mei.lin',
  'omar.ibrahim', 'anya.petrov', 'lucas.martin', 'fatima.zahra',
  'hugo.fernandez', 'ananya.iyer', 'mina.nakamura', 'daniel.owusu',
  'sofia.andersen', 'igor.volkov',
];

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------
const tokens = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(username) {
  if (tokens[username]) return tokens[username];
  const res = await axios.post(`${API}/auth/login`, {
    email: `${username}@gmail.com`,
    password: PASSWORD,
  });
  tokens[username] = res.data.token;
  return res.data.token;
}

// ---------------------------------------------------------------------------
// STEP 1: Fetch all artworks and build dynamic map
// ---------------------------------------------------------------------------

async function buildArtworkMap() {
  const res = await axios.get(`${API}/artworks?limit=200`);
  const artworks = res.data;

  const map = {}; // { username: { title: id } }
  for (const art of artworks) {
    const owner = art.user?.username;
    if (!owner) continue;
    if (!map[owner]) map[owner] = {};
    map[owner][art.title] = art._id;
    // Also add a generic key for accounts with 2 artworks (manga/novel)
    if (art.type === 'manga') map[owner]._manga = art._id;
    if (art.type === 'novel') map[owner]._novel = art._id;
  }

  return map;
}

// ---------------------------------------------------------------------------
// Comments Data (using dynamic artwork map lookup)
// ---------------------------------------------------------------------------

const COMMENTS = [
  // ====== Comments on illustrations ======
  { commenter: 'xiangxia.chen', owner: 'johnny.brooks', title: 'Furina', content: 'The lighting on her dress is gorgeous! How did you get that soft glow effect?' },
  { commenter: 'goku.tanaka', owner: 'johnny.brooks', title: 'Furina', content: 'Love the color composition. The blue and white contrast is so pleasing!' },
  { commenter: 'mariana.silva', owner: 'xiangxia.chen', title: 'Rudco', content: 'The character design is so unique! Is this an original character?' },
  { commenter: 'yuki.sato', owner: 'xiangxia.chen', title: 'Rudco', content: 'Great linework! The details in the armor are incredible.' },
  { commenter: 'johnny.brooks', owner: 'goku.tanaka', title: 'I Am Batman', content: 'Dark atmosphere is perfect for Batman! The shadows really set the mood.' },
  { commenter: 'priya.sharma', owner: 'goku.tanaka', title: 'I Am Batman', content: 'Awesome composition! The cape flowing in the wind gives it so much movement.' },
  { commenter: 'xiangxia.chen', owner: 'mariana.silva', title: '包子口味貝雷帽', content: 'The beret looks so cute! The colors are really warm and inviting.' },
  { commenter: 'mateo.hernandez', owner: 'mariana.silva', title: '包子口味貝雷帽', content: 'I love the art style! It has a cozy slice-of-life feel.' },
  { commenter: 'amina.elami', owner: 'goku.tanaka', title: '第一次画画', content: 'This is beautiful! The simplicity makes it very emotional.' },
  { commenter: 'luca.romano', owner: 'goku.tanaka', title: '第一次画画', content: 'Sometimes less is more. Great work!' },

  // ====== Comments on manga ======
  { commenter: 'mateo.hernandez', owner: 'priya.sharma', title: 'Beret Tales Ch.1', content: 'The paneling is really creative! Love how you used the beret as a framing device.' },
  { commenter: 'yuki.sato', owner: 'priya.sharma', title: 'Beret Tales Ch.1', content: 'The expressions are so lively! Can\'t wait for chapter 2!' },
  { commenter: 'priya.sharma', owner: 'mateo.hernandez', title: 'Furina — Oneshot', content: 'The emotional beats hit perfectly. Great pacing for a oneshot!' },
  { commenter: 'noura.haddad', owner: 'mateo.hernandez', title: 'Furina — Oneshot', content: 'Your style really fits the fantasy genre. The magical scenes are stunning.' },
  { commenter: 'amina.elami', owner: 'yuki.sato', title: 'Gotham Shadows', content: 'The noir aesthetic is spot on! The shadow work really sells the mood.' },
  { commenter: 'raj.patel', owner: 'yuki.sato', title: 'Gotham Shadows', content: 'Great use of dark tones. The cityscape backgrounds are detailed!' },
  { commenter: 'daniel.owusu', owner: 'amina.elami', title: 'Rudco Adventures #1', content: 'Action scenes are so well choreographed! Feels like reading a pro comic.' },
  { commenter: 'igor.volkov', owner: 'amina.elami', title: 'Rudco Adventures #1', content: 'The panel flow during the fight scene is incredible. How did you plan it?' },

  // ====== Comments on novels ======
  { commenter: 'priya.sharma', owner: 'mateo.hernandez', title: 'The Last Sketch', content: 'This story really touched me. The line about \'drawing from memory\' hit hard.' },
  { commenter: 'amina.elami', owner: 'mateo.hernandez', title: 'The Last Sketch', content: 'Beautiful prose! You have a gift for describing emotions through art metaphors.' },
  { commenter: 'mateo.hernandez', owner: 'yuki.sato', title: 'Beyond the Mask', content: 'The character development is fantastic. I could really feel the protagonist\'s journey.' },
  { commenter: 'diego.fuentes', owner: 'yuki.sato', title: 'Beyond the Mask', content: 'The twist at the end caught me off guard! Well written.' },
  { commenter: 'yuki.sato', owner: 'amina.elami', title: 'Rudco: Origins', content: 'Worldbuilding is top notch! The description of Rudco\'s homeland felt so vivid.' },
  { commenter: 'hana.ali', owner: 'amina.elami', title: 'Rudco: Origins', content: 'Great backstory! I love how you tied the character\'s past to their present motivations.' },

  // ====== More cross comments ======
  { commenter: 'noura.haddad', owner: 'johnny.brooks', title: 'Rudco', content: 'This character design is fire! What inspired the outfit?' },
  { commenter: 'emilia.kowalski', owner: 'johnny.brooks', title: 'Rudco', content: 'The color palette you chose really makes the character pop!' },
  { commenter: 'thiago.costa', owner: 'xiangxia.chen', title: 'Furina', content: 'Elegant and powerful! The pose is very dynamic.' },
  { commenter: 'noah.schmidt', owner: 'xiangxia.chen', title: 'Furina', content: 'The hair details are amazing! Each strand looks intentional.' },
  { commenter: 'kai.kurosawa', owner: 'mariana.silva', title: 'I Am Batman', content: 'Really moody! The rain effect adds so much atmosphere.' },
  { commenter: 'omar.ibrahim', owner: 'mariana.silva', title: 'I Am Batman', content: 'Batman has never looked cooler. Love the dramatic lighting!' },
  { commenter: 'lucas.martin', owner: 'priya.sharma', title: 'A Hat Full of Dreams', content: 'The title alone is poetic. Reading this made my evening.' },
  { commenter: 'sofia.andersen', owner: 'priya.sharma', title: 'A Hat Full of Dreams', content: 'Your writing style is so warm and comforting. More please!' },
  { commenter: 'fatima.zahra', owner: 'hana.ali', title: 'Beret Tales Ch.1', content: 'Your art keeps getting better! The backgrounds are so detailed now.' },
  { commenter: 'ananya.iyer', owner: 'igor.volkov', title: 'The Last Sketch', content: 'This was a beautiful read. You have a real talent for storytelling.' },
  { commenter: 'mina.nakamura', owner: 'emilia.kowalski', title: 'Rudco Adventures #1', content: 'The action scenes are incredible! Very dynamic panel layouts.' },
  { commenter: 'sofia.novak', owner: 'daniel.owusu', title: 'Rudco: Origins', content: 'Great pacing and character work. The world feels lived-in.' },
  { commenter: 'leila.benali', owner: 'diego.fuentes', title: 'Furina — Oneshot', content: 'Your lineart is so clean! How long have you been drawing manga?' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Building artwork map from API ===\n');
  const artworkMap = await buildArtworkMap();

  // Print summary of found artworks
  let totalArtworks = 0;
  for (const [user, titles] of Object.entries(artworkMap)) {
    const count = Object.keys(titles).length;
    totalArtworks += count;
    console.log(`  ${user}: ${count} artworks`);
  }
  console.log(`\nTotal: ${totalArtworks} artworks found\n`);

  // Collect unique commenters and login
  const commenters = [...new Set(COMMENTS.map(c => c.commenter))];
  console.log(`Logging in ${commenters.length} commenters...`);
  for (const username of commenters) {
    process.stdout.write(`  ${username}...`);
    await login(username);
    console.log(' ✅');
    await sleep(300);
  }

  // Post comments
  let success = 0, failed = 0;
  for (let i = 0; i < COMMENTS.length; i++) {
    const { commenter, owner, title, content } = COMMENTS[i];

    // Resolve artwork ID dynamically
    const artworkId = artworkMap[owner]?.[title];
    if (!artworkId) {
      console.log(`[${i + 1}/${COMMENTS.length}] ⚠️  Artwork not found: ${owner} / "${title}" — SKIPPED`);
      failed++;
      continue;
    }

    const token = tokens[commenter];
    const contentShort = content.length > 50 ? content.slice(0, 50) + '...' : content;
    process.stdout.write(`[${i + 1}/${COMMENTS.length}] ${commenter} → ${owner}/${title}: "${contentShort}"...`);

    try {
      await axios.post(`${API}/comments`, { artworkId, content }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(' ✅');
      success++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.log(` ❌ ${msg}`);
      failed++;
    }

    await sleep(800 + Math.random() * 1000);
  }

  console.log(`\n=== Done! ${success} comments posted, ${failed} failed ===`);
}

main().catch(console.error);
