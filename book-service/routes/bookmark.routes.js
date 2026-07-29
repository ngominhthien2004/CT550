const express = require('express');
const router = express.Router();
const {
  toggleBookmark,
  getBookmarkStatus,
  getMyBookmarks,
  deleteBookmark,
} = require('../controllers/bookmark.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getMyBookmarks);

router.route('/toggle')
  .post(toggleBookmark);

router.route('/status/:bookId')
  .get(getBookmarkStatus);

router.route('/:id')
  .delete(deleteBookmark);

module.exports = router;
