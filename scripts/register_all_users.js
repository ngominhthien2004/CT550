const { createRequire } = require('module');
const path = require('path');

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const requireFromBackend = createRequire(BACKEND_NM);
const axios = requireFromBackend('axios');

const PASSWORD = 'Test12345!';
const API = 'http://localhost:5000/api';

const ACCOUNTS = [
  'johnny.brooks', 'xiangxia.chen', 'goku.tanaka', 'mariana.silva',
  'mateo.hernandez', 'priya.sharma', 'yuki.sato', 'amina.elami',
  'luca.romano', 'noura.haddad', 'sofia.novak', 'raj.patel',
  'emilia.kowalski', 'kai.kurosawa', 'diego.fuentes', 'hana.ali',
  'thiago.costa', 'leila.benali', 'noah.schmidt', 'mei.lin',
  'omar.ibrahim', 'anya.petrov', 'lucas.martin', 'fatima.zahra',
  'hugo.fernandez', 'ananya.iyer', 'mina.nakamura', 'daniel.owusu',
  'sofia.andersen', 'igor.volkov',
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function register(username) {
  const payload = {
    username,
    email: `${username}@gmail.com`,
    password: PASSWORD,
  };
  const res = await axios.post(`${API}/auth/register`, payload);
  return res.data;
}

async function main() {
  console.log(`Registering ${ACCOUNTS.length} accounts...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const username = ACCOUNTS[i];
    process.stdout.write(`[${i + 1}/${ACCOUNTS.length}] ${username}...`);

    try {
      const result = await register(username);
      console.log(` ✅ (id: ${result._id.slice(0, 8)}...)`);
      success++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.log(` ❌ ${msg}`);
      failed++;
    }

    await sleep(500);
  }

  console.log(`\n✅ Done! ${success} registered, ${failed} failed`);
}

main().catch(console.error);
