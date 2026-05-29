const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const req = createRequire(BACKEND_NM);

const envPath = path.resolve(__dirname, '..', 'backend', '.env');
req('dotenv').config({ path: envPath });

const cloudinary = req('cloudinary').v2;
const mongoose = req('mongoose');

const dns = req('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const PUBLIC_DIR = path.resolve(__dirname, '..', 'backend', 'public');

async function main() {
  console.log('Connecting to MongoDB (Atlas)...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // Find users with local avatar paths
  const cursor = users.find({
    avatar: { $regex: '^/uploads/' }
  });

  const userList = await cursor.toArray();
  console.log(`Found ${userList.length} users with local avatar paths\n`);

  let success = 0;

  for (const user of userList) {
    const localPath = path.join(PUBLIC_DIR, user.avatar.replace(/^\//, ''));

    process.stdout.write(`${user.username}...`);

    if (!fs.existsSync(localPath)) {
      console.log(` ⚠️  File not found: ${localPath}`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'illuwrl-avatars',
        resource_type: 'image',
      });

      // Update user record with Cloudinary URL
      await users.updateOne(
        { _id: user._id },
        { $set: { avatar: result.secure_url } }
      );

      console.log(` ✅ → ${result.secure_url.slice(0, 60)}...`);
      success++;
    } catch (err) {
      console.log(` ❌ ${err.message}`);
    }

    // Rate limit pause
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Done! ${success} avatars migrated to Cloudinary ===`);
  await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
