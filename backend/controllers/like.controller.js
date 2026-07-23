const Like = require('../models/Like');
const Artwork = require('../models/Artwork');
const { createReactionController } = require('../utils/reactionController');
const { delByPrefix } = require('../utils/cache');

async function invalidateSeriesDetailCache(artworkId) {
  try {
    const artwork = await Artwork.findById(artworkId).select('series');
    if (artwork?.series) {
      delByPrefix(`series:detail:${artwork.series.toString()}`);
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

module.exports = {
  createLike: ctrl.create,
  getMyLikes: ctrl.getMy,
  getLikeStatus: ctrl.getStatus,
  toggleLike: ctrl.toggle,
  deleteLike: ctrl.delete
};
