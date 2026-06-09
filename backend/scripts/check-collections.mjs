/**
 * check-collections.mjs
 *
 * Connects to MongoDB and reports document counts for all collections.
 *
 * Usage: node backend/scripts/check-collections.mjs
 */

import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/CT550';
const DB_NAME = 'CT550';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    retryWrites: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`Connected: ${mongoose.connection.host}\n`);

  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).sort();

  console.log('━'.repeat(50));
  console.log('  Collection Counts');
  console.log('━'.repeat(50));

  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments();
    const label = `  ${name.padEnd(30)}`;
    const countStr = `${count}`.padStart(6);
    console.log(`${label} ${countStr} document${count === 1 ? '' : 's'}`);
  }

  console.log('━'.repeat(50));

  await mongoose.disconnect();
  console.log('Disconnected.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
