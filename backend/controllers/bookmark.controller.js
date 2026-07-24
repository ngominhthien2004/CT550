const Bookmark = require('../models/Bookmark');
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
  Model: Bookmark,
  modelName: 'Bookmark',
  counterField: 'bookmarkCount',
  notifType: 'bookmark',
  verb: 'bookmarked',
  responseIs: 'isBookmarked',
  responseId: 'bookmarkId',
  responseItems: 'bookmarks',
  extraCreateFields: (req) => ({ folder: req.body.folder || 'default' }),
  onCounterChanged: invalidateSeriesDetailCache
});

module.exports = {
  createBookmark: ctrl.create,
  getMyBookmarks: ctrl.getMy,
  getBookmarkStatus: ctrl.getStatus,
  toggleBookmark: ctrl.toggle,
  deleteBookmark: ctrl.delete
};
