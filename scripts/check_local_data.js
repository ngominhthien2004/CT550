const { createRequire } = require('module');
const path = require('path');
const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const req = createRequire(BACKEND_NM);

const mongoose = req('mongoose');

async function main() {
  // Connect to local MongoDB (the one the backend actually uses)
  await mongoose.connect('mongodb://localhost:27017/ct550');
  console.log('Connected to Local MongoDB');
  
  const db = mongoose.connection.db;
  console.log('  DB name:', db.databaseName);
  
  const collections = await db.listCollections().toArray();
  console.log(`  Found ${collections.length} collections`);
  
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} documents`);
  }
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
