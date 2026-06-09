const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Ignore .env MONGODB_URI (SRV fails on this network), use direct shard host
const MONGO_URI = 'mongodb://ngominhthien2004:ngominhthien@ac-g8ueav1-shard-00-00.pd74ikk.mongodb.net:27017,ac-g8ueav1-shard-00-01.pd74ikk.mongodb.net:27017,ac-g8ueav1-shard-00-02.pd74ikk.mongodb.net:27017/CT550?ssl=true&retryWrites=true&w=majority&replicaSet=atlas-g8ueav1-shard-0';

async function promote() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });
  const db = mongoose.connection.db;
  
  // Check if user exists
  const user = await db.collection('users').findOne({ email: 'johnny.brooks@gmail.com' });
  console.log('User found:', user ? user._id.toString() : 'NO');
  
  if (user) {
    const result = await db.collection('users').updateOne(
      { email: 'johnny.brooks@gmail.com' },
      { $set: { role: 'admin' } }
    );
    console.log('Modified:', result.modifiedCount);
    console.log('Matched:', result.matchedCount);
  }
  
  await mongoose.disconnect();
}

promote().catch(e => { console.error(e); process.exit(1); });
