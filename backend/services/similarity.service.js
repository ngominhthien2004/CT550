const mongoose = require('mongoose');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const BrowseHistory = require('../models/BrowseHistory');
const Artwork = require('../models/Artwork');

const INTERACTION_WEIGHTS = {
  bookmark: 3,
  like: 2,
  browse: 0.5,
};

/**
 * Get all users who interacted with an artwork, with their accumulated weight.
 * @param {ObjectId} artworkId
 * @returns {Promise<Map<string, number>>} Map<userId, totalWeight>
 */
async function getInteractionUsers(artworkId) {
  const userWeightMap = new Map();

  const [likes, bookmarks, browseHistory] = await Promise.all([
    Like.find({ artwork: artworkId }).select('user').lean(),
    Bookmark.find({ artwork: artworkId }).select('user').lean(),
    BrowseHistory.find({ artwork: artworkId }).select('user').lean(),
  ]);

  for (const doc of likes) {
    const uid = doc.user.toString();
    userWeightMap.set(uid, (userWeightMap.get(uid) || 0) + INTERACTION_WEIGHTS.like);
  }

  for (const doc of bookmarks) {
    const uid = doc.user.toString();
    userWeightMap.set(uid, (userWeightMap.get(uid) || 0) + INTERACTION_WEIGHTS.bookmark);
  }

  for (const doc of browseHistory) {
    const uid = doc.user.toString();
    userWeightMap.set(uid, (userWeightMap.get(uid) || 0) + INTERACTION_WEIGHTS.browse);
  }

  return userWeightMap;
}

/**
 * Get all artworks a user interacted with, with their accumulated weight.
 * @param {ObjectId} userId
 * @returns {Promise<Map<string, number>>} Map<artworkId, totalWeight>
 */
async function getUserInteractions(userId) {
  const artworkWeightMap = new Map();

  const [likes, bookmarks, browseHistory] = await Promise.all([
    Like.find({ user: userId }).select('artwork').lean(),
    Bookmark.find({ user: userId }).select('artwork').lean(),
    BrowseHistory.find({ user: userId }).select('artwork').lean(),
  ]);

  for (const doc of likes) {
    const aid = doc.artwork.toString();
    artworkWeightMap.set(aid, (artworkWeightMap.get(aid) || 0) + INTERACTION_WEIGHTS.like);
  }

  for (const doc of bookmarks) {
    const aid = doc.artwork.toString();
    artworkWeightMap.set(aid, (artworkWeightMap.get(aid) || 0) + INTERACTION_WEIGHTS.bookmark);
  }

  for (const doc of browseHistory) {
    const aid = doc.artwork.toString();
    artworkWeightMap.set(aid, (artworkWeightMap.get(aid) || 0) + INTERACTION_WEIGHTS.browse);
  }

  return artworkWeightMap;
}

/**
 * Fallback similarity: tag-based matching when an artwork lacks interaction data.
 * Finds artworks of the same type sharing at least one tag, sorted by common tag count
 * then by likeCount descending.
 * @param {ObjectId} artworkId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getFallbackSimilarArtworks(artworkId, limit) {
  const artwork = await Artwork.findById(artworkId).select('tags type').lean();

  if (!artwork || !artwork.tags || artwork.tags.length === 0) {
    return [];
  }

  const tagIds = artwork.tags;

  const candidates = await Artwork.find({
    _id: { $ne: artworkId },
    type: artwork.type,
    tags: { $in: tagIds },
    isHidden: { $ne: true },
  })
    .populate('user', 'username displayName avatar')
    .populate('tags', 'name')
    .lean();

  const tagIdSet = new Set(tagIds.map((t) => t.toString()));

  candidates.sort((a, b) => {
    const aCommon = a.tags
      ? a.tags.filter((t) => tagIdSet.has(t._id.toString())).length
      : 0;
    const bCommon = b.tags
      ? b.tags.filter((t) => tagIdSet.has(t._id.toString())).length
      : 0;
    if (bCommon !== aCommon) return bCommon - aCommon;
    return (b.likeCount || 0) - (a.likeCount || 0);
  });

  return candidates.slice(0, limit);
}

/**
 * Item-to-Item Collaborative Filtering using weighted Jaccard similarity.
 *
 * Finds artworks similar to the given artwork by analyzing co-occurrence
 * of user interactions (likes, bookmarks, browse history).
 *
 * Falls back to tag-based similarity when fewer than 3 unique users
 * have interacted with the source artwork.
 *
 * @param {string} artworkId - The source artwork ID
 * @param {number} [limit=24] - Maximum number of similar artworks to return
 * @returns {Promise<Array>} Array of artwork objects populated with 'user' and 'tags'
 */
async function getSimilarArtworks(artworkId, limit = 24) {
  if (!artworkId) {
    return [];
  }

  const targetId =
    typeof artworkId === 'string'
      ? new mongoose.Types.ObjectId(artworkId)
      : artworkId;

  // Fast fail: artwork must exist
  const artwork = await Artwork.findById(targetId).select('_id').lean();
  if (!artwork) {
    return [];
  }

  // Step 1: Get interaction users for the source artwork
  const interactionUsers = await getInteractionUsers(targetId);

  // Step 2: Fallback when interaction data is too sparse
  if (interactionUsers.size < 3) {
    return getFallbackSimilarArtworks(targetId, limit);
  }

  // Compute total weight of the source artwork (denominator component)
  let totalWeightA = 0;
  for (const weight of interactionUsers.values()) {
    totalWeightA += weight;
  }

  const userIds = [...interactionUsers.keys()];

  // Step 3: Batch-fetch all interactions from users who interacted with source artwork
  const [allLikes, allBookmarks, allBrowses] = await Promise.all([
    Like.find({ user: { $in: userIds } }).select('user artwork').lean(),
    Bookmark.find({ user: { $in: userIds } }).select('user artwork').lean(),
    BrowseHistory.find({ user: { $in: userIds } }).select('user artwork').lean(),
  ]);

  // Build co-occurrence map: artworkId -> sum of shared interaction weights
  const coOccurrenceMap = new Map();

  for (const doc of allLikes) {
    const otherId = doc.artwork.toString();
    if (otherId === artworkId) continue;
    coOccurrenceMap.set(
      otherId,
      (coOccurrenceMap.get(otherId) || 0) + INTERACTION_WEIGHTS.like
    );
  }

  for (const doc of allBookmarks) {
    const otherId = doc.artwork.toString();
    if (otherId === artworkId) continue;
    coOccurrenceMap.set(
      otherId,
      (coOccurrenceMap.get(otherId) || 0) + INTERACTION_WEIGHTS.bookmark
    );
  }

  for (const doc of allBrowses) {
    const otherId = doc.artwork.toString();
    if (otherId === artworkId) continue;
    coOccurrenceMap.set(
      otherId,
      (coOccurrenceMap.get(otherId) || 0) + INTERACTION_WEIGHTS.browse
    );
  }

  // If no co-occurring artworks found, fallback
  if (coOccurrenceMap.size === 0) {
    return getFallbackSimilarArtworks(targetId, limit);
  }

  // Step 4: Get total interaction weights for all candidate artworks
  const candidateIds = [...coOccurrenceMap.keys()].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const [likeAgg, bookmarkAgg, browseAgg] = await Promise.all([
    Like.aggregate([
      { $match: { artwork: { $in: candidateIds } } },
      { $group: { _id: '$artwork', count: { $sum: 1 } } },
    ]),
    Bookmark.aggregate([
      { $match: { artwork: { $in: candidateIds } } },
      { $group: { _id: '$artwork', count: { $sum: 1 } } },
    ]),
    BrowseHistory.aggregate([
      { $match: { artwork: { $in: candidateIds } } },
      { $group: { _id: '$artwork', count: { $sum: 1 } } },
    ]),
  ]);

  const totalWeightMap = new Map();

  for (const entry of likeAgg) {
    const id = entry._id.toString();
    totalWeightMap.set(
      id,
      (totalWeightMap.get(id) || 0) + INTERACTION_WEIGHTS.like * entry.count
    );
  }

  for (const entry of bookmarkAgg) {
    const id = entry._id.toString();
    totalWeightMap.set(
      id,
      (totalWeightMap.get(id) || 0) + INTERACTION_WEIGHTS.bookmark * entry.count
    );
  }

  for (const entry of browseAgg) {
    const id = entry._id.toString();
    totalWeightMap.set(
      id,
      (totalWeightMap.get(id) || 0) + INTERACTION_WEIGHTS.browse * entry.count
    );
  }

  // Step 5: Calculate weighted Jaccard similarity for each candidate
  const scored = [];
  for (const [candidateId, sharedWeight] of coOccurrenceMap) {
    const weightB = totalWeightMap.get(candidateId) || 0;
    const denominator = totalWeightA + weightB - sharedWeight;
    if (denominator <= 0) continue;
    scored.push({ artworkId: candidateId, score: sharedWeight / denominator });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Step 6: Take top results
  const topResults = scored.slice(0, limit);
  const topIds = topResults.map((r) => new mongoose.Types.ObjectId(r.artworkId));

  // Step 7: Fetch and populate artwork documents
  const similarArtworks = await Artwork.find({
    _id: { $in: topIds },
    isHidden: { $ne: true },
  })
    .populate('user', 'username displayName avatar')
    .populate('tags', 'name')
    .lean();

  // Preserve the score-based ordering
  const scoreMap = new Map(topResults.map((r) => [r.artworkId, r.score]));
  similarArtworks.sort(
    (a, b) =>
      (scoreMap.get(b._id.toString()) || 0) -
      (scoreMap.get(a._id.toString()) || 0)
  );

  return similarArtworks;
}

module.exports = { getSimilarArtworks };
