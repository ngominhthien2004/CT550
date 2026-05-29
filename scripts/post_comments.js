/**
 * post_comments.js
 *
 * Posts human-style comments between accounts on each other's artworks.
 * Uses createRequire to resolve axios from the backend's node_modules.
 *
 * Usage: cd backend && node ../scripts/post_comments.js
 */

// ---------------------------------------------------------------------------
// Module imports
// ---------------------------------------------------------------------------
const path = require('path');
const { createRequire } = require('module');

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const requireFromBackend = createRequire(BACKEND_NM);
const axios = requireFromBackend('axios');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PASSWORD = 'Test12345!';
const API_BASE = 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Account & Artwork Data
// ---------------------------------------------------------------------------

const USERS = {
  'johnny.brooks':    '6a16ceef419d91c0a8a88541',
  'xiangxia.chen':    '6a16ceef419d91c0a8a88544',
  'goku.tanaka':      '6a16ceef419d91c0a8a88547',
  'mariana.silva':    '6a16ceef419d91c0a8a8854a',
  'mateo.hernandez':  '6a16ceef419d91c0a8a8854d',
  'priya.sharma':     '6a16ceef419d91c0a8a88550',
  'yuki.sato':        '6a16ceef419d91c0a8a88553',
  'amina.elami':      '6a16ceef419d91c0a8a88556',
  'luca.romano':      '6a16ceef419d91c0a8a88559',
  'noura.haddad':     '6a16ceef419d91c0a8a8855c',
  'sofia.novak':      '6a16ceef419d91c0a8a8855f',
  'raj.patel':        '6a16ceef419d91c0a8a88562',
  'emilia.kowalski':  '6a16ceef419d91c0a8a88565',
  'kai.kurosawa':     '6a16ceef419d91c0a8a88568',
  'diego.fuentes':    '6a16ceef419d91c0a8a8856b',
  'hana.ali':         '6a16ceef419d91c0a8a8856e',
  'thiago.costa':     '6a16ceef419d91c0a8a88571',
  'leila.benali':     '6a16ceef419d91c0a8a88574',
  'noah.schmidt':     '6a16ceef419d91c0a8a88577',
  'mei.lin':          '6a16ceef419d91c0a8a8857a',
  'omar.ibrahim':     '6a16ceef419d91c0a8a8857d',
  'anya.petrov':      '6a16ceef419d91c0a8a88580',
  'lucas.martin':     '6a16ceef419d91c0a8a88583',
  'fatima.zahra':     '6a16ceef419d91c0a8a88586',
  'hugo.fernandez':   '6a16ceef419d91c0a8a88589',
  'ananya.iyer':      '6a16ceef419d91c0a8a8858c',
  'mina.nakamura':    '6a16ceef419d91c0a8a8858f',
  'daniel.owusu':     '6a16ceef419d91c0a8a88592',
  'sofia.andersen':   '6a16ceef419d91c0a8a88595',
  'igor.volkov':      '6a16ceef419d91c0a8a88598',
};

const ARTWORKS = {
  'johnny.brooks': {
    'Furina':       '6a17b012b8dbacd758ad1948',
    '包子口味貝雷帽':  '6a17b013b8dbacd758ad1959',
    'I Am Batman':  '6a17b015b8dbacd758ad1970',
    'Rudco':        '6a17b016b8dbacd758ad1981',
    '第一次画画':    '6a17b018b8dbacd758ad1990',
  },
  'xiangxia.chen': {
    'Furina':       '6a17b019b8dbacd758ad19a4',
    '包子口味貝雷帽':  '6a17b01bb8dbacd758ad19b1',
    'I Am Batman':  '6a17b01db8dbacd758ad19c0',
    'Rudco':        '6a17b01eb8dbacd758ad19cd',
    '第一次画画':    '6a17b020b8dbacd758ad19da',
  },
  'goku.tanaka': {
    'Furina':       '6a17b021b8dbacd758ad19ee',
    '包子口味貝雷帽':  '6a17b023b8dbacd758ad19fb',
    'I Am Batman':  '6a17b024b8dbacd758ad1a0a',
    'Rudco':        '6a17b026b8dbacd758ad1a17',
    '第一次画画':    '6a17b027b8dbacd758ad1a24',
  },
  'mariana.silva': {
    'Furina':       '6a17b029b8dbacd758ad1a38',
    '包子口味貝雷帽':  '6a17b02bb8dbacd758ad1a45',
    'I Am Batman':  '6a17b02cb8dbacd758ad1a54',
    'Rudco':        '6a17b02eb8dbacd758ad1a61',
    '第一次画画':    '6a17b02fb8dbacd758ad1a6e',
  },
  'mateo.hernandez': {
    'The Last Sketch':          '6a17b186b8dbacd758ad1a8c',
    'Furina — Oneshot':         '6a17b187b8dbacd758ad1a97',
  },
  'priya.sharma': {
    'A Hat Full of Dreams':     '6a17b189b8dbacd758ad1aa3',
    'Beret Tales Ch.1':         '6a17b18bb8dbacd758ad1aae',
  },
  'yuki.sato': {
    'Beyond the Mask':          '6a17b18cb8dbacd758ad1aba',
    'Gotham Shadows':           '6a17b18eb8dbacd758ad1ac5',
  },
  'amina.elami': {
    'Rudco: Origins':           '6a17b18fb8dbacd758ad1ad1',
    'Rudco Adventures #1':      '6a17b191b8dbacd758ad1adc',
  },
  'luca.romano': {
    'First Lines':              '6a17b193b8dbacd758ad1ae8',
    'First Step':               '6a17b194b8dbacd758ad1af3',
  },
  'noura.haddad':    { manga: '6a17b197b8dbacd758ad1b06', novel: '6a17b196b8dbacd758ad1afd' },
  'sofia.novak':     { manga: '6a17b19ab8dbacd758ad1b19', novel: '6a17b199b8dbacd758ad1b10' },
  'raj.patel':       { manga: '6a17b19eb8dbacd758ad1b2c', novel: '6a17b19cb8dbacd758ad1b23' },
  'emilia.kowalski': { manga: '6a17b1a1b8dbacd758ad1b3f', novel: '6a17b19fb8dbacd758ad1b36' },
  'kai.kurosawa':    { manga: '6a17b1a4b8dbacd758ad1b52', novel: '6a17b1a2b8dbacd758ad1b49' },
  'diego.fuentes':   { manga: '6a17b1a7b8dbacd758ad1b65', novel: '6a17b1a6b8dbacd758ad1b5c' },
  'hana.ali':        { manga: '6a17b1aab8dbacd758ad1b78', novel: '6a17b1a9b8dbacd758ad1b6f' },
  'thiago.costa':    { manga: '6a17b1aeb8dbacd758ad1b8b', novel: '6a17b1acb8dbacd758ad1b82' },
  'leila.benali':    { manga: '6a17b1b1b8dbacd758ad1b9e', novel: '6a17b1afb8dbacd758ad1b95' },
  'noah.schmidt':    { manga: '6a17b1b4b8dbacd758ad1bb1', novel: '6a17b1b2b8dbacd758ad1ba8' },
  'mei.lin':         { manga: '6a17b1b7b8dbacd758ad1bc4', novel: '6a17b1b6b8dbacd758ad1bbb' },
  'omar.ibrahim':    { manga: '6a17b1bab8dbacd758ad1bd7', novel: '6a17b1b9b8dbacd758ad1bce' },
  'anya.petrov':     { manga: '6a17b1bdb8dbacd758ad1bea', novel: '6a17b1bcb8dbacd758ad1be1' },
  'lucas.martin':    { manga: '6a17b1c1b8dbacd758ad1bfd', novel: '6a17b1bfb8dbacd758ad1bf4' },
  'fatima.zahra':    { manga: '6a17b1c4b8dbacd758ad1c10', novel: '6a17b1c2b8dbacd758ad1c07' },
  'hugo.fernandez':  { manga: '6a17b1c7b8dbacd758ad1c23', novel: '6a17b1c5b8dbacd758ad1c1a' },
  'ananya.iyer':     { manga: '6a17b1cab8dbacd758ad1c36', novel: '6a17b1c9b8dbacd758ad1c2d' },
  'mina.nakamura':   { manga: '6a17b1cdb8dbacd758ad1c49', novel: '6a17b1ccb8dbacd758ad1c40' },
  'daniel.owusu':    { manga: '6a17b1d0b8dbacd758ad1c5c', novel: '6a17b1cfb8dbacd758ad1c53' },
  'sofia.andersen':  { manga: '6a17b1d4b8dbacd758ad1c6f', novel: '6a17b1d2b8dbacd758ad1c66' },
  'igor.volkov':     { manga: '6a17b1d7b8dbacd758ad1c82', novel: '6a17b1d5b8dbacd758ad1c79' },
};

// ---------------------------------------------------------------------------
// Comments Plan
// ---------------------------------------------------------------------------

const COMMENTS = [
  // ======== 1. Comments on illustrations (from non-owner accounts) ========

  // johnny.brooks' "Furina"
  { commenter: 'xiangxia.chen', artworkId: ARTWORKS['johnny.brooks']['Furina'], content: 'The lighting on her dress is gorgeous! How did you get that soft glow effect?' },
  { commenter: 'goku.tanaka',   artworkId: ARTWORKS['johnny.brooks']['Furina'], content: 'Love the color composition. The blue and white contrast is so pleasing!' },

  // xiangxia.chen's "Rudco"
  { commenter: 'mariana.silva', artworkId: ARTWORKS['xiangxia.chen']['Rudco'], content: 'The character design is so unique! Is this an original character?' },
  { commenter: 'yuki.sato',     artworkId: ARTWORKS['xiangxia.chen']['Rudco'], content: 'Great linework! The details in the armor are incredible.' },

  // goku.tanaka's "I Am Batman"
  { commenter: 'johnny.brooks', artworkId: ARTWORKS['goku.tanaka']['I Am Batman'], content: 'Dark atmosphere is perfect for Batman! The shadows really set the mood.' },
  { commenter: 'priya.sharma',  artworkId: ARTWORKS['goku.tanaka']['I Am Batman'], content: 'Awesome composition! The cape flowing in the wind gives it so much movement.' },

  // mariana.silva's "包子口味貝雷帽"
  { commenter: 'xiangxia.chen', artworkId: ARTWORKS['mariana.silva']['包子口味貝雷帽'], content: 'The beret looks so cute! The colors are really warm and inviting.' },
  { commenter: 'mateo.hernandez', artworkId: ARTWORKS['mariana.silva']['包子口味貝雷帽'], content: 'I love the art style! It has a cozy slice-of-life feel.' },

  // goku.tanaka's "第一次画画"
  { commenter: 'amina.elami',   artworkId: ARTWORKS['goku.tanaka']['第一次画画'], content: 'This is beautiful! The simplicity makes it very emotional.' },
  { commenter: 'luca.romano',   artworkId: ARTWORKS['goku.tanaka']['第一次画画'], content: 'Sometimes less is more. Great work!' },

  // ======== 2. Comments on manga ========

  // priya.sharma's "Beret Tales Ch.1"
  { commenter: 'mateo.hernandez', artworkId: ARTWORKS['priya.sharma']['Beret Tales Ch.1'], content: 'The paneling is really creative! Love how you used the beret as a framing device.' },
  { commenter: 'yuki.sato',       artworkId: ARTWORKS['priya.sharma']['Beret Tales Ch.1'], content: 'The expressions are so lively! Can\'t wait for chapter 2!' },

  // mateo.hernandez's "Furina — Oneshot"
  { commenter: 'priya.sharma',  artworkId: ARTWORKS['mateo.hernandez']['Furina — Oneshot'], content: 'The emotional beats hit perfectly. Great pacing for a oneshot!' },
  { commenter: 'noura.haddad',  artworkId: ARTWORKS['mateo.hernandez']['Furina — Oneshot'], content: 'Your style really fits the fantasy genre. The magical scenes are stunning.' },

  // yuki.sato's "Gotham Shadows"
  { commenter: 'amina.elami',   artworkId: ARTWORKS['yuki.sato']['Gotham Shadows'], content: 'The noir aesthetic is spot on! The shadow work really sells the mood.' },
  { commenter: 'raj.patel',     artworkId: ARTWORKS['yuki.sato']['Gotham Shadows'], content: 'Great use of dark tones. The cityscape backgrounds are detailed!' },

  // ======== 3. Comments on novels ========

  // mateo.hernandez's "The Last Sketch"
  { commenter: 'priya.sharma',  artworkId: ARTWORKS['mateo.hernandez']['The Last Sketch'], content: 'This story really touched me. The line about \'drawing from memory\' hit hard.' },
  { commenter: 'amina.elami',   artworkId: ARTWORKS['mateo.hernandez']['The Last Sketch'], content: 'Beautiful prose! You have a gift for describing emotions through art metaphors.' },

  // yuki.sato's "Beyond the Mask"
  { commenter: 'mateo.hernandez', artworkId: ARTWORKS['yuki.sato']['Beyond the Mask'], content: 'The character development is fantastic. I could really feel the protagonist\'s journey.' },
  { commenter: 'diego.fuentes',   artworkId: ARTWORKS['yuki.sato']['Beyond the Mask'], content: 'The twist at the end caught me off guard! Well written.' },

  // amina.elami's "Rudco: Origins"
  { commenter: 'yuki.sato',   artworkId: ARTWORKS['amina.elami']['Rudco: Origins'], content: 'Worldbuilding is top notch! The description of Rudco\'s homeland felt so vivid.' },
  { commenter: 'hana.ali',    artworkId: ARTWORKS['amina.elami']['Rudco: Origins'], content: 'Great backstory! I love how you tied the character\'s past to their present motivations.' },

  // ======== 4. More cross comments ========

  // johnny.brooks' "Rudco"
  { commenter: 'noura.haddad',    artworkId: ARTWORKS['johnny.brooks']['Rudco'], content: 'This character design is fire! What inspired the outfit?' },
  { commenter: 'emilia.kowalski', artworkId: ARTWORKS['johnny.brooks']['Rudco'], content: 'The color palette you chose really makes the character pop!' },

  // xiangxia.chen's "Furina"
  { commenter: 'thiago.costa', artworkId: ARTWORKS['xiangxia.chen']['Furina'], content: 'Elegant and powerful! The pose is very dynamic.' },
  { commenter: 'noah.schmidt', artworkId: ARTWORKS['xiangxia.chen']['Furina'], content: 'The hair details are amazing! Each strand looks intentional.' },

  // mariana.silva's "I Am Batman"
  { commenter: 'kai.kurosawa', artworkId: ARTWORKS['mariana.silva']['I Am Batman'], content: 'Really moody! The rain effect adds so much atmosphere.' },
  { commenter: 'omar.ibrahim', artworkId: ARTWORKS['mariana.silva']['I Am Batman'], content: 'Batman has never looked cooler. Love the dramatic lighting!' },

  // priya.sharma's "A Hat Full of Dreams"
  { commenter: 'lucas.martin',   artworkId: ARTWORKS['priya.sharma']['A Hat Full of Dreams'], content: 'The title alone is poetic. Reading this made my evening.' },
  { commenter: 'sofia.andersen', artworkId: ARTWORKS['priya.sharma']['A Hat Full of Dreams'], content: 'Your writing style is so warm and comforting. More please!' },

  // amina.elami's "Rudco Adventures #1"
  { commenter: 'daniel.owusu', artworkId: ARTWORKS['amina.elami']['Rudco Adventures #1'], content: 'Action scenes are so well choreographed! Feels like reading a pro comic.' },
  { commenter: 'igor.volkov',  artworkId: ARTWORKS['amina.elami']['Rudco Adventures #1'], content: 'The panel flow during the fight scene is incredible. How did you plan it?' },

  // hana.ali's manga
  { commenter: 'fatima.zahra', artworkId: ARTWORKS['hana.ali'].manga, content: 'Your art keeps getting better! The backgrounds are so detailed now.' },

  // igor.volkov's novel
  { commenter: 'ananya.iyer', artworkId: ARTWORKS['igor.volkov'].novel, content: 'This was a beautiful read. You have a real talent for storytelling.' },

  // emilia.kowalski's manga
  { commenter: 'mina.nakamura', artworkId: ARTWORKS['emilia.kowalski'].manga, content: 'The action scenes are incredible! Very dynamic panel layouts.' },

  // daniel.owusu's novel
  { commenter: 'sofia.novak', artworkId: ARTWORKS['daniel.owusu'].novel, content: 'Great pacing and character work. The world feels lived-in.' },

  // diego.fuentes' manga
  { commenter: 'leila.benali', artworkId: ARTWORKS['diego.fuentes'].manga, content: 'Your lineart is so clean! How long have you been drawing manga?' },
];

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------
const tokenCache = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(username) {
  const email = `${username}@gmail.com`;
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password: PASSWORD });
  tokenCache[username] = res.data.token;
  console.log(`  ✅ Logged in as ${username}`);
}

async function postComment(commenterUsername, artworkId, content) {
  const token = tokenCache[commenterUsername];

  if (!token) {
    throw new Error(`Not logged in: ${commenterUsername}`);
  }

  const res = await axios.post(
    `${API_BASE}/comments`,
    { artworkId, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Posting cross-account comments ===\n');

  // Collect all unique commenters
  const commenters = [...new Set(COMMENTS.map((c) => c.commenter))];

  // Login all commenters
  for (const username of commenters) {
    process.stdout.write(`Logging in ${username}...`);
    try {
      await login(username);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.log(` ❌ ${msg}`);
    }
    await sleep(500);
  }

  console.log(`\nAll ${commenters.length} accounts logged in. Starting comments...\n`);

  // Post each comment with 1-2s delay
  for (let i = 0; i < COMMENTS.length; i++) {
    const { commenter, content, artworkId } = COMMENTS[i];
    const artworkIdShort = artworkId.slice(0, 8) + '...';
    const contentPreview = content.length > 50 ? content.slice(0, 50) + '...' : content;

    process.stdout.write(`[${i + 1}/${COMMENTS.length}] ${commenter} \u2192 ${artworkIdShort}: "${contentPreview}"...`);

    try {
      const result = await postComment(commenter, artworkId, content);
      console.log(` ✅ (id: ${result._id.slice(0, 8)}...)`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.log(` ❌ ${msg}`);
    }

    await sleep(1000 + Math.random() * 1000);
  }

  console.log(`\n=== Done! ${COMMENTS.length} comments posted ===`);
}

main().catch(console.error);
