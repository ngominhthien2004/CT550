const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const BrowseHistory = require('../models/BrowseHistory');
const Artwork = require('../models/Artwork');

const TAG_WEIGHTS = {
  bookmark: 3,
  like: 2,
  browse: 1,
};

/**
 * Compute user's preferred tags based on bookmark/like/browse history.
 * Returns array of { tag: { _id, name }, weight } sorted descending.
 */
async function getPreferredTags(userId, limit = 10) {
  const tagWeightMap = new Map();

  // Helper: process artworks from a source and add tag weights
  async function processSource(Model, weight) {
    const entries = await Model.find({ user: userId })
      .populate({
        path: 'artwork',
        select: 'tags',
        populate: { path: 'tags', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    for (const entry of entries) {
      if (!entry.artwork || !entry.artwork.tags) continue;
      for (const tag of entry.artwork.tags) {
        const tagId = tag._id.toString();
        const existing = tagWeightMap.get(tagId) || { tag, weight: 0 };
        existing.weight += weight;
        tagWeightMap.set(tagId, existing);
      }
    }
  }

  await processSource(Bookmark, TAG_WEIGHTS.bookmark);
  await processSource(Like, TAG_WEIGHTS.like);
  await processSource(BrowseHistory, TAG_WEIGHTS.browse);

  // Sort by weight descending, return top N
  return Array.from(tagWeightMap.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

/**
 * Get personalized "For You" artworks for a user.
 * Returns paginated array of artworks scored by tag affinity + engagement.
 */
async function getForYouArtworks(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const preferredTags = await getPreferredTags(userId, 10);
  const preferredTagIds = preferredTags.map((t) => t.tag._id);

  if (preferredTagIds.length === 0) {
    // Fallback: return recent popular artworks
    return Artwork.find({ isHidden: { $ne: true } })
      .populate('user', 'username displayName avatar')
      .populate('tags', 'name')
      .sort({ likeCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Get user's own artworks, bookmarked, and liked IDs to exclude
  const [userArtworks, bookmarks, likes] = await Promise.all([
    Artwork.find({ user: userId }).select('_id').lean(),
    Bookmark.find({ user: userId }).select('artwork').lean(),
    Like.find({ user: userId }).select('artwork').lean(),
  ]);

  const excludeIds = new Set([
    ...userArtworks.map((a) => a._id.toString()),
    ...bookmarks.map((b) => b.artwork.toString()),
    ...likes.map((l) => l.artwork.toString()),
  ]);

  // Find artworks matching preferred tags
  const filter = {
    _id: { $nin: [...excludeIds].map((id) => id) },
    tags: { $in: preferredTagIds },
    isHidden: { $ne: true },
  };

  const [artworks, total] = await Promise.all([
    Artwork.find(filter)
      .populate('user', 'username displayName avatar')
      .populate('tags', 'name')
      .lean(),
    Artwork.countDocuments(filter),
  ]);

  // Score each artwork by tag overlap + engagement
  const tagWeightMap = new Map(preferredTags.map((t) => [t.tag._id.toString(), t.weight]));

  const scored = artworks.map((artwork) => {
    let tagScore = 0;
    if (artwork.tags) {
      for (const tag of artwork.tags) {
        tagScore += tagWeightMap.get(tag._id.toString()) || 0;
      }
    }
    // Engagement bonus: normalize by max possible
    const engagementScore =
      (artwork.likeCount || 0) * 2 +
      (artwork.bookmarkCount || 0) * 3 +
      (artwork.viewCount || 0) * 0.1;
    const totalScore = tagScore * 5 + engagementScore;
    return { ...artwork, _score: totalScore };
  });

  // Sort by score descending, apply pagination
  scored.sort((a, b) => b._score - a._score);
  const paginated = scored.slice(skip, skip + limit);

  return {
    artworks: paginated,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

module.exports = { getPreferredTags, getForYouArtworks };
