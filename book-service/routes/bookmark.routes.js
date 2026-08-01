const express = require('express');
const router = express.Router();
const {
  toggleBookmark,
  getBookmarkStatus,
  getBookmarkStatuses,
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

// NOTE: `/status` must be registered BEFORE `/status/:bookId` so the batch
// route is matched before the single-id route.
router.route('/status')
  .get(getBookmarkStatuses);

router.route('/status/:bookId')
  .get(getBookmarkStatus);

router.route('/:id')
  .delete(deleteBookmark);

module.exports = router;
