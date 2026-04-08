const express = require('express');
const router = express.Router();
const {
    createBookmark,
    getMyBookmarks,
    getBookmarkStatus,
    toggleBookmark,
    deleteBookmark
} = require('../controllers/bookmark.controller');
const { protect } = require('../middlewares/auth.middleware');

router.route('/')
    .post(protect, createBookmark)
    .get(protect, getMyBookmarks);

router.route('/toggle')
    .post(protect, toggleBookmark);

router.route('/status/:artworkId')
    .get(protect, getBookmarkStatus);

router.route('/:id')
    .delete(protect, deleteBookmark);

module.exports = router;
