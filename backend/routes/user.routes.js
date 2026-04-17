const express = require('express');
const router = express.Router();
const {
	getUserProfile,
	updateUserProfile,
	followUser,
	unfollowUser,
	getFollowers,
	getFollowing,
	getFollowStatus,
	getAdminOverview,
	getAdminUsers,
	updateAdminUser,
} = require('../controllers/user.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

router.get('/admin/overview', protect, admin, getAdminOverview);
router.get('/admin/list', protect, admin, getAdminUsers);
router.patch('/admin/:id', protect, admin, updateAdminUser);

router.get('/:id/profile', getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/follow-status', protect, getFollowStatus);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
