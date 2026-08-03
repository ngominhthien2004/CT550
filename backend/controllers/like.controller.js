const Like = require('../models/Like');
const Artwork = require('../models/Artwork');
const { createReactionController } = require('../utils/reactionController');
const { delByPrefix } = require('../utils/cache');

async function invalidateSeriesDetailCache(artworkId) {
  try {
    const artwork = await Artwork.findById(artworkId).select('series user');
    if (artwork?.series) {
      delByPrefix(`series:detail:${artwork.series.toString()}`);
    }
    if (artwork?.user) {
      delByPrefix(`user:series:${artwork.user.toString()}`);
    }
  } catch {
    // Cache invalidation is best-effort; don't fail the reaction request.
  }
}

const ctrl = createReactionController({
  Model: Like,
  modelName: 'Like',
  counterField: 'likeCount',
  notifType: 'like',
  verb: 'liked',
  responseIs: 'isLiked',
  responseId: 'likeId',
  responseItems: 'likes',
  onCounterChanged: invalidateSeriesDetailCache
});

/**
 * Batch like-status endpoint.
 * GET /api/likes/status?ids=id1,id2,...
 * Returns { statuses: { [artworkId]: { isLiked: true/false, likeId: "..." } } }
 */
const getBatchLikeStatus = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids || typeof ids !== 'string' || !ids.trim()) {
      res.status(400);
      return next(new Error('ids query parameter is required'));
    }

    const artworkIds = ids.split(',').map((id) => id.trim()).filter(Boolean);

    if (artworkIds.length === 0) {
      res.status(400);
      return next(new Error('ids must contain at least one artwork ID'));
    }

    if (artworkIds.length > 100) {
      res.status(400);
      return next(new Error('Maximum 100 IDs per request'));
    }

    const likes = await Like.find({
      user: req.user._id,
      artwork: { $in: artworkIds }
    }).select('artwork');

    const statusMap = {};
    for (const id of artworkIds) {
      statusMap[id] = { isLiked: false, likeId: null };
    }
    for (const like of likes) {
      const artworkId = like.artwork.toString();
      statusMap[artworkId] = { isLiked: true, likeId: like._id.toString() };
    }

    res.json({ statuses: statusMap });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLike: ctrl.create,
  getMyLikes: ctrl.getMy,
  getLikeStatus: ctrl.getStatus,
  getBatchLikeStatus,
  toggleLike: ctrl.toggle,
  deleteLike: ctrl.delete
};
