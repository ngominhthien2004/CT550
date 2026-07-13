const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getOverviewStats,
  getTrends,
  getArtworkBreakdown,
  getFollowerGrowth,
  getArtworkAnalytics,
} = require('../controllers/analytics.controller');

// All analytics routes require authentication
router.get('/overview', protect, getOverviewStats);
router.get('/trends', protect, getTrends);
router.get('/breakdown', protect, getArtworkBreakdown);
router.get('/followers', protect, getFollowerGrowth);
router.get('/artwork/:id', protect, getArtworkAnalytics);

module.exports = router;
