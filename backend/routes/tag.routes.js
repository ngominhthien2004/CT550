const express = require('express');
const { listTags, getTagDetail, getPopularSuggestions, getPopularIllustSuggestions, adminListTags, adminUpdateTag, adminMergeTags, adminDeleteTag } = require('../controllers/tag.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', listTags);
// Popular suggestions (must be before /:tagName)
router.get('/popular-suggestions', getPopularSuggestions);
router.get('/popular-illust-suggestions', getPopularIllustSuggestions);
router.get('/:tagName', getTagDetail);

// Admin routes
router.get('/admin/list', protect, admin, adminListTags);
router.put('/admin/:id', protect, admin, adminUpdateTag);
router.post('/admin/merge', protect, admin, adminMergeTags);
router.delete('/admin/:id', protect, admin, adminDeleteTag);

module.exports = router;
