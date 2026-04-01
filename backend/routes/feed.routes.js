const express = require('express');
const router = express.Router();
const { getFeed, getRankings } = require('../controllers/feed.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getFeed);
router.get('/rankings', getRankings);

module.exports = router;
