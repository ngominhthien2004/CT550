const express = require('express');
const router = express.Router();
const { getFeed, getRankings, getDiscovery } = require('../controllers/feed.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getFeed);
router.get('/discovery', getDiscovery);
router.get('/rankings', getRankings);

module.exports = router;
