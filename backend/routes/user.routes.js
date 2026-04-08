const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, followUser, unfollowUser, getFollowers, getFollowing, getFollowStatus } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/:id/profile', getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/follow-status', protect, getFollowStatus);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
