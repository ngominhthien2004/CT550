#!/usr/bin/env node
const connectDB = require('../backend/config/db');
const Artwork = require('../backend/models/Artwork');

async function migrate() {
    await connectDB();
    try {
        const ugoiraDocs = await Artwork.find({ type: 'ugoira' }).lean();
        console.log(`Found ${ugoiraDocs.length} artworks with type='ugoira'`);

        let updatedCount = 0;
        for (const doc of ugoiraDocs) {
            const update = { type: 'gif' };
            const unset = {};
            if (doc.ugoiraNotes && !doc.gifNotes) {
                update.gifNotes = doc.ugoiraNotes;
                unset.ugoiraNotes = '';
            } else if (doc.ugoiraNotes) {
                // if gifNotes already exists, still remove ugoiraNotes
                unset.ugoiraNotes = '';
            }

            if (Object.keys(unset).length > 0) {
                await Artwork.updateOne({ _id: doc._id }, { $set: update, $unset: unset });
            } else {
                await Artwork.updateOne({ _id: doc._id }, { $set: update });
            }
            updatedCount++;
        }

        console.log(`Migration complete. Updated ${updatedCount} documents.`);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exitCode = 2;
    } finally {
        // Close mongoose connection
        const mongoose = require('mongoose');
        await mongoose.disconnect();
    }
}

migrate();
