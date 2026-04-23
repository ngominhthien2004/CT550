const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Tag = require('../models/Tag');
const Artwork = require('../models/Artwork');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TAG_NAMES = ['manga_story', 'panel_art', 'novel_scene', 'fiction'];

const MANGA_SAMPLES = [
    {
        title: 'City Echoes Chapter 1',
        description: 'Manga sample seeded for type filter testing.',
        type: 'manga',
        images: ['https://picsum.photos/seed/ct550-manga-1/900/1200'],
        ageRating: 'all'
    },
    {
        title: 'Orbit Kids Volume Cover',
        description: 'Cover style manga sample for /manga route.',
        type: 'manga',
        images: ['https://picsum.photos/seed/ct550-manga-2/900/1200'],
        ageRating: 'all'
    }
];

const NOVEL_SAMPLES = [
    {
        title: 'Lanterns Over Winter Street',
        description: 'Novel sample seeded for type filter testing.',
        type: 'novel',
        images: ['https://picsum.photos/seed/ct550-novel-1/900/1200'],
        ageRating: 'all'
    },
    {
        title: 'Midnight Postcards',
        description: 'Another novel sample for /novels route verification.',
        type: 'novel',
        images: ['https://picsum.photos/seed/ct550-novel-2/900/1200'],
        ageRating: 'all'
    }
];

async function getOrCreateSeederUser() {
    const email = 'seed.typed.artworks@ct550.local';
    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            email,
            username: 'seedtyped',
            displayName: 'Seed Typed',
            password: 'SeedPass123!'
        });
    }

    return user;
}

async function getOrCreateTags() {
    const tagIds = [];

    for (const rawName of TAG_NAMES) {
        const name = String(rawName || '').trim().toLowerCase();
        if (!name) {
            continue;
        }

        let tag = await Tag.findOne({ name });
        if (!tag) {
            tag = await Tag.create({ name, usageCount: 0 });
        }

        tagIds.push(tag._id);
    }

    return tagIds;
}

async function upsertArtworks(samples, userId, tagIds) {
    for (const sample of samples) {
        const existing = await Artwork.findOne({ title: sample.title, type: sample.type });

        if (existing) {
            existing.description = sample.description;
            existing.images = sample.images;
            existing.ageRating = sample.ageRating;
            existing.tags = tagIds;
            existing.user = userId;
            await existing.save();
            continue;
        }

        await Artwork.create({
            user: userId,
            title: sample.title,
            description: sample.description,
            type: sample.type,
            images: sample.images,
            ageRating: sample.ageRating,
            tags: tagIds
        });
    }
}

async function syncTagUsage() {
    const usageRows = await Artwork.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } }
    ]);

    const usageMap = new Map(usageRows.map((row) => [String(row._id), row.count]));
    const tags = await Tag.find({ name: { $in: TAG_NAMES } });

    for (const tag of tags) {
        tag.usageCount = usageMap.get(String(tag._id)) || 0;
        await tag.save();
    }
}

async function run() {
    try {
        await connectDB();

        const seeder = await getOrCreateSeederUser();
        const tagIds = await getOrCreateTags();

        await upsertArtworks(MANGA_SAMPLES, seeder._id, tagIds);
        await upsertArtworks(NOVEL_SAMPLES, seeder._id, tagIds);
        await syncTagUsage();

        console.log('Seeded manga/novel sample artworks successfully.');
    } catch (error) {
        console.error('Failed to seed typed artworks:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

run();
