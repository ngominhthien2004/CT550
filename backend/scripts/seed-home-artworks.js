const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/User')
const Tag = require('../models/Tag')
const Artwork = require('../models/Artwork')

require('dotenv').config()

const homeArtworks = [
  {
    title: 'Evening Lantern Street',
    description: 'Warm city lights and traditional vibes for homepage discovery.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/111295072_p0_master1200.jpg'],
    tags: ['cityscape', 'night', 'illustration'],
  },
  {
    title: 'Festival Yukata Portrait',
    description: 'Character portrait with yukata style and summer festival mood.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/119926049_p0_master1200.jpg'],
    tags: ['yukata', 'portrait', 'anime'],
  },
  {
    title: 'Mechanical Wings Concept',
    description: 'Mecha-inspired concept art with clean line treatment.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/120180230_p0_master1200.jpg'],
    tags: ['mecha', 'concept-art', 'design'],
  },
  {
    title: 'Watercolor Garden Notes',
    description: 'Soft watercolor texture study for botanical background scenes.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/111295072_p0_master1200.jpg'],
    tags: ['watercolor', 'background-art', 'nature'],
  },
]

async function ensureTag(name) {
  const normalized = name.toLowerCase()
  let tag = await Tag.findOne({ name: normalized })
  if (!tag) {
    tag = await Tag.create({ name: normalized, usageCount: 0 })
  }
  return tag
}

async function run() {
  try {
    await connectDB()

    let user = await User.findOne({ username: 'gallery_owner' })
    if (!user) {
      user = await User.create({
        email: 'gallery_owner@example.com',
        password: 'gallery123456',
        username: 'gallery_owner',
        displayName: 'Gallery Owner',
        bio: 'Internal seeded account for homepage content.',
      })
    }

    let upserted = 0

    for (const artworkData of homeArtworks) {
      const tagIds = []
      for (const tagName of artworkData.tags) {
        const tag = await ensureTag(tagName)
        tagIds.push(tag._id)
      }

      const artwork = await Artwork.findOneAndUpdate(
        { user: user._id, title: artworkData.title },
        {
          $set: {
            user: user._id,
            title: artworkData.title,
            description: artworkData.description,
            type: artworkData.type,
            ageRating: artworkData.ageRating,
            images: artworkData.images,
            tags: tagIds,
            isDraft: false,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )

      if (artwork) {
        upserted += 1
      }
    }

    const usage = await Artwork.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
    ])

    await Tag.updateMany({}, { $set: { usageCount: 0 } })
    for (const item of usage) {
      await Tag.updateOne({ _id: item._id }, { $set: { usageCount: item.count } })
    }

    console.log(`Seeded homepage artworks: ${upserted}`)
  } catch (error) {
    console.error('seed-home-artworks failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
