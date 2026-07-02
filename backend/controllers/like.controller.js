const Like = require('../models/Like');
const { createReactionController } = require('../utils/reactionController');

const ctrl = createReactionController({
  Model: Like,
  modelName: 'Like',
  counterField: 'likeCount',
  notifType: 'like',
  verb: 'liked',
  responseIs: 'isLiked',
  responseId: 'likeId',
  responseItems: 'likes'
});

module.exports = {
  createLike: ctrl.create,
  getMyLikes: ctrl.getMy,
  getLikeStatus: ctrl.getStatus,
  toggleLike: ctrl.toggle,
  deleteLike: ctrl.delete
};
