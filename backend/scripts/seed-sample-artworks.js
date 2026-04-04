const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/User')
const Tag = require('../models/Tag')
const Artwork = require('../models/Artwork')

require('dotenv').config()

const sampleArtworks = [
  {
    title: 'Marine Chimeramon Fanart',
    description: 'Digimon fanart sample seeded for artwork detail page testing.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/111295072_p0_master1200.jpg'],
    tags: ['digimon', 'fanart', 'concept-art'],
    viewCount: 320,
    likeCount: 178,
    bookmarkCount: 44,
    commentCount: 9,
  },
  {
    title: 'Cyber City Night Runner',
    description: 'Sample illustration used to validate detail route and UI layout.',
    type: 'illust',
    ageRating: 'all',
    images: ['/uploads/user1/illust/119926049_p0_master1200.jpg'],
    tags: ['cyberpunk', 'city', 'night'],
    viewCount: 210,
    likeCount: 122,
    bookmarkCount: 29,
    commentCount: 5,
  },
  {
    title: 'Spring Character Sheet',
    description: 'Character design sheet for test and demo purposes.',
    type: 'manga',
    ageRating: 'all',
    images: ['/uploads/user1/illust/120180230_p0_master1200.jpg'],
    tags: ['character-design', 'sheet', 'manga'],
    viewCount: 188,
    likeCount: 96,
    bookmarkCount: 26,
    commentCount: 4,
  },
]

async function ensureTagIds(tagNames) {
  const tagIds = []
  for (const name of tagNames) {
    const normalized = name.toLowerCase()
    let tag = await Tag.findOne({ name: normalized })
    if (!tag) {
      tag = await Tag.create({ name: normalized, usageCount: 1 })
    }
    tagIds.push(tag._id)
  }
  return tagIds
}

async function run() {
  try {
    await connectDB()

    let user = await User.findOne({ username: 'demo_artist' })
    if (!user) {
      user = await User.create({
        email: 'demo_artist@example.com',
        password: 'demo123456',
        username: 'demo_artist',
        displayName: 'Demo Artist',
        bio: 'Seeded sample user for artwork detail testing.',
      })
    }

    let upsertedCount = 0
    for (const artworkData of sampleArtworks) {
      const tagIds = await ensureTagIds(artworkData.tags)
      await Artwork.findOneAndUpdate(
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
            viewCount: artworkData.viewCount,
            likeCount: artworkData.likeCount,
            bookmarkCount: artworkData.bookmarkCount,
            commentCount: artworkData.commentCount,
          },
        },
        { upsert: true, returnDocument: 'after' }
      )
      upsertedCount += 1
    }

    const artworks = await Artwork.find({ user: user._id }).sort({ createdAt: -1 }).limit(5)
    console.log(`Seed complete. Upserted artworks: ${upsertedCount}`)
    console.log('Sample artwork ids:')
    for (const artwork of artworks) {
      console.log(`- ${artwork._id} | ${artwork.title}`)
    }
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
