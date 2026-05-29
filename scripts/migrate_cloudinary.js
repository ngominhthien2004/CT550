const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');

const BACKEND_NM = path.resolve(__dirname, '..', 'backend', 'node_modules');
const req = createRequire(BACKEND_NM);

// Load .env
const envPath = path.resolve(__dirname, '..', 'backend', '.env');
req('dotenv').config({ path: envPath });

const cloudinary = req('cloudinary').v2;
const mongoose = req('mongoose');

// Set custom DNS servers to work around Atlas SRV resolution issues
const dns = req('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Configure Cloudinary from URL
// cloudinary.config will read CLOUDINARY_URL env var automatically

const PUBLIC_DIR = path.resolve(__dirname, '..', 'backend', 'public');

async function migrateArtworks() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const artworks = db.collection('artworks');

  const cursor = artworks.find({
    images: { $elemMatch: { $regex: '^/uploads/' } }
  });

  let total = 0;
  let success = 0;
  let failed = 0;

  while (await cursor.hasNext()) {
    const artwork = await cursor.next();
    total++;
    console.log(`\n[${total}] ${artwork.title} (${artwork._id})`);

    const newImages = [];

    for (const imgPath of artwork.images) {
      // Convert /uploads/userId/... to absolute path
      const localPath = path.join(PUBLIC_DIR, imgPath.replace(/^\//, ''));

      if (!fs.existsSync(localPath)) {
        console.log(`  ⚠️  File not found: ${localPath}`);
        newImages.push(imgPath); // keep old path
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'illuwrl-artworks',
          resource_type: 'image',
        });
        newImages.push(result.secure_url);
        console.log(`  ✅ ${path.basename(localPath)} → ${result.secure_url.slice(0, 60)}...`);
        success++;
      } catch (err) {
        console.log(`  ❌ Upload failed: ${err.message}`);
        newImages.push(imgPath);
        failed++;
      }
    }

    // Update the artwork with Cloudinary URLs
    if (newImages.some(url => url.startsWith('http'))) {
      await artworks.updateOne(
        { _id: artwork._id },
        { $set: { images: newImages } }
      );
      console.log(`  📝 DB updated for ${artwork.title}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Artworks processed: ${total}`);
  console.log(`Images uploaded: ${success}`);
  console.log(`Images failed: ${failed}`);

  await mongoose.disconnect();
}

migrateArtworks().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
