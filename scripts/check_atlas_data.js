const { createRequire } = require('module');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const req = createRequire(BACKEND_NM);

const mongoose = req('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ct550';
  
  
  const dns = req('dns');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  
  await mongoose.connect(uri);
  console.log('Connected to Atlas');
  
  const db = mongoose.connection.db;
  console.log('  DB name:', db.databaseName);
  
  // Try each known collection - just count directly
  const knownCollections = ['users', 'artworks', 'messages', 'notifications', 'comments', 'tags', 'bookmarks', 'likes', 'follows', 'activities', 'conversations', 'reports'];
  
  for (const name of knownCollections) {
    try {
      const count = await db.collection(name).countDocuments();
      console.log(`  ${name}: ${count} documents`);
    } catch (err) {
      // skip if collection doesn't exist
    }
  }
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
