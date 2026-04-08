const express = require('express');
const router = express.Router();
const {
    createLike,
    getMyLikes,
    getLikeStatus,
    toggleLike,
    deleteLike
} = require('../controllers/like.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .post(protect, createLike)
    .get(protect, getMyLikes);

router.route('/toggle')
    .post(protect, toggleLike);

router.route('/status/:artworkId')
    .get(protect, getLikeStatus);

router.route('/:id')
    .delete(protect, deleteLike);

module.exports = router;