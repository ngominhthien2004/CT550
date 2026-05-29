const { createRequire } = require('module');
const path = require('path');

const backendNodeModules = path.resolve(__dirname, '..', 'backend', 'node_modules');
const req = createRequire(backendNodeModules);

const envPath = path.resolve(__dirname, '..', 'backend', '.env');
req('dotenv').config({ path: envPath });

const mongoose = req('mongoose');
const dns = req('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const artworks = db.collection('artworks');
  const tags = db.collection('tags');

  // Find tags with commas in their name
  const badTags = await tags.find({ name: { $regex: ',' } }).toArray();
  console.log(`Found ${badTags.length} bad tags (comma-separated):`);
  badTags.forEach(t => console.log(`  - "${t.name}" (${t._id})`));

  let fixedArtworks = 0;

  for (const badTag of badTags) {
    // Split into individual tag names
    const individualNames = badTag.name.split(',').map(t => t.trim()).filter(Boolean);
    console.log(`\nSplitting "${badTag.name}" → [${individualNames.join(', ')}]`);

    // Find or create correct individual tags
    const correctTagIds = [];
    for (const name of individualNames) {
      const normalizedName = name.toLowerCase().replace(/^#+/, '').replace(/\s+/g, '_');
      let tag = await tags.findOne({ name: normalizedName });
      if (!tag) {
        const result = await tags.insertOne({
          name: normalizedName,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        tag = { _id: result.insertedId };
        console.log(`  Created tag: "${normalizedName}"`);
      } else {
        console.log(`  Found tag: "${normalizedName}"`);
      }
      correctTagIds.push(tag._id);
    }

    // Find all artworks referencing the bad tag
    const affectedArtworks = await artworks.find({ tags: badTag._id }).toArray();
    console.log(`  Affected artworks: ${affectedArtworks.length}`);

    for (const artwork of affectedArtworks) {
      // Remove bad tag and add correct ones
      const newTags = artwork.tags
        .filter(t => t.toString() !== badTag._id.toString())
        .concat(correctTagIds);

      await artworks.updateOne(
        { _id: artwork._id },
        { $set: { tags: [...new Set(newTags.map(t => t.toString()))].map(t => new mongoose.Types.ObjectId(t)) } }
      );
      fixedArtworks++;
    }

    // Delete the bad tag
    await tags.deleteOne({ _id: badTag._id });
    console.log(`  Deleted bad tag: "${badTag.name}"`);
  }

  console.log(`\n=== Done! Fixed ${fixedArtworks} artworks ===`);

  // Show the remaining tags
  const remainingTags = await tags.find().toArray();
  console.log(`\nAll tags (${remainingTags.length}):`);
  remainingTags.forEach(t => console.log(`  - ${t.name} (${t.usageCount || 0})`));

  await mongoose.disconnect();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
