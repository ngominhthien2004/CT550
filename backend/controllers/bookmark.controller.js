const Bookmark = require('../models/Bookmark');
const { createReactionController } = require('../utils/reactionController');

const ctrl = createReactionController({
  Model: Bookmark,
  modelName: 'Bookmark',
  counterField: 'bookmarkCount',
  notifType: 'bookmark',
  verb: 'bookmarked',
  responseIs: 'isBookmarked',
  responseId: 'bookmarkId',
  responseItems: 'bookmarks',
  extraCreateFields: (req) => ({ folder: req.body.folder || 'default' })
});

module.exports = {
  createBookmark: ctrl.create,
  getMyBookmarks: ctrl.getMy,
  getBookmarkStatus: ctrl.getStatus,
  toggleBookmark: ctrl.toggle,
  deleteBookmark: ctrl.delete
};
