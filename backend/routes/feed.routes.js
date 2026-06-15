const express = require('express');
const router = express.Router();
const { getFeed, getRankings, getDiscovery, getForYou } = require('../controllers/feed.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getFeed);
router.get('/discovery', getDiscovery);
router.get('/rankings', getRankings);
router.get('/for-you', protect, getForYou);

module.exports = router;
