const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
	getUserProfile,
	updateUserProfile,
	deleteUserCover,
	followUser,
	unfollowUser,
	getFollowers,
	getFollowing,
	getFollowStatus,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getBlockStatus,
	getAdminOverview,
	getAdminUsers,
	updateAdminUser,
	deleteAdminUser,
    searchUsers,
    getUserSeries,
    postPresence,
    getPresenceHandler,
    getCreatorReactions,
    getBrowseHistory,
    clearBrowseHistory,
} = require('../controllers/user.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
    destination(req, file, cb) {
        try {
            const userId = req.user?._id?.toString() || 'unknown';
            const uploadDir = path.join('public', 'uploads', userId, 'profile');
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        );
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only!'));
    }
}

const upload = multer({
    storage,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8MB limit
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

router.get('/admin/overview', protect, admin, getAdminOverview);
router.get('/admin/list', protect, admin, getAdminUsers);
router.patch('/admin/:id', protect, admin, updateAdminUser);
router.delete('/admin/:id', protect, admin, deleteAdminUser);

router.get('/search', searchUsers);
router.get('/dashboard/reactions', protect, getCreatorReactions);
router.get('/:id/series', getUserSeries);

router.get('/:id/profile', getUserProfile);
router.put('/profile', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateUserProfile);
router.delete('/profile/cover', protect, deleteUserCover);
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/follow-status', protect, getFollowStatus);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.get('/:id/block-status', protect, getBlockStatus);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

router.get('/me/history', protect, getBrowseHistory);
router.delete('/me/history', protect, clearBrowseHistory);

router.post('/:id/presence', protect, postPresence);
router.get('/:id/presence', protect, getPresenceHandler);

module.exports = router;
